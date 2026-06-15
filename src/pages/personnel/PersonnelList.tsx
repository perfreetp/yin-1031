import { useState } from 'react';
import { Search, Filter, Phone, Building, Award, Clock, UserPlus, TrendingUp, Users } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { departments } from '@/data/personnel';
import type { Personnel, DepartmentStats } from '@/types';

export default function PersonnelList() {
  const { personnel, getDepartmentStats } = useStore();
  const [searchText, setSearchText] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const departmentStats = getDepartmentStats();

  const filteredPersonnel = personnel.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchText.toLowerCase());
    const matchDept = deptFilter === 'all' || p.department === deptFilter;
    return matchSearch && matchDept;
  });

  const overallStats = {
    total: personnel.length,
    trained: personnel.filter((p) => p.trainCount > 0).length,
    avgPassRate: Math.round(
      personnel.reduce((acc, p) => acc + p.passRate, 0) / personnel.length
    ),
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">人员管理</h1>
          <p className="text-sm text-dark-400 mt-1">管理参训员工信息和部门统计</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          添加人员
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="总人数" value={overallStats.total} icon={Users} color="from-blue-500 to-blue-700" suffix="人" />
        <StatCard label="已参训" value={overallStats.trained} icon={Award} color="from-green-500 to-emerald-700" suffix="人" />
        <StatCard label="平均通过率" value={overallStats.avgPassRate} icon={TrendingUp} color="from-fire-500 to-fire-700" suffix="%" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 glass-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">人员列表</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="text"
                  placeholder="搜索人员..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-48 pl-9 pr-4 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-dark-100 placeholder-dark-400 focus:outline-none focus:border-fire-500/50 transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-dark-400" />
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-dark-100 focus:outline-none focus:border-fire-500/50 transition-all"
                >
                  <option value="all">全部部门</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {filteredPersonnel.map((person) => (
              <PersonnelCard key={person.id} person={person} />
            ))}
          </div>

          {filteredPersonnel.length === 0 && (
            <div className="text-center py-12">
              <p className="text-dark-400">暂无人员数据</p>
            </div>
          )}
        </div>

        <div className="glass-card p-4">
          <h2 className="text-lg font-semibold text-white mb-4">部门统计</h2>
          <div className="space-y-4">
            {departmentStats.map((dept) => (
              <DepartmentStatCard key={dept.name} stats={dept} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, suffix }: { label: string; value: number; icon: any; color: string; suffix?: string }) {
  return (
    <div className="stat-card">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`}></div>
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold text-white">
            {value}
            {suffix && <span className="text-lg font-normal text-dark-400 ml-1">{suffix}</span>}
          </p>
          <p className="text-sm text-dark-400 mt-1">{label}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function PersonnelCard({ person }: { person: Personnel }) {
  const passRateColor = person.passRate >= 85 ? 'text-green-400' : person.passRate >= 60 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-dark-700/50 transition-colors border border-transparent hover:border-dark-600">
      <img
        src={person.avatar}
        alt={person.name}
        className="w-12 h-12 rounded-full bg-dark-700"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-white truncate">{person.name}</h3>
          <span className="text-xs text-dark-400">{person.position}</span>
        </div>
        <div className="flex items-center gap-4 mt-1 text-xs text-dark-400">
          <span className="flex items-center gap-1">
            <Building className="w-3 h-3" />
            {person.department}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {person.trainCount}次培训
          </span>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-lg font-bold ${passRateColor}`}>{person.passRate}%</p>
        <p className="text-xs text-dark-400">通过率</p>
      </div>
    </div>
  );
}

function DepartmentStatCard({ stats }: { stats: DepartmentStats }) {
  const passRateColor = stats.passRate >= 85 ? 'bg-green-500' : stats.passRate >= 60 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="p-4 rounded-xl bg-dark-700/30 border border-dark-600/50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-white">{stats.name}</h3>
        <span className="text-sm text-dark-300">{stats.totalCount}人</span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-dark-400">已参训</span>
          <span className="text-dark-200">{stats.trainedCount}人</span>
        </div>
        <div className="w-full h-2 bg-dark-600 rounded-full overflow-hidden">
          <div
            className={`h-full ${passRateColor} rounded-full transition-all`}
            style={{ width: `${stats.passRate}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-dark-400">通过率</span>
          <span className="text-dark-200 font-medium">{stats.passRate}%</span>
        </div>
      </div>
    </div>
  );
}
