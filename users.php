<?php
require_once __DIR__ . '/includes/bootstrap.php';
Auth::requireLogin();
if (!Auth::isAdmin()) { header('Location: dashboard.php'); exit; }
$pageTitle = 'ຜູ້ໃຊ້ງານ';
include __DIR__ . '/partials/header.php';
?>
<div class="asb-card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <h3 style="margin:0;font-size:1rem;">ພະນັກງານ / ຜູ້ດູແລລະບົບ</h3>
        <button class="asb-btn asb-btn-primary" onclick="openModal()"><i class="bi bi-plus-lg"></i> ເພີ່ມຜູ້ໃຊ້</button>
    </div>
    <div style="overflow-x:auto;">
    <table class="asb-table">
        <thead><tr><th>ຊື່ຜູ້ໃຊ້</th><th>ຊື່ເຕັມ</th><th>ເບີໂທ</th><th>ບົດບາດ</th><th>ສະຖານະ</th><th style="text-align:right;">ຈັດການ</th></tr></thead>
        <tbody id="tbody"><tr><td colspan="6" style="text-align:center;color:var(--asb-muted);">ກຳລັງໂຫຼດ...</td></tr></tbody>
    </table>
    </div>
</div>

<div class="asb-modal-backdrop" id="modal" style="display:none;">
    <div class="asb-modal">
        <h3 id="modalTitle" style="margin:0 0 16px;">ເພີ່ມຜູ້ໃຊ້</h3>
        <form id="form">
            <input type="hidden" id="id">
            <div class="asb-field"><label>ຊື່ຜູ້ໃຊ້ *</label><input id="username" required></div>
            <div class="asb-field"><label>ລະຫັດຜ່ານ <span id="pwHint" style="font-weight:400;">*</span></label><input id="password" type="password"></div>
            <div class="asb-field"><label>ຊື່ເຕັມ</label><input id="full_name"></div>
            <div class="asb-field"><label>ເບີໂທ</label><input id="phone"></div>
            <div class="asb-field"><label>ບົດບາດ</label>
                <select id="role_key"><option value="admin">ຜູ້ດູແລລະບົບ</option><option value="staff">ພະນັກງານ</option></select>
            </div>
            <div class="asb-field"><label>ສະຖານະ</label><select id="status"><option value="active">ໃຊ້ງານ</option><option value="inactive">ປິດ</option></select></div>
            <div style="display:flex;gap:10px;margin-top:14px;">
                <button type="button" class="asb-btn asb-btn-light" style="flex:1;" onclick="closeModal()">ຍົກເລີກ</button>
                <button type="submit" class="asb-btn asb-btn-primary" style="flex:1;">ບັນທຶກ</button>
            </div>
        </form>
    </div>
</div>

<script>
let users = [];
async function load() {
    const r = await fetch('api/users.php?action=list');
    const j = await r.json();
    users = j.success ? j.users : [];
    const tbody = document.getElementById('tbody');
    tbody.innerHTML = users.length ? users.map(u => `
        <tr>
            <td><strong>${u.username}</strong></td>
            <td>${u.full_name || '-'}</td>
            <td>${u.phone || '-'}</td>
            <td>${u.role_key === 'admin' ? 'ຜູ້ດູແລລະບົບ' : 'ພະນັກງານ'}</td>
            <td><span class="asb-badge ${u.status === 'active' ? 'delivered' : 'cancelled'}">${u.status === 'active' ? 'ໃຊ້ງານ' : 'ປິດ'}</span></td>
            <td style="text-align:right;">
                <button class="asb-btn asb-btn-light asb-btn-sm" onclick="editRow(${u.id})"><i class="bi bi-pencil"></i></button>
                <button class="asb-btn asb-btn-danger asb-btn-sm" onclick="removeRow(${u.id})"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="6" style="text-align:center;color:var(--asb-muted);">ບໍ່ມີຂໍ້ມູນ</td></tr>';
}

function openModal() {
    document.getElementById('form').reset();
    document.getElementById('id').value = '';
    document.getElementById('pwHint').textContent = '*';
    document.getElementById('modalTitle').textContent = 'ເພີ່ມຜູ້ໃຊ້';
    document.getElementById('modal').style.display = 'flex';
}
function closeModal() { document.getElementById('modal').style.display = 'none'; }
function editRow(id) {
    const u = users.find(x => x.id === id);
    if (!u) return;
    openModal();
    document.getElementById('modalTitle').textContent = 'ແກ້ໄຂຜູ້ໃຊ້';
    document.getElementById('pwHint').textContent = '(ປະໄວ້ຖ້າບໍ່ປ່ຽນ)';
    document.getElementById('id').value = u.id;
    ['username', 'full_name', 'phone', 'role_key', 'status'].forEach(f => document.getElementById(f).value = u[f] || '');
}
document.getElementById('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        id: document.getElementById('id').value || undefined,
        username: document.getElementById('username').value.trim(),
        password: document.getElementById('password').value,
        full_name: document.getElementById('full_name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        role_key: document.getElementById('role_key').value,
        status: document.getElementById('status').value,
    };
    const r = await fetch('api/users.php?action=save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const j = await r.json();
    if (j.success) { toast('success', j.message); closeModal(); load(); }
    else Swal.fire('ຜິດພາດ', j.error || 'ບໍ່ສຳເລັດ', 'error');
});
async function removeRow(id) {
    const res = await Swal.fire({ title: 'ຢືນຢັນ', text: 'ລຶບຜູ້ໃຊ້ນີ້?', icon: 'warning', showCancelButton: true, confirmButtonText: 'ລຶບ', cancelButtonText: 'ຍົກເລີກ' });
    if (!res.isConfirmed) return;
    const r = await fetch('api/users.php?action=delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id })
    });
    const j = await r.json();
    if (j.success) { toast('success', j.message); load(); }
    else Swal.fire('ຜິດພາດ', j.error || 'ບໍ່ສຳເລັດ', 'error');
}
load();
</script>
<?php include __DIR__ . '/partials/footer.php'; ?>
