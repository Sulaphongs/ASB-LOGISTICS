<?php
require_once __DIR__ . '/includes/bootstrap.php';
Auth::requireLogin();
$pageTitle = 'ຄິດໄລ່ຄ່າຂົນສົ່ງ';
$isAdmin = Auth::isAdmin();
include __DIR__ . '/partials/header.php';
?>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
    <div class="asb-card">
        <h3 style="margin:0 0 14px;font-size:1rem;"><i class="bi bi-calculator"></i> ຄິດໄລ່ຄ່າຂົນສົ່ງໄວ</h3>
        <div class="asb-field"><label>ກົດເກນລາຄາ</label><select id="calcRule" onchange="calc()"></select></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="asb-field"><label>ນ້ຳໜັກ (kg)</label><input id="calcWeight" type="number" step="0.01" min="0" oninput="calc()"></div>
            <div class="asb-field"><label>ປະລິມາດ (CBM)</label><input id="calcVolume" type="number" step="0.0001" min="0" oninput="calc()"></div>
        </div>
        <div class="asb-field"><label>ຄ່າອື່ນໆ (ຖ້າມີ)</label><input id="calcOther" type="number" step="0.01" min="0" value="0" oninput="calc()"></div>
        <div id="calcResult" style="margin-top:14px;padding:14px;background:#f8f9fb;border-radius:10px;font-size:.95rem;"></div>
    </div>

    <div class="asb-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <h3 style="margin:0;font-size:1rem;">ກົດເກນລາຄາ</h3>
            <?php if ($isAdmin): ?><button class="asb-btn asb-btn-primary asb-btn-sm" onclick="openModal()"><i class="bi bi-plus-lg"></i> ເພີ່ມ</button><?php endif; ?>
        </div>
        <div id="rulesList"></div>
    </div>
</div>

<?php if ($isAdmin): ?>
<div class="asb-modal-backdrop" id="modal" style="display:none;">
    <div class="asb-modal">
        <h3 id="modalTitle" style="margin:0 0 16px;">ເພີ່ມກົດເກນລາຄາ</h3>
        <form id="form">
            <input type="hidden" id="id">
            <div class="asb-field"><label>ຊື່ກົດເກນ *</label><input id="name" required></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div class="asb-field"><label>ປະເພດຂົນສົ່ງ</label><select id="shipping_type"><option value="land">ທາງບົກ</option><option value="air">ທາງອາກາດ</option></select></div>
                <div class="asb-field"><label>ວິທີຄິດໄລ່</label><select id="calc_method"><option value="per_kg">ຕໍ່ກິໂລ (kg)</option><option value="per_cbm">ຕໍ່ CBM</option></select></div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div class="asb-field"><label>ລາຄາ/ໜ່ວຍ *</label><input id="rate" type="number" step="0.01" min="0" required></div>
                <div class="asb-field"><label>ຄ່າຕ່ຳສຸດ</label><input id="min_charge" type="number" step="0.01" min="0" value="0"></div>
            </div>
            <div class="asb-field"><label>ສະກຸນເງິນ</label>
                <select id="currency"><option value="LAK">LAK</option><option value="CNY">CNY</option><option value="THB">THB</option><option value="USD">USD</option></select>
            </div>
            <div class="asb-field"><label><input type="checkbox" id="is_default" style="width:auto;display:inline-block;margin-right:6px;"> ຕັ້ງເປັນຄ່າເລີ່ມຕົ້ນ</label></div>
            <div class="asb-field"><label>ສະຖານະ</label><select id="status"><option value="active">ໃຊ້ງານ</option><option value="inactive">ປິດ</option></select></div>
            <div style="display:flex;gap:10px;margin-top:14px;">
                <button type="button" class="asb-btn asb-btn-light" style="flex:1;" onclick="closeModal()">ຍົກເລີກ</button>
                <button type="submit" class="asb-btn asb-btn-primary" style="flex:1;">ບັນທຶກ</button>
            </div>
        </form>
    </div>
</div>
<?php endif; ?>

<script>
const isAdmin = <?= $isAdmin ? 'true' : 'false' ?>;
let rules = [];

async function loadRules() {
    const r = await fetch('api/pricing.php?action=list');
    const j = await r.json();
    rules = j.success ? j.rules : [];

    document.getElementById('calcRule').innerHTML = rules.filter(x => x.status === 'active').map(r =>
        `<option value="${r.id}" ${r.is_default ? 'selected' : ''}>${r.name} (${Number(r.rate).toLocaleString()} ${r.currency}/${r.calc_method === 'per_kg' ? 'kg' : 'cbm'})</option>`
    ).join('');

    document.getElementById('rulesList').innerHTML = rules.map(r => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--asb-border);">
            <div>
                <div style="font-weight:600;">${r.name} ${r.is_default == 1 ? '<span class="asb-badge delivered">ຄ່າເລີ່ມຕົ້ນ</span>' : ''}</div>
                <div style="font-size:.8rem;color:var(--asb-muted);">${r.shipping_type === 'land' ? 'ທາງບົກ' : 'ທາງອາກາດ'} · ${Number(r.rate).toLocaleString()} ${r.currency} / ${r.calc_method === 'per_kg' ? 'kg' : 'cbm'} · ຂັ້ນຕ່ຳ ${Number(r.min_charge).toLocaleString()}</div>
            </div>
            ${isAdmin ? `<div><button class="asb-btn asb-btn-light asb-btn-sm" onclick="editRule(${r.id})"><i class="bi bi-pencil"></i></button>
                <button class="asb-btn asb-btn-danger asb-btn-sm" onclick="removeRule(${r.id})"><i class="bi bi-trash"></i></button></div>` : ''}
        </div>
    `).join('') || '<p style="color:var(--asb-muted);">ຍັງບໍ່ມີກົດເກນລາຄາ</p>';

    calc();
}

async function calc() {
    const ruleId = document.getElementById('calcRule').value;
    if (!ruleId) { document.getElementById('calcResult').innerHTML = ''; return; }
    const r = await fetch('api/pricing.php?action=calculate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            pricing_rule_id: ruleId,
            weight_kg: document.getElementById('calcWeight').value || 0,
            volume_cbm: document.getElementById('calcVolume').value || 0,
            other_fee: document.getElementById('calcOther').value || 0,
        })
    });
    const j = await r.json();
    if (!j.success) { document.getElementById('calcResult').innerHTML = `<span style="color:var(--asb-red);">${j.error}</span>`; return; }
    document.getElementById('calcResult').innerHTML = `
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span>ຄ່າຂົນສົ່ງ:</span><strong>${formatMoney(j.shipping_fee, j.currency)}</strong></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span>ຄ່າອື່ນໆ:</span><strong>${formatMoney(j.other_fee, j.currency)}</strong></div>
        <div style="display:flex;justify-content:space-between;font-size:1.1rem;padding-top:8px;border-top:1px solid var(--asb-border);"><span>ລວມທັງໝົດ:</span><strong>${formatMoney(j.total_fee, j.currency)}</strong></div>
    `;
}

<?php if ($isAdmin): ?>
function openModal() {
    document.getElementById('form').reset();
    document.getElementById('id').value = '';
    document.getElementById('modalTitle').textContent = 'ເພີ່ມກົດເກນລາຄາ';
    document.getElementById('modal').style.display = 'flex';
}
function closeModal() { document.getElementById('modal').style.display = 'none'; }
function editRule(id) {
    const r = rules.find(x => x.id === id);
    if (!r) return;
    openModal();
    document.getElementById('modalTitle').textContent = 'ແກ້ໄຂກົດເກນລາຄາ';
    document.getElementById('id').value = r.id;
    ['name', 'shipping_type', 'calc_method', 'rate', 'min_charge', 'currency', 'status'].forEach(f => document.getElementById(f).value = r[f]);
    document.getElementById('is_default').checked = r.is_default == 1;
}
document.getElementById('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        id: document.getElementById('id').value || undefined,
        name: document.getElementById('name').value.trim(),
        shipping_type: document.getElementById('shipping_type').value,
        calc_method: document.getElementById('calc_method').value,
        rate: document.getElementById('rate').value,
        min_charge: document.getElementById('min_charge').value,
        currency: document.getElementById('currency').value,
        is_default: document.getElementById('is_default').checked,
        status: document.getElementById('status').value,
    };
    const r = await fetch('api/pricing.php?action=save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const j = await r.json();
    if (j.success) { toast('success', j.message); closeModal(); loadRules(); }
    else Swal.fire('ຜິດພາດ', j.error || 'ບໍ່ສຳເລັດ', 'error');
});
async function removeRule(id) {
    const res = await Swal.fire({ title: 'ຢືນຢັນ', text: 'ລຶບກົດເກນລາຄານີ້?', icon: 'warning', showCancelButton: true, confirmButtonText: 'ລຶບ', cancelButtonText: 'ຍົກເລີກ' });
    if (!res.isConfirmed) return;
    const r = await fetch('api/pricing.php?action=delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id })
    });
    const j = await r.json();
    if (j.success) { toast('success', j.message); loadRules(); }
    else Swal.fire('ຜິດພາດ', j.error || 'ບໍ່ສຳເລັດ', 'error');
}
<?php endif; ?>

loadRules();
</script>
<?php include __DIR__ . '/partials/footer.php'; ?>
