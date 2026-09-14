import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout.jsx';
import Badge from '../components/Badge.jsx';
import { api } from '../api/client.js';
import { useToast } from '../components/Toast.jsx';
import { useConfirm } from '../components/Confirm.jsx';
import { Plus, SquarePen, Trash2, X, Save } from 'lucide-react';

const emptyForm = { id: null, username: '', password: '', full_name: '', phone: '', role_key: 'staff', status: 'active' };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const toast = useToast();
  const confirm = useConfirm();

  const load = useCallback(async () => {
    const res = await api.get('/users');
    if (res.success) setUsers(res.users);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openModal = (u = null) => {
    setForm(u ? { ...u, password: '' } : emptyForm);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);
  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = form.id ? await api.put(`/users/${form.id}`, form) : await api.post('/users', form);
    if (res.success) { toast.success(res.message); closeModal(); load(); }
    else toast.error(res.error || 'ບໍ່ສຳເລັດ');
  };

  const handleDelete = async (u) => {
    const ok = await confirm('ຢືນຢັນ', `ລຶບຜູ້ໃຊ້: ${u.username}?`);
    if (!ok) return;
    const res = await api.del(`/users/${u.id}`);
    if (res.success) { toast.success(res.message); load(); }
    else toast.error(res.error || 'ບໍ່ສຳເລັດ');
  };

  return (
    <Layout title="ຜູ້ໃຊ້ງານ">
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold">ພະນັກງານ / ຜູ້ດູແລລະບົບ</h3>
          <button className="btn btn-primary" onClick={() => openModal()}><Plus className="w-4 h-4" /> ເພີ່ມຜູ້ໃຊ້</button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>ຊື່ຜູ້ໃຊ້</th><th>ຊື່ເຕັມ</th><th>ເບີໂທ</th><th>ບົດບາດ</th><th>ສະຖານະ</th><th className="text-right">ຈັດການ</th></tr>
            </thead>
            <tbody>
              {users.length === 0 && <tr><td colSpan={6} className="text-center text-slate-400 dark:text-slate-500 py-6">ບໍ່ມີຂໍ້ມູນ</td></tr>}
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="font-semibold">{u.username}</td>
                  <td>{u.full_name || '-'}</td>
                  <td>{u.phone || '-'}</td>
                  <td>{u.role_key === 'admin' ? 'ຜູ້ດູແລລະບົບ' : 'ພະນັກງານ'}</td>
                  <td><Badge status={u.status}>{u.status === 'active' ? 'ໃຊ້ງານ' : 'ປິດ'}</Badge></td>
                  <td className="text-right space-x-1.5">
                    <button className="btn btn-light btn-sm" onClick={() => openModal(u)}><SquarePen className="w-4 h-4" /> ແກ້ໄຂ</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u)}><Trash2 className="w-4 h-4" /> ລຶບ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-box max-w-md">
            <h3 className="text-base font-bold mb-4">{form.id ? 'ແກ້ໄຂຜູ້ໃຊ້' : 'ເພີ່ມຜູ້ໃຊ້'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="field"><label>ຊື່ຜູ້ໃຊ້ *</label><input value={form.username} onChange={setField('username')} required /></div>
              <div className="field">
                <label>ລະຫັດຜ່ານ {form.id ? '(ປະໄວ້ຖ້າບໍ່ປ່ຽນ)' : '*'}</label>
                <input type="password" value={form.password} onChange={setField('password')} required={!form.id} />
              </div>
              <div className="field"><label>ຊື່ເຕັມ</label><input value={form.full_name || ''} onChange={setField('full_name')} /></div>
              <div className="field"><label>ເບີໂທ</label><input value={form.phone || ''} onChange={setField('phone')} /></div>
              <div className="field">
                <label>ບົດບາດ</label>
                <select value={form.role_key} onChange={setField('role_key')}>
                  <option value="admin">ຜູ້ດູແລລະບົບ</option><option value="staff">ພະນັກງານ</option>
                </select>
              </div>
              <div className="field">
                <label>ສະຖານະ</label>
                <select value={form.status} onChange={setField('status')}>
                  <option value="active">ໃຊ້ງານ</option><option value="inactive">ປິດ</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn btn-light flex-1 justify-center" onClick={closeModal}><X className="w-4 h-4" /> ຍົກເລີກ</button>
                <button type="submit" className="btn btn-primary flex-1 justify-center"><Save className="w-4 h-4" /> ບັນທຶກ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
