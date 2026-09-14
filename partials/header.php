<?php
/**
 * Header ຮ່ວມ — ໃຊ້ໃນທຸກໜ້າຫຼັງ login
 * ຕ້ອງ require bootstrap.php ແລະ ຕັ້ງ $pageTitle ກ່ອນ include ໄຟລ໌ນີ້
 */
if (!isset($pageTitle)) { $pageTitle = APP_NAME; }
$currentUser = Auth::user();
?>
<!DOCTYPE html>
<html lang="lo">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= htmlspecialchars($pageTitle) ?> — <?= htmlspecialchars(APP_NAME) ?></title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;500;600;700&display=swap" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="assets/css/style.css">
</head>
<body class="asb-body">
<div id="_sb_btn" onclick="toggleSidebar()"><i class="bi bi-list"></i></div>
<div id="_sb_ov" onclick="toggleSidebar()"></div>
<?php include __DIR__ . '/sidebar.php'; ?>

<main class="asb-main">
    <header class="asb-topbar">
        <div class="asb-topbar-title"><?= htmlspecialchars($pageTitle) ?></div>
        <div class="asb-topbar-user">
            <i class="bi bi-person-circle"></i>
            <span><?= htmlspecialchars($currentUser['full_name'] ?: $currentUser['username']) ?></span>
            <a href="#" onclick="doLogout(event)" title="ອອກຈາກລະບົບ"><i class="bi bi-box-arrow-right"></i></a>
        </div>
    </header>
    <div class="asb-content">
