import React, { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Package, ArrowRight } from 'lucide-react';

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await login(username.trim(), password);
    setBusy(false);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.error || 'ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-teal-50 to-slate-100 px-4">
      <div className="card w-full max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white font-extrabold flex items-center justify-center mx-auto mb-4">
          ASB
        </div>
        <h1 className="text-lg font-bold text-center mb-1">ASB ບໍລິການຂົນສົ່ງ</h1>
        <p className="text-sm text-slate-500 text-center mb-6">ເຂົ້າສູ່ລະບົບຈັດການ</p>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-xl bg-rose-50 text-rose-600 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="field">
            <label>ຊື່ຜູ້ໃຊ້</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
          </div>
          <div className="field">
            <label>ລະຫັດຜ່ານ</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </div>
          <button type="submit" disabled={busy} className="btn btn-primary w-full justify-center">
            {busy ? 'ກຳລັງເຂົ້າສູ່ລະບົບ...' : 'ເຂົ້າສູ່ລະບົບ'}
          </button>
        </form>

        <div className="text-center mt-5 pt-4 border-t border-slate-100">
          <Link to="/track" className="inline-flex items-center gap-1.5 text-sm text-teal-700 hover:underline">
            <Package className="w-4 h-4" /> ລູກຄ້າຕິດຕາມພັດສະດຸ <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
