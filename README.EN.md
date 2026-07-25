# Knowledge Comparison Video Generator — Comparison Video Template

**A short-form educational video template (TikTok/Reels/Shorts)** built on **[HyperFrames](https://hyperframes.heygen.com)** — each video compares a pair of commonly confused concepts, following one fixed layout/pace, only the content changes.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![Built with HyperFrames](https://img.shields.io/badge/built%20with-HyperFrames-111827)
![PRs welcome](https://img.shields.io/badge/PRs-welcome-ff4fa3.svg)

## Table of Contents

- [Preview](#-preview)
- [Videos in this repo](#videos-in-this-repo)
- [Key Features](#-key-features)
- [Color Palette & Design](#-color-palette--design)
- [Repo Structure](#-repo-structure)
- [Requirements](#️-requirements)
- [Getting Started](#-getting-started)
- [Contributing](#-contributing)
- [See Also](#-see-also)
- [License](#-license)

## 🎬 Preview

| Meteorite vs Meteor | Dev vs DevOps |
| --- | --- |
| ![Preview Meteorite vs Meteor](docs/previews/thien-thach-vs-sao-bang.png) | ![Preview Dev vs DevOps](docs/previews/dev-vs-devops.png) |

Live screenshots taken from the current composition (`hyperframes snapshot`) — the purple-pink-cyan
color palette and 2D robot avatar are the **current default** look for the whole series (see
[Color Palette & Design](#-color-palette--design)).

A few short published TikTok/Reels/Shorts demo videos:

| Demo 1 | Demo 2 |
| --- | --- |
| [![Watch demo 1 on YouTube Shorts](https://img.youtube.com/vi/jXZApHHXl0w/hqdefault.jpg)](https://youtube.com/shorts/jXZApHHXl0w?feature=share) | [![Watch demo 2 on YouTube Shorts](https://img.youtube.com/vi/8ZfXTse5HFw/hqdefault.jpg)](https://youtube.com/shorts/8ZfXTse5HFw) |
| ▶️ **[youtube.com/shorts/jXZApHHXl0w](https://youtube.com/shorts/jXZApHHXl0w?feature=share)** | ▶️ **[youtube.com/shorts/8ZfXTse5HFw](https://youtube.com/shorts/8ZfXTse5HFw)** |

## Videos in this repo

| Video | Topic | Folder |
|---|---|---|
| Meteorite vs Meteor | Meteorite vs Meteor | [`videos/thien-thach-vs-sao-bang/`](videos/thien-thach-vs-sao-bang/) |
| Dev vs DevOps | "Dev builds, DevOps operates" | [`videos/dev-vs-devops/`](videos/dev-vs-devops/) |

## 📌 Key Features

- **Standardized 3-part layout** (see details in [`DESIGN.md`](DESIGN.md)):
  1. **Top half** — 2 illustration cards placed side by side with CSS/SVG (concept A on the left, B on the right).
  2. **Middle section** — animated running caption, highlighting key words with a preset color.
  3. **Bottom half** — a 2D robot MC avatar with 4 poses (point left, point right, curious shrug,
     explain), mouth/eyes LEDs blink in sync with the narration's rhythm.
- **Automatic voiceover** — integrates the **Vbee TTS API**, uses `ffprobe` to measure each sentence's real duration to sync GSAP animation down to the millisecond (no guesswork).
- **Proper Vietnamese font** — Be Vietnam Pro embedded via `@font-face` + `unicode-range`, no diacritic rendering issues like with a compiler's default font.
- **Many videos, one template** — each video is an independent HyperFrames project under `videos/`, sharing the same design/credentials, easy to clone for a new topic.

## 🎨 Color Palette & Design

The full layout/color/font/motion contract lives in [`DESIGN.md`](DESIGN.md) — every video in the
series must follow this exact color palette and 3-zone structure to keep the series visually consistent.

| Token | Hex | Role |
| --- | --- | --- |
| `--bg` | `#0D0A1A` | Main background (purple-tinted black) |
| `--panel` | `#17122C` | Illustration card background |
| `--panel-edge` | `#2B2350` | Card / robot border |
| `--fg` | `#F3F1FF` | Primary text |
| `--fg-dim` | `#9089B0` | Secondary text / labels |
| `--accent-pink` | `#FF4FA3` | Highlighted keywords, robot eyes/mouth |
| `--accent-cyan` | `#37E6C4` | Topic name, robot head, chest light |

## 📁 Repo Structure

```
comparison-video/
├── README.md, LICENSE                ← you are here
├── CLAUDE.md, AGENTS.md               ← guidance for AI coding agents (Claude Code, Cursor...)
├── DESIGN.md                          ← layout/color/font/motion contract — shared by every video
├── vbee.md                            ← Vbee TTS API documentation
├── docs/previews/                     ← static preview images used in the README
├── .env                                ← shared Vbee credentials (create yourself, not committed)
├── .claude/skills/create-video/       ← Claude Code skill: create a new video following the template
└── videos/
    ├── thien-thach-vs-sao-bang/       ← 1 video = 1 independent HyperFrames project
    │   ├── package.json, hyperframes.json, meta.json, index.html
    │   ├── BRIEF.md                    ← this video's own brief
    │   ├── assets/vo/*.mp3, durations.json
    │   ├── scripts/generate-vo.mjs
    │   └── renders/, snapshots/        ← output, not committed
    ├── dev-vs-devops/                 ← same structure
    └── <new-video>/                   ← add new videos here
```

Each video under `videos/` is a **fully independent** HyperFrames project (its own `npm run dev/check/render/publish`), only sharing the root `.env` Vbee credentials and the design rules in `DESIGN.md`.

## 🛠️ Requirements
1. An AI coding agent (Claude Code, Cursor, Codex, etc.) to invoke the automated video-creation skill.
2. A **[Vbee TTS](https://vbee.vn/ref/5GTJ9TGU)** account (App ID + Access Token) to generate narration (other TTS providers can be integrated if desired).
3. **Node.js** ≥ 18
4. **FFmpeg & FFprobe** on your `PATH` — needed to measure audio duration and render video


## 🚀 Getting Started

### 1. Set up credentials (shared across all videos)

Copy `.env.example` to `.env` at the **repo root**, then fill in the environment variables:

```bash
cp .env.example .env
```

```env
VBEE_APP_ID=your_app_id              # Vbee TTS App ID
VBEE_ACCESS_TOKEN=your_access_token  # Vbee TTS Access Token
AUTO_CREATE_VIDEO=0                  # 0 = the create-video skill pauses to confirm each step; 1 = runs fully automatically
CHANNEL=Cường IT                     # channel name/eyebrow tag shown in every video
VBEE_VOICE_CODE=n_hanoi_male_protrainer_education_vc  # default voice — see other aliases in vbee.md § 5
```

`.env` is not committed (already in `.gitignore`) — only `.env.example` is checked into the repo as a template.

### 2. Create a new video

The fastest way — use **Claude Code**, invoke the built-in skill with the pair of concepts you want to compare, e.g.:

```
/create-video Dev and DevOps
```

Just this one command and the skill handles the rest automatically: asks/confirms the concept pair +
a 12-line script (unless `AUTO_CREATE_VIDEO=1` — see step 1), initializes the project, generates the
VO narration, builds the composition per `DESIGN.md`, and runs `npm run check` — see details in
[`.claude/skills/create-video/SKILL.md`](.claude/skills/create-video/SKILL.md).

Not using Claude Code, or want to run each step manually — follow the section below:

<details>
<summary>Manual steps (without the skill)</summary>

**Generate narration for a video:**

```bash
cd videos/thien-thach-vs-sao-bang
node scripts/generate-vo.mjs
```

Downloads audio into `assets/vo/*.mp3` and writes the real durations into `assets/vo/durations.json`.

**Preview / check / render:**

Every command runs with the current directory set to the **video's folder** (since `package.json` lives there):

```bash
cd videos/thien-thach-vs-sao-bang
npm run dev       # preview server (long-running)
npm run check     # lint + layout + motion + contrast
npm run render    # render to renders/*.mp4
npm run publish   # publish and get a shareable link
```

**Create a completely new video (instead of duplicating an existing one):**

1. Create a new folder `videos/<new-video-name>/`, run `npx hyperframes@latest init` inside it.
2. Copy the HTML/CSS/timeline structure from an existing video, keeping the layout contract in `DESIGN.md` intact — only change the content/icons/audio for the new topic.
3. Write a dedicated `BRIEF.md` for that video (topic, comparison angle, script).
4. Run `node scripts/generate-vo.mjs` then `npm run check` before considering it done.

</details>

## 🤝 Contributing

This repo is open for cloning/customization. If you add a new video or modify the template, keep the fixed 3-zone layout in `DESIGN.md` (this is the "contract" that keeps the whole series consistent) — any other changes (topic, script, icons) are welcome. Open a PR or issue if you find a bug or want to suggest an improvement.

## 🔗 See Also

Check out other video-generation templates at:

- Repo link: 🔗 [github.com/Cuongyd196/auto-video-gen](https://github.com/Cuongyd196/auto-video-gen)
- A similar repo using Remotion: 🔗 [github.com/Cuongyd196/remotion-cuongit-template](https://github.com/Cuongyd196/remotion-cuongit-template)

Sample videos I've made — you can find them on Reels or TikTok, some of them have trended with tens of thousands of views:

- 📹 Facebook: [www.facebook.com/cuongit96/reels/](https://www.facebook.com/cuongit96/reels/)
- 📹 TikTok: [www.tiktok.com/@cuongit96](https://www.tiktok.com/@cuongit96)

I started this group for everyone to discuss MAKING VIDEOS WITH AI.
For the repos I make public, I'll help answer any questions you run into.
Wishing you a productive day.

- 👥 Facebook group: [facebook.com/groups/1010029065373486](https://www.facebook.com/groups/1010029065373486/)
- 👥 Zalo group: [zalo.me/g/8bfeotyh5ewtkzxmp5gt](https://zalo.me/g/8bfeotyh5ewtkzxmp5gt)

If this was useful to you, a GitHub star would be appreciated 🌟

If you'd like to support me with a coffee: [buymeacoffee.com/cuongit96/gallery/4959449](https://buymeacoffee.com/cuongit96/gallery/4959449)

## 📄 License

[MIT](LICENSE) — free to use, modify, and redistribute, just keep the copyright notice.
