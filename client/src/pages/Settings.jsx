import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import { api } from '../api/client.js';
import { useToast } from '../components/Toast.jsx';
import { Save, Upload, RotateCcw } from 'lucide-react';

const FIELDS = ['company_name', 'company_phone', 'company_address', 'company_facebook', 'tracking_prefix', 'currency_cny_to_lak', 'currency_thb_to_lak'];

export default function Settings() {
  const [form, setForm] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    api.get('/settings').then((res) => {
      if (res.success) setForm(res.settings);
    });
  }, []);

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await api.put('/settings', form);
    if (res.success) toast.success(res.message);
    else toast.error(res.error || 'ບໍ່ສຳເລັດ');
  };

  const handleLogoUpload = async () => {
    if (!logoFile) { toast.error('ກະລຸນາເລືອກຮູບພາບ'); return; }
    setLogoUploading(true);
    const fd = new FormData();
    fd.append('logo', logoFile);
    const res = await api.upload('/settings/logo', fd);
    setLogoUploading(false);
    if (res.success) {
      toast.success(res.message);
      setLogoFile(null);
      setForm((f) => ({ ...f, company_logo: res.logo_path }));
    } else {
      toast.error(res.error || 'ບໍ່ສຳເລັດ');
    }
  };

  const handleLogoReset = async () => {
    const res = await api.del('/settings/logo');
    if (res.success) {
      toast.success(res.message);
      setForm((f) => ({ ...f, company_logo: null }));
    } else {
      toast.error(res.error || 'ບໍ່ສຳເລັດ');
    }
  };

  return (
    <Layout title="ການຕັ້ງຄ່າ">
      <div className="card max-w-xl mb-5">
        <h3 className="text-sm font-bold mb-4">ໂລໂກ້ບໍລິສັດ</h3>
        <div className="flex items-center gap-4">
          <img
            src={form.company_logo ? `/${form.company_logo}` : '/logo.jpg'}
            alt="ໂລໂກ້ປັດຈຸບັນ"
            className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
          />
          <div className="flex-1 space-y-2">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setLogoFile(e.target.files[0] || null)}
              className="text-sm"
            />
            <div className="flex gap-2">
              <button type="button" className="btn btn-primary btn-sm" disabled={logoUploading} onClick={handleLogoUpload}>
                <Upload className="w-4 h-4" /> {logoUploading ? 'ກຳລັງອັບໂຫລດ...' : 'ອັບໂຫລດ'}
              </button>
              {form.company_logo && (
                <button type="button" className="btn btn-light btn-sm" onClick={handleLogoReset}>
                  <RotateCcw className="w-4 h-4" /> ກັບຄືນຄ່າເລີ່ມຕົ້ນ
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card max-w-xl">
        <h3 className="text-sm font-bold mb-4">ຂໍ້ມູນບໍລິສັດ</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="field"><label>ຊື່ບໍລິສັດ/ຮ້ານ</label><input value={form.company_name || ''} onChange={setField('company_name')} /></div>
          <div className="field"><label>ເບີໂທຕິດຕໍ່</label><input value={form.company_phone || ''} onChange={setField('company_phone')} /></div>
          <div className="field"><label>ທີ່ຢູ່</label><textarea rows={2} value={form.company_address || ''} onChange={setField('company_address')} /></div>
          <div className="field"><label>Facebook Page</label><input value={form.company_facebook || ''} onChange={setField('company_facebook')} /></div>
          <div className="field"><label>ຄຳນຳໜ້າລະຫັດຕິດຕາມ (ເຊັ່ນ ASB)</label><input maxLength={10} value={form.tracking_prefix || ''} onChange={setField('tracking_prefix')} /></div>

          <hr className="my-4 border-slate-100 dark:border-slate-700" />
          <h3 className="text-sm font-bold mb-1">ອັດຕາແລກປ່ຽນເງິນ (ອ້າງອີງ)</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="field"><label>1 CNY = ? LAK</label><input type="number" step="0.01" value={form.currency_cny_to_lak || ''} onChange={setField('currency_cny_to_lak')} /></div>
            <div className="field"><label>1 THB = ? LAK</label><input type="number" step="0.01" value={form.currency_thb_to_lak || ''} onChange={setField('currency_thb_to_lak')} /></div>
          </div>
          <button type="submit" className="btn btn-primary mt-2"><Save className="w-4 h-4" /> ບັນທຶກການຕັ້ງຄ່າ</button>
        </form>
      </div>
    </Layout>
  );
}
