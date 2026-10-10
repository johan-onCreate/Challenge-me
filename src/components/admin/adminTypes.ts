export interface Challenge {
  id: number;
  title: string;
  description: string;
  points: number;
  is_active: boolean;
  start_date: string;
  end_date: string;
  tiers: string[];
}

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  alias: string | null;
  is_admin: boolean;
}
