<?php
/**
 * ຟັງຊັນຊ່ວຍທົ່ວໄປ
 */

function formatMoney($amount, string $currency = 'LAK'): string
{
    $amount = (float) $amount;
    $formatted = number_format($amount, 0);
    return "{$formatted} {$currency}";
}

function formatDate(?string $datetime, string $format = 'd/m/Y H:i'): string
{
    if (!$datetime) {
        return '-';
    }
    try {
        return (new DateTime($datetime))->format($format);
    } catch (Exception $e) {
        return $datetime;
    }
}

/** ອ່ານຄ່າການຕັ້ງຄ່າຈາກຕາຕະລາງ settings (key/value) */
function getSetting(PDO $db, string $key, $default = null)
{
    $stmt = $db->prepare('SELECT setting_value FROM settings WHERE setting_key = ? LIMIT 1');
    $stmt->execute([$key]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ? $row['setting_value'] : $default;
}

function setSetting(PDO $db, string $key, $value): void
{
    $stmt = $db->prepare('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)');
    $stmt->execute([$key, $value]);
}

/** ສ້າງລະຫັດຕິດຕາມພັດສະດຸແບບ ASB-YYMMDD-XXXX */
function generateTrackingCode(PDO $db, string $prefix = 'ASB'): string
{
    $date = date('ymd');
    do {
        $rand = strtoupper(substr(bin2hex(random_bytes(3)), 0, 4));
        $code = "{$prefix}-{$date}-{$rand}";
        $stmt = $db->prepare('SELECT COUNT(*) c FROM packages WHERE tracking_code = ?');
        $stmt->execute([$code]);
    } while ((int) $stmt->fetch(PDO::FETCH_ASSOC)['c'] > 0);
    return $code;
}

/** ສ້າງລະຫັດລູກຄ້າແບບ ASB0001 */
function generateCustomerCode(PDO $db): string
{
    $stmt = $db->query('SELECT code FROM customers ORDER BY id DESC LIMIT 1');
    $last = $stmt->fetch(PDO::FETCH_ASSOC);
    $n = 1;
    if ($last && preg_match('/(\d+)$/', $last['code'], $m)) {
        $n = (int) $m[1] + 1;
    }
    return 'ASB' . str_pad((string) $n, 4, '0', STR_PAD_LEFT);
}

const PACKAGE_STATUS_LABELS = [
    'ordered'               => 'ສັ່ງແລ້ວ (ລໍຖ້າຮ້ານຈີນຈັດສົ່ງ)',
    'arrived_cn_warehouse'  => 'ຮອດສາງຈີນແລ້ວ',
    'shipped'               => 'ກຳລັງຂົນສົ່ງມາລາວ',
    'arrived_la_warehouse'  => 'ຮອດສາງລາວແລ້ວ',
    'out_for_delivery'      => 'ກຳລັງຈັດສົ່ງໃຫ້ລູກຄ້າ',
    'delivered'              => 'ສົ່ງເຄື່ອງແລ້ວ',
    'cancelled'              => 'ຍົກເລີກ',
];

function packageStatusLabel(string $status): string
{
    return PACKAGE_STATUS_LABELS[$status] ?? $status;
}

function jsonResponse($data, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function jsonInput(): array
{
    $input = json_decode(file_get_contents('php://input'), true);
    return is_array($input) ? $input : [];
}
