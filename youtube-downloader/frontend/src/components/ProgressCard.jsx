"use client";

import { fileUrl } from "../lib/api";

export default function ProgressCard({ job }) {
  if (!job) return null;

  const done = job.status === "completed";
  const failed = job.status === "failed";

  return (
    <div className="card p-4 md:p-5 space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="opacity-70">Job #{job.jobId}</span>
        <span className="font-semibold capitalize">{job.status}</span>
      </div>
      <div className="h-3 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
        <div
          className="progress-line h-full animate-pulseLine"
          style={{ width: `${Math.max(2, job.progress || 0)}%` }}
        />
      </div>
      <p className="text-sm opacity-80">Progress: {job.progress || 0}%</p>
      {failed ? (
        <p className="text-sm text-red-500">
          {job.error || "Processing failed"}
        </p>
      ) : null}
      {done ? (
        <a
          href={fileUrl(job.jobId)}
          className="inline-block rounded-xl px-4 py-2 text-white font-bold bg-emerald-600 hover:bg-emerald-500"
        >
          Download File
        </a>
      ) : null}
    </div>
  );
}
