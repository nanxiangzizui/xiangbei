(function (XB) {
  "use strict";

  // 步骤二：程序化版画。单画布承载标题 / 地图 / VN 的全部背景；
  // 规格见 docs/visual-system.md §6–§7，坐标只在 1280×720 设计空间里写。
  var W = 1280;
  var H = 720;
  var MAX_RENDER_SCALE = 2;

  var SCENES = ["title", "map", "yudu_river", "yudu_night"];

  // 令牌缺失时才用：正常路径读 style.css 的 :root 变量
  var FALLBACK_PALETTE = {
    paper: "#E8E1D0",
    paperHi: "#F1EBDD",
    paperLo: "#DCD2BC",
    ink: "#1A1714",
    inkMuted: "#5C564D",
    cinnabar: "#A8322D",
    ember: "#D97A2B",
    night: "#1B2430",
    nightDeep: "#10161D"
  };

  var TOKEN_NAMES = {
    paper: "--paper",
    paperHi: "--paper-hi",
    paperLo: "--paper-lo",
    ink: "--ink",
    inkMuted: "--ink-muted",
    cinnabar: "--cinnabar",
    ember: "--ember",
    night: "--night",
    nightDeep: "--night-deep"
  };

  var currentCanvas = null;
  var displayScale = 1;
  var palette = null;

  // 场景 id → FNV-1a → mulberry32：同场景每次重绘走同一组随机数，便于对比/回归
  function hashSeed(text) {
    var hash = 0x811c9dc5;
    for (var i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
  }

  function mulberry32(seed) {
    var state = seed >>> 0;
    return function () {
      state = (state + 0x6d2b79f5) >>> 0;
      var t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function rng(seed) {
    return mulberry32(hashSeed(String(seed)));
  }

  function readPalette() {
    var style = null;
    try {
      style = window.getComputedStyle(window.document.documentElement);
    } catch (err) {
      // 拿不到计算样式（老浏览器 / 非活动文档）：退回常量板，画面仍可用
      console.warn("art: 读不到计算样式，改用内置色板", err);
      style = null;
    }
    var result = {};
    Object.keys(TOKEN_NAMES).forEach(function (key) {
      var value = style ? style.getPropertyValue(TOKEN_NAMES[key]).trim() : "";
      result[key] = value || FALLBACK_PALETTE[key];
    });
    return result;
  }

  function backingScale() {
    var dpr = window.devicePixelRatio || 1;
    return Math.min(Math.max(displayScale * dpr, 1), MAX_RENDER_SCALE);
  }

  function applySize(canvas) {
    var scale = backingScale();
    var width = Math.round(W * scale);
    var height = Math.round(H * scale);
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    canvas.dataset.renderScale = String(Math.round(scale * 100) / 100);
    return scale;
  }

  function mount(canvas) {
    if (!canvas) throw new Error("art.mount 需要画布元素");
    currentCanvas = canvas;
    applySize(canvas);
  }

  function resize(scale) {
    displayScale = Math.min(Math.max(Number(scale) || 1, 0.1), 3);
    if (!currentCanvas) return;
    applySize(currentCanvas);
    var sceneId = currentCanvas.dataset.scene;
    if (sceneId) paint(currentCanvas, sceneId);
  }

  function paint(canvas, sceneId) {
    if (!canvas) return false;
    if (SCENES.indexOf(sceneId) === -1) {
      console.warn("art.paint: 未知场景 " + sceneId);
      return false;
    }
    var ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("art.paint: 画布不可用");
      return false;
    }
    if (!palette) palette = readPalette();
    var scale = applySize(canvas);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var random = rng(sceneId);
    try {
      PAINTERS[sceneId](ctx, random, palette);
    } catch (err) {
      console.error("art.paint 失败: " + sceneId, err);
      return false;
    }
    ctx.globalAlpha = 1;
    canvas.dataset.scene = sceneId;
    return true;
  }

  // ---------- 通用笔触 ----------

  // 山形：峰顶折线 + 落到 bottomY 的实心块，峰高在 [low, high] 间取
  function ridge(ctx, random, opts) {
    var startX = opts.startX;
    var endX = opts.endX;
    var baseY = opts.baseY;
    var bottomY = typeof opts.bottomY === "number" ? opts.bottomY : H;
    var steps = opts.steps;
    var span = endX - startX;
    // 山脊：峰不等距、两坡不对称、鞍部带一点起伏。
    // 等距三角峰一眼就是程序图（像折线），不像木刻里的山。
    var points = [[startX, baseY]];
    var x = startX;
    var guard = 0;
    while (x < endX && guard < steps * 3) {
      guard += 1;
      var segW = (span / steps) * (0.55 + random() * 0.9);
      var peakX = Math.min(x + segW * (0.3 + random() * 0.4), endX);
      var peakY = opts.low + random() * (opts.high - opts.low);
      var shoulderY = Math.min(peakY + (opts.high - opts.low) * (0.2 + random() * 0.3), baseY);
      points.push([peakX, peakY]);
      x = Math.min(x + segW, endX);
      points.push([x, shoulderY]);
    }
    if (points[points.length - 1][0] < endX) points.push([endX, baseY]);
    ctx.save();
    ctx.globalAlpha = opts.alpha;
    ctx.fillStyle = opts.color;
    ctx.beginPath();
    ctx.moveTo(startX, bottomY);
    for (var i = 0; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
    ctx.lineTo(endX, bottomY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function fillRect(ctx, x, y, w, h, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  // ---------- 场景：标题 ----------

  function paintTitle(ctx, random, p) {
    // 透明底：纸纹由 #stage 承担
    ridge(ctx, random, { startX: 300, endX: 1280, baseY: 660, steps: 7, low: 430, high: 500, color: p.ink, alpha: 0.12 });
    ridge(ctx, random, { startX: 420, endX: 1280, baseY: 670, steps: 6, low: 480, high: 540, color: p.ink, alpha: 0.2 });
    ridge(ctx, random, { startX: 560, endX: 1280, baseY: 680, steps: 5, low: 520, high: 580, color: p.ink, alpha: 0.3 });
    ridge(ctx, random, { startX: 780, endX: 1280, baseY: 660, steps: 4, low: 600, high: 640, color: p.ink, alpha: 0.45 });

    // 芦苇：18 根，从 700 长到 560 一带；左侧留给标题，不压字
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = p.ink;
    ctx.lineWidth = 1.5;
    for (var i = 0; i < 18; i += 1) {
      var x = 380 + random() * 180;
      var topY = 560 + random() * 90;
      var lean = (random() - 0.5) * 26;
      ctx.beginPath();
      ctx.moveTo(x, 700);
      ctx.quadraticCurveTo(x + lean * 0.4, (700 + topY) / 2, x + lean, topY);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(x + lean, topY, 2.4, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    paintPlank(ctx, random, p);
  }

  // 门板：760,120,360×480，rotate 1.5°；木纹 + 9 道刻痕 + 两铰链 + 一道裂缝
  function paintPlank(ctx, random, p) {
    var x = 760;
    var y = 120;
    var w = 360;
    var h = 480;
    var cx = x + w / 2;
    var cy = y + h / 2;

    ctx.save();
    // 投影
    ctx.save();
    ctx.translate(10, 12);
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = p.ink;
    ctx.fillRect(x, y, w, h);
    ctx.restore();

    ctx.translate(cx, cy);
    ctx.rotate((1.5 * Math.PI) / 180);
    ctx.translate(-cx, -cy);

    ctx.globalAlpha = 0.94;
    ctx.fillStyle = p.paperHi;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = p.ink;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

    // 木纹：竖向长线，疏密不等
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = p.ink;
    ctx.lineWidth = 1;
    var count = 14;
    for (var i = 1; i < count; i += 1) {
      var gx = x + (w / count) * i + (random() - 0.5) * 10;
      var wobble = (random() - 0.5) * 18;
      ctx.beginPath();
      ctx.moveTo(gx, y + 6);
      ctx.bezierCurveTo(gx + wobble, y + h * 0.35, gx - wobble, y + h * 0.7, gx + wobble * 0.5, y + h - 6);
      ctx.stroke();
    }
    ctx.restore();

    // 9 道刻痕：门板左侧，对应走过的站
    ctx.save();
    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = p.ink;
    ctx.lineWidth = 2;
    for (var m = 0; m < 9; m += 1) {
      var markY = 160 + m * 35;
      var markLen = 12 + random() * 10;
      ctx.beginPath();
      ctx.moveTo(x + 24, markY);
      ctx.lineTo(x + 24 + markLen, markY + (random() - 0.5) * 2);
      ctx.stroke();
    }
    ctx.restore();

    // 两处铰链
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = p.ink;
    [140, 400].forEach(function (hingeY) {
      ctx.fillRect(x + 6, y + hingeY, 44, 16);
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = p.paperHi;
      [14, 34].forEach(function (dx) {
        ctx.beginPath();
        ctx.arc(x + 6 + dx, y + hingeY + 8, 2.4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    });
    ctx.restore();

    // 一道裂缝
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = p.ink;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 268, y + 8);
    var crackY = y + 8;
    while (crackY < y + h - 8) {
      crackY += 26 + random() * 14;
      ctx.lineTo(x + 268 + (random() - 0.5) * 16, Math.min(crackY, y + h - 8));
    }
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  // ---------- 场景：地图 ----------

  function paintMap(ctx, random, p) {
    // 等高线：6 圈手绘感的椭圆，只压右下
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = p.ink;
    ctx.lineWidth = 1;
    for (var i = 0; i < 6; i += 1) {
      var rx = 200 + i * 72 + random() * 10;
      var ry = 110 + i * 44 + random() * 8;
      ctx.beginPath();
      ctx.ellipse(640, 360, rx, ry, -0.18, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    ridge(ctx, random, { startX: 600, endX: 1280, baseY: 720, steps: 5, low: 560, high: 620, color: p.ink, alpha: 0.1 });
    ridge(ctx, random, { startX: 760, endX: 1280, baseY: 720, steps: 4, low: 620, high: 670, color: p.ink, alpha: 0.18 });
  }

  // ---------- 场景：于都河（夜渡） ----------

  function paintRiver(ctx, random, p) {
    var sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, p.night);
    sky.addColorStop(1, p.nightDeep);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // 远岸
    ridge(ctx, random, { startX: 0, endX: 1280, baseY: 470, bottomY: 470, steps: 9, low: 420, high: 470, color: p.ink, alpha: 0.55 });

    // 浮桥：门板桥面 470–520。桥面是一条横带，下面才是短桩和水影；
    // 桩距必须不等——等距会读成栅栏，不像人连夜搭起来的桥。
    fillRect(ctx, 0, 470, W, 10, p.ink, 0.62);
    fillRect(ctx, 0, 470, W, 2, p.paper, 0.22);
    fillRect(ctx, 0, 512, W, 9, p.ink, 0.36);
    ctx.save();
    ctx.strokeStyle = p.ink;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    var postX = 4;
    while (postX < W) {
      postX += 26 + random() * 22;
      ctx.beginPath();
      ctx.moveTo(postX, 478);
      ctx.lineTo(postX + (random() - 0.5) * 3, 514);
      ctx.stroke();
    }
    ctx.restore();
    // 桥面板块缝：门板一块块拼起来
    ctx.save();
    ctx.strokeStyle = p.ink;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1;
    for (var seam = 30; seam < W; seam += 62 + random() * 40) {
      ctx.beginPath();
      ctx.moveTo(seam, 470);
      ctx.lineTo(seam, 480);
      ctx.stroke();
    }
    ctx.restore();

    // 江面白线：18–24 条
    var lines = 18 + Math.floor(random() * 7);
    ctx.save();
    ctx.strokeStyle = p.paper;
    ctx.lineWidth = 1.1;
    for (var i = 0; i < lines; i += 1) {
      var y = 528 + random() * 186;
      var x0 = random() * 1100;
      var len = 60 + random() * 180;
      ctx.globalAlpha = 0.12 + random() * 0.1;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.quadraticCurveTo(x0 + len * 0.5, y - 3, x0 + len, y + 1);
      ctx.stroke();
    }
    ctx.restore();

    // 雾带：三层叠画压出软边（Canvas 没模糊，只能靠透明度叠出过渡）
    [300, 372, 446].forEach(function (fogY) {
      for (var k = 0; k < 3; k += 1) {
        ctx.save();
        ctx.fillStyle = p.paper;
        ctx.globalAlpha = 0.02;
        ctx.beginPath();
        ctx.ellipse(640 + (random() - 0.5) * 60, fogY + k * 6, 620 - k * 90, 46 - k * 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    // 火把：8 个，从村口排到水边。杆 + 焰 + 水面倒影，缺一样就只是一个亮点
    for (var t = 0; t < 8; t += 1) {
      var tx = 180 + t * ((1080 - 180) / 7) + (random() - 0.5) * 16;
      var ty = 450 + random() * 12;
      ctx.save();
      ctx.fillStyle = p.ink;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(tx - 1, ty + 4, 2, 18);
      ctx.restore();
      ctx.save();
      ctx.fillStyle = p.ember;
      ctx.globalAlpha = 0.12;
      ctx.beginPath();
      ctx.arc(tx, ty, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(tx, ty - 13);
      ctx.quadraticCurveTo(tx + 6, ty - 2, tx, ty + 5);
      ctx.quadraticCurveTo(tx - 6, ty - 2, tx, ty - 13);
      ctx.fill();
      ctx.globalAlpha = 0.16;
      ctx.beginPath();
      ctx.ellipse(tx, ty + 34, 3, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 顶部底片：章节名区
    fillRect(ctx, 0, 0, W, 90, p.night, 0.55);
  }

  // ---------- 场景：于都夜（村口） ----------

  function paintNight(ctx, random, p) {
    var sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, p.nightDeep);
    sky.addColorStop(1, p.night);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // 星点 ≤24
    var stars = 12 + Math.floor(random() * 13);
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = p.paper;
    for (var i = 0; i < stars; i += 1) {
      ctx.beginPath();
      ctx.arc(random() * W, 80 + random() * 220, 1 + random() * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 屋脊：铺满整幅。原来到 x=900 就断，右侧留一条生硬的竖缝，读起来像贴图没铺满
    ridge(ctx, random, { startX: 0, endX: W, baseY: 600, steps: 7, low: 506, high: 566, color: p.ink, alpha: 0.65 });

    // 一堵墙兜住暖窗：窗浮在夜色里会像一块掉下来的色块
    fillRect(ctx, 900, 512, 104, 120, p.ink, 0.72);
    ctx.save();
    ctx.fillStyle = p.ink;
    ctx.globalAlpha = 0.72;
    ctx.beginPath();
    ctx.moveTo(888, 516);
    ctx.lineTo(952, 476);
    ctx.lineTo(1016, 516);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 树影
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = p.ink;
    ctx.fillRect(1040, 520, 10, 140);
    [0, 1, 2].forEach(function (k) {
      ctx.beginPath();
      ctx.ellipse(1045 + (k - 1) * 26, 470 + k * 12, 54, 40, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.beginPath();
    ctx.ellipse(1000, 500, 30, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 暖窗：光晕压小到 26，太大就成了一团黄雾
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = p.ember;
    ctx.beginPath();
    ctx.arc(938, 532, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.85;
    ctx.fillRect(930, 520, 16, 20);
    ctx.restore();

    fillRect(ctx, 0, 0, W, 90, p.night, 0.55);
  }

  var PAINTERS = {
    title: paintTitle,
    map: paintMap,
    yudu_river: paintRiver,
    yudu_night: paintNight
  };

  XB.art = {
    SCENES: SCENES,
    mount: mount,
    paint: paint,
    resize: resize,
    rng: rng
  };
})(window.XB = window.XB || {});
