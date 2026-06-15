import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Users,
  Monitor,
  CheckCircle,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Trophy,
  X,
} from 'lucide-react';
import Modal from '@/components/Modal';
import { useStore } from '@/store/useStore';
import { DEFAULT_ERROR_TYPES, type ErrorRecord } from '@/types';
import { formatDateTime, genId } from '@/lib/utils';

interface DrillExecutionModalProps {
  open: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export default function DrillExecutionModal({ open, onClose, showToast }: DrillExecutionModalProps) {
  const navigate = useNavigate();
  const {
    activeExecution,
    setActiveExecution,
    drills,
    personnel,
    devices,
    executionCheckIn,
    executionSetParticipantResult,
    executionGenerateScores,
  } = useStore();

  const [confirmClose, setConfirmClose] = useState(false);
  const [escapeTimes, setEscapeTimes] = useState<Record<string, number>>({});
  const [selectedErrors, setSelectedErrors] = useState<Record<string, string[]>>({});
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const drill = drills.find((d) => d.id === activeExecution?.drillId);
  const step = activeExecution?.step || 'signin';

  useEffect(() => {
    if (!open || step !== 'running' || !activeExecution?.startedAt) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    const start = new Date(activeExecution.startedAt).getTime();
    setTimerSeconds(Math.floor((Date.now() - start) / 1000));
    timerRef.current = setInterval(() => {
      setTimerSeconds(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [open, step, activeExecution?.startedAt]);

  useEffect(() => {
    if (!activeExecution) return;
    const times: Record<string, number> = {};
    const errors: Record<string, string[]> = {};
    activeExecution.participantResults.forEach((r) => {
      times[r.personnelId] = r.escapeTime || 0;
      errors[r.personnelId] = r.errors?.map((e) => e.type) || [];
    });
    setEscapeTimes(times);
    setSelectedErrors(errors);
  }, [activeExecution?.drillId, open]);

  const handleClose = () => {
    if (step === 'signin' || step === 'running') {
      setConfirmClose(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setConfirmClose(false);
    onClose();
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getAvailableDevices = () => {
    if (!activeExecution) return [];
    const usedDeviceIds = new Set(
      activeExecution.checkIns.map((c) => c.deviceId).filter(Boolean) as string[]
    );
    return devices.filter((d) => d.status === 'available' && !usedDeviceIds.has(d.id));
  };

  const handleCheckIn = (personId: string) => {
    const availableDevices = getAvailableDevices();
    const availableDevice = availableDevices[0];
    executionCheckIn(personId, availableDevice?.id);
    showToast('签到成功');
  };

  const handleCheckInAll = () => {
    if (!activeExecution) return;
    let availableDevices = getAvailableDevices();
    let deviceIdx = 0;
    activeExecution.participantResults.forEach((r) => {
      const already = activeExecution.checkIns.find((c) => c.personnelId === r.personnelId);
      if (!already) {
        const dev = availableDevices[deviceIdx % availableDevices.length];
        executionCheckIn(r.personnelId, dev?.id);
        if (dev) {
          availableDevices = availableDevices.filter((d) => d.id !== dev.id);
        }
        deviceIdx++;
      }
    });
    showToast('全部签到完成');
  };

  const handleEnterRunning = () => {
    if (!activeExecution) return;
    const newEx = { ...activeExecution, step: 'running' as const, startedAt: formatDateTime() };
    setActiveExecution(newEx);
  };

  const addSeconds = (personId: string, seconds: number) => {
    setEscapeTimes((prev) => ({
      ...prev,
      [personId]: (prev[personId] || 0) + seconds,
    }));
  };

  const toggleError = (personId: string, errorType: string) => {
    setSelectedErrors((prev) => {
      const current = prev[personId] || [];
      return {
        ...prev,
        [personId]: current.includes(errorType)
          ? current.filter((e) => e !== errorType)
          : [...current, errorType],
      };
    });
  };

  const handleFinishRunning = () => {
    if (!activeExecution) return;
    activeExecution.participantResults.forEach((r) => {
      const errors: ErrorRecord[] = (selectedErrors[r.personnelId] || []).map((type) => {
        const info = DEFAULT_ERROR_TYPES.find((e) => e.type === type);
        return {
          id: genId('er'),
          type,
          description: info?.description || type,
          timestamp: Date.now(),
        };
      });
      executionSetParticipantResult(r.personnelId, {
        escapeTime: escapeTimes[r.personnelId] || 0,
        errors,
      });
    });
    const latestEx = useStore.getState().activeExecution;
    if (latestEx) {
      setActiveExecution({ ...latestEx, step: 'scoring' as const });
    }
    showToast('已进入评分阶段');
  };

  const handleGenerateScores = () => {
    const scores = executionGenerateScores();
    const passed = scores.filter((s) => s.passed).length;
    const failed = scores.filter((s) => !s.passed).length;
    showToast(`成绩生成成功，${passed} 人通过 ${failed} 人未通过`);
    setTimeout(() => {
      navigate('/scores');
    }, 800);
  };

  const renderSigninStep = () => {
    if (!activeExecution || !drill) return null;
    const total = activeExecution.participantResults.length;
    const checkedIn = activeExecution.checkIns.length;
    const availableDevices = getAvailableDevices();
    const usedDeviceIds = new Set(
      activeExecution.checkIns.map((c) => c.deviceId).filter(Boolean) as string[]
    );

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-fire-600/20 to-fire-500/10 border border-fire-500/30">
          <div>
            <h3 className="text-lg font-semibold text-white">{drill.name}</h3>
            <p className="text-sm text-dark-300 mt-0.5">场景：{drill.scenarioName || '-'}</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-800/60 border border-dark-600">
            <Users className="w-5 h-5 text-fire-400" />
            <span className="text-white font-semibold">已签到 {checkedIn}/{total} 人</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-dark-800/40 border border-dark-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-dark-200 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-fire-400" />
              设备分配状态
            </h4>
            <span className="text-xs text-dark-400">
              可用 {availableDevices.length} 台 / 已分配 {usedDeviceIds.size} 台
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {devices.filter((d) => d.status === 'available').map((d) => {
              const isUsed = usedDeviceIds.has(d.id);
              return (
                <span
                  key={d.id}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                    isUsed
                      ? 'bg-green-900/20 border-green-500/40 text-green-400'
                      : 'bg-dark-700/50 border-dark-600 text-dark-300'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isUsed ? 'bg-green-400' : 'bg-dark-500'}`}></span>
                  {d.name}
                  <span className="text-[10px] opacity-70">
                    {isUsed ? '已分配' : '可用'}
                  </span>
                </span>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto pr-1">
          {activeExecution.participantResults.map((r) => {
            const person = personnel.find((p) => p.id === r.personnelId);
            const checkIn = activeExecution.checkIns.find((c) => c.personnelId === r.personnelId);
            const isCheckedIn = !!checkIn;
            const hasDevice = !!checkIn?.deviceId;
            return (
              <div
                key={r.personnelId}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  isCheckedIn
                    ? 'bg-green-900/15 border-green-500/30'
                    : 'bg-dark-800/50 border-dark-700 hover:border-dark-600'
                }`}
              >
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-fire-500 to-fire-700 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {person?.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white">{person?.name}</div>
                  <div className="text-xs text-dark-400 truncate">{person?.department}</div>
                  {isCheckedIn ? (
                    <div className="flex flex-col gap-1 mt-1.5">
                      <div className="flex items-center gap-1 text-xs text-green-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>签到时间：{checkIn?.checkedInAt?.slice(11, 19)}</span>
                      </div>
                      {hasDevice ? (
                        <div className="flex items-center gap-1 text-xs text-fire-400">
                          <Monitor className="w-3.5 h-3.5" />
                          <span>设备：{checkIn?.deviceName}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-dark-500">
                          <Monitor className="w-3.5 h-3.5" />
                          <span>未分配设备</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-dark-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>未签到</span>
                    </div>
                  )}
                </div>
                {!isCheckedIn && (
                  <button
                    onClick={() => handleCheckIn(r.personnelId)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-fire-600 hover:bg-fire-500 text-white text-sm font-medium transition-all"
                  >
                    <Monitor className="w-4 h-4" />
                    一键签到
                  </button>
                )}
                {isCheckedIn && (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleCheckInAll}
            className="btn-secondary flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            全部签到
          </button>
          <button
            onClick={handleEnterRunning}
            disabled={checkedIn === 0}
            className={`btn-primary flex items-center gap-2 ${checkedIn === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Play className="w-4 h-4" />
            进入演练
          </button>
        </div>
      </div>
    );
  };

  const renderRunningStep = () => {
    if (!activeExecution || !drill) return null;

    return (
      <div className="space-y-5">
        <div className="text-center py-4 px-6 rounded-xl bg-gradient-to-b from-fire-600/20 to-dark-800/50 border border-fire-500/30">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-fire-400 animate-pulse" />
            <span className="text-sm font-medium text-dark-300">演练进行中</span>
          </div>
          <div className="font-mono text-5xl font-bold tracking-wider text-white tabular-nums">
            {formatTime(timerSeconds)}
          </div>
          <div className="text-sm text-dark-400 mt-1">{drill.name}</div>
        </div>

        <div className="grid grid-cols-2 gap-3 max-h-[45vh] overflow-y-auto pr-1">
          {activeExecution.participantResults.map((r) => {
            const person = personnel.find((p) => p.id === r.personnelId);
            const currentErrors = selectedErrors[r.personnelId] || [];
            return (
              <div
                key={r.personnelId}
                className="p-4 rounded-xl bg-dark-800/50 border border-dark-700 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-fire-500 to-fire-700 flex items-center justify-center text-white font-bold text-sm">
                    {person?.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white">{person?.name}</div>
                    <div className="text-xs text-fire-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-fire-400 animate-pulse"></span>
                      演练中...
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-dark-300 mb-1.5">疏散用时（秒）</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={escapeTimes[r.personnelId] || 0}
                      onChange={(e) =>
                        setEscapeTimes((prev) => ({
                          ...prev,
                          [r.personnelId]: Math.max(0, parseInt(e.target.value) || 0),
                        }))
                      }
                      className="flex-1 px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-white focus:outline-none focus:border-fire-500/50"
                    />
                    <button
                      onClick={() => addSeconds(r.personnelId, 30)}
                      className="px-3 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-dark-200 text-sm transition-all"
                    >
                      +30s
                    </button>
                    <button
                      onClick={() => addSeconds(r.personnelId, 60)}
                      className="px-3 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-dark-200 text-sm transition-all"
                    >
                      +60s
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-dark-300 mb-1.5">
                    错误动作（{currentErrors.length} 项）
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {DEFAULT_ERROR_TYPES.map((err) => {
                      const checked = currentErrors.includes(err.type);
                      return (
                        <label
                          key={err.type}
                          className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-all text-xs ${
                            checked
                              ? 'bg-red-900/20 border-red-500/40 text-white'
                              : 'bg-dark-700/30 border-dark-700 text-dark-300 hover:border-dark-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleError(r.personnelId, err.type)}
                            className="mt-0.5 accent-red-500"
                          />
                          <span className="leading-snug">{err.type}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={handleFinishRunning} className="btn-primary flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            全部完成，进入评分
          </button>
        </div>
      </div>
    );
  };

  const renderScoringStep = () => {
    if (!activeExecution || !drill) return null;

    const results = activeExecution.participantResults.map((r) => {
      const errors = r.errors || selectedErrors[r.personnelId]?.map((t) => {
        const info = DEFAULT_ERROR_TYPES.find((e) => e.type === t);
        return { id: genId('er'), type: t, description: info?.description || t, timestamp: Date.now() };
      }) || [];
      const escapeTime = r.escapeTime || escapeTimes[r.personnelId] || 0;
      const errorCount = errors.length;
      const score = Math.max(0, Math.min(100, Math.round(100 - escapeTime * 0.15 - errorCount * 10)));
      const passed = score >= 70;
      const person = personnel.find((p) => p.id === r.personnelId);
      return { ...r, person, escapeTime, errorCount, score, passed, errors };
    });

    const passedCount = results.filter((r) => r.passed).length;
    const failedCount = results.filter((r) => !r.passed).length;

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-600/20 to-purple-500/10 border border-purple-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">成绩评分预览</h3>
              <p className="text-sm text-dark-300 mt-0.5">{drill.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-lg bg-green-900/30 border border-green-500/30 text-green-400 text-sm font-medium">
              通过 {passedCount}
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-red-900/30 border border-red-500/30 text-red-400 text-sm font-medium">
              未通过 {failedCount}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-dark-700">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-800/80 border-b border-dark-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">姓名</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">疏散用时</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">错误数</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">分数</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">结果</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.personnelId} className="border-b border-dark-700/50 hover:bg-dark-700/30">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-fire-500 to-fire-700 flex items-center justify-center text-white text-xs font-bold">
                        {r.person?.name?.charAt(0) || '?'}
                      </div>
                      <span className="text-white font-medium">{r.person?.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-dark-200">{r.escapeTime} 秒</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={r.errorCount > 0 ? 'text-red-400' : 'text-dark-300'}>
                      {r.errorCount} 项
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-lg font-bold ${r.passed ? 'text-green-400' : 'text-red-400'}`}>
                      {r.score}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {r.passed ? (
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

        <div className="flex justify-end pt-2">
          <button onClick={handleGenerateScores} className="btn-primary flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            生成成绩并结束演练
          </button>
        </div>
      </div>
    );
  };

  const stepTitles: Record<string, string> = {
    signin: '签到管理',
    running: '演练进行中',
    scoring: '成绩评分',
  };

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        title={stepTitles[step] || '演练执行'}
        subtitle={drill?.name || ''}
        size="xl"
      >
        {step === 'signin' && renderSigninStep()}
        {step === 'running' && renderRunningStep()}
        {step === 'scoring' && renderScoringStep()}
      </Modal>

      {confirmClose && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in-up">
          <div className="absolute inset-0 bg-dark-950/90" onClick={() => setConfirmClose(false)} />
          <div className="relative w-full max-w-md glass-card border border-dark-600/60 rounded-xl p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-900/40 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">确认关闭？</h3>
                <p className="text-sm text-dark-300 mt-1">
                  演练尚未完成，关闭后当前进度可能丢失，是否确认？
                </p>
              </div>
              <button
                onClick={() => setConfirmClose(false)}
                className="p-1 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/50 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setConfirmClose(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleConfirmClose}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-all"
              >
                确认关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
