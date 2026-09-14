import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { Search, AlertTriangle } from 'lucide-react';

export default function Track() {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pkg, setPkg] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [companyName, setCompanyName] = useState('ASB LOGISTICS');
  const [companyPhone, setCompanyPhone] = useState('');

  useEffect(() => {
    api.get('/public/settings').then((res) => {
      if (res.success) {
        setCompanyName(res.settings.company_name || 'ASB LOGISTICS');
        setCompanyPhone(res.settings.company_phone || '');
      }
    });
  }, []);

  const doTrack = async (searchCode = code) => {
    if (!searchCode.trim()) return;
    setLoading(true);
    setError('');
    setPkg(null);
    const res = await api.get(`/public/track/${encodeURIComponent(searchCode.trim())}`);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'ເກີດຄວາມຜິດພາດ');
      return;
    }
    setPkg(res.package);
    setTimeline(res.timeline || []);
  };

  useEffect(() => {
    if (searchParams.get('code')) doTrack(searchParams.get('code'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg,#181818 0%,#181818 220px,#f4f5f7 220px)' }}>
      <div className="max-w-xl mx-auto px-4 pt-8 pb-16">
        <div className="flex items-center gap-3 text-white mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-900 font-extrabold flex items-center justify-center">ASB</div>
          <div>
            <div className="font-extrabold text-[1.05rem]">{companyName}</div>
            <div className="text-xs text-white/55">ຕິດຕາມສະຖານະພັດສະດຸຂອງທ່ານ</div>
          </div>
        </div>

        <div className="card">
          <div className="flex gap-2">
            <input
              className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="ໃສ່ລະຫັດຕິດຕາມ ເຊັ່ນ: ASB-260913-A1B2"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') doTrack(); }}
            />
            <button className="btn btn-primary" onClick={() => doTrack()}><Search className="w-4 h-4" /> ຄົ້ນຫາ</button>
          </div>

          <div className="mt-4">
            {loading && <p className="text-slate-400 text-center">ກຳລັງຄົ້ນຫາ...</p>}
            {!loading && error && (
              <p className="text-rose-600 text-center py-2 flex items-center justify-center gap-1.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
              </p>
            )}
            {!loading && pkg && (
              <div className="border-t border-slate-100 pt-4">
                <div className="flex justify-between items-start flex-wrap gap-2 mb-4">
                  <div>
                    <div className="font-extrabold text-lg">{pkg.tracking_code}</div>
                    <div className="text-slate-500 text-sm">{pkg.item_description || 'ບໍ່ມີລາຍລະອຽດ'}</div>
                  </div>
                  <span className={`badge badge-${pkg.status}`}>{pkg.status_label}</span>
                </div>
                <div className="flex flex-col gap-3.5">
                  {timeline.length === 0 && <p className="text-slate-400">ຍັງບໍ່ມີປະຫວັດການເຄື່ອນໄຫວ</p>}
                  {timeline.map((t, i) => (
                    <div key={i} className="flex gap-2.5">
                      <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${i === timeline.length - 1 ? 'bg-amber-400' : 'bg-slate-300'}`} />
                      <div>
                        <div className="font-bold text-sm">{t.status_label}</div>
                        <div className="text-[11px] text-slate-400">{new Date(t.created_at).toLocaleString('lo-LA')}</div>
                        {t.note && <div className="text-xs mt-0.5">{t.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {companyPhone && (
          <p className="text-center text-slate-500 text-sm mt-4">
            ມີບັນຫາ ຫຼື ຄຳຖາມ? ໂທ <a href={`tel:${companyPhone}`} className="font-bold text-slate-700">{companyPhone}</a>
          </p>
        )}
      </div>
    </div>
  );
}
