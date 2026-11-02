
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const ROOT = path.resolve(__dirname, "..", "..");
const OUT = path.join(ROOT, "docs", "evidence", "step-06");
fs.mkdirSync(OUT, { recursive: true });
const cases = [
  { id: "N5", file: "project/story.js", from: '{ id: "w900", type: "end", next: "ending" }', to: '{ id: "w900", type: "end", next: "map" }', want: ["C24", "C26", "S34"] },
  { id: "N6", file: "project/engine.js", from: "ideal: isFiniteNumber(flags.fire) && flags.fire >= 20,", to: "ideal: true,", want: ["C26", "S37"] },
  { id: "N7", file: "project/story.js", from: "duration: 45,", to: "duration: 30,", want: ["C27", "S40"] },
  { id: "N8", file: "project/engine.js", from: "cards: cards", to: "cards: cards,\n      extra: true", want: ["C30", "S38"] },
  { id: "N9", file: "project/engine.js", from: "  function unlockAudio() {", to: "  function unlockAudio() {\n    new Audio(\"x.mp3\");", want: ["C31", "C09"] },
  { id: "N10", file: "project/engine.js", from: "    flashMs: 120,\r\n    flashGapMs: 2000,", to: "    flashMs: 400,\r\n    flashGapMs: 100,", want: ["C36"] },
  { id: "N11", file: "project/index.html", from: 'id="fx-layer" class="fx-layer"', to: 'class="fx-layer"', want: ["C03", "C35"] },
  { id: "N12", file: "project/engine.js", from: "  function unlockAudio() {", to: "  function unlockAudio() {\n    setInterval(function () {}, 1000);", want: ["C32"] }
];
const results = [];
function run(script, logPath, append) {
  const fd = fs.openSync(logPath, append ? "a" : "w");
  try {
    const r = spawnSync(process.execPath, [script], { cwd: ROOT, stdio: ["ignore", fd, fd] });
    return r.status;
  } finally {
    fs.closeSync(fd);
  }
}
for (const item of cases) {
  const file = path.join(ROOT, item.file);
  const original = fs.readFileSync(file, "utf8");
  if (original.indexOf(item.from) === -1) throw new Error(item.id + " 注入点缺失");
  const logPath = path.join(OUT, "_neg" + item.id + ".log");
  const row = { id: item.id, buildExit: null, smokeExit: null, want: item.want, hits: [] };
  try {
    fs.writeFileSync(file, original.replace(item.from, item.to), "utf8");
    row.buildExit = run("project/tools/check-build.js", logPath, false);
    row.smokeExit = run("project/tools/smoke.js", logPath, true);
  } finally {
    fs.writeFileSync(file, original, "utf8");
  }
  const log = fs.readFileSync(logPath, "utf8");
  row.hits = item.want.filter((id) => new RegExp("(^|[^A-Z0-9])" + id + "([^0-9]|$)").test(log));
  results.push(row);
  console.log(row.id + " build=" + row.buildExit + " smoke=" + row.smokeExit + " hits=" + row.hits.join(","));
}
fs.writeFileSync(path.join(OUT, "_negatives.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
