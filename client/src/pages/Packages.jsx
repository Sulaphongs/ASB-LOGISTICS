import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import Badge from '../components/Badge.jsx';
import { api, formatMoney } from '../api/client.js';
import { useToast } from '../components/Toast.jsx';
import { useConfirm } from '../components/Confirm.jsx';
import { Plus, Eye, Printer, Trash2, X, Save } from 'lucide-react';

const STATUS_OPTIONS = [
  ['ordered', 'ສັ່ງແລ້ວ (ລໍຖ້າຮ້ານຈີນຈັດສົ່ງ)'],
  ['arrived_cn_warehouse', 'ຮອດສາງຈີນແລ້ວ'],
  ['shipped', 'ກຳລັງຂົນສົ່ງມາລາວ'],
  ['arrived_la_warehouse', 'ຮອດສາງລາວແລ້ວ'],
  ['out_for_delivery', 'ກຳລັງຈັດສົ່ງໃຫ້ລູກຄ້າ'],
  ['delivered', 'ສົ່ງເຄື່ອງແລ້ວ'],
  ['cancelled', 'ຍົກເລີກ'],
];

const emptyForm = {
  id: null, customer_id: '', china_tracking_no: '', item_description: '', shop_link: '',
  quantity: 1, weight_kg: '', volume_cbm: '', declared_value_cny: '',
  pricing_rule_id: '', shipping_fee: 0, other_fee: 0, currency: 'LAK',
  payment_status: 'unpaid', paid_amount: 0, notes: '',
};

export default function Packages() {
  const [packages, setPackages] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [rulesList, setRulesList] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const toast = useToast();
  const confirm = useConfirm();
  const debounceRef = useRef(null);

  const loadLookups = useCallback(async () => {
    const [cr, pr] = await Promise.all([
      api.get('/customers?limit=500'),
      api.get('/pricing'),
    ]);
    if (cr.success) setCustomersList(cr.customers);
    if (pr.success) setRulesList(pr.rules.filter((r) => r.status === 'active'));
  }, []);

  const load = useCallback(async (s = search, st = statusFilter) => {
    const params = new URLSearchParams({ search: s, status: st, limit: '100' });
    const res = await api.get(`/packages?${params.toString()}`);
    if (res.success) setPackages(res.packages);
  }, [search, statusFilter]);

  useEffect(() => { loadLookups(); load('', ''); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(val, statusFilter), 350);
  };
  const onStatusFilterChange = (e) => {
    const val = e.target.value;
    setStatusFilter(val);
    load(search, val);
  };

  const openModal = () => { setForm(emptyForm); setModalOpen(true); };
  const closeModal = () => setModalOpen(false);
  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const autoCalc = async (next) => {
    const ruleId = next.pricing_rule_id;
    if (!ruleId) return;
    const rule = rulesList.find((r) => String(r.id) === String(ruleId));
    if (!rule) return;
    const weight = parseFloat(next.weight_kg) || 0;
    const volume = parseFloat(next.volume_cbm) || 0;
    const qty = rule.calc_method === 'per_cbm' ? volume : weight;
    const fee = Math.max(qty * Number(rule.rate), Number(rule.min_charge));
    setForm((f) => ({ ...f, shipping_fee: Math.round(fee), currency: rule.currency }));
  };

  const onCalcField = (field) => (e) => {
    const next = { ...form, [field]: e.target.value };
    setForm(next);
    autoCalc(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_id) { toast.error('ກະລຸນາເລືອກລູກຄ້າ'); return; }
    const payload = { ...form, pricing_rule_id: form.pricing_rule_id || undefined };
    const res = form.id
      ? await api.put(`/packages/${form.id}`, payload)
      : await api.post('/packages', payload);
    if (res.success) {
      toast.success(`${res.message} (${res.tracking_code})`);
      closeModal();
      load();
    } else {
      toast.error(res.error || 'ບໍ່ສຳເລັດ');
    }
  };

  const handleDelete = async (p) => {
    const ok = await confirm('ຢືນຢັນ', `ລຶບພັດສະດຸ: ${p.tracking_code}?`);
    if (!ok) return;
    const res = await api.del(`/packages/${p.id}`);
    if (res.success) { toast.success(res.message); load(); }
    else toast.error(res.error || 'ບໍ່ສຳເລັດ');
  };

  const totalPreview = (Number(form.shipping_fee) || 0) + (Number(form.other_fee) || 0);

  return (
    <Layout title="ພັດສະດຸ / ອອເດີ">
      <div className="card">
        <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
          <div className="flex flex-wrap gap-2 flex-1 min-w-[240px]">
            <input
              className="flex-1 min-w-[220px] px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="ຄົ້ນຫາ ລະຫັດຕິດຕາມ / ລູກຄ້າ / ເບີໂທ..."
              value={search}
              onChange={onSearchChange}
            />
            <select
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm"
              value={statusFilter}
              onChange={onStatusFilterChange}
            >
              <option value="">ທຸກສະຖານະ</option>
              {STATUS_OPTIONS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={openModal}><Plus className="w-4 h-4" /> ສ້າງອອເດີໃໝ່</button>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>ລະຫັດຕິດຕາມ</th><th>ລູກຄ້າ</th><th>ລາຍການ</th><th>ນ້ຳໜັກ</th>
                <th>ຍອດລວມ</th><th>ຊຳລະ</th><th>ສະຖານະ</th><th className="text-right">ຈັດການ</th>
              </tr>
            </thead>
            <tbody>
              {packages.length === 0 && (
                <tr><td colSpan={8} className="text-center text-slate-400 py-6">ບໍ່ມີຂໍ້ມູນ</td></tr>
              )}
              {packages.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link to={`/packages/${p.id}`} className="font-semibold text-teal-700 hover:underline">{p.tracking_code}</Link>
                    {p.china_tracking_no && <div className="text-[11px] text-slate-400">CN: {p.china_tracking_no}</div>}
                  </td>
                  <td>{p.customer_name}<div className="text-[11px] text-slate-400">{p.customer_phone}</div></td>
                  <td>{p.item_description || '-'}</td>
                  <td>{p.weight_kg ? `${p.weight_kg} kg` : '-'}</td>
                  <td>{formatMoney(p.total_fee, p.currency)}</td>
                  <td><Badge status={p.payment_status}>{p.payment_status === 'paid' ? 'ຄົບແລ້ວ' : p.payment_status === 'partial' ? 'ບາງສ່ວນ' : 'ຍັງບໍ່ຊຳລະ'}</Badge></td>
                  <td><Badge status={p.status}>{p.status_label}</Badge></td>
                  <td className="text-right space-x-1.5">
                    <Link to={`/packages/${p.id}`} className="btn btn-light btn-sm"><Eye className="w-4 h-4" /> ເບິ່ງ</Link>
                    <Link to={`/packages/${p.id}/label`} target="_blank" className="btn btn-light btn-sm" aria-label="ພິມໃບຕິດ"><Printer className="w-4 h-4" /></Link>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p)}><Trash2 className="w-4 h-4" /> ລຶບ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-box max-w-xl">
            <h3 className="text-base font-bold mb-4">ສ້າງອອເດີໃໝ່</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="field">
                <label>ລູກຄ້າ *</label>
                <select value={form.customer_id} onChange={setField('customer_id')} required>
                  <option value="">-- ເລືອກລູກຄ້າ --</option>
                  {customersList.map((c) => (
                    <option key={c.id} value={c.id}>{c.full_name} ({c.code}) — {c.phone}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="field"><label>ເລກຕິດຕາມຈາກຮ້ານຈີນ</label><input value={form.china_tracking_no} onChange={setField('china_tracking_no')} /></div>
                <div className="field"><label>ຈຳນວນ</label><input type="number" min="1" value={form.quantity} onChange={setField('quantity')} /></div>
              </div>
              <div className="field"><label>ລາຍລະອຽດເຄື່ອງ</label><input value={form.item_description} onChange={setField('item_description')} placeholder="ເຊັ່ນ: ເສື້ອຢືດ 5 ໂຕ" /></div>
              <div className="field"><label>ລິ້ງຮ້ານ (Taobao/1688/Pinduoduo...)</label><input value={form.shop_link} onChange={setField('shop_link')} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="field"><label>ນ້ຳໜັກ (kg)</label><input type="number" step="0.01" value={form.weight_kg} onChange={onCalcField('weight_kg')} /></div>
                <div className="field"><label>ປະລິມາດ (CBM)</label><input type="number" step="0.0001" value={form.volume_cbm} onChange={onCalcField('volume_cbm')} /></div>
                <div className="field"><label>ມູນຄ່າ (CNY)</label><input type="number" step="0.01" value={form.declared_value_cny} onChange={setField('declared_value_cny')} /></div>
              </div>
              <div className="field">
                <label>ກົດເກນຄ່າຂົນສົ່ງ</label>
                <select value={form.pricing_rule_id} onChange={onCalcField('pricing_rule_id')}>
                  <option value="">-- ຄິດໄລ່ເອງ --</option>
                  {rulesList.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} ({Number(r.rate).toLocaleString()} {r.currency}/{r.calc_method === 'per_kg' ? 'kg' : 'cbm'})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="field"><label>ຄ່າຂົນສົ່ງ</label><input type="number" step="0.01" value={form.shipping_fee} onChange={setField('shipping_fee')} /></div>
                <div className="field"><label>ຄ່າອື່ນໆ</label><input type="number" step="0.01" value={form.other_fee} onChange={setField('other_fee')} /></div>
                <div className="field">
                  <label>ສະກຸນເງິນ</label>
                  <select value={form.currency} onChange={setField('currency')}>
                    <option value="LAK">LAK</option><option value="CNY">CNY</option><option value="THB">THB</option><option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="field">
                  <label>ສະຖານະຊຳລະ</label>
                  <select value={form.payment_status} onChange={setField('payment_status')}>
                    <option value="unpaid">ຍັງບໍ່ຊຳລະ</option><option value="partial">ຊຳລະບາງສ່ວນ</option><option value="paid">ຊຳລະຄົບແລ້ວ</option>
                  </select>
                </div>
                <div className="field"><label>ຈຳນວນທີ່ຊຳລະແລ້ວ</label><input type="number" step="0.01" value={form.paid_amount} onChange={setField('paid_amount')} /></div>
              </div>
              <div className="field"><label>ໝາຍເຫດ</label><textarea rows={2} value={form.notes} onChange={setField('notes')} /></div>

              <div className="text-right font-bold text-sm py-1">ລວມທັງໝົດ: {formatMoney(totalPreview, form.currency)}</div>
              <div className="flex gap-3 pt-1">
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
