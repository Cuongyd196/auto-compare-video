# Kịch bản 12 dòng + công thức timing

## Nhịp chuẩn (bất biến cho cả series)

```
hook(2) → nút thắt(1) → giải A(3) → giải B(3) → so sánh trực tiếp(2) → payoff(1)  = 12 dòng
```

Tổng mục tiêu **30-40s**. Năng lượng: mở punchy → một nhịp lặng ở câu hỏi → hai đoạn giải sâu
hơn → dwell chốt ≥1s.

| Dòng | Beat | Nội dung | Ghi chú |
|---|---|---|---|
| 1 | hook | "Đây là **A**" | tên A tô `--accent-cyan` |
| 2 | hook | "Đây là **B**" | tên B tô `--accent-cyan` |
| 3 | nút thắt | "Sự khác nhau là gì?" | không có `.kw` |
| 4 | giải A | định nghĩa A | |
| 5 | giải A | đặc điểm nổi bật của A | |
| 6 | giải A | 1 ví dụ thực tế / analogy về A | |
| 7 | giải B | định nghĩa B | |
| 8 | giải B | đặc điểm nổi bật của B | |
| 9 | giải B | 1 ví dụ thực tế / analogy về B | |
| 10 | so sánh trực tiếp | đối chiếu song song vế 1 | "Một bên X — một bên Y" |
| 11 | so sánh trực tiếp | đối chiếu song song vế 2 | |
| 12 | payoff | câu chốt ngắn, dễ nhớ | giữ khung hình tới hết |

Mỗi dòng nên **≤ 12-14 từ** để caption 64px không tràn quá 2 dòng trong khung 860px.

## Ví dụ kịch bản (Dev vs DevOps, mở rộng lên 12 dòng)

```
1.  Đây là DEV
2.  Đây là DEVOPS
3.  Sự khác nhau là gì?
4.  Dev là người viết CODE, xây dựng TÍNH NĂNG mới
5.  Họ biến ý tưởng thành sản phẩm chạy được trên máy mình
6.  Giống như kiến trúc sư dựng nên toà nhà
7.  DevOps đưa code đó lên SERVER, TỰ ĐỘNG HOÁ mọi thứ
8.  Và GIÁM SÁT để hệ thống không bao giờ sập
9.  Giống như ban quản lý giữ toà nhà luôn hoạt động
10. Một bên TẠO RA sản phẩm
11. Một bên GIỮ NÓ SỐNG giữa hàng triệu người dùng
12. Dev xây, DevOps vận hành!
```

## Công thức timing (đã kiểm chứng — dùng đúng, không tự nghĩ số khác)

```
start[1] = 0.55
start[n] = start[n-1] + dur[n-1] + gap(n-1 → n)

gap = 0.30 – 0.35s   nếu cùng beat        (1→2, 4→5, 5→6, 7→8, 8→9, 10→11)
gap = 0.40 – 0.45s   nếu chuyển beat      (2→3, 3→4, 6→7, 9→10, 11→12)

capOut(n)      = start[n] + dur[n] + 0.25        // buffer trước khi dòng thoát
ROOT_DURATION ≈ start[12] + dur[12] + 1.3       // outro hold, làm tròn
```

`dur[n]` là **thời lượng thật** từ `assets/vo/durations.json` (đo bằng `ffprobe` trong
`generate-vo.mjs`) — không ước lượng, không làm tròn trước khi cộng dồn.

### Ví dụ tính (số thật từ `videos/dev-vs-devops`, nhịp 8 dòng)

| n | dur | gap trước đó | start |
|---|---|---|---|
| 1 | 0.888 | — | 0.55 |
| 2 | 1.032 | 0.35 (cùng beat) | 1.788 |
| 3 | 1.224 | 0.45 (chuyển beat) | 3.27 |
| 4 | 2.184 | 0.40 (chuyển beat) | 4.894 |
| 5 | 2.112 | 0.30 (cùng beat) | 7.378 |
| 6 | 2.448 | 0.40 (chuyển beat) | 9.89 |
| 7 | 1.920 | 0.30 (cùng beat) | 12.638 |
| 8 | 3.432 | 0.40 (chuyển beat) | 14.958 |

`ROOT_DURATION = 14.958 + 3.432 + 1.3 ≈ 19.7` → làm tròn **19.9**.

Với 12 dòng và câu dài hơn, con số này sẽ tự nhiên rơi vào **30-40s**.

### Khi lệch khỏi 30-40s

- **Chưa đủ 30s** → **thêm câu / ví dụ** vào giải A, giải B, hoặc vòng so sánh trực tiếp.
  **Tuyệt đối không kéo giãn gap** để lấp thời gian — phá nhịp fast-cut của house style.
- **Vượt 40s** → cắt bớt câu, hoặc tăng `SPEED_RATE` trong `generate-vo.mjs` (mặc định `1.1`).

Nếu `AUTO_CREATE_VIDEO=0`, hỏi lại người dùng trước khi đổi nội dung để chỉnh độ dài.

## Phiên âm TTS cho từ tiếng Anh / thuật ngữ

Vbee đọc từ tiếng Anh theo âm Việt, thường sai. Sửa **chỉ trong `LINES` của
`scripts/generate-vo.mjs`** — caption trong `index.html` giữ chính tả gốc.

| Hiển thị trong caption | Text đưa vào TTS |
|---|---|
| DEV | Đép |
| DEVOPS | Đép Ốp |
| CODE | Cốt |
| SERVER | Xơ-vơ |
| API | A Pi Ai |
| AI | Ây Ai |
| CLOUD | Clao |
| RAM / ROM | Ram / Rôm |

Bảng này là ví dụ, không phải danh sách đóng — cứ sinh VO thử, nghe, rồi thêm phiên âm cho từ
nào đọc sai. Nếu `AUTO_CREATE_VIDEO=0`, hỏi người dùng nghe lại trước khi chốt.

## Giọng đọc

`VOICE_CODE = VBEE_VOICE_CODE || "n_hanoi_male_protrainer_education_vc"` — lấy từ `.env` ở root
repo. **Không hardcode** giọng khác trong script. Danh sách `voice_code` khác: `vbee.md` § 5.
