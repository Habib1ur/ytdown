"use client";

export default function PreviewCard({ data }) {
  if (!data) return null;

  return (
    <div className="card p-4 md:p-5 space-y-3">
      <h3 className="font-display text-xl">Media Preview</h3>
      <div className="grid md:grid-cols-[160px_1fr] gap-4 items-start">
        <div className="rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 aspect-video animate-floaty">
          {data.thumbnail ? (
            <img
              src={data.thumbnail}
              alt="thumbnail"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-xs opacity-70">
              No thumbnail
            </div>
          )}
        </div>
        <div>
          <h4 className="font-semibold text-lg">{data.title}</h4>
          <p className="text-sm opacity-70">
            Duration: {Math.round(data.duration || 0)} seconds
          </p>
        </div>
      </div>
    </div>
  );
}
