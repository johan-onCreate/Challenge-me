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

  // Vi typas parametern 'e' som FormEvent
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(`Fel: ${error.message}`);
    } else if (data?.user?.identities?.length === 0) {
      setMessage('Detta e-postkonto är redan registrerat.');
    } else {
      setMessage('Registrering lyckades! Kontrollera din e-post för att bekräfta kontot.');
    }
    
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Skapa konto (TypeScript)</h2>
      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>E-post:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Lösenord:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {loading ? 'Registrerar...' : 'Registrera dig'}
        </button>
      </form>
      {message && <p style={{ marginTop: '15px', color: message.startsWith('Fel') ? 'red' : 'green' }}>{message}</p>}
    </div>
  );
}

export default Register;
