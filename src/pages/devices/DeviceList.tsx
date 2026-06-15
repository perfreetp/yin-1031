import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, Monitor, MapPin, Clock, Activity, Wrench, Calendar, Plus, MoreVertical, CheckCircle, User, FileText, XCircle, AlertTriangle, ChevronLeft, ChevronRight, MonitorPlay } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Device, DeviceBooking, Personnel, BookingConflict } from '@/types';
import Modal from '@/components/Modal';
import { formatDateTime, addHours, formatDate } from '@/lib/utils';

const statusConfig = {
  available: { label: '可用', color: 'bg-green-500', textColor: 'text-green-400', bgColor: 'bg-green-500/20 border-green-500/30' },
  'in-use': { label: '使用中', color: 'bg-blue-500', textColor: 'text-blue-400', bgColor: 'bg-blue-500/20 border-blue-500/30' },
  maintenance: { label: '维护中', color: 'bg-yellow-500', textColor: 'text-yellow-400', bgColor: 'bg-yellow-500/20 border-yellow-500/30' },
  offline: { label: '离线', color: 'bg-gray-500', textColor: 'text-gray-400', bgColor: 'bg-gray-500/20 border-gray-500/30' },
};

const bookingStatusConfig = {
  upcoming: { label: '即将开始', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  active: { label: '使用中', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  completed: { label: '已完成', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  cancelled: { label: '已取消', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export default function DeviceList() {
  const {
    devices,
    bookings,
    personnel,
    showDeviceBooking,
    setShowDeviceBooking,
    showDeviceBookingCalendar,
    setShowDeviceBookingCalendar,
    addBooking,
    completeBooking,
    cancelBooking,
    checkBookingConflict,
  } = useStore();

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [toast, setToast] = useState<string>('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const getDeviceBookings = (deviceId: string) => {
    return bookings.filter((b) => b.deviceId === deviceId);
  };

  const getActiveBooking = (deviceId: string) => {
    return bookings.find((b) => b.deviceId === deviceId && (b.status === 'active' || b.status === 'upcoming'));
  };

  const filteredDevices = devices.filter((device) => {
    const matchSearch = device.name.toLowerCase().includes(searchText.toLowerCase()) || device.model.toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = statusFilter === 'all' || device.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: devices.length,
    available: devices.filter((d) => d.status === 'available').length,
    inUse: devices.filter((d) => d.status === 'in-use').length,
    maintenance: devices.filter((d) => d.status === 'maintenance').length,
  };

  const handleCompleteBooking = (bookingId: string) => {
    completeBooking(bookingId);
    showToast('预约已完成！');
  };

  const handleCancelBooking = (bookingId: string) => {
    if (confirm('确定取消该预约？')) {
      cancelBooking(bookingId);
      showToast('预约已取消');
    }
  };

  const handleAddBooking = (data: Omit<DeviceBooking, 'id' | 'createdAt' | 'status'>) => {
    addBooking(data);
    showToast('预约创建成功！');
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">设备管理</h1>
          <p className="text-sm text-dark-400 mt-1">管理 VR 头显设备和预约</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          添加设备
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="设备总数" value={stats.total} icon={Monitor} color="from-blue-500 to-blue-700" />
        <StatCard label="可用设备" value={stats.available} icon={Activity} color="from-green-500 to-emerald-700" />
        <StatCard label="使用中" value={stats.inUse} icon={Clock} color="from-fire-500 to-fire-700" />
        <StatCard label="维护中" value={stats.maintenance} icon={Wrench} color="from-yellow-500 to-orange-600" />
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="text"
                placeholder="搜索设备..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-64 pl-9 pr-4 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-dark-100 placeholder-dark-400 focus:outline-none focus:border-fire-500/50 transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-dark-100 focus:outline-none focus:border-fire-500/50 transition-all"
            >
              <option value="all">全部状态</option>
              <option value="available">可用</option>
              <option value="in-use">使用中</option>
              <option value="maintenance">维护中</option>
              <option value="offline">离线</option>
            </select>
          </div>
          <button
            onClick={() => setShowDeviceBookingCalendar(true)}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Calendar className="w-4 h-4" />
            预约日历
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {filteredDevices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              bookings={getDeviceBookings(device.id)}
              activeBooking={getActiveBooking(device.id)}
              onBook={() => setShowDeviceBooking(device)}
              onComplete={handleCompleteBooking}
            />
          ))}
        </div>

        {filteredDevices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-dark-400">暂无设备数据</p>
          </div>
        )}
      </div>

      <BookDeviceModal
        open={!!showDeviceBooking}
        device={showDeviceBooking}
        onClose={() => setShowDeviceBooking(null)}
        devices={devices}
        personnel={personnel}
        onSubmit={handleAddBooking}
        checkBookingConflict={checkBookingConflict}
      />

      <BookingCalendarModal
        open={showDeviceBookingCalendar}
        onClose={() => setShowDeviceBookingCalendar(false)}
        bookings={bookings}
        devices={devices}
        onComplete={handleCompleteBooking}
        onCancel={handleCancelBooking}
      />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl bg-green-600/90 text-white shadow-xl shadow-green-900/30 border border-green-500/40 animate-fade-in-up flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {toast}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string }) {
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

interface DeviceCardProps {
  device: Device;
  bookings: DeviceBooking[];
  activeBooking?: DeviceBooking;
  onBook: () => void;
  onComplete: (id: string) => void;
}

function DeviceCard({ device, bookings, activeBooking, onBook, onComplete }: DeviceCardProps) {
  const status = statusConfig[device.status];
  const [showDetail, setShowDetail] = useState(false);

  const completedBookings = bookings.filter((b) => b.status === 'completed').length;
  const upcomingBookings = bookings.filter((b) => b.status === 'upcoming' || b.status === 'active').length;

  return (
    <>
      <div className="glass-card-hover p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${status.bgColor} border flex items-center justify-center`}>
              <Monitor className={`w-6 h-6 ${status.textColor}`} />
            </div>
            <div>
              <h3 className="font-semibold text-white">{device.name}</h3>
              <p className="text-sm text-dark-400">{device.model}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1.5 text-xs ${status.textColor}`}>
              <span className={`w-2 h-2 rounded-full ${status.color} ${device.status === 'in-use' ? 'animate-pulse' : ''}`}></span>
              {status.label}
            </span>
            <button className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/50 transition-all">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-dark-400" />
            <span className="text-dark-300">{device.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Activity className="w-4 h-4 text-dark-400" />
            <span className="text-dark-300">使用 {device.usageCount} 次</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-blue-400">预约 {bookings.length} 次</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Clock className="w-3.5 h-3.5 text-dark-400" />
            <span className="text-dark-400">待/进行 {upcomingBookings} · 已完成 {completedBookings}</span>
          </div>
        </div>

        {activeBooking && (
          <div className="mt-3 pt-3 border-t border-dark-700/50">
            <div className="text-xs text-dark-400 mb-1.5">当前预约</div>
            <div className="bg-dark-700/30 rounded-lg p-2.5 border border-dark-700/50">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-dark-400" />
                  <span className="text-sm text-white font-medium">{activeBooking.personnelName}</span>
                </div>
                <span className={`badge border text-[10px] px-2 py-0.5 ${bookingStatusConfig[activeBooking.status].color}`}>
                  {bookingStatusConfig[activeBooking.status].label}
                </span>
              </div>
              <div className="text-xs text-dark-300 mt-1">
                {activeBooking.startTime.slice(0, 16)} ~ {activeBooking.endTime.slice(11, 16)}
              </div>
              {activeBooking.purpose && (
                <div className="text-xs text-dark-400 mt-1 truncate">
                  用途：{activeBooking.purpose}
                </div>
              )}
            </div>
          </div>
        )}

        {device.lastUsed && !activeBooking && (
          <div className="mt-3 pt-3 border-t border-dark-700/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-dark-400">上次使用</span>
              <span className="text-dark-300">{device.lastUsed}</span>
            </div>
          </div>
        )}

        {device.currentUser && !activeBooking && (
          <div className="mt-3 pt-3 border-t border-dark-700/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-dark-400">当前使用</span>
              <span className="text-blue-400 font-medium">{device.currentUser}</span>
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          {(device.status === 'available' || device.status === 'in-use') && (
            <button
              onClick={onBook}
              className="flex-1 btn-primary text-sm py-1.5"
            >
              立即预约
            </button>
          )}
          {activeBooking && (
            <button
              onClick={() => setShowDetail(true)}
              className="flex-1 btn-secondary text-sm py-1.5 text-blue-400 border-blue-500/30"
            >
              查看详情
            </button>
          )}
          {!activeBooking && device.status === 'in-use' && (
            <button
              onClick={() => setShowDetail(true)}
              className="flex-1 btn-secondary text-sm py-1.5 text-blue-400 border-blue-500/30"
            >
              查看详情
            </button>
          )}
          {device.status === 'maintenance' && (
            <button className="flex-1 btn-secondary text-sm py-1.5">维护记录</button>
          )}
          {device.status === 'offline' && (
            <button className="flex-1 btn-secondary text-sm py-1.5">重新连接</button>
          )}
        </div>
      </div>

      {showDetail && activeBooking && (
        <Modal
          open={showDetail}
          onClose={() => setShowDetail(false)}
          title="预约详情"
          subtitle={`${device.name} · ${device.model}`}
          size="md"
          footer={
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDetail(false)} className="btn-secondary px-5">
                关闭
              </button>
              {activeBooking.status === 'active' && (
                <button
                  onClick={() => {
                    onComplete(activeBooking.id);
                    setShowDetail(false);
                  }}
                  className="btn-primary px-5 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  完成预约
                </button>
              )}
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dark-700/30 rounded-xl p-4 border border-dark-700/50">
                <div className="text-xs text-dark-400 mb-1">使用人</div>
                <div className="text-white font-medium">{activeBooking.personnelName}</div>
              </div>
              <div className="bg-dark-700/30 rounded-xl p-4 border border-dark-700/50">
                <div className="text-xs text-dark-400 mb-1">状态</div>
                <span className={`badge border ${bookingStatusConfig[activeBooking.status].color}`}>
                  {bookingStatusConfig[activeBooking.status].label}
                </span>
              </div>
              <div className="bg-dark-700/30 rounded-xl p-4 border border-dark-700/50">
                <div className="text-xs text-dark-400 mb-1">开始时间</div>
                <div className="text-white text-sm">{activeBooking.startTime}</div>
              </div>
              <div className="bg-dark-700/30 rounded-xl p-4 border border-dark-700/50">
                <div className="text-xs text-dark-400 mb-1">结束时间</div>
                <div className="text-white text-sm">{activeBooking.endTime}</div>
              </div>
            </div>
            <div className="bg-dark-700/30 rounded-xl p-4 border border-dark-700/50">
              <div className="text-xs text-dark-400 mb-1">使用用途</div>
              <div className="text-white text-sm">{activeBooking.purpose || '未填写'}</div>
            </div>
            <div className="bg-dark-700/30 rounded-xl p-4 border border-dark-700/50">
              <div className="text-xs text-dark-400 mb-1">创建时间</div>
              <div className="text-white text-sm">{activeBooking.createdAt}</div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

interface BookDeviceModalProps {
  open: boolean;
  device: Device | null;
  onClose: () => void;
  devices: Device[];
  personnel: Personnel[];
  onSubmit: (data: Omit<DeviceBooking, 'id' | 'createdAt' | 'status'>) => void;
  checkBookingConflict: (deviceId: string, startTime: string, endTime: string, excludeBookingId?: string) => BookingConflict;
}

function BookDeviceModal({ open, device, onClose, devices, personnel, onSubmit, checkBookingConflict }: BookDeviceModalProps) {
  const now = new Date();
  const defaultStart = formatDateTime(now);
  const defaultEnd = formatDateTime(addHours(2, now));

  const [form, setForm] = useState({
    deviceId: device?.id || '',
    startTime: defaultStart.replace(' ', 'T').slice(0, 16),
    endTime: defaultEnd.replace(' ', 'T').slice(0, 16),
    personnelId: '',
    purpose: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [conflict, setConflict] = useState<BookingConflict | null>(null);

  const detectConflict = useCallback(() => {
    if (!form.deviceId || !form.startTime || !form.endTime) {
      setConflict(null);
      return;
    }
    const startStr = form.startTime.replace('T', ' ') + ':00';
    const endStr = form.endTime.replace('T', ' ') + ':00';
    const result = checkBookingConflict(form.deviceId, startStr, endStr);
    setConflict(result);
  }, [form.deviceId, form.startTime, form.endTime, checkBookingConflict]);

  useEffect(() => {
    detectConflict();
  }, [detectConflict]);

  useEffect(() => {
    if (device) {
      setForm((prev) => ({ ...prev, deviceId: device.id }));
    }
  }, [device]);

  useEffect(() => {
    if (!open) {
      setConflict(null);
    }
  }, [open]);

  const availableDevices = devices.filter((d) => d.status === 'available' || d.status === 'in-use' || (device && d.id === device.id));

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.deviceId) newErrors.deviceId = '请选择设备';
    if (!form.startTime) newErrors.startTime = '请选择开始时间';
    if (!form.endTime) newErrors.endTime = '请选择结束时间';
    if (!form.personnelId) newErrors.personnelId = '请选择使用人';
    if (!form.purpose.trim()) newErrors.purpose = '请填写使用用途';
    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      newErrors.endTime = '结束时间必须晚于开始时间';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const canSubmit = validate() && !conflict?.hasConflict;

  const handleSubmit = () => {
    if (!canSubmit) return;

    const selectedDevice = devices.find((d) => d.id === form.deviceId);
    const selectedPersonnel = personnel.find((p) => p.id === form.personnelId);

    onSubmit({
      deviceId: form.deviceId,
      deviceName: selectedDevice?.name,
      personnelId: form.personnelId,
      personnelName: selectedPersonnel?.name || '',
      startTime: form.startTime.replace('T', ' ') + ':00',
      endTime: form.endTime.replace('T', ' ') + ':00',
      purpose: form.purpose.trim(),
    });

    setForm({
      deviceId: '',
      startTime: defaultStart.replace(' ', 'T').slice(0, 16),
      endTime: defaultEnd.replace(' ', 'T').slice(0, 16),
      personnelId: '',
      purpose: '',
    });
    setErrors({});
    setConflict(null);
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        onClose();
        setErrors({});
        setConflict(null);
      }}
      title="预约设备"
      subtitle="选择设备、时间段和使用人"
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary px-5">
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`btn-primary px-5 flex items-center gap-2 ${!canSubmit ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Calendar className="w-4 h-4" />
            确认预约
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {conflict?.hasConflict && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 animate-pulse">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-red-400 font-medium text-sm mb-2">预约时间冲突</h4>
                <div className="space-y-2">
                  {conflict.conflictingBookings.map((cb) => (
                    <div key={cb.id} className="text-xs text-red-300/80">
                      <span className="font-medium text-red-400">{cb.personnelName}</span>
                      <span className="mx-1.5">·</span>
                      <span>{cb.startTime.slice(0, 16)} ~ {cb.endTime.slice(11, 16)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1.5">选择设备 *</label>
          <select
            value={form.deviceId}
            onChange={(e) => setForm({ ...form, deviceId: e.target.value })}
            className={`input-field ${errors.deviceId ? 'border-red-500/50' : ''}`}
          >
            <option value="">请选择设备</option>
            {availableDevices.map((d) => (
              <option key={d.id} value={d.id}>
              {d.name}（{d.model} · {d.location}）
            </option>
            ))}
          </select>
          {errors.deviceId && <p className="text-xs text-red-400 mt-1">{errors.deviceId}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">开始时间 *</label>
            <input
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              className={`input-field ${errors.startTime ? 'border-red-500/50' : ''}`}
            />
            {errors.startTime && <p className="text-xs text-red-400 mt-1">{errors.startTime}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">结束时间 *</label>
            <input
              type="datetime-local"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              className={`input-field ${errors.endTime ? 'border-red-500/50' : ''}`}
            />
            {errors.endTime && <p className="text-xs text-red-400 mt-1">{errors.endTime}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1.5">使用人 *</label>
          <select
            value={form.personnelId}
            onChange={(e) => setForm({ ...form, personnelId: e.target.value })}
            className={`input-field ${errors.personnelId ? 'border-red-500/50' : ''}`}
          >
            <option value="">请选择使用人</option>
            {personnel.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}（{p.department} · {p.position}）
              </option>
            ))}
          </select>
          {errors.personnelId && <p className="text-xs text-red-400 mt-1">{errors.personnelId}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1.5">使用用途 *</label>
          <textarea
            rows={3}
            placeholder="请描述使用用途..."
            value={form.purpose}
            onChange={(e) => setForm({ ...form, purpose: e.target.value })}
            className={`input-field resize-none ${errors.purpose ? 'border-red-500/50' : ''}`}
          />
          {errors.purpose && <p className="text-xs text-red-400 mt-1">{errors.purpose}</p>}
        </div>
      </div>
    </Modal>
  );
}

const bookingBlockColors = {
  upcoming: 'bg-blue-500/60 border-blue-400/80 hover:bg-blue-500/80',
  active: 'bg-green-500/60 border-green-400/80 hover:bg-green-500/80',
  completed: 'bg-gray-500/40 border-gray-400/60 hover:bg-gray-500/60',
  cancelled: 'bg-red-500/60 border-red-400/80 hover:bg-red-500/80',
};

interface BookingCalendarModalProps {
  open: boolean;
  onClose: () => void;
  bookings: DeviceBooking[];
  devices: Device[];
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
}

function BookingCalendarModal({ open, onClose, bookings, devices, onComplete, onCancel }: BookingCalendarModalProps) {
  const [viewMode, setViewMode] = useState<'byDevice' | 'byDate'>('byDate');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [selectedBooking, setSelectedBooking] = useState<DeviceBooking | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const weekDates = useMemo(() => {
    const dates: string[] = [];
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + weekOffset * 7);
    const dayOfWeek = baseDate.getDay();
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(formatDate(d));
    }
    return dates;
  }, [weekOffset]);

  const getBookingsForDeviceAndDate = useCallback((deviceId: string, date: string) => {
    return bookings.filter((b) => {
      if (b.deviceId !== deviceId) return false;
      const bookingDate = b.startTime.slice(0, 10);
      const bookingEndDate = b.endTime.slice(0, 10);
      return date >= bookingDate && date <= bookingEndDate;
    });
  }, [bookings]);

  const getBookingsForDate = useCallback((date: string) => {
    return bookings.filter((b) => {
      const bookingDate = b.startTime.slice(0, 10);
      const bookingEndDate = b.endTime.slice(0, 10);
      return date >= bookingDate && date <= bookingEndDate;
    });
  }, [bookings]);

  const calculateBookingPosition = useCallback((booking: DeviceBooking, date: string) => {
    const startMinutes = 8 * 60;
    const endMinutes = 20 * 60;
    const totalMinutes = endMinutes - startMinutes;

    const bookingStart = new Date(booking.startTime);
    const bookingEnd = new Date(booking.endTime);
    const currentDate = new Date(date);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const blockStart = bookingStart < currentDate ? currentDate : bookingStart;
    const blockEnd = bookingEnd > nextDate ? nextDate : bookingEnd;

    const blockStartMinutes = blockStart.getHours() * 60 + blockStart.getMinutes();
    const blockEndMinutes = blockEnd.getHours() * 60 + blockEnd.getMinutes();

    const left = ((blockStartMinutes - startMinutes) / totalMinutes) * 100;
    const width = ((blockEndMinutes - blockStartMinutes) / totalMinutes) * 100;

    return {
      left: Math.max(0, Math.min(100, left)),
      width: Math.max(1, Math.min(100 - left, width)),
    };
  }, []);

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let h = 8; h <= 20; h += 2) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }, []);

  const handleBookingClick = (booking: DeviceBooking) => {
    setSelectedBooking(booking);
  };

  const handleCancelBooking = () => {
    if (selectedBooking && confirm('确定取消该预约？')) {
      onCancel(selectedBooking.id);
      setSelectedBooking(null);
    }
  };

  const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="预约日历"
      subtitle="查看和管理所有设备预约"
      size="xl"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex bg-dark-700/30 rounded-lg p-1 border border-dark-700/50">
            <button
              onClick={() => setViewMode('byDate')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                viewMode === 'byDate'
                  ? 'bg-fire-500/20 text-fire-400 border border-fire-500/30'
                  : 'text-dark-300 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              按日期查看
            </button>
            <button
              onClick={() => setViewMode('byDevice')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                viewMode === 'byDevice'
                  ? 'bg-fire-500/20 text-fire-400 border border-fire-500/30'
                  : 'text-dark-300 hover:text-white'
              }`}
            >
              <MonitorPlay className="w-4 h-4" />
              按设备查看
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1 px-3 py-1.5 bg-dark-700/30 rounded-lg border border-dark-700/50">
              {[
                { status: 'upcoming', label: '即将开始', color: 'bg-blue-500' },
                { status: 'active', label: '使用中', color: 'bg-green-500' },
                { status: 'completed', label: '已完成', color: 'bg-gray-500' },
                { status: 'cancelled', label: '已取消', color: 'bg-red-500' },
              ].map((item) => (
                <div key={item.status} className="flex items-center gap-1.5 mr-3 last:mr-0">
                  <span className={`w-2.5 h-2.5 rounded ${item.color}`}></span>
                  <span className="text-xs text-dark-300">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {viewMode === 'byDevice' ? (
          <div className="flex gap-4 h-[60vh]">
            <div className="w-56 flex-shrink-0 space-y-2 overflow-y-auto pr-1">
              <div className="text-xs font-medium text-dark-400 mb-2 px-2">选择设备</div>
              {devices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => setSelectedDeviceId(device.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                    selectedDeviceId === device.id
                      ? 'bg-fire-500/20 border border-fire-500/30 text-fire-400'
                      : 'bg-dark-700/30 border border-dark-700/50 text-dark-200 hover:bg-dark-700/50'
                  }`}
                >
                  <div className="font-medium text-sm">{device.name}</div>
                  <div className="text-xs text-dark-400 mt-0.5">{device.model} · {device.location}</div>
                </button>
              ))}
            </div>

            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWeekOffset((w) => w - 1)}
                    className="p-1.5 rounded-lg bg-dark-700/30 border border-dark-700/50 text-dark-300 hover:text-white transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium text-white px-2">
                    {weekDates[0]} ~ {weekDates[6]}
                  </span>
                  <button
                    onClick={() => setWeekOffset((w) => w + 1)}
                    className="p-1.5 rounded-lg bg-dark-700/30 border border-dark-700/50 text-dark-300 hover:text-white transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setWeekOffset(0)}
                    className="text-xs px-2 py-1 rounded bg-dark-700/30 border border-dark-700/50 text-dark-300 hover:text-white transition-all"
                  >
                    今天
                  </button>
                </div>
              </div>

              {selectedDeviceId ? (
                <div className="flex-1 overflow-auto">
                  <div className="bg-dark-700/20 rounded-xl border border-dark-700/50 p-4 min-w-[600px]">
                    <div className="grid grid-cols-8 gap-2 mb-2">
                      <div className="text-xs text-dark-400 font-medium"></div>
                      {weekDates.map((date, idx) => {
                        const isToday = date === formatDate(new Date());
                        const dayName = dayNames[idx];
                        return (
                          <div key={date} className={`text-center py-2 rounded-lg ${isToday ? 'bg-fire-500/20' : ''}`}>
                            <div className={`text-xs font-medium ${isToday ? 'text-fire-400' : 'text-dark-300'}`}>{dayName}</div>
                            <div className={`text-sm font-bold ${isToday ? 'text-fire-400' : 'text-white'}`}>{date.slice(5)}</div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="relative">
                      <div className="grid grid-cols-8 gap-2">
                        <div className="relative">
                          {timeSlots.map((slot) => (
                            <div key={slot} className="h-16 text-xs text-dark-500 text-right pr-2 pt-1">
                              {slot}
                            </div>
                          ))}
                        </div>
                        {weekDates.map((date) => (
                          <div key={date} className="relative bg-dark-800/30 rounded-lg border border-dark-700/30">
                            {timeSlots.map((_, idx) => (
                              <div key={idx} className="h-16 border-b border-dark-700/30 last:border-b-0"></div>
                            ))}
                            {getBookingsForDeviceAndDate(selectedDeviceId, date).map((booking) => {
                              const pos = calculateBookingPosition(booking, date);
                              return (
                                <div
                                  key={booking.id}
                                  onClick={() => handleBookingClick(booking)}
                                  className={`absolute left-0 right-0 mx-1 rounded-md border ${bookingBlockColors[booking.status]} cursor-pointer transition-all group overflow-hidden`}
                                  style={{
                                    top: `${pos.left}%`,
                                    height: `${pos.width}%`,
                                  }}
                                >
                                  <div className="p-1.5 h-full flex flex-col justify-center">
                                    <div className="text-xs font-medium text-white truncate">{booking.personnelName}</div>
                                    <div className="text-[10px] text-white/70 truncate">
                                      {booking.startTime.slice(11, 16)} - {booking.endTime.slice(11, 16)}
                                    </div>
                                  </div>
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all"></div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-dark-700/20 rounded-xl border border-dark-700/50">
                  <div className="text-center">
                    <Monitor className="w-12 h-12 text-dark-500 mx-auto mb-3" />
                    <p className="text-dark-400">请从左侧选择一台设备查看预约</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex gap-4 h-[60vh]">
            <div className="w-56 flex-shrink-0 space-y-2 overflow-y-auto pr-1">
              <div className="text-xs font-medium text-dark-400 mb-2 px-2">选择日期</div>
              {weekDates.map((date, idx) => {
                const isToday = date === formatDate(new Date());
                const dayName = dayNames[idx];
                const dayBookings = getBookingsForDate(date);
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                      selectedDate === date
                        ? 'bg-fire-500/20 border border-fire-500/30 text-fire-400'
                        : 'bg-dark-700/30 border border-dark-700/50 text-dark-200 hover:bg-dark-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm flex items-center gap-2">
                          {dayName}
                          {isToday && <span className="text-[10px] px-1.5 py-0.5 rounded bg-fire-500/30 text-fire-400">今天</span>}
                        </div>
                        <div className="text-xs text-dark-400 mt-0.5">{date}</div>
                      </div>
                      {dayBookings.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-dark-600/50 text-dark-300">
                          {dayBookings.length}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
              <div className="flex items-center justify-between mt-3 px-2">
                <button
                  onClick={() => setWeekOffset((w) => w - 1)}
                  className="p-1.5 rounded-lg bg-dark-700/30 border border-dark-700/50 text-dark-300 hover:text-white transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-dark-400">
                  {weekDates[0].slice(0, 7)}
                </span>
                <button
                  onClick={() => setWeekOffset((w) => w + 1)}
                  className="p-1.5 rounded-lg bg-dark-700/30 border border-dark-700/50 text-dark-300 hover:text-white transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => setWeekOffset(0)}
                className="w-full text-sm py-2 mt-2 rounded-lg bg-dark-700/30 border border-dark-700/50 text-dark-300 hover:text-white transition-all"
              >
                返回本周
              </button>
            </div>

            <div className="flex-1 overflow-auto min-w-0">
              <div className="bg-dark-700/20 rounded-xl border border-dark-700/50 p-4 min-w-[600px]">
                <div className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-fire-400" />
                  {selectedDate} 预约情况
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-[120px_1fr] gap-3">
                    <div></div>
                    <div className="relative h-8">
                      {timeSlots.map((slot) => (
                        <div
                          key={slot}
                          className="absolute top-0 text-xs text-dark-500"
                          style={{ left: `${((parseInt(slot) - 8) / 12) * 100}%` }}
                        >
                          {slot}
                        </div>
                      ))}
                    </div>
                  </div>

                  {devices.map((device) => {
                    const deviceBookings = getBookingsForDeviceAndDate(device.id, selectedDate);
                    return (
                      <div key={device.id} className="grid grid-cols-[120px_1fr] gap-3 items-center">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-8 h-8 rounded-lg ${statusConfig[device.status].bgColor} border flex items-center justify-center flex-shrink-0`}>
                            <Monitor className={`w-4 h-4 ${statusConfig[device.status].textColor}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-white truncate">{device.name}</div>
                            <div className="text-[10px] text-dark-400 truncate">{device.location}</div>
                          </div>
                        </div>
                        <div className="relative h-16 bg-dark-800/30 rounded-lg border border-dark-700/30">
                          {timeSlots.slice(1).map((_, idx) => (
                            <div
                              key={idx}
                              className="absolute top-0 bottom-0 w-px bg-dark-700/30"
                              style={{ left: `${((idx + 1) / 6) * 100}%` }}
                            ></div>
                          ))}
                          {deviceBookings.map((booking) => {
                            const pos = calculateBookingPosition(booking, selectedDate);
                            return (
                              <div
                                key={booking.id}
                                onClick={() => handleBookingClick(booking)}
                                className={`absolute top-1 bottom-1 rounded-md border ${bookingBlockColors[booking.status]} cursor-pointer transition-all group overflow-hidden`}
                                style={{
                                  left: `${pos.left}%`,
                                  width: `${pos.width}%`,
                                }}
                              >
                                <div className="p-1.5 h-full flex flex-col justify-center">
                                  <div className="text-xs font-medium text-white truncate">{booking.personnelName}</div>
                                  <div className="text-[10px] text-white/70 truncate">
                                    {booking.startTime.slice(11, 16)} - {booking.endTime.slice(11, 16)}
                                  </div>
                                </div>
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all"></div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedBooking && (
        <Modal
          open={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          title="预约详情"
          size="md"
          footer={
            <div className="flex justify-end gap-3">
              <button onClick={() => setSelectedBooking(null)} className="btn-secondary px-5">
                关闭
              </button>
              {selectedBooking.status === 'active' && (
                <button
                  onClick={() => {
                    onComplete(selectedBooking.id);
                    setSelectedBooking(null);
                  }}
                  className="btn-primary px-5 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  完成预约
                </button>
              )}
              {selectedBooking.status === 'upcoming' && (
                <button
                  onClick={handleCancelBooking}
                  className="btn-primary px-5 flex items-center gap-2 bg-red-500 hover:bg-red-600 border-red-500"
                >
                  <XCircle className="w-4 h-4" />
                  取消预约
                </button>
              )}
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-fire-500/20 border border-fire-500/30 flex items-center justify-center">
                <Monitor className="w-6 h-6 text-fire-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">{selectedBooking.deviceName || selectedBooking.deviceId}</h3>
                <span className={`badge border ${bookingStatusConfig[selectedBooking.status].color}`}>
                  {bookingStatusConfig[selectedBooking.status].label}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dark-700/30 rounded-xl p-4 border border-dark-700/50">
                <div className="text-xs text-dark-400 mb-1">使用人</div>
                <div className="text-white font-medium">{selectedBooking.personnelName}</div>
              </div>
              <div className="bg-dark-700/30 rounded-xl p-4 border border-dark-700/50">
                <div className="text-xs text-dark-400 mb-1">预约编号</div>
                <div className="text-white font-medium font-mono text-sm">{selectedBooking.id}</div>
              </div>
              <div className="bg-dark-700/30 rounded-xl p-4 border border-dark-700/50">
                <div className="text-xs text-dark-400 mb-1">开始时间</div>
                <div className="text-white text-sm">{selectedBooking.startTime}</div>
              </div>
              <div className="bg-dark-700/30 rounded-xl p-4 border border-dark-700/50">
                <div className="text-xs text-dark-400 mb-1">结束时间</div>
                <div className="text-white text-sm">{selectedBooking.endTime}</div>
              </div>
            </div>

            <div className="bg-dark-700/30 rounded-xl p-4 border border-dark-700/50">
              <div className="text-xs text-dark-400 mb-1">使用用途</div>
              <div className="text-white text-sm">{selectedBooking.purpose || '未填写'}</div>
            </div>

            <div className="bg-dark-700/30 rounded-xl p-4 border border-dark-700/50">
              <div className="text-xs text-dark-400 mb-1">创建时间</div>
              <div className="text-white text-sm">{selectedBooking.createdAt}</div>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
}
