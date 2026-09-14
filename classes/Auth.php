<?php
/**
 * Auth — session-based login helper (ດັດແປງມາຈາກ ptpos.shop api/auth/*.php,
 * ລວມ login/logout/session-check/role-permission ໄວ້ບ່ອນດຽວໃຫ້ໃຊ້ງ່າຍ)
 */
require_once __DIR__ . '/../config/database.php';

class Auth
{
    private PDO $db;

    public function __construct()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_name(defined('APP_SESSION_NAME') ? APP_SESSION_NAME : 'asb_session');
            session_start();
        }
        $this->db = (new Database())->getConnection();
        $this->ensureSessionTable();
    }

    private function ensureSessionTable(): void
    {
        $this->db->exec("CREATE TABLE IF NOT EXISTS user_sessions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            username VARCHAR(100) NOT NULL,
            session_token VARCHAR(255) UNIQUE NOT NULL,
            ip_address VARCHAR(45) NULL,
            user_agent VARCHAR(500) NULL,
            login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NULL,
            status ENUM('active','expired','logged_out') DEFAULT 'active',
            INDEX idx_user_id (user_id),
            INDEX idx_token (session_token)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    }

    public function attempt(string $username, string $password): array
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE username = ? LIMIT 1');
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || !password_verify($password, $user['password_hash'])) {
            return ['success' => false, 'error' => 'ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ'];
        }
        if ($user['status'] !== 'active') {
            return ['success' => false, 'error' => 'ບັນຊີຖືກປິດໃຊ້ງານ'];
        }

        $token = bin2hex(random_bytes(32));
        $expiresIn = 60 * 60 * 12; // 12 ຊົ່ວໂມງ

        $ins = $this->db->prepare("INSERT INTO user_sessions
            (user_id, username, session_token, ip_address, user_agent, expires_at, status)
            VALUES (?,?,?,?,?, DATE_ADD(NOW(), INTERVAL ? SECOND), 'active')");
        $ins->execute([
            $user['id'], $user['username'], $token,
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null,
            $expiresIn,
        ]);

        $_SESSION['user_id']   = $user['id'];
        $_SESSION['username']  = $user['username'];
        $_SESSION['full_name'] = $user['full_name'];
        $_SESSION['role_key']  = $user['role_key'];
        $_SESSION['session_token'] = $token;

        unset($user['password_hash']);
        return ['success' => true, 'user' => $user];
    }

    public function logout(): void
    {
        if (!empty($_SESSION['session_token'])) {
            $stmt = $this->db->prepare("UPDATE user_sessions SET status='logged_out' WHERE session_token = ?");
            $stmt->execute([$_SESSION['session_token']]);
        }
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
        }
        session_destroy();
    }

    public static function check(): bool
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_name(defined('APP_SESSION_NAME') ? APP_SESSION_NAME : 'asb_session');
            session_start();
        }
        return !empty($_SESSION['user_id']);
    }

    public static function requireLogin(): void
    {
        if (!self::check()) {
            $isApi = str_contains($_SERVER['REQUEST_URI'] ?? '', '/api/');
            if ($isApi) {
                header('Content-Type: application/json');
                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'ກະລຸນາເຂົ້າສູ່ລະບົບ']);
            } else {
                header('Location: /login.php');
            }
            exit;
        }
    }

    public static function user(): array
    {
        return [
            'id'        => $_SESSION['user_id'] ?? null,
            'username'  => $_SESSION['username'] ?? null,
            'full_name' => $_SESSION['full_name'] ?? null,
            'role_key'  => $_SESSION['role_key'] ?? 'staff',
        ];
    }

    public static function isAdmin(): bool
    {
        return (self::user()['role_key'] ?? '') === 'admin';
    }
}
