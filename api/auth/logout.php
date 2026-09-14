<?php
require_once __DIR__ . '/../../includes/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');

$auth = new Auth();
$auth->logout();

jsonResponse(['success' => true, 'message' => 'ອອກຈາກລະບົບແລ້ວ']);
