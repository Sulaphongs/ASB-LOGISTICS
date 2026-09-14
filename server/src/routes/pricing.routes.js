import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLogger.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM pricing_rules ORDER BY is_default DESC, id DESC');
  res.json({ success: true, rules: rows });
});

router.post('/', requireAdmin, async (req, res) => {
  const b = req.body || {};
  const name = (b.name || '').trim();
  if (!name) return res.status(400).json({ success: false, error: 'ກະລຸນາປ້ອນຊື່ກົດເກນ' });

  const data = {
    name,
    shipping_type: ['land', 'air'].includes(b.shipping_type) ? b.shipping_type : 'land',
    calc_method: ['per_kg', 'per_cbm'].includes(b.calc_method) ? b.calc_method : 'per_kg',
    rate: Number(b.rate) || 0,
    min_charge: Number(b.min_charge) || 0,
    currency: (b.currency || 'LAK').trim(),
    is_default: b.is_default ? 1 : 0,
    status: ['active', 'inactive'].includes(b.status) ? b.status : 'active',
  };

  if (data.is_default) await pool.query('UPDATE pricing_rules SET is_default = 0');

  const [result] = await pool.query(
    'INSERT INTO pricing_rules (name, shipping_type, calc_method, rate, min_charge, currency, is_default, status) VALUES (?,?,?,?,?,?,?,?)',
    [data.name, data.shipping_type, data.calc_method, data.rate, data.min_charge, data.currency, data.is_default, data.status]
  );

  await logActivity(pool, {
    userId: req.user.id, username: req.user.username, actionType: 'create', module: 'pricing',
    description: `ເພີ່ມກົດເກນລາຄາ: ${name}`, newData: data,
  });

  res.json({ success: true, message: 'ເພີ່ມກົດເກນລາຄາສຳເລັດ', id: result.insertId });
});

router.put('/:id', requireAdmin, async (req, res) => {
  const id = req.params.id;
  const [existing] = await pool.query('SELECT * FROM pricing_rules WHERE id = ?', [id]);
  if (!existing.length) return res.status(404).json({ success: false, error: 'ບໍ່ພົບກົດເກນລາຄາ' });

  const b = req.body || {};
  const name = (b.name || '').trim();
  if (!name) return res.status(400).json({ success: false, error: 'ກະລຸນາປ້ອນຊື່ກົດເກນ' });

  const data = {
    name,
    shipping_type: ['land', 'air'].includes(b.shipping_type) ? b.shipping_type : 'land',
    calc_method: ['per_kg', 'per_cbm'].includes(b.calc_method) ? b.calc_method : 'per_kg',
    rate: Number(b.rate) || 0,
    min_charge: Number(b.min_charge) || 0,
    currency: (b.currency || 'LAK').trim(),
    is_default: b.is_default ? 1 : 0,
    status: ['active', 'inactive'].includes(b.status) ? b.status : 'active',
  };

  if (data.is_default) await pool.query('UPDATE pricing_rules SET is_default = 0');

  await pool.query(
    'UPDATE pricing_rules SET name=?, shipping_type=?, calc_method=?, rate=?, min_charge=?, currency=?, is_default=?, status=? WHERE id=?',
    [data.name, data.shipping_type, data.calc_method, data.rate, data.min_charge, data.currency, data.is_default, data.status, id]
  );

  await logActivity(pool, {
    userId: req.user.id, username: req.user.username, actionType: 'update', module: 'pricing',
    description: `ແກ້ໄຂກົດເກນລາຄາ ID: ${id}`, oldData: existing[0], newData: data,
  });

  res.json({ success: true, message: 'ອັບເດດກົດເກນລາຄາສຳເລັດ' });
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const id = req.params.id;
  const [inUse] = await pool.query('SELECT COUNT(*) AS c FROM packages WHERE pricing_rule_id = ?', [id]);
  if (inUse[0].c > 0) {
    return res.status(400).json({ success: false, error: 'ກົດເກນນີ້ຖືກໃຊ້ຢູ່ໃນພັດສະດຸແລ້ວ, ປິດການໃຊ້ງານແທນການລຶບ' });
  }
  await pool.query('DELETE FROM pricing_rules WHERE id = ?', [id]);
  res.json({ success: true, message: 'ລຶບກົດເກນລາຄາສຳເລັດ' });
});

router.post('/calculate', async (req, res) => {
  const b = req.body || {};
  const ruleId = parseInt(b.pricing_rule_id, 10) || 0;
  const weight = Number(b.weight_kg) || 0;
  const volume = Number(b.volume_cbm) || 0;
  const otherFee = Number(b.other_fee) || 0;

  const [rows] = await pool.query('SELECT * FROM pricing_rules WHERE id = ? AND status = "active"', [ruleId]);
  if (!rows.length) return res.status(404).json({ success: false, error: 'ບໍ່ພົບກົດເກນລາຄາ' });
  const rule = rows[0];

  const qty = rule.calc_method === 'per_cbm' ? volume : weight;
  const shippingFee = Math.max(qty * Number(rule.rate), Number(rule.min_charge));
  const totalFee = shippingFee + otherFee;

  res.json({
    success: true,
    calc_method: rule.calc_method,
    rate: Number(rule.rate),
    min_charge: Number(rule.min_charge),
    shipping_fee: Math.round(shippingFee),
    other_fee: Math.round(otherFee),
    total_fee: Math.round(totalFee),
    currency: rule.currency,
  });
});

export default router;
