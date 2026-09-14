import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { generateCustomerCode } from '../utils/helpers.js';
import { logActivity } from '../utils/activityLogger.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(200, parseInt(req.query.limit, 10) || 20));
  const search = (req.query.search || '').trim();
  const status = (req.query.status || '').trim();

  const where = ['1=1'];
  const params = [];
  if (search) {
    where.push('(full_name LIKE ? OR phone LIKE ? OR code LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (status && status !== 'all') {
    where.push('status = ?');
    params.push(status);
  }
  const whereSql = where.join(' AND ');

  const [countRows] = await pool.query(`SELECT COUNT(*) AS c FROM customers WHERE ${whereSql}`, params);
  const total = countRows[0].c;
  const offset = (page - 1) * limit;
  const [rows] = await pool.query(
    `SELECT * FROM customers WHERE ${whereSql} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  res.json({ success: true, customers: rows, total, total_pages: Math.ceil(total / limit), page });
});

router.get('/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ success: false, error: 'ບໍ່ພົບລູກຄ້າ' });
  res.json({ success: true, customer: rows[0] });
});

router.post('/', async (req, res) => {
  const { full_name = '', phone = '', facebook_name = '', address = '', province = '', notes = '', status = 'active' } = req.body || {};
  if (!full_name.trim() || !phone.trim()) {
    return res.status(400).json({ success: false, error: 'ກະລຸນາປ້ອນຊື່ ແລະ ເບີໂທ' });
  }
  const code = await generateCustomerCode(pool);
  const safeStatus = ['active', 'inactive'].includes(status) ? status : 'active';

  const [result] = await pool.query(
    'INSERT INTO customers (code, full_name, phone, facebook_name, address, province, notes, status) VALUES (?,?,?,?,?,?,?,?)',
    [code, full_name.trim(), phone.trim(), facebook_name.trim(), address.trim(), province.trim(), notes.trim(), safeStatus]
  );

  await logActivity(pool, {
    userId: req.user.id, username: req.user.username, actionType: 'create', module: 'customer',
    description: `ເພີ່ມລູກຄ້າໃໝ່: ${full_name} (${code})`, newData: req.body,
  });

  res.json({ success: true, message: 'ເພີ່ມລູກຄ້າສຳເລັດ', id: result.insertId, code });
});

router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const [existing] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
  if (!existing.length) return res.status(404).json({ success: false, error: 'ບໍ່ພົບລູກຄ້າ' });

  const { full_name = '', phone = '', facebook_name = '', address = '', province = '', notes = '', status = 'active' } = req.body || {};
  if (!full_name.trim() || !phone.trim()) {
    return res.status(400).json({ success: false, error: 'ກະລຸນາປ້ອນຊື່ ແລະ ເບີໂທ' });
  }
  const safeStatus = ['active', 'inactive'].includes(status) ? status : 'active';

  await pool.query(
    'UPDATE customers SET full_name=?, phone=?, facebook_name=?, address=?, province=?, notes=?, status=? WHERE id=?',
    [full_name.trim(), phone.trim(), facebook_name.trim(), address.trim(), province.trim(), notes.trim(), safeStatus, id]
  );

  await logActivity(pool, {
    userId: req.user.id, username: req.user.username, actionType: 'update', module: 'customer',
    description: `ແກ້ໄຂລູກຄ້າ: ${full_name} (ID: ${id})`, oldData: existing[0], newData: req.body,
  });

  res.json({ success: true, message: 'ອັບເດດລູກຄ້າສຳເລັດ', id: Number(id) });
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  const [existing] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
  if (!existing.length) return res.status(404).json({ success: false, error: 'ບໍ່ພົບລູກຄ້າ' });

  const [pkgs] = await pool.query('SELECT COUNT(*) AS c FROM packages WHERE customer_id = ?', [id]);
  if (pkgs[0].c > 0) {
    return res.status(400).json({ success: false, error: 'ບໍ່ສາມາດລຶບໄດ້ — ລູກຄ້ານີ້ມີພັດສະດຸໃນລະບົບແລ້ວ (ປິດການໃຊ້ງານແທນການລຶບ)' });
  }

  await pool.query('DELETE FROM customers WHERE id = ?', [id]);
  await logActivity(pool, {
    userId: req.user.id, username: req.user.username, actionType: 'delete', module: 'customer',
    description: `ລຶບລູກຄ້າ: ${existing[0].full_name} (ID: ${id})`,
  });

  res.json({ success: true, message: 'ລຶບລູກຄ້າສຳເລັດ' });
});

export default router;
