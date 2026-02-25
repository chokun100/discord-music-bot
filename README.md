# 🎵 Discord Music Bot

A scalable Discord music bot that plays YouTube music with queue management, built with Discord.js v14 and DisTube.

## Features

- 🎶 Play music from YouTube (URL or search)
- ⏭️ Skip, pause, resume, stop
- 📋 Queue with pagination
- 🎵 Now Playing with progress bar
- 🛠️ Support command with server invite
- 🐛 Bug report system (sends to your support server)
- 🔀 Auto-sharding ready (for 2,000+ servers)
- 🛡️ Per-guild error isolation

## Prerequisites

1. **Node.js** v18+ — [Download](https://nodejs.org/)
2. **FFmpeg** — [Download](https://ffmpeg.org/download.html) (must be in system PATH)
3. **Discord Bot Token** — [Developer Portal](https://discord.com/developers/applications)

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

Edit `.env`:
```
DISCORD_TOKEN=your_bot_token_here
PREFIX=!
SUPPORT_SERVER_INVITE=https://discord.gg/your-invite
BUG_REPORT_CHANNEL_ID=your_channel_id
OWNER_EMAIL=your@email.com
```

### 3. Start the Bot

**Development:**
```bash
node index.js
```

**Production (with PM2):**
```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

**Sharded mode (2,000+ servers):**
```bash
node shard.js
```

## Commands

| Command | Aliases | Description |
|---|---|---|
| `!play <URL or search>` | `!p` | Play a song from YouTube |
| `!skip` | `!s`, `!next` | Skip current song |
| `!stop` | `!leave`, `!dc` | Stop and leave |
| `!queue` | `!q` | Show song queue |
| `!nowplaying` | `!np`, `!now` | Current song info |
| `!pause` | — | Pause playback |
| `!resume` | — | Resume playback |
| `!support` | `!help`, `!info` | Get support links |
| `!report <text>` | `!bug`, `!feedback` | Report a bug |

## Project Structure

```
├── index.js              # Bot entry point
├── shard.js              # Sharding (Phase 2)
├── config.js             # Centralized config
├── handlers/
│   └── commandHandler.js # Auto-loads commands
├── commands/             # Drop a file = new command
│   ├── play.js
│   ├── skip.js
│   ├── stop.js
│   ├── queue.js
│   ├── nowplaying.js
│   ├── pause.js
│   ├── support.js
│   └── report.js
├── events/
│   └── distube.js        # Music event handlers
└── ecosystem.config.js   # PM2 config
```

## Bot Permissions

When inviting the bot, ensure these permissions are enabled:
- Send Messages
- Embed Links
- Read Message History
- Connect (Voice)
- Speak (Voice)

## License

ISC
