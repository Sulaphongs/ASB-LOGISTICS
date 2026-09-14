<?php
/**
 * ໂຫຼດຄ່າພື້ນຖານທັງໝົດ — ໃຫ້ໜ້າເວັບ ຫຼື API ໄຟລ໌ໃດໆ require ໄຟລ໌ນີ້ໄຟລ໌ດຽວ
 */
require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../classes/ActivityLogger.php';
require_once __DIR__ . '/../classes/Auth.php';
require_once __DIR__ . '/functions.php';

if (session_status() === PHP_SESSION_NONE) {
    session_name(APP_SESSION_NAME);
    session_start();
}
