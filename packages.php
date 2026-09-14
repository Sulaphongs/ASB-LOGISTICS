<?php
require_once __DIR__ . '/includes/bootstrap.php';
Auth::requireLogin();
$pageTitle = 'ພັດສະດຸ / ອອເດີ';
include __DIR__ . '/partials/header.php';
?>
<div class="asb-card">
    <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <div style="display:flex;gap:8px;flex-wrap:wrap;flex:1;min-width:240px;">
            <input id="searchInput" type="text" placeholder="ຄົ້ນຫາ ລະຫັດຕິດຕາມ / ລູກຄ້າ / ເບີໂທ..." style="flex:1;min-width:220px;padding:9px 12px;border:1px solid var(--asb-border);border-radius:9px;">
            <select id="statusFilter" style="padding:9px 12px;border:1px solid var(--asb-border);border-radius:9px;">
                <option value="">ທຸກສະຖານະ</option>
                <?php foreach (PACKAGE_STATUS_LABELS as $k => $v): ?>
                <option value="<?= $k ?>"><?= htmlspecialchars($v) ?></option>
                <?php endforeach; ?>
            </select>
        </div>
        <button class="asb-btn asb-btn-primary" onclick="openModal()"><i class="bi bi-plus-lg"></i> ສ້າງອອເດີໃໝ່</button>
    </div>
    <div style="overflow-x:auto;">
    <table class="asb-table">
        <thead><tr><th>ລະຫັດຕິດຕາມ</th><th>ລູກຄ້າ</th><th>ລາຍການ</th><th>ນ້ຳໜັກ</th><th>ຍອດລວມ</th><th>ຊຳລະ</th><th>ສະຖານະ</th><th style="text-align:right;">ຈັດການ</th></tr></thead>
        <tbody id="tbody"><tr><td colspan="8" style="text-align:center;color:var(--asb-muted);">ກຳລັງໂຫຼດ...</td></tr></tbody>
    </table>
    </div>
</div>

<!-- Create/Edit modal -->
<div class="asb-modal-backdrop" id="modal" style="display:none;">
    <div class="asb-modal" style="max-width:620px;">
        <h3 id="modalTitle" style="margin:0 0 16px;">ສ້າງອອເດີໃໝ່</h3>
        <form id="form">
            <input type="hidden" id="id">
            <div class="asb-field">
                <label>ລູກຄ້າ *</label>
                <select id="customer_id" required></select>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div class="asb-field"><label>ເລກຕິດຕາມຈາກຮ້ານຈີນ</label><input id="china_tracking_no"></div>
                <div class="asb-field"><label>ຈຳນວນ</label><input id="quantity" type="number" min="1" value="1"></div>
            </div>
            <div class="asb-field"><label>ລາຍລະອຽດເຄື່ອງ</label><input id="item_description" placeholder="ເຊັ່ນ: ເສື້ອຢືດ 5 ໂຕ, ໂທລະສັບກວດ..."></div>
            <div class="asb-field"><label>ລິ້ງຮ້ານ (Taobao/1688/Pinduoduo...)</label><input id="shop_link"></div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
                <div class="asb-field"><label>ນ້ຳໜັກ (kg)</label><input id="weight_kg" type="number" step="0.01" min="0"></div>
                <div class="asb-field"><label>ປະລິມາດ (CBM)</label><input id="volume_cbm" type="number" step="0.0001" min="0"></div>
                <div class="asb-field"><label>ມູນຄ່າ (CNY)</label><input id="declared_value_cny" type="number" step="0.01" min="0"></div>
            </div>
            <div class="asb-field">
                <label>ກົດເກນຄ່າຂົນສົ່ງ</label>
                <select id="pricing_rule_id" onchange="autoCalc()"><option value="">-- ຄິດໄລ່ເອງ --</option></select>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
                <div class="asb-field"><label>ຄ່າຂົນສົ່ງ</label><input id="shipping_fee" type="number" step="0.01" min="0" value="0"></div>
                <div class="asb-field"><label>ຄ່າອື່ນໆ</label><input id="other_fee" type="number" step="0.01" min="0" value="0"></div>
                <div class="asb-field"><label>ສະກຸນເງິນ</label>
                    <select id="currency"><option value="LAK">LAK</option><option value="CNY">CNY</option><option value="THB">THB</option><option value="USD">USD</option></select>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div class="asb-field"><label>ສະຖານະຊຳລະ</label>
                    <select id="payment_status"><option value="unpaid">ຍັງບໍ່ຊຳລະ</option><option value="partial">ຊຳລະບາງສ່ວນ</option><option value="paid">ຊຳລະຄົບແລ້ວ</option></select>
                </div>
                <div class="asb-field"><label>ຈຳນວນທີ່ຊຳລະແລ້ວ</label><input id="paid_amount" type="number" step="0.01" min="0" value="0"></div>
            </div>
            <div class="asb-field"><label>ໝາຍເຫດ</label><textarea id="notes" rows="2"></textarea></div>
            <div style="text-align:right;font-weight:700;margin:8px 0;">ລວມທັງໝົດ: <span id="totalPreview">0</span></div>
            <div style="display:flex;gap:10px;margin-top:10px;">
                <button type="button" class="asb-btn asb-btn-light" style="flex:1;" onclick="closeModal()">ຍົກເລີກ</button>
                <button type="submit" class="asb-btn asb-btn-primary" style="flex:1;">ບັນທຶກ</button>
            </div>
        </form>
    </div>
</div>

<script>
let packages = [], customersList = [], rulesList = [];
let state = { search: '', status: '' };

async function loadLookups() {
    const [cr, pr] = await Promise.all([
        fetch('api/customers.php?action=list&limit=500').then(r => r.json()),
        fetch('api/pricing.php?action=list').then(r => r.json()),
    ]);
    customersList = cr.success ? cr.customers : [];
    rulesList = pr.success ? pr.rules.filter(x => x.status === 'active') : [];

    document.getElementById('customer_id').innerHTML = '<option value="">-- ເລືອກລູກຄ້າ --</option>' +
        customersList.map(c => `<option value="${c.id}">${c.full_name} (${c.code}) — ${c.phone}</option>`).join('');
    document.getElementById('pricing_rule_id').innerHTML = '<option value="">-- ຄິດໄລ່ເອງ --</option>' +
        rulesList.map(r => `<option value="${r.id}">${r.name} (${r.rate.toLocaleString()} ${r.currency}/${r.calc_method === 'per_kg' ? 'kg' : 'cbm'})</option>`).join('');
}

async function load() {
    const params = new URLSearchParams({ action: 'list', search: state.search, status: state.status, limit: 100 });
    const r = await fetch(`api/packages.php?${params}`);
    const j = await r.json();
    packages = j.success ? j.packages : [];
    render();
}

function render() {
    const tbody = document.getElementById('tbody');
    if (!packages.length) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--asb-muted);">ບໍ່ມີຂໍ້ມູນ</td></tr>';
        return;
    }
    tbody.innerHTML = packages.map(p => `
        <tr>
            <td><a href="package-detail.php?id=${p.id}" style="font-weight:700;color:inherit;text-decoration:none;">${p.tracking_code}</a>${p.china_tracking_no ? `<div style="font-size:.75rem;color:var(--asb-muted);">CN: ${p.china_tracking_no}</div>` : ''}</td>
            <td>${p.customer_name}<div style="font-size:.75rem;color:var(--asb-muted);">${p.customer_phone}</div></td>
            <td>${p.item_description || '-'}</td>
            <td>${p.weight_kg ? p.weight_kg + ' kg' : '-'}</td>
            <td>${formatMoney(p.total_fee, p.currency)}</td>
            <td><span class="asb-badge ${p.payment_status}">${p.payment_status === 'paid' ? 'ຄົບແລ້ວ' : p.payment_status === 'partial' ? 'ບາງສ່ວນ' : 'ຍັງບໍ່ຊຳລະ'}</span></td>
            <td><span class="asb-badge ${p.status}">${p.status_label}</span></td>
            <td style="text-align:right;">
                <a class="asb-btn asb-btn-light asb-btn-sm" href="package-detail.php?id=${p.id}"><i class="bi bi-eye"></i></a>
                <button class="asb-btn asb-btn-danger asb-btn-sm" onclick="removeRow(${p.id})"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

document.getElementById('searchInput').addEventListener('input', debounce((e) => { state.search = e.target.value.trim(); load(); }));
document.getElementById('statusFilter').addEventListener('change', (e) => { state.status = e.target.value; load(); });

function openModal() {
    document.getElementById('form').reset();
    document.getElementById('id').value = '';
    document.getElementById('modalTitle').textContent = 'ສ້າງອອເດີໃໝ່';
    document.getElementById('totalPreview').textContent = '0';
    document.getElementById('modal').style.display = 'flex';
}
function closeModal() { document.getElementById('modal').style.display = 'none'; }

function autoCalc() {
    const ruleId = document.getElementById('pricing_rule_id').value;
    if (!ruleId) return;
    const rule = rulesList.find(r => String(r.id) === String(ruleId));
    if (!rule) return;
    const weight = parseFloat(document.getElementById('weight_kg').value || 0);
    const volume = parseFloat(document.getElementById('volume_cbm').value || 0);
    const qty = rule.calc_method === 'per_cbm' ? volume : weight;
    const fee = Math.max(qty * rule.rate, rule.min_charge);
    document.getElementById('shipping_fee').value = Math.round(fee);
    document.getElementById('currency').value = rule.currency;
    updateTotalPreview();
}
['weight_kg', 'volume_cbm'].forEach(id => document.getElementById(id).addEventListener('input', autoCalc));
['shipping_fee', 'other_fee'].forEach(id => document.getElementById(id).addEventListener('input', updateTotalPreview));
function updateTotalPreview() {
    const s = parseFloat(document.getElementById('shipping_fee').value || 0);
    const o = parseFloat(document.getElementById('other_fee').value || 0);
    document.getElementById('totalPreview').textContent = formatMoney(s + o, document.getElementById('currency').value);
}

document.getElementById('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        id: document.getElementById('id').value || undefined,
        customer_id: document.getElementById('customer_id').value,
        china_tracking_no: document.getElementById('china_tracking_no').value.trim(),
        item_description: document.getElementById('item_description').value.trim(),
        shop_link: document.getElementById('shop_link').value.trim(),
        quantity: document.getElementById('quantity').value,
        weight_kg: document.getElementById('weight_kg').value,
        volume_cbm: document.getElementById('volume_cbm').value,
        declared_value_cny: document.getElementById('declared_value_cny').value,
        pricing_rule_id: document.getElementById('pricing_rule_id').value || undefined,
        shipping_fee: document.getElementById('shipping_fee').value,
        other_fee: document.getElementById('other_fee').value,
        currency: document.getElementById('currency').value,
        payment_status: document.getElementById('payment_status').value,
        paid_amount: document.getElementById('paid_amount').value,
        notes: document.getElementById('notes').value.trim(),
    };
    if (!payload.customer_id) { Swal.fire('ຂໍ້ມູນບໍ່ຄົບ', 'ກະລຸນາເລືອກລູກຄ້າ', 'warning'); return; }
    const r = await fetch('api/packages.php?action=save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const j = await r.json();
    if (j.success) { toast('success', `${j.message} (${j.tracking_code})`); closeModal(); load(); }
    else Swal.fire('ຜິດພາດ', j.error || 'ບໍ່ສຳເລັດ', 'error');
});

async function removeRow(id) {
    const p = packages.find(x => x.id === id);
    const res = await Swal.fire({ title: 'ຢືນຢັນ', text: `ລຶບພັດສະດຸ: ${p.tracking_code}?`, icon: 'warning', showCancelButton: true, confirmButtonText: 'ລຶບ', cancelButtonText: 'ຍົກເລີກ' });
    if (!res.isConfirmed) return;
    const r = await fetch('api/packages.php?action=delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id })
    });
    const j = await r.json();
    if (j.success) { toast('success', j.message); load(); }
    else Swal.fire('ຜິດພາດ', j.error || 'ບໍ່ສຳເລັດ', 'error');
}

loadLookups().then(load);
</script>
<?php include __DIR__ . '/partials/footer.php'; ?>
