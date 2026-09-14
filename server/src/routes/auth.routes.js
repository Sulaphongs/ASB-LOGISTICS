import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { signToken, requireAuth, AUTH_COOKIE_NAME } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLogger.js';

const router = Router();

const cookieOpts = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 12 * 60 * 60 * 1000, // 12h
  path: '/',
});

router.post('/login', async (req, res) => {
  const { username = '', password = '' } = req.body || {};
  if (!username.trim() || !password) {
    return res.status(400).json({ success: false, error: 'ກະລຸນາກອກຂໍ້ມູນໃຫ້ຄົບ' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username.trim()]);
    const user = rows[0];
    const ip = req.ip;
    const userAgent = req.get('user-agent');

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      await logActivity(pool, {
        username, actionType: 'failed_login', module: 'auth',
        description: `ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ: ${username}`, ip, userAgent,
      });
      return res.status(401).json({ success: false, error: 'ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ success: false, error: 'ບັນຊີຖືກປິດໃຊ້ງານ' });
    }

    const token = signToken(user);
    res.cookie(AUTH_COOKIE_NAME, token, cookieOpts());

    await logActivity(pool, {
      userId: user.id, username: user.username, actionType: 'login', module: 'auth',
      description: `ເຂົ້າສູ່ລະບົບສຳເລັດ: ${user.username}`, ip, userAgent,
    });

    const { password_hash, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ success: false, error: 'ເກີດຄວາມຜິດພາດ, ກະລຸນາລອງໃໝ່' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, { path: '/' });
  res.json({ success: true, message: 'ອອກຈາກລະບົບແລ້ວ' });
});

router.get('/me', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, username, full_name, phone, role_key, status FROM users WHERE id = ?',
    [req.user.id]
  );
  if (!rows.length) return res.status(401).json({ success: false, error: 'ບໍ່ພົບຜູ້ໃຊ້' });
  res.json({ success: true, user: rows[0] });
});

export default router;
