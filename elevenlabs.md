# Hướng dẫn sử dụng ElevenLabs TTS API

## 1. Tổng quan

ElevenLabs là dịch vụ Text-to-Speech đa ngôn ngữ (multilingual) với chất lượng
cao. API hoạt động theo mô hình **đồng bộ** — khác với Vbee (async + polling):

1. Gửi request tạo audio (POST) → nhận trực tiếp audio bytes trong response body
2. Ghi file MP3 ra `assets/vo/{line.id}.mp3` ngay

Không cần polling, không cần request_id, không cần URL tạm thời để download.

Trong repo này ElevenLabs chạy **song song** với Vbee — chọn provider bằng
biến `TTS_PROVIDER` trong `.env` hoặc cờ CLI `--provider=` (xem mục 2). Nếu
không set gì, mặc định dùng Vbee (giữ behavior cũ).

## 2. Thông tin xác thực & biến môi trường

Đăng ký tại [elevenlabs.io](https://elevenlabs.io) để lấy API key và chọn
voice từ [Voice Library](https://elevenlabs.io/app/voice-library) (lọc theo
Vietnamese nếu muốn).

| Biến                   | Bắt buộc?      | Mô tả                                                |
|------------------------|----------------|------------------------------------------------------|
| `ELEVENLABS_API_KEY`   | Có (khi dùng)  | API key từ ElevenLabs dashboard                      |
| `ELEVENLABS_VOICE_ID`  | Có (khi dùng)  | Voice ID từ Voice Library (chuỗi opaque, vd `pNInz...`) |
| `ELEVENLABS_MODEL`     | Không          | Tên model. Mặc định `eleven_v3` (flagship, hỗ trợ Việt + audio tags). Xem mục 6 |
| `TTS_PROVIDER`         | Không          | `vbee` (mặc định) hoặc `elevenlabs` — chọn provider   |

Cờ CLI ghi đè `TTS_PROVIDER` cho một lần chạy:

```bash
node scripts/generate-vo.mjs --provider=elevenlabs
node scripts/generate-vo.mjs --provider=vbee        # ghi đè TTS_PROVIDER nếu set trong .env
```

Cờ `--list-voices` (xem mục 7) — liệt kê voice khả dụng + tải preview mp3.
Không cần `ELEVENLABS_VOICE_ID`, chỉ cần `ELEVENLABS_API_KEY`. Thêm `--search=<text>`
để filter (vd `--search=vietnamese`).

Thêm vào `.env`:

```env
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_VOICE_ID=your_voice_id_here
TTS_PROVIDER=elevenlabs
# ELEVENLABS_MODEL=eleven_multilingual_v2  # bỏ comment để override
```

## 3. API Endpoint

### 3.1. Tạo audio (POST)

```
POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128
```

**Headers:**

```
Content-Type: application/json
xi-api-key: <ELEVENLABS_API_KEY>
```

**Body:**

```json
{
  "text": "Đây là Đép.",
  "model_id": "eleven_multilingual_v2",
  "voice_settings": {
    "stability": 0.5,
    "similarity_boost": 0.75,
    "style": 0.0,
    "use_speaker_boost": true
  }
}
```

| Tham số (body)       | Bắt buộc | Mô tả                                             |
|----------------------|----------|----------------------------------------------------|
| `text`               | Yes      | Nội dung text cần chuyển thành giọng nói           |
| `model_id`           | Yes      | Model TTS. Xem mục 6                               |
| `voice_settings`     | No       | Bộ tuning giọng. Xem mục 5                         |

| Tham số (query)      | Mặc định          | Mô tả                                |
|----------------------|-------------------|---------------------------------------|
| `output_format`      | `mp3_22050_32`    | Format audio trả về. Script dùng `mp3_44100_128` (tốt hơn cho TikTok/Reels re-encode) |

**Response thành công:** body là audio bytes (`audio/mpeg`), ghi thẳng ra file.
**Response lỗi:** JSON với status code HTTP. Mã lỗi thường gặp:

| Status | Ý nghĩa                         | Hành động                                 |
|--------|----------------------------------|--------------------------------------------|
| 401    | API key sai                      | Kiểm tra `ELEVENLABS_API_KEY`              |
| 402    | Hết quota                        | Nâng cấp plan                              |
| 429    | Rate limit                       | Back off và retry sau vài giây             |
| 422    | Voice ID hoặc text không hợp lệ | Kiểm tra `ELEVENLABS_VOICE_ID` / text đầu vào |

## 4. Code mẫu cho Node.js

Trích từ `videos/<video>/scripts/generate-vo.mjs` (phần ElevenLabs):

```js
const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;

const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "xi-api-key": apiKey,
  },
  body: JSON.stringify({
    text,
    model_id: modelId, // eleven_multilingual_v2 hoặc override
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true,
    },
  }),
});

if (!res.ok) throw new Error(`ElevenLabs HTTP ${res.status}`);
const arrayBuffer = await res.arrayBuffer();
fs.writeFileSync(outPath, Buffer.from(arrayBuffer));
```

## 5. Voice settings (hardcoded trong script)

Script `generate-vo.mjs` bake-in các giá trị narration-tuned sau. Muốn đổi —
sửa trực tiếp block `ELEVENLABS_VOICE_SETTINGS` trong script:

| Setting              | Giá trị | Vai trò                                              |
|----------------------|---------|------------------------------------------------------|
| `output_format`      | `mp3_44100_128` | 44.1kHz / 128kbps — đầy đặn hơn sau khi platform re-encode (TikTok/Reels) |
| `stability`          | `0.5`   | Cân bằng giữa nhất quán (cao) và biểu cảm (thấp)     |
| `similarity_boost`   | `0.75`  | Bám sát voice gốc                                    |
| `style`              | `0.0`   | Không phóng đại style — narration nên đọc tự nhiên    |
| `use_speaker_boost`  | `true`  | Tăng clarity giọng nói                               |

Nếu file size là vấn đề (đo bằng KB/s), drop xuống `mp3_22050_64`.

## 6. Models & chất lượng tiếng Việt

| Model                        | $/1k chars | Vietnamese | Ghi chú |
|------------------------------|------------|------------|----------|
| `eleven_v3`                  | $0.10      | ✅ Tốt nhất | **Khuyến nghị cho narration Việt.** Flagship — hỗ trợ audio tags inline như `[laughs]`, `[whispers]`, `<excited>...</excited>`. 70+ ngôn ngữ. |
| `eleven_flash_v2_5`          | $0.05      | ✅ Tốt      | **Khuyến nghị cho budget.** Vietnamese-capable, ~75ms latency, 40k char limit/re |
| `eleven_multilingual_v2`     | $0.10      | ❌ KHÔNG    | ⚠ **KHÔNG hỗ trợ tiếng Việt** (chỉ 29 ngôn ngữ, vi không có trong list). Đừng dùng cho narration Việt — giọng sẽ đọc sai tone. |
| `eleven_turbo_v2_5`          | $0.05      | ⚠ Trung bình | ⚠ **Deprecated.** ElevenLabs khuyến nghị chuyển sang `eleven_flash_v2_5` (cùng giá, latency thấp hơn). Script sẽ in warning nếu vẫn dùng. |

**Audio tags (chỉ `eleven_v3`):** thêm inline markers trong text để control emotion
mà không cần tinh chỉnh voice settings. Ví dụ:

```js
text: "[whispers]Đây là bí mật.[/whispers] Sau đó [laughs] thật ra không có gì."
```

Tags hỗ trợ: `[laughs]`, `[laughs harder]`, `[starts laughing]`, `[whispers]`,
`[sighs]`, `[exhales]`, `[sarcastic]`, `[curious]`, `[excited]`, `[crying]`,
`[snorts]`, `[clears throat]`, `[pause]`, và nhiều hơn — xem docs.

**Pricing lưu ý:** Giá trên là API rate per 1k characters. ElevenLabs đôi khi
khuyến mãi Flash/Turbo xuống 0.5 credit/char, nên cost thực tế có thể thấp hơn.
Verify tại `GET https://api.elevenlabs.io/v1/models` trước khi ship production.

## 7. Cách chọn voice

1. Vào [elevenlabs.io/app/voice-library](https://elevenlabs.io/app/voice-library)
2. Lọc theo `Language = Vietnamese`, `Gender = Male/Female` tùy ý
3. Thử voice bằng preview text — nên dùng text Việt có dấu để kiểm tra tone
4. Click vào voice → copy **Voice ID** (chuỗi opaque, vd `pNInz6obpgDQGcFmaJgB`)
5. Paste vào `ELEVENLABS_VOICE_ID` trong `.env`

**Hoặc dùng `--list-voices` của script** (khuyến nghị — nghe thử tại chỗ):

```bash
# Chỉ cần ELEVENLABS_API_KEY (không cần ELEVENLABS_VOICE_ID)
node scripts/generate-vo.mjs --list-voices

# Lọc trước (vd chỉ Vietnamese-capable):
node scripts/generate-vo.mjs --list-voices --search=vietnamese
```

Script sẽ:
- Gọi `GET /v2/voices` (có pagination qua `has_more`/`last_sort_id` — accounts có nhiều Voice Library voice sẽ hiện hết, không bị cắt ở page đầu)
- In bảng với `#`, tên, category (premade/cloned/...), labels (language/gender/accent), voice ID
- Tải preview mp3 của từng voice về `assets/voice-previews/<slug>-<id8>.mp3`
- Ghi `assets/voice-previews/voices.json` (map `voice_id` → `{ name, file }`)

Sau đó nghe thử rồi chọn:

```bash
afplay videos/dev-vs-devops/assets/voice-previews/adam-pNInz6ob.mp3
# Thấy ưng → copy Voice ID từ bảng trên terminal → paste vào .env
```

Tip: cùng một voice ID áp dụng cho mọi video trong series (config ở repo root),
không cần config riêng per video.

## 8. Lưu ý quan trọng

- **Phonetic Vietnamese:** Nếu ElevenLabs đọc "Dev"/"DevOps" sai, dùng phonetic
  Vietnamese (vd "Đép"/"Đép Ốp") trong mảng `LINES` của video đó — giống cách
  Vbee đã làm. Cả hai provider dùng chung một `LINES` array.
- **Chi phí:** ElevenLabs tính theo **ký tự text đầu vào**, không theo duration
  audio. Một video 8 dòng × ~30 ký tự ≈ 240 ký tự ≈ $0.04 với
  `multilingual_v2`. Script in cost estimate cuối mỗi run.
- **Output ghi đè:** ElevenLabs ghi đè file MP3 cũ do Vbee tạo (cùng path
  `assets/vo/{line.id}.mp3`). Nếu muốn A/B, rename file cũ trước khi chạy.
- **`index.html` không đổi:** Audio path và `durations.json` shape giữ nguyên —
  không cần edit composition.
- **Sync API:** Response trả về audio bytes trực tiếp trong response body, không
  cần polling hay callback URL (khác với Vbee).