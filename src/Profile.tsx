import { useState, FormEvent, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Challenge {
  id: number;
  title: string;
  description: string;
  points: number;
  tiers?: string[];
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function Profile() {
  const [fullName, setFullName] = useState<string>('');
  const [alias, setAlias] = useState<string>('');
  const [profileMessage, setProfileMessage] = useState<string>('');
  const [profileLoading, setProfileLoading] = useState<boolean>(false);

  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [isCurrentCompleted, setIsCurrentCompleted] = useState<boolean>(false);
  const [chosenTier, setChosenTier] = useState<string>(''); // Användarens valda nivå
  const [savedTier, setSavedTier] = useState<string>('');   // Den sparade nivån från DB
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [loadingChallenge, setLoadingChallenge] = useState<boolean>(true);

  useEffect(() => {
    async function getProfileAndChallenge() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('full_name, alias').eq('id', user.id).maybeSingle();
      if (profile) {
        setFullName(profile.full_name || '');
        setAlias(profile.alias || '');
      }

      const nowIso = new Date().toISOString();
      const { data: activeChallenge } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', nowIso)
        .gte('end_date', nowIso)
        .maybeSingle();
      
      if (activeChallenge) {
        setCurrentChallenge(activeChallenge);

        // Hämta om användaren har klarat utmaningen, och plocka med chosen_tier
        const { data: completedCheck } = await supabase
          .from('user_challenges')
          .select('id, chosen_tier')
          .eq('user_id', user.id)
          .eq('challenge_id', activeChallenge.id)
          .maybeSingle();

        if (completedCheck) {
          setIsCurrentCompleted(true);
          setSavedTier(completedCheck.chosen_tier || '');
        }
      }

      const { data: allUserChallenges } = await supabase.from('user_challenges').select('challenges(points)').eq('user_id', user.id);
      if (allUserChallenges) {
        const points = allUserChallenges.reduce((sum: number, item: any) => sum + (item.challenges?.points || 0), 0);
        setTotalPoints(points);
      }
      setLoadingChallenge(false);
    }
    getProfileAndChallenge();
  }, []);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('profiles').upsert({ id: user.id, full_name: fullName, alias: alias, updated_at: new Date().toISOString() });
    setProfileMessage('✨ Profilen har sparats!');
    setProfileLoading(false);
  };

  const handleCompleteChallenge = async () => {
    if (!currentChallenge) return;
    
    // Spärr: Om det finns nivåer men användaren inte valt någon
    if (currentChallenge.tiers && currentChallenge.tiers.length > 0 && !chosenTier) {
      alert("Vänligen välj en nivå innan du slutför utmaningen!");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('user_challenges')
      .insert([{ user_id: user.id, challenge_id: currentChallenge.id, chosen_tier: chosenTier }]);

    if (error) {
      alert(`Kunde inte slutföra: ${error.message}`);
    } else {
      setIsCurrentCompleted(true);
      setSavedTier(chosenTier);
      setTotalPoints(prev => prev + currentChallenge.points);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md flex justify-between items-center">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Din totala poäng</p>
          <h3 className="text-3xl font-extrabold text-amber-400 mt-1">{totalPoints} XP</h3>
        </div>
      </div>

      <div className="space-y-4 border-t border-slate-100 pt-6">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Aktuell utmaning</h3>

        {loadingChallenge ? (
          <p className="text-sm text-slate-400 animate-pulse">Hämtar utmaning...</p>
        ) : !currentChallenge ? (
          <p className="text-sm text-slate-500 italic">Ingen aktiv utmaning just nu.</p>
        ) : (
          <div className="p-5 border rounded-2xl bg-white border-slate-200 shadow-sm space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-base text-slate-900">{currentChallenge.title}</h4>
                <span className="text-xs px-2.5 py-0.5 font-bold rounded-full bg-amber-100 text-amber-800">+{currentChallenge.points} XP</span>
              </div>
              <p className="text-sm text-slate-600 mt-1">{currentChallenge.description}</p>
            </div>

            {/* PRESENTATION AV NIVÅER */}
            {currentChallenge.tiers && currentChallenge.tiers.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Välj din utmaningsnivå:</label>
                
                {isCurrentCompleted ? (
                  <p className="text-sm font-semibold text-slate-800">Valt mål: <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{savedTier}</span></p>
                ) : (
                  <div className="flex gap-4">
                    {currentChallenge.tiers.map((t, idx) => (
                      <label key={idx} className="flex items-center gap-1.5 text-sm font-medium text-slate-700 cursor-pointer">
                        <input type="radio" name="tier" value={t} checked={chosenTier === t} onChange={(e) => setChosenTier(e.target.value)} className="text-blue-600 focus:ring-blue-500" />
                        {t}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              {isCurrentCompleted ? (
                <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">✅ Avklarad</span>
              ) : (
                <button onClick={handleCompleteChallenge} className="w-full sm:w-auto text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-xl shadow-sm">
                  Jag har klarat det!
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Profilformulär */}
      <div className="space-y-4 border-t border-slate-100 pt-6">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Profilinställningar</h3>
        <form onSubmit={handleUpdateProfile} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" placeholder="Namn" />
            <input type="text" value={alias} onChange={(e) => setAlias(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" placeholder="Alias" />
          </div>
          <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-4 rounded-xl text-xs">Spara profil</button>
        </form>
        {profileMessage && <div className="p-3 text-xs bg-emerald-50 text-emerald-800 rounded-xl font-medium">{profileMessage}</div>}
      </div>
    </div>
  );
}

export default Profile;
