<?php
/**
 * ການຕັ້ງຄ່າລະບົບ (company info, ອັດຕາແລກປ່ຽນເງິນ)
 * GET  ?action=get
 * POST ?action=save (body: key/value pairs)
 */
require_once __DIR__ . '/../includes/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');
Auth::requireLogin();

$db = (new Database())->getConnection();
$logger = new ActivityLogger($db);
$action = $_GET['action'] ?? '';

$allowedKeys = [
    'company_name', 'company_phone', 'company_address', 'company_facebook',
    'currency_cny_to_lak', 'currency_thb_to_lak', 'tracking_prefix',
];

try {
    switch ($action) {
        case 'get': {
            $stmt = $db->query('SELECT setting_key, setting_value FROM settings');
            $rows = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
            jsonResponse(['success' => true, 'settings' => $rows]);
        }
        case 'save': {
            if (!Auth::isAdmin()) {
                jsonResponse(['success' => false, 'error' => 'ສະເພາະຜູ້ດູແລລະບົບເທົ່ານັ້ນ'], 403);
            }
            $input = jsonInput();
            $changed = [];
            foreach ($allowedKeys as $key) {
                if (array_key_exists($key, $input)) {
                    setSetting($db, $key, trim((string) $input[$key]));
                    $changed[$key] = $input[$key];
                }
            }
            $logger->logSettingsUpdate($changed);
            jsonResponse(['success' => true, 'message' => 'ບັນທຶກການຕັ້ງຄ່າສຳເລັດ']);
        }
        default:
            jsonResponse(['success' => false, 'error' => 'Invalid action'], 400);
    }
} catch (Throwable $e) {
    error_log('settings.php error: ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'ເກີດຄວາມຜິດພາດ: ' . $e->getMessage()]);
}
