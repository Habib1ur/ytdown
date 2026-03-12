import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080",
  timeout: 25000,
});

export async function analyzeUrl(url) {
  const { data } = await api.post("/api/analyze", {
    url,
    website: "",
  });
  return data;
}

export async function startDownload(payload) {
  const { data } = await api.post("/api/download", {
    ...payload,
    website: "",
  });
  return data;
}

export async function getProgress(jobId) {
  const { data } = await api.get(`/api/progress/${jobId}`);
  return data;
}

export function fileUrl(jobId) {
  return `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"}/api/file/${jobId}`;
}
