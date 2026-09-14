<?php
/**
 * ຄ່າຄົງທີ່ຂອງແອັບ (app-wide settings)
 */
require_once __DIR__ . '/env.php';

date_default_timezone_set(env('APP_TIMEZONE', 'Asia/Vientiane'));

define('APP_NAME', env('APP_NAME', 'ASB ບໍລິການຂົນສົ່ງ ແລະ ຮັບເຄື່ອງຈາກແອັບຈີນ'));
define('APP_DEBUG', filter_var(env('APP_DEBUG', 'false'), FILTER_VALIDATE_BOOLEAN));

if (APP_DEBUG) {
    ini_set('display_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
}

// ຊື່ session ຂອງແອັບນີ້ (ຕ່າງຈາກ ptpos ເພື່ອບໍ່ໃຫ້ session ຂັດກັນຖ້າຕິດຕັ້ງເທິງໂດເມນດຽວກັນ)
define('APP_SESSION_NAME', 'asb_logistics_session');
