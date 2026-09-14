<?php
/**
 * ສະຖິຕິສຳລັບໜ້າ dashboard
 */
require_once __DIR__ . '/../includes/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');
Auth::requireLogin();

$db = (new Database())->getConnection();

try {
    $byStatus = $db->query('SELECT status, COUNT(*) c FROM packages GROUP BY status')->fetchAll(PDO::FETCH_KEY_PAIR);
    $totalCustomers = (int) $db->query('SELECT COUNT(*) c FROM customers')->fetch(PDO::FETCH_ASSOC)['c'];
    $totalPackages = (int) $db->query('SELECT COUNT(*) c FROM packages')->fetch(PDO::FETCH_ASSOC)['c'];
    $unpaidTotal = (float) $db->query("SELECT COALESCE(SUM(total_fee - paid_amount),0) t FROM packages WHERE payment_status != 'paid'")->fetch(PDO::FETCH_ASSOC)['t'];
    $revenueThisMonth = (float) $db->query("SELECT COALESCE(SUM(total_fee),0) t FROM packages WHERE MONTH(created_at)=MONTH(NOW()) AND YEAR(created_at)=YEAR(NOW())")->fetch(PDO::FETCH_ASSOC)['t'];

    $recent = $db->query('
        SELECT p.id, p.tracking_code, p.status, p.total_fee, p.currency, p.created_at, c.full_name AS customer_name
        FROM packages p JOIN customers c ON c.id = p.customer_id
        ORDER BY p.id DESC LIMIT 8
    ')->fetchAll(PDO::FETCH_ASSOC);
    foreach ($recent as &$r) {
        $r['status_label'] = packageStatusLabel($r['status']);
    }

    $statusBreakdown = [];
    foreach (PACKAGE_STATUS_LABELS as $key => $label) {
        $statusBreakdown[] = ['status' => $key, 'label' => $label, 'count' => (int) ($byStatus[$key] ?? 0)];
    }

    jsonResponse([
        'success' => true,
        'total_customers' => $totalCustomers,
        'total_packages' => $totalPackages,
        'unpaid_total' => $unpaidTotal,
        'revenue_this_month' => $revenueThisMonth,
        'status_breakdown' => $statusBreakdown,
        'recent_packages' => $recent,
    ]);
} catch (Throwable $e) {
    error_log('dashboard-stats.php error: ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => $e->getMessage()]);
}
