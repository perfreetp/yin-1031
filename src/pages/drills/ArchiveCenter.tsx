import { useState, useMemo } from 'react';
import {
  FileArchive,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  Eye,
  Download,
  Archive,
  FolderOpen,
  BarChart3,
  Trophy,
  XCircle,
  Monitor,
  Search,
  Filter,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { DEFAULT_ERROR_TYPES, type Drill, type DrillStats, type Score } from '@/types';
import Modal from '@/components/Modal';
import { formatDateTime } from '@/lib/utils';

export default function ArchiveCenter() {
  const {
    drills,
    personnel,
    scenarios,
    scores,
    getCompletedDrills,
    getDrillStats,
    generateDrillArchiveSummary,
    archiveDrill,
    unarchiveDrill,
  } = useStore();

  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [showDetailModal, setShowDetailModal] = useState<Drill | null>(null);
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null);
  const [unarchiveConfirmId, setUnarchiveConfirmId] = useState<string | null>(null);
  const [toast, setToast] = useState<string>('');

  const months = useMemo(() => {
    const result: string[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      result.push(month);
    }
    return result;
  }, []);

  const departments = useMemo(() => {
    return Array.from(new Set(personnel.map((p) => p.department)));
  }, [personnel]);

  const filteredDrills = useMemo(() => {
    const params: { month?: string; department?: string; scenarioId?: string } = {};
    if (selectedMonth) params.month = selectedMonth;
    if (selectedDepartment) params.department = selectedDepartment;
    if (selectedScenario) params.scenarioId = selectedScenario;

    let completed = getCompletedDrills(params);

    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      completed = completed.filter(
        (d) =>
          d.name.toLowerCase().includes(searchLower) ||
          (d.scenarioName || '').toLowerCase().includes(searchLower)
      );
    }

    return completed;
  }, [selectedMonth, selectedDepartment, selectedScenario, searchText, getCompletedDrills]);

  const stats = useMemo(() => {
    const allStats = filteredDrills.map((d) => getDrillStats(d.id)).filter(Boolean) as DrillStats[];

    const totalDrills = filteredDrills.length;
    const totalParticipants = allStats.reduce((acc, s) => acc + s.participantCount, 0);
    const avgPassRate =
      allStats.length > 0
        ? Math.round(allStats.reduce((acc, s) => acc + s.passRate, 0) / allStats.length)
        : 0;
    const avgEscapeTime =
      allStats.length > 0
        ? Math.round(allStats.reduce((acc, s) => acc + s.averageEscapeTime, 0) / allStats.length)
        : 0;

    return {
      totalDrills,
      totalParticipants,
      avgPassRate,
      avgEscapeTime,
    };
  }, [filteredDrills, getDrillStats]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleExport = (drill: Drill) => {
    const summary = generateDrillArchiveSummary(drill.id);
    if (!summary) {
      showToast('导出失败，未找到演练数据');
      return;
    }

    const blob = new Blob([JSON.stringify(summary, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = formatDateTime().replace(/[-: ]/g, '');
    a.download = `档案摘要-${drill.name}-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('档案摘要已导出');
  };

  const getDrillDepartment = (drill: Drill): string => {
    const firstParticipant = personnel.find((p) => p.id === drill.participantIds[0]);
    return firstParticipant?.department || '-';
  };

  const getDrillPassRate = (drillId: string): number => {
    const stats = getDrillStats(drillId);
    return stats?.passRate || 0;
  };

  const getDrillPassCount = (drillId: string): number => {
    const stats = getDrillStats(drillId);
    return stats?.passCount || 0;
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">演练档案</h1>
          <p className="text-sm text-dark-400 mt-1">查看和管理已完成演练的历史档案</p>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="搜索演练名称..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-56 px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-dark-100 placeholder-dark-400 focus:outline-none focus:border-fire-500/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-dark-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-dark-100 focus:outline-none focus:border-fire-500/50 transition-all"
            >
              <option value="">全部月份</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-dark-400" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-dark-100 focus:outline-none focus:border-fire-500/50 transition-all"
            >
              <option value="">全部部门</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-dark-400" />
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-dark-100 focus:outline-none focus:border-fire-500/50 transition-all"
            >
              <option value="">全部场景</option>
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
        <StatCard
          label="已完成演练数"
          value={stats.totalDrills}
          icon={FileArchive}
          color="from-blue-500 to-blue-700"
        />
        <StatCard
          label="累计参训人次"
          value={stats.totalParticipants}
          icon={Users}
          color="from-green-500 to-emerald-700"
        />
        <StatCard
          label="平均通过率"
          value={stats.avgPassRate}
          unit="%"
          icon={CheckCircle}
          color="from-fire-500 to-fire-700"
        />
        <StatCard
          label="平均疏散用时"
          value={stats.avgEscapeTime}
          unit="秒"
          icon={Clock}
          color="from-purple-500 to-purple-700"
        />
      </div>

      <div className="glass-card p-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">演练名称</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">场景</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">部门</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">开始时间</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">参训/签到/通过</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">通过率</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">状态</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrills.map((drill) => {
                const passRate = getDrillPassRate(drill.id);
                const passCount = getDrillPassCount(drill.id);
                const dept = getDrillDepartment(drill);

                return (
                  <tr
                    key={drill.id}
                    className="border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium text-white">{drill.name}</p>
                          <p className="text-xs text-dark-400 mt-0.5">ID: {drill.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-dark-200">{drill.scenarioName || '-'}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-dark-200">{dept}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-dark-200">{drill.startTime}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-dark-200">
                        {drill.participantCount}/{drill.checkedInCount}/{passCount}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-dark-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              passRate >= 80
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                : passRate >= 60
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-600'
                                : 'bg-gradient-to-r from-red-500 to-fire-600'
                            }`}
                            style={{ width: `${passRate}%` }}
                          ></div>
                        </div>
                        <span
                          className={`text-sm font-medium ${
                            passRate >= 80
                              ? 'text-green-400'
                              : passRate >= 60
                              ? 'text-yellow-400'
                              : 'text-red-400'
                          }`}
                        >
                          {passRate}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {drill.isArchived ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-900/30 border border-gray-500/40 text-gray-400 text-xs font-medium">
                          <Archive className="w-3.5 h-3.5" />
                          已归档
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-900/30 border border-blue-500/40 text-blue-400 text-xs font-medium">
                          <FolderOpen className="w-3.5 h-3.5" />
                          未归档
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowDetailModal(drill)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 text-dark-200 text-sm font-medium transition-all"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                          详情
                        </button>
                        <button
                          onClick={() => handleExport(drill)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-sm font-medium transition-all border border-blue-500/30"
                          title="导出摘要"
                        >
                          <Download className="w-4 h-4" />
                          导出
                        </button>
                        {drill.isArchived ? (
                          <button
                            onClick={() => setUnarchiveConfirmId(drill.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 text-sm font-medium transition-all border border-purple-500/30"
                            title="取消归档"
                          >
                            <FolderOpen className="w-4 h-4" />
                            取消归档
                          </button>
                        ) : (
                          <button
                            onClick={() => setArchiveConfirmId(drill.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-fire-600/20 hover:bg-fire-600/30 text-fire-400 text-sm font-medium transition-all border border-fire-500/30"
                            title="归档"
                          >
                            <Archive className="w-4 h-4" />
                            归档
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredDrills.length === 0 && (
          <div className="text-center py-12">
            <FileArchive className="w-12 h-12 text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400">暂无符合条件的演练档案</p>
          </div>
        )}
      </div>

      {showDetailModal && (
        <DetailModal
          drill={showDetailModal}
          drillScores={scores.filter((s) => s.drillId === showDetailModal.id)}
          onClose={() => setShowDetailModal(null)}
        />
      )}

      {archiveConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in-up">
          <div
            className="absolute inset-0 bg-dark-950/90"
            onClick={() => setArchiveConfirmId(null)}
          />
          <div className="relative w-full max-w-md glass-card border border-dark-600/60 rounded-xl p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-fire-900/40 flex items-center justify-center flex-shrink-0">
                <Archive className="w-5 h-5 text-fire-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">确认归档？</h3>
                <p className="text-sm text-dark-300 mt-1">
                  归档后该演练将标记为已归档状态，但数据仍会保留，您可以随时取消归档。
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setArchiveConfirmId(null)} className="btn-secondary">
                取消
              </button>
              <button
                onClick={() => {
                  archiveDrill(archiveConfirmId);
                  setArchiveConfirmId(null);
                  showToast('演练已归档');
                }}
                className="px-5 py-2 rounded-lg bg-fire-600 hover:bg-fire-500 text-white text-sm font-medium transition-all"
              >
                确认归档
              </button>
            </div>
          </div>
        </div>
      )}

      {unarchiveConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in-up">
          <div
            className="absolute inset-0 bg-dark-950/90"
            onClick={() => setUnarchiveConfirmId(null)}
          />
          <div className="relative w-full max-w-md glass-card border border-dark-600/60 rounded-xl p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                <FolderOpen className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">确认取消归档？</h3>
                <p className="text-sm text-dark-300 mt-1">
                  取消归档后，该演练将恢复为未归档状态。
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setUnarchiveConfirmId(null)} className="btn-secondary">
                取消
              </button>
              <button
                onClick={() => {
                  unarchiveDrill(unarchiveConfirmId);
                  setUnarchiveConfirmId(null);
                  showToast('已取消归档');
                }}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all"
              >
                确认取消
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl bg-green-600/90 text-white shadow-xl shadow-green-900/30 border border-green-500/40 animate-fade-in-up flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {toast}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  unit?: string;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <div className="stat-card">
      <div
        className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`}
      ></div>
      <div className="relative">
        <div
          className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-3`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex items-baseline gap-1">
          <p className="text-2xl font-bold text-white">{value}</p>
          {unit && <p className="text-sm text-dark-400">{unit}</p>}
        </div>
        <p className="text-sm text-dark-400 mt-1">{label}</p>
      </div>
    </div>
  );
}

function DetailModal({
  drill,
  drillScores,
  onClose,
}: {
  drill: Drill;
  drillScores: Score[];
  onClose: () => void;
}) {
  const { getDrillStats, personnel, devices } = useStore();
  const stats = getDrillStats(drill.id);

  const errorStats = DEFAULT_ERROR_TYPES.map((err) => {
    const count = drillScores.reduce((acc, s) => {
      return acc + s.errors.filter((e) => e.type === err.type).length;
    }, 0);
    return { ...err, count };
  }).sort((a, b) => b.count - a.count);

  const totalErrors = errorStats.reduce((acc, e) => acc + e.count, 0);
  const passedCount = drillScores.filter((s) => s.passed).length;
  const failedCount = drillScores.filter((s) => !s.passed).length;

  const drillParticipants = drill.participantIds
    .map((pid) => personnel.find((p) => p.id === pid))
    .filter(Boolean);
  const firstParticipant = drillParticipants[0];

  const deviceRecords = useMemo(() => {
    return drillScores
      .map((s) => {
        const device = devices.find((d) => d.id === s.drillId);
        return device ? device : null;
      })
      .filter(Boolean);
  }, [drillScores, devices]);

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="档案详情"
      subtitle={drill.name}
      size="xl"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-dark-800/40 border border-dark-700">
            <h4 className="text-sm font-medium text-dark-400 mb-3">基本信息</h4>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-400">演练名称</span>
                <span className="text-sm text-white font-medium">{drill.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-400">场景</span>
                <span className="text-sm text-dark-200">{drill.scenarioName || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-400">部门</span>
                <span className="text-sm text-dark-200">
                  {firstParticipant?.department || '-'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-400">开始时间</span>
                <span className="text-sm text-dark-200">{drill.startTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-400">结束时间</span>
                <span className="text-sm text-dark-200">{drill.endTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-400">归档状态</span>
                {drill.isArchived ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-900/30 border border-gray-500/40 text-gray-400 text-xs font-medium">
                    <Archive className="w-3 h-3" />
                    已归档
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-900/30 border border-blue-500/40 text-blue-400 text-xs font-medium">
                    <FolderOpen className="w-3 h-3" />
                    未归档
                  </span>
                )}
              </div>
              {drill.isArchived && drill.archivedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-400">归档时间</span>
                  <span className="text-sm text-gray-400">{drill.archivedAt}</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-dark-800/40 border border-dark-700">
            <h4 className="text-sm font-medium text-dark-400 mb-3">参与统计</h4>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-400">参训人数</span>
                <span className="text-sm text-white font-medium">
                  {drill.participantCount} 人
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-400">签到人数</span>
                <span className="text-sm text-green-400 font-medium">
                  {drill.checkedInCount} 人
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-400">设备数量</span>
                <span className="text-sm text-dark-200">{drill.deviceIds?.length || 0} 台</span>
              </div>
              {drillScores.length > 0 && (
                <>
                  <div className="border-t border-dark-700/50 my-2"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-dark-400">通过人数</span>
                    <span className="text-sm text-green-400 font-medium">{passedCount} 人</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-dark-400">未通过人数</span>
                    <span className="text-sm text-red-400 font-medium">{failedCount} 人</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-dark-400">通过率</span>
                    <span
                      className={`text-sm font-bold ${
                        stats?.passRate && stats.passRate >= 80
                          ? 'text-green-400'
                          : stats?.passRate && stats.passRate >= 60
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}
                    >
                      {stats?.passRate || 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-dark-400">平均疏散用时</span>
                    <span className="text-sm text-white font-medium">
                      {stats?.averageEscapeTime || 0} 秒
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {drillScores.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-dark-200 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              成绩列表
            </h4>
            <div className="overflow-x-auto rounded-xl border border-dark-700">
              <table className="w-full">
                <thead>
                  <tr className="bg-dark-800/80 border-b border-dark-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">姓名</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">部门</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">分数</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">用时</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">错误数</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">结果</th>
                  </tr>
                </thead>
                <tbody>
                  {drillScores.map((s) => {
                    const person = personnel.find((p) => p.id === s.personnelId);
                    return (
                      <tr key={s.id} className="border-b border-dark-700/50 hover:bg-dark-700/30">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-fire-500 to-fire-700 flex items-center justify-center text-white text-xs font-bold">
                              {s.personnelName?.charAt(0) || '?'}
                            </div>
                            <span className="text-white font-medium">{s.personnelName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-dark-200">{person?.department || '-'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-lg font-bold ${
                              s.passed ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            {s.totalScore}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-dark-200">{s.escapeTime} 秒</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={s.errors.length > 0 ? 'text-red-400' : 'text-dark-300'}>
                            {s.errors.length} 项
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {s.passed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-900/30 border border-green-500/40 text-green-400 text-xs font-medium">
                              <CheckCircle className="w-3.5 h-3.5" />
                              通过
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-900/30 border border-red-500/40 text-red-400 text-xs font-medium">
                              <XCircle className="w-3.5 h-3.5" />
                              未通过
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {totalErrors > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-dark-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-fire-400" />
              错误动作汇总
            </h4>
            <div className="p-4 rounded-xl bg-dark-800/40 border border-dark-700">
              <div className="space-y-3">
                {errorStats
                  .filter((e) => e.count > 0)
                  .map((err, idx) => {
                    const percent = totalErrors > 0 ? (err.count / totalErrors) * 100 : 0;
                    return (
                      <div key={err.type}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-dark-300">#{idx + 1}</span>
                            <span className="text-sm text-white">{err.type}</span>
                          </div>
                          <span className="text-sm text-dark-300">{err.count} 次</span>
                        </div>
                        <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-fire-500 to-fire-600 rounded-full transition-all"
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-dark-500 mt-1">{err.description}</p>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {deviceRecords.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-dark-200 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-blue-400" />
              设备使用记录
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {deviceRecords.map((device, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-dark-800/40 border border-dark-700"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Monitor className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-white">{device?.name}</span>
                  </div>
                  <p className="text-xs text-dark-400">型号: {device?.model}</p>
                  <p className="text-xs text-dark-400">位置: {device?.location}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {drillScores.length === 0 && (
          <div className="text-center py-8 rounded-xl bg-dark-800/30 border border-dark-700">
            <Trophy className="w-12 h-12 text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400">暂无成绩数据</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
