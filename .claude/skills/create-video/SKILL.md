---
name: create-video
description: >
  Tạo một video MỚI cho series "so sánh/phân biệt kiến thức" của repo này (TikTok/Reels
  30-40s, layout 3-zone cố định trong DESIGN.md). Dùng khi được yêu cầu "làm video so sánh
  X vs Y", "thêm video mới vào series", hoặc bất kỳ video nào theo format sẵn có của repo.
  Không dùng cho video ngoài format này — route qua /hyperframes như bình thường.
---

# New comparison video

Repo này là series nhiều video, mỗi video một thư mục độc lập dưới `videos/<slug>/` (xem
`../../../CLAUDE.md` § "Repo layout — multiple videos"). Skill này đóng gói lại đúng quy trình
đã dùng để tạo `videos/dev-vs-devops/` — video thứ hai của series — để lặp lại chính xác cho
video thứ ba, tư, v.v.

## Chế độ tự động (`AUTO_CREATE_VIDEO`)

Đọc biến `AUTO_CREATE_VIDEO` trong `.env` **chung ở root repo** ngay khi bắt đầu skill này:

- **`0` hoặc không có (mặc định)** — giữ nguyên toàn bộ các điểm dừng xác nhận mô tả trong
  "Quy trình" bên dưới: chốt nội dung/kịch bản ở bước 1, hỏi lại nếu phát âm TTS sai, hỏi lại
  nếu độ dài lệch khoảng 30–40s, và hỏi trước khi render (bước 9) vì đây là hành động tốn thời
  gian/chi phí.
- **`1`** — bỏ qua **tất cả** các điểm dừng xác nhận đó. Tự đề xuất và chốt luôn cặp khái niệm,
  kịch bản 12 dòng, icon; tự sinh VO và tự chấp nhận phát âm (chỉ sửa phiên âm nếu rõ ràng sai
  so với chính tả tiếng Việt thông thường, không hỏi lại); tự quyết định điều chỉnh nội dung nếu
  độ dài lệch khoảng 30–40s; chạy liên tục bước 1 → 9 (bao gồm render, xem bước 9) không dừng
  lại chờ phản hồi. Chỉ báo cáo kết quả (đường dẫn video render, README đã cập nhật) sau khi
  hoàn tất toàn bộ hoặc khi gặp lỗi cứng (VD: `npm run check` fail, TTS lỗi) không thể tự sửa.

## Đọc trước khi bắt đầu

- `../../../DESIGN.md` — hợp đồng layout/màu/font/motion 3-zone. **Không đổi**, chỉ đổi nội
  dung theo topic.
- `../../../videos/thien-thach-vs-sao-bang/index.html` — composition tham chiếu đầy đủ (CSS,
  cấu trúc HTML, GSAP timeline, helper `showLine`/`pose`/`headTilt`/`talk`). **Lưu ý**: 2 video
  đã có (`thien-thach-vs-sao-bang`, `dev-vs-devops`) là bản 8-dòng/15-20s cũ — chỉ copy cấu
  trúc CSS/HTML/helper từ đó, còn số dòng/nhịp beat thì dùng bản 12-dòng/30-40s mới (mục 1 và
  bước 4-5 dưới đây), không copy y nguyên 8 dòng.
- `../../../videos/thien-thach-vs-sao-bang/BRIEF.md` và
  `../../../videos/dev-vs-devops/BRIEF.md` — ví dụ brief đầy đủ + brief rút gọn.

## Quy trình

### 1. Chốt nội dung với người dùng trước khi code

Hỏi/xác nhận (đề xuất phương án trước, để người dùng chọn/sửa):

- Cặp khái niệm A vs B.
- Góc so sánh (1 câu) + kịch bản đúng 12 dòng theo nhịp chuẩn của series (30-40s, xem
  `../../../DESIGN.md` § Rhythm):
  1. Hook A ("Đây là A")
  2. Hook B ("Đây là B")
  3. Nút thắt ("Sự khác nhau là gì?")
  4–6. Giải A (3 dòng: định nghĩa, đặc điểm nổi bật, 1 ví dụ thực tế/analogy)
  7–9. Giải B (3 dòng: định nghĩa, đặc điểm nổi bật, 1 ví dụ thực tế/analogy)
  10–11. So sánh trực tiếp (2 dòng, đối chiếu song song 2 bên — beat mới trước payoff)
  12. Payoff (1 dòng, giữ khung hình tới hết — không thoát)
- Icon cho 2 card (mô tả bằng lời — sẽ vẽ CSS/SVG placeholder, không phụ thuộc ảnh ngoài, như
  terminal `</>` cho Dev hay vòng lặp vô cực cho DevOps).

**Phát âm TTS**: nếu kịch bản có từ tiếng Anh/thuật ngữ kỹ thuật (Dev, DevOps, AI, API...), sinh
thử VO trước rồi hỏi người dùng Vbee đọc có đúng không. Nếu sai, sửa lại phiên âm tiếng Việt
**chỉ trong text đưa vào TTS** (`scripts/generate-vo.mjs`) — caption hiển thị trong `index.html`
vẫn giữ chính tả gốc. Ví dụ đã áp dụng: "Dev" → "Đép", "DevOps" → "Đép Ốp".

### 2. Khởi tạo project

```bash
mkdir -p videos/<slug>
cd videos/<slug>
npx --yes hyperframes@0.7.58 init <slug> --example blank --resolution portrait --non-interactive --skip-transcribe
```

CLI lồng thêm một thư mục con trùng tên (`videos/<slug>/<slug>/`) — đẩy nội dung lên rồi xoá
thư mục rỗng:

```bash
mv <slug>/* <slug>/.[!.]* . 2>/dev/null; rmdir <slug>
```

Xoá `CLAUDE.md`/`AGENTS.md` mà `init` sinh ra trong thư mục video — trùng lặp với bản ở root
(Claude Code đọc CLAUDE.md phân cấp từ cwd lên root nên không cần bản riêng per-video).

Copy `videos/dev-vs-devops/scripts/sync-channel.mjs` sang `videos/<slug>/scripts/` **nguyên
văn, không sửa** — đọc `CHANNEL` từ `.env` chung ở root và ghi vào `#eyebrow` trong
`index.html`. Thêm vào `videos/<slug>/package.json`:

```json
"scripts": {
  "sync-channel": "node scripts/sync-channel.mjs",
  "predev": "npm run sync-channel",
  "precheck": "npm run sync-channel",
  "prerender": "npm run sync-channel",
  "prepublish": "npm run sync-channel"
}
```

(giữ nguyên các script `dev`/`check`/`render`/`publish` gốc — npm tự chạy `pre*` trước, không
cần gọi tay.)

### 3. Sinh VO

Copy `videos/thien-thach-vs-sao-bang/scripts/generate-vo.mjs` sang `videos/<slug>/scripts/`,
sửa:

- `LINES` — 12 dòng kịch bản đã chốt (áp dụng phiên âm TTS nếu cần, xem mục 1).
- Giữ nguyên cách tính `REPO_ROOT` (đọc `.env` **chung ở root repo**) — không tạo `.env` riêng
  cho video mới.
- Giữ nguyên `VOICE_CODE = VBEE_VOICE_CODE || "n_hanoi_male_protrainer_education_vc"` — giọng
  đọc lấy từ `VBEE_VOICE_CODE` trong `.env` root (xem `vbee.md` § 5 danh sách alias/voice_code
  khác), **không hardcode** giọng khác trực tiếp trong script.

```bash
node scripts/generate-vo.mjs
```

Đọc `assets/vo/durations.json` để lấy thời lượng thật từng dòng.

### 4. Tính timing

Dùng đúng công thức gap đã kiểm chứng (giữ nhịp giống hệt bản gốc), áp cho cấu trúc 12 dòng
(beat: hook=1-2, question=3, giải A=4-6, giải B=7-9, so-sánh-trực-tiếp=10-11, payoff=12):

- `start[1] = 0.55`
- Trong cùng một beat (1→2, 4→5, 5→6, 7→8, 8→9, 10→11): gap = 0.3–0.35s
- Chuyển sang beat khác (2→3, 3→4, 6→7, 9→10, 11→12): gap = 0.4–0.45s
- `capOut(n) = start[n] + dur[n] + 0.25` (buffer trước khi dòng thoát)
- `ROOT_DURATION ≈ start[12] + dur[12] + 1.3` (outro hold), làm tròn — phải rơi trong khoảng
  30–40s theo brief. Nếu tổng thời lượng tự nhiên chưa đạt 30s, **thêm câu/ví dụ** vào giải
  A/B hoặc vòng so sánh trực tiếp — không kéo giãn gap để lấp thời gian (phá nhịp fast-cut của
  house style). Nếu vượt 40s, cắt bớt câu hoặc tăng `speed_rate` của Vbee.

### 5. Dựng `index.html`

Copy cấu trúc từ `videos/thien-thach-vs-sao-bang/index.html` (giữ nguyên biến CSS `:root`,
`.card`, `.caption-line`/`.caption-line-text`, `.kw`, avatar `#arm-left`/`#arm-right`/`#mouth`,
toàn bộ helper JS `showLine`/`pose`/`headTilt`/`talk`/glow ambient, **và khối `@font-face` trong
`<head>`**). Chỉ đổi:

- `<title>`
- 2 icon card (con của `.card-icon`) — vẽ mới bằng CSS/SVG cho đúng khái niệm A/B
- text của `.card-label`
- 12 dòng `.caption-line` + span `.kw` (đỏ; riêng từ chủ đề ở 2 dòng hook dùng
  `style="color: var(--accent-gold)"` như bản gốc, không phải đỏ)
- `data-duration` của `#root`/`#scene`, 12 thẻ `<audio>` (`data-start`/`data-duration`), object
  `VO` trong script, và `ROOT_DURATION` — theo số đã tính ở bước 4.
- Timeline JS: nhân bản khối `showLine`/`talk` cho từng dòng theo beat mới (giải A/B giờ có
  3 lệnh `showLine` mỗi bên thay vì 2; thêm 1 beat `so-sánh-trực-tiếp` mới trước payoff, có thể
  tái dùng animation "active-side emphasis" — dim card không active — đang có sẵn).

**Cấu trúc mỗi dòng caption**: `.caption-line` (canh giữa, `display:flex`) bọc một
`.caption-line-text` con duy nhất chứa text + `<span class="kw">`:

```html
<div class="caption-line" id="line-4"><span class="caption-line-text">Windows là hệ điều hành của <span class="kw">MICROSOFT,</span> cài sẵn trên máy tính</span></div>
```

Lớp bọc `.caption-line-text` là bắt buộc — nếu text và `.kw` nằm trực tiếp trong `.caption-line`
(vốn là `display:flex`), trình duyệt sẽ tách chúng thành các flex-item riêng và mỗi item tự
word-wrap độc lập, vỡ thành các cột dọc thay vì xuống dòng bình thường khi caption đủ dài (dễ
gặp ở giải A/B hoặc so-sánh-trực-tiếp — các beat có câu dài hơn hook/nút thắt). Khi một dấu
phẩy/chấm/chấm than đứng ngay sau từ khoá, gộp nó vào trong `<span class="kw">` luôn (như
`MICROSOFT,` ở trên) — margin 8px hai bên của `.kw` tạo khoảng trống xấu nếu để dấu câu ra
ngoài. `showLine()` vẫn dùng `document.querySelectorAll(id + " .kw")` bình thường, không cần
đổi gì khi thêm lớp bọc này.

**Font — bắt buộc copy y nguyên, không tự viết lại:** khối `@font-face` cho "Be Vietnam Pro"
(900) và "JetBrains Mono" (700) trong `<head>`, và `font-family: "Be Vietnam Pro", sans-serif;`
ở rule `html, body`. Xem `../../../DESIGN.md` § Typography để hiểu lý do — Montserrat qua bundle
mặc định của compiler bị mất dấu tiếng Việt, phải nạp Be Vietnam Pro qua `@font-face` +
`unicode-range` tường minh (không dùng thẻ `<link>` Google Fonts, sẽ bị lint cảnh báo
`google_fonts_import`).

### 6. Viết `BRIEF.md`

Bản rút gọn (xem `videos/dev-vs-devops/BRIEF.md` làm mẫu) — chỉ `## Intent` (chủ đề + góc so
sánh), `## Assets` (icon, VO), `## Notes` (nhịp kịch bản). Trỏ sang `../../DESIGN.md` và brief
của video trước cho phần dùng chung — **không lặp lại** mô tả layout 3-zone.

### 7. Kiểm tra

```bash
npm run check
```

Sửa hết error/warning. Info-level `content_overlap` xuất hiện đúng lúc 2 dòng caption crossfade
(~50ms) là bình thường trong template này — xác nhận bằng cách chụp thêm 2 snapshot ở
ngay trước/sau thời điểm đó; nếu cả hai đều sạch (không đè chữ) thì không phải lỗi thật, không
cần sửa.

```bash
npx --yes hyperframes@0.7.58 snapshot . --frames 7
```

Xem `snapshots/contact-sheet.jpg` để review tổng thể trước khi báo hoàn thành.

### 8. Cập nhật README

Thêm một dòng vào danh sách "Các video hiện có" trong `../../README.md` (root).

### 9. Render

Nếu `AUTO_CREATE_VIDEO=0` (mặc định): hỏi người dùng có muốn render ngay bây giờ không (tốn
thời gian/tài nguyên) trước khi chạy.

Nếu `AUTO_CREATE_VIDEO=1`: chạy luôn, không hỏi.

```bash
npm run render
```

Xác nhận file video đã xuất hiện trong `renders/` trước khi báo hoàn thành.

## Không làm

- Không sửa `DESIGN.md` hay layout 3-zone cố định — mọi video trong series dùng chung nguyên
  vẹn.
- Không tạo `.env` riêng cho video mới — luôn dùng chung `.env` ở root.
- Không thêm `CLAUDE.md`/`AGENTS.md` riêng trong `videos/<slug>/`.
- Không tự ý đổi độ dài video ra ngoài khoảng 30–40s mà không hỏi lại người dùng.
- Không quên copy `scripts/sync-channel.mjs` + wiring `pre*` trong `package.json` (bước 2) —
  thiếu bước này thì `#eyebrow` sẽ đứng yên theo text tĩnh copy từ template thay vì đọc từ
  `CHANNEL` trong `.env`.
