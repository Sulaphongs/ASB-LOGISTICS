import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLogger.js';

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

export default router;
