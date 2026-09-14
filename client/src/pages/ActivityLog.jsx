import React, { useCallback, useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout.jsx';
import DatePicker from '../components/DatePicker.jsx';
import { api } from '../api/client.js';

const MODULE_LABELS = { auth: 'ເຂົ້າສູ່ລະບົບ', customer: 'ລູກຄ້າ', package: 'ພັດສະດຸ', pricing: 'ລາຄາ', user: 'ຜູ້ໃຊ້ງານ', settings: 'ການຕັ້ງຄ່າ' };
const ACTION_BADGE = {
  create: 'badge-delivered', update: 'badge-shipped', delete: 'badge-cancelled',
  status_change: 'badge-arrived_la_warehouse', login: 'badge-delivered', failed_login: 'badge-cancelled',
};
const ACTION_LABELS = { create: 'ສ້າງ', update: 'ແກ້ໄຂ', delete: 'ລຶບ', status_change: 'ປ່ຽນສະຖານະ', login: 'ເຂົ້າລະບົບ', failed_login: 'ເຂົ້າລະບົບບໍ່ສຳເລັດ' };

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [module, setModule] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const debounceRef = useRef(null);

  const load = useCallback(async (opts = {}) => {
    const params = new URLSearchParams({
      limit: '30',
      page: String(opts.page ?? page),
      module: opts.module ?? module,
      search: opts.search ?? search,
      date_from: opts.dateFrom ?? dateFrom,
      date_to: opts.dateTo ?? dateTo,
    });
    const res = await api.get(`/activity-logs?${params.toString()}`);
    if (res.success) {
      setLogs(res.logs);
      setTotalPages(res.total_pages || 1);
    }
  }, [page, module, search, dateFrom, dateTo]);

  useEffect(() => { load({ page: 1 }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); load({ page: 1, search: val }); }, 350);
  };
  const onModuleChange = (e) => { const val = e.target.value; setModule(val); setPage(1); load({ page: 1, module: val }); };
  const onDateFromChange = (e) => { const val = e.target.value; setDateFrom(val); setPage(1); load({ page: 1, dateFrom: val }); };
  const onDateToChange = (e) => { const val = e.target.value; setDateTo(val); setPage(1); load({ page: 1, dateTo: val }); };
  const goPage = (p) => { setPage(p); load({ page: p }); };

  return (
    <Layout title="ບັນທຶກກິດຈະກຳ">
      <div className="card">
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            className="flex-1 min-w-[200px] px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="ຄົ້ນຫາ ລາຍລະອຽດ / ຜູ້ໃຊ້..."
            value={search}
            onChange={onSearchChange}
          />
          <select className="px-3 py-2 border border-slate-200 rounded-xl text-sm" value={module} onChange={onModuleChange}>
            <option value="">ທຸກໂມດູນ</option>
            {Object.entries(MODULE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <DatePicker value={dateFrom} onChange={onDateFromChange} placeholder="ຈາກວັນທີ" />
          <DatePicker value={dateTo} onChange={onDateToChange} placeholder="ຫາວັນທີ" />
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>ເວລາ</th><th>ຜູ້ໃຊ້</th><th>ໂມດູນ</th><th>ປະເພດ</th><th>ລາຍລະອຽດ</th></tr>
            </thead>
            <tbody>
              {logs.length === 0 && <tr><td colSpan={5} className="text-center text-slate-400 py-6">ບໍ່ມີຂໍ້ມູນ</td></tr>}
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap text-xs">{new Date(l.created_at).toLocaleString('lo-LA')}</td>
                  <td>{l.username || '-'}</td>
                  <td>{MODULE_LABELS[l.module] || l.module}</td>
                  <td><span className={`badge ${ACTION_BADGE[l.action_type] || 'badge-ordered'}`}>{ACTION_LABELS[l.action_type] || l.action_type}</span></td>
                  <td className="text-sm">{l.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-light'}`}
                onClick={() => goPage(p)}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
