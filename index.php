<?php
require_once __DIR__ . '/includes/bootstrap.php';
header('Location: ' . (Auth::check() ? 'dashboard.php' : 'login.php'));
exit;
