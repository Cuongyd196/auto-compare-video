# Khởi tạo project bằng tay (fallback khi `scripts/scaffold.mjs` không chạy được)

Chạy từ root repo. Thay `<slug>` bằng slug thật (ví dụ `ram-vs-rom`).

## 1. `hyperframes init`

```bash
mkdir -p videos/<slug>
cd videos/<slug>
npx --yes hyperframes@0.7.58 init <slug> --example blank --resolution portrait --non-interactive --skip-transcribe
```

> Phiên bản `0.7.58` là bản đang pin cho cả series (xem npm script trong
> `videos/dev-vs-devops/package.json`). Đừng đổi lẻ cho một video.

## 2. Gỡ thư mục con lồng trùng tên

CLI tạo thêm một thư mục con trùng tên (`videos/<slug>/<slug>/`) — đẩy nội dung lên một cấp
rồi xoá thư mục rỗng:

```bash
# bash / git bash
mv <slug>/* <slug>/.[!.]* . 2>/dev/null; rmdir <slug>
```

```powershell
# PowerShell
Get-ChildItem -Force ".\<slug>" | Move-Item -Destination "."
Remove-Item ".\<slug>"
```

## 3. Xoá `CLAUDE.md` / `AGENTS.md` per-video

`init` sinh 2 file này trong thư mục video — trùng lặp với bản ở root repo (agent đọc file
hướng dẫn phân cấp từ cwd lên root nên không cần bản riêng cho từng video).

```bash
rm -f CLAUDE.md AGENTS.md
```

## 4. Copy 2 script dùng chung

```bash
cp ../dev-vs-devops/scripts/sync-channel.mjs scripts/
cp ../dev-vs-devops/scripts/generate-vo.mjs  scripts/
```

- `sync-channel.mjs` — copy **nguyên văn, không sửa**. Nó đọc `CHANNEL` từ `.env` ở root repo
  và ghi vào `#eyebrow` trong `index.html`.
- `generate-vo.mjs` — sẽ sửa `LINES` ở bước 3 của skill; giữ nguyên `REPO_ROOT` và `VOICE_CODE`.

## 5. Nối npm script vào `package.json`

Thêm vào object `scripts` (giữ nguyên `dev` / `check` / `render` / `publish` gốc — npm tự chạy
hook `pre*` trước, không cần gọi tay):

```json
"scripts": {
  "sync-channel": "node scripts/sync-channel.mjs",
  "predev": "npm run sync-channel",
  "precheck": "npm run sync-channel",
  "prerender": "npm run sync-channel",
  "prepublish": "npm run sync-channel"
}
```

Kết quả cuối cùng phải giống `videos/dev-vs-devops/package.json`.

## Kiểm tra nhanh

```bash
ls              # → hyperframes.json  index.html  meta.json  package.json  assets/  scripts/
npm run sync-channel   # → "Synced #eyebrow to CHANNEL=..."  (hoặc "already matches")
```

Nếu `sync-channel` báo `Missing CHANNEL in .env`: copy `.env.example` ở root repo thành `.env`
và điền giá trị. Nếu báo `No element with id="eyebrow" found`: bình thường ở bước này —
`index.html` blank chưa có `#eyebrow`, sẽ hết sau khi dựng xong ở bước 5 của skill.
