import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../lib/api.js';
import { supabase } from '../../lib/supabase.js';
import { Loader2 } from 'lucide-react';

export const GithubCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const exchangeCode = async () => {
      try {
        // Wait for Supabase to parse hash and establish session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        if (!session?.provider_token) {
          throw new Error('No GitHub provider token found in Supabase session.');
        }

        await apiFetch('/github/oauth/exchange', {
          method: 'POST',
          body: JSON.stringify({ providerToken: session.provider_token }),
        });

        const returnTo = searchParams.get('returnTo') || '/workspaces';
        navigate(returnTo, { replace: true });
      } catch (err: any) {
        console.error('GitHub OAuth Exchange Error:', err);
        setError(err.message || 'Failed to connect GitHub account.');
      }
    };

    exchangeCode();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="flex flex-col h-screen w-screen items-center justify-center bg-gray-950 px-4 text-center">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-xl max-w-md">
          <h2 className="text-lg font-bold mb-2">GitHub Connection Error</h2>
          <p className="text-sm mb-6">{error}</p>
          <button 
            onClick={() => navigate('/workspaces', { replace: true })}
            className="px-4 py-2 bg-gray-900 border border-gray-800 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen items-center justify-center bg-gray-950">
      <Loader2 className="h-10 w-10 animate-spin text-white mb-4" />
      <h2 className="text-xl font-bold text-white mb-2">Connecting GitHub</h2>
      <p className="text-gray-400 text-sm">Please wait while we securely link your account...</p>
    </div>
  );
};
