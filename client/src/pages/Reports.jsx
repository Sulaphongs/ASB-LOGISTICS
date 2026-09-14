import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout.jsx';
import StatCard from '../components/StatCard.jsx';
import Badge from '../components/Badge.jsx';
import DatePicker from '../components/DatePicker.jsx';
import { api, formatMoney } from '../api/client.js';
import { Package, Weight, Wallet, AlertCircle } from 'lucide-react';

export default function Reports() {
  const [allPackages, setAllPackages] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = useCallback(async () => {
    const res = await api.get('/packages?limit=500');
    if (res.success) setAllPackages(res.packages);
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows = allPackages.filter((p) => {
    const d = p.created_at.slice(0, 10);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  });

  const totalRevenue = rows.reduce((s, p) => s + Number(p.total_fee), 0);
  const totalPaid = rows.reduce((s, p) => s + Number(p.paid_amount), 0);
  const totalWeight = rows.reduce((s, p) => s + Number(p.weight_kg || 0), 0);

  return (
    <Layout title="ລາຍງານ">
      <div className="card mb-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="field mb-0"><label>ຈາກວັນທີ</label><DatePicker value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></div>
          <div className="field mb-0"><label>ຫາວັນທີ</label><DatePicker value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard label="ຈຳນວນພັດສະດຸ" value={rows.length} icon={<Package className="w-6 h-6" />} />
        <StatCard label="ນ້ຳໜັກລວມ" value={`${totalWeight.toFixed(1)} kg`} icon={<Weight className="w-6 h-6" />} />
        <StatCard label="ຍອດລວມ" value={formatMoney(totalRevenue)} icon={<Wallet className="w-6 h-6" />} />
        <StatCard label="ຄ້າງຈ່າຍ" value={formatMoney(totalRevenue - totalPaid)} tone="danger" icon={<AlertCircle className="w-6 h-6" />} />
      </div>

      <div className="card">
        <h3 className="text-sm font-bold mb-3">ລາຍລະອຽດພັດສະດຸ</h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>ລະຫັດຕິດຕາມ</th><th>ລູກຄ້າ</th><th>ນ້ຳໜັກ</th><th>ຄ່າຂົນສົ່ງ</th>
                <th>ຄ່າອື່ນໆ</th><th>ລວມ</th><th>ຊຳລະແລ້ວ</th><th>ສະຖານະ</th><th>ວັນທີ</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={9} className="text-center text-slate-400 dark:text-slate-500 py-6">ບໍ່ມີຂໍ້ມູນ</td></tr>}
              {rows.map((p) => (
                <tr key={p.id}>
                  <td className="font-semibold">{p.tracking_code}</td>
                  <td>{p.customer_name}</td>
                  <td>{p.weight_kg ? `${p.weight_kg} kg` : '-'}</td>
                  <td>{formatMoney(p.shipping_fee, p.currency)}</td>
                  <td>{formatMoney(p.other_fee, p.currency)}</td>
                  <td>{formatMoney(p.total_fee, p.currency)}</td>
                  <td>{formatMoney(p.paid_amount, p.currency)}</td>
                  <td><Badge status={p.status}>{p.status_label}</Badge></td>
                  <td>{new Date(p.created_at).toLocaleDateString('lo-LA')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
