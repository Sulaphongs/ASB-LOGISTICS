<?php
require_once __DIR__ . '/../../includes/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');

jsonResponse([
    'success'      => true,
    'authenticated' => Auth::check(),
    'user'          => Auth::check() ? Auth::user() : null,
]);
