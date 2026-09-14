<?php
require_once __DIR__ . '/includes/bootstrap.php';
Auth::requireLogin();
$pageTitle = 'Dashboard';
include __DIR__ . '/partials/header.php';
?>
<div class="asb-card" style="margin-bottom:16px;">
    <h2 style="margin:0 0 4px;font-size:1.1rem;">👋 ສະບາຍດີ, <?= htmlspecialchars(Auth::user()['full_name'] ?: Auth::user()['username']) ?></h2>
    <p style="margin:0;color:var(--asb-muted);font-size:.88rem;">ພາບລວມການຂົນສົ່ງ ASB ມື້ນີ້</p>
</div>

<div id="statCards" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:18px;"></div>

<div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;" id="dashGrid">
    <div class="asb-card">
        <h3 style="margin:0 0 12px;font-size:.95rem;">ພັດສະດຸລ່າສຸດ</h3>
        <div style="overflow-x:auto;">
        <table class="asb-table">
            <thead><tr><th>ລະຫັດຕິດຕາມ</th><th>ລູກຄ້າ</th><th>ສະຖານະ</th><th>ຍອດລວມ</th><th>ວັນທີ</th></tr></thead>
            <tbody id="recentBody"><tr><td colspan="5" style="text-align:center;color:var(--asb-muted);">ກຳລັງໂຫຼດ...</td></tr></tbody>
        </table>
        </div>
    </div>
    <div class="asb-card">
        <h3 style="margin:0 0 12px;font-size:.95rem;">ພັດສະດຸຕາມສະຖານະ</h3>
        <div id="statusList"></div>
    </div>
</div>

<script>
async function loadDashboard() {
    try {
        const r = await fetch('api/dashboard-stats.php');
        const j = await r.json();
        if (!j.success) return;

        document.getElementById('statCards').innerHTML = `
            <div class="asb-stat"><div class="num">${j.total_packages}</div><div class="label">ພັດສະດຸທັງໝົດ</div></div>
            <div class="asb-stat"><div class="num">${j.total_customers}</div><div class="label">ລູກຄ້າທັງໝົດ</div></div>
            <div class="asb-stat"><div class="num">${formatMoney(j.revenue_this_month)}</div><div class="label">ລາຍຮັບເດືອນນີ້</div></div>
            <div class="asb-stat"><div class="num" style="color:var(--asb-red)">${formatMoney(j.unpaid_total)}</div><div class="label">ຄ້າງຈ່າຍ</div></div>
        `;

        document.getElementById('recentBody').innerHTML = j.recent_packages.length ? j.recent_packages.map(p => `
            <tr>
                <td><a href="package-detail.php?id=${p.id}" style="font-weight:600;color:inherit;text-decoration:none;">${p.tracking_code}</a></td>
                <td>${p.customer_name}</td>
                <td><span class="asb-badge ${p.status}">${p.status_label}</span></td>
                <td>${formatMoney(p.total_fee, p.currency)}</td>
                <td>${new Date(p.created_at).toLocaleDateString('lo-LA')}</td>
            </tr>
        `).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--asb-muted);">ຍັງບໍ່ມີພັດສະດຸ</td></tr>';

        document.getElementById('statusList').innerHTML = j.status_breakdown.map(s => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--asb-border);">
                <span class="asb-badge ${s.status}">${s.label}</span>
                <strong>${s.count}</strong>
            </div>
        `).join('');
    } catch (e) {
        console.error(e);
    }
}
loadDashboard();
</script>
<?php include __DIR__ . '/partials/footer.php'; ?>
