import type { FormEventHandler } from "react";

export function ProfileSettings({
  fullName,
  alias,
  profileLoading,
  profileMessage,
  onFullNameChange,
  onAliasChange,
  onSubmit,
}: {
  fullName: string;
  alias: string;
  profileLoading: boolean;
  profileMessage: string;
  onFullNameChange: (value: string) => void;
  onAliasChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  return (
    <section className="space-y-4 border-t border-outline-soft pt-6">
      <h3 className="text-lg font-bold text-content tracking-tight">
        Profilinställningar
      </h3>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={fullName}
            onChange={(event) => onFullNameChange(event.target.value)}
            className="w-full px-3 py-2 border border-outline rounded-xl text-sm"
            placeholder="Namn"
          />
          <input
            type="text"
            value={alias}
            onChange={(event) => onAliasChange(event.target.value)}
            className="w-full px-3 py-2 border border-outline rounded-xl text-sm"
            placeholder="Alias"
          />
        </div>
        <button
          type="submit"
          disabled={profileLoading}
          className="bg-btn hover:bg-btn-hover text-on-btn font-medium py-2 px-4 rounded-xl text-xs"
        >
          {profileLoading ? "Sparar..." : "Spara profil"}
        </button>
      </form>
      {profileMessage && (
        <div className="p-3 text-xs bg-success-soft text-success-soft-text rounded-xl font-medium">
          {profileMessage}
        </div>
      )}
    </section>
  );
}
