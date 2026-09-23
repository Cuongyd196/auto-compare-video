# Hướng dẫn sử dụng VieNeu TTS API (CIT Voice Studio)

## 1. Tổng quan

**VieNeu TTS** (tích hợp qua CIT Voice Studio TTS API) là mô hình Text-to-Speech tiếng Việt chạy cục bộ (local inference qua ONNX/PyTorch).

- **Mã nguồn ứng dụng**: [https://github.com/Cuongyd196/cit-voice-studio](https://github.com/Cuongyd196/cit-voice-studio)
- **API URL mặc định**: `http://127.0.0.1:8001`
- **Swagger Docs**: [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)
- **OpenAPI Schema**: [http://127.0.0.1:8001/openapi.json](http://127.0.0.1:8001/openapi.json)
- **Ưu điểm**:
  - Không tốn chi phí API, không giới hạn request/phút từ các dịch vụ đám mây.
  - Phản hồi đồng bộ tức thì (POST trả thẳng stream audio MP3/WAV, không cần polling qua `request_id`).
  - Chất lượng âm thanh 48 kHz sắc nét, tự nhiên, đa dạng vùng miền (Bắc, Trung, Nam).

---

## 2. Thiết lập trong `.env`

Tại file `.env` ở thư mục gốc của repository:

```env
# ── TTS Provider ─────────────────────────────────────────────
# "vieneu" = VieNeu TTS (local) | "edge" = Edge TTS (miễn phí) | "vbee" = Vbee TTS
TTS_PROVIDER=vieneu

# ── VieNeu TTS (chỉ cần khi TTS_PROVIDER=vieneu) ────────────
VIENEU_API_URL=http://127.0.0.1:8001
VIENEU_VOICE=Minh Đức
VIENEU_SPEED=1.0
```

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `TTS_PROVIDER` | `vieneu` | Chọn provider sinh voiceover (`vieneu`, `edge`, hoặc `vbee`). |
| `VIENEU_API_URL` | `http://127.0.0.1:8001` | Địa chỉ server CIT Voice Studio TTS API đang chạy. |
| `VIENEU_VOICE` | `Minh Đức` | Tên giọng đọc (xem bảng bên dưới). |
| `VIENEU_SPEED` | `1.0` | Tốc độ đọc (1.0 = chuẩn, 1.1 = nhanh hơn 10%). |

---

## 3. Các API Endpoints

### 3.1. Kiểm tra trạng thái hệ thống

```http
GET /health
```

**Response mẫu (200 OK):**
```json
{
  "status": "ok",
  "message": "Sẵn sàng",
  "sample_rate": 48000,
  "engine": "VieNeu-TTS-v3-Turbo (int8)",
  "backend": "onnx",
  "precision": "int8",
  "device": "cpu"
}
```

### 3.2. Lấy danh sách giọng đọc

```http
GET /voices
```

Trả về mảng JSON chứa thông tin chi tiết từng giọng: `id`, `name`, `gender`, `region`, `description`.

### 3.3. Sinh Voiceover (Generate TTS)

```http
POST /api/tts/generate
Content-Type: application/json
```

**Body JSON:**
```json
{
  "text": "Chào mừng bạn đến với kênh so sánh kiến thức.",
  "voice_id": "Minh Đức",
  "speed": 1.0,
  "temperature": 0.7,
  "silence_duration": 0.2,
  "format": "mp3"
}
```

**Headers phản hồi quan trọng:**
- `Content-Type`: `audio/mpeg` (nếu `format: "mp3"`) hoặc `audio/wav`.
- `x-duration-seconds`: Thời lượng âm thanh tính bằng giây (ví dụ: `2.45`).
- `x-elapsed-seconds`: Thời gian xử lý của mô hình.

---

## 4. Danh sách giọng đọc có sẵn

| Tên giọng (`VIENEU_VOICE`) | Giới tính | Miền | Phong cách |
|---|---|---|---|
| **Minh Đức** *(Mặc định)* | Nam | Bắc | Phong cách tin tức · 48 kHz |
| **Phạm Tuyên** | Nam | Bắc | Phong cách tự nhiên · 48 kHz |
| **Thanh Bình** | Nam | Bắc | Phong cách kể chuyện · 48 kHz |
| **Trúc Ly** | Nữ | Bắc | Phong cách tự nhiên · 48 kHz |
| **Ngọc Linh** | Nữ | Bắc | Phong cách kể chuyện · 48 kHz |
| **Đoan Trang** | Nữ | Bắc | Phong cách tự nhiên · 48 kHz |
| **Mai Anh** | Nữ | Bắc | Phong cách tin tức · 48 kHz |
| **Quỳnh Anh** | Nữ | Bắc | Phong cách đọc truyện · 48 kHz |
| **Ngọc Huyền** | Nữ | Bắc | Giọng đọc tự nhiên · 48 kHz |
| **Thái Sơn** | Nam | Nam | Phong cách kể chuyện · 48 kHz |
| **Xuân Vĩnh** | Nam | Nam | Phong cách tự nhiên · 48 kHz |
| **Minh Triết** | Nam | Nam | Phong cách tin tức · 48 kHz |
| **Đức Trí** | Nam | Nam | Phong cách đọc truyện · 48 kHz |
| **Adam** | Nam | Nam | Giọng đọc tự nhiên · 48 kHz |
| **Thục Đoan** | Nữ | Nam | Phong cách kể chuyện · 48 kHz |
| **Thùy Dung** | Nữ | Nam | Phong cách tin tức · 48 kHz |
| **Mỹ Duyên** | Nữ | Nam | Phong cách đọc truyện · 48 kHz |
| **Kim Thanh** | Nữ | Nam | Phong cách đọc truyện · 48 kHz |
| **Quang Sơn** | Nam | Trung | Phong cách tự nhiên · 48 kHz |
| **Ngọc Trân** | Nữ | Trung | Phong cách tự nhiên · 48 kHz |

---

## 5. Thử nghiệm nhanh bằng Node.js

Chạy lệnh terminal từ thư mục bất kỳ:

```bash
node -e "fetch('http://127.0.0.1:8001/api/tts/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'Xin chào, đây là kiểm tra VieNeu TTS.', voice_id: 'Minh Đức', format: 'mp3' })
}).then(async r => {
  const fs = require('fs');
  fs.writeFileSync('test.mp3', Buffer.from(await r.arrayBuffer()));
  console.log('Đã tạo file test.mp3 thành công!');
})"
```
