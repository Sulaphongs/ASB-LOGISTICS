import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import StatCard from '../components/StatCard.jsx';
import Badge from '../components/Badge.jsx';
import { api, formatMoney } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Package, Users, Wallet, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/dashboard/stats').then((res) => {
      if (res.success) setStats(res);
    });
  }, []);

  return (
    <Layout title="Dashboard">
      <div className="card mb-5">
        <h2 className="text-base font-bold mb-1">ສະບາຍດີ, {user?.full_name || user?.username}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">ພາບລວມການຂົນສົ່ງ ASB ມື້ນີ້</p>
      </div>

      {!stats ? (
        <div className="text-slate-400 dark:text-slate-500 text-sm">ກຳລັງໂຫຼດ...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <StatCard label="ພັດສະດຸທັງໝົດ" value={stats.total_packages} icon={<Package className="w-6 h-6" />} />
            <StatCard label="ລູກຄ້າທັງໝົດ" value={stats.total_customers} icon={<Users className="w-6 h-6" />} />
            <StatCard label="ລາຍຮັບເດືອນນີ້" value={formatMoney(stats.revenue_this_month)} icon={<Wallet className="w-6 h-6" />} />
            <StatCard label="ຄ້າງຈ່າຍ" value={formatMoney(stats.unpaid_total)} tone="danger" icon={<AlertCircle className="w-6 h-6" />} />
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            <div className="card lg:col-span-2">
              <h3 className="text-sm font-bold mb-3">ພັດສະດຸລ່າສຸດ</h3>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ລະຫັດຕິດຕາມ</th>
                      <th>ລູກຄ້າ</th>
                      <th>ສະຖານະ</th>
                      <th>ຍອດລວມ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent_packages.length === 0 && (
                      <tr><td colSpan={4} className="text-center text-slate-400 dark:text-slate-500 py-4">ຍັງບໍ່ມີພັດສະດຸ</td></tr>
                    )}
                    {stats.recent_packages.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <Link to={`/packages/${p.id}`} className="font-semibold text-teal-700 hover:underline">
                            {p.tracking_code}
                          </Link>
                        </td>
                        <td>{p.customer_name}</td>
                        <td><Badge status={p.status}>{p.status_label}</Badge></td>
                        <td>{formatMoney(p.total_fee, p.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <h3 className="text-sm font-bold mb-3">ພັດສະດຸຕາມສະຖານະ</h3>
              <div className="space-y-2.5">
                {stats.status_breakdown.map((s) => (
                  <div key={s.status} className="flex items-center justify-between">
                    <Badge status={s.status}>{s.label}</Badge>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
