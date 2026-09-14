/**
 * Public routes — ບໍ່ຕ້ອງ login (ໃຊ້ໂດຍໜ້າ track.php ສາທາລະນະ)
 * ສະແດງສະເພາະຂໍ້ມູນທີ່ຈຳເປັນ (ບໍ່ສະແດງເບີໂທ/ທີ່ຢູ່ລູກຄ້າ ຫຼືລາຄາ ເພື່ອຄວາມເປັນສ່ວນຕົວ)
 */
import { Router } from 'express';
import { pool } from '../db.js';
import { statusLabel } from '../utils/helpers.js';

const router = Router();

router.get('/settings', async (req, res) => {
  const [rows] = await pool.query(
    "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('company_name','company_phone')"
  );
  const settings = Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value]));
  res.json({ success: true, settings });
});

router.get('/track/:code', async (req, res) => {
  const code = (req.params.code || '').trim();
  if (!code) return res.status(400).json({ success: false, error: 'ກະລຸນາໃສ່ລະຫັດຕິດຕາມ' });

  const [rows] = await pool.query(
    `SELECT p.tracking_code, p.item_description, p.quantity, p.weight_kg, p.status, p.created_at,
            c.full_name AS customer_name
     FROM packages p JOIN customers c ON c.id = p.customer_id
     WHERE p.tracking_code = ? LIMIT 1`,
    [code]
  );
  if (!rows.length) {
    return res.status(404).json({ success: false, error: 'ບໍ່ພົບລະຫັດຕິດຕາມນີ້ ກະລຸນາກວດສອບຄືນ' });
  }
  const pkg = rows[0];
  pkg.status_label = statusLabel(pkg.status);

  const [timeline] = await pool.query(
    `SELECT status, note, created_at FROM package_status_history
     WHERE package_id = (SELECT id FROM packages WHERE tracking_code = ?)
     ORDER BY created_at ASC, id ASC`,
    [code]
  );
  timeline.forEach((t) => { t.status_label = statusLabel(t.status); });

  res.json({ success: true, package: pkg, timeline });
});

export default router;
