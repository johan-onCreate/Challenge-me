import { useEffect, useState } from "react";
import { createClient, User } from "@supabase/supabase-js";
import { Link, Navigate, NavLink, Route, Routes } from "react-router-dom";
import Register from "./Register";
import Login from "./Login";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import ChangePassword from "./ChangePassword";
import Profile from "./Profile";
import AdminChallenges from "./AdminChallenges";
import Leaderboard from "./Leaderboard";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const checkAdminStatus = async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle();

    setIsAdmin(profile?.is_admin || false);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) checkAdminStatus(user.id);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        checkAdminStatus(currentUser.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <p className="text-lg font-medium text-slate-500 animate-pulse">
          Laddar portalen...
        </p>
      </div>
    );
  }

  const navigationClassName = ({ isActive }: { isActive: boolean }) =>
    `flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all ${isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`;

  const protectedRoute = (element: React.ReactNode) =>
    user ? element : <Navigate to="/login" replace />;

  const publicRoute = (element: React.ReactNode) =>
    user ? <Navigate to="/profile" replace /> : element;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            ⚡️ Challenges Portal
          </h1>

          {user && (
            <div className="flex items-center gap-2 sm:gap-4 ml-auto">
              <span className="text-xs sm:text-sm text-slate-600 max-w-32 sm:max-w-none truncate">
                <strong className="text-slate-900 font-semibold">
                  {user.user_metadata?.alias || user.email}
                </strong>
                {isAdmin && (
                  <span className="ml-1.5 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                    Admin
                  </span>
                )}
              </span>
              <Link
                to="/change-password"
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Byt lösenord
              </Link>
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 px-2.5 py-1.5 font-medium rounded-lg transition-colors"
              >
                Logga ut
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-10">
        {user && (
          <nav className="flex bg-slate-200 p-1 rounded-xl shadow-sm mb-6">
            <NavLink to="/profile" className={navigationClassName}>
              Min Utmaning
            </NavLink>
            <NavLink to="/leaderboard" className={navigationClassName}>
              Topplista 🏆
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={navigationClassName}>
                Admin-panel
              </NavLink>
            )}
          </nav>
        )}

        {!user && (
          <nav className="flex bg-slate-100 p-1 rounded-xl shadow-sm mb-6">
            <NavLink to="/login" className={navigationClassName}>
              Logga in
            </NavLink>
            <NavLink to="/register" className={navigationClassName}>
              Skapa konto
            </NavLink>
          </nav>
        )}

        <div className="bg-white border border-slate-200 p-4 sm:p-6 lg:p-8 rounded-2xl shadow-sm">
          <Routes>
            <Route path="/login" element={publicRoute(<Login />)} />
            <Route path="/register" element={publicRoute(<Register />)} />
            <Route
              path="/forgot-password"
              element={publicRoute(<ForgotPassword />)}
            />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/change-password"
              element={protectedRoute(<ChangePassword />)}
            />
            <Route path="/profile" element={protectedRoute(<Profile />)} />
            <Route
              path="/leaderboard"
              element={protectedRoute(<Leaderboard />)}
            />
            <Route
              path="/admin"
              element={
                user && isAdmin ? (
                  <AdminChallenges />
                ) : (
                  <Navigate to={user ? "/profile" : "/login"} replace />
                )
              }
            />
            <Route
              path="*"
              element={<Navigate to={user ? "/profile" : "/login"} replace />}
            />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
