import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { getPasswordResetRedirectUrl } from "./authConfig";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetRequest = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const redirectTo = getPasswordResetRedirectUrl(window.location.origin);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setMessage(
      error
        ? `Fel: ${error.message}`
        : "Om adressen finns registrerad har ett återställningsmail skickats.",
    );
    setLoading(false);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-content tracking-tight">
          Återställ lösenord
        </h2>
        <p className="text-sm text-content-faint mt-1">
          Ange din e-postadress så skickar vi en återställningslänk.
        </p>
      </div>

      <form onSubmit={handleResetRequest} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-1.5">
            E-postadress
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full px-4 py-3 border border-outline rounded-xl bg-inset text-content text-sm font-medium transition-all outline-none focus:bg-raised focus:border-accent focus:ring-2 focus:ring-accent-soft-border"
            placeholder="namn@domän.se"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-btn hover:bg-btn-hover text-on-btn font-medium py-3 px-4 rounded-xl shadow-sm text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Skickar..." : "Skicka återställningslänk"}
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
        to="/login"
        className="block text-center text-sm text-accent hover:text-accent-hover font-medium"
      >
        Tillbaka till inloggning
      </Link>
    </div>
  );
}

export default ForgotPassword;
