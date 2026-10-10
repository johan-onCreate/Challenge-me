interface SharedProps {
  tiers: string[];
  selectedTier: string;
  onSelectTier: (tier: string) => void;
}

type Props =
  | (SharedProps & {
      mode: "join";
      onStart: () => void;
    })
  | (SharedProps & {
      mode: "change";
      savedTier: string;
      unavailable: boolean;
      loading: boolean;
      message: string;
      onSave: () => void;
      onClearMessage: () => void;
    });

export function ChallengeTierControls(props: Props) {
  if (props.mode === "join") {
    return (
      <div className="bg-inset p-4 rounded-xl border border-outline-soft space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-content-muted">
          Välj din målsättning:
        </label>
        <div className="flex gap-4">
          {props.tiers.map((tier, index) => (
            <label
              key={index}
              className="flex items-center gap-1.5 text-sm font-medium text-content-secondary cursor-pointer"
            >
              <input
                type="radio"
                name="tier"
                value={tier}
                checked={props.selectedTier === tier}
                onChange={(event) => props.onSelectTier(event.target.value)}
                className="text-accent"
              />
              {tier}
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={props.onStart}
          className="w-full mt-2 bg-accent hover:bg-accent-hover text-white font-semibold py-2 rounded-xl text-sm transition-colors"
        >
          Anta utmaningen!
        </button>
      </div>
    );
  }

  return (
    <>
      {props.unavailable && (
        <div className="p-4 rounded-xl border border-warning-soft-border bg-warning-soft text-warning-soft-text space-y-1">
          <p className="text-sm font-bold">Din valda nivå har tagits bort</p>
          <p className="text-xs">
            Nivån <strong>{props.savedTier}</strong> finns inte längre i den här
            utmaningen.{" "}
            {props.tiers.length > 0
              ? "Välj en ny nivå nedan för att fortsätta logga progress."
              : "Admin måste lägga till en ny nivå innan du kan fortsätta."}
          </p>
        </div>
      )}

      {props.tiers.length > 0 && (
        <div className="bg-inset p-4 rounded-xl border border-outline-soft space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-content-muted">
            Ändra nivå
          </label>
          <div className="flex flex-wrap gap-4">
            {props.tiers.map((tier, index) => (
              <label
                key={index}
                className="flex items-center gap-1.5 text-sm font-medium text-content-secondary cursor-pointer"
              >
                <input
                  type="radio"
                  name="saved-tier"
                  value={tier}
                  checked={props.selectedTier === tier}
                  onChange={(event) => {
                    props.onSelectTier(event.target.value);
                    props.onClearMessage();
                  }}
                  className="text-accent"
                />
                {tier}
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={props.onSave}
            disabled={props.loading || props.selectedTier === props.savedTier}
            className="w-full bg-accent hover:bg-accent-hover text-white font-semibold py-2 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {props.loading ? "Sparar..." : "Spara ny nivå"}
          </button>
          {props.message && (
            <p
              className={`text-xs font-medium ${props.message.startsWith("Fel") ? "text-danger" : "text-success-strong"}`}
            >
              {props.message}
            </p>
          )}
        </div>
      )}
    </>
  );
}
