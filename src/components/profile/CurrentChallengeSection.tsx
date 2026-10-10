import type { FormEventHandler } from "react";
import { getChallengeDates, getMondayFirstOffset } from "../../calendarUtils";
import { calculateProgressPercent } from "../../profileUtils";
import ChallengeCalendar from "../ChallengeCalendar";
import { ChallengeTierControls } from "./ChallengeTierControls";
import { InlineChallengeCalendar } from "./InlineChallengeCalendar";
import {
  ProfileLogManager,
  type ProfileLogEntry,
} from "./ProfileLogManager";
import type { ProfileChallenge } from "./profileTypes";

export function CurrentChallengeSection({
  challenge,
  totalPoints,
  loading,
  currentPoints,
  completed,
  selectedTier,
  savedTier,
  totalLoggedAmount,
  todayDate,
  logs,
  logDate,
  logAmount,
  editingLogId,
  editingAmount,
  editingCalendarDate,
  editingCalendarAmount,
  tierLoading,
  tierMessage,
  onSelectTier,
  onStart,
  onSaveTier,
  onClearTierMessage,
  onLogDateChange,
  onLogAmountChange,
  onSubmitLog,
  onEditingAmountChange,
  onUpdateLog,
  onCancelLogEdit,
  onStartLogEdit,
  onDeleteLog,
  onStartCancel,
  onSaveCalendar,
  onChangeCalendarAmount,
  onSelectCalendarDate,
  onCancelCalendarEdit,
}: {
  challenge: ProfileChallenge | null;
  totalPoints: number;
  loading: boolean;
  currentPoints: number;
  completed: boolean;
  selectedTier: string;
  savedTier: string;
  totalLoggedAmount: number;
  todayDate: string;
  logs: ProfileLogEntry[];
  logDate: string;
  logAmount: string;
  editingLogId: number | null;
  editingAmount: string;
  editingCalendarDate: string | null;
  editingCalendarAmount: string;
  tierLoading: boolean;
  tierMessage: string;
  onSelectTier: (tier: string) => void;
  onStart: () => void;
  onSaveTier: () => void;
  onClearTierMessage: () => void;
  onLogDateChange: (date: string) => void;
  onLogAmountChange: (amount: string) => void;
  onSubmitLog: FormEventHandler<HTMLFormElement>;
  onEditingAmountChange: (amount: string) => void;
  onUpdateLog: (id: number) => void;
  onCancelLogEdit: () => void;
  onStartLogEdit: (log: ProfileLogEntry) => void;
  onDeleteLog: (id: number) => void;
  onStartCancel: () => void;
  onSaveCalendar: () => void;
  onChangeCalendarAmount: (amount: string) => void;
  onSelectCalendarDate: (date: string, amount: number) => void;
  onCancelCalendarEdit: () => void;
}) {
  const minDate = challenge?.start_date
    ? challenge.start_date.split("T")[0]
    : "";
  const maxDate = challenge?.end_date ? challenge.end_date.split("T")[0] : "";
  const maxLogDate = maxDate && maxDate < todayDate ? maxDate : todayDate;
  const tiers = challenge?.tiers || [];
  const challengeDates =
    minDate && maxDate ? getChallengeDates(minDate, maxDate) : [];
  const calendarStartOffset = minDate ? getMondayFirstOffset(minDate) : 0;
  const calendarCells: Array<string | null> = [
    ...Array.from({ length: calendarStartOffset }, () => null),
    ...challengeDates,
  ];
  const loggedAmounts = new Map(
    logs.map((log) => [log.logged_at, log.amount]),
  );
  const unavailable =
    completed && savedTier !== "" && !tiers.includes(savedTier);
  const progressPercent = calculateProgressPercent(
    totalLoggedAmount,
    savedTier,
  );

  return (
    <>
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md flex justify-between items-center">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Din totala poäng
          </p>
          <h3 className="text-3xl font-extrabold text-amber-400 mt-1">
            {totalPoints} XP
          </h3>
        </div>
      </div>

      <section className="space-y-4 border-t border-outline-soft pt-6">
        <h3 className="text-lg font-bold text-content tracking-tight">
          Aktuell utmaning
        </h3>

        {loading ? (
          <p className="text-sm text-content-fainter animate-pulse">
            Hämtar utmaning...
          </p>
        ) : !challenge ? (
          <p className="text-sm text-content-faint italic">
            Ingen aktiv utmaning just nu.
          </p>
        ) : (
          <div className="p-5 border rounded-2xl bg-raised border-outline shadow-sm space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-base text-content">
                  {challenge.title}
                </h4>
                <span className="text-xs px-2.5 py-0.5 font-bold rounded-full bg-warning-soft text-warning-soft-text">
                  +{currentPoints} / {challenge.points} XP
                </span>
              </div>
              <p className="text-sm text-content-muted mt-1">
                {challenge.description}
              </p>
            </div>

            {!completed && tiers.length > 0 && (
              <ChallengeTierControls
                mode="join"
                tiers={tiers}
                selectedTier={selectedTier}
                onSelectTier={onSelectTier}
                onStart={onStart}
              />
            )}

            {completed && (
              <div className="space-y-5 border-t border-outline-soft pt-4">
                {challengeDates.length > 0 && (
                  <InlineChallengeCalendar
                    calendarCells={calendarCells}
                    loggedAmounts={loggedAmounts}
                    todayDate={todayDate}
                    editingDate={editingCalendarDate}
                    editingAmount={editingCalendarAmount}
                    onEditingAmountChange={onChangeCalendarAmount}
                    onSave={onSaveCalendar}
                    onCancel={onCancelCalendarEdit}
                    onSelectDate={onSelectCalendarDate}
                  />
                )}

                <ChallengeTierControls
                  mode="change"
                  tiers={tiers}
                  selectedTier={selectedTier}
                  onSelectTier={onSelectTier}
                  savedTier={savedTier}
                  unavailable={unavailable}
                  loading={tierLoading}
                  message={tierMessage}
                  onSave={onSaveTier}
                  onClearMessage={onClearTierMessage}
                />

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-content-muted uppercase">
                    <span>
                      Framsteg: {totalLoggedAmount} / {savedTier}
                    </span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-inset h-3 rounded-full overflow-hidden border border-outline/50">
                    <div
                      className="bg-success h-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <ProfileLogManager
                  logDate={logDate}
                  minDate={minDate}
                  maxLogDate={maxLogDate}
                  logAmount={logAmount}
                  logs={logs}
                  editingLogId={editingLogId}
                  editingAmount={editingAmount}
                  onLogDateChange={onLogDateChange}
                  onLogAmountChange={onLogAmountChange}
                  onSubmitLog={onSubmitLog}
                  onEditingAmountChange={onEditingAmountChange}
                  onUpdateLog={onUpdateLog}
                  onCancelEdit={onCancelLogEdit}
                  onStartEdit={onStartLogEdit}
                  onDeleteLog={onDeleteLog}
                  onStartCancel={onStartCancel}
                />
              </div>
            )}

            {challengeDates.length > 0 && (
              <ChallengeCalendar
                startDate={minDate}
                endDate={maxDate}
                todayDate={todayDate}
                loggedAmounts={loggedAmounts}
                editingDate={editingCalendarDate}
                editingAmount={editingCalendarAmount}
                onEditingAmountChange={onChangeCalendarAmount}
                onSelectDate={onSelectCalendarDate}
                onSave={onSaveCalendar}
                onCancel={onCancelCalendarEdit}
              />
            )}
          </div>
        )}
      </section>
    </>
  );
}
