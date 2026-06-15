import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, MoreVertical, Users, Clock, CheckCircle, XCircle, Play, FileArchive, Calendar, Trash2, TrendingUp, Monitor, Trophy, BarChart3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { DEFAULT_ERROR_TYPES, type Drill, type Scenario, type Personnel, type Device, type Score } from '@/types';
import Modal from '@/components/Modal';
import DrillExecutionModal from '@/components/DrillExecutionModal';
import { formatDateTime, addDays } from '@/lib/utils';

const statusConfig = {
  pending: { label: '待开始', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  ongoing: { label: '进行中', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  completed: { label: '已完成', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  cancelled: { label: '已取消', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export default function DrillList() {
  const navigate = useNavigate();
  const {
    drills,
    scenarios,
    personnel,
    devices,
    scores,
    showDrillCreate,
    setShowDrillCreate,
    addDrill,
    deleteDrill,
    startDrillExecution,
    activeExecution,
    archiveDrill,
    unarchiveDrill,
    showDrillDetail,
    setShowDrillDetail,
  } = useStore();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [archiveFilter, setArchiveFilter] = useState<string>('unarchived');
  const [toast, setToast] = useState<string>('');
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null);
  const [unarchiveConfirmId, setUnarchiveConfirmId] = useState<string | null>(null);

  const filteredDrills = drills.filter((drill) => {
    const matchSearch = drill.name.toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = statusFilter === 'all' || drill.status === statusFilter;
    const matchArchive =
      archiveFilter === 'all'
        ? true
        : archiveFilter === 'archived'
        ? drill.isArchived
        : !drill.isArchived;
    return matchSearch && matchStatus && matchArchive;
  });

  const visibleDrills = drills.filter((d) => !d.isArchived);
  const stats = {
    total: visibleDrills.length,
    pending: visibleDrills.filter((d) => d.status === 'pending').length,
    ongoing: visibleDrills.filter((d) => d.status === 'ongoing').length,
    completed: visibleDrills.filter((d) => d.status === 'completed').length,
    archived: drills.filter((d) => d.isArchived).length,
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
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

      <div className="grid grid-cols-5 gap-4">
        <StatCard label="总演练数" value={stats.total} subValue={`已归档 ${stats.archived}`} icon={Calendar} color="from-blue-500 to-blue-700" />
        <StatCard label="待开始" value={stats.pending} icon={Clock} color="from-yellow-500 to-orange-600" />
        <StatCard label="进行中" value={stats.ongoing} icon={Play} color="from-green-500 to-emerald-700" />
        <StatCard label="已完成" value={stats.completed} icon={Trophy} color="from-purple-500 to-purple-700" />
        <StatCard label="已归档" value={stats.archived} icon={FileArchive} color="from-gray-500 to-gray-700" />
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
            <div className="flex items-center gap-2">
              <FileArchive className="w-4 h-4 text-dark-400" />
              <select
                value={archiveFilter}
                onChange={(e) => setArchiveFilter(e.target.value)}
                className="px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-dark-100 focus:outline-none focus:border-fire-500/50 transition-all"
              >
                <option value="unarchived">未归档</option>
                <option value="archived">已归档</option>
                <option value="all">全部</option>
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
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">设备数</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">状态</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrills.map((drill) => (
                <DrillRow
                  key={drill.id}
                  drill={drill}
                  onDelete={(id) => {
                    deleteDrill(id);
                    showToast('演练已删除');
                  }}
                  onStartDrill={(id) => {
                    startDrillExecution(id);
                    setShowExecutionModal(true);
                  }}
                  onContinueDrill={(id) => {
                    if (activeExecution && activeExecution.drillId === id) {
                      setShowExecutionModal(true);
                    } else {
                      startDrillExecution(id);
                      setShowExecutionModal(true);
                    }
                  }}
                  onViewScores={() => {
                    navigate('/scores');
                  }}
                  onArchive={(id) => setArchiveConfirmId(id)}
                  onUnarchive={(id) => setUnarchiveConfirmId(id)}
                  onViewDetail={(drill) => setShowDrillDetail(drill)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {filteredDrills.length === 0 && (
          <div className="text-center py-12">
            <p className="text-dark-400">暂无演练数据，点击右上角「创建演练」开始</p>
          </div>
        )}
      </div>

      <CreateDrillModal
        open={showDrillCreate}
        onClose={() => setShowDrillCreate(false)}
        scenarios={scenarios}
        personnel={personnel}
        devices={devices}
        onSubmit={(data) => {
          addDrill(data);
          showToast('演练创建成功！');
        }}
      />

      <DrillExecutionModal
        open={showExecutionModal}
        onClose={() => setShowExecutionModal(false)}
        showToast={showToast}
      />

      {archiveConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in-up">
          <div className="absolute inset-0 bg-dark-950/90" onClick={() => setArchiveConfirmId(null)} />
          <div className="relative w-full max-w-md glass-card border border-dark-600/60 rounded-xl p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-fire-900/40 flex items-center justify-center flex-shrink-0">
                <FileArchive className="w-5 h-5 text-fire-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">确认归档？</h3>
                <p className="text-sm text-dark-300 mt-1">
                  归档后该演练将从默认列表中隐藏，但数据仍会保留，您可以随时取消归档。
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setArchiveConfirmId(null)}
                className="btn-secondary"
              >
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
          <div className="absolute inset-0 bg-dark-950/90" onClick={() => setUnarchiveConfirmId(null)} />
          <div className="relative w-full max-w-md glass-card border border-dark-600/60 rounded-xl p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                <FileArchive className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">确认取消归档？</h3>
                <p className="text-sm text-dark-300 mt-1">
                  取消归档后，该演练将重新显示在默认列表中。
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setUnarchiveConfirmId(null)}
                className="btn-secondary"
              >
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

      {showDrillDetail && (
        <DrillDetailModal
          drill={showDrillDetail}
          scores={scores.filter((s) => s.drillId === showDrillDetail.id)}
          onClose={() => setShowDrillDetail(null)}
        />
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

function StatCard({ label, value, subValue, icon: Icon, color }: { label: string; value: number; subValue?: string; icon: LucideIcon; color: string }) {
  return (
    <div className="stat-card">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`}></div>
      <div className="relative">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-white">{value}</p>
          {subValue && (
            <p className="text-xs text-dark-500">({subValue})</p>
          )}
        </div>
        <p className="text-sm text-dark-400 mt-1">{label}</p>
      </div>
    </div>
  );
}

function DrillRow({
  drill,
  onDelete,
  onStartDrill,
  onContinueDrill,
  onViewScores,
  onArchive,
  onUnarchive,
  onViewDetail,
}: {
  drill: Drill;
  onDelete: (id: string) => void;
  onStartDrill: (id: string) => void;
  onContinueDrill: (id: string) => void;
  onViewScores: () => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onViewDetail: (drill: Drill) => void;
}) {
  const status = statusConfig[drill.status];
  const checkInProgress = drill.participantCount > 0 ? drill.checkedInCount / drill.participantCount : 0;

  return (
    <tr
      className={`border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors cursor-pointer ${
        drill.isArchived ? 'opacity-60' : ''
      }`}
      onClick={() => onViewDetail(drill)}
    >
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <div>
            <p className="font-medium text-white">{drill.name}</p>
            <p className="text-xs text-dark-400 mt-0.5">ID: {drill.id}</p>
          </div>
          {drill.isArchived && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-500/20 border border-gray-500/30 text-gray-400 text-[10px] font-medium">
              <FileArchive className="w-3 h-3" />
              已归档
            </span>
          )}
        </div>
      </td>
      <td className="py-4 px-4">
        <span className="text-sm text-dark-200">{drill.scenarioName || '-'}</span>
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
        <div className="flex items-center gap-1 text-sm text-dark-200">
          <Monitor className="w-4 h-4 text-dark-400" />
          {drill.deviceIds?.length || 0}
        </div>
      </td>
      <td className="py-4 px-4">
        <span className={`badge border ${status.color}`}>{status.label}</span>
      </td>
      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          {drill.status === 'pending' && !drill.isArchived && (
            <button
              onClick={() => onStartDrill(drill.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-fire-500 to-fire-600 hover:from-fire-400 hover:to-fire-500 text-white text-sm font-semibold shadow-lg shadow-fire-900/30 transition-all"
              title="开始演练"
            >
              <Play className="w-4 h-4" />
              开始演练
            </button>
          )}
          {drill.status === 'ongoing' && !drill.isArchived && (
            <button
              onClick={() => onContinueDrill(drill.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white text-sm font-semibold shadow-lg shadow-green-900/30 transition-all"
              title="继续执行"
            >
              <TrendingUp className="w-4 h-4" />
              继续执行
            </button>
          )}
          {drill.status === 'completed' && !drill.isArchived && (
            <button
              onClick={onViewScores}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-900/30 transition-all"
              title="查看成绩"
            >
              <Trophy className="w-4 h-4" />
              查看成绩
            </button>
          )}
          {drill.status === 'completed' && !drill.isArchived && (
            <button
              onClick={() => onArchive(drill.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-dark-200 text-sm font-medium transition-all"
              title="归档"
            >
              <FileArchive className="w-4 h-4" />
              归档
            </button>
          )}
          {drill.isArchived && (
            <button
              onClick={() => onUnarchive(drill.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-dark-200 text-sm font-medium transition-all"
              title="取消归档"
            >
              <FileArchive className="w-4 h-4" />
              取消归档
            </button>
          )}
          {!drill.isArchived && (
            <button
              onClick={() => {
                if (confirm('确定删除该演练批次？')) onDelete(drill.id);
              }}
              className="p-1.5 rounded-lg text-dark-300 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="删除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onViewDetail(drill)}
            className="p-1.5 rounded-lg text-dark-300 hover:text-white hover:bg-dark-600 transition-all"
            title="查看详情"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

interface CreateDrillForm {
  name: string;
  scenarioId: string;
  startTime: string;
  endTime: string;
  participantIds: string[];
  deviceIds: string[];
}

function CreateDrillModal({
  open,
  onClose,
  scenarios,
  personnel,
  devices,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  scenarios: Scenario[];
  personnel: Personnel[];
  devices: Device[];
  onSubmit: (data: Omit<Drill, 'id' | 'createdAt' | 'checkedInCount' | 'isArchived'>) => void;
}) {
  const defaultStart = formatDateTime(addDays(1));
  const defaultEnd = formatDateTime(addDays(1, new Date(new Date().setHours(new Date().getHours() + 2))));

  const [form, setForm] = useState<CreateDrillForm>({
    name: '',
    scenarioId: scenarios[0]?.id || '',
    startTime: defaultStart.replace(' ', 'T').slice(0, 16),
    endTime: defaultEnd.replace(' ', 'T').slice(0, 16),
    participantIds: [],
    deviceIds: [],
  });

  const [deptFilter, setDeptFilter] = useState('all');
  const departments = Array.from(new Set(personnel.map((p) => p.department)));
  const filteredPersonnel = deptFilter === 'all' ? personnel : personnel.filter((p) => p.department === deptFilter);

  const togglePerson = (id: string) => {
    setForm((f) => ({
      ...f,
      participantIds: f.participantIds.includes(id) ? f.participantIds.filter((x) => x !== id) : [...f.participantIds, id],
    }));
  };

  const toggleDevice = (id: string) => {
    setForm((f) => ({
      ...f,
      deviceIds: f.deviceIds.includes(id) ? f.deviceIds.filter((x) => x !== id) : [...f.deviceIds, id],
    }));
  };

  const selectAllPersons = () => {
    if (form.participantIds.length === filteredPersonnel.length) {
      setForm((f) => ({
        ...f,
        participantIds: f.participantIds.filter((id) => !filteredPersonnel.some((p) => p.id === id)),
      }));
    } else {
      const ids = new Set([...form.participantIds, ...filteredPersonnel.map((p) => p.id)]);
      setForm((f) => ({ ...f, participantIds: Array.from(ids) }));
    }
  };

  const availableDevices = devices.filter((d) => d.status === 'available');

  const handleSubmit = () => {
    if (!form.name.trim()) {
      alert('请填写演练批次名称');
      return;
    }
    if (!form.scenarioId) {
      alert('请选择火灾场景');
      return;
    }
    if (form.participantIds.length === 0) {
      alert('请至少勾选一名参训人员');
      return;
    }
    const scenario = scenarios.find((s) => s.id === form.scenarioId);
    const start = form.startTime.replace('T', ' ') + ':00';
    const end = form.endTime.replace('T', ' ') + ':00';
    onSubmit({
      name: form.name,
      scenarioId: form.scenarioId,
      scenarioName: scenario?.name,
      startTime: start,
      endTime: end,
      status: 'pending',
      participantIds: form.participantIds,
      participantCount: form.participantIds.length,
      deviceIds: form.deviceIds,
    });
    setForm({
      name: '',
      scenarioId: scenarios[0]?.id || '',
      startTime: defaultStart.replace(' ', 'T').slice(0, 16),
      endTime: defaultEnd.replace(' ', 'T').slice(0, 16),
      participantIds: [],
      deviceIds: [],
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="创建演练批次"
      subtitle="填写演练信息、选择场景和分配参训人员"
      size="xl"
      footer={
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary px-5">
            取消
          </button>
          <button onClick={handleSubmit} className="btn-primary px-5 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            创建演练
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-dark-200 mb-1.5">演练批次名称 *</label>
            <input
              type="text"
              placeholder="如：2026年Q2技术部消防演练"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">火灾场景 *</label>
            <select
              value={form.scenarioId}
              onChange={(e) => setForm({ ...form, scenarioId: e.target.value })}
              className="input-field"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}（{s.difficulty === 'easy' ? '简单' : s.difficulty === 'medium' ? '中等' : '困难'} · {s.duration}分钟）
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">开始时间</label>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">结束时间</label>
              <input
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-dark-200">
              参训人员（已选 {form.participantIds.length} 人）*
            </label>
            <div className="flex items-center gap-2">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-3 py-1.5 bg-dark-700/50 border border-dark-600 rounded-lg text-xs text-dark-100 focus:outline-none focus:border-fire-500/50"
              >
                <option value="all">全部部门</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <button onClick={selectAllPersons} className="text-xs text-fire-400 hover:text-fire-300 transition-colors">
                {form.participantIds.length === filteredPersonnel.length ? '取消全选' : '全选当前'}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-dark-700/30 rounded-xl border border-dark-700/50">
            {filteredPersonnel.map((p) => {
              const checked = form.participantIds.includes(p.id);
              return (
                <label
                  key={p.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                    checked
                      ? 'bg-fire-600/15 border-fire-500/40 text-white'
                      : 'bg-dark-800/40 border-dark-600/40 text-dark-200 hover:bg-dark-700/40'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePerson(p.id)}
                    className="accent-fire-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-[11px] text-dark-400 truncate">{p.department} · {p.position}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-dark-200">
              VR 头显设备（已选 {form.deviceIds.length} 台）
            </label>
            <span className="text-xs text-dark-400">可选设备 {availableDevices.length} 台</span>
          </div>
          <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-2 bg-dark-700/30 rounded-xl border border-dark-700/50">
            {availableDevices.map((d) => {
              const checked = form.deviceIds.includes(d.id);
              return (
                <label
                  key={d.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                    checked
                      ? 'bg-fire-600/15 border-fire-500/40 text-white'
                      : 'bg-dark-800/40 border-dark-600/40 text-dark-200 hover:bg-dark-700/40'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleDevice(d.id)}
                    className="accent-fire-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{d.name}</div>
                    <div className="text-[11px] text-dark-400 truncate">{d.location}</div>
                  </div>
                </label>
              );
            })}
            {availableDevices.length === 0 && (
              <div className="col-span-4 text-center py-4 text-sm text-dark-400">
                当前没有可用的设备
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function DrillDetailModal({
  drill,
  scores,
  onClose,
}: {
  drill: Drill;
  scores: Score[];
  onClose: () => void;
}) {
  const status = statusConfig[drill.status];

  const errorStats = DEFAULT_ERROR_TYPES.map((err) => {
    const count = scores.reduce((acc, s) => {
      return acc + s.errors.filter((e) => e.type === err.type).length;
    }, 0);
    return { ...err, count };
  }).sort((a, b) => b.count - a.count);

  const totalErrors = errorStats.reduce((acc, e) => acc + e.count, 0);
  const passedCount = scores.filter((s) => s.passed).length;
  const failedCount = scores.filter((s) => !s.passed).length;

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="演练详情"
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
                <span className="text-sm text-dark-400">开始时间</span>
                <span className="text-sm text-dark-200">{drill.startTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-400">结束时间</span>
                <span className="text-sm text-dark-200">{drill.endTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-400">状态</span>
                <span className={`badge border text-xs ${status.color}`}>{status.label}</span>
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
                <span className="text-sm text-white font-medium">{drill.participantCount} 人</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-400">签到人数</span>
                <span className="text-sm text-green-400 font-medium">{drill.checkedInCount} 人</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-400">设备数量</span>
                <span className="text-sm text-dark-200">{drill.deviceIds?.length || 0} 台</span>
              </div>
              {scores.length > 0 && (
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
                </>
              )}
            </div>
          </div>
        </div>

        {scores.length > 0 && (
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
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">分数</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">用时</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">错误数</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">结果</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map((s) => (
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
                        <span className={`text-lg font-bold ${s.passed ? 'text-green-400' : 'text-red-400'}`}>
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
                  ))}
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
                {errorStats.filter((e) => e.count > 0).map((err, idx) => {
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

        {scores.length === 0 && drill.status !== 'pending' && (
          <div className="text-center py-8 rounded-xl bg-dark-800/30 border border-dark-700">
            <Trophy className="w-12 h-12 text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400">暂无成绩数据</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
