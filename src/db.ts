import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { newDb, IMemoryDb } from 'pg-mem';

// Vi definierar ett enkelt interface för det vi faktiskt använder från Supabase
interface MockSupabase {
  from: (table: string) => {
    select: (columns?: string) => Promise<{ data: any[] | null; error: any }>;
    insert: (values: any) => Promise<{ data: any[] | null; error: any }>;
  };
}

let db: SupabaseClient | MockSupabase;

if (process.env.NODE_ENV !== 'local') {
  // I produktion använder vi den riktiga klienten
  db = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_ANON_KEY as string
  );
} else {
  // Lokalt skapar vi en in-memory Postgres
  const memDb: IMemoryDb = newDb();

  // Initiera dina tabeller direkt i minnet
  memDb.public.none(`
    CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT);
    INSERT INTO users (name) VALUES ('Lokal TS-Användare');
  `);

  // Simulera Supabase-klienten med starka typer
  db = {
    from: (table: string) => ({
      select: async (columns: string = '*') => {
        try {
          const query = columns === '*' ? `SELECT * FROM ${table}` : `SELECT ${columns} FROM ${table}`;
          const data = memDb.public.many(query);
          return { data, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
      insert: async (values: any) => {
        try {
          // Exempel på enkel hantering av objekt-till-SQL för insert
          const keys = Object.keys(values).join(', ');
          const formattedValues = Object.values(values)
            .map(v => typeof v === 'string' ? `'${v}'` : v)
            .join(', ');

          memDb.public.none(`INSERT INTO ${table} (${keys}) VALUES (${formattedValues})`);
          return { data: [values], error: null };
        } catch (error) {
          return { data: null, error };
        }
      }
    })
  };
}

export default db;
