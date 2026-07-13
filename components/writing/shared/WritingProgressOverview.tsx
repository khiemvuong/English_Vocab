interface WritingProgressOverviewProps {
  currentLabel: string;
  completedItems: number;
  totalItems: number;
  completedUnits: number;
  totalUnits: number;
  progressPercent: number;
  isFinished: boolean;
  itemLabel?: string;
  unitLabel?: string;
}

export function WritingProgressOverview({
  currentLabel,
  completedItems,
  totalItems,
  completedUnits,
  totalUnits,
  progressPercent,
  isFinished,
  itemLabel = "câu",
  unitLabel = "state",
}: WritingProgressOverviewProps) {
  return (
    <div className="mb-3 grid gap-2 rounded-xl border border-white/10 bg-white/3 p-2.5 sm:grid-cols-3">
      <div className="rounded-lg border border-white/10 bg-slate-950/35 p-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tiến trình</p>
        <p className="mt-1 text-sm font-black text-white">
          {completedItems}/{totalItems} {itemLabel} hoàn thành
        </p>
      </div>
      <div className="rounded-lg border border-white/10 bg-slate-950/35 p-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Đang ở</p>
        <p className="mt-1 text-sm font-black text-cyan-100">
          {isFinished ? "Hoàn thành bộ câu hỏi" : currentLabel}
        </p>
      </div>
      <div className="rounded-lg border border-white/10 bg-slate-950/35 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{unitLabel} đã xong</p>
          <span className="text-xs font-black text-white">{progressPercent}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-linear-to-r from-emerald-400 via-cyan-300 to-blue-400 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] font-semibold text-slate-400">
          {completedUnits}/{totalUnits} {unitLabel}
        </p>
      </div>
    </div>
  );
}
