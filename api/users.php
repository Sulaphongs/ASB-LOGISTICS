<?php
/**
 * ຈັດການຜູ້ໃຊ້ງານ (staff/admin) — ສະເພາະ admin ເທົ່ານັ້ນ
 * GET  ?action=list
 * POST ?action=save    (body: id?, username, password?, full_name, phone, role_key, status)
 * POST ?action=delete   (body: id)
 */
require_once __DIR__ . '/../includes/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');
Auth::requireLogin();

if (!Auth::isAdmin()) {
    jsonResponse(['success' => false, 'error' => 'ສະເພາະຜູ້ດູແລລະບົບເທົ່ານັ້ນ'], 403);
}

$db = (new Database())->getConnection();
$logger = new ActivityLogger($db);
$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'list': {
            $stmt = $db->query('SELECT id, username, full_name, phone, role_key, status, created_at FROM users ORDER BY id DESC');
            jsonResponse(['success' => true, 'users' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }
        case 'save': {
            $input = jsonInput();
            $id = (int) ($input['id'] ?? 0);
            $username = trim($input['username'] ?? '');
            $fullName = trim($input['full_name'] ?? '');
            $phone = trim($input['phone'] ?? '');
            $roleKey = trim($input['role_key'] ?? 'staff');
            $status = in_array($input['status'] ?? 'active', ['active', 'inactive'], true) ? $input['status'] : 'active';
            $password = trim($input['password'] ?? '');

            if ($username === '') {
                jsonResponse(['success' => false, 'error' => 'ກະລຸນາປ້ອນຊື່ຜູ້ໃຊ້']);
            }

            if ($id > 0) {
                $old = $db->prepare('SELECT id, username, full_name, phone, role_key, status FROM users WHERE id = ?');
                $old->execute([$id]);
                $oldRow = $old->fetch(PDO::FETCH_ASSOC);
                if (!$oldRow) {
                    jsonResponse(['success' => false, 'error' => 'ບໍ່ພົບຜູ້ໃຊ້']);
                }
                if ($password !== '') {
                    $stmt = $db->prepare('UPDATE users SET username=?, full_name=?, phone=?, role_key=?, status=?, password_hash=? WHERE id=?');
                    $stmt->execute([$username, $fullName, $phone, $roleKey, $status, password_hash($password, PASSWORD_BCRYPT), $id]);
                } else {
                    $stmt = $db->prepare('UPDATE users SET username=?, full_name=?, phone=?, role_key=?, status=? WHERE id=?');
                    $stmt->execute([$username, $fullName, $phone, $roleKey, $status, $id]);
                }
                $logger->logUserUpdate($id, $oldRow, compact('username', 'fullName', 'phone', 'roleKey', 'status'));
                jsonResponse(['success' => true, 'message' => 'ອັບເດດຜູ້ໃຊ້ສຳເລັດ']);
            }

            if ($password === '') {
                jsonResponse(['success' => false, 'error' => 'ກະລຸນາຕັ້ງລະຫັດຜ່ານສຳລັບຜູ້ໃຊ້ໃໝ່']);
            }
            $chk = $db->prepare('SELECT COUNT(*) c FROM users WHERE username = ?');
            $chk->execute([$username]);
            if ((int) $chk->fetch(PDO::FETCH_ASSOC)['c'] > 0) {
                jsonResponse(['success' => false, 'error' => 'ຊື່ຜູ້ໃຊ້ນີ້ມີແລ້ວ']);
            }
            $stmt = $db->prepare('INSERT INTO users (username, password_hash, full_name, phone, role_key, status) VALUES (?,?,?,?,?,?)');
            $stmt->execute([$username, password_hash($password, PASSWORD_BCRYPT), $fullName, $phone, $roleKey, $status]);
            $newId = (int) $db->lastInsertId();
            $logger->logUserCreate(['id' => $newId, 'username' => $username]);
            jsonResponse(['success' => true, 'message' => 'ເພີ່ມຜູ້ໃຊ້ສຳເລັດ', 'id' => $newId]);
        }
        case 'delete': {
            $input = jsonInput();
            $id = (int) ($input['id'] ?? 0);
            if ($id === (int) Auth::user()['id']) {
                jsonResponse(['success' => false, 'error' => 'ບໍ່ສາມາດລຶບບັນຊີຕົນເອງໄດ້']);
            }
            $db->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
            jsonResponse(['success' => true, 'message' => 'ລຶບຜູ້ໃຊ້ສຳເລັດ']);
        }
        default:
            jsonResponse(['success' => false, 'error' => 'Invalid action'], 400);
    }
} catch (Throwable $e) {
    error_log('users.php error: ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'ເກີດຄວາມຜິດພາດ: ' . $e->getMessage()]);
}
