# ASB Logistics — React + Node ຮຸ່ນ

ນີ້ແມ່ນການແປງ (convert) ຈາກຮຸ່ນ PHP+MySQL ເດີມ ໄປເປັນ **JS stack ເຕັມຮູບແບບ**:
- **server/** — Node.js + Express + MySQL (mysql2) REST API, JWT auth (httpOnly cookie)
- **client/** — React 18 + Vite + Tailwind CSS (React Router), ໜ້າຕາອອກແບບໃໝ່ (teal/slate, ບໍ່ແມ່ນ dark+gold ເກົ່າ)

ໄຟລ໌ PHP ເກົ່າ (root-level `*.php`, `api/`, `classes/`, `config/`, `includes/`, `partials/`) ຍັງເກັບໄວ້ໃນໂຟນເດີດຽວກັນ
ເພື່ອອ້າງອີງ/ສຳຮອງ — **ບໍ່ຖືກໃຊ້ງານໂດຍຮຸ່ນໃໝ່ນີ້ອີກຕໍ່ໄປ**, ສາມາດລຶບຖິ້ມໄດ້ເມື່ອທົດສອບຮຸ່ນ React ສຳເລັດແລ້ວ.

## ⚠️ ຂໍ້ສຳຄັນກ່ຽວກັບການ Deploy

ຮຸ່ນນີ້ຕ້ອງການ **Node.js server ແລ່ນຕະຫຼອດເວລາ** (ບໍ່ແມ່ນແຄ່ Apache/PHP ແບບ XAMPP ອີກຕໍ່ໄປ) —
**XAMPP ຢ່າງດຽວແລ່ນຮຸ່ນນີ້ບໍ່ໄດ້.** ຕົວເລືອກ hosting ໃນອະນາຄົດ:
- VPS (DigitalOcean, Vultr, ...) ລົງ Node + PM2 + Nginx reverse proxy
- Platform ທີ່ຮອງຮັບ Node ໂດຍກົງ: Railway, Render, Fly.io
- ໃນເຄື່ອງທ້ອງຖິ່ນ (dev/ທົດສອບ): ແລ່ນ `npm run dev` ທັງສອງໂຟນເດີ, ບໍ່ຈຳເປັນຕ້ອງໃຊ້ XAMPP/Apache ເລີຍ —
  MySQL ຈາກ XAMPP ຍັງໃຊ້ໄດ້ (ເປີດແຕ່ MySQL service ໃນ XAMPP Control Panel, ບໍ່ຕ້ອງເປີດ Apache)

## ການຕິດຕັ້ງ (ທົດສອບໃນເຄື່ອງ)

### 1) ຖານຂໍ້ມູນ
ເປີດ MySQL (ຜ່ານ XAMPP Control Panel ຫຼືອື່ນໆ) ແລ້ວ import `server/database/schema.sql`
(ຜ່ານ phpMyAdmin ຫຼືຄຳສັ່ງ `mysql -u root asb_logistics < server/database/schema.sql`)

### 2) Server (API)
```
cd server
copy .env.example .env        (ຫຼື cp ໃນ Mac/Linux)
# ແກ້ໄຂ .env: DB_USER, DB_PASS, JWT_SECRET (ຕັ້ງເປັນຂໍ້ຄວາມສຸ່ມຍາວໆ)
npm install
npm run seed                   ← ສ້າງ/ລີເຊັດ admin ດ້ວຍລະຫັດຜ່ານ bcryptjs ທີ່ compatible ແທ້
npm run dev                    ← ແລ່ນທີ່ http://localhost:4000
```
`npm run seed` ໂດຍບໍ່ໃສ່ argument ຈະສ້າງ `admin` / `admin123`.
ຢາກຕັ້ງເອງ: `npm run seed myusername mypassword`

### 3) Client (React)
ເປີດ terminal ໃໝ່ອີກອັນ:
```
cd client
npm install
npm run dev                    ← ແລ່ນທີ່ http://localhost:5173
```
ເປີດ browser ໄປ `http://localhost:5173` — Vite ຈະສົ່ງ request `/api/*` ຕໍ່ໄປຫາ server ອັດຕະໂນມັດ (proxy),
ບໍ່ຕິດ CORS.

### 4) Build ສຳລັບ production
```
cd client
npm run build                  ← ອອກ client/dist/
cd ../server
npm start                      ← Express ຈະ serve client/dist/ ອັດຕະໂນມັດ ຖ້າພົບໂຟນເດີນັ້ນ
```
ຫຼັງຈາກນັ້ນ ເປີດພຽງ port ດຽວ (ຄ່າເລີ່ມຕົ້ນ `http://localhost:4000`) ກໍ່ໄດ້ທັງ UI ແລະ API.

## ການປ່ຽນແປງຈາກຮຸ່ນ PHP ເດີມ

| ຫົວຂໍ້ | ຮຸ່ນ PHP ເດີມ | ຮຸ່ນ React ໃໝ່ |
|---|---|---|
| Backend | PHP 8, session-based | Node/Express, JWT (httpOnly cookie, ບໍ່ໃຊ້ server session) |
| Frontend | ໜ້າ PHP ແຍກ + vanilla JS + SweetAlert2 | React SPA (React Router), Tailwind CSS |
| ຮູບແບບ | dark+gold sidebar | ອອກແບບໃໝ່: light theme, teal primary |
| Deploy | Shared PHP hosting (XAMPP-compatible) | ຕ້ອງການ Node hosting (VPS/Railway/Render) |
| Auth | user_sessions table + custom token | JWT ລ້ວນໆ (stateless, ບໍ່ມີ server-side session tracking/force-logout — ແຈ້ງລ່ວງໜ້າວ່າເປັນການລົດຄວາມສາມາດນີ້ລົງ) |
| Roles/permissions | roles + role_permissions ຕາຕະລາງ (ບໍ່ໄດ້ໃຊ້ຈິງ) | ລົບອອກ, ໃຊ້ພຽງ `users.role_key` (admin/staff) ຄືເກົ່າ ທີ່ໃຊ້ຈິງຢູ່ແລ້ວ |

ຄຸນສົມບັດຄົບຄືເກົ່າທັງໝົດ: login, ລູກຄ້າ, ພັດສະດຸ/ຕິດຕາມ (ພ້ອມ timeline), ຮັບ-ສົ່ງສາງ, ຄິດໄລ່ຄ່າຂົນສົ່ງ+ກົດເກນລາຄາ, ຜູ້ໃຊ້ງານ, ການຕັ້ງຄ່າ, ລາຍງານ, ບັນທຶກກິດຈະກຳ.

## ຄຸນສົມບັດເພີ່ມເຕີມ (ຮອບ 2)

- **ບັນທຶກກິດຈະກຳ** — ໜ້າ `/activity-log` (admin ເທົ່ານັ້ນ) ສະແດງ log ທັງໝົດ, ຄົ້ນຫາ/ກັ່ນຕອງຕາມໂມດູນ ແລະ ຊ່ວງວັນທີ
- **ຕິດຕາມພັດສະດຸສາທາລະນະ** — ໜ້າ `/track` (ບໍ່ຕ້ອງ login), ລູກຄ້າໃສ່ລະຫັດຕິດຕາມເອງເພື່ອເບິ່ງສະຖານະ+timeline (ບໍ່ສະແດງເບີໂທ/ທີ່ຢູ່/ລາຄາ ເພື່ອຄວາມເປັນສ່ວນຕົວ) — ມີລິ້ງໃນໜ້າ login
- **ອັບໂຫລດຮູບພັດສະດຸ** — ໃນໜ້າລາຍລະອຽດພັດສະດຸ, ອັບໂຫລດ/ລຶບຮູບໄດ້ (JPG/PNG/WEBP, ສູງສຸດ 5MB), ເກັບໄວ້ທີ່ `server/uploads/packages/`
- **ພິມໃບຕິດພັດສະດຸ** — ໜ້າ `/packages/:id/label`, layout ສຳລັບພິມ (ມີ QR code ຕິດຕາມ), ເປີດຈາກປຸ່ມໃນລາຍການ ຫຼື ໜ້າລາຍລະອຽດ

⚠️ **ຫຼັງດຶງໂຄ້ດຮອບນີ້ ຕ້ອງ `npm install` ໃນ `server/` ຄືນໃໝ່** (ເພີ່ມ dependency `multer` ສຳລັບອັບໂຫລດຮູບ) ກ່ອນ `npm run dev`/`npm start` — ບໍ່ດັ່ງນັ້ນ server ຈະ error `Cannot find package 'multer'`.
ຖ້າ DB ເກົ່າມີຢູ່ແລ້ວ (ສ້າງກ່ອນຮອບນີ້) ໃຫ້ແລ່ນ migration ໃນທ້າຍ `server/database/schema.sql` ອີກຄັ້ງ (`ALTER TABLE packages ADD COLUMN IF NOT EXISTS photo_path ...`) ເພື່ອເພີ່ມຄໍລຳຮູບພັດສະດຸ.

## ການກວດສອບທີ່ເຮັດແລ້ວ (ໃນ sandbox ນີ້)
- `node --check` ຜ່ານທຸກໄຟລ໌ server (.js) — ບໍ່ມີ syntax error
- `esbuild` ກວດ syntax JSX ທຸກໄຟລ໌ client (.jsx/.js) — ຜ່ານໝົດ
- `esbuild --bundle` ຈາກ `main.jsx` ຮວມທຸກ import ພາຍໃນ (components/pages/context/api) — resolve ສຳເລັດ ບໍ່ມີໄຟລ໌/import ຂາດຫາຍ
- **ບໍ່ໄດ້ທົດສອບກັບ MySQL ຈິງ ຫຼື browser ຈິງ** (sandbox ນີ້ບໍ່ມີ MySQL server ແລະ ບໍ່ສາມາດ `npm install` ຍ້ອນຖືກຈຳກັດເຄືອຂ່າຍ) — ແນະນຳໃຫ້ທົດສອບຂັ້ນຕອນ "ການຕິດຕັ້ງ" ຂ້າງເທິງໃນເຄື່ອງທ່ານ ແລ້ວແຈ້ງບັນຫາທີ່ພົບ ຈະຊ່ວຍແກ້ໄຂໄດ້ທັນທີ
