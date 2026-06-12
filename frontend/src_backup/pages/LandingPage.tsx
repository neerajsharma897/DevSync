import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, GitBranch, Layout, MessageSquare, Zap } from 'lucide-react';

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 font-sans text-gray-200 overflow-hidden selection:bg-emerald-500/30">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-gray-950/50 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-emerald-400 to-blue-500 rounded flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="w-5 h-5 text-gray-950 fill-current" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">Dev<span className="text-emerald-400">Sync</span></span>
          </div>
          <div className="flex items-center space-x-6">
            <a href="#features" className="text-sm font-medium text-gray-400 hover:text-white transition-colors hidden md:block">Features</a>
            <button onClick={() => navigate('/login')} className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Sign in</button>
            <button onClick={() => navigate('/register')} className="text-sm font-semibold bg-white text-gray-950 px-4 py-2 rounded-full hover:bg-gray-200 transition-transform hover:scale-105 active:scale-95">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-full pointer-events-none">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] mix-blend-screen" />
          <div className="absolute bottom-20 right-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[150px] mix-blend-screen" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-gray-900/80 border border-gray-800 rounded-full px-3 py-1 mb-8 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-medium text-gray-300 uppercase tracking-widest">DevSync v1.0 is live</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight mb-8">
            The ultimate hub for <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400">
              engineering teams.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Replace Jira, Slack, and GitHub dashboards with one unified, blazing-fast platform. Chat in real-time, drag-and-drop tasks, and track commits seamlessly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button onClick={() => navigate('/register')} className="w-full sm:w-auto flex items-center justify-center px-8 py-4 text-base font-bold text-gray-950 bg-emerald-400 hover:bg-emerald-300 rounded-full transition-all shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)] hover:shadow-[0_0_40px_-5px_rgba(16,185,129,0.7)] hover:-translate-y-1">
              Start Building for Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="w-full sm:w-auto flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-gray-900 border border-gray-800 hover:bg-gray-800 rounded-full transition-all">
              <GitBranch className="mr-2 w-5 h-5" />
              View Source
            </a>
          </div>
        </div>
      </main>

      {/* Feature Grid */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-24 border-t border-gray-800/50">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Everything you need, nothing you don't.</h2>
          <p className="text-gray-400">Say goodbye to context switching.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-900/40 border border-gray-800/80 rounded-3xl p-8 hover:bg-gray-900/60 transition-colors">
            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mb-6">
              <Layout className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Agile Kanban Boards</h3>
            <p className="text-gray-400 leading-relaxed">
              Drag and drop tasks with zero latency. Assign points, priorities, and custom labels. Perfect for sprints or continuous delivery.
            </p>
          </div>

          <div className="bg-gray-900/40 border border-gray-800/80 rounded-3xl p-8 hover:bg-gray-900/60 transition-colors relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px]"></div>
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-6 relative z-10">
              <MessageSquare className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 relative z-10">Real-Time Channels</h3>
            <p className="text-gray-400 leading-relaxed relative z-10">
              Communicate instantly with Socket.io. Rich text editing, code snippets, and threaded replies built right into your workspace.
            </p>
          </div>

          <div className="bg-gray-900/40 border border-gray-800/80 rounded-3xl p-8 hover:bg-gray-900/60 transition-colors">
            <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center mb-6">
              <GitBranch className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">GitHub Integration</h3>
            <p className="text-gray-400 leading-relaxed">
              Connect your repositories to automatically sync commits, pull requests, and CI/CD workflows directly to your tasks.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-900 bg-gray-950 py-12 text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Zap className="w-5 h-5 text-emerald-400 fill-current" />
          <span className="font-bold text-lg text-white tracking-tight">DevSync</span>
        </div>
        <p className="text-sm text-gray-600">Built for modern engineering teams. © 2026 DevSync.</p>
      </footer>
    </div>
  );
};
