<?php
require_once __DIR__ . '/includes/bootstrap.php';
Auth::requireLogin();
$pageTitle = 'ລູກຄ້າ';
include __DIR__ . '/partials/header.php';
?>
<div class="asb-card">
    <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <div style="display:flex;gap:8px;flex:1;min-width:220px;">
            <input id="searchInput" type="text" placeholder="ຄົ້ນຫາ ຊື່ / ເບີໂທ / ລະຫັດ..." style="flex:1;padding:9px 12px;border:1px solid var(--asb-border);border-radius:9px;">
        </div>
        <button class="asb-btn asb-btn-primary" onclick="openModal()"><i class="bi bi-plus-lg"></i> ເພີ່ມລູກຄ້າ</button>
    </div>
    <div style="overflow-x:auto;">
    <table class="asb-table">
        <thead><tr><th>ລະຫັດ</th><th>ຊື່</th><th>ເບີໂທ</th><th>ທີ່ຢູ່</th><th>ສະຖານະ</th><th style="text-align:right;">ຈັດການ</th></tr></thead>
        <tbody id="tbody"><tr><td colspan="6" style="text-align:center;color:var(--asb-muted);">ກຳລັງໂຫຼດ...</td></tr></tbody>
    </table>
    </div>
</div>

<div class="asb-modal-backdrop" id="modal" style="display:none;">
    <div class="asb-modal">
        <h3 id="modalTitle" style="margin:0 0 16px;">ເພີ່ມລູກຄ້າ</h3>
        <form id="form">
            <input type="hidden" id="id">
            <div class="asb-field"><label>ຊື່ ແລະ ນາມສະກຸນ *</label><input id="full_name" required></div>
            <div class="asb-field"><label>ເບີໂທ *</label><input id="phone" required></div>
            <div class="asb-field"><label>Facebook</label><input id="facebook_name"></div>
            <div class="asb-field"><label>ແຂວງ/ນະຄອນ</label><input id="province"></div>
            <div class="asb-field"><label>ທີ່ຢູ່</label><textarea id="address" rows="2"></textarea></div>
            <div class="asb-field"><label>ໝາຍເຫດ</label><textarea id="notes" rows="2"></textarea></div>
            <div class="asb-field"><label>ສະຖານະ</label>
                <select id="status"><option value="active">ໃຊ້ງານ</option><option value="inactive">ປິດ</option></select>
            </div>
            <div style="display:flex;gap:10px;margin-top:18px;">
                <button type="button" class="asb-btn asb-btn-light" style="flex:1;" onclick="closeModal()">ຍົກເລີກ</button>
                <button type="submit" class="asb-btn asb-btn-primary" style="flex:1;">ບັນທຶກ</button>
            </div>
        </form>
    </div>
</div>

<script>
let customers = [];
let searchTerm = '';

async function load() {
    const params = new URLSearchParams({ action: 'list', search: searchTerm, limit: 100 });
    const r = await fetch(`api/customers.php?${params}`);
    const j = await r.json();
    customers = j.success ? j.customers : [];
    render();
}

function render() {
    const tbody = document.getElementById('tbody');
    if (!customers.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--asb-muted);">ບໍ່ມີຂໍ້ມູນ</td></tr>';
        return;
    }
    tbody.innerHTML = customers.map(c => `
        <tr>
            <td><strong>${c.code}</strong></td>
            <td>${c.full_name}</td>
            <td>${c.phone}</td>
            <td>${c.address || '-'}</td>
            <td><span class="asb-badge ${c.status === 'active' ? 'delivered' : 'cancelled'}">${c.status === 'active' ? 'ໃຊ້ງານ' : 'ປິດ'}</span></td>
            <td style="text-align:right;">
                <button class="asb-btn asb-btn-light asb-btn-sm" onclick="editRow(${c.id})"><i class="bi bi-pencil"></i></button>
                <button class="asb-btn asb-btn-danger asb-btn-sm" onclick="removeRow(${c.id})"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

document.getElementById('searchInput').addEventListener('input', debounce((e) => {
    searchTerm = e.target.value.trim();
    load();
}));

function openModal() {
    document.getElementById('form').reset();
    document.getElementById('id').value = '';
    document.getElementById('modalTitle').textContent = 'ເພີ່ມລູກຄ້າ';
    document.getElementById('modal').style.display = 'flex';
}
function closeModal() { document.getElementById('modal').style.display = 'none'; }

function editRow(id) {
    const c = customers.find(x => x.id === id);
    if (!c) return;
    openModal();
    document.getElementById('modalTitle').textContent = 'ແກ້ໄຂລູກຄ້າ';
    document.getElementById('id').value = c.id;
    ['full_name', 'phone', 'facebook_name', 'province', 'address', 'notes', 'status'].forEach(f => {
        document.getElementById(f).value = c[f] || (f === 'status' ? 'active' : '');
    });
}

document.getElementById('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        id: document.getElementById('id').value || undefined,
        full_name: document.getElementById('full_name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        facebook_name: document.getElementById('facebook_name').value.trim(),
        province: document.getElementById('province').value.trim(),
        address: document.getElementById('address').value.trim(),
        notes: document.getElementById('notes').value.trim(),
        status: document.getElementById('status').value,
    };
    const r = await fetch('api/customers.php?action=save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const j = await r.json();
    if (j.success) { toast('success', j.message); closeModal(); load(); }
    else Swal.fire('ຜິດພາດ', j.error || 'ບໍ່ສຳເລັດ', 'error');
});

async function removeRow(id) {
    const c = customers.find(x => x.id === id);
    const res = await Swal.fire({ title: 'ຢືນຢັນ', text: `ລຶບລູກຄ້າ: ${c.full_name}?`, icon: 'warning', showCancelButton: true, confirmButtonText: 'ລຶບ', cancelButtonText: 'ຍົກເລີກ' });
    if (!res.isConfirmed) return;
    const r = await fetch('api/customers.php?action=delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id })
    });
    const j = await r.json();
    if (j.success) { toast('success', j.message); load(); }
    else Swal.fire('ຜິດພາດ', j.error || 'ບໍ່ສຳເລັດ', 'error');
}

load();
</script>
<?php include __DIR__ . '/partials/footer.php'; ?>
