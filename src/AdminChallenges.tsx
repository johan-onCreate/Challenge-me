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
  const [tiersInput, setTiersInput] = useState<string>(''); // Nytt fält för nivåer
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

  const handleCreateChallenge = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Gör om "1000, 3000, 5000" till en ren array ['1000', '3000', '5000']
    const tiersArray = tiersInput
      ? tiersInput.split(',').map(item => item.trim()).filter(Boolean)
      : [];

    const { error } = await supabase
      .from('challenges')
      .insert([{ 
        title, 
        description, 
        points, 
        is_active: true,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        tiers: tiersArray // Sparas i databasen
      }]);

    if (error) {
      setMessage(`Fel: ${error.message}`);
    } else {
      setMessage('🎉 Utmaningen med nivåer har skapats!');
      setTitle('');
      setDescription('');
      setPoints(100);
      setStartDate('');
      setEndDate('');
      setTiersInput('');
      fetchChallenges();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Skapa ny nivå-utmaning</h3>
      </div>

      <form onSubmit={handleCreateChallenge} className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Titel</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="t.ex. Squat-challenge 3 månader" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Beskrivning</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
        </div>
        
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Konfigurera Nivåer / Mål (Separera med kommatecken)</label>
          <input type="text" value={tiersInput} onChange={(e) => setTiersInput(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="t.ex. 1000, 3000, 5000" />
          <p className="text-[10px] text-slate-400 mt-1">Lämna tomt om utmaningen inte har olika nivåer.</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Poäng</label>
            <input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Startdatum</label>
            <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Slutdatum</label>
            <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          </div>
        </div>

        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg text-sm">
          Publicera utmaning
        </button>
      </form>

      <div className="space-y-3 pt-4 border-t border-slate-100">
        <h4 className="font-bold text-sm text-slate-900">Utmaningsöversikt</h4>
        <div className="space-y-2">
          {challenges.map((c) => (
            <div key={c.id} className="p-3 border border-slate-200 bg-white rounded-xl">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm text-slate-900">{c.title}</span>
                <span className="text-[10px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-bold">+{c.points} XP</span>
              </div>
              {c.tiers && c.tiers.length > 0 && (
                <div className="flex gap-1 mt-1.5">
                  {c.tiers.map((t, idx) => (
                    <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">Nivå: {t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminChallenges;
