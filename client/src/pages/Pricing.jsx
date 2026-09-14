import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout.jsx';
import Badge from '../components/Badge.jsx';
import { api, formatMoney } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { useConfirm } from '../components/Confirm.jsx';
import { Calculator, Plus, SquarePen, Trash2, X, Save } from 'lucide-react';

const emptyForm = { id: null, name: '', shipping_type: 'land', calc_method: 'per_kg', rate: 0, min_charge: 0, currency: 'LAK', is_default: false, status: 'active' };

export default function Pricing() {
  const { isAdmin } = useAuth();
  const [rules, setRules] = useState([]);
  const [calcRuleId, setCalcRuleId] = useState('');
  const [calcWeight, setCalcWeight] = useState('');
  const [calcVolume, setCalcVolume] = useState('');
  const [calcOther, setCalcOther] = useState('0');
  const [calcResult, setCalcResult] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const toast = useToast();
  const confirm = useConfirm();

  const load = useCallback(async () => {
    const res = await api.get('/pricing');
    if (res.success) {
      setRules(res.rules);
      const activeRules = res.rules.filter((r) => r.status === 'active');
      const def = activeRules.find((r) => r.is_default) || activeRules[0];
      if (def) setCalcRuleId(String(def.id));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const calc = useCallback(async (ruleId = calcRuleId, weight = calcWeight, volume = calcVolume, other = calcOther) => {
    if (!ruleId) { setCalcResult(null); return; }
    const res = await api.post('/pricing/calculate', {
      pricing_rule_id: ruleId, weight_kg: weight || 0, volume_cbm: volume || 0, other_fee: other || 0,
    });
    setCalcResult(res.success ? res : { error: res.error });
  }, [calcRuleId, calcWeight, calcVolume, calcOther]);

  useEffect(() => { if (calcRuleId) calc(); }, [calcRuleId]); // eslint-disable-line react-hooks/exhaustive-deps

  const openModal = (rule = null) => {
    setForm(rule ? { ...rule, is_default: !!rule.is_default } : emptyForm);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);
  const setField = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('ກະລຸນາປ້ອນຊື່ກົດເກນ'); return; }
    const res = form.id ? await api.put(`/pricing/${form.id}`, form) : await api.post('/pricing', form);
    if (res.success) { toast.success(res.message); closeModal(); load(); }
    else toast.error(res.error || 'ບໍ່ສຳເລັດ');
  };

  const handleDelete = async (r) => {
    const ok = await confirm('ຢືນຢັນ', `ລຶບກົດເກນລາຄາ: ${r.name}?`);
    if (!ok) return;
    const res = await api.del(`/pricing/${r.id}`);
    if (res.success) { toast.success(res.message); load(); }
    else toast.error(res.error || 'ບໍ່ສຳເລັດ');
  };

  return (
    <Layout title="ຄິດໄລ່ຄ່າຂົນສົ່ງ">
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Calculator className="w-4 h-4 text-teal-600" /> ຄິດໄລ່ຄ່າຂົນສົ່ງໄວ</h3>
          <div className="field">
            <label>ກົດເກນລາຄາ</label>
            <select value={calcRuleId} onChange={(e) => { setCalcRuleId(e.target.value); calc(e.target.value); }}>
              {rules.filter((r) => r.status === 'active').map((r) => (
                <option key={r.id} value={r.id}>{r.name} ({Number(r.rate).toLocaleString()} {r.currency}/{r.calc_method === 'per_kg' ? 'kg' : 'cbm'})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="field"><label>ນ້ຳໜັກ (kg)</label><input type="number" step="0.01" value={calcWeight} onChange={(e) => { setCalcWeight(e.target.value); calc(calcRuleId, e.target.value, calcVolume, calcOther); }} /></div>
            <div className="field"><label>ປະລິມາດ (CBM)</label><input type="number" step="0.0001" value={calcVolume} onChange={(e) => { setCalcVolume(e.target.value); calc(calcRuleId, calcWeight, e.target.value, calcOther); }} /></div>
          </div>
          <div className="field"><label>ຄ່າອື່ນໆ (ຖ້າມີ)</label><input type="number" step="0.01" value={calcOther} onChange={(e) => { setCalcOther(e.target.value); calc(calcRuleId, calcWeight, calcVolume, e.target.value); }} /></div>

          {calcResult && !calcResult.error && (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/40 rounded-xl text-sm space-y-1.5">
              <div className="flex justify-between"><span>ຄ່າຂົນສົ່ງ:</span><strong>{formatMoney(calcResult.shipping_fee, calcResult.currency)}</strong></div>
              <div className="flex justify-between"><span>ຄ່າອື່ນໆ:</span><strong>{formatMoney(calcResult.other_fee, calcResult.currency)}</strong></div>
              <div className="flex justify-between text-base pt-2 border-t border-slate-200 dark:border-slate-700"><span>ລວມທັງໝົດ:</span><strong>{formatMoney(calcResult.total_fee, calcResult.currency)}</strong></div>
            </div>
          )}
          {calcResult?.error && <div className="mt-4 text-rose-600 text-sm">{calcResult.error}</div>}
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold">ກົດເກນລາຄາ</h3>
            {isAdmin && <button className="btn btn-primary btn-sm" onClick={() => openModal()}><Plus className="w-4 h-4" /> ເພີ່ມ</button>}
          </div>
          <div className="space-y-1">
            {rules.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500">ຍັງບໍ່ມີກົດເກນລາຄາ</p>}
            {rules.map((r) => (
              <div key={r.id} className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
                <div>
                  <div className="font-semibold text-sm flex items-center gap-2">
                    {r.name} {!!r.is_default && <Badge status="delivered">ຄ່າເລີ່ມຕົ້ນ</Badge>}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {r.shipping_type === 'land' ? 'ທາງບົກ' : 'ທາງອາກາດ'} · {Number(r.rate).toLocaleString()} {r.currency} / {r.calc_method === 'per_kg' ? 'kg' : 'cbm'} · ຂັ້ນຕ່ຳ {Number(r.min_charge).toLocaleString()}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1.5">
                    <button className="btn btn-light btn-sm" onClick={() => openModal(r)}><SquarePen className="w-4 h-4" /> ແກ້ໄຂ</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r)}><Trash2 className="w-4 h-4" /> ລຶບ</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-box max-w-md">
            <h3 className="text-base font-bold mb-4">{form.id ? 'ແກ້ໄຂກົດເກນລາຄາ' : 'ເພີ່ມກົດເກນລາຄາ'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="field"><label>ຊື່ກົດເກນ *</label><input value={form.name} onChange={setField('name')} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="field">
                  <label>ປະເພດຂົນສົ່ງ</label>
                  <select value={form.shipping_type} onChange={setField('shipping_type')}>
                    <option value="land">ທາງບົກ</option><option value="air">ທາງອາກາດ</option>
                  </select>
                </div>
                <div className="field">
                  <label>ວິທີຄິດໄລ່</label>
                  <select value={form.calc_method} onChange={setField('calc_method')}>
                    <option value="per_kg">ຕໍ່ກິໂລ (kg)</option><option value="per_cbm">ຕໍ່ CBM</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="field"><label>ລາຄາ/ໜ່ວຍ *</label><input type="number" step="0.01" value={form.rate} onChange={setField('rate')} required /></div>
                <div className="field"><label>ຄ່າຕ່ຳສຸດ</label><input type="number" step="0.01" value={form.min_charge} onChange={setField('min_charge')} /></div>
              </div>
              <div className="field">
                <label>ສະກຸນເງິນ</label>
                <select value={form.currency} onChange={setField('currency')}>
                  <option value="LAK">LAK</option><option value="CNY">CNY</option><option value="THB">THB</option><option value="USD">USD</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_default} onChange={setField('is_default')} className="w-4 h-4" />
                ຕັ້ງເປັນຄ່າເລີ່ມຕົ້ນ
              </label>
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
