<?php
/**
 * ກົດເກນລາຄາຂົນສົ່ງ (pricing rules) + ຄິດໄລ່ຄ່າຂົນສົ່ງ
 * GET  ?action=list
 * POST ?action=save     (body: id?, name, shipping_type, calc_method, rate, min_charge, currency, is_default, status)
 * POST ?action=delete    (body: id)
 * POST ?action=calculate (body: pricing_rule_id, weight_kg?, volume_cbm?, other_fee?)
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
            $stmt = $db->query('SELECT * FROM pricing_rules ORDER BY is_default DESC, id DESC');
            jsonResponse(['success' => true, 'rules' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }
        case 'save': {
            if (!Auth::isAdmin()) {
                jsonResponse(['success' => false, 'error' => 'ສະເພາະຜູ້ດູແລລະບົບເທົ່ານັ້ນ'], 403);
            }
            $input = jsonInput();
            $id = (int) ($input['id'] ?? 0);
            $name = trim($input['name'] ?? '');
            if ($name === '') {
                jsonResponse(['success' => false, 'error' => 'ກະລຸນາປ້ອນຊື່ກົດເກນ']);
            }
            $data = [
                'name'          => $name,
                'shipping_type' => in_array($input['shipping_type'] ?? 'land', ['land', 'air'], true) ? $input['shipping_type'] : 'land',
                'calc_method'   => in_array($input['calc_method'] ?? 'per_kg', ['per_kg', 'per_cbm'], true) ? $input['calc_method'] : 'per_kg',
                'rate'          => (float) ($input['rate'] ?? 0),
                'min_charge'    => (float) ($input['min_charge'] ?? 0),
                'currency'      => trim($input['currency'] ?? 'LAK'),
                'is_default'    => !empty($input['is_default']) ? 1 : 0,
                'status'        => in_array($input['status'] ?? 'active', ['active', 'inactive'], true) ? $input['status'] : 'active',
            ];

            if ($data['is_default']) {
                $db->exec('UPDATE pricing_rules SET is_default = 0');
            }

            if ($id > 0) {
                $old = $db->prepare('SELECT * FROM pricing_rules WHERE id = ?');
                $old->execute([$id]);
                $oldRow = $old->fetch(PDO::FETCH_ASSOC);
                $stmt = $db->prepare('UPDATE pricing_rules SET name=?, shipping_type=?, calc_method=?, rate=?, min_charge=?, currency=?, is_default=?, status=? WHERE id=?');
                $stmt->execute([...array_values($data), $id]);
                $logger->logPricingUpdate($id, $oldRow ?: [], $data);
                jsonResponse(['success' => true, 'message' => 'ອັບເດດກົດເກນລາຄາສຳເລັດ']);
            }

            $stmt = $db->prepare('INSERT INTO pricing_rules (name, shipping_type, calc_method, rate, min_charge, currency, is_default, status) VALUES (?,?,?,?,?,?,?,?)');
            $stmt->execute(array_values($data));
            $logger->logPricingCreate($data);
            jsonResponse(['success' => true, 'message' => 'ເພີ່ມກົດເກນລາຄາສຳເລັດ', 'id' => (int) $db->lastInsertId()]);
        }
        case 'delete': {
            if (!Auth::isAdmin()) {
                jsonResponse(['success' => false, 'error' => 'ສະເພາະຜູ້ດູແລລະບົບເທົ່ານັ້ນ'], 403);
            }
            $input = jsonInput();
            $id = (int) ($input['id'] ?? 0);
            $inUse = $db->prepare('SELECT COUNT(*) c FROM packages WHERE pricing_rule_id = ?');
            $inUse->execute([$id]);
            if ((int) $inUse->fetch(PDO::FETCH_ASSOC)['c'] > 0) {
                jsonResponse(['success' => false, 'error' => 'ກົດເກນນີ້ຖືກໃຊ້ຢູ່ໃນພັດສະດຸແລ້ວ, ປິດການໃຊ້ງານແທນການລຶບ']);
            }
            $db->prepare('DELETE FROM pricing_rules WHERE id = ?')->execute([$id]);
            jsonResponse(['success' => true, 'message' => 'ລຶບກົດເກນລາຄາສຳເລັດ']);
        }
        case 'calculate': {
            $input = jsonInput();
            $ruleId = (int) ($input['pricing_rule_id'] ?? 0);
            $weight = (float) ($input['weight_kg'] ?? 0);
            $volume = (float) ($input['volume_cbm'] ?? 0);
            $otherFee = (float) ($input['other_fee'] ?? 0);

            $stmt = $db->prepare('SELECT * FROM pricing_rules WHERE id = ? AND status = "active"');
            $stmt->execute([$ruleId]);
            $rule = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$rule) {
                jsonResponse(['success' => false, 'error' => 'ບໍ່ພົບກົດເກນລາຄາ']);
            }

            $qty = $rule['calc_method'] === 'per_cbm' ? $volume : $weight;
            $shippingFee = max($qty * (float) $rule['rate'], (float) $rule['min_charge']);
            $total = $shippingFee + $otherFee;

            jsonResponse([
                'success' => true,
                'calc_method' => $rule['calc_method'],
                'rate' => (float) $rule['rate'],
                'min_charge' => (float) $rule['min_charge'],
                'shipping_fee' => round($shippingFee, 0),
                'other_fee' => round($otherFee, 0),
                'total_fee' => round($total, 0),
                'currency' => $rule['currency'],
            ]);
        }
        default:
            jsonResponse(['success' => false, 'error' => 'Invalid action'], 400);
    }
} catch (Throwable $e) {
    error_log('pricing.php error: ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'ເກີດຄວາມຜິດພາດ: ' . $e->getMessage()]);
}
