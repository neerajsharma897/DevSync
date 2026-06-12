import React from 'react';

const LoginPage: React.FC = () => {
  return (
    <div className="auth-bg min-h-screen flex items-center justify-center p-4">
      <div className="auth-shape-1"></div>
      <div className="auth-shape-2"></div>
      <div className="glass-card-strong max-w-md w-full p-8 animate-fadeIn glow-purple">
        <h1 className="text-3xl font-bold gradient-text mb-6 text-center">DevSync</h1>
        <p className="text-text-secondary text-center mb-8">Sign in to your workspace</p>
        <div className="space-y-4">
          <button className="gradient-btn w-full py-3">Continue with GitHub</button>
          <button className="glass-card w-full py-3 hover:bg-bg-hover transition-colors">Continue with Google</button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
