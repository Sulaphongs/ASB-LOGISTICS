import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLogger.js';
import { createImageUpload, handleUploadErrors, ALLOWED_IMAGE_MIME } from '../middleware/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_DIR = path.join(__dirname, '../../uploads/settings');
const upload = createImageUpload();

const router = Router();
router.use(requireAuth);

const ALLOWED_KEYS = [
  'company_name', 'company_phone', 'company_address', 'company_facebook',
  'currency_cny_to_lak', 'currency_thb_to_lak', 'tracking_prefix',
];

router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT setting_key, setting_value FROM settings');
  const settings = Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value]));
  res.json({ success: true, settings });
});

router.put('/', requireAdmin, async (req, res) => {
  const b = req.body || {};
  const changed = {};
  for (const key of ALLOWED_KEYS) {
    if (Object.prototype.hasOwnProperty.call(b, key)) {
      await pool.query(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
        [key, String(b[key])]
      );
      changed[key] = b[key];
    }
  }

  await logActivity(pool, {
    userId: req.user.id, username: req.user.username, actionType: 'update', module: 'settings',
    description: 'ແກ້ໄຂການຕັ້ງຄ່າລະບົບ', newData: changed,
  });

  res.json({ success: true, message: 'ບັນທຶກການຕັ້ງຄ່າສຳເລັດ' });
});

// ໝາຍເຫດ: 'company_logo' ຖືກຕັ້ງໃຈບໍ່ໃສ່ໃນ ALLOWED_KEYS ຂ້າງເທິງ — ໃຫ້ path ຂອງໂລໂກ້
// ຖືກຕັ້ງໄດ້ຜ່ານ route ອັບໂຫລດຂ້າງລຸ່ມນີ້ເທົ່ານັ້ນ, ບໍ່ໃຫ້ PUT /settings ທົ່ວໄປຕັ້ງ path ເອງໄດ້

router.post('/logo', requireAdmin, handleUploadErrors(upload.single('logo')), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'ກະລຸນາເລືອກຮູບພາບ' });
  if (!fs.existsSync(LOGO_DIR)) fs.mkdirSync(LOGO_DIR, { recursive: true });

  const [existing] = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'company_logo'");
  const oldPath = existing[0]?.setting_value;
  if (oldPath) {
    const oldAbs = path.join(__dirname, '../..', oldPath);
    if (fs.existsSync(oldAbs)) fs.unlinkSync(oldAbs);
  }

  const ext = ALLOWED_IMAGE_MIME[req.file.mimetype];
  const filename = `logo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  fs.writeFileSync(path.join(LOGO_DIR, filename), req.file.buffer);
  const relPath = `uploads/settings/${filename}`;

  await pool.query(
    'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
    ['company_logo', relPath]
  );

  await logActivity(pool, {
    userId: req.user.id, username: req.user.username, actionType: 'update', module: 'settings',
    description: 'ອັບໂຫລດໂລໂກ້ບໍລິສັດ', oldData: { company_logo: oldPath || null }, newData: { company_logo: relPath },
  });

  res.json({ success: true, message: 'ອັບໂຫລດໂລໂກ້ສຳເລັດ', logo_path: relPath });
});

router.delete('/logo', requireAdmin, async (req, res) => {
  const [existing] = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'company_logo'");
  const oldPath = existing[0]?.setting_value;
  if (oldPath) {
    const oldAbs = path.join(__dirname, '../..', oldPath);
    if (fs.existsSync(oldAbs)) fs.unlinkSync(oldAbs);
  }
  await pool.query("DELETE FROM settings WHERE setting_key = 'company_logo'");

  await logActivity(pool, {
    userId: req.user.id, username: req.user.username, actionType: 'update', module: 'settings',
    description: 'ລຶບໂລໂກ້ບໍລິສັດ (ກັບຄືນເປັນຄ່າເລີ່ມຕົ້ນ)', oldData: { company_logo: oldPath || null }, newData: { company_logo: null },
  });

  res.json({ success: true, message: 'ລຶບໂລໂກ້ສຳເລັດ' });
});

export default router;
