// src/App.jsx
import { useEffect, useState } from 'react';

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/get-data')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.data) setItems(resData.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Laddar testdata...</p>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Supabase + Vercel Test</h1>
      {items.length === 0 ? <p>Ingen data hittades.</p> : null}
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
