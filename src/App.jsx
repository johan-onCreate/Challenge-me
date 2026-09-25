import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enkel säkerhetskoll så vi ser att strängarna finns
const urlCheck = supabaseUrl ? `${supabaseUrl.substring(0, 12)}...` : "SAKNAS";
const keyCheck = supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : "SAKNAS";

const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [debugError, setDebugError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase.from('test_items').select('*');
        
        if (error) {
          setDebugError(error.message);
        } else {
          setItems(data || []);
        }
      } catch (err) {
        setDebugError(err.message);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Supabase + Vite Status</h1>
      
      {/* Diagnostikbox */}
      <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '5px', marginBottom: '20px', fontSize: '14px' }}>
        <p><strong>URL laddad:</strong> {urlCheck}</p>
        <p><strong>Nyckel laddad:</strong> {keyCheck}</p>
        {debugError && <p style={{ color: 'red' }}><strong>Dolt felmeddelande:</strong> {debugError}</p>}
      </div>

      <h2>Hämtad data:</h2>
      {loading && <p>Laddar...</p>}
      {!loading && items.length === 0 && <p>Ingen data hittades (Listan är tom).</p>}
      
      <ul>
        {items.map((item) => (
          <li key={item.id} style={{ fontSize: '18px', margin: '10px 0' }}>
            {item.title}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
