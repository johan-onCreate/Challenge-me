import type { FormEventHandler } from "react";

export function ChallengeForm({
  title,
  description,
  points,
  startDate,
  endDate,
  tiers,
  newTierInput,
  editing,
  loading,
  onTitleChange,
  onDescriptionChange,
  onPointsChange,
  onStartDateChange,
  onEndDateChange,
  onNewTierInputChange,
  onAddTier,
  onRemoveTier,
  onCancelEdit,
  onSubmit,
}: {
  title: string;
  description: string;
  points: number;
  startDate: string;
  endDate: string;
  tiers: string[];
  newTierInput: string;
  editing: boolean;
  loading: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPointsChange: (value: number) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onNewTierInputChange: (value: string) => void;
  onAddTier: () => void;
  onRemoveTier: (index: number) => void;
  onCancelEdit: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 bg-inset p-4 rounded-xl border border-outline-soft"
    >
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-sm text-content">
          {editing ? "Redigera utmaning" : "Skapa utmaning"}
        </h4>
        {editing && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-xs text-content-faint hover:text-content font-medium"
          >
            Avbryt redigering
          </button>
        )}
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-1">
          Titel
        </label>
        <input
          type="text"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          required
          className="w-full px-3 py-2 border border-outline rounded-lg text-sm bg-raised outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-1">
          Beskrivning
        </label>
        <textarea
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          required
          rows={2}
          className="w-full px-3 py-2 border border-outline rounded-lg text-sm bg-raised outline-none focus:border-accent"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted">
          Konfigurera Nivåer / Mål
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTierInput}
            onChange={(event) => onNewTierInputChange(event.target.value)}
            className="flex-1 px-3 py-2 border border-outline rounded-lg text-sm bg-raised outline-none"
            placeholder="t.ex. 1000 squats"
          />
          <button
            type="button"
            onClick={onAddTier}
            className="bg-btn text-on-btn px-3 py-2 rounded-lg text-sm font-medium hover:bg-btn-hover"
          >
            Lägg till
          </button>
        </div>

        {tiers.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tiers.map((tier, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 text-xs bg-accent-soft text-accent-soft-text font-semibold px-2.5 py-1 rounded-lg border border-accent-soft-border"
              >
                {tier}
                <button
                  type="button"
                  onClick={() => onRemoveTier(index)}
                  className="text-content-faint hover:text-content font-bold ml-1 text-sm leading-none"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-1">
            Poäng
          </label>
          <input
            type="number"
            value={points}
            onChange={(event) => onPointsChange(Number(event.target.value))}
            required
            className="w-full px-3 py-2 border border-outline rounded-lg text-sm bg-raised"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-1">
            Startdag
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(event) => onStartDateChange(event.target.value)}
            required
            className="w-full px-3 py-2 border border-outline rounded-lg text-sm bg-raised"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-1">
            Slutdag
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(event) => onEndDateChange(event.target.value)}
            required
            className="w-full px-3 py-2 border border-outline rounded-lg text-sm bg-raised"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-accent hover:bg-accent-hover text-white font-medium py-2.5 rounded-lg text-sm shadow-sm transition-colors"
      >
        {loading
          ? "Sparar..."
          : editing
            ? "Spara ändringar"
            : "Skapa utmaning"}
      </button>
    </form>
  );
}
