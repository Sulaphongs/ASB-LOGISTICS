import React, { useEffect, useState, useCallback, useRef } from 'react';
import Layout from '../components/Layout.jsx';
import Badge from '../components/Badge.jsx';
import { api } from '../api/client.js';
import { useToast } from '../components/Toast.jsx';
import { useConfirm } from '../components/Confirm.jsx';
import { Plus, SquarePen, Trash2, X, Save } from 'lucide-react';

const emptyForm = { id: null, full_name: '', phone: '', facebook_name: '', province: '', address: '', notes: '', status: 'active' };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const toast = useToast();
  const confirm = useConfirm();
  const debounceRef = useRef(null);

  const load = useCallback(async (term = search) => {
    const res = await api.get(`/customers?search=${encodeURIComponent(term)}&limit=100`);
    if (res.success) setCustomers(res.customers);
  }, [search]);

  useEffect(() => { load(''); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(val), 350);
  };

  const openModal = (customer = null) => {
    setForm(customer ? { ...customer } : emptyForm);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.phone.trim()) {
      toast.error('ກະລຸນາປ້ອນຊື່ ແລະ ເບີໂທ');
      return;
    }
    const res = form.id
      ? await api.put(`/customers/${form.id}`, form)
      : await api.post('/customers', form);
    if (res.success) {
      toast.success(res.message);
      closeModal();
      load();
    } else {
      toast.error(res.error || 'ບໍ່ສຳເລັດ');
    }
  };

  const handleDelete = async (c) => {
    const ok = await confirm('ຢືນຢັນ', `ລຶບລູກຄ້າ: ${c.full_name}?`);
    if (!ok) return;
    const res = await api.del(`/customers/${c.id}`);
    if (res.success) { toast.success(res.message); load(); }
    else toast.error(res.error || 'ບໍ່ສຳເລັດ');
  };

  return (
    <Layout title="ລູກຄ້າ">
      <div className="card">
        <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
          <input
            className="flex-1 min-w-[220px] px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="ຄົ້ນຫາ ຊື່ / ເບີໂທ / ລະຫັດ..."
            value={search}
            onChange={onSearchChange}
          />
          <button className="btn btn-primary" onClick={() => openModal()}><Plus className="w-4 h-4" /> ເພີ່ມລູກຄ້າ</button>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>ລະຫັດ</th><th>ຊື່</th><th>ເບີໂທ</th><th>ທີ່ຢູ່</th><th>ສະຖານະ</th><th className="text-right">ຈັດການ</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 && (
                <tr><td colSpan={6} className="text-center text-slate-400 py-6">ບໍ່ມີຂໍ້ມູນ</td></tr>
              )}
              {customers.map((c) => (
                <tr key={c.id}>
                  <td className="font-semibold">{c.code}</td>
                  <td>{c.full_name}</td>
                  <td>{c.phone}</td>
                  <td>{c.address || '-'}</td>
                  <td><Badge status={c.status}>{c.status === 'active' ? 'ໃຊ້ງານ' : 'ປິດ'}</Badge></td>
                  <td className="text-right space-x-1.5">
                    <button className="btn btn-light btn-sm" onClick={() => openModal(c)}><SquarePen className="w-4 h-4" /> ແກ້ໄຂ</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c)}><Trash2 className="w-4 h-4" /> ລຶບ</button>
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
            <h3 className="text-base font-bold mb-4">{form.id ? 'ແກ້ໄຂລູກຄ້າ' : 'ເພີ່ມລູກຄ້າ'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="field"><label>ຊື່ ແລະ ນາມສະກຸນ *</label><input value={form.full_name} onChange={handleChange('full_name')} required /></div>
              <div className="field"><label>ເບີໂທ *</label><input value={form.phone} onChange={handleChange('phone')} required /></div>
              <div className="field"><label>Facebook</label><input value={form.facebook_name || ''} onChange={handleChange('facebook_name')} /></div>
              <div className="field"><label>ແຂວງ/ນະຄອນ</label><input value={form.province || ''} onChange={handleChange('province')} /></div>
              <div className="field"><label>ທີ່ຢູ່</label><textarea rows={2} value={form.address || ''} onChange={handleChange('address')} /></div>
              <div className="field"><label>ໝາຍເຫດ</label><textarea rows={2} value={form.notes || ''} onChange={handleChange('notes')} /></div>
              <div className="field">
                <label>ສະຖານະ</label>
                <select value={form.status} onChange={handleChange('status')}>
                  <option value="active">ໃຊ້ງານ</option>
                  <option value="inactive">ປິດ</option>
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
