import type { UserProfile } from "./adminTypes";

export function AdminUsers({
  users,
  message,
  resettingUserId,
  onSendPasswordReset,
}: {
  users: UserProfile[];
  message: string;
  resettingUserId: string | null;
  onSendPasswordReset: (user: UserProfile) => void;
}) {
  return (
    <section className="space-y-3 bg-warning-soft p-4 rounded-xl border border-warning-soft-border">
      <div>
        <h4 className="font-bold text-sm text-content">
          Användare ({users.length})
        </h4>
        <p className="text-xs text-content-muted mt-1">
          Skicka en säker återställningslänk till en användare.
        </p>
      </div>
      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-raised p-3 rounded-lg border border-warning-soft-border"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-content truncate">
                {user.alias || user.full_name || "Namnlös användare"}
                {user.is_admin && " (admin)"}
              </p>
              <p className="text-xs text-content-faint truncate">
                {user.email || "Ingen e-postadress"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSendPasswordReset(user)}
              disabled={!user.email || resettingUserId === user.id}
              className="w-full sm:w-auto shrink-0 bg-warning hover:bg-warning-strong text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resettingUserId === user.id ? "Skickar..." : "Återställ"}
            </button>
          </div>
        ))}
      </div>
      {message && (
        <p
          className={`text-xs font-medium ${message.startsWith("Fel") ? "text-danger" : "text-success-strong"}`}
          role="status"
        >
          {message}
        </p>
      )}
    </section>
  );
}
