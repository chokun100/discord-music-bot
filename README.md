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

## Terms of Service (ข้อกำหนดการให้บริการ)

ข้อกำหนดและเงื่อนไขเหล่านี้ควบคุมการเข้าถึงและการใช้งานบอทเปิดเพลง (ต่อไปนี้จะเรียกว่า "บอท") บนแพลตฟอร์ม Discord

### 1. การยอมรับข้อตกลง
การเชิญ (Invite) บอทเข้าสู่เซิร์ฟเวอร์ของคุณ หรือการใช้งานคำสั่งใดๆ ของบอท ถือว่าคุณได้อ่าน เข้าใจ และยอมรับที่จะปฏิบัติตามข้อกำหนดการให้บริการเหล่านี้โดยสมบูรณ์ หากคุณไม่ยอมรับข้อตกลง โปรดหยุดการใช้งานและนำบอทออกจากเซิร์ฟเวอร์ของคุณ

### 2. คำอธิบายบริการ
บอทมีหน้าที่หลักในการให้บริการสตรีมไฟล์เสียงและเล่นดนตรีในช่องเสียง (Voice Channels) บน Discord ตามคำสั่งที่ผู้ใช้งานเรียกผ่านข้อความแชท

### 3. ข้อจำกัดการใช้งาน (User Conduct)
ผู้ใช้งานจะต้องไม่กระทำการดังต่อไปนี้:
- ใช้บอทเพื่อเปิด เผยแพร่ หรือสตรีมเนื้อหาที่ผิดกฎหมาย ละเมิดลิขสิทธิ์ รุนแรง หรือสร้างความเกลียดชัง
- จงใจก่อกวนระบบ (Spamming) พิมพ์คำสั่งรัวเกินความจำเป็น หรือกระทำการใดๆ ที่มุ่งหวังให้เซิร์ฟเวอร์ของบอททำงานหนักเกินขีดจำกัด (เช่น DDoS, Abuse of API)
- พยายามเจาะระบบ แฮ็ก หรือเข้าถึงซอร์สโค้ดของบอทโดยไม่ได้รับอนุญาต

### 4. ความพร้อมในการให้บริการ (Availability)
บริการนี้จัดเตรียมไว้ในลักษณะ "ตามสภาพที่เป็นอยู่" (As Is) ผู้พัฒนาพยายามอย่างเต็มที่เพื่อรักษาความเสถียรของบอท แต่ไม่รับประกันว่าบอทจะออนไลน์ตลอด 24 ชั่วโมง หรือปราศจากข้อผิดพลาด (Bugs) บอทอาจออฟไลน์เพื่อซ่อมบำรุงหรืออัปเดตระบบตามความจำเป็น

### 5. การจำกัดความรับผิดชอบ
ผู้พัฒนาจะไม่รับผิดชอบต่อความเสียหายใดๆ ทั้งทางตรงและทางอ้อม ที่เกิดขึ้นกับเซิร์ฟเวอร์ของคุณจากการใช้งานบอท รวมถึงการถูกแบนหรือลงโทษจากทาง Discord หากผู้ใช้ในเซิร์ฟเวอร์นำบอทไปใช้ละเมิดกฎของแพลตฟอร์ม (Discord Terms of Service)

### 6. การเปลี่ยนแปลงข้อกำหนด
ผู้พัฒนาขอสงวนสิทธิ์ในการปรับปรุงแก้ไขข้อกำหนดการให้บริการนี้ได้ตลอดเวลา การเปลี่ยนแปลงจะมีผลทันทีเมื่อมีการอัปเดต หากคุณใช้งานบอทต่อไปหลังจากการเปลี่ยนแปลง ถือว่าคุณยอมรับเงื่อนไขใหม่แล้ว

---

## Privacy Policy (นโยบายความเป็นส่วนตัว)

เราให้ความสำคัญกับความเป็นส่วนตัวของคุณ นโยบายนี้อธิบายถึงประเภทของข้อมูลที่เราเก็บรวบรวม วิธีการใช้งาน และวิธีการที่เราปกป้องข้อมูลของคุณเมื่อคุณใช้งานบอท

### 1. ข้อมูลที่เราเก็บรวบรวม
บอทจะเก็บรวบรวมเฉพาะข้อมูลที่จำเป็นต่อการทำงานพื้นฐานเท่านั้น ซึ่งอาจรวมถึง:
- **ข้อมูลเซิร์ฟเวอร์ (Server Data):** Server ID และ Server Name เพื่อใช้สำหรับการบันทึกการตั้งค่าเฉพาะเซิร์ฟเวอร์ (เช่น Prefix พิเศษ, ช่องแชทที่จำกัดให้ใช้งาน)
- **ข้อมูลผู้ใช้ (User Data):** User ID ของผู้ที่พิมพ์คำสั่ง เพื่อใช้ในการตรวจสอบสิทธิ์ (Permissions) บันทึกผู้ที่ขอเพลง หรือป้องกันการสแปมระบบ
- **ข้อมูลช่องเสียง (Voice Channel Data):** Voice Channel ID ที่บอทถูกเรียกให้เข้าไปสตรีมเสียง
- **ข้อมูลการใช้งาน (Command Logs):** ประวัติคำสั่ง (Command History) รวมถึงลิงก์เพลงหรือคำค้นหา (Search queries) ที่ส่งมายังบอท เพื่อนำไปประมวลผลการเล่นเพลง

### 2. วิธีการใช้ข้อมูล
ข้อมูลที่เก็บรวบรวมจะถูกนำมาใช้เพื่อวัตถุประสงค์ต่อไปนี้เท่านั้น:
- เพื่อรับคำสั่ง ประมวลผล และตอบสนองต่อผู้ใช้งาน
- เพื่อบันทึกการตั้งค่าของเซิร์ฟเวอร์ไม่ให้สูญหายเมื่อบอทรีสตาร์ท
- เพื่อตรวจสอบความผิดปกติ วิเคราะห์หาสาเหตุของบั๊ก (Debugging) และปรับปรุงประสิทธิภาพของบอท

### 3. การเปิดเผยข้อมูลแก่บุคคลที่สาม
เรา **ไม่มี** นโยบายในการขาย แลกเปลี่ยน หรือส่งต่อข้อมูลเซิร์ฟเวอร์ ข้อมูลผู้ใช้ หรือประวัติการใช้งานของคุณให้กับบุคคลที่สามเพื่อการโฆษณา ข้อมูลจะถูกเก็บเป็นความลับ เว้นแต่มีความจำเป็นต้องปฏิบัติตามข้อบังคับทางกฎหมาย

### 4. การจัดเก็บและการลบข้อมูล (Data Retention & Deletion)
- ข้อมูลชั่วคราว เช่น คิวเพลง (Music Queue) และไฟล์แคชเสียง จะถูกลบทิ้งโดยอัตโนมัติเมื่อบอทออกจากช่องเสียง
- หากคุณเตะ (Kick) หรือแบนบอทออกจากเซิร์ฟเวอร์ ข้อมูลการตั้งค่าที่เกี่ยวข้องกับเซิร์ฟเวอร์ของคุณจะถูกลบออกจากฐานข้อมูลของเราตามรอบการทำความสะอาดระบบ (ภายใน 30 วัน)
- เจ้าของเซิร์ฟเวอร์มีสิทธิ์ร้องขอให้ลบข้อมูลที่เกี่ยวข้องกับเซิร์ฟเวอร์ของตนออกจากฐานข้อมูลของเราได้ตลอดเวลาโดยการติดต่อผู้พัฒนาโดยตรง

### 5. การติดต่อผู้พัฒนา
หากคุณมีข้อสงสัยเกี่ยวกับข้อกำหนดการให้บริการ หรือนโยบายความเป็นส่วนตัว สามารถติดต่อได้ที่ **Email:** Chokun100@gmail.com

---

## License

ISC
