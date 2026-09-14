import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { PACKAGE_STATUS_LABELS, statusLabel } from '../utils/helpers.js';

const router = Router();
router.use(requireAuth);

router.get('/stats', async (req, res) => {
  const [byStatusRows] = await pool.query('SELECT status, COUNT(*) AS c FROM packages GROUP BY status');
  const byStatus = Object.fromEntries(byStatusRows.map((r) => [r.status, r.c]));

  const [[{ c: totalCustomers }]] = await pool.query('SELECT COUNT(*) AS c FROM customers');
  const [[{ c: totalPackages }]] = await pool.query('SELECT COUNT(*) AS c FROM packages');
  const [[{ t: unpaidTotal }]] = await pool.query(
    "SELECT COALESCE(SUM(total_fee - paid_amount),0) AS t FROM packages WHERE payment_status != 'paid'"
  );
  const [[{ t: revenueThisMonth }]] = await pool.query(
    'SELECT COALESCE(SUM(total_fee),0) AS t FROM packages WHERE MONTH(created_at)=MONTH(NOW()) AND YEAR(created_at)=YEAR(NOW())'
  );

  const [recent] = await pool.query(
    `SELECT p.id, p.tracking_code, p.status, p.total_fee, p.currency, p.created_at, c.full_name AS customer_name
     FROM packages p JOIN customers c ON c.id = p.customer_id
     ORDER BY p.id DESC LIMIT 8`
  );
  recent.forEach((r) => { r.status_label = statusLabel(r.status); });

  const statusBreakdown = Object.entries(PACKAGE_STATUS_LABELS).map(([key, label]) => ({
    status: key, label, count: byStatus[key] || 0,
  }));

  res.json({
    success: true,
    total_customers: totalCustomers,
    total_packages: totalPackages,
    unpaid_total: Number(unpaidTotal),
    revenue_this_month: Number(revenueThisMonth),
    status_breakdown: statusBreakdown,
    recent_packages: recent,
  });
});

export default router;
