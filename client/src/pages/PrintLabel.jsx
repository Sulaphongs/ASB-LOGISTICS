import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { Printer } from 'lucide-react';

const PAYMENT_LABELS = { paid: 'ຊຳລະຄົບແລ້ວ', partial: 'ຊຳລະບາງສ່ວນ', unpaid: 'ເກັບເງິນປາຍທາງ' };

export default function PrintLabel() {
  const { id } = useParams();
  const [pkg, setPkg] = useState(null);
  const [company, setCompany] = useState({ company_name: 'ASB LOGISTICS', company_phone: '' });

  useEffect(() => {
    Promise.all([api.get(`/packages/${id}`), api.get('/settings')]).then(([pr, sr]) => {
      if (pr.success) setPkg(pr.package);
      if (sr.success) setCompany(sr.settings);
    });
  }, [id]);

  if (!pkg) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">ກຳລັງໂຫຼດ...</div>;
  }

  const trackUrl = `${window.location.origin}/track?code=${encodeURIComponent(pkg.tracking_code)}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(trackUrl)}`;

  return (
    <div className="min-h-screen bg-slate-200 py-6 px-4 print:bg-white print:p-0">
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <div className="max-w-[420px] mx-auto mb-4 no-print">
        <button className="btn btn-primary" onClick={() => window.print()}><Printer className="w-4 h-4" /> ພິມໃບຕິດ</button>
      </div>
      <div className="max-w-[420px] mx-auto bg-white border-2 border-slate-900 rounded-2xl p-5">
        <div className="flex justify-between items-center border-b-2 border-dashed border-slate-900 pb-3 mb-3">
          <div>
            <div className="font-extrabold text-base">{company.company_name}</div>
            {company.company_phone && <div className="text-xs text-slate-500">ໂທ: {company.company_phone}</div>}
          </div>
          <img src={qrSrc} alt="QR" width={90} height={90} />
        </div>

        <div className="text-2xl font-extrabold tracking-wide text-center my-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200">
          {pkg.tracking_code}
        </div>

        <Row label="ຜູ້ຮັບ" value={pkg.customer_name} />
        <Row label="ເບີໂທ" value={pkg.customer_phone} />
        <Row label="ແຂວງ" value={pkg.customer_province || '-'} />
        <div className="flex justify-between text-sm py-1 border-b border-dotted border-slate-200 block">
          <span>ທີ່ຢູ່ຈັດສົ່ງ</span>
        </div>
        <div className="text-sm font-semibold mt-1 mb-2 whitespace-pre-wrap">{pkg.customer_address || '-'}</div>

        <Row label="ລາຍການ" value={pkg.item_description || '-'} />
        <Row label="ຈຳນວນ" value={pkg.quantity} />
        <Row label="ນ້ຳໜັກ" value={pkg.weight_kg ? `${pkg.weight_kg} kg` : '-'} />
        <Row label="ສະຖານະຊຳລະ" value={PAYMENT_LABELS[pkg.payment_status] || pkg.payment_status} />
        <Row label="ວັນທີ່ສ້າງ" value={new Date(pkg.created_at).toLocaleDateString('lo-LA')} />

        <p className="text-center text-[11px] text-slate-400 mt-4">ສະແກນ QR ເພື່ອຕິດຕາມສະຖານະພັດສະດຸ</p>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm py-1 border-b border-dotted border-slate-200">
      <span>{label}</span>
      <strong className="text-slate-700">{value}</strong>
    </div>
  );
}
