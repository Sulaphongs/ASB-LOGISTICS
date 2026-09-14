import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(200, parseInt(req.query.limit, 10) || 30));
  const module = (req.query.module || '').trim();
  const search = (req.query.search || '').trim();
  const dateFrom = (req.query.date_from || '').trim();
  const dateTo = (req.query.date_to || '').trim();

  const where = ['1=1'];
  const params = [];
  if (module && module !== 'all') {
    where.push('module = ?');
    params.push(module);
  }
  if (search) {
    where.push('(description LIKE ? OR username LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (dateFrom) {
    where.push('DATE(created_at) >= ?');
    params.push(dateFrom);
  }
  if (dateTo) {
    where.push('DATE(created_at) <= ?');
    params.push(dateTo);
  }
  const whereSql = where.join(' AND ');

  const [countRows] = await pool.query(`SELECT COUNT(*) AS c FROM activity_logs WHERE ${whereSql}`, params);
  const total = countRows[0].c;
  const offset = (page - 1) * limit;
  const [rows] = await pool.query(
    `SELECT * FROM activity_logs WHERE ${whereSql} ORDER BY created_at DESC, id DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  res.json({ success: true, logs: rows, total, total_pages: Math.ceil(total / limit), page });
});

export default router;
