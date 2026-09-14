import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLogger.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, username, full_name, phone, role_key, status, created_at FROM users ORDER BY id DESC'
  );
  res.json({ success: true, users: rows });
});

router.post('/', async (req, res) => {
  const b = req.body || {};
  const username = (b.username || '').trim();
  const password = (b.password || '').trim();
  if (!username) return res.status(400).json({ success: false, error: 'ກະລຸນາປ້ອນຊື່ຜູ້ໃຊ້' });
  if (!password) return res.status(400).json({ success: false, error: 'ກະລຸນາຕັ້ງລະຫັດຜ່ານສຳລັບຜູ້ໃຊ້ໃໝ່' });

  const [dup] = await pool.query('SELECT COUNT(*) AS c FROM users WHERE username = ?', [username]);
  if (dup[0].c > 0) return res.status(400).json({ success: false, error: 'ຊື່ຜູ້ໃຊ້ນີ້ມີແລ້ວ' });

  const roleKey = ['admin', 'staff'].includes(b.role_key) ? b.role_key : 'staff';
  const status = ['active', 'inactive'].includes(b.status) ? b.status : 'active';
  const hash = bcrypt.hashSync(password, 10);

  const [result] = await pool.query(
    'INSERT INTO users (username, password_hash, full_name, phone, role_key, status) VALUES (?,?,?,?,?,?)',
    [username, hash, (b.full_name || '').trim(), (b.phone || '').trim(), roleKey, status]
  );

  await logActivity(pool, {
    userId: req.user.id, username: req.user.username, actionType: 'create', module: 'user',
    description: `ເພີ່ມຜູ້ໃຊ້ໃໝ່: ${username}`,
  });

  res.json({ success: true, message: 'ເພີ່ມຜູ້ໃຊ້ສຳເລັດ', id: result.insertId });
});

router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const [existing] = await pool.query('SELECT id, username, full_name, phone, role_key, status FROM users WHERE id = ?', [id]);
  if (!existing.length) return res.status(404).json({ success: false, error: 'ບໍ່ພົບຜູ້ໃຊ້' });

  const b = req.body || {};
  const username = (b.username || '').trim();
  const roleKey = ['admin', 'staff'].includes(b.role_key) ? b.role_key : 'staff';
  const status = ['active', 'inactive'].includes(b.status) ? b.status : 'active';
  const password = (b.password || '').trim();

  if (password) {
    await pool.query(
      'UPDATE users SET username=?, full_name=?, phone=?, role_key=?, status=?, password_hash=? WHERE id=?',
      [username, (b.full_name || '').trim(), (b.phone || '').trim(), roleKey, status, bcrypt.hashSync(password, 10), id]
    );
  } else {
    await pool.query(
      'UPDATE users SET username=?, full_name=?, phone=?, role_key=?, status=? WHERE id=?',
      [username, (b.full_name || '').trim(), (b.phone || '').trim(), roleKey, status, id]
    );
  }

  await logActivity(pool, {
    userId: req.user.id, username: req.user.username, actionType: 'update', module: 'user',
    description: `ແກ້ໄຂຜູ້ໃຊ້ ID: ${id}`, oldData: existing[0],
  });

  res.json({ success: true, message: 'ອັບເດດຜູ້ໃຊ້ສຳເລັດ' });
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  if (Number(id) === req.user.id) {
    return res.status(400).json({ success: false, error: 'ບໍ່ສາມາດລຶບບັນຊີຕົນເອງໄດ້' });
  }
  await pool.query('DELETE FROM users WHERE id = ?', [id]);
  res.json({ success: true, message: 'ລຶບຜູ້ໃຊ້ສຳເລັດ' });
});

export default router;
