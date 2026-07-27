#!/usr/bin/env node
// Scaffold a new comparison-video project under videos/<slug>/ for this repo's series.
//
// Automates step 2 of the create-video skill — the mechanical, easy-to-get-wrong part:
//   1. hyperframes init (blank / portrait / non-interactive)
//   2. un-nest the duplicate <slug>/<slug>/ folder the CLI creates
//   3. delete the per-video CLAUDE.md / AGENTS.md init generates (root ones are shared)
//   4. copy scripts/sync-channel.mjs + scripts/generate-vo.mjs from the reference video
//   5. wire the sync-channel npm script + pre* hooks into package.json
//
// Usage:  node .agents/skills/create-video/scripts/scaffold.mjs <slug> [--repo-root <path>]
//         node .agents/skills/create-video/scripts/scaffold.mjs <slug> --dry-run
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const HF_FALLBACK_VERSION = "0.7.58";
const REFERENCE_VIDEOS = ["dev-vs-devops", "thien-thach-vs-sao-bang"];
const COPY_SCRIPTS = ["sync-channel.mjs", "generate-vo.mjs"];
const NPM_SCRIPTS = {
  "sync-channel": "node scripts/sync-channel.mjs",
  predev: "npm run sync-channel",
  precheck: "npm run sync-channel",
  prerender: "npm run sync-channel",
  prepublish: "npm run sync-channel",
};

function fail(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

// ---------- args ----------
const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const rootFlag = argv.indexOf("--repo-root");
const repoRootArg = rootFlag !== -1 ? argv[rootFlag + 1] : null;
const slug = argv.find((a) => !a.startsWith("--") && a !== repoRootArg);

if (!slug) {
  fail("Thiếu <slug>. Ví dụ: node .agents/skills/create-video/scripts/scaffold.mjs ram-vs-rom");
}
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  fail(`Slug "${slug}" không hợp lệ — dùng kebab-case chữ thường, ví dụ "ram-vs-rom".`);
}

// ---------- locate repo root ----------
// A repo root is any ancestor dir holding both DESIGN.md and videos/. Search upward from
// cwd first (works when the skill is installed globally too), then fall back to walking up
// from this script's own location (.agents/skills/create-video/scripts → 4 levels).
function isRepoRoot(dir) {
  return (
    fs.existsSync(path.join(dir, "DESIGN.md")) &&
    fs.existsSync(path.join(dir, "videos"))
  );
}

function findRepoRoot(startDir) {
  let dir = path.resolve(startDir);
  while (true) {
    if (isRepoRoot(dir)) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

const REPO_ROOT = repoRootArg
  ? path.resolve(repoRootArg)
  : findRepoRoot(process.cwd()) || findRepoRoot(path.resolve(__dirname, "..", "..", "..", ".."));

if (!REPO_ROOT || !isRepoRoot(REPO_ROOT)) {
  fail(
    "Không tìm thấy root repo (thư mục chứa cả DESIGN.md và videos/).\n" +
      "  Chạy lại từ trong repo, hoặc truyền --repo-root <đường-dẫn>.",
  );
}

// ---------- reference video (source of scripts + pinned hyperframes version) ----------
const reference = REFERENCE_VIDEOS.map((name) => path.join(REPO_ROOT, "videos", name)).find(
  (dir) => COPY_SCRIPTS.every((f) => fs.existsSync(path.join(dir, "scripts", f))),
);
if (!reference) {
  fail(
    `Không tìm thấy video tham chiếu có đủ ${COPY_SCRIPTS.join(" + ")} trong scripts/.\n` +
      `  Đã thử: ${REFERENCE_VIDEOS.join(", ")}`,
  );
}

// Pin the same hyperframes version the existing videos use, so the series stays consistent.
function pinnedVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(reference, "package.json"), "utf8"));
    const m = JSON.stringify(pkg.scripts || {}).match(/hyperframes@([0-9]+\.[0-9]+\.[0-9]+)/);
    if (m) return m[1];
  } catch {
    /* fall through to the default below */
  }
  return HF_FALLBACK_VERSION;
}
const HF_VERSION = pinnedVersion();

const target = path.join(REPO_ROOT, "videos", slug);
if (fs.existsSync(target) && fs.readdirSync(target).length > 0) {
  fail(`videos/${slug}/ đã tồn tại và không rỗng — chọn slug khác hoặc xoá thủ công trước.`);
}

console.log(`repo root      : ${REPO_ROOT}`);
console.log(`video mới      : videos/${slug}/`);
console.log(`tham chiếu     : videos/${path.basename(reference)}/`);
console.log(`hyperframes    : ${HF_VERSION}`);
if (dryRun) {
  console.log("\n--dry-run: không thay đổi gì trên đĩa.");
  process.exit(0);
}

// ---------- 1. hyperframes init ----------
fs.mkdirSync(target, { recursive: true });
console.log("\n[1/5] hyperframes init …");
// npx needs a shell on Windows (it is npx.cmd there). Passed as one command string rather
// than a string + args array — node deprecates the latter combination. Safe to interpolate:
// slug is validated kebab-case above, and HF_VERSION is a matched semver.
const initCmd =
  `npx --yes hyperframes@${HF_VERSION} init ${slug} ` +
  "--example blank --resolution portrait --non-interactive --skip-transcribe";
const init = spawnSync(initCmd, { cwd: target, stdio: "inherit", shell: true });
if (init.status !== 0) {
  fail(`hyperframes init thất bại (exit ${init.status}). Xem references/scaffold-manual.md.`);
}

// ---------- 2. un-nest videos/<slug>/<slug>/ ----------
const nested = path.join(target, slug);
if (fs.existsSync(nested) && fs.statSync(nested).isDirectory()) {
  console.log("[2/5] gỡ thư mục con lồng trùng tên …");
  for (const entry of fs.readdirSync(nested)) {
    const from = path.join(nested, entry);
    const to = path.join(target, entry);
    if (fs.existsSync(to)) {
      fail(`Xung đột khi gỡ lồng: ${to} đã tồn tại. Xử lý thủ công rồi chạy lại.`);
    }
    fs.renameSync(from, to);
  }
  fs.rmdirSync(nested);
} else {
  console.log("[2/5] không có thư mục lồng — bỏ qua.");
}

// ---------- 3. drop per-video agent instruction files ----------
console.log("[3/5] xoá CLAUDE.md / AGENTS.md per-video (dùng bản ở root) …");
for (const f of ["CLAUDE.md", "AGENTS.md"]) {
  const p = path.join(target, f);
  if (fs.existsSync(p)) {
    fs.rmSync(p);
    console.log(`      - xoá ${f}`);
  }
}

// ---------- 4. copy shared scripts ----------
console.log("[4/5] copy scripts từ video tham chiếu …");
const targetScripts = path.join(target, "scripts");
fs.mkdirSync(targetScripts, { recursive: true });
for (const f of COPY_SCRIPTS) {
  const to = path.join(targetScripts, f);
  if (fs.existsSync(to)) {
    console.log(`      - giữ ${f} (đã có)`);
    continue;
  }
  fs.copyFileSync(path.join(reference, "scripts", f), to);
  console.log(`      - copy ${f}`);
}

// ---------- 5. wire package.json ----------
console.log("[5/5] nối npm script + hook pre* vào package.json …");
const pkgPath = path.join(target, "package.json");
if (!fs.existsSync(pkgPath)) {
  fail("Không thấy package.json sau init — kiểm tra output của hyperframes init ở trên.");
}
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
pkg.scripts = pkg.scripts || {};
for (const [name, cmd] of Object.entries(NPM_SCRIPTS)) {
  if (pkg.scripts[name] && pkg.scripts[name] !== cmd) {
    console.log(`      ! giữ script "${name}" đang có: ${pkg.scripts[name]}`);
    continue;
  }
  pkg.scripts[name] = cmd;
}
fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

// ---------- report ----------
const missingEnv = !fs.existsSync(path.join(REPO_ROOT, ".env"));
console.log(`\n✔ videos/${slug}/ đã sẵn sàng.`);
if (missingEnv) {
  console.log("\n⚠ Chưa có .env ở root repo — copy .env.example thành .env và điền");
  console.log("  VBEE_APP_ID / VBEE_ACCESS_TOKEN trước khi sinh voiceover.");
}
console.log("\nBước tiếp theo (skill create-video):");
console.log(`  3. sửa LINES (12 dòng) trong videos/${slug}/scripts/generate-vo.mjs rồi chạy`);
console.log(`     cd videos/${slug} && node scripts/generate-vo.mjs`);
console.log("  4. tính timing từ assets/vo/durations.json (references/script-and-timing.md)");
console.log(`  5. dựng index.html từ videos/${path.basename(reference)}/index.html`);
console.log("     (references/composition.md)");
