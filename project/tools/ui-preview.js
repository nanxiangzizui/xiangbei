(function () {
  "use strict";

  // 开发期预览页：只负责缩放与字体对照，不参与游戏运行时
  var sheet = document.getElementById("preview-sheet");
  var frame = document.getElementById("preview-frame");
  var bar = document.getElementById("preview-bar");
  var meta = document.getElementById("preview-meta");
  var currentScale = 1;

  function applyScale(scale) {
    currentScale = scale;
    sheet.style.transform = "scale(" + scale + ")";
    // transform 不改变布局尺寸，父框手动撑开，否则页面留一片空白
    frame.style.width = Math.round(1280 * scale) + "px";
    frame.style.height = Math.round(sheet.offsetHeight * scale) + "px";
    meta.textContent = "1280×" + sheet.offsetHeight + " @ " + Math.round(scale * 100) + "%";
  }

  function markPressed(target) {
    var buttons = bar.querySelectorAll("[data-scale]");
    Array.prototype.forEach.call(buttons, function (button) {
      button.setAttribute("aria-pressed", button === target ? "true" : "false");
    });
  }

  bar.addEventListener("click", function (event) {
    var button = event.target.closest("button");
    if (!button) return;
    var scale = button.dataset.scale;
    if (scale) {
      markPressed(button);
      applyScale(parseFloat(scale));
      return;
    }
    if (button.dataset.fonts === "toggle") {
      var useFallback = document.documentElement.classList.toggle("fonts-fallback");
      button.setAttribute("aria-pressed", useFallback ? "true" : "false");
      applyScale(currentScale);
    }
  });

  window.addEventListener("resize", function () {
    applyScale(currentScale);
  });

  applyScale(1);
})();
