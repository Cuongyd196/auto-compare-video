# `create-video` — skill cho Google Antigravity

Bản chuyển đổi của skill Claude Code [`.claude/skills/create-video/`](../../../.claude/skills/create-video/)
sang định dạng skill của **Antigravity / Antigravity CLI**.

## Cấu trúc

```
.agents/skills/create-video/
├── SKILL.md                        ← định nghĩa skill (frontmatter + hướng dẫn)
├── scripts/
│   └── scaffold.mjs                ← tự khởi tạo videos/<slug>/ (bước 2 của quy trình)
└── references/
    ├── script-and-timing.md        ← kịch bản 12 dòng + công thức timing + phiên âm TTS
    ├── composition.md              ← quy tắc dựng index.html (caption, màu, font, timeline)
    └── scaffold-manual.md          ← khởi tạo bằng tay khi scaffold.mjs không chạy được
```

## Cài đặt

Skill đã nằm sẵn ở **project scope** — clone repo này về là Antigravity tự nhận, không cần
làm gì thêm. Kiểm tra bằng cách hỏi trong Antigravity: *"What skills are available?"* (hoặc
`/skills` trong Antigravity CLI).

Muốn dùng cho **mọi project** (global scope), copy thư mục này vào:

| Sản phẩm | Đường dẫn |
|---|---|
| Antigravity (tất cả product) | `~/.gemini/config/skills/create-video/` |
| Antigravity CLI | `~/.gemini/antigravity-cli/skills/create-video/` |

```bash
# macOS / Linux
mkdir -p ~/.gemini/config/skills && cp -r .agents/skills/create-video ~/.gemini/config/skills/
```

```powershell
# Windows
New-Item -ItemType Directory -Force "$HOME\.gemini\config\skills"
Copy-Item -Recurse ".agents\skills\create-video" "$HOME\.gemini\config\skills\"
```

> Lưu ý khi cài global: skill vẫn cần **repo này** làm nguồn (DESIGN.md, video tham chiếu,
> `.env`). `scripts/scaffold.mjs` tự dò root repo bằng cách đi ngược từ thư mục hiện tại lên
> tới thư mục có cả `DESIGN.md` và `videos/` — nên hãy mở Antigravity **bên trong repo**, hoặc
> truyền `--repo-root <đường-dẫn>`.

## Dùng

Không cần gõ tên skill — Antigravity so khớp ngữ nghĩa với `description` trong `SKILL.md`. Cứ
nói bình thường:

```
Làm video so sánh RAM và ROM
Thêm video mới vào series: HTTP vs HTTPS
Phân biệt Frontend với Backend
```

Muốn chạy hết quy trình tới lúc render xong mà không bị hỏi lại từng bước: đặt
`AUTO_CREATE_VIDEO=1` trong `.env` ở root repo.

## Khác gì so với bản Claude Code

| | Claude Code | Antigravity |
|---|---|---|
| Vị trí | `.claude/skills/create-video/` | `.agents/skills/create-video/` |
| Gọi skill | `/create-video <chủ đề>` | so khớp ngữ nghĩa từ câu nói tự nhiên |
| Bước 2 (khởi tạo) | mô tả từng lệnh để agent chạy tay | `scripts/scaffold.mjs` chạy hộ |
| Chi tiết dài | nằm hết trong SKILL.md | tách ra `references/` (nạp khi cần) |
| Phụ thuộc | các skill `/hyperframes*` của Claude Code | tự chứa — chỉ cần HyperFrames CLI qua `npx` |

Hai bản giữ **cùng một quy trình 9 bước** và cùng hợp đồng thiết kế trong `DESIGN.md`, nên
video sinh ra từ Antigravity hay Claude Code là giống nhau.
