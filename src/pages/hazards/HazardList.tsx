import { useState } from 'react';
import { AlertTriangle, Clock, User, Calendar, Plus, Search, Filter, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Hazard } from '@/types';

const levelConfig = {
  low: { label: '低', color: 'bg-green-500/20 text-green-400 border-green-500/30', borderColor: 'border-green-500/30' },
  medium: { label: '中', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', borderColor: 'border-yellow-500/30' },
  high: { label: '高', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', borderColor: 'border-orange-500/30' },
  critical: { label: '严重', color: 'bg-red-500/20 text-red-400 border-red-500/30', borderColor: 'border-red-500/30' },
};

const statusConfig = {
  pending: { label: '待处理', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  processing: { label: '整改中', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  resolved: { label: '已整改', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  verified: { label: '已验证', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
};

export default function HazardList() {
  const { hazards, setShowHazardCreate } = useStore();
  const [searchText, setSearchText] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredHazards = hazards.filter((hazard) => {
    const matchSearch = hazard.title.toLowerCase().includes(searchText.toLowerCase()) || hazard.description.toLowerCase().includes(searchText.toLowerCase());
    const matchLevel = levelFilter === 'all' || hazard.level === levelFilter;
    const matchStatus = statusFilter === 'all' || hazard.status === statusFilter;
    return matchSearch && matchLevel && matchStatus;
  });

  const stats = {
    total: hazards.length,
    pending: hazards.filter((h) => h.status === 'pending').length,
    processing: hazards.filter((h) => h.status === 'processing').length,
    critical: hazards.filter((h) => h.level === 'critical').length,
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">隐患管理</h1>
          <p className="text-sm text-dark-400 mt-1">管理安全隐患和整改跟踪</p>
        </div>
        <button onClick={() => setShowHazardCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          上报隐患
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="隐患总数" value={stats.total} icon={AlertTriangle} color="from-fire-500 to-fire-700" />
        <StatCard label="待处理" value={stats.pending} icon={Clock} color="from-yellow-500 to-orange-600" />
        <StatCard label="整改中" value={stats.processing} icon={AlertCircle} color="from-blue-500 to-blue-700" />
        <StatCard label="严重隐患" value={stats.critical} icon={AlertTriangle} color="from-red-500 to-red-700" />
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="text"
                placeholder="搜索隐患..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-64 pl-9 pr-4 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-dark-100 placeholder-dark-400 focus:outline-none focus:border-fire-500/50 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-dark-400" />
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-dark-100 focus:outline-none focus:border-fire-500/50 transition-all"
              >
                <option value="all">全部等级</option>
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
                <option value="critical">严重</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-dark-100 focus:outline-none focus:border-fire-500/50 transition-all"
              >
                <option value="all">全部状态</option>
                <option value="pending">待处理</option>
                <option value="processing">整改中</option>
                <option value="resolved">已整改</option>
                <option value="verified">已验证</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {filteredHazards.map((hazard) => (
            <HazardCard key={hazard.id} hazard={hazard} />
          ))}
        </div>

        {filteredHazards.length === 0 && (
          <div className="text-center py-12">
            <p className="text-dark-400">暂无隐患数据</p>
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

function HazardCard({ hazard }: { hazard: Hazard }) {
  const level = levelConfig[hazard.level];
  const status = statusConfig[hazard.status];

  return (
    <div className="glass-card-hover overflow-hidden">
      <div className="relative h-36 overflow-hidden">
        <img
          src={hazard.photoUrl}
          alt={hazard.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <div className="absolute top-2 left-2 flex gap-2">
          <span className={`badge border ${level.color}`}>
            {level.label}危
          </span>
        </div>
        <div className="absolute top-2 right-2">
          <span className={`badge ${status.bgColor} ${status.color} border border-current/30`}>
            {status.label}
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent pointer-events-none"></div>
      </div>
      <div className="p-3">
      <h3 className="font-medium text-white line-clamp-1">{hazard.title}</h3>
      <p className="text-xs text-dark-400 mt-1 line-clamp-2 h-8">{hazard.description}</p>
      
      <div className="mt-3 pt-3 border-t border-dark-700/50 space-y-2">
        {hazard.responsibleName && (
          <div className="flex items-center gap-2 text-xs">
          <User className="w-3.5 h-3.5 text-dark-400" />
          <span className="text-dark-300">责任人：{hazard.responsibleName}</span>
        </div>
      )}
        {hazard.deadline && (
          <div className="flex items-center gap-2 text-xs">
          <Calendar className="w-3.5 h-3.5 text-dark-400" />
          <span className="text-dark-300">截止：{hazard.deadline}</span>
        </div>
      )}
        <div className="flex items-center gap-2 text-xs">
          <Clock className="w-3.5 h-3.5 text-dark-400" />
          <span className="text-dark-400">上报：{hazard.createdAt.split(' ')[0]}</span>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        {hazard.status === 'pending' && (
          <button className="flex-1 btn-primary text-sm py-1.5">分配整改</button>
        )}
        {hazard.status === 'processing' && (
          <button className="flex-1 btn-secondary text-sm py-1.5">查看进度</button>
        )}
        {hazard.status === 'resolved' && (
          <button className="flex-1 btn-secondary text-sm py-1.5 text-green-400 border-green-500/30">验证闭环</button>
        )}
        {hazard.status === 'verified' && (
          <button className="flex-1 btn-secondary text-sm py-1.5 text-purple-400 border-purple-500/30">查看详情</button>
        )}
      </div>
      </div>
    </div>
  );
}
