# ASB Logistics

ລະບົບຫຼັງບ້ານ (admin/staff panel) ສຳລັບ **ASB ບໍລິການຂົນສົ່ງ ແລະ ຮັບເຄື່ອງຈາກແອັບຈີນ**
— ຮັບອອເດີ, ຕິດຕາມພັດສະດຸ (ຈີນ → ສາງລາວ → ລູກຄ້າ), ຄິດໄລ່ຄ່າຂົນສົ່ງ, ຈັດການລູກຄ້າ/ຜູ້ໃຊ້ງານ.

## ມາຈາກໃສ

ໂຄງການນີ້ຖືກສ້າງໂດຍເອົາ **ໂຄງສ້າງພື້ນຖານ** (foundation) ຈາກໂຄ້ດ `ptpos.shop` (ລະບົບ POS ຮ້ານອາຫານ)
ມາດັດແປງໃໝ່ໃຫ້ເຂົ້າກັບທຸລະກິດຂົນສົ່ງ — **ບໍ່ໄດ້ copy ໄຟລ໌ກົງໆ**, ແຕ່ຂຽນໃໝ່ໂດຍໃຊ້ pattern ດຽວກັນ:

**ສ່ວນທີ່ຍືມ pattern ມາ (ຈາກ ptpos.shop):**
- ການເຊື່ອມຕໍ່ຖານຂໍ້ມູນ (PDO) — `config/database.php`
- ການ login/session ດ້ວຍ password_hash + user_sessions table — `classes/Auth.php`
- ການບັນທຶກກິດຈະກຳ (activity log) — `classes/ActivityLogger.php`
- ໂຄງຮ່າງ sidebar ແບບ dark+gold overlay — `partials/sidebar.php`, `assets/css/style.css`
- ຮູບແບບ API ແບບ action-based (`?action=list/save/delete`) + SweetAlert2 + fetch ໃນ JS

**ສ່ວນທີ່ບໍ່ໄດ້ເອົາມາ** (ເປັນສ່ວນຂອງ POS ຮ້ານອາຫານ ບໍ່ກ່ຽວກັບການຂົນສົ່ງ): ຂາຍເຄື່ອງໜ້າຮ້ານ (sales/checkout), ສິນຄ້າ/barcode, ຄົວ (KDS), ໂຕະ/ບໍລິກອນ, ໃບສັ່ງຊື້ຈາກຮ້ານ (purchase orders), ແບຣນ/ໝວດສິນຄ້າ.

**ສ່ວນທີ່ສ້າງໃໝ່ທັງໝົດ** (ຫົວໃຈຂອງທຸລະກິດຂົນສົ່ງ): ຕິດຕາມພັດສະດຸ/ອອເດີ (`packages.php`), ໜ້າຮັບ-ສົ່ງສາງ (`receiving.php`), ຄິດໄລ່ຄ່າຂົນສົ່ງຕາມນ້ຳໜັກ/CBM (`pricing.php`), ລາຍງານ (`reports.php`), schema ຖານຂໍ້ມູນທັງໝົດ.

## ຂໍ້ສຳຄັນ — ຄວາມປອດໄພ

ໄຟລ໌ `ptpos.shop/config/database.php` ຕົ້ນສະບັບ **ເກັບ user/password ຖານຂໍ້ມູນໄວ້ກົງໆໃນໂຄ້ດ** (hardcoded).
ໂຄງການນີ້ແກ້ບັນຫານັ້ນແລ້ວ — ລະຫັດຜ່ານຖືກອ່ານຈາກໄຟລ໌ `.env` (ບໍ່ຖືກ commit ເຂົ້າ git, ຢູ່ໃນ `.gitignore` ແລ້ວ).
**ຫ້າມ hardcode ລະຫັດຜ່ານໃນໂຄ້ດອີກ ແລະ ຫ້າມແບ່ງປັນໄຟລ໌ `.env`.**

## ເທັກໂນໂລຢີ

**PHP 8 + MySQL (PDO) ລ້ວນໆ, ບໍ່ໃຊ້ framework/Composer** — ເລືອກແບບນີ້ເພື່ອ:
- Deploy ໄດ້ເທິງ shared hosting ລາຄາຖືກ (cPanel) ໄດ້ເລີຍ ຄືກັນກັບ ptpos.shop ເກົ່າ
- ບໍ່ຕ້ອງມີຄວາມຮູ້ framework ໃໝ່ (Laravel ຕ້ອງການ Composer, artisan, ແລະ hosting ທີ່ຮອງຮັບ SSH — ຫຼາຍ hosting ລາຄາຖືກໃນລາວ/ໄທ ບໍ່ຮອງຮັບ)
- ໂຄ້ດອ່ານງ່າຍ, ໜ້ອຍ dependency, ບຳລຸງຮັກສາເອງໄດ້ໂດຍບໍ່ຕ້ອງ `npm install`/`composer install`

ຖ້າໃນອະນາຄົດຢາກຍົກລະດັບເປັນ Laravel (ມີ ORM, migration, auth scaffolding ພ້ອມໃຊ້) ກໍ່ເຮັດໄດ້ພາຍຫຼັງ —
ໂຄງສ້າງ DB ໃນ `database/schema.sql` ສາມາດເອົາໄປສ້າງ Eloquent models ໄດ້ເລີຍ.

## ການຕິດຕັ້ງ

1. **ສ້າງຖານຂໍ້ມູນ** MySQL ໃໝ່ (ຜ່ານ cPanel/phpMyAdmin) ແລ້ວ import `database/schema.sql`
2. **ຄັດລອກ `.env.example` ເປັນ `.env`** ແລ້ວແກ້ໄຂຄ່າໃຫ້ຖືກຕ້ອງ:
   ```
   DB_HOST=localhost
   DB_NAME=ຊື່ຖານຂໍ້ມູນຂອງທ່ານ
   DB_USER=ຊື່ຜູ້ໃຊ້ຖານຂໍ້ມູນ
   DB_PASS=ລະຫັດຜ່ານ
   ```
3. **ອັບໂຫຼດທັງໂຟນເດີ** ນີ້ຂຶ້ນ hosting (ຫຼື copy ເຂົ້າ `htdocs`/`www` ສຳລັບທົດສອບໃນເຄື່ອງ)
4. ເປີດເວັບໄຊທ໌ — ຈະເຂົ້າໜ້າ `login.php` ອັດຕະໂນມັດ
5. **Login ຄັ້ງທຳອິດ**: `admin` / `admin123` — **ປ່ຽນລະຫັດຜ່ານທັນທີ** (ໜ້າ ຜູ້ໃຊ້ງານ → ແກ້ໄຂ admin)

## ໂຄງສ້າງໂຟນເດີ

```
ASB-LOGISTICS/
├── .env.example        ← copy ເປັນ .env ແລ້ວແກ້ຄ່າ
├── config/              ← DB connection, app settings
├── classes/             ← Auth.php, ActivityLogger.php
├── includes/             ← bootstrap.php (require ນຳໜ້າທຸກໜ້າ), functions.php
├── api/                  ← ທຸກ endpoint (JSON) ທີ່ໜ້າເວັບເອີ້ນຜ່ານ fetch()
├── partials/              ← header/sidebar/footer ຮ່ວມ
├── assets/               ← css/js
├── database/schema.sql   ← ໂຄງສ້າງຖານຂໍ້ມູນ + seed data
├── login.php, dashboard.php, packages.php, package-detail.php,
│   receiving.php, pricing.php, customers.php, users.php,
│   settings.php, reports.php   ← ໜ້າຫຼັກຂອງລະບົບ
```

## ຄຸນສົມບັດທີ່ມີແລ້ວ

- ເຂົ້າສູ່ລະບົບ + ບົດບາດ (admin / staff)
- ຈັດການລູກຄ້າ (customers) — ລະຫັດອັດຕະໂນມັດ ASB0001, ASB0002...
- ສ້າງ/ຕິດຕາມພັດສະດຸ — ລະຫັດຕິດຕາມອັດຕະໂນມັດ `ASB-YYMMDD-XXXX`, ປະຫວັດການປ່ຽນສະຖານະ (timeline)
- ວົງຈອນສະຖານະ: ສັ່ງແລ້ວ → ຮອດສາງຈີນ → ກຳລັງຂົນສົ່ງ → ຮອດສາງລາວ → ກຳລັງຈັດສົ່ງ → ສົ່ງແລ້ວ (ຫຼື ຍົກເລີກ)
- ໜ້າ "ຮັບ-ສົ່ງສາງ" ສຳລັບພະນັກງານຄົ້ນຫາ/ອັບເດດສະຖານະໄວໆ
- ກົດເກນລາຄາຂົນສົ່ງ (ຕໍ່ກິໂລ/ຕໍ່ CBM, ທາງບົກ/ທາງອາກາດ) + ເຄື່ອງຄິດໄລ່ຄ່າຂົນສົ່ງ
- ການຕັ້ງຄ່າ: ຂໍ້ມູນບໍລິສັດ, ອັດຕາແລກປ່ຽນ CNY/THB → LAK
- ລາຍງານລາຍຮັບ/ຄ້າງຈ່າຍ ຕາມຊ່ວງວັນທີ
- ບັນທຶກກິດຈະກຳ (activity log) ທຸກການສ້າງ/ແກ້ໄຂ/ລຶບ

## ສິ່ງທີ່ຄວນເຮັດຕໍ່ (ບໍ່ໄດ້ຢູ່ໃນ scope ນີ້)

- ໜ້າສະແດງບັນທຶກກິດຈະກຳ (activity log viewer) — ຂໍ້ມູນຖືກບັນທຶກແລ້ວ ແຕ່ຍັງບໍ່ມີໜ້າສະແດງ
- ແຈ້ງເຕືອນລູກຄ້າອັດຕະໂນມັດ (SMS/Facebook Messenger) ເມື່ອສະຖານະປ່ຽນ
- ໜ້າຕິດຕາມພັດສະດຸສາທາລະນະ (customer-facing tracking page ບໍ່ຕ້ອງ login — ໃສ່ລະຫັດຕິດຕາມແລ້ວເບິ່ງສະຖານະ)
- ອັບໂຫຼດຮູບພັດສະດຸ (ຮູບຖ່າຍຕອນຮັບເຂົ້າສາງ)
- ພິມໃບບິນ/ໃບຕິດພັດສະດຸ (shipping label)
