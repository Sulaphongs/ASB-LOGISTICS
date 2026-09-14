// ASB Logistics — ຟັງຊັນ JS ຮ່ວມ (sidebar toggle, logout, helpers)

function toggleSidebar() {
    document.getElementById('_sb_panel')?.classList.toggle('on');
    document.getElementById('_sb_ov')?.classList.toggle('on');
}

async function doLogout(e) {
    e && e.preventDefault();
    try {
        await fetch('api/auth/logout.php', { method: 'POST' });
    } catch (err) { /* ignore */ }
    window.location.href = 'login.php';
}

function formatMoney(amount, currency = 'LAK') {
    const n = Number(amount || 0);
    return n.toLocaleString('en-US') + ' ' + currency;
}

function debounce(fn, delay = 350) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(null, args), delay);
    };
}

function toast(icon, title) {
    if (window.Swal) {
        Swal.fire({ icon, title, timer: 1800, showConfirmButton: false, toast: true, position: 'top-end' });
    } else {
        alert(title);
    }
}
