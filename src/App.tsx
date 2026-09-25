import { useEffect, useState } from 'react';
import { createClient, User } from '@supabase/supabase-js';
import Register from './Register';
import Login from './Login';
import Profile from './Profile'; // Denna skapade vi i förra steget

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 1. Kontrollera om det redan finns en aktiv session när appen startar
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // 2. Lyssna live på förändringar (Inloggning / Utloggning)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return <p style={{ padding: '20px' }}>Laddar appen...</p>;

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
        <h1>Min Supabase App</h1>
        
        {/* Visa utloggningsknapp samt välkomsthälsning om användaren är inloggad */}
        {user && (
          <div>
            <span style={{ marginRight: '15px' }}>
              Välkommen, <strong>{user.user_metadata?.alias || user.email}</strong>!
            </span>
            <button onClick={handleLogout} style={{ padding: '6px 12px', background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Logga ut
            </button>
          </div>
        )}
      </header>

      {/* REGLER FÖR VAD SOM VISAS PÅ SKÄRMEN */}
      {user ? (
        // OM ANVÄNDAREN ÄR INLOGGAD: Visa profilsidan där de anger namn/alias
        <div>
          <div style={{ background: '#e6f7ff', padding: '10px', borderRadius: '4px', marginBottom: '20px' }}>
            🎉 Du är säkert inloggad!
          </div>
          <Profile />
        </div>
      ) : (
        // OM ANVÄNDAREN ÄR UTLOGGAD: Visa inloggning eller registrering
        <div>
          <nav style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setAuthView('login')} 
              style={{ padding: '8px 16px', fontWeight: authView === 'login' ? 'bold' : 'normal' }}
            >
              Logga in
            </button>
            <button 
              onClick={() => setAuthView('register')} 
              style={{ padding: '8px 16px', fontWeight: authView === 'register' ? 'bold' : 'normal' }}
            >
              Skapa konto
            </button>
          </nav>

          {authView === 'login' ? <Login /> : <Register />}
        </div>
      )}
    </div>
  );
}

export default App;

