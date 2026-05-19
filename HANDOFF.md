# HANDOFF.md — Career Quest 2026

เอกสารนี้ส่งต่อให้ฮานะ/นักพัฒนาคนถัดไปเข้าใจสถานะปัจจุบันของ MVP และเดินงานต่อได้ทันที

## ภาพรวมโปรเจกต์

**Career Quest 2026: เส้นทางอาชีพของฉัน** คือเว็บเกมแนว Mini Game / Career Discovery Game สำหรับผู้เล่นอายุ 15 ปีขึ้นไป ใช้ข้อมูลโปรไฟล์แบบค่อยเป็นค่อยไป พฤติกรรมการเล่น และข้อมูลอาชีพ/ตลาดแรงงาน เพื่อแนะนำอาชีพที่เหมาะสม 3 อันดับแรก

แนวทาง MVP รอบนี้:

- เกมเล่นครบ flow 5 ช่วง
- ข้อมูลอาชีพไม่ hardcode ใน frontend แต่ดึงจาก backend API
- backend เชื่อม MariaDB ผ่าน API เท่านั้น
- มี matching engine ฝั่ง backend
- มี admin panel เบื้องต้นสำหรับ login, เพิ่ม/แก้ไข/ปิดใช้งานอาชีพ, import CSV, export summary
- มี schema, seed data และ sample CSV สำหรับเริ่มใช้งาน local

## Stack

Frontend:

- React + Vite
- Tailwind CSS
- Framer Motion
- Recharts
- Lucide React
- ESLint

Backend:

- Node.js + Express
- MariaDB ผ่าน `mysql2/promise`
- Zod validation
- `express-session` + CSRF token สำหรับ admin
- `bcryptjs` สำหรับ password hash
- `multer` + `csv-parse` สำหรับ import CSV

## โครงสร้างสำคัญ

```text
frontend/
  src/App.jsx                  เกมหลัก + admin UI
  src/api/client.js            API client
  src/game/quests.js           ข้อมูล quest และ scoring keys
  src/data/provinces.js        จังหวัดตัวอย่างและ education badge
  src/styles/index.css         theme และ visual polish

backend/
  src/server.js                Express bootstrap
  src/routes/playerRoutes.js   เริ่ม session และบันทึก profile
  src/routes/gameRoutes.js     event และ skill score
  src/routes/careerRoutes.js   careers + recommendation
  src/routes/adminRoutes.js    admin login, careers CRUD, CSV import/export
  src/services/matchingEngine.js
  src/db/pool.js

database/
  schema.sql
  seed_careers.sql
  sample_labor_market_2026.csv
```

## วิธีรัน Local

1. สร้างฐานข้อมูลและ seed

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p career_quest_2026 < database/seed_careers.sql
```

2. ตั้งค่า backend

```bash
copy backend\.env.example backend\.env
```

แก้ค่า `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `SESSION_SECRET`

3. ติดตั้งและรัน

```bash
npm.cmd install --prefix frontend
npm.cmd install --prefix backend

npm.cmd run dev --prefix backend
npm.cmd run dev --prefix frontend
```

URL:

- เกม: `http://127.0.0.1:5173/`
- Admin: `http://127.0.0.1:5173/admin`
- API health: `http://127.0.0.1:4000/api/health`

บัญชี seed:

- username: `admin`
- password: `password`

ควรเปลี่ยนรหัสผ่านก่อนใช้งานจริง

## สิ่งที่ตรวจแล้ว

รันผ่านแล้ว:

```bash
npm.cmd run lint --prefix frontend
npm.cmd run lint --prefix backend
npm.cmd run build --prefix frontend
npm.cmd audit --audit-level=moderate --prefix frontend
npm.cmd audit --audit-level=moderate --prefix backend
```

ผล:

- lint ผ่านทั้ง frontend/backend
- frontend build ผ่าน
- audit ผ่าน 0 vulnerabilities ทั้งสองฝั่ง
- smoke test ของ `calculateMatches()` ผ่าน

ข้อสังเกต:

- Vite build มี warning เรื่อง chunk ของ Recharts ใกล้ 500KB ซึ่งรับได้สำหรับ MVP แต่ควร lazy-load chart ในรอบถัดไป
- ใน Codex desktop session นี้ การเปิด dev server แบบ background ติดปัญหา Windows `Path/PATH` ซ้ำจาก PowerShell `Start-Process`; ไม่ใช่ปัญหา source code

## Flow เกมปัจจุบัน

1. Intro / Onboarding
   - แจ้ง consent
   - เลือก avatar
   - สร้าง player และ game session

2. Profile Discovery
   - เลือกช่วงอายุ
   - เลือก learning badge
   - เลือกจังหวัด
   - เลือก interest items อย่างน้อย 2 รายการ

3. Skill Quest
   - เล่น 6 ด่าน
   - แต่ละคำตอบเพิ่มคะแนน skill เช่น analytical, creativity, technology, empathy
   - บันทึก event และ skill score ไป backend

4. Career Cards
   - ดึง career cards จาก MariaDB ผ่าน `/api/careers`
   - ผู้เล่นเลือกอาชีพที่สนใจ

5. Result & Recommendation
   - backend คำนวณ Top 3
   - แสดง radar chart, เหตุผล, จุดแข็ง, ทักษะควรพัฒนา, roadmap, project idea

## Career Matching Engine

ไฟล์หลัก: `backend/src/services/matchingEngine.js`

สูตร:

```text
final_score =
  profile_match_score * 0.30 +
  game_behavior_score * 0.35 +
  skill_match_score * 0.25 +
  career_trend_score * 0.10
```

แหล่งคะแนน:

- Profile: interest tags, education hint, selected career cards
- Behavior: skill scores และ personality tags
- Skill match: required skills ของอาชีพเทียบกับคะแนนผู้เล่น
- Market trend: `trend_score` + `popularity_score`

ข้อควรทำต่อ: ย้าย weight ไป config/database เพื่อให้ admin ปรับได้โดยไม่แก้ code

## Admin Panel ปัจจุบัน

ทำได้แล้ว:

- Login admin
- เพิ่มอาชีพ
- แก้ไขอาชีพ
- ปิดใช้งานอาชีพแบบ soft delete
- Import labor CSV
- Export career recommendation summary CSV
- Dashboard cards พื้นฐาน

ยังควรเพิ่ม:

- ตาราง dashboard ละเอียด
- filter ตามช่วงเวลา
- export player funnel
- audit log admin
- หน้า preview CSV ก่อน import
- reset password / เปลี่ยน password

## Database Notes

ข้อมูลแรงงานใช้ long format:

```csv
dataset_year,metric_key,metric_name,area_type,sex,value,unit
2026,employed,ผู้มีงานทำ,total,all,41290544.06,คน
```

รองรับ:

- `area_type`: `in_municipal`, `outside_municipal`, `total`
- `sex`: `male`, `female`, `all`

ตาราง `careers` ใช้ JSON string ใน fields:

- `required_skills_json`
- `interest_tags_json`
- `personality_tags_json`

ต้องระวังให้ JSON valid เสมอ

## Security Notes

ทำแล้ว:

- prepared statements ผ่าน `mysql2/promise`
- validate input ด้วย Zod
- admin password hash ด้วย bcryptjs
- admin session cookie แบบ httpOnly
- CSRF token สำหรับ admin mutation
- CORS จำกัด origin ผ่าน env
- ไม่เก็บข้อมูลส่วนบุคคลละเอียดเกินจำเป็นใน MVP

ควรทำต่อก่อน production:

- เปลี่ยน seed password ทันที
- ใช้ HTTPS และตั้ง `cookie.secure = true`
- เพิ่ม persistent session store แทน memory store
- เพิ่ม rate limit endpoint เกมและ admin mutation
- เพิ่ม audit log
- เพิ่ม data retention policy ตาม PDPA
- เพิ่ม privacy notice ที่ละเอียดขึ้น

## ลำดับงานถัดไปที่แนะนำ

1. แยก `frontend/src/App.jsx` ออกเป็น pages/components
   - ตอนนี้ทุกอย่างอยู่ไฟล์เดียวเพื่อเร่ง MVP
   - ควรแยก `GameApp`, `AdminApp`, `ResultPanel`, `QuestStage`, `CareerCards`

2. เชื่อม MariaDB จริงและ browser test ครบ flow
   - seed database
   - เล่นตั้งแต่ consent ถึง result
   - ตรวจ row ใน `players`, `game_sessions`, `player_answers`, `game_events`, `skill_scores`, `recommendations`

3. ปรับ admin ให้ใช้งานจริงขึ้น
   - preview CSV ก่อน import
   - แก้ไข JSON tags ผ่าน chip UI แทน textarea
   - dashboard funnel: start > complete > result > share

4. ทำ UX polish รอบสอง
   - mascot visual asset จริง
   - sound toggle ที่มีเสียงจริง
   - loading screen ระหว่าง API
   - social card export เป็นรูปภาพ

5. ปรับ performance
   - lazy-load Recharts เฉพาะหน้า result
   - code split admin route
   - ตรวจ mobile viewport ด้วย browser automation

6. เพิ่ม automated tests
   - unit test matching engine
   - API validation test
   - CSV import test

## Commit/Deploy Notes

โปรเจกต์นี้ตั้งใจให้เป็น MVP foundation ก่อน ไม่ใช่ production-final

ก่อน deploy จริงควรมี:

- `.env` production
- database migration workflow
- production admin password
- HTTPS
- backup/restore plan
- logging และ monitoring ขั้นพื้นฐาน
