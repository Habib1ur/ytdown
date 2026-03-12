"use client";

import { Loader2, Link2 } from "lucide-react";

export default function AnalyzeForm({ url, setUrl, onAnalyze, isLoading }) {
  return (
    <form onSubmit={onAnalyze} className="card p-4 md:p-5 space-y-3">
      <label htmlFor="url" className="text-sm font-medium opacity-80">
        Media URL (authorized source)
      </label>
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Link2
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60"
          />
          <input
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://cdn.example.com/video.mp4"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent pl-10 pr-3 py-3 outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-xl px-5 py-3 font-bold text-white bg-teal-700 hover:bg-teal-600 disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="animate-spin" size={16} /> : null}
          Analyze
        </button>
      </div>
      <p className="text-xs opacity-70">
        This platform is for content you own or have permission to process.
      </p>
    </form>
  );
}
