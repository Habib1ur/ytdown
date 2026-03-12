"use client";

import { useEffect, useMemo, useState } from "react";
import AnalyzeForm from "../components/AnalyzeForm";
import ThemeToggle from "../components/ThemeToggle";
import PreviewCard from "../components/PreviewCard";
import FormatSelector from "../components/FormatSelector";
import ProgressCard from "../components/ProgressCard";
import { analyzeUrl, getProgress, startDownload } from "../lib/api";
import { getSocket } from "../lib/socket";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [meta, setMeta] = useState(null);
  const [selected, setSelected] = useState(null);
  const [job, setJob] = useState(null);
  const [loadingAnalyze, setLoadingAnalyze] = useState(false);
  const [queueing, setQueueing] = useState(false);
  const [error, setError] = useState("");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    if (!job?.jobId) return;

    const socket = getSocket();
    socket.emit("subscribe-job", job.jobId);

    const onProgress = (event) => {
      if (event.jobId !== job.jobId) return;
      setJob((prev) => ({
        ...prev,
        progress: event.progress,
        status: event.status || prev.status,
      }));
    };

    const onCompleted = (event) => {
      if (event.jobId !== job.jobId) return;
      setJob((prev) => ({ ...prev, progress: 100, status: "completed" }));
    };

    const onFailed = (event) => {
      if (event.jobId !== job.jobId) return;
      setJob((prev) => ({
        ...prev,
        status: "failed",
        error: event.error || "Failed",
      }));
    };

    socket.on("job-progress", onProgress);
    socket.on("job-completed", onCompleted);
    socket.on("job-failed", onFailed);

    return () => {
      socket.off("job-progress", onProgress);
      socket.off("job-completed", onCompleted);
      socket.off("job-failed", onFailed);
    };
  }, [job?.jobId]);

  useEffect(() => {
    if (!job?.jobId) return;
    if (job.status === "completed" || job.status === "failed") return;

    const timer = setInterval(async () => {
      try {
        const data = await getProgress(job.jobId);
        setJob((prev) => ({ ...prev, ...data }));
      } catch {
        // Fallback polling is best-effort when sockets are unavailable.
      }
    }, 1800);

    return () => clearInterval(timer);
  }, [job]);

  async function onAnalyze(e) {
    e.preventDefault();
    setError("");
    setLoadingAnalyze(true);
    setMeta(null);
    setSelected(null);
    setJob(null);

    try {
      const data = await analyzeUrl(url.trim());
      setMeta(data);
      if (Array.isArray(data.formats) && data.formats.length > 0) {
        setSelected(data.formats[0]);
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Analyze failed");
    } finally {
      setLoadingAnalyze(false);
    }
  }

  async function onStart() {
    if (!meta || !selected) return;
    setError("");
    setQueueing(true);
    try {
      const data = await startDownload({
        url: url.trim(),
        format: selected.type,
        quality: selected.quality,
      });
      setJob({
        jobId: data.jobId,
        status: data.status,
        progress: 0,
        error: null,
      });
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to create job");
    } finally {
      setQueueing(false);
    }
  }

  const statusLabel = useMemo(() => {
    if (!job) return "Idle";
    return `${job.status} (${job.progress || 0}%)`;
  }, [job]);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-6">
      <header className="flex items-start md:items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] opacity-70">
            MediaForge Platform
          </p>
          <h1 className="font-display text-3xl md:text-5xl leading-tight">
            Process Media Fast.
            <br />
            Stream Results Securely.
          </h1>
          <p className="mt-2 text-sm md:text-base opacity-75 max-w-2xl">
            Scalable pipeline for authorized media transcoding with queue
            management, real-time progress, and temporary secure downloads.
          </p>
        </div>
        <ThemeToggle dark={dark} onToggle={() => setDark((v) => !v)} />
      </header>

      <AnalyzeForm
        url={url}
        setUrl={setUrl}
        onAnalyze={onAnalyze}
        isLoading={loadingAnalyze}
      />

      {error ? (
        <div className="card p-4 text-sm text-red-500">{error}</div>
      ) : null}

      <section className="grid lg:grid-cols-2 gap-4">
        <PreviewCard data={meta} />
        {meta ? (
          <FormatSelector
            formats={meta.formats || []}
            selected={selected}
            onSelect={setSelected}
            onStart={onStart}
            isSubmitting={queueing}
          />
        ) : null}
      </section>

      <section className="space-y-3">
        <div className="text-sm opacity-70">Current State: {statusLabel}</div>
        <ProgressCard job={job} />
      </section>
    </main>
  );
}
