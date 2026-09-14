import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import Badge from '../components/Badge.jsx';
import { api, formatMoney } from '../api/client.js';
import { useToast } from '../components/Toast.jsx';
import { useConfirm } from '../components/Confirm.jsx';
import { ArrowLeft, Printer, Trash2, Upload, X, Check } from 'lucide-react';

const STATUS_FLOW = ['ordered', 'arrived_cn_warehouse', 'shipped', 'arrived_la_warehouse', 'out_for_delivery', 'delivered'];
const STATUS_LABELS = {
  ordered: 'ສັ່ງແລ້ວ (ລໍຖ້າຮ້ານຈີນຈັດສົ່ງ)',
  arrived_cn_warehouse: 'ຮອດສາງຈີນແລ້ວ',
  shipped: 'ກຳລັງຂົນສົ່ງມາລາວ',
  arrived_la_warehouse: 'ຮອດສາງລາວແລ້ວ',
  out_for_delivery: 'ກຳລັງຈັດສົ່ງໃຫ້ລູກຄ້າ',
  delivered: 'ສົ່ງເຄື່ອງແລ້ວ',
  cancelled: 'ຍົກເລີກ',
};

export default function PackageDetail() {
  const { id } = useParams();
  const [pkg, setPkg] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [noteDraft, setNoteDraft] = useState('');
  const [pendingStatus, setPendingStatus] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  const load = useCallback(async () => {
    const [pr, tr] = await Promise.all([
      api.get(`/packages/${id}`),
      api.get(`/packages/${id}/timeline`),
    ]);
    if (pr.success) setPkg(pr.package);
    if (tr.success) setTimeline(tr.timeline);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleUploadPhoto = async () => {
    if (!photoFile) { toast.error('ກະລຸນາເລືອກຮູບພາບ'); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append('photo', photoFile);
    const res = await api.upload(`/packages/${id}/photo`, fd);
    setUploading(false);
    if (res.success) {
      toast.success(res.message);
      setPhotoFile(null);
      load();
    } else {
      toast.error(res.error || 'ບໍ່ສຳເລັດ');
    }
  };

  const handleDeletePhoto = async () => {
    const ok = await confirm('ຢືນຢັນ', 'ລຶບຮູບພັດສະດຸນີ້?');
    if (!ok) return;
    const res = await api.del(`/packages/${id}/photo`);
    if (res.success) { toast.success(res.message); load(); }
    else toast.error(res.error || 'ບໍ່ສຳເລັດ');
  };

  const confirmStatus = async () => {
    const res = await api.post(`/packages/${id}/status`, { status: pendingStatus, note: noteDraft });
    if (res.success) {
      toast.success(res.message);
      setPendingStatus(null);
      setNoteDraft('');
      load();
    } else {
      toast.error(res.error || 'ບໍ່ສຳເລັດ');
    }
  };

  if (!pkg) {
    return <Layout title="ລາຍລະອຽດພັດສະດຸ"><div className="text-slate-400 text-sm">ກຳລັງໂຫຼດ...</div></Layout>;
  }

  const currentIdx = STATUS_FLOW.indexOf(pkg.status);
  const nextStatus = pkg.status !== 'cancelled' && currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIdx + 1] : null;

  return (
    <Layout title="ລາຍລະອຽດພັດສະດຸ">
      <div className="flex gap-2 mb-4">
        <Link to="/packages" className="btn btn-light btn-sm"><ArrowLeft className="w-4 h-4" /> ກັບໄປລາຍການ</Link>
        <Link to={`/packages/${id}/label`} target="_blank" className="btn btn-light btn-sm"><Printer className="w-4 h-4" /> ພິມໃບຕິດພັດສະດຸ</Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 flex flex-col gap-5">
        <div className="card">
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold">{pkg.tracking_code}</h2>
              <p className="text-sm text-slate-500">{pkg.item_description || 'ບໍ່ມີລາຍລະອຽດ'}</p>
            </div>
            <Badge status={pkg.status}>{pkg.status_label}</Badge>
          </div>
          <hr className="my-4 border-slate-100" />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><strong>ລູກຄ້າ:</strong> {pkg.customer_name} ({pkg.customer_code})</div>
            <div><strong>ເບີໂທ:</strong> {pkg.customer_phone}</div>
            <div><strong>ເລກຕິດຕາມຈີນ:</strong> {pkg.china_tracking_no || '-'}</div>
            <div><strong>ຈຳນວນ:</strong> {pkg.quantity}</div>
            <div><strong>ນ້ຳໜັກ:</strong> {pkg.weight_kg ? `${pkg.weight_kg} kg` : '-'}</div>
            <div><strong>ປະລິມາດ:</strong> {pkg.volume_cbm ? `${pkg.volume_cbm} cbm` : '-'}</div>
            <div><strong>ມູນຄ່າສິນຄ້າ:</strong> {pkg.declared_value_cny ? `${pkg.declared_value_cny} CNY` : '-'}</div>
            <div><strong>ທີ່ຢູ່ຈັດສົ່ງ:</strong> {pkg.customer_address || '-'}</div>
          </div>
          {pkg.shop_link && (
            <p className="mt-3 text-sm"><strong>ລິ້ງຮ້ານ:</strong> <a href={pkg.shop_link} target="_blank" rel="noopener noreferrer" className="text-teal-700 hover:underline">{pkg.shop_link}</a></p>
          )}
          {pkg.notes && <p className="mt-3 text-sm"><strong>ໝາຍເຫດ:</strong> {pkg.notes}</p>}
          <hr className="my-4 border-slate-100" />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><strong>ຄ່າຂົນສົ່ງ:</strong> {formatMoney(pkg.shipping_fee, pkg.currency)}</div>
            <div><strong>ຄ່າອື່ນໆ:</strong> {formatMoney(pkg.other_fee, pkg.currency)}</div>
            <div><strong>ລວມທັງໝົດ:</strong> {formatMoney(pkg.total_fee, pkg.currency)}</div>
            <div>
              <strong>ຊຳລະແລ້ວ:</strong> {formatMoney(pkg.paid_amount, pkg.currency)}{' '}
              <Badge status={pkg.payment_status}>{pkg.payment_status}</Badge>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-bold mb-3">ຮູບພັດສະດຸ</h3>
          {pkg.photo_path ? (
            <div>
              <img
                src={`/${pkg.photo_path}?t=${Date.now()}`}
                alt="ຮູບພັດສະດຸ"
                className="max-w-full max-h-80 rounded-xl border border-slate-200 block"
              />
              <button className="btn btn-danger btn-sm mt-2" onClick={handleDeletePhoto}><Trash2 className="w-4 h-4" /> ລຶບຮູບ</button>
            </div>
          ) : (
            <div>
              <div className="flex gap-2 items-center flex-wrap">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  className="flex-1 min-w-[180px] text-sm"
                />
                <button className="btn btn-primary btn-sm" disabled={uploading} onClick={handleUploadPhoto}>
                  {uploading ? 'ກຳລັງອັບໂຫລດ...' : <><Upload className="w-4 h-4" /> ອັບໂຫລດ</>}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2">JPG, PNG, WEBP — ສູງສຸດ 5MB</p>
            </div>
          )}
        </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-bold mb-3">ປະຫວັດການເຄື່ອນໄຫວ</h3>

          {pkg.status !== 'cancelled' && pkg.status !== 'delivered' && (
            <div className="flex flex-col gap-2 mb-4">
              {nextStatus && (
                <button className="btn btn-primary justify-center" onClick={() => setPendingStatus(nextStatus)}>
                  ໄປຂັ້ນຕໍ່ໄປ: {STATUS_LABELS[nextStatus]}
                </button>
              )}
              <button className="btn btn-danger justify-center" onClick={() => setPendingStatus('cancelled')}>
                ຍົກເລີກອອເດີ
              </button>
            </div>
          )}

          <div className="space-y-3">
            {timeline.length === 0 && <p className="text-sm text-slate-400">ຍັງບໍ່ມີປະຫວັດ</p>}
            {timeline.map((t) => (
              <div key={t.id} className="border-l-2 border-teal-500 pl-3">
                <div className="text-sm font-semibold">{t.status_label}</div>
                <div className="text-[11px] text-slate-400">
                  {new Date(t.created_at).toLocaleString('lo-LA')} {t.changed_by_name ? `— ${t.changed_by_name}` : ''}
                </div>
                {t.note && <div className="text-xs mt-0.5">{t.note}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {pendingStatus && (
        <div className="modal-backdrop">
          <div className="modal-box max-w-sm">
            <h3 className="text-base font-bold mb-3">ປ່ຽນສະຖານະເປັນ: {STATUS_LABELS[pendingStatus]}</h3>
            <div className="field">
              <label>ໝາຍເຫດ (ບໍ່ບັງຄັບ)</label>
              <input value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} autoFocus />
            </div>
            <div className="flex gap-3 mt-4">
              <button className="btn btn-light flex-1 justify-center" onClick={() => { setPendingStatus(null); setNoteDraft(''); }}><X className="w-4 h-4" /> ຍົກເລີກ</button>
              <button className="btn btn-primary flex-1 justify-center" onClick={confirmStatus}><Check className="w-4 h-4" /> ຢືນຢັນ</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
