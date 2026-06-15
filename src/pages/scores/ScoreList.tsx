import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Clock, XCircle, RotateCcw, TrendingUp, Search, Filter, BarChart3, Users, Award, Play, CheckCircle, AlertTriangle, Calendar, Building, Target, FileText, ArrowRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Score, RetrainRecord, DrillStats } from '@/types';
import { departments } from '@/data/personnel';
import Modal from '@/components/Modal';
import { formatDateTime } from '@/lib/utils';

export default function ScoreList() {
  const navigate = useNavigate();
  const {
    scores,
    personnel,
    drills,
    scenarios,
    retrainRecords,
    scheduleRetrain,
    scheduleRetrainForDrill,
    getCompletedDrills,
    getDrillStats,
    getDepartmentStats,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');
  const [searchText, setSearchText] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirmScore, setConfirmScore] = useState<Score | null>(null);
  const [confirmDrill, setConfirmDrill] = useState<{ drillId: string; drillName: string; failCount: number } | null>(null);

  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterScenario, setFilterScenario] = useState<string>('all');

  const departmentStats = getDepartmentStats();

  const months = useMemo(() => {
    const monthSet = new Set<string>();
    drills.forEach((d) => {
      if (d.status === 'completed') {
        const month = d.startTime.slice(0, 7);
        monthSet.add(month);
      }
    });
    return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  }, [drills]);

  const filteredDrills = useMemo(() => {
    const params: { month?: string; department?: string; scenarioId?: string } = {};
    if (filterMonth !== 'all') params.month = filterMonth;
    if (filterDepartment !== 'all') params.department = filterDepartment;
    if (filterScenario !== 'all') params.scenarioId = filterScenario;
    return getCompletedDrills(params);
  }, [filterMonth, filterDepartment, filterScenario, getCompletedDrills]);

  const drillStatsList = useMemo(() => {
    return filteredDrills
      .map((d) => getDrillStats(d.id))
      .filter(Boolean) as DrillStats[];
  }, [filteredDrills, getDrillStats]);

  const overallStats = useMemo(() => {
    if (drillStatsList.length === 0) {
      return {
        totalDrills: 0,
        totalParticipants: 0,
        passRate: 0,
        avgTime: 0,
      };
    }

    const totalDrills = drillStatsList.length;
    const totalParticipants = drillStatsList.reduce((acc, s) => acc + s.participantCount, 0);
    const totalPassed = drillStatsList.reduce((acc, s) => acc + s.passCount, 0);
    const totalScores = drillStatsList.reduce((acc, s) => acc + s.passCount + s.failCount, 0);
    const passRate = totalScores > 0 ? Math.round((totalPassed / totalScores) * 100) : 0;
    const avgTime =
      drillStatsList.length > 0
        ? Math.round(drillStatsList.reduce((acc, s) => acc + s.averageEscapeTime, 0) / drillStatsList.length)
        : 0;

    return { totalDrills, totalParticipants, passRate, avgTime };
  }, [drillStatsList]);

  const globalErrorTypes = useMemo(() => {
    const errorMap: Record<string, number> = {};
    drillStatsList.forEach((stats) => {
      Object.entries(stats.errorTypeCounts).forEach(([type, count]) => {
        errorMap[type] = (errorMap[type] || 0) + count;
      });
    });
    return Object.entries(errorMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [drillStatsList]);

  const maxErrorCount = globalErrorTypes.length > 0 ? Math.max(...globalErrorTypes.map((e) => e.value)) : 1;

  const filteredScores = scores.filter((score) => {
    const name = score.personnelName || '';
    return name.toLowerCase().includes(searchText.toLowerCase());
  });

  const sortedScores = [...filteredScores].sort((a, b) => b.totalScore - a.totalScore);

  const stats = {
    total: scores.length,
    passed: scores.filter((s) => s.passed).length,
    avgScore: Math.round(scores.reduce((acc, s) => acc + s.totalScore, 0) / scores.length),
    avgTime: Math.round(scores.reduce((acc, s) => acc + s.escapeTime, 0) / scores.length),
    retrainCount: retrainRecords.length,
    failedCount: scores.filter((s) => !s.passed).length,
  };

  const passRate = Math.round((stats.passed / stats.total) * 100);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleRetrainConfirm = () => {
    if (!confirmScore) return;
    const result = scheduleRetrain(confirmScore.id);
    if (result) {
      showToast(`已安排重训 - ${result.drill.name}`);
    } else {
      showToast('安排重训失败，请重试', 'error');
    }
    setConfirmScore(null);
  };

  const handleDrillRetrainConfirm = () => {
    if (!confirmDrill) return;
    const result = scheduleRetrainForDrill(confirmDrill.drillId);
    if (result) {
      showToast(`已为 ${result.retrainRecords.length} 人安排重训 - ${result.drill.name}`);
      setTimeout(() => navigate('/drills'), 800);
    } else {
      showToast('安排重训失败，没有未通过人员', 'error');
    }
    setConfirmDrill(null);
  };

  const originalDrillName = (retrain: RetrainRecord): string => {
    const drill = drills.find((d) => d.id === retrain.originalDrillId);
    const score = scores.find((s) => s.id === retrain.originalScoreId);
    return drill?.name || score?.drillName || '-';
  };

  const viewDrillArchive = (drillId: string) => {
    navigate('/drills');
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">成绩管理</h1>
          <p className="text-sm text-dark-400 mt-1">查看演练成绩和统计分析</p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-dark-800 rounded-lg border border-dark-700">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'list' ? 'bg-fire-600 text-white' : 'text-dark-300 hover:text-white'
            }`}
          >
            成绩列表
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'stats' ? 'bg-fire-600 text-white' : 'text-dark-300 hover:text-white'
            }`}
          >
            演练统计
          </button>
        </div>
      </div>

      {activeTab === 'list' && (
        <>
          <div className="grid grid-cols-5 gap-4">
            <StatCard label="总参训人次" value={stats.total} icon={Users} color="from-blue-500 to-blue-700" />
            <StatCard label="通过人数" value={stats.passed} icon={Award} color="from-green-500 to-emerald-700" />
            <StatCard label="通过率" value={passRate} icon={TrendingUp} color="from-fire-500 to-fire-700" suffix="%" />
            <StatCard label="平均用时" value={stats.avgTime} icon={Clock} color="from-purple-500 to-purple-700" suffix="秒" />
            <StatCard label="已安排重训" value={stats.retrainCount} icon={RotateCcw} color="from-yellow-500 to-orange-600" subtitle={`未通过 ${stats.failedCount} 人`} />
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="text"
                  placeholder="搜索人员..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-64 pl-9 pr-4 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-dark-100 placeholder-dark-400 focus:outline-none focus:border-fire-500/50 transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-dark-400" />
                <select className="px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-dark-100 focus:outline-none focus:border-fire-500/50 transition-all">
                  <option>全部演练</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {sortedScores.map((score, index) => (
                <ScoreRow
                  key={score.id}
                  score={score}
                  rank={index + 1}
                  retrainRecords={retrainRecords}
                  onRetrain={(s) => setConfirmScore(s)}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'stats' && (
        <>
          <div className="glass-card p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-dark-400" />
                <span className="text-sm text-dark-300">月份：</span>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="px-3 py-1.5 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-dark-100 focus:outline-none focus:border-fire-500/50 transition-all min-w-[120px]"
                >
                  <option value="all">全部月份</option>
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {m.replace('-', '年')}月
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-dark-400" />
                <span className="text-sm text-dark-300">部门：</span>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="px-3 py-1.5 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-dark-100 focus:outline-none focus:border-fire-500/50 transition-all min-w-[140px]"
                >
                  <option value="all">全部部门</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-dark-400" />
                <span className="text-sm text-dark-300">场景：</span>
                <select
                  value={filterScenario}
                  onChange={(e) => setFilterScenario(e.target.value)}
                  className="px-3 py-1.5 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-dark-100 focus:outline-none focus:border-fire-500/50 transition-all min-w-[160px]"
                >
                  <option value="all">全部场景</option>
                  {scenarios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <StatCard label="总演练数" value={overallStats.totalDrills} icon={BarChart3} color="from-blue-500 to-blue-700" />
            <StatCard label="总参训人次" value={overallStats.totalParticipants} icon={Users} color="from-green-500 to-emerald-700" />
            <StatCard label="整体通过率" value={overallStats.passRate} icon={TrendingUp} color="from-fire-500 to-fire-700" suffix="%" />
            <StatCard label="平均用时" value={overallStats.avgTime} icon={Clock} color="from-purple-500 to-purple-700" suffix="秒" />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-fire-500" />
              演练详情统计
            </h3>

            {drillStatsList.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-dark-600" />
                <p className="text-dark-400">暂无符合筛选条件的演练数据</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {drillStatsList.map((stats) => (
                  <DrillStatCard
                    key={stats.drillId}
                    stats={stats}
                    onViewArchive={() => viewDrillArchive(stats.drillId)}
                    onRetrain={() =>
                      setConfirmDrill({
                        drillId: stats.drillId,
                        drillName: stats.drillName,
                        failCount: stats.failCount,
                      })
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {globalErrorTypes.length > 0 && (
            <div className="glass-card p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-fire-500" />
                错误类型全局汇总
              </h3>
              <div className="space-y-3">
                {globalErrorTypes.map((error, index) => {
                  const percentage = (error.value / maxErrorCount) * 100;
                  const colors = [
                    'from-fire-500 to-fire-600',
                    'from-orange-500 to-orange-600',
                    'from-yellow-500 to-yellow-600',
                    'from-blue-500 to-blue-600',
                    'from-purple-500 to-purple-600',
                    'from-cyan-500 to-cyan-600',
                    'from-green-500 to-green-600',
                    'from-pink-500 to-pink-600',
                  ];
                  const colorClass = colors[index % colors.length];

                  return (
                    <div key={error.name} className="flex items-center gap-4">
                      <div className="w-28 flex-shrink-0">
                        <span className="text-sm text-dark-300 truncate block">{error.name}</span>
                      </div>
                      <div className="flex-1 h-6 bg-dark-700 rounded-full overflow-hidden relative">
                        <div
                          className={`h-full bg-gradient-to-r ${colorClass} rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-white">
                          {error.value} 次
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        open={!!confirmScore}
        onClose={() => setConfirmScore(null)}
        title="安排重训"
        subtitle={`确认安排 ${confirmScore?.personnelName} 重新参加演练？`}
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmScore(null)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-dark-300 hover:text-white hover:bg-dark-700/50 transition-all"
            >
              取消
            </button>
            <button
              onClick={handleRetrainConfirm}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-fire-600 hover:bg-fire-500 transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              确认安排
            </button>
          </div>
        }
      >
        {confirmScore && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-dark-700/30 border border-dark-600/50">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-dark-400">参训人员</span>
                  <p className="font-medium text-white mt-1">{confirmScore.personnelName}</p>
                </div>
                <div>
                  <span className="text-dark-400">原演练</span>
                  <p className="font-medium text-white mt-1">{confirmScore.drillName}</p>
                </div>
                <div>
                  <span className="text-dark-400">得分</span>
                  <p className={`font-medium mt-1 ${confirmScore.totalScore >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {confirmScore.totalScore} 分
                  </p>
                </div>
                <div>
                  <span className="text-dark-400">错误数</span>
                  <p className="font-medium text-white mt-1">{confirmScore.errors.length} 个</p>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-fire-500/10 border border-fire-500/20">
              <AlertTriangle className="w-4 h-4 text-fire-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-dark-300">
                确认后将自动生成一个新的重训演练批次（原演练名称 + "-重训"），时间默认明天 09:00，场景和参训人员自动填入。
              </p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!confirmDrill}
        onClose={() => setConfirmDrill(null)}
        title="批量安排重训"
        subtitle={`确认为「${confirmDrill?.drillName}」的未通过人员安排重训？`}
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmDrill(null)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-dark-300 hover:text-white hover:bg-dark-700/50 transition-all"
            >
              取消
            </button>
            <button
              onClick={handleDrillRetrainConfirm}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-fire-600 hover:bg-fire-500 transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              确认安排
            </button>
          </div>
        }
      >
        {confirmDrill && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-dark-700/30 border border-dark-600/50">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-dark-400">原演练</span>
                  <p className="font-medium text-white mt-1">{confirmDrill.drillName}</p>
                </div>
                <div>
                  <span className="text-dark-400">未通过人数</span>
                  <p className="font-medium text-red-400 mt-1">{confirmDrill.failCount} 人</p>
                </div>
                <div>
                  <span className="text-dark-400">新演练名称</span>
                  <p className="font-medium text-fire-400 mt-1">{confirmDrill.drillName}-重训</p>
                </div>
                <div>
                  <span className="text-dark-400">默认时间</span>
                  <p className="font-medium text-white mt-1">明天 09:00</p>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-fire-500/10 border border-fire-500/20">
              <AlertTriangle className="w-4 h-4 text-fire-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-dark-300">
                确认后将自动生成一个新的重训演练批次，并跳转至演练计划页面。
              </p>
            </div>
          </div>
        )}
      </Modal>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl border animate-fade-in-up flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-green-600/90 text-white shadow-green-900/30 border-green-500/40'
              : 'bg-red-600/90 text-white shadow-red-900/30 border-red-500/40'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  suffix,
  subtitle,
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
  suffix?: string;
  subtitle?: string;
}) {
  return (
    <div className="stat-card">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`}></div>
      <div className="relative">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <p className="text-2xl font-bold text-white">
          {value}
          {suffix && <span className="text-base font-normal text-dark-400 ml-1">{suffix}</span>}
        </p>
        <p className="text-sm text-dark-400 mt-1">{label}</p>
        {subtitle && <p className="text-xs text-dark-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function ScoreRow({
  score,
  rank,
  retrainRecords,
  onRetrain,
}: {
  score: Score;
  rank: number;
  retrainRecords: RetrainRecord[];
  onRetrain: (score: Score) => void;
}) {
  const [showErrors, setShowErrors] = useState(false);

  const scoreColor = score.totalScore >= 90 ? 'text-green-400' : score.totalScore >= 70 ? 'text-yellow-400' : 'text-red-400';
  const rankBg = rank === 1 ? 'bg-yellow-500 text-yellow-900' : rank === 2 ? 'bg-gray-300 text-gray-700' : rank === 3 ? 'bg-amber-600 text-amber-100' : 'bg-dark-600 text-dark-300';

  const hasBeenRetrained = retrainRecords.some((r) => r.originalScoreId === score.id);

  return (
    <div className="p-4 rounded-xl bg-dark-700/30 border border-dark-600/50 hover:border-dark-500/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${rankBg}`}>
          {rank}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h4 className="font-medium text-white">{score.personnelName}</h4>
            <span className="text-xs text-dark-400">{score.drillName}</span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-dark-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              用时 {score.escapeTime}秒
            </span>
            <span className="flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              {score.errors.length} 个错误
            </span>
            {score.retrainCount > 0 && (
              <span className="flex items-center gap-1 text-yellow-400">
                <RotateCcw className="w-3 h-3" />
                重训 {score.retrainCount} 次
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-32">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-dark-400">得分</span>
              <span className={`font-bold ${scoreColor}`}>{score.totalScore}分</span>
            </div>
            <div className="w-full h-2 bg-dark-600 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  score.totalScore >= 90 ? 'bg-green-500' : score.totalScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${score.totalScore}%` }}
              ></div>
            </div>
          </div>

          <span
            className={`badge border ${
              score.passed
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : 'bg-red-500/20 text-red-400 border-red-500/30'
            }`}
          >
            {score.passed ? '通过' : '未通过'}
          </span>

          {!score.passed && (
            <button
              onClick={() => !hasBeenRetrained && onRetrain(score)}
              disabled={hasBeenRetrained}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                hasBeenRetrained
                  ? 'bg-dark-600/50 text-dark-400 cursor-not-allowed'
                  : 'bg-fire-600 text-white hover:bg-fire-500 active:scale-95'
              }`}
              title={hasBeenRetrained ? '已安排重训' : '安排重训'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {hasBeenRetrained ? '已安排重训' : '安排重训'}
            </button>
          )}

          <button
            onClick={() => setShowErrors(!showErrors)}
            className="p-2 rounded-lg text-dark-300 hover:text-white hover:bg-dark-600 transition-all"
            title="查看错误回放"
          >
            <Play className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showErrors && (
        <div className="mt-4 pt-4 border-t border-dark-700/50">
          <h5 className="text-sm font-medium text-dark-200 mb-3">错误动作记录</h5>
          <div className="space-y-2">
            {score.errors.map((error) => (
              <div key={error.id} className="flex items-center gap-3 p-2 rounded-lg bg-dark-700/50">
                <span className="text-xs font-mono text-dark-400 w-16">
                  {Math.floor(error.timestamp / 60)}:{(error.timestamp % 60).toString().padStart(2, '0')}
                </span>
                <span className="text-sm text-fire-400 font-medium">{error.type}</span>
                <span className="text-sm text-dark-300">- {error.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DrillStatCard({
  stats,
  onViewArchive,
  onRetrain,
}: {
  stats: DrillStats;
  onViewArchive: () => void;
  onRetrain: () => void;
}) {
  const errorTypes = Object.entries(stats.errorTypeCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const maxErrorCount = errorTypes.length > 0 ? Math.max(...errorTypes.map((e) => e.count)) : 1;

  const passRateColor =
    stats.passRate >= 85 ? 'from-green-500 to-emerald-600' : stats.passRate >= 60 ? 'from-yellow-500 to-orange-600' : 'from-red-500 to-fire-600';

  const strokeDasharray = 2 * Math.PI * 45;
  const strokeDashoffset = strokeDasharray - (stats.passRate / 100) * strokeDasharray;

  const errorColors = [
    'bg-fire-500',
    'bg-orange-500',
    'bg-yellow-500',
  ];

  return (
    <div className="glass-card p-5 hover:border-dark-500/50 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-white text-base">{stats.drillName}</h4>
            <span className="px-2 py-0.5 rounded bg-dark-700 text-xs text-dark-300">{stats.scenarioName}</span>
          </div>
          <p className="text-xs text-dark-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {stats.startTime}
          </p>
        </div>

        <div className="relative w-20 h-20 flex-shrink-0">
          <svg className="w-20 h-20 transform -rotate-90">
            <circle cx="40" cy="40" r="36" stroke="#1E293B" strokeWidth="8" fill="none" />
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={stats.passRate >= 85 ? '#22C55E' : stats.passRate >= 60 ? '#EAB308' : '#EF4444'} />
                <stop offset="100%" stopColor={stats.passRate >= 85 ? '#059669' : stats.passRate >= 60 ? '#EA580C' : '#DC2626'} />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-white">{stats.passRate}%</span>
            <span className="text-[10px] text-dark-400">通过率</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-dark-700/30 text-center">
          <p className="text-lg font-bold text-white">{stats.passCount + stats.failCount}</p>
          <p className="text-[11px] text-dark-400">参训人数</p>
        </div>
        <div className="p-3 rounded-lg bg-dark-700/30 text-center">
          <p className="text-lg font-bold text-blue-400">{stats.averageEscapeTime}s</p>
          <p className="text-[11px] text-dark-400">平均用时</p>
        </div>
        <div className="p-3 rounded-lg bg-dark-700/30 text-center">
          <p className="text-lg font-bold text-red-400">{stats.totalErrors}</p>
          <p className="text-[11px] text-dark-400">错误总数</p>
        </div>
      </div>

      {errorTypes.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-dark-400 mb-2">错误类型 TOP3</p>
          <div className="space-y-2">
            {errorTypes.map((error, index) => {
              const percentage = (error.count / maxErrorCount) * 100;
              return (
                <div key={error.type} className="flex items-center gap-2">
                  <span className="text-xs text-dark-300 w-24 truncate">{error.type}</span>
                  <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${errorColors[index % errorColors.length]} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-dark-400 w-8 text-right">{error.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 pt-3 border-t border-dark-700/50">
        <button
          onClick={onViewArchive}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-dark-700/50 hover:bg-dark-700 text-dark-200 text-xs font-medium transition-all"
        >
          <FileText className="w-3.5 h-3.5" />
          查看详情
        </button>
        {stats.failCount > 0 && (
          <button
            onClick={onRetrain}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-fire-600 hover:bg-fire-500 text-white text-xs font-medium transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            安排重训
            <span className="px-1.5 py-0.5 rounded bg-fire-700/50 text-[10px]">{stats.failCount}人</span>
          </button>
        )}
      </div>
    </div>
  );
}
