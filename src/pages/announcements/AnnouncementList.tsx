import { useState, useEffect } from 'react';
import { Bell, Plus, Pin, Calendar, User, ChevronRight, Search, AlertTriangle, Info, FileText, Megaphone, Edit, Trash2, CheckCircle, X, PinOff, LucideIcon } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Announcement } from '@/types';
import Modal from '@/components/Modal';
import { formatDateTime } from '@/lib/utils';

const typeConfig = {
  training: { label: '培训通知', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: FileText },
  notice: { label: '通知公告', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: Bell },
  warning: { label: '安全警示', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: AlertTriangle },
  info: { label: '知识科普', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Info },
};

type ToastType = 'success' | 'error';

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

export default function AnnouncementList() {
  const {
    announcements,
    showAnnouncementCreate,
    setShowAnnouncementCreate,
    showAnnouncementEdit,
    setShowAnnouncementEdit,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    toggleAnnouncementPin,
  } = useStore();

  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'success', visible: false });

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type, visible: true });
  };

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  const filteredAnnouncements = announcements
    .filter((a) => {
      const matchSearch = a.title.toLowerCase().includes(searchText.toLowerCase());
      const matchType = typeFilter === 'all' || a.type === typeFilter;
      return matchSearch && matchType;
    })
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
    });

  const stats = {
    total: announcements.length,
    pinned: announcements.filter((a) => a.isPinned).length,
    training: announcements.filter((a) => a.type === 'training').length,
    warning: announcements.filter((a) => a.type === 'warning').length,
  };

  const handleAddSuccess = () => {
    showToast('公告发布成功');
  };

  const handleUpdateSuccess = () => {
    showToast('公告编辑成功');
    if (showAnnouncementEdit && selectedAnnouncement?.id === showAnnouncementEdit.id) {
      const updated = announcements.find((a) => a.id === showAnnouncementEdit.id);
      if (updated) setSelectedAnnouncement(updated);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这条公告吗？此操作不可恢复。')) {
      deleteAnnouncement(id);
      if (selectedAnnouncement?.id === id) {
        setSelectedAnnouncement(null);
      }
      showToast('公告删除成功');
    }
  };

  const handleTogglePin = (id: string) => {
    toggleAnnouncementPin(id);
    const ann = announcements.find((a) => a.id === id);
    if (ann) {
      showToast(ann.isPinned ? '已取消置顶' : '已置顶');
    }
    if (selectedAnnouncement?.id === id) {
      const updated = { ...selectedAnnouncement, isPinned: !selectedAnnouncement.isPinned };
      setSelectedAnnouncement(updated);
    }
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
            {filteredAnnouncements.length > 0 ? (
              filteredAnnouncements.map((announcement) => (
                <AnnouncementItem
                  key={announcement.id}
                  announcement={announcement}
                  selected={selectedAnnouncement?.id === announcement.id}
                  onClick={() => setSelectedAnnouncement(announcement)}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <Megaphone className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                <p className="text-dark-400">暂无公告数据</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass-card p-4">
          {selectedAnnouncement ? (
            <AnnouncementDetail
              announcement={selectedAnnouncement}
              onEdit={() => setShowAnnouncementEdit(selectedAnnouncement)}
              onDelete={() => handleDelete(selectedAnnouncement.id)}
              onTogglePin={() => handleTogglePin(selectedAnnouncement.id)}
            />
          ) : (
            <div className="h-full min-h-96 flex flex-col items-center justify-center text-center">
              <Megaphone className="w-16 h-16 text-dark-600 mb-4" />
              <p className="text-dark-400">点击左侧公告查看详情</p>
            </div>
          )}
        </div>
      </div>

      {(showAnnouncementCreate || showAnnouncementEdit) && (
        <AnnouncementFormModal
          mode={showAnnouncementEdit ? 'edit' : 'create'}
          initialData={showAnnouncementEdit || undefined}
          onClose={() => {
            setShowAnnouncementCreate(false);
            setShowAnnouncementEdit(null);
          }}
          onSubmit={(data) => {
            if (showAnnouncementEdit) {
              updateAnnouncement(showAnnouncementEdit.id, data);
              handleUpdateSuccess();
            } else {
              addAnnouncement(data);
              handleAddSuccess();
            }
          }}
        />
      )}

      {toast.visible && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
              toast.type === 'success'
                ? 'bg-green-500/20 border-green-500/30 text-green-400'
                : 'bg-red-500/20 border-red-500/30 text-red-400'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast((prev) => ({ ...prev, visible: false }))}
              className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: LucideIcon; color: string }) {
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
  selected,
  onClick,
}: {
  announcement: Announcement;
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
            {announcement.isPinned && <Pin className="w-3.5 h-3.5 text-fire-400 fill-fire-400" />}
            <h3 className="font-medium text-white truncate">{announcement.title}</h3>
            <span className={`badge ${type.color} border flex-shrink-0`}>{type.label}</span>
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

function AnnouncementDetail({
  announcement,
  onEdit,
  onDelete,
  onTogglePin,
}: {
  announcement: Announcement;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}) {
  const type = typeConfig[announcement.type];
  const TypeIcon = type.icon;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-xl ${type.color} border flex items-center justify-center`}>
          <TypeIcon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {announcement.isPinned && <Pin className="w-4 h-4 text-fire-400 fill-fire-400 flex-shrink-0" />}
            <h2 className="text-lg font-semibold text-white truncate">{announcement.title}</h2>
            <span className={`badge ${type.color} border flex-shrink-0`}>{type.label}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-dark-400">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {announcement.author}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDateTime(new Date(announcement.publishDate))}
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

      <div className="mt-4 pt-4 border-t border-dark-700 flex flex-wrap gap-2">
        <button onClick={onEdit} className="flex-1 btn-secondary text-sm flex items-center justify-center gap-2 min-w-[100px]">
          <Edit className="w-4 h-4" />
          编辑公告
        </button>
        <button
          onClick={onTogglePin}
          className="flex-1 btn-secondary text-sm flex items-center justify-center gap-2 min-w-[100px]"
        >
          {announcement.isPinned ? (
            <>
              <PinOff className="w-4 h-4" />
              取消置顶
            </>
          ) : (
            <>
              <Pin className="w-4 h-4" />
              置顶
            </>
          )}
        </button>
        <button
          onClick={onDelete}
          className="flex-1 btn-secondary text-sm text-red-400 border-red-500/30 hover:bg-red-500/10 flex items-center justify-center gap-2 min-w-[100px]"
        >
          <Trash2 className="w-4 h-4" />
          删除
        </button>
      </div>
    </div>
  );
}

interface AnnouncementFormData {
  title: string;
  content: string;
  type: 'training' | 'notice' | 'warning' | 'info';
  isPinned: boolean;
  expireDate?: string;
  author: string;
}

interface AnnouncementFormModalProps {
  mode: 'create' | 'edit';
  initialData?: Announcement;
  onClose: () => void;
  onSubmit: (data: Omit<Announcement, 'id' | 'publishDate'>) => void;
}

function AnnouncementFormModal({ mode, initialData, onClose, onSubmit }: AnnouncementFormModalProps) {
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: initialData?.title || '',
    content: initialData?.content || '',
    type: initialData?.type || 'notice',
    isPinned: initialData?.isPinned || false,
    expireDate: initialData?.expireDate || '',
    author: initialData?.author || '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof AnnouncementFormData, string>>>({});

  const validate = () => {
    const newErrors: Partial<Record<keyof AnnouncementFormData, string>> = {};
    if (!formData.title.trim()) newErrors.title = '请输入公告标题';
    if (!formData.content.trim()) newErrors.content = '请输入公告内容';
    if (!formData.author.trim()) newErrors.author = '请输入作者';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const submitData: Omit<Announcement, 'id' | 'publishDate'> = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      type: formData.type,
      isPinned: formData.isPinned,
      author: formData.author.trim(),
    };
    if (formData.expireDate) {
      submitData.expireDate = formData.expireDate;
    }
    onSubmit(submitData);
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={mode === 'create' ? '发布公告' : '编辑公告'}
      subtitle={mode === 'create' ? '填写公告信息后点击发布' : '修改公告信息后保存'}
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">
            取消
          </button>
          <button onClick={handleSubmit} className="btn-primary">
            {mode === 'create' ? '发布公告' : '保存修改'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1.5">公告标题 <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="请输入公告标题"
            className={`input-field ${errors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : ''}`}
          />
          {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">公告类型 <span className="text-red-400">*</span></label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as AnnouncementFormData['type'] })}
              className="input-field"
            >
              <option value="training">培训通知</option>
              <option value="notice">通知公告</option>
              <option value="warning">安全警示</option>
              <option value="info">知识科普</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">作者 <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              placeholder="请输入作者名称"
              className={`input-field ${errors.author ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : ''}`}
            />
            {errors.author && <p className="mt-1 text-xs text-red-400">{errors.author}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">有效期（可选）</label>
            <input
              type="date"
              value={formData.expireDate}
              onChange={(e) => setFormData({ ...formData, expireDate: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isPinned}
                onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                className="w-4 h-4 rounded bg-dark-700 border-dark-600 text-fire-600 focus:ring-fire-500 focus:ring-offset-0"
              />
              <span className="text-sm text-dark-200">置顶公告</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1.5">公告内容 <span className="text-red-400">*</span></label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="请输入公告内容..."
            rows={8}
            className={`input-field resize-none ${errors.content ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : ''}`}
          />
          {errors.content && <p className="mt-1 text-xs text-red-400">{errors.content}</p>}
        </div>
      </div>
    </Modal>
  );
}
