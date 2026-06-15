import { useState } from 'react';
import { Plus, Search, Filter, MoreVertical, Users, Clock, CheckCircle, XCircle, Play, FileArchive, Calendar } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Drill } from '@/types';

const statusConfig = {
  pending: { label: '待开始', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  ongoing: { label: '进行中', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  completed: { label: '已完成', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  cancelled: { label: '已取消', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export default function DrillList() {
  const { drills, setShowDrillCreate } = useStore();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredDrills = drills.filter((drill) => {
    const matchSearch = drill.name.toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = statusFilter === 'all' || drill.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: drills.length,
    pending: drills.filter((d) => d.status === 'pending').length,
    ongoing: drills.filter((d) => d.status === 'ongoing').length,
    completed: drills.filter((d) => d.status === 'completed').length,
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">演练计划</h1>
          <p className="text-sm text-dark-400 mt-1">管理 VR 消防演练批次和签到</p>
        </div>
        <button onClick={() => setShowDrillCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          创建演练
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="总演练数" value={stats.total} icon={Calendar} color="from-blue-500 to-blue-700" />
        <StatCard label="待开始" value={stats.pending} icon={Clock} color="from-yellow-500 to-orange-600" />
        <StatCard label="进行中" value={stats.ongoing} icon={Play} color="from-green-500 to-emerald-700" />
        <StatCard label="已完成" value={stats.completed} icon={FileArchive} color="from-purple-500 to-purple-700" />
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="text"
                placeholder="搜索演练..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-64 pl-9 pr-4 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-dark-100 placeholder-dark-400 focus:outline-none focus:border-fire-500/50 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-dark-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-dark-100 focus:outline-none focus:border-fire-500/50 transition-all"
              >
                <option value="all">全部状态</option>
                <option value="pending">待开始</option>
                <option value="ongoing">进行中</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">演练名称</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">场景</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">开始时间</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">参训人数</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">签到进度</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">状态</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrills.map((drill) => (
                <DrillRow key={drill.id} drill={drill} />
              ))}
            </tbody>
          </table>
        </div>

        {filteredDrills.length === 0 && (
          <div className="text-center py-12">
            <p className="text-dark-400">暂无演练数据</p>
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
      <div className="relative">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-dark-400 mt-1">{label}</p>
      </div>
    </div>
  );
}

function DrillRow({ drill }: { drill: Drill }) {
  const status = statusConfig[drill.status];
  const checkInProgress = drill.checkedInCount / drill.participantCount;

  return (
    <tr className="border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors">
      <td className="py-4 px-4">
        <div>
          <p className="font-medium text-white">{drill.name}</p>
          <p className="text-xs text-dark-400 mt-0.5">ID: {drill.id}</p>
        </div>
      </td>
      <td className="py-4 px-4">
        <span className="text-sm text-dark-200">{drill.scenarioName}</span>
      </td>
      <td className="py-4 px-4">
        <span className="text-sm text-dark-200">{drill.startTime}</span>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-dark-400" />
          <span className="text-sm text-dark-200">{drill.participantCount} 人</span>
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-24 h-2 bg-dark-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-fire-500 to-fire-600 rounded-full transition-all"
              style={{ width: `${checkInProgress * 100}%` }}
            ></div>
          </div>
          <span className="text-sm text-dark-300">
            {drill.checkedInCount}/{drill.participantCount}
          </span>
        </div>
      </td>
      <td className="py-4 px-4">
        <span className={`badge border ${status.color}`}>{status.label}</span>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          {drill.status === 'pending' && (
            <button className="p-1.5 rounded-lg text-dark-300 hover:text-white hover:bg-dark-600 transition-all">
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {drill.status === 'ongoing' && (
            <button className="p-1.5 rounded-lg text-green-400 hover:text-green-300 hover:bg-green-500/10 transition-all">
              <Play className="w-4 h-4" />
            </button>
          )}
          {drill.status === 'completed' && (
            <button className="p-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-all">
              <FileArchive className="w-4 h-4" />
            </button>
          )}
          <button className="p-1.5 rounded-lg text-dark-300 hover:text-white hover:bg-dark-600 transition-all">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
