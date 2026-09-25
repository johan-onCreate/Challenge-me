import { useState, FormEvent, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function Profile() {
  const [fullName, setFullName] = useState<string>('');
  const [alias, setAlias] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Hämta befintlig data om användaren redan har fyllt i något tidigare
  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata) {
        setFullName(user.user_metadata.full_name || '');
        setAlias(user.user_metadata.alias || '');
      }
    }
    getProfile();
  }, []);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Uppdatera metadata i efterhand
    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        alias: alias,
      },
    });

    if (error) {
      setMessage(`Fel: ${error.message}`);
    } else if (data) {
      setMessage('Profilen har uppdaterats framgångsrikt!');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '20px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h3>Min Profil</h3>
      <form onSubmit={handleUpdateProfile}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Ange ditt riktiga namn:</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Välj ett alias:</label>
          <input
            type="text"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {loading ? 'Sparar...' : 'Spara profilinfo'}
        </button>
      </form>
      {message && <p style={{ marginTop: '15px', color: message.startsWith('Fel') ? 'red' : 'green' }}>{message}</p>}
    </div>
  );
}

export default Profile;
