import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import Badge from '../components/Badge.jsx';
import { api } from '../api/client.js';
import { useToast } from '../components/Toast.jsx';
import { useConfirm } from '../components/Confirm.jsx';
import { Search, Eye, ArrowRight } from 'lucide-react';

const STATUS_FLOW = ['ordered', 'arrived_cn_warehouse', 'shipped', 'arrived_la_warehouse', 'out_for_delivery', 'delivered'];
const STATUS_LABELS = {
  ordered: 'ສັ່ງແລ້ວ', arrived_cn_warehouse: 'ຮອດສາງຈີນແລ້ວ', shipped: 'ກຳລັງຂົນສົ່ງມາລາວ',
  arrived_la_warehouse: 'ຮອດສາງລາວແລ້ວ', out_for_delivery: 'ກຳລັງຈັດສົ່ງ', delivered: 'ສົ່ງເຄື່ອງແລ້ວ', cancelled: 'ຍົກເລີກ',
};

export default function Receiving() {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  const search = async () => {
    if (!term.trim()) return;
    const res = await api.get(`/packages?search=${encodeURIComponent(term.trim())}&limit=20`);
    setResults(res.success ? res.packages : []);
    setSearched(true);
  };

  const advance = async (id, status, trackingCode) => {
    const ok = await confirm('ຢືນຢັນ', `ປ່ຽນສະຖານະ ${trackingCode} ເປັນ "${STATUS_LABELS[status]}"?`);
    if (!ok) return;
    const res = await api.post(`/packages/${id}/status`, { status, note: 'ອັບເດດຜ່ານໜ້າຮັບ-ສົ່ງສາງ' });
    if (res.success) { toast.success(res.message); search(); }
    else toast.error(res.error || 'ບໍ່ສຳເລັດ');
  };

  return (
    <Layout title="ຮັບ-ສົ່ງ ສາງ">
      <div className="card mb-5">
        <h3 className="text-sm font-bold mb-1">ຄົ້ນຫາພັດສະດຸ ເພື່ອອັບເດດສະຖານະ</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">ພິມ ຫຼື ສະແກນ ລະຫັດຕິດຕາມ ASB ຫຼືເລກຕິດຕາມຈາກຮ້ານຈີນ</p>
        <div className="flex gap-2">
          <input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="ລະຫັດຕິດຕາມ (ASB-...) ຫຼືເບີໂທລູກຄ້າ"
            className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-base bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button className="btn btn-primary" onClick={search}><Search className="w-4 h-4" /> ຄົ້ນຫາ</button>
        </div>
      </div>

      <div className="space-y-3">
        {searched && results.length === 0 && (
          <div className="card text-center text-slate-400 dark:text-slate-500">ບໍ່ພົບພັດສະດຸ</div>
        )}
        {results.map((p) => {
          const idx = STATUS_FLOW.indexOf(p.status);
          const next = p.status !== 'cancelled' && idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
          return (
            <div key={p.id} className="card flex justify-between items-center flex-wrap gap-3">
              <div>
                <div className="font-bold">
                  {p.tracking_code} <Badge status={p.status}>{p.status_label}</Badge>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{p.customer_name} — {p.customer_phone} · {p.item_description || ''}</div>
              </div>
              <div className="flex gap-2">
                <Link to={`/packages/${p.id}`} className="btn btn-light btn-sm"><Eye className="w-4 h-4" /> ລາຍລະອຽດ</Link>
                {next && (
                  <button className="btn btn-primary btn-sm" onClick={() => advance(p.id, next, p.tracking_code)}>
                    ໄປ: {STATUS_LABELS[next]} <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
