import { useState, FormEvent, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Challenge {
  id: number;
  title: string;
  description: string;
  points: number;
  is_active: boolean;
  start_date: string;
  end_date: string;
  tiers: string[];
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function AdminChallenges() {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [points, setPoints] = useState<number>(100);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Hantering av de dynamiska nivåerna
  const [tiers, setTiers] = useState<string[]>([]);
  const [newTierInput, setNewTierInput] = useState<string>('');

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  const fetchChallenges = async () => {
    const { data } = await supabase.from('challenges').select('*').order('id', { ascending: false });
    if (data) setChallenges(data);
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const handleAddTier = () => {
    const trimmed = newTierInput.trim();
    if (trimmed && !tiers.includes(trimmed)) {
      setTiers([...tiers, trimmed]);
      setNewTierInput('');
    }
  };

  const handleRemoveTier = (indexToRemove: number) => {
    setTiers(tiers.filter((_, idx) => idx !== indexToRemove));
  };

  const handleCreateChallenge = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase
      .from('challenges')
      .insert([{ 
        title, 
        description, 
        points, 
        is_active: false,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        tiers: tiers
      }]);

    if (error) {
      setMessage(`Fel: ${error.message}`);
    } else {
      setMessage('🎉 Utmaningen har sparats!');
      setTitle('');
      setDescription('');
      setPoints(100);
      setStartDate('');
      setEndDate('');
      setTiers([]);
      fetchChallenges();
    }
    setLoading(false);
  };

  const handleSetActive = async (id: number) => {
    await supabase.from('challenges').update({ is_active: false }).neq('id', 0);
    const { error } = await supabase.from('challenges').update({ is_active: true }).eq('id', id);
    if (!error) fetchChallenges();
  };

  const handleDeleteChallenge = async (id: number) => {
    if (!window.confirm("Är du helt säker? Detta raderar även deltagarnas historik för denna specifika challenge.")) {
      return;
    }
    const { error } = await supabase.from('challenges').delete().eq('id', id);
    if (!error) fetchChallenges();
  };
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Admin-panel</h3>
        <p className="text-xs text-slate-500">Skapa, hantera eller ta bort dina utmaningar.</p>
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
        
        {/* NIVÅBYGGARE */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Konfigurera Nivåer / Mål</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newTierInput} 
              onChange={(e) => setNewTierInput(e.target.value)} 
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none" 
              placeholder="t.ex. 1000 squats" 
            />
            <button type="button" onClick={handleAddTier} className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-800">
              Lägg till
            </button>
          </div>
          
          {tiers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tiers.map((t, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1 rounded-lg border border-indigo-100">
                  {t}
                  <button type="button" onClick={() => handleRemoveTier(idx)} className="text-indigo-400 hover:text-indigo-900 font-bold ml-1 text-sm leading-none">&times;</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Poäng</label>
            <input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Startdatum</label>
            <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Slutdatum</label>
            <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" />
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-sm shadow-sm transition-colors">
          {loading ? 'Sparar...' : 'Skapa utmaning'}
        </button>
      </form>

      {message && <div className="p-3 text-xs bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg font-medium">{message}</div>}

      {/* LISTA MED UTMANINGAR */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <h4 className="font-bold text-sm text-slate-900">Administrera utmaningar ({challenges.length})</h4>
        <div className="space-y-2">
          {challenges.map((c) => (
            <div key={c.id} className={`p-4 border rounded-xl flex items-center justify-between gap-4 ${c.is_active ? 'bg-indigo-50/40 border-indigo-200 shadow-sm' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-sm text-slate-900">{c.title}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">+{c.points} XP</span>
                  {c.is_active && <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded font-semibold animate-pulse">Aktiv</span>}
                </div>
                {c.tiers && c.tiers.length > 0 && (
                  <div className="flex gap-1 flex-wrap pt-0.5">
                    {c.tiers.map((t, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">Nivå: {t}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!c.is_active && (
                  <button onClick={() => handleSetActive(c.id)} className="text-xs bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-xl font-medium shadow-sm">
                    Aktivera
                  </button>
                )}
                <button onClick={() => handleDeleteChallenge(c.id)} className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-xl font-medium">
                  Radera
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminChallenges;
