<?php
/**
 * ພັດສະດຸ / ອອເດີຂົນສົ່ງ — ຫົວໃຈຫຼັກຂອງທຸລະກິດ ASB Logistics
 *
 * GET  ?action=list&search=&status=&customer_id=&page=&limit=
 * GET  ?action=get&id=
 * GET  ?action=timeline&id=
 * POST ?action=save            (create/update package)
 * POST ?action=update-status    (body: id, status, note?)
 * POST ?action=delete            (body: id)
 */
require_once __DIR__ . '/../includes/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');
Auth::requireLogin();

$db = (new Database())->getConnection();
$logger = new ActivityLogger($db);
$action = $_GET['action'] ?? '';
$user = Auth::user();

function recalcTotal(array $d): array
{
    $d['total_fee'] = round((float) $d['shipping_fee'] + (float) $d['other_fee'], 0);
    return $d;
}

try {
    switch ($action) {
        case 'list': {
            $page = max(1, (int) ($_GET['page'] ?? 1));
            $limit = max(1, min(200, (int) ($_GET['limit'] ?? 20)));
            $search = trim($_GET['search'] ?? '');
            $status = trim($_GET['status'] ?? '');
            $customerId = (int) ($_GET['customer_id'] ?? 0);

            $where = ['1=1'];
            $params = [];
            if ($search !== '') {
                $where[] = '(p.tracking_code LIKE ? OR p.china_tracking_no LIKE ? OR c.full_name LIKE ? OR c.phone LIKE ?)';
                array_push($params, "%{$search}%", "%{$search}%", "%{$search}%", "%{$search}%");
            }
            if ($status !== '' && $status !== 'all') {
                $where[] = 'p.status = ?';
                $params[] = $status;
            }
            if ($customerId > 0) {
                $where[] = 'p.customer_id = ?';
                $params[] = $customerId;
            }
            $whereSql = implode(' AND ', $where);

            $countStmt = $db->prepare("SELECT COUNT(*) c FROM packages p JOIN customers c ON c.id = p.customer_id WHERE {$whereSql}");
            $countStmt->execute($params);
            $total = (int) $countStmt->fetch(PDO::FETCH_ASSOC)['c'];

            $offset = ($page - 1) * $limit;
            $stmt = $db->prepare("
                SELECT p.*, c.full_name AS customer_name, c.phone AS customer_phone, c.code AS customer_code
                FROM packages p JOIN customers c ON c.id = p.customer_id
                WHERE {$whereSql}
                ORDER BY p.id DESC LIMIT {$limit} OFFSET {$offset}
            ");
            $stmt->execute($params);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($rows as &$r) {
                $r['status_label'] = packageStatusLabel($r['status']);
            }

            jsonResponse([
                'success' => true,
                'packages' => $rows,
                'total' => $total,
                'total_pages' => (int) ceil($total / $limit),
                'page' => $page,
            ]);
        }
        case 'get': {
            $id = (int) ($_GET['id'] ?? 0);
            $stmt = $db->prepare('
                SELECT p.*, c.full_name AS customer_name, c.phone AS customer_phone, c.code AS customer_code, c.address AS customer_address
                FROM packages p JOIN customers c ON c.id = p.customer_id WHERE p.id = ?
            ');
            $stmt->execute([$id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                $row['status_label'] = packageStatusLabel($row['status']);
            }
            jsonResponse(['success' => (bool) $row, 'package' => $row ?: null]);
        }
        case 'timeline': {
            $id = (int) ($_GET['id'] ?? 0);
            $stmt = $db->prepare('SELECT * FROM package_status_history WHERE package_id = ? ORDER BY created_at ASC, id ASC');
            $stmt->execute([$id]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($rows as &$r) {
                $r['status_label'] = packageStatusLabel($r['status']);
            }
            jsonResponse(['success' => true, 'timeline' => $rows]);
        }
        case 'save': {
            $input = jsonInput();
            $id = (int) ($input['id'] ?? 0);
            $customerId = (int) ($input['customer_id'] ?? 0);
            if ($customerId <= 0) {
                jsonResponse(['success' => false, 'error' => 'ກະລຸນາເລືອກລູກຄ້າ']);
            }
            $chk = $db->prepare('SELECT id FROM customers WHERE id = ?');
            $chk->execute([$customerId]);
            if (!$chk->fetch()) {
                jsonResponse(['success' => false, 'error' => 'ບໍ່ພົບລູກຄ້ານີ້']);
            }

            $data = [
                'customer_id'        => $customerId,
                'china_tracking_no'  => trim($input['china_tracking_no'] ?? ''),
                'item_description'    => trim($input['item_description'] ?? ''),
                'shop_link'           => trim($input['shop_link'] ?? ''),
                'quantity'             => max(1, (int) ($input['quantity'] ?? 1)),
                'weight_kg'            => $input['weight_kg'] !== '' && isset($input['weight_kg']) ? (float) $input['weight_kg'] : null,
                'volume_cbm'           => $input['volume_cbm'] !== '' && isset($input['volume_cbm']) ? (float) $input['volume_cbm'] : null,
                'declared_value_cny'  => $input['declared_value_cny'] !== '' && isset($input['declared_value_cny']) ? (float) $input['declared_value_cny'] : null,
                'pricing_rule_id'     => !empty($input['pricing_rule_id']) ? (int) $input['pricing_rule_id'] : null,
                'shipping_fee'         => (float) ($input['shipping_fee'] ?? 0),
                'other_fee'            => (float) ($input['other_fee'] ?? 0),
                'currency'             => trim($input['currency'] ?? 'LAK'),
                'payment_status'       => in_array($input['payment_status'] ?? 'unpaid', ['unpaid', 'partial', 'paid'], true) ? $input['payment_status'] : 'unpaid',
                'paid_amount'          => (float) ($input['paid_amount'] ?? 0),
                'notes'                => trim($input['notes'] ?? ''),
            ];
            $data = recalcTotal($data);

            if ($id > 0) {
                $old = $db->prepare('SELECT * FROM packages WHERE id = ?');
                $old->execute([$id]);
                $oldRow = $old->fetch(PDO::FETCH_ASSOC);
                if (!$oldRow) {
                    jsonResponse(['success' => false, 'error' => 'ບໍ່ພົບພັດສະດຸ']);
                }
                $stmt = $db->prepare('UPDATE packages SET customer_id=?, china_tracking_no=?, item_description=?, shop_link=?, quantity=?, weight_kg=?, volume_cbm=?, declared_value_cny=?, pricing_rule_id=?, shipping_fee=?, other_fee=?, total_fee=?, currency=?, payment_status=?, paid_amount=?, notes=? WHERE id=?');
                // ໝາຍເຫດ: ລະບຸ params ຕາມລຳດັບ SQL ຢ່າງຊັດເຈນ — ຫ້າມໃຊ້ array_values($data) ກົງໆ
                // ເພາະ recalcTotal() ເພີ່ມ total_fee ຕໍ່ທ້າຍ array ເຮັດໃຫ້ລຳດັບບໍ່ກົງກັບ SQL
                $stmt->execute([
                    $data['customer_id'], $data['china_tracking_no'], $data['item_description'], $data['shop_link'],
                    $data['quantity'], $data['weight_kg'], $data['volume_cbm'], $data['declared_value_cny'],
                    $data['pricing_rule_id'], $data['shipping_fee'], $data['other_fee'], $data['total_fee'],
                    $data['currency'], $data['payment_status'], $data['paid_amount'], $data['notes'], $id,
                ]);
                $logger->logPackageUpdate($id, $oldRow, $data);
                jsonResponse(['success' => true, 'message' => 'ອັບເດດພັດສະດຸສຳເລັດ', 'id' => $id, 'tracking_code' => $oldRow['tracking_code']]);
            }

            $trackingCode = generateTrackingCode($db, getSetting($db, 'tracking_prefix', 'ASB'));
            $stmt = $db->prepare('INSERT INTO packages
                (tracking_code, customer_id, china_tracking_no, item_description, shop_link, quantity, weight_kg, volume_cbm, declared_value_cny, pricing_rule_id, shipping_fee, other_fee, total_fee, currency, payment_status, paid_amount, notes, status, created_by)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, "ordered", ?)');
            $stmt->execute([
                $trackingCode, $data['customer_id'], $data['china_tracking_no'], $data['item_description'], $data['shop_link'],
                $data['quantity'], $data['weight_kg'], $data['volume_cbm'], $data['declared_value_cny'], $data['pricing_rule_id'],
                $data['shipping_fee'], $data['other_fee'], $data['total_fee'], $data['currency'], $data['payment_status'],
                $data['paid_amount'], $data['notes'], $user['id'],
            ]);
            $newId = (int) $db->lastInsertId();

            $hist = $db->prepare('INSERT INTO package_status_history (package_id, status, note, changed_by, changed_by_name) VALUES (?,"ordered","ສ້າງອອເດີໃໝ່",?,?)');
            $hist->execute([$newId, $user['id'], $user['full_name'] ?? $user['username']]);

            $logger->logPackageCreate($data + ['id' => $newId, 'tracking_code' => $trackingCode]);
            jsonResponse(['success' => true, 'message' => 'ສ້າງພັດສະດຸສຳເລັດ', 'id' => $newId, 'tracking_code' => $trackingCode]);
        }
        case 'update-status': {
            $input = jsonInput();
            $id = (int) ($input['id'] ?? 0);
            $newStatus = trim($input['status'] ?? '');
            $note = trim($input['note'] ?? '');
            if (!array_key_exists($newStatus, PACKAGE_STATUS_LABELS)) {
                jsonResponse(['success' => false, 'error' => 'ສະຖານະບໍ່ຖືກຕ້ອງ']);
            }
            $stmt = $db->prepare('SELECT * FROM packages WHERE id = ?');
            $stmt->execute([$id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                jsonResponse(['success' => false, 'error' => 'ບໍ່ພົບພັດສະດຸ']);
            }

            $timestampCol = match ($newStatus) {
                'arrived_cn_warehouse' => 'cn_warehouse_at',
                'shipped'               => 'shipped_at',
                'arrived_la_warehouse' => 'la_warehouse_at',
                'delivered'             => 'delivered_at',
                default                  => null,
            };
            if ($timestampCol) {
                $db->prepare("UPDATE packages SET status = ?, {$timestampCol} = NOW() WHERE id = ?")->execute([$newStatus, $id]);
            } else {
                $db->prepare('UPDATE packages SET status = ? WHERE id = ?')->execute([$newStatus, $id]);
            }

            $hist = $db->prepare('INSERT INTO package_status_history (package_id, status, note, changed_by, changed_by_name) VALUES (?,?,?,?,?)');
            $hist->execute([$id, $newStatus, $note ?: packageStatusLabel($newStatus), $user['id'], $user['full_name'] ?? $user['username']]);

            $logger->logPackageStatusChange($id, $row['tracking_code'], $row['status'], $newStatus);
            jsonResponse(['success' => true, 'message' => 'ອັບເດດສະຖານະສຳເລັດ', 'status' => $newStatus, 'status_label' => packageStatusLabel($newStatus)]);
        }
        case 'delete': {
            $input = jsonInput();
            $id = (int) ($input['id'] ?? 0);
            $stmt = $db->prepare('SELECT * FROM packages WHERE id = ?');
            $stmt->execute([$id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                jsonResponse(['success' => false, 'error' => 'ບໍ່ພົບພັດສະດຸ']);
            }
            $db->prepare('DELETE FROM packages WHERE id = ?')->execute([$id]);
            $logger->logPackageDelete($id, $row['tracking_code']);
            jsonResponse(['success' => true, 'message' => 'ລຶບພັດສະດຸສຳເລັດ']);
        }
        default:
            jsonResponse(['success' => false, 'error' => 'Invalid action'], 400);
    }
} catch (Throwable $e) {
    error_log('packages.php error: ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'ເກີດຄວາມຜິດພາດ: ' . $e->getMessage()]);
}
