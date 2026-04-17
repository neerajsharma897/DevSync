import React from 'react';

const RegisterPage: React.FC = () => {
  return (
    <div className="auth-bg min-h-screen flex items-center justify-center p-4">
      <div className="glass-card-strong max-w-md w-full p-8 animate-fadeIn glow-purple">
        <h1 className="text-3xl font-bold gradient-text mb-6 text-center">Join DevSync</h1>
        <p className="text-text-secondary text-center mb-8">Create your developer account</p>
        <button className="gradient-btn w-full py-3">Get Started</button>
      </div>
    </div>
  );
};

export default RegisterPage;
