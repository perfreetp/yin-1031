import { useState } from 'react';
import { Trophy, Clock, XCircle, RotateCcw, TrendingUp, Search, Filter, BarChart3, Users, Award, Play } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useStore } from '@/store/useStore';
import type { Score } from '@/types';

export default function ScoreList() {
  const { scores, personnel, getDepartmentStats } = useStore();
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');
  const departmentStats = getDepartmentStats();

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
    retrainCount: scores.filter((s) => !s.passed).length,
  };

  const passRate = Math.round((stats.passed / stats.total) * 100);

  const errorTypeData = [
    { name: '逃生路线错误', value: 8, color: '#FF6B5E' },
    { name: '未低姿前行', value: 6, color: '#FF9800' },
    { name: '灭火器使用错误', value: 5, color: '#4CAF50' },
    { name: '未关闭防火门', value: 3, color: '#2196F3' },
    { name: '烟雾识别错误', value: 4, color: '#9C27B0' },
    { name: '其他错误', value: 2, color: '#607D8B' },
  ];

  const monthlyData = [
    { month: '1月', 通过率: 78, 平均用时: 195 },
    { month: '2月', 通过率: 82, 平均用时: 182 },
    { month: '3月', 通过率: 80, 平均用时: 175 },
    { month: '4月', 通过率: 85, 平均用时: 168 },
    { month: '5月', 通过率: 83, 平均用时: 170 },
    { month: '6月', 通过率: 88, 平均用时: 156 },
  ];

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
            统计分析
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <StatCard label="总参训人次" value={stats.total} icon={Users} color="from-blue-500 to-blue-700" />
        <StatCard label="通过人数" value={stats.passed} icon={Award} color="from-green-500 to-emerald-700" />
        <StatCard label="通过率" value={passRate} icon={TrendingUp} color="from-fire-500 to-fire-700" suffix="%" />
        <StatCard label="平均用时" value={stats.avgTime} icon={Clock} color="from-purple-500 to-purple-700" suffix="秒" />
        <StatCard label="需重训" value={stats.retrainCount} icon={RotateCcw} color="from-yellow-500 to-orange-600" />
      </div>

      {activeTab === 'list' ? (
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
              <ScoreRow key={score.id} score={score} rank={index + 1} />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          <div className="glass-card p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-fire-500" />
              月度趋势
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="通过率" fill="#E53935" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-fire-500" />
              错误类型分布
            </h3>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={errorTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {errorTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {errorTypeData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-dark-300">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-2 glass-card p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-fire-500" />
              部门通过率对比
            </h3>
            <div className="grid grid-cols-5 gap-4">
              {departmentStats.map((dept) => (
                <div key={dept.name} className="p-4 rounded-xl bg-dark-700/30 border border-dark-600/50 text-center">
                  <h4 className="font-medium text-white mb-2">{dept.name}</h4>
                  <div className="text-3xl font-bold text-fire-400 mb-2">{dept.passRate}%</div>
                  <div className="w-full h-2 bg-dark-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-fire-500 to-fire-600 rounded-full"
                      style={{ width: `${dept.passRate}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-dark-400 mt-2">
                    {dept.passCount}/{dept.totalCount} 人通过
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, suffix }: { label: string; value: number; icon: any; color: string; suffix?: string }) {
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
      </div>
    </div>
  );
}

function ScoreRow({ score, rank }: { score: Score; rank: number }) {
  const [showErrors, setShowErrors] = useState(false);
  
  const scoreColor = score.totalScore >= 90 ? 'text-green-400' : score.totalScore >= 70 ? 'text-yellow-400' : 'text-red-400';
  const rankBg = rank === 1 ? 'bg-yellow-500 text-yellow-900' : rank === 2 ? 'bg-gray-300 text-gray-700' : rank === 3 ? 'bg-amber-600 text-amber-100' : 'bg-dark-600 text-dark-300';

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

        <div className="flex items-center gap-4">
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
