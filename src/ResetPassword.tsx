import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get("token_hash");
    const tokenType = params.get("type");

    if (!tokenHash || tokenType !== "recovery") {
      setVerifyingToken(false);
      return;
    }

    supabase.auth
      .verifyOtp({ token_hash: tokenHash, type: "recovery" })
      .then(({ error }) => {
        if (error) {
          setMessage(`Fel: ${error.message}`);
        }
        setVerifyingToken(false);
      });
  }, []);

  const handlePasswordUpdate = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");

    if (password.length < 6) {
      setMessage("Fel: Lösenordet måste vara minst 6 tecken.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Fel: Lösenorden matchar inte.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(`Fel: ${error.message}`);
    } else {
      setMessage("Lösenordet har uppdaterats. Du skickas till profilen...");
      setTimeout(() => navigate("/profile", { replace: true }), 1000);
    }
    setLoading(false);
  };

  if (verifyingToken) {
    return (
      <p className="text-sm text-slate-500 text-center py-6">
        Verifierar återställningslänken...
      </p>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Välj nytt lösenord
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Ange ett nytt lösenord för ditt konto.
        </p>
      </div>

      <form onSubmit={handlePasswordUpdate} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Nytt lösenord
          </label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm font-medium transition-all outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Bekräfta lösenord
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm font-medium transition-all outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-4 rounded-xl shadow-sm text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Sparar..." : "Spara nytt lösenord"}
        </button>
      </form>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border ${message.startsWith("Fel") ? "bg-rose-50 text-rose-800 border-rose-100" : "bg-emerald-50 text-emerald-800 border-emerald-100"}`}
        >
          {message}
        </div>
      )}

      <Link
        to="/login"
        className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        Tillbaka till inloggning
      </Link>
    </div>
  );
}

export default ResetPassword;
