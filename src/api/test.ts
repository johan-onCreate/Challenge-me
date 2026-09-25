// api/get-data.js
import { createClient } from '@supabase/supabase-js';

declare const process: {
  env: Record<string, string | undefined>;
};

const supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl) throw new Error('SUPABASE_URL is not configured');

const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseAnonKey) throw new Error('SUPABASE_ANON_KEY is not configured');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  // Vi hämtar från vår nya test-tabell
  const { data, error } = await supabase.from('test_items').select('*');

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ data });
}
