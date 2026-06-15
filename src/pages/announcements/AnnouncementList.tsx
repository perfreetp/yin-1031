import { useState } from 'react';
import { Bell, Plus, Pin, Calendar, User, ChevronRight, Search, Filter, AlertTriangle, Info, FileText, Megaphone } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Announcement } from '@/types';

const typeConfig = {
  training: { label: '培训通知', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: FileText },
  notice: { label: '通知公告', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: Bell },
  warning: { label: '安全警示', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: AlertTriangle },
  info: { label: '知识科普', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Info },
};

export default function AnnouncementList() {
  const { announcements, setShowAnnouncementCreate } = useStore();
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  const filteredAnnouncements = announcements.filter((a) => {
    const matchSearch = a.title.toLowerCase().includes(searchText.toLowerCase());
    const matchType = typeFilter === 'all' || a.type === typeFilter;
    return matchSearch && matchType;
  });

  const pinnedAnnouncements = filteredAnnouncements.filter((a) => a.isPinned);
  const normalAnnouncements = filteredAnnouncements.filter((a) => !a.isPinned);

  const stats = {
    total: announcements.length,
    pinned: announcements.filter((a) => a.isPinned).length,
    training: announcements.filter((a) => a.type === 'training').length,
    warning: announcements.filter((a) => a.type === 'warning').length,
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">公告管理</h1>
          <p className="text-sm text-dark-400 mt-1">发布和管理培训公告</p>
        </div>
        <button onClick={() => setShowAnnouncementCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          发布公告
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="公告总数" value={stats.total} icon={Bell} color="from-fire-500 to-fire-700" />
        <StatCard label="置顶公告" value={stats.pinned} icon={Pin} color="from-yellow-500 to-orange-600" />
        <StatCard label="培训通知" value={stats.training} icon={FileText} color="from-blue-500 to-blue-700" />
        <StatCard label="安全警示" value={stats.warning} icon={AlertTriangle} color="from-red-500 to-red-700" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 glass-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">公告列表</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="text"
                  placeholder="搜索公告..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-48 pl-9 pr-4 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-dark-100 placeholder-dark-400 focus:outline-none focus:border-fire-500/50 transition-all"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-dark-100 focus:outline-none focus:border-fire-500/50 transition-all"
              >
                <option value="all">全部类型</option>
                <option value="training">培训通知</option>
                <option value="notice">通知公告</option>
                <option value="warning">安全警示</option>
                <option value="info">知识科普</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {pinnedAnnouncements.length > 0 && (
              <div className="space-y-3">
                {pinnedAnnouncements.map((announcement) => (
                  <AnnouncementItem
                    key={announcement.id}
                    announcement={announcement}
                    isPinned={true}
                    selected={selectedAnnouncement?.id === announcement.id}
                    onClick={() => setSelectedAnnouncement(announcement)}
                  />
                ))}
              </div>
            )}
            {normalAnnouncements.length > 0 && (
              <div className="space-y-3">
                {normalAnnouncements.map((announcement) => (
                <AnnouncementItem
                  key={announcement.id}
                  announcement={announcement}
                  isPinned={false}
                  selected={selectedAnnouncement?.id === announcement.id}
                  onClick={() => setSelectedAnnouncement(announcement)}
                />
              ))}
              </div>
            )}
          </div>

          {filteredAnnouncements.length === 0 && (
            <div className="text-center py-12">
              <p className="text-dark-400">暂无公告数据</p>
            </div>
          )}
        </div>

        <div className="glass-card p-4">
          {selectedAnnouncement ? (
            <AnnouncementDetail announcement={selectedAnnouncement} />
          ) : (
            <div className="h-full min-h-96 flex flex-col items-center justify-center text-center">
              <Megaphone className="w-16 h-16 text-dark-600 mb-4" />
              <p className="text-dark-400">点击左侧公告查看详情</p>
            </div>
          )}
        </div>
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

function AnnouncementItem({
  announcement,
  isPinned,
  selected,
  onClick,
}: {
  announcement: Announcement;
  isPinned: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  const type = typeConfig[announcement.type];
  const TypeIcon = type.icon;

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border transition-all cursor-pointer ${
        selected
          ? 'bg-fire-600/10 border-fire-500/30'
          : 'bg-dark-700/30 border-dark-600/50 hover:bg-dark-700/50 hover:border-dark-500/50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg ${type.color} border flex items-center justify-center flex-shrink-0`}>
          <TypeIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isPinned && <Pin className="w-3.5 h-3.5 text-fire-400 fill-fire-400" />}
            <h3 className="font-medium text-white truncate">{announcement.title}</h3>
          </div>
          <p className="text-sm text-dark-400 mt-1 line-clamp-2">{announcement.content}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-dark-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {announcement.publishDate.split(' ')[0]}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {announcement.author}
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-dark-500 flex-shrink-0" />
      </div>
    </div>
  );
}

function AnnouncementDetail({ announcement }: { announcement: Announcement }) {
  const type = typeConfig[announcement.type];
  const TypeIcon = type.icon;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-xl ${type.color} border flex items-center justify-center`}>
          <TypeIcon className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            {announcement.isPinned && <Pin className="w-4 h-4 text-fire-400 fill-fire-400" />}
            <h2 className="text-lg font-semibold text-white">{announcement.title}</h2>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-dark-400">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {announcement.author}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {announcement.publishDate}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="prose prose-invert max-w-none">
          <p className="text-dark-200 leading-relaxed whitespace-pre-wrap">{announcement.content}</p>
        </div>
      </div>

      {announcement.expireDate && (
        <div className="mt-4 pt-4 border-t border-dark-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-dark-400">有效期至</span>
            <span className="text-dark-200">{announcement.expireDate}</span>
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button className="flex-1 btn-secondary text-sm">编辑公告</button>
        <button className="flex-1 btn-secondary text-sm text-red-400 border-red-500/30">删除</button>
      </div>
    </div>
  );
}
