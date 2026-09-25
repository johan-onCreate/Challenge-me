import { useState, FormEvent, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Challenge {
  id: number;
  title: string;
  description: string;
  points: number;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function Profile() {
  // Profil-states
  const [fullName, setFullName] = useState<string>('');
  const [alias, setAlias] = useState<string>('');
  const [profileMessage, setProfileMessage] = useState<string>('');
  const [profileLoading, setProfileLoading] = useState<boolean>(false);

  // Challenge-states
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [isCurrentCompleted, setIsCurrentCompleted] = useState<boolean>(false);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [loadingChallenge, setLoadingChallenge] = useState<boolean>(true);

  useEffect(() => {
    async function getProfileAndChallenge() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Hämta profil-info
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, alias')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        setFullName(profile.full_name || '');
        setAlias(profile.alias || '');
      }

      // 2. Hämta den utmaning som admin har satt som AKTIV just nu
      const { data: activeChallenge } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true) // Hitta den aktiva
        .maybeSingle();
      
      if (activeChallenge) {
        setCurrentChallenge(activeChallenge);

        // 3. Kolla om användaren har klarat just DENNA aktiva utmaning
        const { data: completedCheck } = await supabase
          .from('user_challenges')
          .select('id')
          .eq('user_id', user.id)
          .eq('challenge_id', activeChallenge.id)
          .maybeSingle();

        if (completedCheck) {
          setIsCurrentCompleted(true);
        }
      }

      // 4. Räkna ut totalpoäng (summan av alla historiskt avklarade utmaningar)
      const { data: allUserChallenges } = await supabase
        .from('user_challenges')
        .select('challenges(points)')
        .eq('user_id', user.id);

      if (allUserChallenges) {
        const points = allUserChallenges.reduce((sum: number, item: any) => {
          return sum + (item.challenges?.points || 0);
        }, 0);
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

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: fullName,
        alias: alias,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      setProfileMessage(`Fel: ${error.message}`);
    } else {
      setProfileMessage('✨ Profilen har sparats!');
    }
    setProfileLoading(false);
  };

  const handleCompleteChallenge = async () => {
    if (!currentChallenge) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('user_challenges')
      .insert([{ user_id: user.id, challenge_id: currentChallenge.id }]);

    if (error) {
      alert(`Kunde inte slutföra: ${error.message}`);
    } else {
      setIsCurrentCompleted(true);
      setTotalPoints(prev => prev + currentChallenge.points);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Total XP Scoreboard */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md flex justify-between items-center">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Din totala poäng</p>
          <h3 className="text-3xl font-extrabold text-amber-400 mt-1">{totalPoints} XP</h3>
        </div>
        <div className="bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700">
          <span className="text-xs font-medium text-slate-300">Status: Aktiv</span>
        </div>
      </div>

      {/* Aktiva utmaning */}
      <div className="space-y-4 border-t border-slate-100 pt-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Aktuell utmaning</h3>
          <p className="text-xs text-slate-500">Klara av den aktiva uppgiften innan nästa släpps.</p>
        </div>

        {loadingChallenge ? (
          <p className="text-sm text-slate-400 animate-pulse">Hämtar utmaning...</p>
        ) : !currentChallenge ? (
          <p className="text-sm text-slate-500 italic">Ingen aktiv utmaning just nu. Vänta på admin!</p>
        ) : (
          <div className={`p-5 border rounded-2xl transition-all ${isCurrentCompleted ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className={`font-bold text-base ${isCurrentCompleted ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                    {currentChallenge.title}
                  </h4>
                  <span className={`text-xs px-2.5 py-0.5 font-bold rounded-full ${isCurrentCompleted ? 'bg-slate-200 text-slate-600' : 'bg-amber-100 text-amber-800'}`}>
                    +{currentChallenge.points} XP
                  </span>
                </div>
                <p className={`text-sm ${isCurrentCompleted ? 'text-slate-400' : 'text-slate-600'}`}>
                  {currentChallenge.description}
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4 flex justify-end">
              {isCurrentCompleted ? (
                <span className="inline-flex items-center text-sm font-semibold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                  ✅ Du har klarat denna utmaning!
                </span>
              ) : (
                <button
                  onClick={handleCompleteChallenge}
                  className="w-full sm:w-auto text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-xl shadow-sm transition-colors"
                >
                  Jag har klarat det!
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Profilinställningar */}
      <div className="space-y-4 border-t border-slate-100 pt-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Profilinställningar</h3>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Namn</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Alias</label>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>
          </div>
          <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-4 rounded-xl text-xs transition-colors">
            Spara profil
          </button>
        </form>

        {profileMessage && (
          <div className="p-3 rounded-xl text-xs bg-emerald-50 text-emerald-800 border border-emerald-100 font-medium">
            {profileMessage}
          </div>
        )}
      </div>

    </div>
  );
}

export default Profile;
