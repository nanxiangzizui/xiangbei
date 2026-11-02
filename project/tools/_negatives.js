
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const ROOT = path.resolve(__dirname, "..", "..");
const OUT = path.join(ROOT, "docs", "evidence", "step-05");
const cases = [
  { id: "N5", file: "project/story.js", from: '{ id: "w900", type: "end", next: "ending" }', to: '{ id: "w900", type: "end", next: "map" }', want: ["C24", "C26", "S34"] },
  { id: "N6", file: "project/engine.js", from: "ideal: isFiniteNumber(flags.fire) && flags.fire >= 20,", to: "ideal: true,", want: ["C26", "S37"] },
  { id: "N7", file: "project/story.js", from: "duration: 45,", to: "duration: 30,", want: ["C27", "S40"] },
  { id: "N8", file: "project/engine.js", from: "cards: cards", to: "cards: cards,\n      extra: true", want: ["C30", "S38"] }
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
