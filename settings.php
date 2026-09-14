<?php
require_once __DIR__ . '/includes/bootstrap.php';
Auth::requireLogin();
if (!Auth::isAdmin()) { header('Location: dashboard.php'); exit; }
$pageTitle = 'ການຕັ້ງຄ່າ';
include __DIR__ . '/partials/header.php';
?>
<div class="asb-card" style="max-width:640px;">
    <h3 style="margin:0 0 16px;font-size:1rem;">ຂໍ້ມູນບໍລິສັດ</h3>
    <form id="form">
        <div class="asb-field"><label>ຊື່ບໍລິສັດ/ຮ້ານ</label><input id="company_name"></div>
        <div class="asb-field"><label>ເບີໂທຕິດຕໍ່</label><input id="company_phone"></div>
        <div class="asb-field"><label>ທີ່ຢູ່</label><textarea id="company_address" rows="2"></textarea></div>
        <div class="asb-field"><label>Facebook Page</label><input id="company_facebook"></div>
        <div class="asb-field"><label>ຄຳນຳໜ້າລະຫັດຕິດຕາມ (ເຊັ່ນ ASB)</label><input id="tracking_prefix" maxlength="10"></div>
        <hr style="border:none;border-top:1px solid var(--asb-border);margin:18px 0;">
        <h3 style="margin:0 0 16px;font-size:1rem;">ອັດຕາແລກປ່ຽນເງິນ (ອ້າງອີງ)</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="asb-field"><label>1 CNY = ? LAK</label><input id="currency_cny_to_lak" type="number" step="0.01"></div>
            <div class="asb-field"><label>1 THB = ? LAK</label><input id="currency_thb_to_lak" type="number" step="0.01"></div>
        </div>
        <button type="submit" class="asb-btn asb-btn-primary" style="margin-top:10px;">ບັນທຶກການຕັ້ງຄ່າ</button>
    </form>
</div>

<script>
async function load() {
    const r = await fetch('api/settings.php?action=get');
    const j = await r.json();
    if (!j.success) return;
    Object.entries(j.settings).forEach(([k, v]) => {
        const el = document.getElementById(k);
        if (el) el.value = v;
    });
}
document.getElementById('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {};
    ['company_name', 'company_phone', 'company_address', 'company_facebook', 'tracking_prefix', 'currency_cny_to_lak', 'currency_thb_to_lak'].forEach(k => {
        payload[k] = document.getElementById(k).value;
    });
    const r = await fetch('api/settings.php?action=save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const j = await r.json();
    if (j.success) toast('success', j.message);
    else Swal.fire('ຜິດພາດ', j.error || 'ບໍ່ສຳເລັດ', 'error');
});
load();
</script>
<?php include __DIR__ . '/partials/footer.php'; ?>
