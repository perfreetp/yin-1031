import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  MapPin,
  Monitor,
  Trophy,
  AlertTriangle,
  Bell,
  ChevronLeft,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { useStore } from '@/store/useStore';

const menuItems = [
  { path: '/', label: '运营总览', icon: LayoutDashboard },
  { path: '/drills', label: '演练计划', icon: Calendar },
  { path: '/personnel', label: '人员管理', icon: Users },
  { path: '/scenarios', label: '场景管理', icon: MapPin },
  { path: '/devices', label: '设备管理', icon: Monitor },
  { path: '/scores', label: '成绩管理', icon: Trophy },
  { path: '/hazards', label: '隐患管理', icon: AlertTriangle },
  { path: '/announcements', label: '公告管理', icon: Bell },
];

export default function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed } = useStore();

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-dark-900/95 backdrop-blur-md border-r border-dark-700/50 z-50 transition-all duration-300 ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="h-16 flex items-center justify-between px-4 border-b border-dark-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fire-500 to-fire-700 flex items-center justify-center shadow-lg shadow-fire-600/30">
              <Flame className="w-6 h-6 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-base font-bold text-white">VR消防演练</h1>
                <p className="text-xs text-dark-400">运营平台</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''} ${
                  sidebarCollapsed ? 'justify-center px-0' : ''
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-dark-700/50">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 py-2 text-dark-400 hover:text-white transition-colors rounded-lg hover:bg-dark-700/50"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">收起菜单</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
