<?php
require_once __DIR__ . '/includes/bootstrap.php';
Auth::requireLogin();
$pageTitle = 'ລາຍງານ';
include __DIR__ . '/partials/header.php';
?>
<div class="asb-card" style="margin-bottom:16px;">
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:end;">
        <div class="asb-field" style="margin:0;"><label>ຈາກວັນທີ</label><input id="dateFrom" type="date"></div>
        <div class="asb-field" style="margin:0;"><label>ຫາວັນທີ</label><input id="dateTo" type="date"></div>
        <button class="asb-btn asb-btn-primary" onclick="loadReport()"><i class="bi bi-funnel"></i> ກັ່ນຕອງ</button>
    </div>
</div>
<div id="statCards" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:16px;"></div>
<div class="asb-card">
    <h3 style="margin:0 0 12px;font-size:.95rem;">ລາຍລະອຽດພັດສະດຸ</h3>
    <div style="overflow-x:auto;">
    <table class="asb-table">
        <thead><tr><th>ລະຫັດຕິດຕາມ</th><th>ລູກຄ້າ</th><th>ນ້ຳໜັກ</th><th>ຄ່າຂົນສົ່ງ</th><th>ຄ່າອື່ນໆ</th><th>ລວມ</th><th>ຊຳລະແລ້ວ</th><th>ສະຖານະ</th><th>ວັນທີ</th></tr></thead>
        <tbody id="tbody"></tbody>
    </table>
    </div>
</div>

<script>
async function loadReport() {
    const params = new URLSearchParams({ action: 'list', limit: 500 });
    const r = await fetch(`api/packages.php?${params}`);
    const j = await r.json();
    let rows = j.success ? j.packages : [];

    const from = document.getElementById('dateFrom').value;
    const to = document.getElementById('dateTo').value;
    if (from) rows = rows.filter(p => p.created_at.slice(0, 10) >= from);
    if (to) rows = rows.filter(p => p.created_at.slice(0, 10) <= to);

    const totalRevenue = rows.reduce((s, p) => s + Number(p.total_fee), 0);
    const totalPaid = rows.reduce((s, p) => s + Number(p.paid_amount), 0);
    const totalWeight = rows.reduce((s, p) => s + Number(p.weight_kg || 0), 0);

    document.getElementById('statCards').innerHTML = `
        <div class="asb-stat"><div class="num">${rows.length}</div><div class="label">ຈຳນວນພັດສະດຸ</div></div>
        <div class="asb-stat"><div class="num">${totalWeight.toFixed(1)} kg</div><div class="label">ນ້ຳໜັກລວມ</div></div>
        <div class="asb-stat"><div class="num">${formatMoney(totalRevenue)}</div><div class="label">ຍອດລວມ</div></div>
        <div class="asb-stat"><div class="num" style="color:var(--asb-red)">${formatMoney(totalRevenue - totalPaid)}</div><div class="label">ຄ້າງຈ່າຍ</div></div>
    `;

    document.getElementById('tbody').innerHTML = rows.length ? rows.map(p => `
        <tr>
            <td><strong>${p.tracking_code}</strong></td>
            <td>${p.customer_name}</td>
            <td>${p.weight_kg ? p.weight_kg + ' kg' : '-'}</td>
            <td>${formatMoney(p.shipping_fee, p.currency)}</td>
            <td>${formatMoney(p.other_fee, p.currency)}</td>
            <td>${formatMoney(p.total_fee, p.currency)}</td>
            <td>${formatMoney(p.paid_amount, p.currency)}</td>
            <td><span class="asb-badge ${p.status}">${p.status_label}</span></td>
            <td>${new Date(p.created_at).toLocaleDateString('lo-LA')}</td>
        </tr>
    `).join('') : '<tr><td colspan="9" style="text-align:center;color:var(--asb-muted);">ບໍ່ມີຂໍ້ມູນ</td></tr>';
}
loadReport();
</script>
<?php include __DIR__ . '/partials/footer.php'; ?>
