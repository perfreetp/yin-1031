import { useState } from 'react';
import { Search, Monitor, MapPin, Clock, Activity, Wrench, Calendar, Plus, MoreVertical } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Device } from '@/types';

const statusConfig = {
  available: { label: '可用', color: 'bg-green-500', textColor: 'text-green-400', bgColor: 'bg-green-500/20 border-green-500/30' },
  'in-use': { label: '使用中', color: 'bg-blue-500', textColor: 'text-blue-400', bgColor: 'bg-blue-500/20 border-blue-500/30' },
  maintenance: { label: '维护中', color: 'bg-yellow-500', textColor: 'text-yellow-400', bgColor: 'bg-yellow-500/20 border-yellow-500/30' },
  offline: { label: '离线', color: 'bg-gray-500', textColor: 'text-gray-400', bgColor: 'bg-gray-500/20 border-gray-500/30' },
};

export default function DeviceList() {
  const { devices } = useStore();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredDevices = devices.filter((device) => {
    const matchSearch = device.name.toLowerCase().includes(searchText.toLowerCase()) || device.model.toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = statusFilter === 'all' || device.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: devices.length,
    available: devices.filter((d) => d.status === 'available').length,
    inUse: devices.filter((d) => d.status === 'in-use').length,
    maintenance: devices.filter((d) => d.status === 'maintenance').length,
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">设备管理</h1>
          <p className="text-sm text-dark-400 mt-1">管理 VR 头显设备和预约</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          添加设备
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="设备总数" value={stats.total} icon={Monitor} color="from-blue-500 to-blue-700" />
        <StatCard label="可用设备" value={stats.available} icon={Activity} color="from-green-500 to-emerald-700" />
        <StatCard label="使用中" value={stats.inUse} icon={Clock} color="from-fire-500 to-fire-700" />
        <StatCard label="维护中" value={stats.maintenance} icon={Wrench} color="from-yellow-500 to-orange-600" />
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="text"
                placeholder="搜索设备..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-64 pl-9 pr-4 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-dark-100 placeholder-dark-400 focus:outline-none focus:border-fire-500/50 transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-dark-100 focus:outline-none focus:border-fire-500/50 transition-all"
            >
              <option value="all">全部状态</option>
              <option value="available">可用</option>
              <option value="in-use">使用中</option>
              <option value="maintenance">维护中</option>
              <option value="offline">离线</option>
            </select>
          </div>
          <button className="btn-secondary flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4" />
            预约日历
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {filteredDevices.map((device) => (
            <DeviceCard key={device.id} device={device} />
          ))}
        </div>

        {filteredDevices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-dark-400">暂无设备数据</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="stat-card">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`}></div>
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold text-white">{value}</p>
          <p className="text-sm text-dark-400 mt-1">{label}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function DeviceCard({ device }: { device: Device }) {
  const status = statusConfig[device.status];

  return (
    <div className="glass-card-hover p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${status.bgColor} border flex items-center justify-center`}>
            <Monitor className={`w-6 h-6 ${status.textColor}`} />
          </div>
          <div>
            <h3 className="font-semibold text-white">{device.name}</h3>
            <p className="text-sm text-dark-400">{device.model}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-xs ${status.textColor}`}>
            <span className={`w-2 h-2 rounded-full ${status.color} ${device.status === 'in-use' ? 'animate-pulse' : ''}`}></span>
            {status.label}
          </span>
          <button className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/50 transition-all">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-dark-400" />
          <span className="text-dark-300">{device.location}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Activity className="w-4 h-4 text-dark-400" />
          <span className="text-dark-300">使用 {device.usageCount} 次</span>
        </div>
      </div>

      {device.lastUsed && (
        <div className="mt-3 pt-3 border-t border-dark-700/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-dark-400">上次使用</span>
            <span className="text-dark-300">{device.lastUsed}</span>
          </div>
        </div>
      )}

      {device.currentUser && (
        <div className="mt-3 pt-3 border-t border-dark-700/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-dark-400">当前使用</span>
            <span className="text-blue-400 font-medium">{device.currentUser}</span>
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        {device.status === 'available' && (
          <button className="flex-1 btn-primary text-sm py-1.5">立即预约</button>
        )}
        {device.status === 'in-use' && (
          <button className="flex-1 btn-secondary text-sm py-1.5 text-blue-400 border-blue-500/30">查看详情</button>
        )}
        {device.status === 'maintenance' && (
          <button className="flex-1 btn-secondary text-sm py-1.5">维护记录</button>
        )}
        {device.status === 'offline' && (
          <button className="flex-1 btn-secondary text-sm py-1.5">重新连接</button>
        )}
      </div>
    </div>
  );
}
