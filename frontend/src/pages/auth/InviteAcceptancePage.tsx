import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../lib/api.js';
import { Loader2, CheckCircle2, XCircle, UserPlus, ArrowRight } from 'lucide-react';

export const InviteAcceptancePage = () => {
  const { inviteToken } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const acceptInvite = async () => {
    setStatus('loading');
    try {
      // Depending on the backend implementation, inviteToken might be the workspace slug
      // For DevSync, we updated the backend to use /workspaces/:slug/invites/accept
      await apiFetch(`/workspaces/${inviteToken}/invites/accept`, { method: 'POST' });
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center font-sans text-gray-200 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
        {/* Decorator */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[40px] pointer-events-none"></div>

        {status === 'idle' && (
          <div className="py-2">
            <div className="w-16 h-16 bg-white/10 text-white border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <UserPlus className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Workspace Invitation</h2>
            <p className="text-sm text-gray-400 mb-8">
              You've been invited to join the workspace <strong className="text-gray-200">{inviteToken}</strong>.
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
          <div className="py-6">
            <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-6" />
            <h2 className="text-xl font-bold text-white mb-2">Accepting Invitation...</h2>
            <p className="text-gray-400">Please wait while we set up your workspace access.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Aboard!</h2>
            <p className="text-gray-400 mb-8">Your invitation has been accepted. You can now access all projects and channels.</p>
            <button 
              onClick={() => navigate(`/w/${inviteToken}`)}
              className="w-full py-3 bg-white text-gray-950 font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
            >
              <span>Go to Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6">
            <div className="w-16 h-16 bg-red-500/20 text-red-400 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Invalid or Expired Invite</h2>
            <p className="text-gray-400 mb-8">This invitation link is no longer valid. Please ask your administrator to send a new one.</p>
            <button 
              onClick={() => navigate('/workspaces')}
              className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
