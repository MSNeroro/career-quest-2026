# Career Quest 2026: เส้นทางอาชีพของฉัน

MVP เว็บเกมค้นหาเส้นทางอาชีพจากข้อมูลผู้เล่น พฤติกรรมการเล่น ข้อมูลอาชีพ และข้อมูลตลาดแรงงาน โดยใช้ React/Vite สำหรับเกมและ Express + MariaDB สำหรับ API

## สถาปัตยกรรม

- Frontend: React, Vite, Tailwind CSS, Framer Motion, Recharts, Lucide React
- Backend: Node.js, Express, MariaDB ผ่าน `mysql2/promise`
- Security: validate input ด้วย Zod, prepared statements, admin session, CSRF token, bcrypt password hash
- Database: MariaDB long-format สำหรับข้อมูลแรงงาน และตาราง careers ที่แก้ไขได้

Frontend ไม่เชื่อมต่อ MariaDB โดยตรง ข้อมูลอาชีพและ recommendation ดึงผ่าน REST API เท่านั้น

## โครงสร้างโปรเจกต์

```text
frontend/   เกม React และหน้า admin
backend/    REST API, matching engine, admin API, CSV import
database/   schema, seed careers, sample labor CSV
```

## ติดตั้งและรัน local

1. สร้างฐานข้อมูล

```bash
mysql -u root -p < database/schema.sql
mysql --default-character-set=utf8mb4 -u root -p career_quest_2026 < database/seed_careers.sql
```

2. ตั้งค่า backend

```bash
copy backend\.env.example backend\.env
```

แก้ `DB_USER`, `DB_PASSWORD`, `DB_NAME` ให้ตรงกับเครื่อง

3. ติดตั้ง dependencies

```bash
npm.cmd install --prefix frontend
npm.cmd install --prefix backend
```

4. เปิด API และเกม

```bash
npm.cmd run dev --prefix backend
npm.cmd run dev --prefix frontend
```

- เกม: `http://127.0.0.1:5173/`
- Admin: `http://127.0.0.1:5173/admin`
- API health: `http://127.0.0.1:4000/api/health`

บัญชี admin seed: `admin` / `password`

ควรเปลี่ยนรหัสผ่านและ `SESSION_SECRET` ก่อนใช้งานจริง

> ถ้า import ผ่าน Windows PowerShell หรือ MySQL client ที่ไม่ได้บังคับ UTF-8 ให้ใช้ `--default-character-set=utf8mb4` เสมอ ไม่เช่นนั้นภาษาไทยในตาราง `careers` อาจกลายเป็นตัวอักษรเพี้ยน

## Flow การเล่น

1. Intro / Onboarding: แจ้ง consent และเลือก avatar
2. Profile Discovery: เลือกช่วงอายุ learning badge จังหวัด และไอเท็มความสนใจ
3. Skill Quest: เล่นภารกิจ 6 ด่านเพื่อสะสมคะแนนทักษะ
4. Career Cards: ดึงอาชีพจาก MariaDB แล้วให้เลือกการ์ดที่สนใจ
5. Result: backend คำนวณ Top 3 พร้อมเหตุผล radar chart roadmap และโปรเจกต์แนะนำ

## สูตร Matching Engine

ระบบคำนวณใน `backend/src/services/matchingEngine.js`

```text
final_score =
  profile_match_score * 0.30 +
  game_behavior_score * 0.35 +
  skill_match_score * 0.25 +
  career_trend_score * 0.10
```

คะแนนใช้ข้อมูล 3 กลุ่ม:

- Profile: ความสนใจ การศึกษา และอาชีพที่ผู้เล่นเลือกดู
- Game behavior: คะแนนทักษะจากคำตอบใน quest
- Career market: `trend_score` และ `popularity_score` จากตาราง careers

น้ำหนักถูกแยกไว้ใน engine เพื่อปรับต่อในอนาคตได้ง่าย

## Import ข้อมูลแรงงาน

ใช้หน้า Admin แล้วกด `Import Labor CSV` หรือเรียก API:

```http
POST /api/admin/labor/import
Content-Type: multipart/form-data
```

ไฟล์ตัวอย่างอยู่ที่ `database/sample_labor_market_2026.csv`

รูปแบบ long format:

```csv
dataset_year,metric_key,metric_name,area_type,sex,value,unit
2026,employed,ผู้มีงานทำ,total,all,41290544.06,คน
```

ค่า `area_type` ที่รองรับ: `in_municipal`, `outside_municipal`, `total`

ค่า `sex` ที่รองรับ: `male`, `female`, `all`

## API หลัก

- `POST /api/player/start`
- `POST /api/player/profile`
- `POST /api/game/event`
- `POST /api/game/score`
- `POST /api/recommendation/calculate`
- `GET /api/recommendation/:session_id`
- `GET /api/careers`
- `POST /api/admin/login`
- `POST /api/admin/careers`
- `PUT /api/admin/careers/:id`
- `DELETE /api/admin/careers/:id` ปิดใช้งานอาชีพแบบ soft delete
- `POST /api/admin/labor/import`
- `GET /api/admin/dashboard`
- `GET /api/admin/export/summary`

## ข้อควรต่อยอด

- เพิ่ม filter และรายละเอียดเชิงลึกใน dashboard
- เพิ่มข้อมูลจังหวัดครบ 77 จังหวัดและแผนที่ไทยแบบ interactive
- เพิ่ม social card generation เป็นภาพจริง
- เพิ่ม rate limit ครอบคลุม API สำคัญและ audit log สำหรับ admin
- ปรับ careers source ให้ผูกกับแหล่งข้อมูลจริงพร้อมปีข้อมูล
- เพิ่ม automated tests สำหรับ matching engine และ API validation

## Deploy บน Vercel

โปรเจกต์มี `vercel.json` และ `api/index.js` สำหรับ deploy แบบ monorepo:

- frontend build จาก `frontend/`
- backend API ใช้ Vercel Serverless Function ที่ `/api`
- Vercel ถูกตั้งเป็น mockup/demo mode ด้วย `USE_MEMORY_STORE=true` จึงยังไม่ต้องต่อ cloud MariaDB
- demo mode เล่น flow ได้ และ admin demo เพิ่ม/แก้/ปิดใช้งานอาชีพได้แบบไม่ถาวร

สำหรับ production จริง ควรตั้งค่า environment variables ใน Vercel:

```text
DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=career_quest_2026
SESSION_SECRET=
FRONTEND_ORIGIN=https://your-domain.vercel.app
```

เมื่อมี cloud MariaDB แล้วให้ลบ/เปลี่ยน `USE_MEMORY_STORE` และตั้งค่า DB env เหล่านี้ backend จะใช้ฐานข้อมูลจริงแทน memory fallback
