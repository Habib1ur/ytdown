"use client";

export default function FormatSelector({
  formats,
  selected,
  onSelect,
  onStart,
  isSubmitting,
}) {
  return (
    <div className="card p-4 md:p-5 space-y-4">
      <h3 className="font-display text-xl">Available Outputs</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left opacity-70 border-b border-slate-200 dark:border-slate-700">
              <th className="py-2">Type</th>
              <th className="py-2">Quality</th>
              <th className="py-2">Select</th>
            </tr>
          </thead>
          <tbody>
            {formats.map((f) => {
              const key = `${f.type}:${f.quality}`;
              const active =
                selected &&
                selected.type === f.type &&
                selected.quality === f.quality;
              return (
                <tr
                  key={key}
                  className="border-b border-slate-100 dark:border-slate-800"
                >
                  <td className="py-2 capitalize">{f.type}</td>
                  <td className="py-2">{f.quality}</td>
                  <td className="py-2">
                    <button
                      className={`px-3 py-1.5 rounded-lg border ${
                        active
                          ? "bg-teal-600 text-white border-teal-600"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                      onClick={() => onSelect(f)}
                      type="button"
                    >
                      {active ? "Selected" : "Choose"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={onStart}
        disabled={!selected || isSubmitting}
        className="rounded-xl px-4 py-2.5 font-bold text-white bg-sky-700 hover:bg-sky-600 disabled:opacity-60"
      >
        {isSubmitting ? "Queueing..." : "Start Processing"}
      </button>
    </div>
  );
}
