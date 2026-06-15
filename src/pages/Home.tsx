import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Monitor,
  AlertTriangle,
  Bell,
  Flame,
  ChevronRight,
  TrendingUp,
  Clock,
  Shield,
  Megaphone,
  FileText,
  Info,
  MapPin,
  User,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useStore } from '@/store/useStore';
import { formatDate } from '@/lib/utils';

const drillStatusConfig = {
  pending: { label: '待开始', color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  ongoing: { label: '进行中', color: 'bg-green-500/20 text-green-400 border border-green-500/30' },
  completed: { label: '已完成', color: 'bg-gray-500/20 text-gray-400 border border-gray-500/30' },
  cancelled: { label: '已取消', color: 'bg-red-500/20 text-red-400 border border-red-500/30' },
};

const deviceStatusConfig = {
  available: { label: '可用', dotColor: 'bg-green-500', textColor: 'text-green-400' },
  'in-use': { label: '使用中', dotColor: 'bg-yellow-500', textColor: 'text-yellow-400' },
  maintenance: { label: '维护中', dotColor: 'bg-red-500', textColor: 'text-red-400' },
  offline: { label: '离线', dotColor: 'bg-gray-500', textColor: 'text-gray-400' },
};

const hazardLevelConfig = {
  low: { label: '低', color: 'bg-green-500/20 text-green-400 border border-green-500/30' },
  medium: { label: '中', color: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' },
  high: { label: '高', color: 'bg-orange-500/20 text-orange-400 border border-orange-500/30' },
  critical: { label: '严重', color: 'bg-red-500/20 text-red-400 border border-red-500/30' },
};

const hazardStatusConfig = {
  pending: { label: '待处理', color: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' },
  processing: { label: '整改中', color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  resolved: { label: '已整改', color: 'bg-green-500/20 text-green-400 border border-green-500/30' },
  verified: { label: '已验证', color: 'bg-purple-500/20 text-purple-400 border border-purple-500/30' },
};

const announcementTypeConfig = {
  training: { label: '培训通知', color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30', icon: FileText },
  notice: { label: '通知公告', color: 'bg-green-500/20 text-green-400 border border-green-500/30', icon: Bell },
  warning: { label: '安全警示', color: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30', icon: AlertTriangle },
  info: { label: '知识科普', color: 'bg-purple-500/20 text-purple-400 border border-purple-500/30', icon: Info },
};

const levelPriority = { critical: 0, high: 1, medium: 2, low: 3 };

const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

export default function Home() {
  const navigate = useNavigate();
  const {
    drills,
    devices,
    hazards,
    announcements,
    scores,
    getDepartmentStats,
  } = useStore();

  const todayStr = formatDate();
  const todayDisplay = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}年${pad(now.getMonth() + 1)}月${pad(now.getDate())}日 ${weekDays[now.getDay()]}`;
  }, []);

  const stats = useMemo(() => {
    const todayDrills = drills.filter((d) => d.startTime.slice(0, 10) === todayStr);

    const inUseDevices = devices.filter((d) => d.status === 'in-use').length;
    const deviceUsageRate = devices.length > 0 ? Math.round((inUseDevices / devices.length) * 100) : 0;

    const pendingHazards = hazards.filter((h) => h.status === 'pending' || h.status === 'processing');
    const criticalHazards = pendingHazards.filter((h) => h.level === 'critical').length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = formatDate(sevenDaysAgo);
    const unreadAnnouncements = announcements.filter(
      (a) => a.publishDate.slice(0, 10) >= sevenDaysAgoStr
    ).length;

    const passedScores = scores.filter((s) => s.passed).length;
    const passRate = scores.length > 0 ? Math.round((passedScores / scores.length) * 100) : 0;

    const validEscapeTimes = scores.filter((s) => s.escapeTime > 0).map((s) => s.escapeTime);
    const avgEscapeTime =
      validEscapeTimes.length > 0
        ? Math.round(validEscapeTimes.reduce((a, b) => a + b, 0) / validEscapeTimes.length)
        : 0;

    return {
      todayDrills: todayDrills.length,
      deviceUsageRate,
      pendingHazards: pendingHazards.length,
      criticalHazards,
      unreadAnnouncements,
      passRate,
      avgEscapeTime,
    };
  }, [drills, devices, hazards, announcements, scores, todayStr]);

  const todayDrillList = useMemo(() => {
    return drills
      .filter((d) => d.startTime.slice(0, 10) === todayStr)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [drills, todayStr]);

  const pendingHazardList = useMemo(() => {
    return hazards
      .filter((h) => h.status === 'pending' || h.status === 'processing')
      .sort((a, b) => levelPriority[a.level] - levelPriority[b.level])
      .slice(0, 5);
  }, [hazards]);

  const latestAnnouncements = useMemo(() => {
    return [...announcements]
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
      })
      .slice(0, 4);
  }, [announcements]);

  const departmentStats = useMemo(() => getDepartmentStats(), [getDepartmentStats]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <section className="glass-card p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fire-500 to-fire-700 flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">运营总览</h1>
            </div>
            <div className="flex items-center gap-2 text-dark-300 mb-2">
              <Calendar className="w-4 h-4 text-fire-400" />
              <span className="text-sm">{todayDisplay}</span>
            </div>
            <p className="text-dark-400 text-sm">
              欢迎来到 VR 消防演练运营管理平台，实时掌握园区安全演练动态，守护每一位员工的生命安全。
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-dark-400">您好，</p>
              <p className="text-lg font-semibold text-white">园区安全管理员</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-fire-500 to-fire-700 flex items-center justify-center border-2 border-fire-400/30 shadow-lg shadow-fire-600/20">
              <Shield className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          label="今日演练"
          value={stats.todayDrills}
          icon={Flame}
          gradient="from-fire-500 to-fire-700"
          suffix="场"
        />
        <StatCard
          label="设备占用率"
          value={stats.deviceUsageRate}
          icon={Monitor}
          gradient="from-blue-500 to-blue-700"
          suffix="%"
        />
        <StatCard
          label="待整改隐患"
          value={stats.pendingHazards}
          icon={AlertTriangle}
          gradient="from-yellow-500 to-orange-600"
          suffix={stats.criticalHazards > 0 ? `（严重 ${stats.criticalHazards}）` : '项'}
          highlight={stats.criticalHazards > 0}
        />
        <StatCard
          label="近7天公告"
          value={stats.unreadAnnouncements}
          icon={Bell}
          gradient="from-purple-500 to-purple-700"
          suffix="条"
        />
        <StatCard
          label="累计通过率"
          value={stats.passRate}
          icon={TrendingUp}
          gradient="from-green-500 to-emerald-700"
          suffix="%"
        />
        <StatCard
          label="平均疏散用时"
          value={stats.avgEscapeTime}
          icon={Clock}
          gradient="from-indigo-500 to-blue-800"
          suffix="秒"
        />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-fire-400" />
              <h2 className="text-lg font-semibold text-white">今日演练安排</h2>
            </div>
            <button
              onClick={() => navigate('/drills')}
              className="flex items-center gap-1 text-sm text-fire-400 hover:text-fire-300 transition-colors"
            >
              查看全部
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {todayDrillList.length > 0 ? (
            <div className="space-y-3">
              {todayDrillList.map((drill) => {
                const status = drillStatusConfig[drill.status];
                const checkInProgress =
                  drill.participantCount > 0
                    ? Math.round((drill.checkedInCount / drill.participantCount) * 100)
                    : 0;
                return (
                  <div
                    key={drill.id}
                    onClick={() => navigate('/drills')}
                    className="p-4 rounded-xl bg-dark-800/50 border border-dark-700/50 hover:bg-dark-700/50 hover:border-fire-500/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">{drill.name}</h3>
                        <p className="text-sm text-dark-400 mt-0.5">
                          场景：{drill.scenarioName || '未指定'}
                        </p>
                      </div>
                      <span className={`badge border ${status.color} flex-shrink-0`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-dark-400" />
                        <span className="text-sm text-dark-300">
                          {drill.startTime.slice(11, 16)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-dark-400" />
                        <span className="text-sm text-dark-300">
                          {drill.participantCount} 人
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-fire-500 to-fire-600 rounded-full transition-all"
                          style={{ width: `${checkInProgress}%` }}
                        />
                      </div>
                      <span className="text-xs text-dark-400 whitespace-nowrap">
                        签到 {drill.checkedInCount}/{drill.participantCount}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400">今日暂无演练安排</p>
              <p className="text-xs text-dark-500 mt-1">
                前往演练计划页面创建新的演练批次
              </p>
            </div>
          )}
        </section>

        <section className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">VR 头显设备</h2>
            </div>
            <button
              onClick={() => navigate('/devices')}
              className="flex items-center gap-1 text-sm text-fire-400 hover:text-fire-300 transition-colors"
            >
              设备管理
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {devices.map((device) => {
              const status = deviceStatusConfig[device.status];
              return (
                <div
                  key={device.id}
                  className="flex-shrink-0 w-52 p-4 rounded-xl bg-dark-800/50 border border-dark-700/50 hover:border-blue-500/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-700/20 border border-blue-500/30 flex items-center justify-center">
                      <Monitor className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${status.dotColor} ${
                          device.status === 'in-use' ? 'animate-pulse' : ''
                        }`}
                      />
                    </div>
                  </div>
                  <h3 className="font-medium text-white truncate mb-1">{device.name}</h3>
                  <p className="text-xs text-dark-400 mb-3">{device.model}</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-dark-500" />
                      <span className="text-xs text-dark-300 truncate">
                        {device.location}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${status.textColor}`}>{status.label}</span>
                    </div>
                    {device.currentUser && (
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-dark-500" />
                        <span className="text-xs text-blue-400 truncate">
                          {device.currentUser}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <h2 className="text-lg font-semibold text-white">隐患整改跟踪</h2>
            </div>
            <button
              onClick={() => navigate('/hazards')}
              className="flex items-center gap-1 text-sm text-fire-400 hover:text-fire-300 transition-colors"
            >
              隐患管理
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {pendingHazardList.length > 0 ? (
            <div className="space-y-2">
              {pendingHazardList.map((hazard) => {
                const level = hazardLevelConfig[hazard.level];
                const status = hazardStatusConfig[hazard.status];
                return (
                  <div
                    key={hazard.id}
                    onClick={() => navigate('/hazards')}
                    className="p-4 rounded-xl bg-dark-800/50 border border-dark-700/50 hover:bg-dark-700/50 hover:border-fire-500/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <span className={`badge border ${level.color} flex-shrink-0 mt-0.5`}>
                        {level.label}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white line-clamp-1">{hazard.title}</h3>
                        <div className="flex items-center justify-between mt-2 gap-3">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-3.5 h-3.5 text-dark-500" />
                            <span className="text-dark-300">
                              {hazard.responsibleName || '待派单'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-3.5 h-3.5 text-dark-500" />
                            <span className="text-dark-300">
                              {hazard.deadline ? hazard.deadline.slice(0, 10) : '—'}
                            </span>
                          </div>
                          <span className={`badge border ${status.color} flex-shrink-0`}>
                            {status.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400">暂无待处理隐患</p>
              <p className="text-xs text-dark-500 mt-1">安全状况良好</p>
            </div>
          )}
        </section>

        <section className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">最新公告</h2>
            </div>
            <button
              onClick={() => navigate('/announcements')}
              className="flex items-center gap-1 text-sm text-fire-400 hover:text-fire-300 transition-colors"
            >
              公告管理
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {latestAnnouncements.length > 0 ? (
            <div className="space-y-2">
              {latestAnnouncements.map((ann) => {
                const typeCfg = announcementTypeConfig[ann.type];
                const TypeIcon = typeCfg.icon;
                return (
                  <div
                    key={ann.id}
                    onClick={() => navigate('/announcements')}
                    className="p-4 rounded-xl bg-dark-800/50 border border-dark-700/50 hover:bg-dark-700/50 hover:border-purple-500/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-dark-700/50 flex items-center justify-center flex-shrink-0">
                        <TypeIcon className="w-4.5 h-4.5 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`badge border ${typeCfg.color}`}>
                            {typeCfg.label}
                          </span>
                          {ann.isPinned && (
                            <span className="badge border bg-fire-500/20 text-fire-400 border border-fire-500/30">
                              置顶
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-white line-clamp-1">{ann.title}</h3>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-dark-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{ann.publishDate.slice(0, 16)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400">暂无公告</p>
            </div>
          )}
        </section>
      </div>

      <section className="glass-card p-5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-fire-400" />
            <h2 className="text-lg font-semibold text-white">部门通过率统计</h2>
          </div>
          <button
            onClick={() => navigate('/scores')}
            className="flex items-center gap-1 text-sm text-fire-400 hover:text-fire-300 transition-colors"
          >
            成绩管理
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="h-80">
          {departmentStats.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF3D2E" />
                    <stop offset="100%" stopColor="#C62828" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#E4E7ED',
                  }}
                  formatter={(value: number) => [`${value}%`, '通过率']}
                  labelStyle={{ color: '#E4E7ED', fontWeight: 600 }}
                  cursor={{ fill: 'rgba(255, 61, 46, 0.08)' }}
                />
                <Bar dataKey="passRate" radius={[6, 6, 0, 0]} maxBarSize={50}>
                  {departmentStats.map((_, index) => (
                    <Cell key={index} fill="url(#barGradient)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                <p className="text-dark-400">暂无统计数据</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  suffix?: string;
  highlight?: boolean;
}

function StatCard({ label, value, icon: Icon, gradient, suffix, highlight }: StatCardProps) {
  return (
    <div className="stat-card">
      <div
        className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`}
      />
      <div className="relative">
        <div
          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-lg`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex items-baseline gap-1">
          <p className="text-2xl md:text-3xl font-bold text-white">{value}</p>
          <span
            className={`text-sm ${
              highlight ? 'text-red-400 font-medium' : 'text-dark-400'
            }`}
          >
            {suffix}
          </span>
        </div>
        <p className="text-sm text-dark-400 mt-1">{label}</p>
      </div>
    </div>
  );
}
