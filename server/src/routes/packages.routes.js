import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { generateTrackingCode, statusLabel, PACKAGE_STATUS_LABELS, toNumberOrNull } from '../utils/helpers.js';
import { logActivity } from '../utils/activityLogger.js';
import { createImageUpload, handleUploadErrors, ALLOWED_IMAGE_MIME } from '../middleware/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '../../uploads/packages');
const ALLOWED_MIME = ALLOWED_IMAGE_MIME;

const upload = createImageUpload();

const router = Router();
router.use(requireAuth);

function computeTotal(shippingFee, otherFee) {
  return Math.round((Number(shippingFee) || 0) + (Number(otherFee) || 0));
}

router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(200, parseInt(req.query.limit, 10) || 20));
  const search = (req.query.search || '').trim();
  const status = (req.query.status || '').trim();
  const customerId = parseInt(req.query.customer_id, 10) || 0;

  const where = ['1=1'];
  const params = [];
  if (search) {
    where.push('(p.tracking_code LIKE ? OR p.china_tracking_no LIKE ? OR c.full_name LIKE ? OR c.phone LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (status && status !== 'all') {
    where.push('p.status = ?');
    params.push(status);
  }
  if (customerId > 0) {
    where.push('p.customer_id = ?');
    params.push(customerId);
  }
  const whereSql = where.join(' AND ');

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS c FROM packages p JOIN customers c ON c.id = p.customer_id WHERE ${whereSql}`,
    params
  );
  const total = countRows[0].c;
  const offset = (page - 1) * limit;
  const [rows] = await pool.query(
    `SELECT p.*, c.full_name AS customer_name, c.phone AS customer_phone, c.code AS customer_code
     FROM packages p JOIN customers c ON c.id = p.customer_id
     WHERE ${whereSql} ORDER BY p.id DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  );
  rows.forEach((r) => { r.status_label = statusLabel(r.status); });

  res.json({ success: true, packages: rows, total, total_pages: Math.ceil(total / limit), page });
});

router.get('/:id', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.*, c.full_name AS customer_name, c.phone AS customer_phone, c.code AS customer_code,
            c.address AS customer_address, c.province AS customer_province
     FROM packages p JOIN customers c ON c.id = p.customer_id WHERE p.id = ?`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ success: false, error: 'ບໍ່ພົບພັດສະດຸ' });
  rows[0].status_label = statusLabel(rows[0].status);
  res.json({ success: true, package: rows[0] });
});

router.get('/:id/timeline', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM package_status_history WHERE package_id = ? ORDER BY created_at ASC, id ASC',
    [req.params.id]
  );
  rows.forEach((r) => { r.status_label = statusLabel(r.status); });
  res.json({ success: true, timeline: rows });
});

router.post('/', async (req, res) => {
  const b = req.body || {};
  const customerId = parseInt(b.customer_id, 10) || 0;
  if (!customerId) return res.status(400).json({ success: false, error: 'ກະລຸນາເລືອກລູກຄ້າ' });

  const [custRows] = await pool.query('SELECT id FROM customers WHERE id = ?', [customerId]);
  if (!custRows.length) return res.status(400).json({ success: false, error: 'ບໍ່ພົບລູກຄ້ານີ້' });

  const shippingFee = Number(b.shipping_fee) || 0;
  const otherFee = Number(b.other_fee) || 0;
  const totalFee = computeTotal(shippingFee, otherFee);

  const trackingCode = await generateTrackingCode(pool, process.env.TRACKING_PREFIX || 'ASB');

  const [result] = await pool.query(
    `INSERT INTO packages
     (tracking_code, customer_id, china_tracking_no, item_description, shop_link, quantity, weight_kg, volume_cbm,
      declared_value_cny, pricing_rule_id, shipping_fee, other_fee, total_fee, currency, payment_status, paid_amount,
      notes, status, created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'ordered', ?)`,
    [
      trackingCode, customerId, (b.china_tracking_no || '').trim(), (b.item_description || '').trim(), (b.shop_link || '').trim(),
      Math.max(1, parseInt(b.quantity, 10) || 1), toNumberOrNull(b.weight_kg), toNumberOrNull(b.volume_cbm), toNumberOrNull(b.declared_value_cny),
      b.pricing_rule_id ? parseInt(b.pricing_rule_id, 10) : null, shippingFee, otherFee, totalFee,
      (b.currency || 'LAK').trim(), ['unpaid', 'partial', 'paid'].includes(b.payment_status) ? b.payment_status : 'unpaid',
      Number(b.paid_amount) || 0, (b.notes || '').trim(), req.user.id,
    ]
  );
  const newId = result.insertId;

  await pool.query(
    'INSERT INTO package_status_history (package_id, status, note, changed_by, changed_by_name) VALUES (?,"ordered","ສ້າງອອເດີໃໝ່",?,?)',
    [newId, req.user.id, req.user.full_name || req.user.username]
  );

  await logActivity(pool, {
    userId: req.user.id, username: req.user.username, actionType: 'create', module: 'package',
    description: `ສ້າງພັດສະດຸໃໝ່: ${trackingCode}`, newData: b,
  });

  res.json({ success: true, message: 'ສ້າງພັດສະດຸສຳເລັດ', id: newId, tracking_code: trackingCode });
});

router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const [existing] = await pool.query('SELECT * FROM packages WHERE id = ?', [id]);
  if (!existing.length) return res.status(404).json({ success: false, error: 'ບໍ່ພົບພັດສະດຸ' });

  const b = req.body || {};
  const customerId = parseInt(b.customer_id, 10) || existing[0].customer_id;
  const shippingFee = Number(b.shipping_fee) || 0;
  const otherFee = Number(b.other_fee) || 0;
  const totalFee = computeTotal(shippingFee, otherFee);

  await pool.query(
    `UPDATE packages SET customer_id=?, china_tracking_no=?, item_description=?, shop_link=?, quantity=?, weight_kg=?,
     volume_cbm=?, declared_value_cny=?, pricing_rule_id=?, shipping_fee=?, other_fee=?, total_fee=?, currency=?,
     payment_status=?, paid_amount=?, notes=? WHERE id=?`,
    [
      customerId, (b.china_tracking_no || '').trim(), (b.item_description || '').trim(), (b.shop_link || '').trim(),
      Math.max(1, parseInt(b.quantity, 10) || 1), toNumberOrNull(b.weight_kg), toNumberOrNull(b.volume_cbm), toNumberOrNull(b.declared_value_cny),
      b.pricing_rule_id ? parseInt(b.pricing_rule_id, 10) : null, shippingFee, otherFee, totalFee,
      (b.currency || 'LAK').trim(), ['unpaid', 'partial', 'paid'].includes(b.payment_status) ? b.payment_status : 'unpaid',
      Number(b.paid_amount) || 0, (b.notes || '').trim(), id,
    ]
  );

  await logActivity(pool, {
    userId: req.user.id, username: req.user.username, actionType: 'update', module: 'package',
    description: `ແກ້ໄຂພັດສະດຸ ID: ${id}`, oldData: existing[0], newData: b,
  });

  res.json({ success: true, message: 'ອັບເດດພັດສະດຸສຳເລັດ', id: Number(id), tracking_code: existing[0].tracking_code });
});

router.post('/:id/status', async (req, res) => {
  const id = req.params.id;
  const { status: newStatus, note = '' } = req.body || {};
  if (!Object.prototype.hasOwnProperty.call(PACKAGE_STATUS_LABELS, newStatus)) {
    return res.status(400).json({ success: false, error: 'ສະຖານະບໍ່ຖືກຕ້ອງ' });
  }
  const [existing] = await pool.query('SELECT * FROM packages WHERE id = ?', [id]);
  if (!existing.length) return res.status(404).json({ success: false, error: 'ບໍ່ພົບພັດສະດຸ' });

  const timestampCol = {
    arrived_cn_warehouse: 'cn_warehouse_at',
    shipped: 'shipped_at',
    arrived_la_warehouse: 'la_warehouse_at',
    delivered: 'delivered_at',
  }[newStatus];

  if (timestampCol) {
    await pool.query(`UPDATE packages SET status = ?, ${timestampCol} = NOW() WHERE id = ?`, [newStatus, id]);
  } else {
    await pool.query('UPDATE packages SET status = ? WHERE id = ?', [newStatus, id]);
  }

  await pool.query(
    'INSERT INTO package_status_history (package_id, status, note, changed_by, changed_by_name) VALUES (?,?,?,?,?)',
    [id, newStatus, note || statusLabel(newStatus), req.user.id, req.user.full_name || req.user.username]
  );

  await logActivity(pool, {
    userId: req.user.id, username: req.user.username, actionType: 'status_change', module: 'package',
    description: `ປ່ຽນສະຖານະພັດສະດຸ ${existing[0].tracking_code} (ID: ${id}): ${existing[0].status} → ${newStatus}`,
    oldData: { status: existing[0].status }, newData: { status: newStatus },
  });

  res.json({ success: true, message: 'ອັບເດດສະຖານະສຳເລັດ', status: newStatus, status_label: statusLabel(newStatus) });
});

router.post('/:id/photo', handleUploadErrors(upload.single('photo')), async (req, res) => {
  const id = req.params.id;
  const [existing] = await pool.query('SELECT * FROM packages WHERE id = ?', [id]);
  if (!existing.length) return res.status(404).json({ success: false, error: 'ບໍ່ພົບພັດສະດຸ' });
  if (!req.file) return res.status(400).json({ success: false, error: 'ກະລຸນາເລືອກຮູບພາບ' });

  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const oldPhotoPath = existing[0].photo_path;
  if (oldPhotoPath) {
    const oldAbs = path.join(__dirname, '../..', oldPhotoPath);
    if (fs.existsSync(oldAbs)) fs.unlinkSync(oldAbs);
  }

  const ext = ALLOWED_MIME[req.file.mimetype];
  const filename = `pkg-${id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), req.file.buffer);
  const relPath = `uploads/packages/${filename}`;

  await pool.query('UPDATE packages SET photo_path = ? WHERE id = ?', [relPath, id]);
  await logActivity(pool, {
    userId: req.user.id, username: req.user.username, actionType: 'update', module: 'package',
    description: `ອັບໂຫລດຮູບພັດສະດຸ ID: ${id}`, oldData: { photo_path: oldPhotoPath }, newData: { photo_path: relPath },
  });

  res.json({ success: true, message: 'ອັບໂຫລດຮູບສຳເລັດ', photo_path: relPath });
});

router.delete('/:id/photo', async (req, res) => {
  const id = req.params.id;
  const [existing] = await pool.query('SELECT * FROM packages WHERE id = ?', [id]);
  if (!existing.length) return res.status(404).json({ success: false, error: 'ບໍ່ພົບພັດສະດຸ' });

  const oldPhotoPath = existing[0].photo_path;
  if (oldPhotoPath) {
    const oldAbs = path.join(__dirname, '../..', oldPhotoPath);
    if (fs.existsSync(oldAbs)) fs.unlinkSync(oldAbs);
  }
  await pool.query('UPDATE packages SET photo_path = NULL WHERE id = ?', [id]);
  await logActivity(pool, {
    userId: req.user.id, username: req.user.username, actionType: 'update', module: 'package',
    description: `ລຶບຮູບພັດສະດຸ ID: ${id}`, oldData: { photo_path: oldPhotoPath }, newData: { photo_path: null },
  });

  res.json({ success: true, message: 'ລຶບຮູບສຳເລັດ' });
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  const [existing] = await pool.query('SELECT * FROM packages WHERE id = ?', [id]);
  if (!existing.length) return res.status(404).json({ success: false, error: 'ບໍ່ພົບພັດສະດຸ' });

  await pool.query('DELETE FROM packages WHERE id = ?', [id]);
  await logActivity(pool, {
    userId: req.user.id, username: req.user.username, actionType: 'delete', module: 'package',
    description: `ລຶບພັດສະດຸ: ${existing[0].tracking_code} (ID: ${id})`,
  });

  res.json({ success: true, message: 'ລຶບພັດສະດຸສຳເລັດ' });
});

export default router;
