import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Register from './Register';

// Definiera ett enkelt interface för din test-data
interface TestItem {
  id: number;
  title: string;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

function App() {
  const [items, setItems] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  // Växla vy mellan 'data' och 'register'
  const [view, setView] = useState<'data' | 'register'>('register'); 

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase.from('test_items').select('*');
      if (!error && data) {
        setItems(data as TestItem[]);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      {/* Enkel meny för att växla mellan sidorna */}
      <nav style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => setView('register')} 
          style={{ padding: '8px 16px', fontWeight: view === 'register' ? 'bold' : 'normal' }}
        >
          Registrera dig
        </button>
        <button 
          onClick={() => setView('data')} 
          style={{ padding: '8px 16px', fontWeight: view === 'data' ? 'bold' : 'normal' }}
        >
          Visa testdata
        </button>
      </nav>

      <hr />

      {/* Rendera rätt sida baserat på staten */}
      {view === 'register' ? (
        <Register />
      ) : (
        <div style={{ marginTop: '20px' }}>
          <h2>Hämtad data från Supabase:</h2>
          {loading && <p>Laddar...</p>}
          {!loading && items.length === 0 && <p>Ingen data hittades.</p>}
          <ul>
            {items.map((item) => (
              <li key={item.id} style={{ fontSize: '18px', margin: '10px 0' }}>
                {item.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
