<?php
require_once __DIR__ . '/includes/bootstrap.php';
Auth::requireLogin();
$pageTitle = 'ລາຍລະອຽດພັດສະດຸ';
include __DIR__ . '/partials/header.php';
?>
<a href="packages.php" class="asb-btn asb-btn-light asb-btn-sm" style="margin-bottom:14px;"><i class="bi bi-arrow-left"></i> ກັບໄປລາຍການ</a>

<div id="content">ກຳລັງໂຫຼດ...</div>

<script>
const id = new URLSearchParams(location.search).get('id');
const STATUS_FLOW = ['ordered', 'arrived_cn_warehouse', 'shipped', 'arrived_la_warehouse', 'out_for_delivery', 'delivered'];
const STATUS_LABELS = <?= json_encode(PACKAGE_STATUS_LABELS, JSON_UNESCAPED_UNICODE) ?>;

async function load() {
    if (!id) { document.getElementById('content').innerHTML = '<p>ບໍ່ພົບ ID</p>'; return; }
    const [pr, tr] = await Promise.all([
        fetch(`api/packages.php?action=get&id=${id}`).then(r => r.json()),
        fetch(`api/packages.php?action=timeline&id=${id}`).then(r => r.json()),
    ]);
    if (!pr.success) { document.getElementById('content').innerHTML = '<p>ບໍ່ພົບພັດສະດຸ</p>'; return; }
    render(pr.package, tr.timeline || []);
}

function render(p, timeline) {
    const currentIdx = STATUS_FLOW.indexOf(p.status);
    const nextStatus = p.status !== 'cancelled' && currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIdx + 1] : null;

    document.getElementById('content').innerHTML = `
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;">
        <div class="asb-card">
            <div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:8px;">
                <div>
                    <h2 style="margin:0 0 4px;">${p.tracking_code}</h2>
                    <p style="margin:0;color:var(--asb-muted);">${p.item_description || 'ບໍ່ມີລາຍລະອຽດ'}</p>
                </div>
                <span class="asb-badge ${p.status}" style="font-size:.85rem;">${p.status_label}</span>
            </div>
            <hr style="border:none;border-top:1px solid var(--asb-border);margin:16px 0;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:.9rem;">
                <div><strong>ລູກຄ້າ:</strong> ${p.customer_name} (${p.customer_code})</div>
                <div><strong>ເບີໂທ:</strong> ${p.customer_phone}</div>
                <div><strong>ເລກຕິດຕາມຈີນ:</strong> ${p.china_tracking_no || '-'}</div>
                <div><strong>ຈຳນວນ:</strong> ${p.quantity}</div>
                <div><strong>ນ້ຳໜັກ:</strong> ${p.weight_kg ? p.weight_kg + ' kg' : '-'}</div>
                <div><strong>ປະລິມາດ:</strong> ${p.volume_cbm ? p.volume_cbm + ' cbm' : '-'}</div>
                <div><strong>ມູນຄ່າສິນຄ້າ:</strong> ${p.declared_value_cny ? p.declared_value_cny + ' CNY' : '-'}</div>
                <div><strong>ທີ່ຢູ່ຈັດສົ່ງ:</strong> ${p.customer_address || '-'}</div>
            </div>
            ${p.shop_link ? `<p style="margin-top:10px;"><strong>ລິ້ງຮ້ານ:</strong> <a href="${p.shop_link}" target="_blank" rel="noopener">${p.shop_link}</a></p>` : ''}
            ${p.notes ? `<p style="margin-top:10px;"><strong>ໝາຍເຫດ:</strong> ${p.notes}</p>` : ''}
            <hr style="border:none;border-top:1px solid var(--asb-border);margin:16px 0;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:.9rem;">
                <div><strong>ຄ່າຂົນສົ່ງ:</strong> ${formatMoney(p.shipping_fee, p.currency)}</div>
                <div><strong>ຄ່າອື່ນໆ:</strong> ${formatMoney(p.other_fee, p.currency)}</div>
                <div><strong>ລວມທັງໝົດ:</strong> ${formatMoney(p.total_fee, p.currency)}</div>
                <div><strong>ຊຳລະແລ້ວ:</strong> ${formatMoney(p.paid_amount, p.currency)} <span class="asb-badge ${p.payment_status}">${p.payment_status}</span></div>
            </div>
        </div>

        <div class="asb-card">
            <h3 style="margin:0 0 12px;font-size:.95rem;">ປະຫວັດການເຄື່ອນໄຫວ</h3>
            ${p.status !== 'cancelled' && p.status !== 'delivered' ? `
                <div style="margin-bottom:14px;display:flex;flex-direction:column;gap:8px;">
                    ${nextStatus ? `<button class="asb-btn asb-btn-primary" onclick="updateStatus('${nextStatus}')"><i class="bi bi-arrow-right-circle"></i> ໄປຂັ້ນຕໍ່ໄປ: ${STATUS_LABELS[nextStatus]}</button>` : ''}
                    <button class="asb-btn asb-btn-danger" onclick="updateStatus('cancelled')"><i class="bi bi-x-circle"></i> ຍົກເລີກອອເດີ</button>
                </div>
            ` : ''}
            <div style="display:flex;flex-direction:column;gap:12px;">
                ${timeline.map(t => `
                    <div style="border-left:2px solid var(--asb-gold, #e8c73c);padding-left:12px;">
                        <div style="font-weight:600;font-size:.88rem;">${t.status_label}</div>
                        <div style="font-size:.78rem;color:var(--asb-muted);">${new Date(t.created_at).toLocaleString('lo-LA')} ${t.changed_by_name ? '— ' + t.changed_by_name : ''}</div>
                        ${t.note ? `<div style="font-size:.82rem;margin-top:2px;">${t.note}</div>` : ''}
                    </div>
                `).join('') || '<p style="color:var(--asb-muted);">ຍັງບໍ່ມີປະຫວັດ</p>'}
            </div>
        </div>
    </div>`;
}

async function updateStatus(status) {
    const { value: note } = await Swal.fire({
        title: `ປ່ຽນສະຖານະເປັນ: ${STATUS_LABELS[status]}`,
        input: 'text',
        inputPlaceholder: 'ໝາຍເຫດ (ບໍ່ບັງຄັບ)',
        showCancelButton: true,
        confirmButtonText: 'ຢືນຢັນ',
        cancelButtonText: 'ຍົກເລີກ',
    });
    if (note === undefined) return;
    const r = await fetch('api/packages.php?action=update-status', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status, note })
    });
    const j = await r.json();
    if (j.success) { toast('success', j.message); load(); }
    else Swal.fire('ຜິດພາດ', j.error || 'ບໍ່ສຳເລັດ', 'error');
}

load();
</script>
<?php include __DIR__ . '/partials/footer.php'; ?>
