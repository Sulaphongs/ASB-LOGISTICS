<?php
require_once __DIR__ . '/includes/bootstrap.php';
(new Auth())->logout();
header('Location: login.php');
exit;
