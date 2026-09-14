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

  // ໃບຕິດພັດສະດຸຕ້ອງກົງກັບເຈ້ຍທີ່ພິມອອກ (light theme ສະເໝີ) — ລຶບ class "dark" ຈາກ <html>
  // ຊົ່ວຄາວ ເພື່ອບໍ່ໃຫ້ຂໍ້ຄວາມ inherit ສີ dark:text-slate-100 ຈາກ body (index.css) ຈົນຈາງເກີນອ່ານອອກ
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    root.classList.remove('dark');
    return () => { if (hadDark) root.classList.add('dark'); };
  }, []);

  if (!pkg) {
    return <div className="min-h-screen bg-slate-200 flex items-center justify-center text-slate-500">ກຳລັງໂຫຼດ...</div>;
  }

  const barcodeSrc = `https://barcodeapi.org/api/128/${encodeURIComponent(pkg.tracking_code)}`;

  return (
    <div className="min-h-screen bg-slate-200 py-6 px-4 print:bg-white print:p-0">
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <div className="max-w-[420px] mx-auto mb-4 no-print">
        <button className="btn btn-primary" onClick={() => window.print()}><Printer className="w-4 h-4" /> ພິມໃບຕິດ</button>
      </div>
      <div className="max-w-[420px] mx-auto bg-white border-2 border-slate-900 rounded-2xl p-5 text-slate-800">
        <div className="flex justify-between items-center border-b-2 border-dashed border-slate-900 pb-3 mb-3">
          <div>
            <div className="font-extrabold text-base">{company.company_name}</div>
            {company.company_phone && <div className="text-xs text-slate-500">ໂທ: {company.company_phone}</div>}
          </div>
          <div className="font-bold text-sm">ໃບຝາກພັດສະດຸ</div>
        </div>

        <div className="text-center my-3">
          <img src={barcodeSrc} alt="Barcode" className="mx-auto max-w-full h-auto" />
          <div className="text-lg font-extrabold tracking-wide mt-1">ລະຫັດຕິດຕາມ {pkg.tracking_code}</div>
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

        <p className="text-center text-[11px] text-slate-400 mt-4">ສະແກນບາໂຄດ ຫຼື ໃສ່ລະຫັດຕິດຕາມທີ່ asb-logistics ເພື່ອກວດສະຖານະພັດສະດຸ</p>
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
