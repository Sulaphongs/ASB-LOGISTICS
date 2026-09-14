<?php
/**
 * ActivityLogger — ບັນທຶກກິດຈະກຳທຸກອັນໃນລະບົບ ASB Logistics
 * (ດັດແປງມາຈາກ ptpos.shop/classes/ActivityLogger.php: ປ່ຽນ log helper ຈາກ
 *  ຮ້ານອາຫານ/POS [sale, product, brand...] ມາເປັນໂດເມນຂົນສົ່ງ
 *  [package, customer, pricing, user])
 */

if (!function_exists('getallheaders')) {
    function getallheaders(): array
    {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) === 'HTTP_') {
                $key = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))));
                $headers[$key] = $value;
            }
        }
        return $headers;
    }
}

class ActivityLogger
{
    private PDO $db;
    private ?int $userId = null;
    private ?string $username = null;

    public function __construct(?PDO $dbConnection = null)
    {
        if ($dbConnection) {
            $this->db = $dbConnection;
        } else {
            require_once __DIR__ . '/../config/database.php';
            $this->db = (new Database())->getConnection();
        }
        $this->loadUserFromSession();
    }

    private function loadUserFromSession(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            @session_start();
        }
        if (!empty($_SESSION['user_id'])) {
            $this->userId = (int) $_SESSION['user_id'];
            $this->username = $_SESSION['username'] ?? null;
        }
    }

    public function setUser(int $userId, string $username): void
    {
        $this->userId = $userId;
        $this->username = $username;
    }

    public function log(string $actionType, string $module, string $description, $oldData = null, $newData = null): bool
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO activity_logs
                (user_id, username, action_type, module, description, old_data, new_data, ip_address, user_agent, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            return $stmt->execute([
                $this->userId,
                $this->username,
                $actionType,
                $module,
                $description,
                $oldData ? json_encode($oldData, JSON_UNESCAPED_UNICODE) : null,
                $newData ? json_encode($newData, JSON_UNESCAPED_UNICODE) : null,
                $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            ]);
        } catch (Exception $e) {
            error_log('ActivityLogger error: ' . $e->getMessage());
            return false;
        }
    }

    // ---- Auth ----
    public function logAuth(string $username, string $action, bool $success, $details = null): bool
    {
        return $this->log($success ? 'login' : 'failed_login', 'auth',
            ($success ? "ເຂົ້າສູ່ລະບົບສຳເລັດ: {$username}" : "ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ: {$username} ({$action})"),
            null, $details);
    }

    // ---- Customers ----
    public function logCustomerCreate(array $data): bool
    {
        return $this->log('create', 'customer', "ເພີ່ມລູກຄ້າໃໝ່: {$data['full_name']} ({$data['code']})", null, $data);
    }
    public function logCustomerUpdate($id, array $old, array $new): bool
    {
        return $this->log('update', 'customer', "ແກ້ໄຂລູກຄ້າ: {$new['full_name']} (ID: {$id})", $old, $new);
    }
    public function logCustomerDelete($id, string $name): bool
    {
        return $this->log('delete', 'customer', "ລຶບລູກຄ້າ: {$name} (ID: {$id})");
    }

    // ---- Packages / shipments ----
    public function logPackageCreate(array $data): bool
    {
        return $this->log('create', 'package', "ສ້າງພັດສະດຸໃໝ່: {$data['tracking_code']}", null, $data);
    }
    public function logPackageStatusChange($id, string $trackingCode, string $oldStatus, string $newStatus): bool
    {
        return $this->log('status_change', 'package',
            "ປ່ຽນສະຖານະພັດສະດຸ {$trackingCode} (ID: {$id}): {$oldStatus} → {$newStatus}",
            ['status' => $oldStatus], ['status' => $newStatus]);
    }
    public function logPackageUpdate($id, array $old, array $new): bool
    {
        return $this->log('update', 'package', "ແກ້ໄຂພັດສະດຸ ID: {$id}", $old, $new);
    }
    public function logPackageDelete($id, string $trackingCode): bool
    {
        return $this->log('delete', 'package', "ລຶບພັດສະດຸ: {$trackingCode} (ID: {$id})");
    }

    // ---- Pricing ----
    public function logPricingCreate(array $data): bool
    {
        return $this->log('create', 'pricing', "ເພີ່ມກົດເກນລາຄາ: {$data['name']}", null, $data);
    }
    public function logPricingUpdate($id, array $old, array $new): bool
    {
        return $this->log('update', 'pricing', "ແກ້ໄຂກົດເກນລາຄາ ID: {$id}", $old, $new);
    }

    // ---- Users ----
    public function logUserCreate(array $data): bool
    {
        return $this->log('create', 'user', "ເພີ່ມຜູ້ໃຊ້ໃໝ່: {$data['username']}", null, $data);
    }
    public function logUserUpdate($id, array $old, array $new): bool
    {
        return $this->log('update', 'user', "ແກ້ໄຂຜູ້ໃຊ້ ID: {$id}", $old, $new);
    }

    // ---- Settings ----
    public function logSettingsUpdate(array $changed): bool
    {
        return $this->log('update', 'settings', 'ແກ້ໄຂການຕັ້ງຄ່າລະບົບ', null, $changed);
    }

    // ---- Query logs ----
    public function getLogs(array $filters = []): array
    {
        $where = ['1=1'];
        $params = [];

        if (!empty($filters['module'])) {
            $where[] = 'module = ?';
            $params[] = $filters['module'];
        }
        if (!empty($filters['search'])) {
            $where[] = '(description LIKE ? OR username LIKE ?)';
            $params[] = "%{$filters['search']}%";
            $params[] = "%{$filters['search']}%";
        }
        if (!empty($filters['date_from'])) {
            $where[] = 'DATE(created_at) >= ?';
            $params[] = $filters['date_from'];
        }
        if (!empty($filters['date_to'])) {
            $where[] = 'DATE(created_at) <= ?';
            $params[] = $filters['date_to'];
        }

        $whereClause = implode(' AND ', $where);
        $limit = (int) ($filters['limit'] ?? 50);
        $offset = (int) ($filters['offset'] ?? 0);

        $stmt = $this->db->prepare("SELECT * FROM activity_logs WHERE {$whereClause} ORDER BY created_at DESC LIMIT {$limit} OFFSET {$offset}");
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
