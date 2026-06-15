import React, { useState, useMemo, useEffect } from 'react';
import { Search, Monitor, MapPin, Clock, Activity, Wrench, Calendar, Plus, MoreVertical, CheckCircle, User, FileText, XCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Device, DeviceBooking, Personnel } from '@/types';
import Modal from '@/components/Modal';
import { formatDateTime, addHours } from '@/lib/utils';

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
      />

      <BookingCalendarModal
        open={showDeviceBookingCalendar}
        onClose={() => setShowDeviceBookingCalendar(false)}
        bookings={bookings}
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
}

function BookDeviceModal({ open, device, onClose, devices, personnel, onSubmit }: BookDeviceModalProps) {
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

  useEffect(() => {
    if (device) {
      setForm((prev) => ({ ...prev, deviceId: device.id }));
    }
  }, [device]);

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

  const handleSubmit = () => {
    if (!validate()) return;

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
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        onClose();
        setErrors({});
      }}
      title="预约设备"
      subtitle="选择设备、时间段和使用人"
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary px-5">
            取消
          </button>
          <button onClick={handleSubmit} className="btn-primary px-5 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            确认预约
          </button>
        </div>
      }
    >
      <div className="space-y-5">
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

interface BookingCalendarModalProps {
  open: boolean;
  onClose: () => void;
  bookings: DeviceBooking[];
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
}

function BookingCalendarModal({ open, onClose, bookings, onComplete, onCancel }: BookingCalendarModalProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const sortedBookings = useMemo(() => {
    const filtered = statusFilter === 'all'
      ? bookings
      : bookings.filter((b) => b.status === statusFilter);
    return [...filtered].sort((a, b) => {
      const timeOrder = { active: 0, upcoming: 1, completed: 2, cancelled: 3 };
      if (timeOrder[a.status] !== timeOrder[b.status]) {
        return timeOrder[a.status] - timeOrder[b.status];
      }
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });
  }, [bookings, statusFilter]);

  const statusCounts = {
    all: bookings.length,
    upcoming: bookings.filter((b) => b.status === 'upcoming').length,
    active: bookings.filter((b) => b.status === 'active').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="预约日历"
      subtitle="查看和管理所有设备预约"
      size="xl"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { value: 'all', label: '全部' },
            { value: 'upcoming', label: '即将开始' },
            { value: 'active', label: '使用中' },
            { value: 'completed', label: '已完成' },
            { value: 'cancelled', label: '已取消' },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setStatusFilter(item.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === item.value
                  ? 'bg-fire-500/20 text-fire-400 border border-fire-500/30'
                  : 'bg-dark-700/30 text-dark-300 border border-dark-700/50 hover:bg-dark-700/50'
              }`}
            >
              {item.label}
              <span className="ml-1.5 text-xs opacity-75">({statusCounts[item.value as keyof typeof statusCounts]})</span>
            </button>
          ))}
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {sortedBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-dark-500 mx-auto mb-3" />
              <p className="text-dark-400">暂无预约记录</p>
            </div>
          ) : (
            sortedBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-dark-700/30 rounded-xl p-4 border border-dark-700/50 hover:border-dark-600/50 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-fire-500/20 border border-fire-500/30 flex items-center justify-center">
                      <Monitor className="w-5 h-5 text-fire-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-white truncate">{booking.deviceName || booking.deviceId}</h4>
                        <span className={`badge border text-[10px] px-2 py-0.5 ${bookingStatusConfig[booking.status].color}`}>
                          {bookingStatusConfig[booking.status].label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <User className="w-3.5 h-3.5 text-dark-400" />
                        <span className="text-sm text-dark-300">{booking.personnelName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3 ml-13">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-dark-400" />
                      <span className="text-xs text-dark-300">开始：{booking.startTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-dark-400" />
                      <span className="text-xs text-dark-300">结束：{booking.endTime}</span>
                    </div>
                  </div>
                  {booking.purpose && (
                    <div className="flex items-start gap-2 mt-2 ml-13">
                      <FileText className="w-3.5 h-3.5 text-dark-400 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-dark-400 line-clamp-2">{booking.purpose}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {booking.status === 'active' && (
                    <button
                      onClick={() => onComplete(booking.id)}
                      className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      完成预约
                    </button>
                  )}
                  {booking.status === 'upcoming' && (
                    <button
                      onClick={() => onCancel(booking.id)}
                      className="btn-secondary text-xs py-1.5 px-3 text-red-400 border-red-500/30 flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      取消
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
          )}
        </div>
      </div>
    </Modal>
  );
}
