// One-off TTS generation for the dev-vs-devops video narration.
// Provider is Vbee by default; set TTS_PROVIDER=elevenlabs (or pass
// --provider=elevenlabs) to use ElevenLabs instead. Reads credentials from the
// repo-root .env (shared across all videos/ in this series), generates one mp3
// per caption line, downloads to assets/vo/, and writes assets/vo/durations.json
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

const env = loadEnv();

// Provider resolution: --provider CLI flag > TTS_PROVIDER env var > "vbee" default.
function resolveProvider() {
  const cliFlag = process.argv.find((a) => a.startsWith("--provider="));
  const fromCli = cliFlag ? cliFlag.split("=")[1] : null;
  const fromEnv = env.TTS_PROVIDER;
  const provider = (fromCli || fromEnv || "vbee").toLowerCase();
  if (provider !== "vbee" && provider !== "elevenlabs") {
    throw new Error(
      `Invalid TTS_PROVIDER: "${provider}". Must be "vbee" or "elevenlabs".`,
    );
  }
  return provider;
}

const PROVIDER = resolveProvider();
console.log(`TTS provider: ${PROVIDER}`);

// Vbee-specific env.
const { VBEE_APP_ID, VBEE_ACCESS_TOKEN, VBEE_VOICE_CODE } = env;
if (PROVIDER === "vbee" && (!VBEE_APP_ID || !VBEE_ACCESS_TOKEN)) {
  throw new Error("Missing VBEE_APP_ID / VBEE_ACCESS_TOKEN in .env");
}
const VOICE_CODE = VBEE_VOICE_CODE || "n_hanoi_male_protrainer_education_vc";
const SPEED_RATE = 1.1;

// ElevenLabs-specific env (validated at startup so failures happen before any I/O).
const ELEVENLABS_API_KEY = env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = env.ELEVENLABS_VOICE_ID;
const ELEVENLABS_MODEL_ID =
  env.ELEVENLABS_MODEL || "eleven_multilingual_v2";

// Per-1k-character USD rates by model (Aug 2026). ElevenLabs charges by
// characters, not by audio duration.
const ELEVENLABS_COST_PER_1K_CHARS = {
  eleven_multilingual_v2: 0.18,
  eleven_turbo_v2_5: 0.09,
  eleven_flash_v2_5: 0.05,
};

if (PROVIDER === "elevenlabs") {
  if (!ELEVENLABS_API_KEY) throw new Error("Missing ELEVENLABS_API_KEY in .env");
  if (!ELEVENLABS_VOICE_ID) throw new Error("Missing ELEVENLABS_VOICE_ID in .env");
  if (!(ELEVENLABS_MODEL_ID in ELEVENLABS_COST_PER_1K_CHARS)) {
    throw new Error(
      `Unknown ELEVENLABS_MODEL: "${ELEVENLABS_MODEL_ID}". Use eleven_multilingual_v2, eleven_turbo_v2_5, or eleven_flash_v2_5.`,
    );
  }
}

// TTS input uses phonetic Vietnamese spelling ("Đép" / "Đép Ốp") so Vbee
// pronounces "Dev" / "DevOps" correctly — on-screen captions in index.html
// keep the real spelling "Dev" / "DevOps". ElevenLabs multilingual_v2 also
// reads these phonetic spellings; if it reads them oddly, swap the LINES
// for that video.
const LINES = [
  { id: "line-1", text: "Đây là Đép." },
  { id: "line-2", text: "Đây là Đép Ốp." },
  { id: "line-3", text: "Sự khác nhau là gì?" },
  { id: "line-4", text: "Đép là người viết code, xây dựng tính năng mới." },
  { id: "line-5", text: "Nhưng code đó cần chạy ổn định ngoài thực tế." },
  { id: "line-6", text: "Đép Ốp là người đưa code lên server, tự động hoá." },
  { id: "line-7", text: "Và giám sát toàn bộ hệ thống hoạt động." },
  { id: "line-8", text: "Một bên tạo ra sản phẩm, một bên giữ nó luôn sống. Đép xây, Đép Ốp vận hành!" },
];

// ============================================================================
// Vbee TTS (async: POST → request_id → poll → audio_link → download)
// ============================================================================

async function generateSpeechVbee(text) {
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
  return pollForAudioVbee(requestId);
}

async function pollForAudioVbee(requestId) {
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

async function downloadVbeeAudio(url, outPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buf);
}

// ============================================================================
// ElevenLabs TTS (sync: POST → audio bytes directly, no polling)
// ============================================================================

// Voice settings tuned for narration. Override by editing this block.
const ELEVENLABS_VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.0,
  use_speaker_boost: true,
};

async function generateSpeechElevenLabs(text) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}?output_format=mp3_44100_128`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text,
      model_id: ELEVENLABS_MODEL_ID,
      voice_settings: ELEVENLABS_VOICE_SETTINGS,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    let message = `ElevenLabs HTTP ${res.status}: ${res.statusText}`;
    if (res.status === 401) message += " (invalid ELEVENLABS_API_KEY)";
    else if (res.status === 402) message += " (quota exceeded — upgrade plan)";
    else if (res.status === 429) message += " (rate limited — back off and retry)";
    else if (res.status === 422) message += " (invalid voice ID or text)";
    if (errorBody) message += `\n${errorBody}`;
    throw new Error(message);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ============================================================================
// Shared: probe mp3 duration and write per-video durations.json
// ============================================================================

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
  let elevenLabsChars = 0;

  for (const line of LINES) {
    const outPath = path.join(outDir, `${line.id}.mp3`);
    process.stdout.write(`Generating ${line.id}: "${line.text}" ... `);

    if (PROVIDER === "elevenlabs") {
      elevenLabsChars += line.text.length;
      const audioBuffer = await generateSpeechElevenLabs(line.text);
      fs.writeFileSync(outPath, audioBuffer);
    } else {
      const audioUrl = await generateSpeechVbee(line.text);
      await downloadVbeeAudio(audioUrl, outPath);
    }

    const dur = await getDuration(outPath);
    durations[line.id] = dur;
    console.log(`${dur.toFixed(2)}s`);
  }

  fs.writeFileSync(
    path.join(outDir, "durations.json"),
    JSON.stringify(durations, null, 2),
  );
  console.log("Done. Durations written to assets/vo/durations.json");

  if (PROVIDER === "elevenlabs" && elevenLabsChars > 0) {
    const rate = ELEVENLABS_COST_PER_1K_CHARS[ELEVENLABS_MODEL_ID];
    const cost = (elevenLabsChars / 1000) * rate;
    console.log(
      `ElevenLabs: ${elevenLabsChars} chars × $${rate}/1k = $${cost.toFixed(4)} (model: ${ELEVENLABS_MODEL_ID})`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
