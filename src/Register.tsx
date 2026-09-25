import { useState, FormEvent } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function Register() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>(''); // Ny state för namn
  const [alias, setAlias] = useState<string>('');       // Ny state för alias
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Vi skickar med fullName och alias i options.data
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          alias: alias,
        },
      },
    });

    if (error) {
      setMessage(`Fel: ${error.message}`);
    } else if (data?.user?.identities?.length === 0) {
      setMessage('Detta e-postkonto är redan registrerat.');
    } else {
      setMessage(`Konto skapat för ${fullName} (${alias})! Du är nu registrerad.`);
      // Nollställ formuläret
      setFullName('');
      setAlias('');
      setEmail('');
      setPassword('');
    }
    
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Skapa konto (med profilinfo)</h2>
      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Namn:</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Alias:</label>
          <input
            type="text"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
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
