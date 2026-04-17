import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { 
  BarChart3, 
  CheckCircle2, 
  TrendingUp, 
  Code,
  Ship,
  Sparkles
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const data = [
  { name: 'Mon', tasks: 4 },
  { name: 'Tue', tasks: 7 },
  { name: 'Wed', tasks: 5 },
  { name: 'Thu', tasks: 9 },
  { name: 'Fri', tasks: 12 },
  { name: 'Sat', tasks: 8 },
  { name: 'Sun', tasks: 6 },
];

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="p-8 animate-fadeIn space-y-8">
      {/* Welcome Banner */}
      <section className="glass-card-strong p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <Sparkles size={120} className="text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, <span className="gradient-text">{user?.fullName.split(' ')[0]}</span>!</h1>
            <p className="text-text-secondary max-w-xl">
              Here is your AI-powered standup context: &quot;Current sprint is 78% complete. You have 3 high-priority tasks in review. Sarah finished the UI kit yesterday, and Marcus is working on the API integration.&quot;
            </p>
          </div>
          <button className="gradient-btn px-6 py-3 flex items-center gap-2 self-start md:self-center glow-purple">
            <Sparkles size={18} />
            <span>Generate Daily Summary</span>
          </button>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 border-l-2 border-white glow-purple">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-text-secondary text-xs font-bold uppercase tracking-widest">Active Sprint</h3>
            <TrendingUp size={16} className="text-white" />
          </div>
          <div className="text-3xl font-bold mb-1">Sprint 12</div>
          <p className="text-text-muted text-xs">4 days remaining</p>
          <div className="mt-4 w-full bg-bg-tertiary h-1.5 rounded-full overflow-hidden">
             <div className="bg-white h-full w-[78%]"></div>
          </div>
        </div>

        <div className="glass-card p-6 border-l-2 border-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-text-secondary text-xs font-bold uppercase tracking-widest">My Tasks</h3>
            <CheckCircle2 size={16} className="text-white" />
          </div>
          <div className="text-3xl font-bold mb-1">12</div>
          <p className="text-text-muted text-xs">3 completed today</p>
        </div>

        <div className="glass-card p-6 border-l-2 border-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-text-secondary text-xs font-bold uppercase tracking-widest">Code Quality</h3>
            <BarChart3 size={16} className="text-white" />
          </div>
          <div className="text-3xl font-bold mb-1 italic">98.4%</div>
          <p className="text-text-muted text-xs">SonarCloud: Grade A</p>
        </div>

        <div className="glass-card p-6 border-l-2 border-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-text-secondary text-xs font-bold uppercase tracking-widest">Deployment</h3>
            <Ship size={16} className="text-white" />
          </div>
          <div className="text-3xl font-bold mb-1">Production</div>
          <p className="text-text-muted text-xs">v1.2.4 — Stable</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Chart */}
        <div className="lg:col-span-2 glass-card p-8">
          <h3 className="text-lg font-bold mb-6">Task Completion Activity</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#666666', fontSize: 12 }} 
                />
                <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: '#666666', fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    backdropFilter: 'blur(10px)'
                  }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="tasks" 
                  stroke="#ffffff" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorTasks)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GitHub Integration Section */}
        <div className="glass-card p-8 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Recent Commits</h3>
            <Code size={20} className="text-text-muted" />
          </div>
          <div className="space-y-6 flex-1">
            {[
              { id: '1', msg: 'fix: glassmorphism border styling', author: 'Sarah Chen', time: '2h ago' },
              { id: '2', msg: 'feat: add ai duration estimation', author: 'Marcus Johnson', time: '5h ago' },
              { id: '3', msg: 'docs: update deployment guides', author: 'Arjun Mehta', time: 'Yesterday' },
            ].map(commit => (
              <div key={commit.id} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xs shrink-0">
                  {commit.author[0]}
                </div>
                <div>
                  <p className="text-sm font-medium line-clamp-1">{commit.msg}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-white font-mono bg-white/10 px-1.5 py-0.5 rounded">fixes TASK-42</span>
                    <span className="text-[10px] text-text-muted">{commit.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-8 text-sm text-text-secondary hover:text-white transition-colors flex items-center gap-2 group">
            View all project activity
            <TrendingUp size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
