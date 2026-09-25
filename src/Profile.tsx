import { useState, FormEvent, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function Profile() {
  const [fullName, setFullName] = useState<string>('');
  const [alias, setAlias] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata) {
        setFullName(user.user_metadata.full_name || '');
        setAlias(user.user_metadata.alias || '');
      }
    }
    getProfile();
  }, []);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        alias: alias,
      },
    });

    if (error) {
      setMessage(`Fel: ${error.message}`);
    } else if (data) {
      setMessage('Profilen har uppdaterats och sparats!');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Dina profilinställningar</h3>
        <p className="text-sm text-slate-500 mt-0.5">Komplettera ditt konto med namn och ett unikt alias.</p>
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Ditt fullständiga namn</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm font-medium transition-all outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            placeholder="Förnamn Efternamn"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Välj ett unikt alias</label>
          <input
            type="text"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm font-medium transition-all outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            placeholder="t.ex. superdev99"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-xl shadow-sm text-sm transition-all hover:shadow duration-150 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? 'Sparar ändringar...' : 'Spara profilinfo'}
        </button>
      </form>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${message.startsWith('Fel') ? 'bg-rose-50 text-rose-800 border-rose-100' : 'bg-emerald-50 text-emerald-800 border-emerald-100'}`}>
          {message}
        </div>
      )}
    </div>
  );
}

export default Profile;
