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
        <h2 className="text-2xl font-bold text-content tracking-tight">
          Byt lösenord
        </h2>
        <p className="text-sm text-content-faint mt-1">
          Välj ett nytt lösenord för ditt konto.
        </p>
      </div>

      <form onSubmit={handlePasswordChange} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-1.5">
            Nytt lösenord
          </label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 border border-outline rounded-xl bg-inset text-content text-sm font-medium outline-none focus:bg-raised focus:border-accent focus:ring-2 focus:ring-accent-soft-border"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-1.5">
            Bekräfta lösenord
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 border border-outline rounded-xl bg-inset text-content text-sm font-medium outline-none focus:bg-raised focus:border-accent focus:ring-2 focus:ring-accent-soft-border"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-btn hover:bg-btn-hover text-on-btn font-medium py-3 px-4 rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Sparar..." : "Spara nytt lösenord"}
        </button>
      </form>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border ${message.startsWith("Fel") ? "bg-danger-soft text-danger-soft-text border-danger-soft-border" : "bg-success-soft text-success-soft-text border-success-soft-border"}`}
        >
          {message}
        </div>
      )}

      <Link
        to="/profile"
        className="block text-center text-sm text-accent hover:text-accent-hover font-medium"
      >
        Tillbaka till profilen
      </Link>
    </div>
  );
}

export default ChangePassword;
