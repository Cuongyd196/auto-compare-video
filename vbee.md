# Hướng dẫn sử dụng Vbee TTS API

## 1. Tổng quan

Vbee là dịch vụ Text-to-Speech (TTS) tiếng Việt. API hoạt động theo mô hình **bất đồng bộ**:

1. Gửi request tạo audio (POST) → nhận `request_id`
2. Polling kiểm tra trạng thái (GET) cho đến khi nhận được `audio_link`
3. Download file MP3 từ `audio_link`

## 2. Thông tin xác thực

Đăng ký tại [vbee.vn](https://vbee.vn) để lấy:

| Biến           | Mô tả                       |
|----------------|------------------------------|
| `VBEE_APP_ID`      | App ID từ dashboard Vbee     |
| `VBEE_ACCESS_TOKEN` | Bearer token để xác thực API |

Lưu vào file `.env`:

```env
VBEE_APP_ID=your_app_id
VBEE_ACCESS_TOKEN=your_access_token
```

## 3. Các API Endpoint

### 3.1. Tạo audio (POST)

```
POST https://vbee.vn/api/v1/tts
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <VBEE_ACCESS_TOKEN>
```

**Body:**
```json
{
  "app_id": "your_app_id",
  "input_text": "Xin chào, đây là bài test",
  "voice_code": "n_hanoi_male_protrainer_education_vc",
  "audio_type": "mp3",
  "speed_rate": 1.0,
  "callback_url": "https://example.com/callback"
}
```

| Tham số        | Bắt buộc | Mô tả                                      |
|----------------|----------|---------------------------------------------|
| `app_id`       | Yes      | App ID của bạn                              |
| `input_text`   | Yes      | Nội dung text cần chuyển thành giọng nói    |
| `voice_code`   | No       | Mã giọng đọc (xem mục 5)                   |
| `audio_type`   | No       | Định dạng audio: `mp3` (mặc định)           |
| `speed_rate`   | No       | Tốc độ đọc: `0.1` - `1.9`, mặc định `1.0`  |
| `callback_url` | Yes      | URL nhận callback khi audio xong (bắt buộc) |

**Response thành công:**
```json
{
  "status": 1,
  "result": {
    "app_id": "your_app_id",
    "request_id": "abc-123-def",
    "characters": 25,
    "voice_code": "n_hanoi_male_protrainer_education_vc",
    "audio_type": "mp3",
    "speed_rate": 1.0,
    "status": "IN_PROGRESS",
    "create_at": "2025-01-01T00:00:00Z"
  }
}
```

**Response lỗi:**
```json
{
  "status": 0,
  "error_code": "INVALID_TOKEN",
  "error_message": "Token không hợp lệ"
}
```

### 3.2. Kiểm tra trạng thái (GET)

```
GET https://vbee.vn/api/v1/tts/{request_id}
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <VBEE_ACCESS_TOKEN>
```

**Response khi hoàn thành:**
```json
{
  "status": 1,
  "result": {
    "request_id": "abc-123-def",
    "status": "SUCCESS",
    "audio_link": "https://cdn.vbee.vn/audio/abc-123-def.mp3"
  }
}
```

| Trạng thái     | Ý nghĩa                          |
|----------------|-----------------------------------|
| `IN_PROGRESS`  | Đang xử lý, tiếp tục polling     |
| `SUCCESS`      | Hoàn thành, `audio_link` có sẵn  |
| `FAILURE`      | Thất bại                         |

### 3.3. Lấy danh sách giọng đọc (GET)

```
GET https://vbee.vn/api/v1/voices
```

**Headers:**
```
Authorization: Bearer <VBEE_ACCESS_TOKEN>
```

## 4. Code mẫu cho Electron/Node.js

### 4.1. Hàm tạo speech (TypeScript)

```typescript
interface VbeeOptions {
  appId: string;
  accessToken: string;
  voiceCode?: string;
  speedRate?: number;
}

async function generateSpeech(text: string, options: VbeeOptions): Promise<string> {
  const API_URL = "https://vbee.vn/api/v1/tts";

  // Bước 1: Gửi request tạo audio
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.accessToken}`,
    },
    body: JSON.stringify({
      app_id: options.appId,
      input_text: text,
      voice_code: options.voiceCode || "n_hanoi_male_protrainer_education_vc",
      audio_type: "mp3",
      speed_rate: options.speedRate || 1.0,
      callback_url: "https://example.com/callback",
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.status !== 1) {
    throw new Error(`Vbee Error: ${data.error_message || data.error_code}`);
  }

  const requestId = data.result?.request_id;
  if (!requestId) throw new Error("Không nhận được request_id");

  // Bước 2: Nếu audio_link có sẵn ngay
  if (data.result?.audio_link) return data.result.audio_link;

  // Bước 3: Polling chờ kết quả
  return await pollForAudio(requestId, options.accessToken);
}

async function pollForAudio(requestId: string, accessToken: string): Promise<string> {
  const checkUrl = `https://vbee.vn/api/v1/tts/${requestId}`;

  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000)); // Chờ 2 giây mỗi lần

    const resp = await fetch(checkUrl, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!resp.ok) continue;

    const statusData = await resp.json();

    if (statusData.status === 1) {
      if (statusData.result?.status === "SUCCESS" && statusData.result?.audio_link) {
        return statusData.result.audio_link;
      }
      if (statusData.result?.status === "FAILURE") {
        throw new Error("Vbee xử lý thất bại");
      }
      // IN_PROGRESS → tiếp tục polling
    }
  }

  throw new Error("Timeout: Chờ quá 60 giây");
}
```

### 4.2. Download file MP3

```typescript
import fs from "fs";

async function downloadAudio(url: string, outputPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
}
```

### 4.3. Sử dụng hoàn chỉnh

```typescript
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const appId = process.env.VBEE_APP_ID!;
  const accessToken = process.env.VBEE_ACCESS_TOKEN!;

  const audioUrl = await generateSpeech("Xin chào, đây là bài test Vbee", {
    appId,
    accessToken,
    voiceCode: "n_hanoi_male_protrainer_education_vc",
    speedRate: 1.0,
  });

  console.log("Audio URL:", audioUrl);

  await downloadAudio(audioUrl, "./output.mp3");
  console.log("Saved to output.mp3");
}

main();
```

## 5. Một số giọng đọc phổ biến

| Alias   | Voice Code                                              | Mô tả                    |
|---------|---------------------------------------------------------|---------------------------|
| `pro`   | `n_hanoi_male_protrainer_education_vc`                  | Nam Hà Nội, giáo dục     |
| `ads`   | `n_hanoi_male_thangchuyennghiep_advertise_vc`           | Nam Hà Nội, quảng cáo    |
| `story` | `n_namdinh_male_haichuyen20251209185109485_book_vc`     | Nam Nam Định, đọc sách   |
| `sizo`  | `n_hanoi_male_sizonguyen_education_vc`                  | Nam Hà Nội, giáo dục     |
| `nga`   | `n_hanoi_female_nguyetnga2_book_vc`                     | Nữ Hà Nội, đọc sách     |
| `tam`   | `s_sg_male_thientam_ytstable_vc`                        | Nam Sài Gòn              |

Để xem toàn bộ danh sách giọng, gọi API:
```
GET https://vbee.vn/api/v1/voices
Authorization: Bearer <token>
```

## 6. Lưu ý quan trọng

- **callback_url bắt buộc** trong body POST, dù bạn dùng polling. Có thể dùng URL giả `https://example.com/callback`.
- **Polling interval**: Nên chờ 2 giây giữa mỗi lần check, tối đa 30 lần (~60 giây).
- **speed_rate**: Giá trị từ `0.1` (rất chậm) đến `1.9` (rất nhanh). Mặc định `1.0`.
- **Node.js 18+**: Code mẫu dùng `fetch` native. Với Node cũ hơn, cài `node-fetch`.
- **Electron**: `fetch` có sẵn trong cả main process và renderer process.
- **audio_link** là URL tạm thời trên CDN Vbee, nên download về lưu local.
