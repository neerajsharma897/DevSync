import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

const InviteAcceptancePage: React.FC = () => {
  const { inviteId } = useParams<{ inviteId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      // Pass inviteId so they can come back after registering/logging in
      navigate(`/register?inviteId=${inviteId}`);
      return;
    }

    const acceptInvite = async () => {
      try {
        const data = await apiFetch(`/workspaces/invites/${inviteId}/accept`, {
          method: 'POST'
        });
        setWorkspaceName(data.workspace?.name || 'the workspace');
        setStatus('success');
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to accept invite. It may be expired or invalid.');
        setStatus('error');
      }
    };

    acceptInvite();
  }, [inviteId, isAuthenticated, navigate]);

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center p-4">
      <div className="auth-shape-1"></div>
      <div className="auth-shape-2"></div>

      <div className="glass-card-strong max-w-md w-full p-8 animate-fadeIn relative z-10 text-center">
        {status === 'loading' && (
          <div className="py-8">
            <Loader2 className="w-12 h-12 animate-spin text-accent-purple mx-auto mb-4" />
            <h2 className="text-xl font-bold">Processing Invite...</h2>
            <p className="text-sm text-text-secondary mt-2">Please wait while we set up your access.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-8">
            <div className="w-16 h-16 bg-white/20 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Invite Accepted!</h2>
            <p className="text-sm text-text-secondary mb-8">
              You've successfully joined <b>{workspaceName}</b>. You can now access all projects and channels.
            </p>
            <button 
              onClick={() => navigate('/workspaces')}
              className="gradient-btn w-full py-3 flex items-center justify-center gap-2"
            >
              <span>Go to Workspace</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="py-8">
            <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Invite Failed</h2>
            <p className="text-sm text-text-secondary mb-8">{errorMessage}</p>
            <button 
              onClick={() => navigate('/workspaces')}
              className="glass-card w-full py-3 font-medium hover:bg-bg-hover transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteAcceptancePage;
