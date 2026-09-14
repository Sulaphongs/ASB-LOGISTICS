<?php
require_once __DIR__ . '/includes/bootstrap.php';
Auth::requireLogin();
$pageTitle = 'ຮັບ-ສົ່ງ ສາງ';
include __DIR__ . '/partials/header.php';
?>
<div class="asb-card" style="margin-bottom:16px;">
    <h3 style="margin:0 0 6px;font-size:1rem;">ຄົ້ນຫາພັດສະດຸ ເພື່ອອັບເດດສະຖານະ</h3>
    <p style="margin:0 0 14px;color:var(--asb-muted);font-size:.85rem;">ພິມ ຫຼື ສະແກນ ລະຫັດຕິດຕາມ ASB ຫຼືເລກຕິດຕາມຈາກຮ້ານຈີນ</p>
    <div style="display:flex;gap:8px;">
        <input id="scanInput" placeholder="ລະຫັດຕິດຕາມ (ASB-...) ຫຼືເບີໂທລູກຄ້າ" style="flex:1;padding:11px 14px;border:1px solid var(--asb-border);border-radius:9px;font-size:1rem;" autofocus>
        <button class="asb-btn asb-btn-primary" onclick="search()"><i class="bi bi-search"></i> ຄົ້ນຫາ</button>
    </div>
</div>

<div id="results"></div>

<script>
const STATUS_FLOW = ['ordered', 'arrived_cn_warehouse', 'shipped', 'arrived_la_warehouse', 'out_for_delivery', 'delivered'];
const STATUS_LABELS = <?= json_encode(PACKAGE_STATUS_LABELS, JSON_UNESCAPED_UNICODE) ?>;

document.getElementById('scanInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') search(); });

async function search() {
    const term = document.getElementById('scanInput').value.trim();
    if (!term) return;
    const r = await fetch(`api/packages.php?action=list&search=${encodeURIComponent(term)}&limit=20`);
    const j = await r.json();
    const results = j.success ? j.packages : [];
    document.getElementById('results').innerHTML = results.length ? results.map(rowHtml).join('') :
        '<div class="asb-card" style="text-align:center;color:var(--asb-muted);">ບໍ່ພົບພັດສະດຸ</div>';
}

function rowHtml(p) {
    const idx = STATUS_FLOW.indexOf(p.status);
    const next = p.status !== 'cancelled' && idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
    return `
    <div class="asb-card" style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
        <div>
            <div style="font-weight:700;">${p.tracking_code} <span class="asb-badge ${p.status}">${p.status_label}</span></div>
            <div style="color:var(--asb-muted);font-size:.85rem;">${p.customer_name} — ${p.customer_phone} · ${p.item_description || ''}</div>
        </div>
        <div style="display:flex;gap:8px;">
            <a class="asb-btn asb-btn-light asb-btn-sm" href="package-detail.php?id=${p.id}">ລາຍລະອຽດ</a>
            ${next ? `<button class="asb-btn asb-btn-primary asb-btn-sm" onclick="advance(${p.id}, '${next}')">ໄປ: ${STATUS_LABELS[next]}</button>` : ''}
        </div>
    </div>`;
}

async function advance(id, status) {
    const r = await fetch('api/packages.php?action=update-status', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, note: 'ອັບເດດຜ່ານໜ້າຮັບ-ສົ່ງສາງ' })
    });
    const j = await r.json();
    if (j.success) { toast('success', j.message); search(); }
    else Swal.fire('ຜິດພາດ', j.error || 'ບໍ່ສຳເລັດ', 'error');
}
</script>
<?php include __DIR__ . '/partials/footer.php'; ?>
