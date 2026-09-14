import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard, Package, Truck, Calculator, Users, TrendingUp, IdCard, Settings, ClipboardList,
} from 'lucide-react';

const ICONS = {
  dashboard: LayoutDashboard,
  packages: Package,
  receiving: Truck,
  pricing: Calculator,
  customers: Users,
  reports: TrendingUp,
  users: IdCard,
  settings: Settings,
  activityLog: ClipboardList,
};

export default function Sidebar({ open, onClose }) {
  const { isAdmin } = useAuth();

  const groups = [
    {
      label: 'ຫຼັກ',
      items: [
        { to: '/', label: 'Dashboard', icon: ICONS.dashboard, end: true },
        { to: '/packages', label: 'ພັດສະດຸ / ອອເດີ', icon: ICONS.packages },
        { to: '/receiving', label: 'ຮັບ-ສົ່ງ ສາງ', icon: ICONS.receiving },
        { to: '/pricing', label: 'ຄິດໄລ່ຄ່າຂົນສົ່ງ', icon: ICONS.pricing },
      ],
    },
    {
      label: 'ຂໍ້ມູນ',
      items: [
        { to: '/customers', label: 'ລູກຄ້າ', icon: ICONS.customers },
        { to: '/reports', label: 'ລາຍງານ', icon: ICONS.reports },
      ],
    },
  ];

  if (isAdmin) {
    groups.push({
      label: 'ຜູ້ດູແລລະບົບ',
      items: [
        { to: '/users', label: 'ຜູ້ໃຊ້ງານ', icon: ICONS.users },
        { to: '/activity-log', label: 'ບັນທຶກກິດຈະກຳ', icon: ICONS.activityLog },
        { to: '/settings', label: 'ການຕັ້ງຄ່າ', icon: ICONS.settings },
      ],
    });
  }

  return (
    <>
      {open && <div className="fixed inset-0 bg-slate-900/30 z-30 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 z-40 flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-extrabold flex items-center justify-center text-sm">
            ASB
          </div>
          <div>
            <div className="font-extrabold text-slate-800 leading-tight">ASB LOGISTICS</div>
            <div className="text-[11px] text-slate-400">ຂົນສົ່ງ &amp; ຮັບເຄື່ອງຈາກແອັບຈີນ</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {groups.map((g) => (
            <div key={g.label} className="mb-5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">{g.label}</div>
              <ul className="space-y-1">
                {g.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'
                        }`
                      }
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
