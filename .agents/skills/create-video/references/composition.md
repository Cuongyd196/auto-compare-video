# Dựng `index.html` — quy tắc chi tiết

Project tham chiếu: `videos/dev-vs-devops/index.html` (đường dẫn tính từ root repo).
Copy nguyên cấu trúc, chỉ đổi những gì liệt kê ở mục "Đổi những gì" dưới đây.

## Giữ nguyên tuyệt đối (copy y nguyên, không viết lại)

- Khối `@font-face` trong `<head>` — 4 khối: "Be Vietnam Pro" 900 (2 subset:
  vietnamese + latin) và "JetBrains Mono" 700 (2 subset). Kèm `font-family: "Be Vietnam Pro",
  sans-serif` ở rule `html, body`.
- Biến CSS `:root` (bảng màu series).
- Toàn bộ rule `.card`, `.card-icon`, `.card-label`, `#vs-badge`, `.caption-line`,
  `.caption-line-text`, `.kw`, `#eyebrow`, `#ghost-word`, `#glow-top`, `#glow-bottom`,
  và toàn bộ avatar (`#avatar-host`, `#avatar-body`, `#arm-left`, `#arm-right`, `#mouth`,
  `#antenna`, mắt/visor).
- Helper JS: `showLine()`, `pose()`, `headTilt()`, `talk()`, và 2 tween ambient glow
  phase-opposed ở cuối timeline.
- Khai báo timeline: `gsap.timeline({ paused: true })` + `window.__timelines["main"] = tl;`
  ở cuối script.
- `<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>`.

### Vì sao font phải là `@font-face`, không phải `<link>`

Embed pre-bundled của compiler cho Be Vietnam Pro / JetBrains Mono chỉ phủ subset "latin",
làm mất glyph dấu tiếng Việt dựng sẵn (U+1EA0-1EF9) → chữ vỡ dấu. Dùng `<link>` Google Fonts
thì bị lint cảnh báo `google_fonts_import`. Để trống `font-family` mà không `@font-face` thì
âm thầm fallback về embed thiếu subset. Xem `DESIGN.md` § Typography.

## Bảng màu keyword — dùng đúng token

| Vai trò | Cách viết |
|---|---|
| Từ khoá "sự khác nhau" (mặc định của `.kw`) | `<span class="kw">TỪ KHOÁ</span>` → tự nhận `--accent-pink` (`#ff4fa3`) |
| Tên khái niệm ở 2 dòng hook (line-1, line-2) | `<span class="kw" style="color: var(--accent-cyan)">DEV</span>` (`#37e6c4`) |

Quy tắc màu là một phần của việc dạy người xem nhìn vào đâu: **hồng = điểm khác biệt,
lục lam = tên khái niệm**. Không đảo, không thêm màu thứ ba.

## Cấu trúc mỗi dòng caption — lớp bọc là BẮT BUỘC

```html
<div class="caption-line" id="line-4"><span class="caption-line-text">Windows là hệ điều hành của <span class="kw">MICROSOFT,</span> cài sẵn trên máy tính</span></div>
```

- `.caption-line` là `display: flex`. Nếu text và `.kw` nằm **trực tiếp** trong nó, trình duyệt
  tách chúng thành các flex-item riêng, mỗi item tự word-wrap độc lập → caption vỡ thành các
  cột dọc thay vì xuống dòng bình thường. Luôn bọc trong **một** `.caption-line-text` duy nhất.
  Lỗi này hay gặp ở beat giải A/B và so-sánh-trực-tiếp (câu dài hơn hook).
- Dấu câu (`,` `.` `!`) đứng ngay sau từ khoá thì **gộp vào trong** `<span class="kw">` (như
  `MICROSOFT,` ở trên) — `.kw` có margin 8px hai bên, để dấu câu ra ngoài sẽ hở khoảng trống xấu.
- `showLine()` dùng `document.querySelectorAll(id + " .kw")` nên vẫn hoạt động bình thường với
  lớp bọc này, không cần sửa helper.

## Đổi những gì

1. `<title>` — `So sánh kiến thức — A vs B`
2. **2 icon card** (con của `.card-icon`) — vẽ mới bằng CSS/SVG inline cho đúng khái niệm A/B.
   Không dùng ảnh ngoài / không fetch. Icon dùng offset pixel cố định phải kiểm tra lại tràn
   khi đổi; icon dùng grid `place-items: center` thì tự thích ứng.
3. `.card-label` — tên khái niệm A / B.
4. **12 dòng** `.caption-line` với `id="line-1"` … `id="line-12"` (template gốc chỉ có 8 — phải
   thêm 4 dòng).
5. `data-duration` của `#root` và `#scene` = `ROOT_DURATION`.
6. **12 thẻ `<audio>`** `id="vo-1"` … `id="vo-12"`, `src="assets/vo/line-N.mp3"`, kèm
   `data-start` / `data-duration` (số thật từ `assets/vo/durations.json`) và
   `data-track-index="20"`.
7. Object `VO` trong script — 12 entry `{ start, dur }`, trùng khớp từng số với thẻ `<audio>`.
8. `const ROOT_DURATION = <số đã tính>;`
9. **Timeline JS** — nhân bản khối `showLine` / `talk` / `pose` theo nhịp 12 dòng (xem dưới).

## Timeline theo nhịp 12 dòng

Template gốc có 5 beat cho 8 dòng. Bản 12 dòng có **6 beat**:

```js
const capOut = (n) => VO[n].start + VO[n].dur + 0.25;

// BEAT 1: HOOK (line 1-2) — pose chỉ trái rồi chỉ phải
pose(115, -8, VO[1].start, 0.3);   showLine("#line-1", VO[1].start, capOut(1));  talk(...);
pose(8, -115, VO[2].start, 0.3);   showLine("#line-2", VO[2].start, capOut(2));  talk(...);

// BEAT 2: NÚT THẮT (line 3) — shrug + headTilt, trả tilt về 0 ở capOut(3)
pose(55, -55, VO[3].start, 0.35);  headTilt(6, VO[3].start, 0.35);
showLine("#line-3", VO[3].start, capOut(3));  talk(...);  headTilt(0, capOut(3), 0.3);

// BEAT 3: GIẢI A (line 4-5-6) — active-side emphasis: card-left sáng, card-right dim
tl.to("#card-left",  { scale: 1.05, opacity: 1,    duration: 0.4, ease: "power2.out" }, VO[4].start);
tl.to("#card-right", { scale: 0.96, opacity: 0.55, duration: 0.4, ease: "power2.out" }, VO[4].start);
pose(75, -8, VO[4].start, 0.3);
// 3 lệnh showLine + talk cho line 4, 5, 6

// BEAT 4: GIẢI B (line 7-8-9) — đảo emphasis sang card-right
// 3 lệnh showLine + talk cho line 7, 8, 9

// BEAT 5: SO SÁNH TRỰC TIẾP (line 10-11) — BEAT MỚI, không có trong template 8 dòng.
// Trả cả 2 card về full opacity/scale 1 (đối chiếu song song, không bên nào được ưu tiên),
// có thể nhấp nháy nhẹ luân phiên 2 card theo 2 dòng. 2 lệnh showLine + talk.

// BEAT 6: PAYOFF (line 12) — cả 2 card scale 1 / opacity 1, pose neutral (8, -8),
// avatar-body punch nhẹ (yoyo repeat 1), verdict badge pop:
tl.fromTo("#verdict-left",  { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "power3.out" }, VO[12].start + 0.15);
tl.fromTo("#verdict-right", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "power3.out" }, VO[12].start + 0.25);
showLine("#line-12", VO[12].start, null); // null = giữ tới hết, KHÔNG thoát
talk(VO[12].start, VO[12].start + VO[12].dur);
```

- Dòng payoff luôn truyền `null` cho tham số exit → giữ khung hình tới hết video.
- Mỗi dòng caption **chỉ một dòng hiện tại một thời điểm** — không animate từng chữ (đây là
  format fast-cut, không phải lyric video).
- Không dùng shader transition — cả video là **một scene liên tục**, các beat là phase change
  trên cùng một timeline.

## Quy tắc HyperFrames không được phá

1. Mọi element có timing cần `data-start`, `data-duration`, `data-track-index`.
2. Element có timing **phải** có `class="clip"`.
3. Timeline phải `paused: true` và đăng ký vào `window.__timelines["main"]`.
4. Chỉ logic tất định — **không** `Math.random()`, `Date.now()`, network fetch.

## Sau khi dựng xong

Đừng sửa `#eyebrow` bằng tay — `scripts/sync-channel.mjs` tự ghi `CHANNEL` từ `.env` root vào
đó trước mỗi lần `dev` / `check` / `render` / `publish`.
