import { useState, FormEvent } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function Register() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMessage(`Fel: ${error.message}`);
    } else if (data?.user?.identities?.length === 0) {
      setMessage('Detta e-postkonto är redan registrerat.');
    } else {
      setMessage('Registrering lyckades! Du kan nu logga in på fliken bredvid.');
      setEmail('');
      setPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center sm:text-left">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Skapa ett konto</h2>
        <p className="text-sm text-slate-500 mt-1">Registrera dig med e-post för att komma igång.</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">E-postadress</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm font-medium transition-all outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            placeholder="namn@domän.se"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Lösenord</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm font-medium transition-all outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            placeholder="Minst 6 tecken"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl shadow-sm text-sm transition-all hover:shadow duration-150 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? 'Skapar konto...' : 'Registrera dig'}
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

export default Register;
