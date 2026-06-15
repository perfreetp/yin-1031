import { Search, Bell, Settings, User } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';

export default function Header() {
  const [searchValue, setSearchValue] = useState('');
  const navigate = useNavigate();
  const { announcements } = useStore();

  const unreadCount = useMemo(() => {
    return announcements.filter((a) => !a.isRead).length;
  }, [announcements]);

  return (
    <header className="h-16 bg-dark-800/60 backdrop-blur-md border-b border-dark-700/50 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            placeholder="搜索演练、人员、设备..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-80 pl-10 pr-4 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-dark-100 placeholder-dark-400 focus:outline-none focus:border-fire-500 focus:ring-1 focus:ring-fire-500/30 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/announcements')}
          className="relative p-2 rounded-lg text-dark-300 hover:text-white hover:bg-dark-700/50 transition-all cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-fire-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-fire-500/30">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
        <button className="p-2 rounded-lg text-dark-300 hover:text-white hover:bg-dark-700/50 transition-all">
          <Settings className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-dark-700 mx-2"></div>
        <div className="flex items-center gap-3 pl-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-fire-500 to-fire-700 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-white">管理员</p>
            <p className="text-xs text-dark-400">安全管理部</p>
          </div>
        </div>
      </div>
    </header>
  );
}
