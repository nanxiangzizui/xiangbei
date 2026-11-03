#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build, verify and hash the static release for 《向北》 v1.0.0.

Usage:
  python project/tools/release.py stage
  python project/tools/release.py zip
  python project/tools/release.py verify
  python project/tools/release.py hash
  python project/tools/release.py all

Only Python 3 standard library is used. The runtime directory and the
offline package contain exactly the same runtime files; the package adds
README.txt. No development files, docs, evidence, tools or fonts are copied.
"""
from __future__ import annotations

import argparse
import hashlib
import re
import shutil
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PROJECT = ROOT / "project"
DIST = ROOT / "dist"
VERSION = "1.0.0"
SITE = DIST / "site"
PKG = DIST / f"xiangbei-v{VERSION}"
ZIP = DIST / f"xiangbei-v{VERSION}-offline.zip"
PDF = DIST / "design-note.pdf"
SUMS = DIST / "SHA256SUMS.txt"

RUNTIME = [
    "index.html",
    "style.css",
    "engine.js",
    "story.js",
    "minigames.js",
    "art.js",
]
SITE_EXTRA = ["CREDITS.txt", "design-note.pdf"]
PKG_EXTRA = ["CREDITS.txt", "README.txt", "design-note.pdf"]
ALLOWED_SITE = set(RUNTIME + SITE_EXTRA)
ALLOWED_PKG = set(RUNTIME + PKG_EXTRA)
FONT_SUFFIXES = {".ttf", ".otf", ".woff", ".woff2"}
TEXT_SUFFIXES = {".html", ".css", ".js", ".txt"}
FIXED_DATE = (2026, 11, 3, 0, 0, 0)

README_TEXT = f"""《向北》 v{VERSION} 离线版

一块门板，两万五千里。
16 岁红军文书，从于都走到吴起。

【怎么打开】
双击 index.html 开始。推荐用本地静态服务打开（例如在解压目录运行
python -m http.server 8080，再在浏览器打开本机 8080 端口）。
file:// 下 Edge 可存档；若浏览器禁用 localStorage，游戏会提示
“本局无法存档”，仍可继续，不白屏。

【操作】
点击 / 空格 / Enter 推进；选项按 1–3；Esc 暂停。
设置可调文字速度、字号、音量、静音、减少动效、跳读已读。
手机请横屏。四个小游戏均可用鼠标 / 触摸 / 键盘单手完成。

【内容】
七段：于都、湘江、遵义、金沙江、泸定、草地、吴起·点名。
四个小游戏：门板、弃物、渡船、攀索；七张史实图鉴；
结局为点名 + 数字 + 五张精神卡。没有 Game Over，失败只改变代价。
历史结局不可改：湘江必败、遵义必开、泸定必夺。

【存档】
存档键 xiangbei.save.v1；刷新可恢复。清档：标题页菜单或
浏览器开发者工具删除该键。隐私模式可能无法存档，会有提示。

【制作名单 / 字体 / 素材】
制作：刘子政（程序、剧本、美术、测试、史料核对）。
完整名单见 CREDITS.txt；字体授权与素材说明见 CREDITS.txt 与
docs/credits.md（仅仓库）。
本版不打包字体：标题/正文只读系统 local()，缺失回退
Microsoft YaHei / Songti SC / SimSun；包内字体 0 字节。
图像为 Canvas/SVG 程序化版画；声音为 Web Audio 实时合成；
不使用外部图片、音频、字体或 CDN。

【虚构声明】
满崽、老周、何指导员、张老幺、飞毛腿、灶王、冬生等均为虚构人物，
非史料人物。本连 104 → 19 为虚构设定；历史数字以 docs/sources.md 为准。
"""


def fail(message: str) -> None:
    print("× " + message)
    raise SystemExit(1)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def files_under(directory: Path) -> list[Path]:
    return sorted(p for p in directory.rglob("*") if p.is_file())


def check_runtime_sources() -> None:
    for name in RUNTIME + ["CREDITS.txt"]:
        source = PROJECT / name
        if not source.is_file():
            fail(f"缺 project/{name}")
    if not PDF.is_file():
        fail("缺 dist/design-note.pdf；先用 Edge/Playwright 生成一页 A4 PDF")
    if PDF.stat().st_size > 2 * 1024 * 1024:
        fail(f"design-note.pdf 超过 2MB：{PDF.stat().st_size} 字节")


def stage() -> None:
    check_runtime_sources()
    for directory in (SITE, PKG):
        if directory.exists():
            shutil.rmtree(directory)
        directory.mkdir(parents=True)

    for name in RUNTIME + ["CREDITS.txt"]:
        shutil.copy2(PROJECT / name, SITE / name)
        shutil.copy2(PROJECT / name, PKG / name)
    shutil.copy2(PDF, SITE / "design-note.pdf")
    shutil.copy2(PDF, PKG / "design-note.pdf")
    (PKG / "README.txt").write_text(README_TEXT, encoding="utf-8", newline="\n")

    site_size = sum(p.stat().st_size for p in files_under(SITE))
    pkg_size = sum(p.stat().st_size for p in files_under(PKG))
    print(f"stage OK v{VERSION}: site {len(files_under(SITE))} files / {site_size} B; "
          f"package {len(files_under(PKG))} files / {pkg_size} B")


def zip_package() -> None:
    if not PKG.is_dir():
        fail("缺 dist/xiangbei-v1.0.0；先运行 stage")
    entries = [PKG / "README.txt"] + [PKG / name for name in RUNTIME + ["CREDITS.txt", "design-note.pdf"]]
    missing = [p for p in entries if not p.is_file()]
    if missing:
        fail("包内缺文件：" + "、".join(p.name for p in missing))

    with zipfile.ZipFile(ZIP, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        root = zipfile.ZipInfo(f"xiangbei-v{VERSION}/", date_time=FIXED_DATE)
        root.create_system = 0
        root.external_attr = (0o40755 << 16) | 0x10
        archive.writestr(root, b"")
        for source in sorted(entries, key=lambda p: p.name):
            info = zipfile.ZipInfo(f"xiangbei-v{VERSION}/{source.name}", date_time=FIXED_DATE)
            info.create_system = 0
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, source.read_bytes())

    print(f"zip OK {ZIP.name}: {len(entries) + 1} entries / {ZIP.stat().st_size} B / "
          f"{sha256(ZIP)[:16]}…")


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def verify() -> None:
    check_runtime_sources()
    if not SITE.is_dir() or not PKG.is_dir():
        fail("缺 dist/site 或 dist/xiangbei-v1.0.0；先运行 stage")
    if not ZIP.is_file():
        fail("缺离线 ZIP；先运行 zip")

    for directory, allowed in ((SITE, ALLOWED_SITE), (PKG, ALLOWED_PKG)):
        for path in files_under(directory):
            relative = path.relative_to(directory)
            if path.parent != directory:
                fail(f"{directory.name} 出现嵌套目录：{relative}")
            if path.name not in allowed:
                fail(f"{directory.name} 含白名单外文件：{path.name}")
            if path.suffix.lower() in FONT_SUFFIXES:
                fail(f"{directory.name} 含字体文件：{path.name}")

    for name in RUNTIME + ["CREDITS.txt", "design-note.pdf"]:
        if not (SITE / name).is_file():
            fail(f"site 缺 {name}")
        if not (PKG / name).is_file():
            fail(f"package 缺 {name}")
    if not (PKG / "README.txt").is_file():
        fail("package 缺 README.txt")

    for name in RUNTIME + ["CREDITS.txt", "design-note.pdf"]:
        if (SITE / name).read_bytes() != (PKG / name).read_bytes():
            fail(f"site 与 package 的 {name} 不一致")

    index = read_text(SITE / "index.html")
    if 'href="./CREDITS.txt"' not in index:
        fail("index.html 缺 ./CREDITS.txt 链接")
    if "http://" in index or "https://" in index:
        fail("index.html 含外部 URL")

    referenced = set(re.findall(r'(?:href|src)="(\./[^"]+)"', index))
    for reference in sorted(referenced):
        target = SITE / reference[2:]
        if not target.is_file():
            fail(f"index.html 引用不存在：{reference}")

    for path in files_under(SITE) + files_under(PKG):
        if path.suffix.lower() in TEXT_SUFFIXES:
            text = read_text(path)
            if re.search(r"https?://", text):
                fail(f"{path.name} 含外部 URL")
    if b"http://" in PDF.read_bytes() or b"https://" in PDF.read_bytes():
        # PDF 的 XMP/语言标记可能含 URI；不作为运行时外链，但记录检查结果。
        print("note: PDF 二进制含 http(s) 字样（仅文档元数据，不是运行时请求）")

    credits = read_text(SITE / "CREDITS.txt")
    credits_bytes = len(credits.encode("utf-8"))
    if credits_bytes > 2048:
        fail(f"CREDITS.txt 超过 2KB：{credits_bytes} 字节")
    if "刘子政" not in credits:
        fail("CREDITS.txt 缺制作署名")
    if "虚构人物" not in credits:
        fail("CREDITS.txt 缺虚构声明")
    if re.search(r"<[^>]*姓名|TODO|待填|待补|<老师>|<姓名>", credits):
        fail("CREDITS.txt 仍有占位")

    pdf_raw = PDF.read_bytes().decode("latin1", errors="ignore")
    page_count = re.search(r"/Type\s*/Pages[\s\S]{0,400}?/Count\s+(\d+)", pdf_raw)
    if not page_count or page_count.group(1) != "1":
        fail("design-note.pdf 不是 1 页")
    if "/ToUnicode" not in pdf_raw:
        fail("design-note.pdf 缺 ToUnicode，文字不可复制")
    if PDF.stat().st_size > 2 * 1024 * 1024:
        fail("design-note.pdf 超过 2MB")

    with zipfile.ZipFile(ZIP) as archive:
        bad = archive.testzip()
        if bad:
            fail("ZIP 损坏：" + bad)
        names = archive.namelist()
        expected = {f"xiangbei-v{VERSION}/"} | {
            f"xiangbei-v{VERSION}/{name}" for name in RUNTIME + PKG_EXTRA
        }
        if set(names) != expected:
            fail("ZIP 条目与白名单不一致：" + "、".join(sorted(set(names) ^ expected)))
        for name in RUNTIME + PKG_EXTRA:
            member = f"xiangbei-v{VERSION}/{name}"
            if archive.read(member) != (PKG / name).read_bytes():
                fail(f"ZIP 内 {name} 与 package 不一致")

    print(f"verify OK: site {len(files_under(SITE))} files, package {len(files_under(PKG))} files, "
          f"ZIP {len(names)} entries, PDF {PDF.stat().st_size} B, CREDITS {credits_bytes} B")


def hash_release() -> None:
    targets = [PDF, ZIP] + files_under(SITE) + files_under(PKG)
    lines = []
    for path in targets:
        relative = path.relative_to(ROOT).as_posix()
        lines.append(f"{sha256(path)}  {relative}")
    SUMS.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    print(f"hash OK: {len(lines)} files -> {SUMS.relative_to(ROOT).as_posix()}")


def main() -> None:
    parser = argparse.ArgumentParser(description="《向北》v1.0.0 release builder")
    parser.add_argument("command", nargs="?", default="all",
                        choices=["stage", "zip", "verify", "hash", "all"])
    args = parser.parse_args()
    if args.command == "stage":
        stage()
    elif args.command == "zip":
        zip_package()
    elif args.command == "verify":
        verify()
    elif args.command == "hash":
        hash_release()
    else:
        stage()
        zip_package()
        verify()
        hash_release()


if __name__ == "__main__":
    main()
