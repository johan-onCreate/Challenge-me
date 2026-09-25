import { useState, FormEvent, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Challenge {
  id: number;
  title: string;
  description: string;
  points: number;
  is_active: boolean;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function AdminChallenges() {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [points, setPoints] = useState<number>(100);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  // Hämta alla utmaningar till admin-listan
  const fetchChallenges = async () => {
    const { data } = await supabase.from('challenges').select('*').order('id', { ascending: false });
    if (data) setChallenges(data);
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const handleCreateChallenge = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase
      .from('challenges')
      .insert([{ title, description, points, is_active: false }]);

    if (error) {
      setMessage(`Fel: ${error.message}`);
    } else {
      setMessage('🎉 Utmaningen har sparats i listan!');
      setTitle('');
      setDescription('');
      setPoints(100);
      fetchChallenges();
    }
    setLoading(false);
  };

  // Aktivera en specifik utmaning och stäng av alla andra
  const handleSetActive = async (id: number) => {
    // 1. Sätt is_active = false på ALLA utmaningar först
    await supabase.from('challenges').update({ is_active: false }).neq('id', 0);
    
    // 2. Sätt is_active = true på den valda utmaningen
    const { error } = await supabase.from('challenges').update({ is_active: true }).eq('id', id);

    if (error) {
      alert(`Kunde inte aktivera: ${error.message}`);
    } else {
      fetchChallenges(); // Ladda om listan
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Skapa ny utmaning</h3>
      </div>

      <form onSubmit={handleCreateChallenge} className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Titel</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-indigo-600" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Beskrivning</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-indigo-600" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Poäng</label>
          <input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-indigo-600" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg text-sm transition-colors">
          {loading ? 'Sparar...' : 'Spara utmaning'}
        </button>
      </form>

      {message && <div className="p-3 text-xs bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg font-medium">{message}</div>}

      {/* ADMIN-LISTA ÖVER ALLA UTMANINGAR */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <h4 className="font-bold text-sm text-slate-900">Alla utmaningar ({challenges.length})</h4>
        <div className="space-y-2">
          {challenges.map((c) => (
            <div key={c.id} className={`p-3 border rounded-xl flex items-center justify-between gap-4 ${c.is_active ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-slate-200'}`}>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm text-slate-900">{c.title}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">+{c.points} XP</span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1">{c.description}</p>
              </div>
              
              {c.is_active ? (
                <span className="text-xs bg-indigo-600 text-white px-2.5 py-1 rounded-lg font-semibold shadow-sm">Aktiv</span>
              ) : (
                <button onClick={() => handleSetActive(c.id)} className="text-xs bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-2.5 py-1 rounded-lg font-medium shadow-sm transition-colors">
                  Aktivera
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminChallenges;
