<?php
/**
 * ຈັດການລູກຄ້າ (customers) — action based, ດັດແປງມາຈາກ
 * ptpos.shop/api/customers/api-customers.php ໃຫ້ໃຊ້ໄຟລ໌ດຽວ
 *
 * GET  ?action=list&search=&status=&page=&limit=
 * GET  ?action=get&id=
 * POST ?action=save        (body: id?, full_name, phone, facebook_name, address, province, notes, status)
 * POST ?action=delete       (body: id)
 */
require_once __DIR__ . '/../includes/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');
Auth::requireLogin();

$db = (new Database())->getConnection();
$logger = new ActivityLogger($db);
$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'list': {
            $page = max(1, (int) ($_GET['page'] ?? 1));
            $limit = max(1, min(200, (int) ($_GET['limit'] ?? 20)));
            $search = trim($_GET['search'] ?? '');
            $status = trim($_GET['status'] ?? '');

            $where = ['1=1'];
            $params = [];
            if ($search !== '') {
                $where[] = '(full_name LIKE ? OR phone LIKE ? OR code LIKE ?)';
                $params[] = "%{$search}%";
                $params[] = "%{$search}%";
                $params[] = "%{$search}%";
            }
            if ($status !== '' && $status !== 'all') {
                $where[] = 'status = ?';
                $params[] = $status;
            }
            $whereSql = implode(' AND ', $where);

            $countStmt = $db->prepare("SELECT COUNT(*) c FROM customers WHERE {$whereSql}");
            $countStmt->execute($params);
            $total = (int) $countStmt->fetch(PDO::FETCH_ASSOC)['c'];

            $offset = ($page - 1) * $limit;
            $stmt = $db->prepare("SELECT * FROM customers WHERE {$whereSql} ORDER BY id DESC LIMIT {$limit} OFFSET {$offset}");
            $stmt->execute($params);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            jsonResponse([
                'success' => true,
                'customers' => $rows,
                'total' => $total,
                'total_pages' => (int) ceil($total / $limit),
                'page' => $page,
            ]);
        }
        case 'get': {
            $id = (int) ($_GET['id'] ?? 0);
            $stmt = $db->prepare('SELECT * FROM customers WHERE id = ?');
            $stmt->execute([$id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            jsonResponse(['success' => (bool) $row, 'customer' => $row ?: null]);
        }
        case 'save': {
            $input = jsonInput();
            $id = (int) ($input['id'] ?? 0);
            $fullName = trim($input['full_name'] ?? '');
            $phone = trim($input['phone'] ?? '');
            if ($fullName === '' || $phone === '') {
                jsonResponse(['success' => false, 'error' => 'ກະລຸນາປ້ອນຊື່ ແລະ ເບີໂທ']);
            }
            $data = [
                'full_name'     => $fullName,
                'phone'          => $phone,
                'facebook_name' => trim($input['facebook_name'] ?? ''),
                'address'        => trim($input['address'] ?? ''),
                'province'       => trim($input['province'] ?? ''),
                'notes'          => trim($input['notes'] ?? ''),
                'status'          => in_array($input['status'] ?? 'active', ['active', 'inactive'], true) ? $input['status'] : 'active',
            ];

            if ($id > 0) {
                $old = $db->prepare('SELECT * FROM customers WHERE id = ?');
                $old->execute([$id]);
                $oldRow = $old->fetch(PDO::FETCH_ASSOC);
                if (!$oldRow) {
                    jsonResponse(['success' => false, 'error' => 'ບໍ່ພົບລູກຄ້າ']);
                }
                $stmt = $db->prepare('UPDATE customers SET full_name=?, phone=?, facebook_name=?, address=?, province=?, notes=?, status=? WHERE id=?');
                $stmt->execute([...array_values($data), $id]);
                $logger->logCustomerUpdate($id, $oldRow, $data);
                jsonResponse(['success' => true, 'message' => 'ອັບເດດລູກຄ້າສຳເລັດ', 'id' => $id]);
            }

            $data['code'] = generateCustomerCode($db);
            $stmt = $db->prepare('INSERT INTO customers (code, full_name, phone, facebook_name, address, province, notes, status) VALUES (?,?,?,?,?,?,?,?)');
            $stmt->execute([
                $data['code'], $data['full_name'], $data['phone'], $data['facebook_name'],
                $data['address'], $data['province'], $data['notes'], $data['status'],
            ]);
            $newId = (int) $db->lastInsertId();
            $logger->logCustomerCreate($data + ['id' => $newId]);
            jsonResponse(['success' => true, 'message' => 'ເພີ່ມລູກຄ້າສຳເລັດ', 'id' => $newId, 'code' => $data['code']]);
        }
        case 'delete': {
            $input = jsonInput();
            $id = (int) ($input['id'] ?? 0);
            $stmt = $db->prepare('SELECT * FROM customers WHERE id = ?');
            $stmt->execute([$id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                jsonResponse(['success' => false, 'error' => 'ບໍ່ພົບລູກຄ້າ']);
            }
            $has = $db->prepare('SELECT COUNT(*) c FROM packages WHERE customer_id = ?');
            $has->execute([$id]);
            if ((int) $has->fetch(PDO::FETCH_ASSOC)['c'] > 0) {
                jsonResponse(['success' => false, 'error' => 'ບໍ່ສາມາດລຶບໄດ້ — ລູກຄ້ານີ້ມີພັດສະດຸໃນລະບົບແລ້ວ (ປິດການໃຊ້ງານແທນການລຶບ)']);
            }
            $db->prepare('DELETE FROM customers WHERE id = ?')->execute([$id]);
            $logger->logCustomerDelete($id, $row['full_name']);
            jsonResponse(['success' => true, 'message' => 'ລຶບລູກຄ້າສຳເລັດ']);
        }
        default:
            jsonResponse(['success' => false, 'error' => 'Invalid action'], 400);
    }
} catch (Throwable $e) {
    error_log('customers.php error: ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'ເກີດຄວາມຜິດພາດ: ' . $e->getMessage()]);
}
