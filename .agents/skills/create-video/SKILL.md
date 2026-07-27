---
name: create-video
description: >
  Tạo một video MỚI cho series "so sánh / phân biệt kiến thức" của repo này — clip dọc
  TikTok/Reels/Shorts 30-40s, layout 3-zone cố định theo DESIGN.md, voiceover tiếng Việt
  sinh bằng Vbee TTS, dựng bằng HyperFrames. Dùng skill này khi người dùng nói "làm video
  so sánh X vs Y", "phân biệt X và Y", "thêm video mới vào series", "tạo video so sánh
  kiến thức", hoặc yêu cầu bất kỳ video nào theo đúng format sẵn có của repo (thư mục
  videos/<slug>/). KHÔNG dùng cho video ngoài format này (promo sản phẩm, video từ URL,
  slideshow, thêm phụ đề cho footage có sẵn).
---

# Tạo video so sánh mới

## Mục tiêu

Sinh ra một thư mục `videos/<slug>/` hoàn chỉnh, tự chạy được (`npm run check` sạch,
`npm run render` ra MP4), theo đúng layout/nhịp cố định của series: 2 card khái niệm ở nửa
trên, caption chạy từng dòng ở giữa, avatar robot MC ở nửa dưới; kịch bản 12 dòng, tổng
30-40s, voiceover Vbee TTS đo thời lượng thật để khớp animation.

Mỗi video là một project HyperFrames độc lập. **Chỉ đổi nội dung — không đổi layout.**

## Bối cảnh repo (đọc trước khi làm)

Mọi đường dẫn dưới đây tính từ **root repo** (thư mục chứa `DESIGN.md` và `videos/`):

| File | Vai trò |
|---|---|
| `DESIGN.md` | Hợp đồng layout / màu / font / motion 3-zone. **Bất biến** cho cả series. |
| `AGENTS.md` | Quy tắc chung của project HyperFrames (data-attributes, `class="clip"`, timeline paused…). |
| `vbee.md` | Tài liệu Vbee TTS API + danh sách `voice_code`. |
| `.env` (root, **dùng chung**) | `VBEE_APP_ID`, `VBEE_ACCESS_TOKEN`, `VBEE_VOICE_CODE`, `CHANNEL`, `AUTO_CREATE_VIDEO`. Mẫu: `.env.example`. |
| `videos/dev-vs-devops/` | **Project tham chiếu chính** — copy CSS/HTML/helper/scripts từ đây. |
| `videos/thien-thach-vs-sao-bang/` | Video đầu tiên + `BRIEF.md` bản đầy đủ. |

> ⚠️ Cả 2 video đã có đều là bản **8 dòng / 15-20s** thế hệ cũ. Chỉ copy **cấu trúc**
> (CSS, HTML skeleton, helper JS, `@font-face`) từ chúng — còn **số dòng và nhịp beat phải
> dùng bản 12 dòng / 30-40s** ở bước 1 và 4 dưới đây. Không copy y nguyên 8 dòng.

**Mọi lệnh `npm run *` chạy với cwd = `videos/<slug>/`**, không phải root repo.

## Chế độ tự động (`AUTO_CREATE_VIDEO`)

Đọc `AUTO_CREATE_VIDEO` trong `.env` ở root repo **ngay khi bắt đầu**:

- **`0` / không có (mặc định)** — giữ nguyên các điểm dừng xác nhận: chốt kịch bản (bước 1),
  hỏi lại nếu phát âm TTS sai, hỏi lại nếu tổng thời lượng lệch ngoài 30-40s, và hỏi trước
  khi render (bước 9 — tốn thời gian/tài nguyên).
- **`1`** — bỏ qua **tất cả** điểm dừng đó. Tự đề xuất và chốt luôn cặp khái niệm, kịch bản
  12 dòng, icon; tự sinh VO và tự chấp nhận phát âm (chỉ sửa phiên âm khi rõ ràng sai so với
  chính tả tiếng Việt thông thường); tự điều chỉnh nội dung nếu lệch 30-40s; chạy liên tục
  bước 1 → 9 kể cả render. Chỉ báo cáo khi xong toàn bộ, hoặc khi gặp lỗi cứng không tự sửa
  được (`npm run check` fail, TTS lỗi).

## Quy trình

### 1. Chốt nội dung trước khi code

Đề xuất phương án trước rồi để người dùng chọn/sửa (hoặc tự chốt nếu `AUTO_CREATE_VIDEO=1`):

- **Cặp khái niệm A vs B** và `slug` kebab-case (ví dụ `dev-vs-devops`, `ram-vs-rom`).
- **Góc so sánh** (1 câu) + **kịch bản đúng 12 dòng** theo nhịp chuẩn:

  | Dòng | Beat | Nội dung |
  |---|---|---|
  | 1-2 | hook | "Đây là A" / "Đây là B" |
  | 3 | nút thắt | "Sự khác nhau là gì?" |
  | 4-6 | giải A | định nghĩa → đặc điểm nổi bật → 1 ví dụ thực tế / analogy |
  | 7-9 | giải B | định nghĩa → đặc điểm nổi bật → 1 ví dụ thực tế / analogy |
  | 10-11 | so sánh trực tiếp | đối chiếu song song 2 bên (beat mới trước payoff) |
  | 12 | payoff | 1 dòng chốt, giữ khung hình tới hết — không thoát |

- **Icon 2 card** (mô tả bằng lời — sẽ vẽ CSS/SVG placeholder, **không** phụ thuộc ảnh ngoài;
  ví dụ terminal `</>` cho Dev, vòng lặp vô cực cho DevOps).

**Phát âm TTS**: nếu kịch bản có từ tiếng Anh / thuật ngữ (Dev, DevOps, AI, API, Cloud…), sinh
thử VO trước rồi hỏi người dùng Vbee đọc có đúng không. Nếu sai, sửa phiên âm tiếng Việt
**chỉ trong text đưa vào TTS** (`scripts/generate-vo.mjs`) — caption trong `index.html` vẫn giữ
chính tả gốc. Đã áp dụng: "Dev" → "Đép", "DevOps" → "Đép Ốp".

Chi tiết mẫu kịch bản + bảng phiên âm: `references/script-and-timing.md`.

### 2. Khởi tạo project

Chạy script scaffold của skill này (từ **bất kỳ** thư mục nào trong repo):

```bash
node .agents/skills/create-video/scripts/scaffold.mjs <slug>
```

Script làm hộ toàn bộ phần cơ học, dễ sai nếu làm tay:

1. `hyperframes init` với `--example blank --resolution portrait --non-interactive --skip-transcribe`
2. Gỡ thư mục con lồng trùng tên mà CLI sinh ra (`videos/<slug>/<slug>/`)
3. Xoá `CLAUDE.md` / `AGENTS.md` mà `init` sinh ra trong thư mục video (trùng với bản ở root)
4. Copy `scripts/sync-channel.mjs` + `scripts/generate-vo.mjs` từ project tham chiếu
5. Nối các npm script `sync-channel` + hook `predev` / `precheck` / `prerender` / `prepublish`
   vào `package.json`

Nếu script lỗi hoặc môi trường không cho chạy, xem `references/scaffold-manual.md` để làm tay
đúng từng bước.

### 3. Sinh voiceover

Sửa `videos/<slug>/scripts/generate-vo.mjs`:

- `LINES` — 12 dòng kịch bản đã chốt (áp phiên âm TTS nếu cần, xem bước 1).
- **Giữ nguyên** cách tính `REPO_ROOT` (đọc `.env` **dùng chung ở root**) — không tạo `.env`
  riêng cho video mới.
- **Giữ nguyên** `VOICE_CODE = VBEE_VOICE_CODE || "n_hanoi_male_protrainer_education_vc"` —
  giọng đọc lấy từ `.env`, **không hardcode** giọng khác trong script.

```bash
cd videos/<slug>
node scripts/generate-vo.mjs
```

Đọc `assets/vo/durations.json` để lấy thời lượng thật từng dòng.

### 4. Tính timing

Dùng đúng công thức gap đã kiểm chứng (giữ nhịp giống bản gốc), áp cho 12 dòng:

- `start[1] = 0.55`
- Trong cùng một beat (1→2, 4→5, 5→6, 7→8, 8→9, 10→11): gap = **0.3-0.35s**
- Chuyển beat (2→3, 3→4, 6→7, 9→10, 11→12): gap = **0.4-0.45s**
- `capOut(n) = start[n] + dur[n] + 0.25` (buffer trước khi dòng thoát)
- `ROOT_DURATION ≈ start[12] + dur[12] + 1.3` (outro hold), làm tròn — **phải rơi trong
  30-40s**.

Nếu tổng chưa đạt 30s: **thêm câu / ví dụ** vào giải A/B hoặc vòng so sánh trực tiếp —
**không** kéo giãn gap để lấp thời gian (phá nhịp fast-cut của house style). Nếu vượt 40s:
cắt câu hoặc tăng `speed_rate` của Vbee.

Ví dụ tính đầy đủ: `references/script-and-timing.md`.

### 5. Dựng `index.html`

Copy cấu trúc từ `videos/dev-vs-devops/index.html`, **giữ nguyên**: biến CSS `:root`, `.card`,
`.caption-line` / `.caption-line-text`, `.kw`, avatar `#arm-left` / `#arm-right` / `#mouth`,
toàn bộ helper JS `showLine` / `pose` / `headTilt` / `talk` / glow ambient, **và khối
`@font-face` trong `<head>`**.

Chỉ đổi: `<title>`, 2 icon card, `.card-label`, 12 dòng `.caption-line`, `data-duration` của
`#root` / `#scene`, 12 thẻ `<audio>`, object `VO`, `ROOT_DURATION`, và timeline JS (nhân bản
khối `showLine` / `talk` theo nhịp 12 dòng).

Quy tắc chi tiết bắt buộc đọc trước khi viết HTML — cấu trúc caption, màu keyword, font,
icon, timeline: **`references/composition.md`**.

### 6. Viết `BRIEF.md`

Bản rút gọn (mẫu: `videos/dev-vs-devops/BRIEF.md`) — chỉ `## Intent` (chủ đề + góc so sánh),
`## Assets` (icon, VO), `## Notes` (nhịp kịch bản). Trỏ sang `../../DESIGN.md` và brief của
video trước cho phần dùng chung — **không lặp lại** mô tả layout 3-zone.

### 7. Kiểm tra

```bash
cd videos/<slug>
npm run check
```

Sửa hết error/warning. Info-level `content_overlap` xuất hiện đúng lúc 2 dòng caption crossfade
(~50ms) là bình thường trong template này — xác nhận bằng cách chụp thêm 2 snapshot ngay
trước/sau thời điểm đó; nếu cả hai đều sạch (không đè chữ) thì không phải lỗi thật.

```bash
npx --yes hyperframes@0.7.58 snapshot . --frames 7
```

Xem `snapshots/contact-sheet.jpg` để review tổng thể trước khi báo hoàn thành.

> `npm run dev` là **server chạy dài**, không phải lệnh one-shot — chạy nền, đừng chạy foreground
> rồi chờ nó kết thúc.

### 8. Cập nhật README

Thêm một dòng vào bảng "Các video hiện có trong repo" ở `README.md` (root). Nếu `README.EN.md`
có bảng tương ứng, cập nhật cả hai.

### 9. Render

Nếu `AUTO_CREATE_VIDEO=0`: hỏi người dùng có render ngay không. Nếu `=1`: chạy luôn.

```bash
cd videos/<slug>
npm run render
```

Xác nhận file MP4 đã xuất hiện trong `renders/` trước khi báo hoàn thành.

## Ví dụ

**Input:** "Làm video so sánh RAM vs ROM"

**Output mong đợi:**

```
videos/ram-vs-rom/
├── BRIEF.md                    # intent + assets + notes (rút gọn)
├── index.html                  # 12 caption line, 12 <audio>, ROOT_DURATION ≈ 34
├── package.json                # có sync-channel + hook pre*
├── assets/vo/line-1..12.mp3
├── assets/vo/durations.json
├── scripts/generate-vo.mjs     # LINES = 12 dòng RAM vs ROM
├── scripts/sync-channel.mjs    # copy nguyên văn
└── renders/ram-vs-rom.mp4
```

Cộng thêm: 1 dòng mới trong bảng video của `README.md`.

**Input:** "Làm video giới thiệu sản phẩm SaaS của tôi từ landing page này"
→ **Không** thuộc skill này (không phải format so sánh 3-zone). Báo lại cho người dùng và dùng
workflow HyperFrames chung.

## Ràng buộc — KHÔNG làm

- **Không** sửa `DESIGN.md` hay layout 3-zone — mọi video trong series dùng chung nguyên vẹn.
- **Không** tạo `.env` riêng cho video mới — luôn dùng `.env` ở root repo.
- **Không** commit `.env` hay in `VBEE_ACCESS_TOKEN` ra output/log.
- **Không** thêm `CLAUDE.md` / `AGENTS.md` riêng trong `videos/<slug>/`.
- **Không** đổi độ dài ra ngoài 30-40s mà không hỏi lại (trừ khi `AUTO_CREATE_VIDEO=1`).
- **Không** quên `scripts/sync-channel.mjs` + wiring `pre*` trong `package.json` (bước 2) —
  thiếu là `#eyebrow` đứng yên theo text tĩnh copy từ template thay vì đọc `CHANNEL` từ `.env`.
- **Không** dùng `<link>` Google Fonts (lint `google_fonts_import`) hay bỏ trống `@font-face` —
  dấu tiếng Việt sẽ vỡ.
- **Không** dùng `Math.random()` / `Date.now()` / network fetch trong composition — render phải
  tất định.
- **Không** hardcode `voice_code` hay `CHANNEL` trực tiếp trong script/HTML.
