import { useState } from 'react';
import { Clock, Zap, ChevronRight, MapPin, Flame, HelpCircle, Settings } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Scenario } from '@/types';

const difficultyConfig = {
  easy: { label: '简单', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  medium: { label: '中等', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  hard: { label: '困难', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

type TabType = 'routes' | 'extinguisher' | 'smoke';

export default function ScenarioList() {
  const { scenarios } = useStore();
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(scenarios[0] || null);
  const [activeTab, setActiveTab] = useState<TabType>('routes');

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-white">场景管理</h1>
        <p className="text-sm text-dark-400 mt-1">配置火灾演练场景和培训内容</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-3">
          <h2 className="text-lg font-semibold text-white">场景列表</h2>
          <div className="space-y-3">
            {scenarios.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                selected={selectedScenario?.id === scenario.id}
                onClick={() => setSelectedScenario(scenario)}
              />
            ))}
          </div>
        </div>

        <div className="col-span-2">
          {selectedScenario ? (
            <div className="glass-card overflow-hidden">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={selectedScenario.coverImage}
                  alt={selectedScenario.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-white">{selectedScenario.name}</h2>
                    <span className={`badge border ${difficultyConfig[selectedScenario.difficulty].color}`}>
                      {difficultyConfig[selectedScenario.difficulty].label}
                    </span>
                  </div>
                  <p className="text-sm text-dark-200 mt-2">{selectedScenario.description}</p>
                </div>
              </div>

              <div className="p-4 border-b border-dark-700 flex items-center gap-1">
                <TabButton
                  active={activeTab === 'routes'}
                  onClick={() => setActiveTab('routes')}
                  icon={MapPin}
                  label="逃生路线"
                />
                <TabButton
                  active={activeTab === 'extinguisher'}
                  onClick={() => setActiveTab('extinguisher')}
                  icon={Flame}
                  label="灭火器步骤"
                />
                <TabButton
                  active={activeTab === 'smoke'}
                  onClick={() => setActiveTab('smoke')}
                  icon={HelpCircle}
                  label="烟雾识别题"
                />
              </div>

              <div className="p-4 max-h-[400px] overflow-y-auto">
                {activeTab === 'routes' && (
                  <EscapeRoutes routes={selectedScenario.escapeRoutes} />
                )}
                {activeTab === 'extinguisher' && (
                  <ExtinguisherSteps steps={selectedScenario.extinguisherSteps} />
                )}
                {activeTab === 'smoke' && (
                  <SmokeQuestions questions={selectedScenario.smokeQuestions} />
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card h-96 flex items-center justify-center">
              <p className="text-dark-400">请选择一个场景查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScenarioCard({ scenario, selected, onClick }: { scenario: Scenario; selected: boolean; onClick: () => void }) {
  const difficulty = difficultyConfig[scenario.difficulty];

  return (
    <div
      onClick={onClick}
      className={`glass-card-hover cursor-pointer overflow-hidden ${
        selected ? 'border-fire-500/50 shadow-lg shadow-fire-500/10' : ''
      }`}
    >
      <div className="h-28 overflow-hidden relative">
        <img
          src={scenario.coverImage}
          alt={scenario.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <div className="absolute top-2 right-2">
          <span className={`badge border ${difficulty.color} backdrop-blur-sm`}>
            {difficulty.label}
          </span>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-white">{scenario.name}</h3>
          <ChevronRight className="w-4 h-4 text-dark-400" />
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-dark-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {scenario.duration}分钟
          </span>
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {scenario.escapeRoutes.length}条路线
          </span>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-fire-600/20 text-fire-400'
          : 'text-dark-300 hover:text-white hover:bg-dark-700/50'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function EscapeRoutes({ routes }: { routes: Scenario['escapeRoutes'] }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-white flex items-center gap-2">
        <Settings className="w-4 h-4 text-fire-500" />
        逃生路线配置
      </h3>
      <div className="space-y-3">
        {routes.map((route, index) => (
          <div
            key={route.id}
            className="p-4 rounded-xl bg-dark-700/30 border border-dark-600/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-fire-600/20 flex items-center justify-center">
                <span className="text-sm font-bold text-fire-400">{index + 1}</span>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-white">{route.name}</h4>
                <p className="text-sm text-dark-400 mt-1">
                  {route.startPoint} → {route.endPoint}
                </p>
              </div>
            </div>
            <p className="text-sm text-dark-300 mt-3 pl-11">{route.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExtinguisherSteps({ steps }: { steps: Scenario['extinguisherSteps'] }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-white flex items-center gap-2">
        <Flame className="w-4 h-4 text-fire-500" />
        灭火器使用步骤
      </h3>
      <div className="space-y-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              step.isCorrect
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                step.isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}
            >
              {step.step}
            </div>
            <span className="text-sm text-dark-200">{step.description}</span>
            <span
              className={`ml-auto text-xs ${
                step.isCorrect ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {step.isCorrect ? '正确' : '错误'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SmokeQuestions({ questions }: { questions: Scenario['smokeQuestions'] }) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-white flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-fire-500" />
        烟雾识别题目
      </h3>
      <div className="space-y-4">
        {questions.map((q, index) => (
          <div key={q.id} className="p-4 rounded-xl bg-dark-700/30 border border-dark-600/50">
            <div className="flex items-start gap-4">
              <span className="text-fire-500 font-bold">Q{index + 1}.</span>
              <div className="flex-1">
                <p className="text-white font-medium">{q.question}</p>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {q.options.map((option, optIndex) => (
                    <div
                      key={optIndex}
                      className={`p-2 rounded-lg text-sm ${
                        optIndex === q.correctAnswer
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-dark-600/50 text-dark-300'
                      }`}
                    >
                      {String.fromCharCode(65 + optIndex)}. {option}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
