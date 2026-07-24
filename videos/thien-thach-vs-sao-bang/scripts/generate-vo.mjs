// One-off Vbee TTS generation for the thien-thach-vs-sao-bang video narration.
// Reads VBEE_APP_ID / VBEE_ACCESS_TOKEN / VBEE_VOICE_CODE from the repo-root
// .env (shared across all videos/ in this series), generates one mp3 per
// caption line, downloads to assets/vo/, and writes assets/vo/durations.json
// (via ffprobe) so index.html timing can be retimed to real audio length.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(ROOT, "..", "..");

function loadEnv() {
  const raw = fs.readFileSync(path.join(REPO_ROOT, ".env"), "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const m = line.trim().match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

const { VBEE_APP_ID, VBEE_ACCESS_TOKEN, VBEE_VOICE_CODE } = loadEnv();
if (!VBEE_APP_ID || !VBEE_ACCESS_TOKEN) {
  throw new Error("Missing VBEE_APP_ID / VBEE_ACCESS_TOKEN in .env");
}

const VOICE_CODE = VBEE_VOICE_CODE || "n_hanoi_male_protrainer_education_vc";
const SPEED_RATE = 1.1;

const LINES = [
  { id: "line-1", text: "Đây là thiên thạch." },
  { id: "line-2", text: "Đây là sao băng." },
  { id: "line-3", text: "Sự khác nhau là gì?" },
  { id: "line-4", text: "Thiên thạch là đá hoặc kim loại từ vũ trụ." },
  { id: "line-5", text: "Nó thực sự rơi xuống và chạm đất." },
  { id: "line-6", text: "Còn sao băng chỉ là ánh sáng thôi." },
  { id: "line-7", text: "Đó là bụi vũ trụ đang cháy trong khí quyển." },
  { id: "line-8", text: "Một cái chạm đất, một cái thì không!" },
];

async function generateSpeech(text) {
  const res = await fetch("https://vbee.vn/api/v1/tts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${VBEE_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      app_id: VBEE_APP_ID,
      input_text: text,
      voice_code: VOICE_CODE,
      audio_type: "mp3",
      speed_rate: SPEED_RATE,
      callback_url: "https://example.com/callback",
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const data = await res.json();
  if (data.status !== 1) {
    throw new Error(`Vbee error: ${data.error_message || data.error_code}`);
  }
  if (data.result?.audio_link) return data.result.audio_link;
  const requestId = data.result?.request_id;
  if (!requestId) throw new Error("No request_id returned");
  return pollForAudio(requestId);
}

async function pollForAudio(requestId) {
  const url = `https://vbee.vn/api/v1/tts/${requestId}`;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VBEE_ACCESS_TOKEN}`,
      },
    });
    if (!res.ok) continue;
    const data = await res.json();
    if (data.status === 1) {
      if (data.result?.status === "SUCCESS" && data.result?.audio_link) {
        return data.result.audio_link;
      }
      if (data.result?.status === "FAILURE") {
        throw new Error("Vbee processing failed");
      }
    }
  }
  throw new Error("Timeout waiting for Vbee audio");
}

async function downloadAudio(url, outPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buf);
}

async function getDuration(filePath) {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath,
  ]);
  return parseFloat(stdout.trim());
}

async function main() {
  const outDir = path.join(ROOT, "assets", "vo");
  fs.mkdirSync(outDir, { recursive: true });
  const durations = {};

  for (const line of LINES) {
    const outPath = path.join(outDir, `${line.id}.mp3`);
    process.stdout.write(`Generating ${line.id}: "${line.text}" ... `);
    const audioUrl = await generateSpeech(line.text);
    await downloadAudio(audioUrl, outPath);
    const dur = await getDuration(outPath);
    durations[line.id] = dur;
    console.log(`${dur.toFixed(2)}s`);
  }

  fs.writeFileSync(
    path.join(outDir, "durations.json"),
    JSON.stringify(durations, null, 2),
  );
  console.log("Done. Durations written to assets/vo/durations.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
