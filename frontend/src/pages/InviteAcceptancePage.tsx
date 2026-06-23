import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api.js';
import { useAuthStore } from '../store/auth.js';
import { Loader2, CheckCircle2, AlertTriangle, ArrowRight, UserPlus } from 'lucide-react';

export const InviteAcceptancePage: React.FC = () => {
  const { slug } = useParams(); // Using slug based on the backend route /api/workspaces/:slug/invites/accept
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      // Pass slug so they can come back after registering/logging in
      navigate(`/register?inviteSlug=${slug}`);
    }
  }, [slug, isAuthenticated, navigate]);

  const acceptInvite = async () => {
    setStatus('loading');
    try {
      await apiFetch(`/workspaces/${slug}/invites/accept`, {
        method: 'POST'
      });
      setStatus('success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to accept invite. It may be expired or invalid.');
      setStatus('error');
    }
  };

  return (
    <div className="h-screen bg-gray-950 flex flex-col items-center justify-center p-4 font-sans text-gray-200">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
        {/* Decorator */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[40px] pointer-events-none"></div>

        {status === 'idle' && (
          <div className="py-4">
            <div className="w-16 h-16 bg-white/10 text-white border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <UserPlus className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Workspace Invitation</h2>
            <p className="text-sm text-gray-400 mb-8">
              You've been invited to join the workspace <strong className="text-gray-200">{slug}</strong>.
            </p>
            <div className="space-y-3">
              <button 
                onClick={acceptInvite}
                className="w-full py-3 bg-white hover:bg-gray-200 text-gray-950 font-bold rounded-lg transition-colors flex items-center justify-center"
              >
                Accept Invitation
              </button>
              <button 
                onClick={() => navigate('/workspaces')}
                className="w-full py-3 bg-transparent hover:bg-gray-800 text-gray-400 font-medium rounded-lg transition-colors"
              >
                Decline & Return Home
              </button>
            </div>
          </div>
        )}

        {status === 'loading' && (
          <div className="py-8">
            <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white">Processing Invite...</h2>
            <p className="text-sm text-gray-400 mt-2">Please wait while we set up your access.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-8">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Invite Accepted!</h2>
            <p className="text-sm text-gray-400 mb-8">
              You've successfully joined <b>{slug}</b>. You can now access all projects and channels.
            </p>
            <button 
              onClick={() => navigate(`/w/${slug}`)}
              className="w-full py-3 bg-white text-gray-950 font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
            >
              <span>Go to Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="py-8">
            <div className="w-16 h-16 bg-red-500/20 text-red-400 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Invite Failed</h2>
            <p className="text-sm text-gray-400 mb-8">{errorMessage}</p>
            <button 
              onClick={() => navigate('/workspaces')}
              className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

