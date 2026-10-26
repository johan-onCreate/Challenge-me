import { lazy, Suspense, useEffect, useState } from "react";
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
import ThemeSwitcher from "./ThemeSwitcher";
import AnnouncementToast from "./components/AnnouncementToast";
import ScrollToTop from "./ScrollToTop";
import SeasonalDecor from "./components/SeasonalDecor";
import {
  getInitialTheme,
  getMotionOverride,
  isSeasonalTheme,
  setMotionOverride,
  setTheme,
} from "./theme";
import type { ThemeName } from "./theme";

const Stats = lazy(() => import("./Stats"));

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  // Temat (inkl. säsongsteman) är per enhet – localStorage via theme.ts
  const [theme, setThemeState] = useState<ThemeName>(() => getInitialTheme());
  // Override för systemets reduced-motion: vill användaren ha
  // säsongsanimationerna även om OS:et pauserar animationer?
  const [motionOverride, setMotionOverrideState] = useState<boolean>(() =>
    getMotionOverride(),
  );
  const [reducedMotion, setReducedMotion] = useState<boolean>(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const selectTheme = (next: ThemeName) => {
    setTheme(next);
    setThemeState(next);
  };

  // Override-klassen på <html> styr CSS:et (se reduced-motion-blocket i index.css)
  useEffect(() => {
    document.documentElement.classList.toggle(
      "seasonal-motion-override",
      motionOverride,
    );
  }, [motionOverride]);

  // Följ systeminställningen live (utan omstart)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggleMotionOverride = () => {
    const next = !motionOverride;
    setMotionOverride(next);
    setMotionOverrideState(next);
  };

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
      <div className="flex h-screen items-center justify-center bg-surface">
        <p className="text-lg font-medium text-content-faint animate-pulse">
          Laddar portalen...
        </p>
      </div>
    );
  }

  const navigationClassName = ({ isActive }: { isActive: boolean }) =>
    `flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all ${isActive ? "bg-raised text-content shadow-sm" : "text-content-muted hover:text-content"}`;

  const protectedRoute = (element: React.ReactNode) =>
    user ? element : <Navigate to="/login" replace />;

  const publicRoute = (element: React.ReactNode) =>
    user ? <Navigate to="/profile" replace /> : element;

  return (
    <div className="min-h-screen bg-surface pb-12">
      <ScrollToTop />
      {isSeasonalTheme(theme) && <SeasonalDecor theme={theme} />}
      {/* Visas bara om systemet pauserar animationer – annars störande */}
      {isSeasonalTheme(theme) && reducedMotion && (
        <button
          onClick={toggleMotionOverride}
          className="fixed bottom-4 right-4 z-40 text-xs font-medium bg-raised border border-outline text-content-muted px-3 py-2 rounded-full shadow-md hover:text-content"
          title="Systemet har 'reducerad animation' på – välj om appens säsongsanimationer ska köra"
        >
          {motionOverride
            ? "🎬 Animationer på (override) – stäng av"
            : "🎬 Systemet pausar animationer – släpp på"}
        </button>
      )}
      {/* Header */}
      <header className="bg-raised border-b border-outline sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="shrink-0 text-base sm:text-xl font-bold bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
            ⚡️ Challenges Portal
          </h1>

          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
            <ThemeSwitcher theme={theme} onSelect={selectTheme} />
            {user && (
              <>
                <span className="text-xs sm:text-sm text-content-muted max-w-32 sm:max-w-none truncate">
                  <strong className="text-content font-semibold">
                    {user.user_metadata?.alias || user.email}
                  </strong>
                  {isAdmin && (
                    <span className="ml-1.5 text-xs bg-accent-soft text-accent-soft-text px-2 py-0.5 rounded-full font-bold">
                      Admin
                    </span>
                  )}
                </span>
                <Link
                  to="/change-password"
                  className="text-xs text-accent hover:text-accent-hover font-medium"
                >
                  Byt lösenord
                </Link>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="text-xs bg-danger-soft text-danger hover:bg-danger-soft-border px-2.5 py-1.5 font-medium rounded-lg transition-colors"
                >
                  Logga ut
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {user && <AnnouncementToast key={user.id} userId={user.id} />}

      {/* Main Content Area */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-10">
        {user && (
          <nav className="flex bg-inset p-1 rounded-xl shadow-sm mb-6">
            <NavLink to="/profile" className={navigationClassName}>
              Min Utmaning
            </NavLink>
            <NavLink to="/stats" className={navigationClassName}>
              Statistik 📊
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
          <nav className="flex bg-inset p-1 rounded-xl shadow-sm mb-6">
            <NavLink to="/login" className={navigationClassName}>
              Logga in
            </NavLink>
            <NavLink to="/register" className={navigationClassName}>
              Skapa konto
            </NavLink>
          </nav>
        )}

        <div className="bg-raised border border-outline p-4 sm:p-6 lg:p-8 rounded-2xl shadow-sm">
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
            <Route
              path="/profile"
              element={protectedRoute(
                <Profile theme={theme} />,
              )}
            />
            <Route
              path="/stats"
              element={protectedRoute(
                <Suspense
                  fallback={
                    <p className="text-sm text-content-fainter animate-pulse text-center py-6">
                      Laddar...
                    </p>
                  }
                >
                  <Stats />
                </Suspense>,
              )}
            />
            <Route
              path="/stats/:userId"
              element={protectedRoute(
                <Suspense
                  fallback={
                    <p className="text-sm text-content-fainter animate-pulse text-center py-6">
                      Laddar...
                    </p>
                  }
                >
                  <Stats />
                </Suspense>,
              )}
            />
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
