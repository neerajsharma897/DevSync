import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../lib/api.js';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export const InviteAcceptancePage = () => {
  const { inviteToken } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const acceptInvite = async () => {
      try {
        await apiFetch(`/invites/${inviteToken}/accept`, { method: 'POST' });
        setStatus('success');
        setTimeout(() => navigate('/workspaces'), 2000);
      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    };
    if (inviteToken) acceptInvite();
  }, [inviteToken, navigate]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center font-sans text-gray-200">
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-10 max-w-md w-full text-center shadow-2xl">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-6" />
            <h2 className="text-xl font-bold text-white mb-2">Accepting Invitation...</h2>
            <p className="text-gray-400">Please wait while we set up your workspace access.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-16 h-16 text-white mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Aboard!</h2>
            <p className="text-gray-400">Your invitation has been accepted. Redirecting to your workspace hub...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Invalid or Expired Invite</h2>
            <p className="text-gray-400 mb-8">This invitation link is no longer valid. Please ask your administrator to send a new one.</p>
            <button 
              onClick={() => navigate('/workspaces')}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
            >
              Return to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
};
