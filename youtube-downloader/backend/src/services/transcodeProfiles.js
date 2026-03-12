const VIDEO_PROFILES = [
  { label: "144p", height: 144 },
  { label: "240p", height: 240 },
  { label: "360p", height: 360 },
  { label: "480p", height: 480 },
  { label: "720p", height: 720 },
  { label: "1080p", height: 1080 },
  { label: "1440p", height: 1440 },
  { label: "2160p", height: 2160 },
];

const AUDIO_PROFILES = [
  { label: "mp3", codec: "libmp3lame", ext: "mp3", bitrate: "320k" },
  { label: "m4a", codec: "aac", ext: "m4a", bitrate: "256k" },
];

function listFormats(meta) {
  const maxHeight = meta.height || 1080;
  const video = VIDEO_PROFILES.filter((p) => p.height <= maxHeight).map(
    (p) => ({
      type: "video",
      quality: p.label,
      size: null,
    }),
  );
  const audio = AUDIO_PROFILES.map((p) => ({
    type: "audio",
    quality: p.label,
    size: null,
  }));
  return [...video, ...audio];
}

function getVideoProfile(quality) {
  return VIDEO_PROFILES.find((p) => p.label === quality) || VIDEO_PROFILES[4];
}

function getAudioProfile(quality) {
  return AUDIO_PROFILES.find((p) => p.label === quality) || AUDIO_PROFILES[0];
}

module.exports = {
  listFormats,
  getVideoProfile,
  getAudioProfile,
};
