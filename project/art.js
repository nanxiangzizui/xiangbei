(function (XB) {
  "use strict";

  // 步骤二：程序化版画。单画布承载标题 / 地图 / VN 的全部背景；
  // 规格见 docs/visual-system.md §6–§7，坐标只在 1280×720 设计空间里写。
  var W = 1280;
  var H = 720;
  var MAX_RENDER_SCALE = 2;

  var SCENES = [
    "title", "map", "yudu_river", "yudu_night",
    "xiangjiang_ford", "xiangjiang_dawn", "xiangjiang_map",
    "zunyi_hall", "zunyi_street",
    "jinsha_river", "jinsha_night", "luding_bridge", "luding_after",
    "grass_marsh", "grass_dawn", "wuqi_dawn", "wuqi_wall"
  ];

  // 章节底图。照片先做双色调、颗粒与暗角，再在这里按场景套一层
  // 极淡的夜色/晨光；加载失败时回落到下面的程序化版画。
  var PLATE_BY_SCENE = {
    title: "./assets/backgrounds/plate_title.jpg",
    yudu_river: "./assets/backgrounds/plate_yudu.jpg",
    yudu_night: "./assets/backgrounds/plate_yudu.jpg",
    xiangjiang_ford: "./assets/backgrounds/plate_xiangjiang.jpg",
    xiangjiang_dawn: "./assets/backgrounds/plate_xiangjiang.jpg",
    xiangjiang_map: "./assets/backgrounds/plate_xiangjiang_map.jpg",
    zunyi_hall: "./assets/backgrounds/plate_zunyi_hall.jpg",
    zunyi_street: "./assets/backgrounds/plate_zunyi_street.jpg",
    jinsha_river: "./assets/backgrounds/plate_jinsha.jpg",
    jinsha_night: "./assets/backgrounds/plate_jinsha.jpg",
    luding_bridge: "./assets/backgrounds/plate_luding.jpg",
    luding_after: "./assets/backgrounds/plate_luding_after.jpg",
    grass_marsh: "./assets/backgrounds/plate_grass.jpg",
    grass_dawn: "./assets/backgrounds/plate_grass_dawn.jpg",
    wuqi_dawn: "./assets/backgrounds/plate_wuqi.jpg",
    wuqi_wall: "./assets/backgrounds/plate_wuqi.jpg"
  };

  var PLATE_TINT = {
    yudu_night: "rgba(8, 12, 20, 0.30)",
    jinsha_night: "rgba(8, 12, 20, 0.34)",
    xiangjiang_dawn: "rgba(255, 214, 170, 0.07)",
    grass_dawn: "rgba(232, 222, 202, 0.05)",
    wuqi_dawn: "rgba(255, 208, 152, 0.08)",
    luding_after: "rgba(240, 226, 198, 0.04)"
  };

  var plateImages = {};

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
    var plate = getPlate(sceneId);
    try {
      if (plate && plate.__ready) drawPlate(ctx, plate, sceneId);
      else PAINTERS[sceneId](ctx, random, palette);
    } catch (err) {
      console.error("art.paint 失败: " + sceneId, err);
      return false;
    }
    ctx.globalAlpha = 1;
    canvas.dataset.scene = sceneId;
    canvas.classList.toggle("is-photo", !!(plate && plate.__ready));
    return true;
  }

  // 只加载一次；加载完成后重绘当前场景，避免先看到程序图再突然换图。
  function getPlate(sceneId) {
    var src = PLATE_BY_SCENE[sceneId];
    if (!src) return null;
    var image = plateImages[src];
    if (image) return image;
    image = new Image();
    image.decoding = "async";
    image.onload = function () {
      image.__ready = true;
      if (currentCanvas && currentCanvas.dataset.scene) {
        paint(currentCanvas, currentCanvas.dataset.scene);
      }
    };
    image.onerror = function () {
      console.warn("art: 背景图加载失败，回落到版画 " + src);
    };
    image.src = src;
    plateImages[src] = image;
    return image;
  }

  // 章首卡/下一章提前取图；重复调用只返回缓存，不重复请求。
  function preload(sceneId) {
    if (!PLATE_BY_SCENE[sceneId]) return null;
    return getPlate(sceneId);
  }

  // 照片按 cover 铺满 1280×720；双色调已在生成阶段完成，这里只补时段色。
  function drawPlate(ctx, image, sceneId) {
    var sw = image.naturalWidth;
    var sh = image.naturalHeight;
    var cover = Math.max(W / sw, H / sh);
    var dw = sw * cover;
    var dh = sh * cover;
    ctx.drawImage(image, (W - dw) / 2, (H - dh) / 2, dw, dh);
    var tint = PLATE_TINT[sceneId];
    if (tint) {
      ctx.save();
      ctx.fillStyle = tint;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
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


  // 江面白线：同一场景内疏密、长短、透明度都取随机，避免“排线”感
  function waterLines(ctx, random, opts) {
    var count = opts.count;
    ctx.save();
    ctx.strokeStyle = opts.color;
    ctx.lineWidth = 1.1;
    for (var i = 0; i < count; i += 1) {
      var y = opts.y0 + random() * (opts.y1 - opts.y0);
      var x0 = random() * (W - 160);
      var len = opts.minLen + random() * (opts.maxLen - opts.minLen);
      ctx.globalAlpha = opts.alphaMin + random() * (opts.alphaMax - opts.alphaMin);
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.quadraticCurveTo(x0 + len * 0.5, y - 3, x0 + len, y + 1);
      ctx.stroke();
    }
    ctx.restore();
  }

  function mistBand(ctx, random, opts) {
    var count = opts.count || 3;
    for (var k = 0; k < count; k += 1) {
      ctx.save();
      ctx.fillStyle = opts.color;
      ctx.globalAlpha = (opts.alpha || 0.03) * (1 - k * 0.18);
      ctx.beginPath();
      ctx.ellipse(640 + (random() - 0.5) * 80, opts.y + k * 8, (opts.width || 620) - k * 80,
        (opts.height || 46) - k * 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function fireDots(ctx, random, opts) {
    for (var i = 0; i < opts.count; i += 1) {
      var fx = opts.x0 + (opts.x1 - opts.x0) * (opts.count === 1 ? 0.5 : i / (opts.count - 1)) + (random() - 0.5) * 18;
      var fy = opts.y + (random() - 0.5) * 10;
      ctx.save();
      ctx.fillStyle = opts.color;
      ctx.globalAlpha = 0.12;
      ctx.beginPath();
      ctx.arc(fx, fy, 18 + random() * 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(fx, fy - 10 - random() * 4);
      ctx.quadraticCurveTo(fx + 5, fy - 2, fx, fy + 4);
      ctx.quadraticCurveTo(fx - 5, fy - 2, fx, fy - 10 - random() * 4);
      ctx.fill();
      ctx.globalAlpha = 0.14;
      ctx.beginPath();
      ctx.ellipse(fx, fy + 24, 3, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function chainLines(ctx, random, opts) {
    var count = opts.count;
    ctx.save();
    ctx.strokeStyle = opts.color;
    ctx.lineWidth = opts.width || 1.2;
    for (var i = 0; i < count; i += 1) {
      var y = opts.y + i * opts.gap;
      var sag = opts.sag + random() * 10;
      ctx.globalAlpha = opts.alpha * (0.85 + random() * 0.3);
      ctx.beginPath();
      ctx.moveTo(opts.x0, y);
      ctx.quadraticCurveTo((opts.x0 + opts.x1) / 2, y + sag, opts.x1, y);
      ctx.stroke();
      // 吊索：每 90–120px 一根，长短不齐更像真的铁索桥
      for (var x = opts.x0 + 60; x < opts.x1 - 30; x += 96 + random() * 24) {
        var t = (x - opts.x0) / (opts.x1 - opts.x0);
        var lineY = y + sag * 4 * t * (1 - t);
        ctx.globalAlpha = 0.18 + random() * 0.12;
        ctx.beginPath();
        ctx.moveTo(x, lineY);
        ctx.lineTo(x, lineY + 8 + random() * 6);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function loessWall(ctx, random, p, opts) {
    fillRect(ctx, opts.x, opts.y, opts.w, opts.h, p.paperLo, opts.alpha || 0.9);
    ctx.save();
    ctx.strokeStyle = p.ink;
    for (var i = 0; i < 12; i += 1) {
      ctx.globalAlpha = 0.04 + random() * 0.05;
      ctx.lineWidth = 1;
      var y = opts.y + 12 + random() * (opts.h - 20);
      ctx.beginPath();
      ctx.moveTo(opts.x + 6, y);
      ctx.lineTo(opts.x + opts.w - 8, y + (random() - 0.5) * 6);
      ctx.stroke();
    }
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


  // ---------- 场景：湘江（夜渡 / 拂晓） ----------

  function paintXiangjiangFord(ctx, random, p) {
    var sky = ctx.createLinearGradient(0, 0, 0, 520);
    sky.addColorStop(0, p.nightDeep);
    sky.addColorStop(1, p.night);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ridge(ctx, random, { startX: 0, endX: W, baseY: 466, bottomY: 466, steps: 9, low: 400, high: 448, color: p.ink, alpha: 0.55 });
    fillRect(ctx, 0, 466, W, 254, p.nightDeep, 0.88);
    waterLines(ctx, random, { y0: 520, y1: 706, count: 30, color: p.paper, alphaMin: 0.08, alphaMax: 0.2, minLen: 50, maxLen: 200 });

    // 浮桥：门板横铺，桥面比水面亮一档，远看是一条能走人的线
    fillRect(ctx, 0, 466, W, 14, p.ink, 0.95);
    fillRect(ctx, 0, 468, W, 2, p.paper, 0.22);
    ctx.save();
    ctx.strokeStyle = p.ink;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1;
    for (var seam = 20; seam < W; seam += 48 + random() * 38) {
      ctx.beginPath();
      ctx.moveTo(seam, 466);
      ctx.lineTo(seam, 480);
      ctx.stroke();
    }
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = p.ink;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.55;
    var postX = 10;
    while (postX < W) {
      postX += 30 + random() * 26;
      ctx.beginPath();
      ctx.moveTo(postX, 480);
      ctx.lineTo(postX + (random() - 0.5) * 4, 520);
      ctx.stroke();
    }
    ctx.restore();

    // 桥上的人：只画头肩，前后错落；不画脸
    ctx.save();
    ctx.fillStyle = p.ink;
    for (var i = 0; i < 64; i += 1) {
      var fx = 12 + i * 19.6 + (random() - 0.5) * 10;
      var fy = 452 + random() * 8;
      var hh = 12 + random() * 8;
      ctx.globalAlpha = 0.55 + random() * 0.25;
      ctx.beginPath();
      ctx.arc(fx, fy - hh, 3.2 + random() * 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(fx - 5, fy - hh + 2);
      ctx.lineTo(fx + 5, fy - hh + 2);
      ctx.lineTo(fx + 4, fy + 5);
      ctx.lineTo(fx - 4, fy + 5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    fireDots(ctx, random, { count: 5, x0: 140, x1: 1140, y: 452, color: p.ember });
    mistBand(ctx, random, { y: 510, width: 660, height: 48, alpha: 0.035, color: p.paper });
    mistBand(ctx, random, { y: 580, width: 760, height: 60, alpha: 0.025, color: p.paper });
    fillRect(ctx, 0, 0, W, 92, p.nightDeep, 0.5);
  }

  function paintXiangjiangDawn(ctx, random, p) {
    var sky = ctx.createLinearGradient(0, 0, 0, 470);
    sky.addColorStop(0, p.paperLo);
    sky.addColorStop(1, p.paperHi);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    fillRect(ctx, 0, 460, W, 260, p.inkMuted, 0.16);
    ridge(ctx, random, { startX: 0, endX: W, baseY: 462, bottomY: 462, steps: 10, low: 410, high: 448, color: p.ink, alpha: 0.3 });
    waterLines(ctx, random, { y0: 486, y1: 700, count: 34, color: p.inkMuted, alphaMin: 0.12, alphaMax: 0.3, minLen: 60, maxLen: 230 });

    // 断桥：两截桥面探进江心，断口参差
    ctx.save();
    ctx.fillStyle = p.ink;
    ctx.globalAlpha = 0.72;
    ctx.fillRect(0, 468, 392, 12);
    ctx.fillRect(906, 468, W - 906, 12);
    ctx.beginPath();
    ctx.moveTo(392, 468);
    ctx.lineTo(356, 476);
    ctx.lineTo(392, 480);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(906, 468);
    ctx.lineTo(942, 476);
    ctx.lineTo(906, 480);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = p.ink;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 2;
    [70, 150, 238, 316, 988, 1070, 1160, 1232].forEach(function (x) {
      ctx.beginPath();
      ctx.moveTo(x, 480);
      ctx.lineTo(x + (random() - 0.5) * 5, 526 + random() * 12);
      ctx.stroke();
    });
    ctx.restore();

    // 江面漂物：断板、木箱、斗笠，都是一小截暗色
    ctx.save();
    for (var i = 0; i < 24; i += 1) {
      var dx = random() * W;
      var dy = 520 + random() * 170;
      ctx.globalAlpha = 0.3 + random() * 0.3;
      ctx.fillStyle = p.ink;
      ctx.fillRect(dx, dy, 8 + random() * 26, 2 + random() * 4);
    }
    ctx.restore();
    mistBand(ctx, random, { y: 470, width: 700, height: 52, alpha: 0.05, color: p.paperHi });
    mistBand(ctx, random, { y: 590, width: 820, height: 46, alpha: 0.035, color: p.paperHi });
  }

  // ---------- 场景：遵义（会场 / 街） ----------

  function paintZunyiHall(ctx, random, p) {
    ctx.fillStyle = p.paperLo;
    ctx.fillRect(0, 0, W, H);
    fillRect(ctx, 0, 0, W, 130, p.ink, 0.14);

    // 屋檐与瓦：一条压得很低的横线，门在下面显得更沉
    fillRect(ctx, 0, 132, W, 34, p.ink, 0.82);
    ctx.save();
    ctx.strokeStyle = p.paper;
    ctx.globalAlpha = 0.14;
    ctx.lineWidth = 1;
    for (var tile = 0; tile < W; tile += 18) {
      ctx.beginPath();
      ctx.arc(tile + 9, 132, 9, 0, Math.PI);
      ctx.stroke();
    }
    ctx.restore();
    fillRect(ctx, 0, 166, W, 10, p.paperHi, 0.35);

    // 门：两扇，中间只留一道缝
    fillRect(ctx, 440, 196, 400, 384, p.ink, 0.92);
    fillRect(ctx, 636, 196, 8, 384, p.nightDeep, 1);
    ctx.save();
    ctx.strokeStyle = p.paper;
    ctx.globalAlpha = 0.1;
    ctx.lineWidth = 1;
    for (var plank = 456; plank < 840; plank += 26) {
      ctx.beginPath();
      ctx.moveTo(plank, 202);
      ctx.lineTo(plank + (random() - 0.5) * 4, 574);
      ctx.stroke();
    }
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = p.ink;
    ctx.lineWidth = 3;
    ctx.strokeRect(442, 198, 396, 380);
    ctx.restore();

    // 门缝里的灯：一点暖光，不照亮整扇门
    ctx.save();
    ctx.fillStyle = p.ember;
    ctx.globalAlpha = 0.14;
    ctx.beginPath();
    ctx.ellipse(640, 390, 26, 190, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.7;
    ctx.fillRect(639, 206, 2, 366);
    ctx.restore();

    // 冰凌：挂在檐口，长短不一
    ctx.save();
    ctx.fillStyle = p.paperHi;
    for (var ice = 8; ice < W; ice += 26 + random() * 26) {
      var len = 8 + random() * 36;
      ctx.globalAlpha = 0.4 + random() * 0.25;
      ctx.beginPath();
      ctx.moveTo(ice, 166);
      ctx.lineTo(ice + 3, 166 + len);
      ctx.lineTo(ice + 6, 166);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 台阶
    fillRect(ctx, 380, 580, 520, 12, p.ink, 0.55);
    fillRect(ctx, 350, 592, 580, 10, p.ink, 0.42);
    fillRect(ctx, 320, 602, 640, 8, p.ink, 0.3);

    // 雪：细点，不铺满
    ctx.save();
    ctx.fillStyle = p.paperHi;
    for (var snow = 0; snow < 90; snow += 1) {
      ctx.globalAlpha = 0.25 + random() * 0.4;
      ctx.beginPath();
      ctx.arc(random() * W, random() * 620, 0.9 + random() * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    fillRect(ctx, 0, 0, W, 86, p.ink, 0.16);
  }

  function paintZunyiStreet(ctx, random, p) {
    ctx.fillStyle = p.paperHi;
    ctx.fillRect(0, 0, W, H);
    fillRect(ctx, 0, 0, W, 210, p.paperLo, 0.8);

    // 街面：从两侧收向中间，石板横缝越远越密
    ctx.save();
    ctx.fillStyle = p.paperLo;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(0, 720);
    ctx.lineTo(1280, 720);
    ctx.lineTo(792, 420);
    ctx.lineTo(488, 420);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = p.ink;
    ctx.globalAlpha = 0.15;
    ctx.lineWidth = 1;
    for (var row = 0; row < 9; row += 1) {
      var ry = 456 + row * 30 + row * row * 2.2;
      var half = 46 + (ry - 456) * 1.55;
      ctx.beginPath();
      ctx.moveTo(640 - half, ry);
      ctx.lineTo(640 + half, ry);
      ctx.stroke();
    }
    for (var col = -4; col <= 4; col += 1) {
      ctx.beginPath();
      ctx.moveTo(640 + col * 24, 430);
      ctx.lineTo(640 + col * 86, 720);
      ctx.stroke();
    }
    ctx.restore();

    // 两侧低屋：只取屋檐、墙、门洞
    function house(side) {
      var x0 = side === "left" ? 0 : 820;
      var x1 = side === "left" ? 360 : 1280;
      fillRect(ctx, x0, 250, x1 - x0, 300, p.ink, 0.78);
      fillRect(ctx, x0, 250, x1 - x0, 18, p.paperLo, 0.5);
      ctx.save();
      ctx.fillStyle = p.ink;
      ctx.beginPath();
      if (side === "left") {
        ctx.moveTo(-40, 250);
        ctx.lineTo(400, 250);
        ctx.lineTo(320, 196);
        ctx.lineTo(-40, 196);
      } else {
        ctx.moveTo(880, 250);
        ctx.lineTo(1320, 250);
        ctx.lineTo(1320, 196);
        ctx.lineTo(960, 196);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // 门洞 / 窗
      ctx.save();
      ctx.fillStyle = p.nightDeep;
      ctx.globalAlpha = 0.85;
      if (side === "left") {
        ctx.fillRect(120, 330, 56, 150);
        ctx.fillRect(236, 340, 44, 60);
      } else {
        ctx.fillRect(1040, 330, 56, 150);
        ctx.fillRect(1160, 340, 44, 60);
      }
      ctx.restore();
    }
    house("left");
    house("right");

    // 街尾的门楼：一个更小的暗块，给纵深一个落点
    fillRect(ctx, 560, 366, 160, 66, p.ink, 0.72);
    fillRect(ctx, 548, 350, 184, 12, p.ink, 0.82);
    fillRect(ctx, 636, 384, 8, 48, p.paperLo, 0.35);

    // 灯笼：四盏，暖光只照檐下一小块
    [150, 372, 912, 1136].forEach(function (lx, index) {
      var ly = 286 + (index % 2) * 8;
      ctx.save();
      ctx.strokeStyle = p.ink;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(lx, 266);
      ctx.lineTo(lx, ly - 10);
      ctx.stroke();
      ctx.fillStyle = p.ember;
      ctx.globalAlpha = 0.1;
      ctx.beginPath();
      ctx.arc(lx, ly, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 10, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 墙上的纸：只画纸形与朱砂边，不写字
    [296, 352].forEach(function (py, index) {
      fillRect(ctx, 986, py, 58, 42, p.paperHi, 0.85);
      ctx.save();
      ctx.strokeStyle = p.cinnabar;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 2;
      ctx.strokeRect(986, py, 58, 42);
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = p.ink;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1;
      for (var line = 0; line < 2; line += 1) {
        ctx.beginPath();
        ctx.moveTo(994, py + 14 + line * 10);
        ctx.lineTo(1036 - index * 4, py + 14 + line * 10);
        ctx.stroke();
      }
      ctx.restore();
    });

    // 远处两个人影
    ctx.save();
    ctx.fillStyle = p.ink;
    ctx.globalAlpha = 0.55;
    [[600, 382], [666, 390]].forEach(function (pt) {
      ctx.beginPath();
      ctx.arc(pt[0], pt[1] - 16, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(pt[0] - 4, pt[1] - 13, 8, 18);
    });
    ctx.restore();
    fillRect(ctx, 0, 0, W, 82, p.paperLo, 0.32);
  }

  // ---------- 场景：金沙江（白天 / 夜） ----------

  function paintJinshaRiver(ctx, random, p) {
    var sky = ctx.createLinearGradient(0, 0, 0, 360);
    sky.addColorStop(0, p.paperHi);
    sky.addColorStop(1, p.paperLo);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // 峡谷两壁：越靠边越黑，江面留出中间一条亮带
    ctx.save();
    ctx.fillStyle = p.ink;
    ctx.globalAlpha = 0.78;
    ctx.beginPath();
    ctx.moveTo(0, 70);
    ctx.lineTo(250, 150);
    ctx.lineTo(360, 360);
    ctx.lineTo(320, 720);
    ctx.lineTo(0, 720);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(1280, 50);
    ctx.lineTo(1030, 140);
    ctx.lineTo(920, 360);
    ctx.lineTo(960, 720);
    ctx.lineTo(1280, 720);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ridge(ctx, random, { startX: 200, endX: 1080, baseY: 372, bottomY: 372, steps: 7, low: 300, high: 348, color: p.ink, alpha: 0.28 });

    fillRect(ctx, 0, 360, W, 360, p.inkMuted, 0.12);
    waterLines(ctx, random, { y0: 378, y1: 700, count: 44, color: p.paperHi, alphaMin: 0.22, alphaMax: 0.5, minLen: 50, maxLen: 190 });
    // 急流：短而密的斜线
    ctx.save();
    ctx.strokeStyle = p.inkMuted;
    ctx.lineWidth = 1;
    for (var flow = 0; flow < 46; flow += 1) {
      var fx = random() * W;
      var fy = 400 + random() * 280;
      ctx.globalAlpha = 0.1 + random() * 0.18;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + 16 + random() * 30, fy + (random() - 0.5) * 5);
      ctx.stroke();
    }
    ctx.restore();

    // 礁石：暗块 + 一线白水
    for (var r = 0; r < 8; r += 1) {
      var rx = 80 + random() * 1120;
      var ry = 420 + random() * 200;
      var rw = 20 + random() * 46;
      ctx.save();
      ctx.fillStyle = p.ink;
      ctx.globalAlpha = 0.5 + random() * 0.25;
      ctx.beginPath();
      ctx.moveTo(rx - rw / 2, ry);
      ctx.lineTo(rx - rw * 0.2, ry - 12 - random() * 10);
      ctx.lineTo(rx + rw * 0.3, ry - 6);
      ctx.lineTo(rx + rw / 2, ry + 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = p.paperHi;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rx - rw / 2, ry + 8);
      ctx.quadraticCurveTo(rx, ry + 14, rx + rw / 2, ry + 7);
      ctx.stroke();
      ctx.restore();
    }

    // 六条船：船身、船工、桨
    var boats = [[150, 470], [360, 520], [560, 478], [760, 540], [960, 492], [1140, 556]];
    boats.forEach(function (boat) {
      var bx = boat[0];
      var by = boat[1];
      ctx.save();
      ctx.fillStyle = p.ink;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(bx - 44, by);
      ctx.quadraticCurveTo(bx, by + 24, bx + 44, by);
      ctx.lineTo(bx + 34, by - 6);
      ctx.lineTo(bx - 34, by - 6);
      ctx.closePath();
      ctx.fill();
      // 人：八個頭，兩排
      for (var head = 0; head < 8; head += 1) {
        var hx = bx - 28 + head * 8;
        var hy = by - 12 - (head % 2) * 4;
        ctx.beginPath();
        ctx.arc(hx, hy, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
      // 桨
      ctx.strokeStyle = p.ink;
      ctx.lineWidth = 1.4;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(bx + 34, by - 4);
      ctx.lineTo(bx + 58, by + 12);
      ctx.stroke();
      ctx.restore();
    });

    mistBand(ctx, random, { y: 600, width: 760, height: 54, alpha: 0.05, color: p.paperHi });
    fillRect(ctx, 0, 0, W, 80, p.paperHi, 0.28);
  }

  function paintJinshaNight(ctx, random, p) {
    var sky = ctx.createLinearGradient(0, 0, 0, 560);
    sky.addColorStop(0, p.nightDeep);
    sky.addColorStop(1, p.night);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.fillStyle = p.paper;
    for (var star = 0; star < 20; star += 1) {
      ctx.globalAlpha = 0.25 + random() * 0.4;
      ctx.beginPath();
      ctx.arc(random() * W, 40 + random() * 220, 0.8 + random() * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 月亮：倒影不是一条直线，而是一列碎光
    ctx.save();
    ctx.fillStyle = p.paper;
    ctx.globalAlpha = 0.12;
    ctx.beginPath();
    ctx.arc(1016, 118, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(1016, 118, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ridge(ctx, random, { startX: 0, endX: W, baseY: 548, bottomY: 548, steps: 8, low: 470, high: 528, color: p.ink, alpha: 0.85 });
    fillRect(ctx, 0, 548, W, 172, p.nightDeep, 0.9);
    ctx.save();
    for (var refl = 0; refl < 26; refl += 1) {
      var ry = 556 + refl * 6;
      var spread = 6 + refl * 1.4;
      ctx.fillStyle = p.paper;
      ctx.globalAlpha = 0.16 - refl * 0.004;
      ctx.fillRect(1016 - spread, ry, spread * 2, 1.6);
    }
    ctx.restore();

    fireDots(ctx, random, { count: 4, x0: 220, x1: 660, y: 540, color: p.ember });
    // 两条船影
    [[780, 580], [900, 606]].forEach(function (boat) {
      ctx.save();
      ctx.fillStyle = p.ink;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(boat[0] - 34, boat[1]);
      ctx.quadraticCurveTo(boat[0], boat[1] + 16, boat[0] + 34, boat[1]);
      ctx.lineTo(boat[0] + 26, boat[1] - 5);
      ctx.lineTo(boat[0] - 26, boat[1] - 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
    mistBand(ctx, random, { y: 560, width: 680, height: 40, alpha: 0.025, color: p.paper });
    fillRect(ctx, 0, 0, W, 84, p.nightDeep, 0.45);
  }

  // ---------- 场景：泸定（桥 / 桥后） ----------

  function paintLudingBridge(ctx, random, p) {
    var sky = ctx.createLinearGradient(0, 0, 0, 420);
    sky.addColorStop(0, p.night);
    sky.addColorStop(1, p.nightDeep);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // 深谷两壁
    ctx.save();
    ctx.fillStyle = p.ink;
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.moveTo(0, 110);
    ctx.lineTo(236, 168);
    ctx.lineTo(330, 420);
    ctx.lineTo(286, 720);
    ctx.lineTo(0, 720);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(1280, 96);
    ctx.lineTo(1044, 158);
    ctx.lineTo(950, 420);
    ctx.lineTo(994, 720);
    ctx.lineTo(1280, 720);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 谷底水线：从缝里透出一点白
    waterLines(ctx, random, { y0: 620, y1: 706, count: 18, color: p.paper, alphaMin: 0.05, alphaMax: 0.12, minLen: 40, maxLen: 130 });

    // 桥头木桩
    ctx.save();
    ctx.fillStyle = p.ink;
    ctx.globalAlpha = 0.95;
    [270, 1008].forEach(function (px) {
      ctx.fillRect(px - 9, 250, 18, 210);
      ctx.fillRect(px - 42, 246, 84, 12);
    });
    ctx.restore();
    fillRect(ctx, 250, 262, 22, 4, p.paper, 0.18);
    fillRect(ctx, 998, 262, 22, 4, p.paper, 0.18);

    // 十三根铁索：九根桥面 + 四根扶手，全部有垂度
    chainLines(ctx, random, { x0: 282, x1: 996, y: 300, gap: 12, count: 9, sag: 34, alpha: 0.3, color: p.paper, width: 1.2 });
    chainLines(ctx, random, { x0: 282, x1: 996, y: 262, gap: 10, count: 4, sag: 22, alpha: 0.22, color: p.paper, width: 1 });
    // 桥面木板：几块稀稀落落地挂在索上
    ctx.save();
    ctx.fillStyle = p.ink;
    ctx.globalAlpha = 0.9;
    for (var board = 0; board < 15; board += 1) {
      var bx = 300 + board * 46 + random() * 10;
      var t = (bx - 282) / 714;
      var by = 300 + 34 * 4 * t * (1 - t) + 40;
      if (random() < 0.35) continue;
      ctx.fillRect(bx, by, 24 + random() * 10, 4);
    }
    ctx.restore();

    mistBand(ctx, random, { y: 500, width: 520, height: 48, alpha: 0.04, color: p.paperHi });
    mistBand(ctx, random, { y: 610, width: 700, height: 60, alpha: 0.03, color: p.paperHi });
    fillRect(ctx, 0, 0, W, 80, p.nightDeep, 0.5);
  }

  function paintLudingAfter(ctx, random, p) {
    var sky = ctx.createLinearGradient(0, 0, 0, 520);
    sky.addColorStop(0, p.night);
    sky.addColorStop(0.72, p.nightDeep);
    sky.addColorStop(1, p.ink);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.fillStyle = p.ember;
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.ellipse(700, 520, 560, 120, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 身后的桥：缩小成远处一个黑框
    ctx.save();
    ctx.strokeStyle = p.ink;
    ctx.fillStyle = p.ink;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(138, 350, 12, 170);
    ctx.fillRect(372, 350, 12, 170);
    ctx.beginPath();
    ctx.moveTo(138, 356);
    ctx.quadraticCurveTo(255, 392, 372, 356);
    ctx.stroke();
    for (var cable = 0; cable < 5; cable += 1) {
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.moveTo(144, 366 + cable * 8);
      ctx.quadraticCurveTo(255, 398 + cable * 8, 366, 366 + cable * 8);
      ctx.stroke();
    }
    ctx.restore();

    // 烟：三柱，右高左低
    ctx.save();
    ctx.strokeStyle = p.inkMuted;
    for (var smoke = 0; smoke < 3; smoke += 1) {
      var sx = 840 + smoke * 120;
      ctx.globalAlpha = 0.13;
      ctx.lineWidth = 12 + smoke * 4;
      ctx.beginPath();
      ctx.moveTo(sx, 560);
      ctx.bezierCurveTo(sx - 30, 480, sx + 46, 420, sx + 8, 320);
      ctx.stroke();
    }
    ctx.restore();

    ridge(ctx, random, { startX: 0, endX: W, baseY: 600, bottomY: 720, steps: 7, low: 520, high: 580, color: p.ink, alpha: 0.85 });
    fillRect(ctx, 0, 600, W, 120, p.nightDeep, 0.8);

    // 吹号的人：剪影，不画脸
    ctx.save();
    ctx.fillStyle = p.ink;
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.arc(1030, 498, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(1020, 508);
    ctx.lineTo(1040, 508);
    ctx.lineTo(1046, 566);
    ctx.lineTo(1016, 566);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = p.ink;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(1036, 512);
    ctx.quadraticCurveTo(1062, 500, 1088, 486);
    ctx.stroke();
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(1084, 488);
    ctx.lineTo(1096, 480);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = p.ink;
    for (var bird = 0; bird < 5; bird += 1) {
      var bx = 500 + random() * 300;
      var by = 200 + random() * 90;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.arc(bx, by, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    fillRect(ctx, 0, 0, W, 80, p.nightDeep, 0.4);
  }

  // ---------- 场景：草地（雨中 / 黎明） ----------

  function paintGrassMarsh(ctx, random, p) {
    var sky = ctx.createLinearGradient(0, 0, 0, 430);
    sky.addColorStop(0, p.paperLo);
    sky.addColorStop(1, p.paper);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // 低云：横着压过来，不画太阳
    ctx.save();
    ctx.fillStyle = p.inkMuted;
    for (var cloud = 0; cloud < 6; cloud += 1) {
      ctx.globalAlpha = 0.1 + random() * 0.06;
      ctx.beginPath();
      ctx.ellipse(200 + cloud * 220, 120 + random() * 120, 240 + random() * 90, 26 + random() * 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    fillRect(ctx, 0, 402, W, 318, p.inkMuted, 0.3);
    fillRect(ctx, 0, 470, W, 250, p.ink, 0.08);
    ridge(ctx, random, { startX: 0, endX: W, baseY: 410, bottomY: 410, steps: 12, low: 386, high: 404, color: p.ink, alpha: 0.22 });

    // 水洼：泥里反出一点天光，边缘压暗
    for (var pool = 0; pool < 16; pool += 1) {
      var px = random() * W;
      var py = 440 + random() * 240;
      var pw = 30 + random() * 90;
      ctx.save();
      ctx.fillStyle = p.inkMuted;
      ctx.globalAlpha = 0.28;
      ctx.beginPath();
      ctx.ellipse(px, py, pw, 7 + random() * 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = p.ink;
      ctx.globalAlpha = 0.32;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    // 草：只画短簇，不画树
    ctx.save();
    ctx.strokeStyle = p.ink;
    ctx.lineWidth = 1;
    for (var tuft = 0; tuft < 170; tuft += 1) {
      var tx = random() * W;
      var ty = 420 + random() * 280;
      ctx.globalAlpha = 0.28 + random() * 0.28;
      for (var blade = 0; blade < 3; blade += 1) {
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + (random() - 0.5) * 12, ty - 8 - random() * 16);
        ctx.stroke();
      }
    }
    ctx.restore();

    // 雨丝
    ctx.save();
    ctx.strokeStyle = p.paperHi;
    ctx.lineWidth = 1;
    for (var rain = 0; rain < 130; rain += 1) {
      var rx = random() * W;
      var ry = random() * H;
      ctx.globalAlpha = 0.16 + random() * 0.14;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 3, ry + 14 + random() * 10);
      ctx.stroke();
    }
    ctx.restore();
    fillRect(ctx, 0, 0, W, 80, p.paper, 0.3);
  }

  function paintGrassDawn(ctx, random, p) {
    var sky = ctx.createLinearGradient(0, 0, 0, 460);
    sky.addColorStop(0, p.paperHi);
    sky.addColorStop(1, p.paper);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    fillRect(ctx, 0, 450, W, 270, p.paperLo, 0.55);
    ridge(ctx, random, { startX: 0, endX: W, baseY: 456, bottomY: 456, steps: 11, low: 424, high: 448, color: p.ink, alpha: 0.18 });

    // 远处屋影：草地尽头有人家
    ctx.save();
    ctx.fillStyle = p.ink;
    ctx.globalAlpha = 0.45;
    ctx.fillRect(930, 404, 78, 44);
    ctx.beginPath();
    ctx.moveTo(916, 406);
    ctx.lineTo(970, 378);
    ctx.lineTo(1022, 406);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 水面反光
    for (var pool = 0; pool < 12; pool += 1) {
      var px = random() * W;
      var py = 486 + random() * 200;
      ctx.save();
      ctx.fillStyle = p.paperHi;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.ellipse(px, py, 24 + random() * 70, 5 + random() * 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    mistBand(ctx, random, { y: 452, width: 760, height: 44, alpha: 0.06, color: p.paperHi });

    ctx.save();
    ctx.strokeStyle = p.ink;
    ctx.lineWidth = 1;
    for (var tuft = 0; tuft < 80; tuft += 1) {
      var tx = random() * W;
      var ty = 470 + random() * 230;
      ctx.globalAlpha = 0.12 + random() * 0.16;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx + (random() - 0.5) * 10, ty - 7 - random() * 12);
      ctx.stroke();
    }
    ctx.restore();
    fillRect(ctx, 0, 0, W, 80, p.paperHi, 0.3);
  }

  // ---------- 场景：吴起（镇口 / 土墙） ----------

  function paintWuqiDawn(ctx, random, p) {
    var sky = ctx.createLinearGradient(0, 0, 0, 360);
    sky.addColorStop(0, p.paperHi);
    sky.addColorStop(1, p.paperLo);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    fillRect(ctx, 0, 330, W, 390, p.paperLo, 0.9);
    ridge(ctx, random, { startX: 0, endX: W, baseY: 372, bottomY: 372, steps: 8, low: 320, high: 356, color: p.ink, alpha: 0.12 });

    // 黄土崖面：横向水蚀纹
    ctx.save();
    ctx.strokeStyle = p.ink;
    for (var line = 0; line < 16; line += 1) {
      ctx.globalAlpha = 0.04 + random() * 0.05;
      ctx.lineWidth = 1;
      var ly = 386 + line * 18 + random() * 6;
      ctx.beginPath();
      ctx.moveTo(0, ly);
      ctx.lineTo(W, ly + (random() - 0.5) * 8);
      ctx.stroke();
    }
    ctx.restore();

    // 窑洞：三孔拱门，门洞全黑
    [120, 470, 820].forEach(function (cx) {
      ctx.save();
      ctx.fillStyle = p.ink;
      ctx.globalAlpha = 0.82;
      ctx.beginPath();
      ctx.moveTo(cx - 54, 520);
      ctx.lineTo(cx - 54, 444);
      ctx.quadraticCurveTo(cx, 396, cx + 54, 444);
      ctx.lineTo(cx + 54, 520);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = p.paperHi;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 58, 520);
      ctx.lineTo(cx - 58, 444);
      ctx.quadraticCurveTo(cx, 392, cx + 58, 444);
      ctx.lineTo(cx + 58, 520);
      ctx.stroke();
      ctx.restore();
    });

    // 镇口门洞：在右侧，给“到了”一个可走的入口
    fillRect(ctx, 1030, 430, 150, 210, p.ink, 0.8);
    fillRect(ctx, 1010, 414, 190, 18, p.ink, 0.9);
    fillRect(ctx, 1084, 452, 42, 188, p.paperLo, 0.35);

    // 高天的鸟
    ctx.save();
    ctx.fillStyle = p.ink;
    for (var bird = 0; bird < 7; bird += 1) {
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(320 + random() * 520, 100 + random() * 130, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.save();
    ctx.fillStyle = p.ember;
    ctx.globalAlpha = 0.1;
    ctx.beginPath();
    ctx.ellipse(900, 360, 260, 80, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    fillRect(ctx, 0, 0, W, 78, p.paperHi, 0.35);
  }

  function paintWuqiWall(ctx, random, p) {
    var sky = ctx.createLinearGradient(0, 0, 0, 240);
    sky.addColorStop(0, p.paperHi);
    sky.addColorStop(1, p.paperLo);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    fillRect(ctx, 0, 224, W, 496, p.paperLo, 0.95);
    loessWall(ctx, random, p, { x: 0, y: 224, w: W, h: 496, alpha: 0.55 });

    // 标语区：只留纸形与朱砂笔痕，不写具体的字
    fillRect(ctx, 150, 288, 470, 166, p.paperHi, 0.72);
    ctx.save();
    ctx.strokeStyle = p.cinnabar;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 3;
    ctx.strokeRect(150, 288, 470, 166);
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    [[182, 330, 350], [182, 374, 402], [182, 418, 300]].forEach(function (stroke) {
      ctx.beginPath();
      ctx.moveTo(stroke[0], stroke[1]);
      ctx.quadraticCurveTo(stroke[0] + stroke[2] * 0.55, stroke[1] - 8, stroke[0] + stroke[2], stroke[1] + 2);
      ctx.stroke();
    });
    ctx.restore();

    // 门板：斜靠在墙上
    ctx.save();
    ctx.translate(872, 420);
    ctx.rotate((2.2 * Math.PI) / 180);
    ctx.fillStyle = p.paperHi;
    ctx.globalAlpha = 0.96;
    ctx.fillRect(-76, -190, 152, 380);
    ctx.strokeStyle = p.ink;
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = 2;
    ctx.strokeRect(-76, -190, 152, 380);
    ctx.globalAlpha = 0.2;
    for (var wood = -62; wood < 76; wood += 18) {
      ctx.beginPath();
      ctx.moveTo(wood, -184);
      ctx.lineTo(wood + (random() - 0.5) * 6, 184);
      ctx.stroke();
    }
    ctx.restore();

    // 名册影：墙上钉着一张纸，一排排名字只用短线表示
    fillRect(ctx, 76, 304, 56, 150, p.paperHi, 0.7);
    ctx.save();
    ctx.strokeStyle = p.ink;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1;
    for (var row = 0; row < 8; row += 1) {
      ctx.beginPath();
      ctx.moveTo(84, 320 + row * 16);
      ctx.lineTo(120, 320 + row * 16);
      ctx.stroke();
    }
    ctx.restore();
    fillRect(ctx, 0, 690, W, 30, p.ink, 0.25);
  }

  // 湘江章首地图的兜底：照片未到之前先给一块暗色桌面与几道铅笔路线。
  function paintXiangjiangMap(ctx, random, p) {
    var desk = ctx.createLinearGradient(0, 0, W, H);
    desk.addColorStop(0, p.nightDeep);
    desk.addColorStop(0.55, p.night);
    desk.addColorStop(1, p.ink);
    ctx.fillStyle = desk;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(820, 120);
    ctx.strokeStyle = p.cinnabar;
    ctx.globalAlpha = 0.32;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 540);
    ctx.bezierCurveTo(180, 430, 250, 470, 360, 330);
    ctx.bezierCurveTo(460, 210, 560, 250, 700, 120);
    ctx.stroke();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = p.paper;
    for (var i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(20, 560 - i * 44);
      ctx.bezierCurveTo(220, 470 - i * 30, 430, 420 + i * 12, 720, 250 - i * 22);
      ctx.stroke();
    }
    ctx.restore();
  }

  var PAINTERS = {
    title: paintTitle,
    map: paintMap,
    yudu_river: paintRiver,
    yudu_night: paintNight,
    xiangjiang_ford: paintXiangjiangFord,
    xiangjiang_dawn: paintXiangjiangDawn,
    xiangjiang_map: paintXiangjiangMap,
    zunyi_hall: paintZunyiHall,
    zunyi_street: paintZunyiStreet,
    jinsha_river: paintJinshaRiver,
    jinsha_night: paintJinshaNight,
    luding_bridge: paintLudingBridge,
    luding_after: paintLudingAfter,
    grass_marsh: paintGrassMarsh,
    grass_dawn: paintGrassDawn,
    wuqi_dawn: paintWuqiDawn,
    wuqi_wall: paintWuqiWall
  };

  XB.art = {
    SCENES: SCENES,
    mount: mount,
    paint: paint,
    preload: preload,
    resize: resize,
    rng: rng
  };
})(window.XB = window.XB || {});
