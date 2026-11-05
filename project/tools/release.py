#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build, verify and hash the static release for 《向北》 v1.1.1.

Usage:
  python project/tools/release.py stage
  python project/tools/release.py zip
  python project/tools/release.py verify
  python project/tools/release.py hash
  python project/tools/release.py all

Only Python 3 standard library is used. The site and the offline package
contain the same runtime files; the package adds README.txt. Assets are
copied recursively so images, fonts and audio work offline.
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
VERSION = "1.1.1"
SITE = DIST / "site"
PKG = DIST / f"xiangbei-v{VERSION}"
ZIP = DIST / f"xiangbei-v{VERSION}-offline.zip"
PDF = DIST / "design-note.pdf"
SUMS = DIST / "SHA256SUMS.txt"
ASSETS = PROJECT / "assets"

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
TEXT_SUFFIXES = {".html", ".css", ".js", ".txt"}
FIXED_DATE = (2026, 11, 5, 0, 0, 0)

REQUIRED_ASSETS = [
    "assets/backgrounds/plate_title.jpg",
    "assets/backgrounds/plate_yudu.jpg",
    "assets/backgrounds/plate_xiangjiang.jpg",
    "assets/backgrounds/plate_xiangjiang_map.jpg",
    "assets/backgrounds/plate_zunyi_hall.jpg",
    "assets/backgrounds/plate_zunyi_street.jpg",
    "assets/backgrounds/plate_luding.jpg",
    "assets/backgrounds/plate_luding_after.jpg",
    "assets/backgrounds/plate_jinsha.jpg",
    "assets/backgrounds/plate_grass.jpg",
    "assets/backgrounds/plate_grass_dawn.jpg",
    "assets/backgrounds/plate_wuqi.jpg",
    "assets/backgrounds/webp/plate_title.webp",
    "assets/backgrounds/webp/plate_yudu.webp",
    "assets/backgrounds/webp/plate_xiangjiang.webp",
    "assets/backgrounds/webp/plate_xiangjiang_map.webp",
    "assets/backgrounds/webp/plate_zunyi_hall.webp",
    "assets/backgrounds/webp/plate_zunyi_street.webp",
    "assets/backgrounds/webp/plate_luding.webp",
    "assets/backgrounds/webp/plate_luding_after.webp",
    "assets/backgrounds/webp/plate_jinsha.webp",
    "assets/backgrounds/webp/plate_grass.webp",
    "assets/backgrounds/webp/plate_grass_dawn.webp",
    "assets/backgrounds/webp/plate_wuqi.webp",
    "assets/backgrounds/placeholders/plate_title.webp",
    "assets/backgrounds/placeholders/plate_yudu.webp",
    "assets/backgrounds/placeholders/plate_xiangjiang.webp",
    "assets/backgrounds/placeholders/plate_xiangjiang_map.webp",
    "assets/backgrounds/placeholders/plate_zunyi_hall.webp",
    "assets/backgrounds/placeholders/plate_zunyi_street.webp",
    "assets/backgrounds/placeholders/plate_luding.webp",
    "assets/backgrounds/placeholders/plate_luding_after.webp",
    "assets/backgrounds/placeholders/plate_jinsha.webp",
    "assets/backgrounds/placeholders/plate_grass.webp",
    "assets/backgrounds/placeholders/plate_grass_dawn.webp",
    "assets/backgrounds/placeholders/plate_wuqi.webp",
    "assets/backgrounds/thumbs/codex_yudu.jpg",
    "assets/backgrounds/thumbs/codex_xiangjiang.jpg",
    "assets/backgrounds/thumbs/codex_zunyi.jpg",
    "assets/backgrounds/thumbs/codex_jinsha.jpg",
    "assets/backgrounds/thumbs/codex_luding.jpg",
    "assets/backgrounds/thumbs/codex_grass.jpg",
    "assets/backgrounds/thumbs/codex_wuqi.jpg",
    "assets/fonts/zhuque-game.woff2",
    "assets/fonts/smiley-game.woff2",
    "assets/fonts/OFL-Zhuque.txt",
    "assets/fonts/OFL-Smiley.txt",
    "assets/audio/ambience/wind_loop.mp3",
    "assets/audio/ambience/river_loop.mp3",
    "assets/audio/ambience/rain_loop.mp3",
    "assets/audio/ambience/birds_loop.mp3",
    "assets/audio/ambience/fire_loop.mp3",
    "assets/audio/music/shangri_river.mp3",
    "assets/audio/music/oriental.mp3",
    "assets/audio/music/a_bitter_hope.mp3",
    "assets/audio/music/visions_of_freedom.mp3",
    "assets/audio/music/sunrise_dynasty.mp3",
    "assets/audio/music/final_heros_monologue.mp3",
    "assets/audio/music/misty_mountains.mp3",
    "assets/audio/music/frozen_orchard.mp3",
    "assets/audio/music/LICENSE-A-Bitter-Hope.pdf",
    "assets/audio/music/README-A-Bitter-Hope.pdf",
]

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
设置可调文字速度、字号、总音量、配乐音量、环境音量、静音、
减少动效、跳读已读。暂停菜单可查看花名册。
手机请横屏。四个小游戏均可用鼠标 / 触摸 / 键盘单手完成。

【内容】
七段：于都、湘江、遵义、金沙江、泸定、草地、吴起·点名。
四个小游戏：门板、弃物、渡船、攀索；七张史实图鉴；
照片章首卡带日期与地点；结局为点名 + 数字 + 五张精神卡。
没有 Game Over，失败只改变代价。
历史结局不可改：湘江必败、遵义必开、泸定必夺。

【存档】
存档键 xiangbei.save.v1；刷新可恢复。清档：标题页菜单或
浏览器开发者工具删除该键。隐私模式可能无法存档，会有提示。

【制作名单 / 字体 / 素材】
制作：刘子政（程序、剧本、美术、测试、史料核对）。
完整名单与素材授权见 CREDITS.txt。
本版随包两份 OFL 1.1 字体子集：得意黑（大标题）与朱雀仿宋
（正文、章节、图鉴）；授权全文在 assets/fonts/。
场景图为 Wikimedia Commons 的 CC/PD 影像，经双色调版画化；
标题插画由豆包 Seedream 生成，人物与场景为虚构，非史料现场。
声音为 5 条 CC0 环境录音 + 8 首 CC0/CC BY 现代配乐 + Web Audio
合成床；没有 1930 年代历史录音，不冒充史料。
照片与插画年代说明见游戏内图鉴与 CREDITS.txt。

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


def asset_paths() -> list[Path]:
    return files_under(ASSETS)


def asset_rel(path: Path) -> str:
    return path.relative_to(PROJECT).as_posix()


def check_sources() -> None:
    for name in RUNTIME + ["CREDITS.txt"]:
        if not (PROJECT / name).is_file():
            fail(f"缺 project/{name}")
    for relative in REQUIRED_ASSETS:
        if not (PROJECT / relative).is_file():
            fail(f"缺 project/{relative}")
    if not PDF.is_file():
        fail("缺 dist/design-note.pdf；先用 Edge/Playwright 生成一页 A4 PDF")
    if PDF.stat().st_size > 2 * 1024 * 1024:
        fail(f"design-note.pdf 超过 2MB：{PDF.stat().st_size} 字节")


def copy_tree(source: Path, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)


def stage() -> None:
    check_sources()
    for directory in (SITE, PKG):
        if directory.exists():
            shutil.rmtree(directory)
        directory.mkdir(parents=True)

    for name in RUNTIME + ["CREDITS.txt"]:
        copy_tree(PROJECT / name, SITE / name)
        copy_tree(PROJECT / name, PKG / name)
    for source in asset_paths():
        relative = asset_rel(source)
        copy_tree(source, SITE / relative)
        copy_tree(source, PKG / relative)
    shutil.copy2(PDF, SITE / "design-note.pdf")
    shutil.copy2(PDF, PKG / "design-note.pdf")
    (PKG / "README.txt").write_text(README_TEXT, encoding="utf-8", newline="\n")

    site_size = sum(p.stat().st_size for p in files_under(SITE))
    pkg_size = sum(p.stat().st_size for p in files_under(PKG))
    print(f"stage OK v{VERSION}: site {len(files_under(SITE))} files / {site_size} B; "
          f"package {len(files_under(PKG))} files / {pkg_size} B")


def zip_package() -> None:
    if not PKG.is_dir():
        fail(f"缺 {PKG.name}；先运行 stage")
    entries = [PKG / "README.txt"] + [PKG / name for name in RUNTIME + ["CREDITS.txt", "design-note.pdf"]]
    entries += [PKG / asset_rel(p) for p in asset_paths()]
    missing = [p for p in entries if not p.is_file()]
    if missing:
        fail("包内缺文件：" + "、".join(str(p.relative_to(PKG)) for p in missing))

    with zipfile.ZipFile(ZIP, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        root = zipfile.ZipInfo(f"xiangbei-v{VERSION}/", date_time=FIXED_DATE)
        root.create_system = 0
        root.external_attr = (0o40755 << 16) | 0x10
        archive.writestr(root, b"")
        for source in sorted(entries, key=lambda p: p.relative_to(PKG).as_posix()):
            relative = source.relative_to(PKG).as_posix()
            info = zipfile.ZipInfo(f"xiangbei-v{VERSION}/{relative}", date_time=FIXED_DATE)
            info.create_system = 0
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, source.read_bytes())

    print(f"zip OK {ZIP.name}: {len(entries) + 1} entries / {ZIP.stat().st_size} B / "
          f"{sha256(ZIP)[:16]}…")


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def expected_files() -> tuple[set[str], set[str]]:
    top_site = set(RUNTIME + SITE_EXTRA)
    top_pkg = set(RUNTIME + PKG_EXTRA)
    assets = {asset_rel(p) for p in asset_paths()}
    return top_site | assets, top_pkg | assets


def verify() -> None:
    check_sources()
    if not SITE.is_dir() or not PKG.is_dir():
        fail(f"缺 dist/site 或 {PKG.name}；先运行 stage")
    if not ZIP.is_file():
        fail("缺离线 ZIP；先运行 zip")

    expected_site, expected_pkg = expected_files()
    actual_site = {p.relative_to(SITE).as_posix() for p in files_under(SITE)}
    actual_pkg = {p.relative_to(PKG).as_posix() for p in files_under(PKG)}
    if actual_site != expected_site:
        fail("site 文件清单不一致：" + "、".join(sorted(actual_site ^ expected_site)))
    if actual_pkg != expected_pkg:
        fail("package 文件清单不一致：" + "、".join(sorted(actual_pkg ^ expected_pkg)))

    for relative in sorted(expected_site):
        if (SITE / relative).read_bytes() != (PKG / relative).read_bytes():
            fail(f"site 与 package 的 {relative} 不一致")

    index = read_text(SITE / "index.html")
    if 'href="./CREDITS.txt"' not in index:
        fail("index.html 缺 ./CREDITS.txt 链接")
    if "http://" in index or "https://" in index:
        fail("index.html 含外部 URL")
    for reference in sorted(set(re.findall(r'(?:href|src)="(\./[^"]+)"', index))):
        if not (SITE / reference[2:]).is_file():
            fail(f"index.html 引用不存在：{reference}")

    # 只允许制作名单写授权来源 URL；运行时代码与 README 不得联网。
    for path in files_under(SITE) + files_under(PKG):
        if path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        if path.name == "CREDITS.txt" or (path.parent.name == "fonts" and path.name.startswith("OFL-")):
            continue
        if re.search(r"https?://", read_text(path)):
            fail(f"{path.relative_to(ROOT)} 含外部 URL")

    credits = read_text(SITE / "CREDITS.txt")
    credits_bytes = len(credits.encode("utf-8"))
    if credits_bytes > 16384:
        fail(f"CREDITS.txt 超过 16KB：{credits_bytes} 字节")
    if "刘子政" not in credits:
        fail("CREDITS.txt 缺制作署名")
    if "虚构人物" not in credits:
        fail("CREDITS.txt 缺虚构声明")
    if "OFL" not in credits or "Wikimedia Commons" not in credits:
        fail("CREDITS.txt 缺字体或图片授权")
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
        expected_zip = {f"xiangbei-v{VERSION}/"} | {
            f"xiangbei-v{VERSION}/{relative}" for relative in expected_pkg
        }
        if set(names) != expected_zip:
            fail("ZIP 条目与白名单不一致：" + "、".join(sorted(set(names) ^ expected_zip)))
        for relative in sorted(expected_pkg):
            member = f"xiangbei-v{VERSION}/{relative}"
            if archive.read(member) != (PKG / relative).read_bytes():
                fail(f"ZIP 内 {relative} 与 package 不一致")

    print(f"verify OK: site {len(actual_site)} files, package {len(actual_pkg)} files, "
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
    parser = argparse.ArgumentParser(description=f"《向北》v{VERSION} release builder")
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
