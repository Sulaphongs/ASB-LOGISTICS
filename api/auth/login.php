<?php
require_once __DIR__ . '/../../includes/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');

$input = jsonInput();
$username = trim($input['username'] ?? '');
$password = trim($input['password'] ?? '');

if ($username === '' || $password === '') {
    jsonResponse(['success' => false, 'error' => 'ກະລຸນາກອກຂໍ້ມູນໃຫ້ຄົບ']);
}

try {
    $auth = new Auth();
    $result = $auth->attempt($username, $password);

    $logger = new ActivityLogger();
    if ($result['success']) {
        $logger->setUser($result['user']['id'], $result['user']['username']);
        $logger->logAuth($username, 'login', true, ['ip' => $_SERVER['REMOTE_ADDR'] ?? null]);
    } else {
        $logger->logAuth($username, 'login', false, ['ip' => $_SERVER['REMOTE_ADDR'] ?? null, 'reason' => $result['error']]);
    }

    jsonResponse($result);
} catch (Throwable $e) {
    error_log('Login error: ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'ເກີດຄວາມຜິດພາດ, ກະລຸນາລອງໃໝ່'], 200);
}
