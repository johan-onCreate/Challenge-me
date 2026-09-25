import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function ChangePassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (event: FormEvent) => {
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
      setMessage("Lösenordet har uppdaterats!");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => navigate("/profile", { replace: true }), 1000);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Byt lösenord
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Välj ett nytt lösenord för ditt konto.
        </p>
      </div>

      <form onSubmit={handlePasswordChange} className="space-y-4">
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
            className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm font-medium outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
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
            className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm font-medium outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-4 rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
        to="/profile"
        className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        Tillbaka till profilen
      </Link>
    </div>
  );
}

export default ChangePassword;
