<?php
/**
 * Sidebar — ດັດແປງມາຈາກ ptpos.shop/partials/sidebar.php (dark+gold overlay style)
 * ລາຍການເມນູປ່ຽນຈາກ POS (ຂາຍເຄື່ອງ/ຄົວ/ໂຕະ) ມາເປັນ ASB Logistics
 */
$currentPage = basename($_SERVER['SCRIPT_NAME'] ?? '');
$role = $_SESSION['role_key'] ?? 'staff';
$isAdmin = $role === 'admin';

$menu = [
    ['ຫຼັກ', [
        ['dashboard.php', 'bi-speedometer2', 'Dashboard'],
        ['packages.php', 'bi-box-seam', 'ພັດສະດຸ / ອອເດີ'],
        ['receiving.php', 'bi-truck', 'ຮັບ-ສົ່ງ ສາງ'],
        ['pricing.php', 'bi-calculator', 'ຄິດໄລ່ຄ່າຂົນສົ່ງ'],
    ]],
    ['ຂໍ້ມູນ', [
        ['customers.php', 'bi-people', 'ລູກຄ້າ'],
        ['reports.php', 'bi-bar-chart', 'ລາຍງານ'],
    ]],
];
if ($isAdmin) {
    $menu[] = ['ຜູ້ດູແລລະບົບ', [
        ['users.php', 'bi-person-badge', 'ຜູ້ໃຊ້ງານ'],
        ['settings.php', 'bi-gear', 'ການຕັ້ງຄ່າ'],
    ]];
}
?>
<div id="_sb_panel">
    <div class="_sb_brand">
        <div class="_sb_logo_txt">ASB</div>
        <div>
            <div class="_sb_title">ASB LOGISTICS</div>
            <div class="_sb_sub">ຂົນສົ່ງ &amp; ຮັບເຄື່ອງຈາກແອັບຈີນ</div>
        </div>
    </div>
    <nav class="_sb_nav">
        <?php foreach ($menu as [$label, $items]): ?>
        <div class="_sb_group">
            <div class="_sb_glabel"><?= htmlspecialchars($label) ?></div>
            <ul class="_sb_ul">
                <?php foreach ($items as [$href, $icon, $text]): ?>
                <li>
                    <a class="_sb_a <?= $currentPage === $href ? 'active' : '' ?>" href="<?= htmlspecialchars($href) ?>">
                        <i class="bi <?= htmlspecialchars($icon) ?>"></i><span><?= htmlspecialchars($text) ?></span>
                    </a>
                </li>
                <?php endforeach; ?>
            </ul>
        </div>
        <?php endforeach; ?>
    </nav>
</div>
