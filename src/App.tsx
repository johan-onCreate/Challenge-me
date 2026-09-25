import { useEffect, useState } from 'react';
import { createClient, User } from '@supabase/supabase-js';
import Register from './Register';
import Login from './Login';
import Profile from './Profile';
import AdminChallenges from './AdminChallenges';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false); // Sparar admin-status från DB
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [userView, setUserView] = useState<'profile' | 'admin'>('profile');
  const [loading, setLoading] = useState<boolean>(true);

  // Hjälpfunktion för att kolla om profilen i databasen är markerad som admin
  const checkAdminStatus = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle();
    
    setIsAdmin(profile?.is_admin || false);
  };

  useEffect(() => {
    // 1. Kontrollera session vid start
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        checkAdminStatus(user.id);
      }
      setLoading(false);
    });

    // 2. Lyssna live på när någon loggar in eller ut
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        checkAdminStatus(currentUser.id);
      } else {
        setIsAdmin(false);
        setUserView('profile'); // Återställ vy vid utloggning
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <p className="text-lg font-medium text-slate-500 animate-pulse">Laddar portalen...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            ⚡️ Supabase Portal
          </h1>
          
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">
                Inloggad: <strong className="text-slate-900 font-semibold">{user.user_metadata?.alias || user.email}</strong>
                {isAdmin && <span className="ml-1.5 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">Admin</span>}
              </span>
              <button 
                onClick={() => supabase.auth.signOut()}
                className="text-sm bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 h-8 font-medium rounded-lg transition-colors"
              >
                Logga ut
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-xl mx-auto px-4 mt-12">
        {user ? (
          <div className="space-y-6">
            
            {/* Flikmeny - Visas ENBART om databasen säger att du är admin */}
            {isAdmin && (
              <div className="flex bg-slate-200 p-1 rounded-xl shadow-sm">
                <button 
                  onClick={() => setUserView('profile')} 
                  className={`flex-1 text-center py-2 text-sm font-medium rounded-lg transition-all ${userView === 'profile' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Min Profil
                </button>
                <button 
                  onClick={() => setUserView('admin')} 
                  className={`flex-1 text-center py-2 text-sm font-medium rounded-lg transition-all ${userView === 'admin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Admin-panel
                </button>
              </div>
            )}

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              {userView === 'admin' && isAdmin ? <AdminChallenges /> : <Profile />}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setAuthView('login')} 
                className={`flex-1 text-center py-2 text-sm font-medium rounded-lg transition-all ${authView === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Logga in
              </button>
              <button 
                onClick={() => setAuthView('register')} 
                className={`flex-1 text-center py-2 text-sm font-medium rounded-lg transition-all ${authView === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Skapa konto
              </button>
            </div>

            {authView === 'login' ? <Login /> : <Register />}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
