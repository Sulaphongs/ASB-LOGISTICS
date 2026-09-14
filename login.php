<?php
require_once __DIR__ . '/includes/bootstrap.php';
if (Auth::check()) {
    header('Location: dashboard.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="lo">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ເຂົ້າສູ່ລະບົບ — <?= htmlspecialchars(APP_NAME) ?></title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;500;600;700&display=swap" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<style>
*{box-sizing:border-box;}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(160deg,#181818 0%,#232323 60%,#181818 100%);
  font-family:'Noto Sans Lao','Segoe UI',sans-serif;padding:16px;}
.box{background:#fff;border-radius:18px;width:100%;max-width:380px;padding:32px 28px;box-shadow:0 20px 60px rgba(0,0,0,.35);}
.logo{width:56px;height:56px;border-radius:14px;background:#e8c73c;color:#181818;font-weight:800;
  display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:1.1rem;}
h1{font-size:1.15rem;text-align:center;margin:0 0 4px;}
p.sub{text-align:center;color:#6b7280;font-size:.85rem;margin:0 0 22px;}
label{display:block;font-size:.82rem;font-weight:600;margin-bottom:6px;color:#374151;}
input{width:100%;padding:11px 13px;border:1px solid #e5e7eb;border-radius:10px;font-size:.95rem;margin-bottom:14px;font-family:inherit;}
input:focus{outline:2px solid #e8c73c;border-color:#e8c73c;}
button{width:100%;padding:12px;border:none;border-radius:10px;background:#181818;color:#e8c73c;font-weight:700;font-size:.95rem;cursor:pointer;}
button:hover{background:#000;}
</style>
</head>
<body>
<div class="box">
    <div class="logo">ASB</div>
    <h1><?= htmlspecialchars(APP_NAME) ?></h1>
    <p class="sub">ເຂົ້າສູ່ລະບົບຈັດການ</p>
    <form id="loginForm">
        <label>ຊື່ຜູ້ໃຊ້</label>
        <input type="text" id="username" autocomplete="username" required>
        <label>ລະຫັດຜ່ານ</label>
        <input type="password" id="password" autocomplete="current-password" required>
        <button type="submit">ເຂົ້າສູ່ລະບົບ</button>
    </form>
</div>
<script>
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    try {
        const r = await fetch('api/auth/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const j = await r.json();
        if (j.success) {
            window.location.href = 'dashboard.php';
        } else {
            Swal.fire('ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ', j.error || 'ລອງໃໝ່ອີກຄັ້ງ', 'error');
        }
    } catch (err) {
        Swal.fire('ຜິດພາດ', 'ບໍ່ສາມາດເຊື່ອມຕໍ່ເຊີບເວີໄດ້', 'error');
    }
});
</script>
</body>
</html>
