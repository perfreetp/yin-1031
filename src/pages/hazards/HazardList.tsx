import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Clock, User, Calendar, Plus, Search, Filter, CheckCircle, XCircle, AlertCircle, Image as ImageIcon, Shield, Activity, Upload, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import Modal from '@/components/Modal';
import { cn, formatDate, addDays } from '@/lib/utils';
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

interface Toast {
  id: string;
  message: string;
}

export default function HazardList() {
  const {
    hazards,
    personnel,
    showHazardCreate,
    setShowHazardCreate,
    showHazardAssign,
    setShowHazardAssign,
    addHazard,
    assignHazard,
    resolveHazard,
    verifyHazard,
  } = useStore();

  const [searchText, setSearchText] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string) => {
    const id = `toast_${Date.now()}`;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const filteredHazards = hazards.filter((hazard) => {
    const matchSearch =
      hazard.title.toLowerCase().includes(searchText.toLowerCase()) ||
      hazard.description.toLowerCase().includes(searchText.toLowerCase()) ||
      (hazard.responsibleName && hazard.responsibleName.toLowerCase().includes(searchText.toLowerCase()));
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

  const handleResolve = (id: string) => {
    resolveHazard(id);
    showToast('整改已完成，等待验证');
  };

  const handleVerify = (id: string) => {
    verifyHazard(id);
    showToast('隐患已验证闭环');
  };

  return (
    <div className="space-y-6 animate-fade-in-up relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">隐患管理</h1>
          <p className="text-sm text-dark-400 mt-1">管理安全隐患和整改跟踪</p>
        </div>
        <button
          onClick={() => setShowHazardCreate(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          上报隐患
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="隐患总数"
          value={stats.total}
          icon={AlertTriangle}
          color="from-fire-500 to-fire-700"
        />
        <StatCard
          label="待处理"
          value={stats.pending}
          icon={Clock}
          color="from-yellow-500 to-orange-600"
        />
        <StatCard
          label="整改中"
          value={stats.processing}
          icon={Activity}
          color="from-blue-500 to-blue-700"
        />
        <StatCard
          label="严重隐患"
          value={stats.critical}
          icon={Shield}
          color="from-red-500 to-red-700"
        />
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="text"
                placeholder="搜索隐患标题或描述..."
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
                <option value="low">低危</option>
                <option value="medium">中危</option>
                <option value="high">高危</option>
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
            <HazardCard
              key={hazard.id}
              hazard={hazard}
              onAssign={() => setShowHazardAssign(hazard)}
              onResolve={() => handleResolve(hazard.id)}
              onVerify={() => handleVerify(hazard.id)}
            />
          ))}
        </div>

        {filteredHazards.length === 0 && (
          <div className="text-center py-16">
            <AlertTriangle className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <p className="text-dark-400 text-lg">暂无隐患数据</p>
            <p className="text-dark-500 text-sm mt-2">点击右上角"上报隐患"按钮添加新的隐患记录</p>
          </div>
        )}
      </div>

      <CreateHazardModal
        open={showHazardCreate}
        onClose={() => setShowHazardCreate(false)}
        onSubmit={(data) => {
          addHazard(data);
          showToast('隐患上报成功');
        }}
      />

      <AssignHazardModal
        hazard={showHazardAssign}
        personnel={personnel}
        onClose={() => setShowHazardAssign(null)}
        onSubmit={(id, responsibleId, responsibleName, deadline) => {
          assignHazard(id, responsibleId, responsibleName, deadline);
          showToast('整改派单成功');
        }}
      />

      <div className="fixed bottom-6 right-6 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex items-center gap-3 px-4 py-3 bg-green-600/90 backdrop-blur-md border border-green-500/50 rounded-lg shadow-lg shadow-green-900/30 animate-fade-in-up"
          >
            <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
            <span className="text-white font-medium text-sm">{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
}) {
  return (
    <div className="stat-card">
      <div
        className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`}
      ></div>
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold text-white">{value}</p>
          <p className="text-sm text-dark-400 mt-1">{label}</p>
        </div>
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function HazardCard({
  hazard,
  onAssign,
  onResolve,
  onVerify,
}: {
  hazard: Hazard;
  onAssign: () => void;
  onResolve: () => void;
  onVerify: () => void;
}) {
  const level = levelConfig[hazard.level];
  const status = statusConfig[hazard.status];

  const handleAction = () => {
    if (hazard.status === 'pending') onAssign();
    else if (hazard.status === 'processing') onResolve();
    else if (hazard.status === 'resolved') onVerify();
  };

  const getDeadlineBadge = () => {
    if (!hazard.deadline) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(hazard.deadline);
    deadline.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="badge bg-red-500/20 text-red-400 border border-red-500/30 ml-auto">
          超期 {Math.abs(diffDays)} 天
        </span>
      );
    } else if (diffDays === 0) {
      return (
        <span className="badge bg-orange-500/20 text-orange-400 border border-orange-500/30 ml-auto">
          今日到期
        </span>
      );
    } else {
      return (
        <span className="badge bg-green-500/20 text-green-400 border border-green-500/30 ml-auto">
          剩余 {diffDays} 天
        </span>
      );
    }
  };

  const isOverdue = () => {
    if (!hazard.deadline) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(hazard.deadline);
    deadline.setHours(0, 0, 0, 0);
    return deadline < today;
  };

  const isAssigned = hazard.status !== 'pending';
  const overdue = isOverdue();

  return (
    <div className="glass-card-hover overflow-hidden">
      <div className="relative h-36 overflow-hidden group">
        <img
          src={hazard.photoUrl}
          alt={hazard.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://picsum.photos/400/300?random=' + hazard.id;
          }}
        />
        <div className="absolute top-2 left-2 flex gap-2">
          <span className={`badge border ${level.color}`}>{level.label}危</span>
        </div>
        <div className="absolute top-2 right-2">
          <span
            className={`badge ${status.bgColor} ${status.color} border border-current/30`}
          >
            {status.label}
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/20 to-transparent pointer-events-none"></div>
      </div>
      <div className="p-3">
        <h3 className="font-medium text-white line-clamp-1">{hazard.title}</h3>
        <p className="text-xs text-dark-400 mt-1 line-clamp-2 h-8">{hazard.description}</p>

        {hazard.status === 'pending' && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <span className="text-xs text-yellow-400 font-medium">待分配整改责任人</span>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-dark-700/50 space-y-1.5">
          {isAssigned && (
            <div className="flex items-center gap-2 text-xs">
              <User className="w-3.5 h-3.5 text-dark-400 flex-shrink-0" />
              <span className="text-dark-300 truncate">
                责任人：{hazard.responsibleName || '未设置'}
              </span>
            </div>
          )}
          {isAssigned && (
            <div className="flex items-center gap-2 text-xs">
              <Calendar
                className={cn(
                  'w-3.5 h-3.5 flex-shrink-0',
                  overdue ? 'text-red-400' : 'text-dark-400'
                )}
              />
              <span className={cn('truncate', overdue ? 'text-red-400' : 'text-dark-300')}>
                截止：{hazard.deadline || '未设置'}
              </span>
              {overdue && <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
              {getDeadlineBadge()}
            </div>
          )}
          {!isAssigned && (
            <>
              <div className="flex items-center gap-2 text-xs">
                <User className="w-3.5 h-3.5 text-dark-400 flex-shrink-0" />
                <span className="text-dark-500 truncate">责任人：—</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Calendar className="w-3.5 h-3.5 text-dark-400 flex-shrink-0" />
                <span className="text-dark-500 truncate">截止：—</span>
              </div>
            </>
          )}
          <div className="flex items-center gap-2 text-xs">
            <Clock className="w-3.5 h-3.5 text-dark-400 flex-shrink-0" />
            <span className="text-dark-400">上报：{hazard.createdAt.split(' ')[0]}</span>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          {hazard.status === 'pending' && (
            <button
              onClick={handleAction}
              className="flex-1 btn-primary text-sm py-1.5"
            >
              分配整改
            </button>
          )}
          {hazard.status === 'processing' && (
            <div className="flex-1 flex gap-2">
              <button className="flex-1 btn-secondary text-sm py-1.5 text-xs">查看进度</button>
              <button
                onClick={handleAction}
                className="flex-1 btn-primary text-sm py-1.5 text-xs"
              >
                整改完成
              </button>
            </div>
          )}
          {hazard.status === 'resolved' && (
            <button
              onClick={handleAction}
              className="flex-1 btn-secondary text-sm py-1.5 text-green-400 border-green-500/30 hover:bg-green-500/10"
            >
              验证闭环
            </button>
          )}
          {hazard.status === 'verified' && (
            <button className="flex-1 btn-secondary text-sm py-1.5 text-purple-400 border-purple-500/30 hover:bg-purple-500/10">
              查看详情
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateHazardModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Hazard, 'id' | 'status' | 'createdAt'>) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<Hazard['level']>('medium');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTitle('');
      setDescription('');
      setLevel('medium');
      setSelectedFile(null);
      setPreviewUrl('');
      setPhotoBase64('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
    setPhotoBase64('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = () => {
    if (title.trim().length < 5) return;
    if (description.trim().length < 10) return;

    const finalPhotoUrl =
      photoBase64 || `https://picsum.photos/400/300?random=${Date.now()}`;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      level,
      photoUrl: finalPhotoUrl,
    });
  };

  const titleValid = title.trim().length >= 5;
  const descValid = description.trim().length >= 10;
  const isValid = titleValid && descValid;

  const titleTouched = title.length > 0;
  const descTouched = description.length > 0;

  const showTitleError = titleTouched && !titleValid;
  const showDescError = descTouched && !descValid;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="上报安全隐患"
      subtitle="请填写隐患相关信息，便于后续整改跟踪"
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary text-sm">
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={cn('btn-primary text-sm', !isValid && 'opacity-50 cursor-not-allowed')}
          >
            提交上报
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1.5">
            隐患标题 <span className="text-fire-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入隐患标题，如：消防通道堆放杂物（至少5个字）"
            className={cn(
              'input-field',
              showTitleError && 'border-red-500/70 focus:border-red-500'
            )}
            maxLength={100}
          />
          <div className="flex justify-between mt-1.5">
            {showTitleError ? (
              <p className="text-xs text-red-400">请填写隐患标题（至少5个字）</p>
            ) : (
              <p className="text-xs text-dark-500">至少 5 个字</p>
            )}
            <p className="text-xs text-dark-500">已输入 {title.trim().length}/100 字</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1.5">
            隐患描述 <span className="text-fire-400">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请详细描述隐患位置、情况等（至少10个字）"
            rows={4}
            className={cn(
              'input-field resize-none',
              showDescError && 'border-red-500/70 focus:border-red-500'
            )}
            maxLength={500}
          />
          <div className="flex justify-between mt-1.5">
            {showDescError ? (
              <p className="text-xs text-red-400">请填写隐患描述（至少10个字）</p>
            ) : (
              <p className="text-xs text-dark-500">至少 10 个字</p>
            )}
            <p className="text-xs text-dark-500">已输入 {description.trim().length}/500 字</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1.5">
            危险等级
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['low', 'medium', 'high', 'critical'] as const).map((lv) => {
              const cfg = levelConfig[lv];
              const isSelected = level === lv;
              return (
                <button
                  key={lv}
                  onClick={() => setLevel(lv)}
                  className={cn(
                    'px-3 py-2 rounded-lg border text-sm font-medium transition-all',
                    isSelected
                      ? `${cfg.color} border-current shadow-lg`
                      : 'bg-dark-700/50 border-dark-600 text-dark-300 hover:border-dark-500'
                  )}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1.5">
            隐患照片
          </label>
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileChange}
            />

            {previewUrl ? (
              <div className="relative">
                <div className="relative rounded-lg overflow-hidden border border-dark-600 aspect-video h-40">
                  <img
                    src={previewUrl}
                    alt="预览"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900/60 to-transparent pointer-events-none"></div>
                </div>
                <button
                  onClick={clearFile}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-dark-900/80 backdrop-blur-sm border border-dark-600 flex items-center justify-center text-dark-300 hover:text-white hover:bg-dark-800 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-700/40 border border-dark-600/50">
                  <ImageIcon className="w-4 h-4 text-dark-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-dark-200 truncate">{selectedFile?.name}</p>
                    <p className="text-xs text-dark-500">{selectedFile ? formatFileSize(selectedFile.size) : ''}</p>
                  </div>
                </div>
              </div>
            ) : (
              <label className="block cursor-pointer">
                <div className="relative rounded-lg overflow-hidden border-2 border-dashed border-dark-600 hover:border-fire-500/50 transition-all aspect-video h-40 flex flex-col items-center justify-center bg-dark-700/30 group">
                  <img
                    src="https://picsum.photos/400/225?random=placeholder"
                    alt="占位图"
                    className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-dark-900/50"></div>
                  <div className="relative flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-dark-700/80 backdrop-blur-sm border border-dark-600 flex items-center justify-center group-hover:border-fire-500/50 transition-all">
                      <Upload className="w-5 h-5 text-dark-300 group-hover:text-fire-400 transition-colors" />
                    </div>
                    <span className="text-sm text-dark-200 group-hover:text-white transition-colors">点击上传隐患照片</span>
                    <span className="text-xs text-dark-500">支持 JPG、PNG、GIF 格式</span>
                  </div>
                </div>
              </label>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function AssignHazardModal({
  hazard,
  personnel,
  onClose,
  onSubmit,
}: {
  hazard: Hazard | null;
  personnel: { id: string; name: string; department: string; position: string }[];
  onClose: () => void;
  onSubmit: (
    id: string,
    responsibleId: string,
    responsibleName: string,
    deadline: string
  ) => void;
}) {
  const [responsibleId, setResponsibleId] = useState('');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    if (hazard) {
      setResponsibleId(personnel[0]?.id || '');
      setDeadline(formatDate(addDays(7)));
    }
  }, [hazard, personnel]);

  if (!hazard) return null;

  const handleSubmit = () => {
    const person = personnel.find((p) => p.id === responsibleId);
    if (!person || !deadline) return;
    onSubmit(hazard.id, person.id, person.name, deadline);
  };

  const level = levelConfig[hazard.level];
  const isValid = responsibleId && deadline;

  return (
    <Modal
      open={!!hazard}
      onClose={onClose}
      title="整改派单"
      subtitle="分配整改责任人并设置截止日期"
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary text-sm">
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={cn('btn-primary text-sm', !isValid && 'opacity-50 cursor-not-allowed')}
          >
            确认派单
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-dark-700/40 border border-dark-600/50">
          <div className="flex items-start gap-3">
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-dark-600">
              <img
                src={hazard.photoUrl}
                alt={hazard.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://picsum.photos/400/300?random=' + hazard.id;
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-white truncate">{hazard.title}</h3>
                <span className={`badge border ${level.color} flex-shrink-0`}>
                  {level.label}危
                </span>
              </div>
              <p className="text-xs text-dark-400 line-clamp-2">{hazard.description}</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-dark-500">
                <Clock className="w-3 h-3" />
                <span>上报时间：{hazard.createdAt}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1.5">
            整改责任人 <span className="text-fire-400">*</span>
          </label>
          <select
            value={responsibleId}
            onChange={(e) => setResponsibleId(e.target.value)}
            className="input-field"
          >
            <option value="">请选择责任人</option>
            {personnel.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} - {p.department} / {p.position}
              </option>
            ))}
          </select>
          {responsibleId && (
            <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-fire-500/10 border border-fire-500/20">
              <User className="w-4 h-4 text-fire-400" />
              <span className="text-sm text-fire-300">
                {personnel.find((p) => p.id === responsibleId)?.name} 将负责此隐患的整改工作
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1.5">
            整改截止日期 <span className="text-fire-400">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={formatDate()}
              className="input-field pl-9"
            />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setDeadline(formatDate(addDays(3)))}
              className="px-2 py-1 text-xs bg-dark-700/50 border border-dark-600 rounded-md text-dark-300 hover:bg-dark-600/50 transition-all"
            >
              +3天
            </button>
            <button
              onClick={() => setDeadline(formatDate(addDays(7)))}
              className="px-2 py-1 text-xs bg-dark-700/50 border border-dark-600 rounded-md text-dark-300 hover:bg-dark-600/50 transition-all"
            >
              +7天
            </button>
            <button
              onClick={() => setDeadline(formatDate(addDays(14)))}
              className="px-2 py-1 text-xs bg-dark-700/50 border border-dark-600 rounded-md text-dark-300 hover:bg-dark-600/50 transition-all"
            >
              +14天
            </button>
            <button
              onClick={() => setDeadline(formatDate(addDays(30)))}
              className="px-2 py-1 text-xs bg-dark-700/50 border border-dark-600 rounded-md text-dark-300 hover:bg-dark-600/50 transition-all"
            >
              +30天
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
