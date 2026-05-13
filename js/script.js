const storageKey = "mimi-bio-settings";
const dbName = "mimi-bio-media";
const dbStore = "files";

const defaults = {
  ownerCode: "290123",
  name: "Mimi",
  tagline: "digital profile - links - socials",
  bio:
    "Welcome to my corner of the internet. Add your short intro here: what you make, where people can find you, and the vibe you want them to remember.",
  avatarUrl: "https://api.dicebear.com/9.x/glass/svg?seed=Mimi&backgroundColor=111827",
  profileBannerUrl: "",
  profileBannerSourceType: "url",
  bannerUrl: "assets/media/background-small.mp4",
  verified: true,
  primaryLabel: "Discord",
  primaryUrl: "https://discord.com",
  copyLabel: "Copy Tag",
  copyValue: "mimi#0001",
  musicLabel: "Now Playing",
  musicTrack: "your favorite track",
  audioUrl: "",
  audioSourceType: "url",
  volume: 70,
  textColor: "#f7f7fb",
  mutedColor: "#8d8585",
  hotColor: "#ff0717",
  mintColor: "#ff0717",
  goldColor: "#ff0717",
  blueColor: "#ffffff",
  stats: [
    { value: "13.7k", label: "views" },
    { value: "04", label: "links" },
    { value: "UK", label: "based" },
  ],
  links: [
    { title: "Steam", subtitle: "profile", url: "https://steamcommunity.com" },
    { title: "Discord", subtitle: "server", url: "https://discord.com" },
    { title: "Spotify", subtitle: "playlist", url: "https://open.spotify.com" },
    { title: "X", subtitle: "@yourname", url: "https://x.com" },
  ],
};

const profile = document.querySelector(".profile");
const copyButton = document.querySelector("[data-copy]");
const toast = document.querySelector(".toast");
const playButton = document.querySelector(".play");
const audio = document.querySelector("[data-audio]");
const volumeSlider = document.querySelector("[data-volume]");
const ownerChip = document.querySelector("[data-owner-open]");
const ownerGate = document.querySelector("[data-owner-gate]");
const gateForm = document.querySelector("[data-gate-form]");
const gateCode = document.querySelector("[data-gate-code]");
const editor = document.querySelector("[data-editor]");
const statEditor = document.querySelector("[data-stat-editor]");
const linkEditor = document.querySelector("[data-link-editor]");
const avatarUpload = document.querySelector("[data-avatar-upload]");
const profileBannerUpload = document.querySelector("[data-profile-banner-upload]");
const audioUpload = document.querySelector("[data-audio-upload]");
const root = document.documentElement;

let settings = loadSettings();
let toastTimer;
let uploadedAudioUrl;
let uploadedProfileBannerUrl;

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return normalizeSettings(mergeSettings(defaults, saved || {}));
  } catch {
    return structuredClone(defaults);
  }
}

function mergeSettings(base, saved) {
  return {
    ...structuredClone(base),
    ...saved,
    stats: saved.stats || base.stats,
    links: saved.links || base.links,
  };
}

function saveSettings() {
  localStorage.setItem(storageKey, JSON.stringify(settings));
}

function normalizeSettings(value) {
  const oldBackground = "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1400&q=80";
  const oldMovedBackground = "assets/background.mp4";
  const oldLargeBackground = "assets/media/background.mp4";
  const oldTheme = {
    mutedColor: "#a5adbd",
    hotColor: "#ff4f87",
    mintColor: "#35f0c2",
    goldColor: "#ffd166",
    blueColor: "#65a7ff",
  };

  Object.entries(oldTheme).forEach(([key, oldValue]) => {
    if (value[key] === oldValue) {
      value[key] = defaults[key];
    }
  });

  if (value.bannerUrl === oldBackground) {
    value.bannerUrl = defaults.bannerUrl;
  }

  if (value.bannerUrl === oldMovedBackground) {
    value.bannerUrl = defaults.bannerUrl;
  }

  if (value.bannerUrl === oldLargeBackground) {
    value.bannerUrl = defaults.bannerUrl;
  }

  if (value.ownerCode === "mimi") {
    value.ownerCode = defaults.ownerCode;
  }

  const oldDefaultLinkTitles = ["Instagram", "TikTok", "YouTube", "Spotify"];
  if (
    Array.isArray(value.links) &&
    value.links.length === 4 &&
    value.links.every((item, index) => item.title === oldDefaultLinkTitles[index])
  ) {
    value.links = structuredClone(defaults.links);
  }

  if (Array.isArray(value.links) && value.links.length === 1 && value.links[0].title === "X") {
    value.links = structuredClone(defaults.links);
  }

  return value;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1600);
}

function text(selector, value) {
  document.querySelector(selector).textContent = value;
}

function applySettings() {
  document.title = `${settings.name} | Bio`;
  document.querySelector(".profile").setAttribute("aria-label", `${settings.name} bio card`);
  text("[data-name]", settings.name);
  text("[data-tagline]", settings.tagline);
  text("[data-bio]", settings.bio);
  text("[data-primary-label]", settings.primaryLabel);
  text("[data-copy-label]", settings.copyLabel);
  text("[data-music-label]", settings.musicLabel);
  text("[data-music-track]", settings.musicTrack);
  volumeSlider.value = settings.volume;
  audio.volume = Math.min(Math.max(Number(settings.volume) || 0, 0), 100) / 100;

  const avatar = document.querySelector("[data-avatar]");
  avatar.src = settings.avatarUrl;
  avatar.alt = `${settings.name} avatar`;
  applyProfileBannerSettings().catch(() => showToast("Banner could not load"));
  applyBackgroundMedia(settings.bannerUrl);
  applyAudioSettings().catch(() => showToast("Audio could not load"));

  document.querySelector("[data-verified]").hidden = !settings.verified;
  document.querySelector("[data-primary]").href = settings.primaryUrl || "#";
  copyButton.dataset.copy = settings.copyValue;

  root.style.setProperty("--text", settings.textColor);
  root.style.setProperty("--muted", settings.mutedColor);
  root.style.setProperty("--hot", settings.hotColor);
  root.style.setProperty("--mint", settings.mintColor);
  root.style.setProperty("--gold", settings.goldColor);
  root.style.setProperty("--blue", settings.blueColor);

  renderStats();
  renderLinks();
}

async function applyProfileBannerSettings() {
  if (uploadedProfileBannerUrl) {
    URL.revokeObjectURL(uploadedProfileBannerUrl);
    uploadedProfileBannerUrl = undefined;
  }

  let source = settings.profileBannerUrl || "";
  let uploadedBlobType = "";

  if (settings.profileBannerSourceType === "upload") {
    const blob = await getMediaBlob("profileBanner");
    if (blob) {
      uploadedBlobType = blob.type;
      uploadedProfileBannerUrl = URL.createObjectURL(blob);
      source = uploadedProfileBannerUrl;
    }
  }

  const bannerVideo = document.querySelector("[data-profile-banner-video]");
  const isVideo = uploadedBlobType
    ? uploadedBlobType.startsWith("video/")
    : /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(source);

  root.style.setProperty(
    "--profile-banner-image",
    source && !isVideo ? `url("${source}")` : "rgba(0, 0, 0, 0.28)",
  );

  if (!source || !isVideo) {
    bannerVideo.pause();
    bannerVideo.removeAttribute("src");
    bannerVideo.hidden = true;
    return;
  }

  if (bannerVideo.getAttribute("src") !== source) {
    bannerVideo.src = source;
    bannerVideo.load();
  }

  bannerVideo.hidden = false;
  bannerVideo.play().catch(() => {});
}

async function applyAudioSettings() {
  if (uploadedAudioUrl) {
    URL.revokeObjectURL(uploadedAudioUrl);
    uploadedAudioUrl = undefined;
  }

  if (settings.audioSourceType === "upload") {
    const blob = await getMediaBlob("audio");
    if (blob) {
      uploadedAudioUrl = URL.createObjectURL(blob);
      audio.src = uploadedAudioUrl;
      return;
    }
  }

  audio.src = settings.audioUrl || "";
}

function applyBackgroundMedia(source) {
  const safeSource = source || defaults.bannerUrl;
  const isVideo = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(safeSource);
  const pageVideo = document.querySelector("[data-page-bg-video]");

  root.style.setProperty("--page-image", `url("${safeSource}")`);

  if (!isVideo) {
    pageVideo.pause();
    pageVideo.removeAttribute("src");
    pageVideo.hidden = true;
    return;
  }

  if (pageVideo.getAttribute("src") !== safeSource) {
    pageVideo.src = safeSource;
    pageVideo.load();
  }

  pageVideo.hidden = false;
  pageVideo.play().catch(() => {});
}

function renderStats() {
  document.querySelector("[data-stats]").innerHTML = settings.stats
    .map((item) => `<span><strong>${escapeHtml(item.value)}</strong>${escapeHtml(item.label)}</span>`)
    .join("");
}

function renderLinks() {
  document.querySelector("[data-links]").innerHTML = settings.links
    .filter((item) => item.title.trim() || item.url.trim())
    .map(
      (item) => `
        <a href="${escapeAttribute(item.url || "#")}" target="_blank" rel="noreferrer">
          <span>${escapeHtml(item.title || "Link")}</span>
          <small>${escapeHtml(item.subtitle || item.url)}</small>
        </a>
      `,
    )
    .join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return map[char];
  });
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function openGate() {
  ownerGate.hidden = false;
  gateCode.value = "";
  gateCode.focus();
}

function closeGate() {
  ownerGate.hidden = true;
}

function openEditor() {
  closeGate();
  editor.hidden = false;
  ownerChip.hidden = true;
  buildEditor();
}

function closeEditor() {
  editor.hidden = true;
  ownerChip.hidden = false;
}

function buildEditor() {
  document.querySelectorAll("[data-field]").forEach((input) => {
    const key = input.dataset.field;
    if (input.type === "checkbox") {
      input.checked = Boolean(settings[key]);
    } else {
      input.value = settings[key] ?? "";
    }
  });

  statEditor.innerHTML = settings.stats
    .map(
      (item, index) => `
        <div class="mini-card">
          <label>Value<input data-stat="${index}" data-stat-key="value" value="${escapeAttribute(item.value)}" /></label>
          <label>Label<input data-stat="${index}" data-stat-key="label" value="${escapeAttribute(item.label)}" /></label>
        </div>
      `,
    )
    .join("");

  linkEditor.innerHTML = settings.links
    .map(
      (item, index) => `
        <div class="mini-card">
          <label>Title<input data-link="${index}" data-link-key="title" value="${escapeAttribute(item.title)}" /></label>
          <label>Subtitle<input data-link="${index}" data-link-key="subtitle" value="${escapeAttribute(item.subtitle)}" /></label>
          <label>URL<input data-link="${index}" data-link-key="url" value="${escapeAttribute(item.url)}" /></label>
        </div>
      `,
    )
    .join("");
}

function readEditor() {
  document.querySelectorAll("[data-field]").forEach((input) => {
    const key = input.dataset.field;
    settings[key] = input.type === "checkbox" ? input.checked : input.value;
  });

  if (settings.audioUrl.trim()) {
    settings.audioSourceType = "url";
  }

  if (settings.profileBannerUrl.trim()) {
    settings.profileBannerSourceType = "url";
  }

  document.querySelectorAll("[data-stat]").forEach((input) => {
    settings.stats[Number(input.dataset.stat)][input.dataset.statKey] = input.value;
  });

  document.querySelectorAll("[data-link]").forEach((input) => {
    settings.links[Number(input.dataset.link)][input.dataset.linkKey] = input.value;
  });
}

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "e") {
    event.preventDefault();
    openGate();
  }
});

ownerChip.addEventListener("click", openGate);
document.querySelector("[data-gate-close]").addEventListener("click", closeGate);
document.querySelector("[data-editor-close]").addEventListener("click", closeEditor);

gateForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (gateCode.value === settings.ownerCode) {
    openEditor();
    showToast("Editor unlocked");
    return;
  }
  showToast("Wrong passcode");
});

document.querySelector("[data-save]").addEventListener("click", () => {
  readEditor();
  saveSettings();
  applySettings();
  buildEditor();
  showToast("Saved");
});

avatarUpload.addEventListener("change", async () => {
  const file = avatarUpload.files && avatarUpload.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("Choose an image file");
    avatarUpload.value = "";
    return;
  }

  try {
    settings.avatarUrl = await fileToDataUrl(file);
    saveSettings();
    applySettings();
    buildEditor();
    showToast("Avatar uploaded");
  } catch {
    showToast("Avatar is too large");
  } finally {
    avatarUpload.value = "";
  }
});

profileBannerUpload.addEventListener("change", async () => {
  const file = profileBannerUpload.files && profileBannerUpload.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    showToast("Choose an image, GIF, or video");
    profileBannerUpload.value = "";
    return;
  }

  try {
    await setMediaBlob("profileBanner", file);
    settings.profileBannerSourceType = "upload";
    settings.profileBannerUrl = "";
    saveSettings();
    applySettings();
    buildEditor();
    showToast("Banner uploaded");
  } catch {
    showToast("Banner could not be saved");
  } finally {
    profileBannerUpload.value = "";
  }
});

audioUpload.addEventListener("change", async () => {
  const file = audioUpload.files && audioUpload.files[0];
  if (!file) return;

  if (!file.type.startsWith("audio/")) {
    showToast("Choose an audio file");
    audioUpload.value = "";
    return;
  }

  try {
    await setMediaBlob("audio", file);
    settings.audioSourceType = "upload";
    settings.audioUrl = "";
    if (!settings.musicTrack || settings.musicTrack === defaults.musicTrack) {
      settings.musicTrack = file.name.replace(/\.[^.]+$/, "");
    }
    saveSettings();
    applySettings();
    buildEditor();
    showToast("Song uploaded");
  } catch {
    showToast("Song could not be saved");
  } finally {
    audioUpload.value = "";
  }
});

document.querySelector("[data-reset]").addEventListener("click", () => {
  settings = structuredClone(defaults);
  saveSettings();
  applySettings();
  buildEditor();
  showToast("Reset");
});

copyButton.addEventListener("click", async () => {
  const value = copyButton.dataset.copy;

  try {
    await navigator.clipboard.writeText(value);
    showToast(`Copied ${value}`);
  } catch {
    showToast(value);
  }
});

playButton.addEventListener("click", async () => {
  if (!audio.src) {
    showToast("Add a song first");
    return;
  }

  if (audio.paused) {
    try {
      await audio.play();
      playButton.classList.add("is-active");
    } catch {
      showToast("Could not play song");
    }
    return;
  }

  audio.pause();
  playButton.classList.remove("is-active");
});

audio.addEventListener("ended", () => {
  playButton.classList.remove("is-active");
});

audio.addEventListener("pause", () => {
  playButton.classList.remove("is-active");
});

volumeSlider.addEventListener("input", () => {
  settings.volume = Number(volumeSlider.value);
  audio.volume = settings.volume / 100;
  saveSettings();
});

profile.addEventListener("pointermove", (event) => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const rect = profile.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;

  profile.style.transform = `perspective(900px) rotateX(${y * -5}deg) rotateY(${x * 7}deg)`;
});

profile.addEventListener("pointerleave", () => {
  profile.style.transform = "";
});

applySettings();

if (window.location.hash === "#owner") {
  openGate();
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", reject);
    reader.readAsDataURL(file);
  });
}

function openMediaDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.addEventListener("upgradeneeded", () => {
      request.result.createObjectStore(dbStore);
    });

    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
  });
}

async function setMediaBlob(key, blob) {
  const db = await openMediaDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(dbStore, "readwrite");
    transaction.objectStore(dbStore).put(blob, key);
    transaction.addEventListener("complete", () => {
      db.close();
      resolve();
    });
    transaction.addEventListener("error", () => {
      db.close();
      reject(transaction.error);
    });
  });
}

async function getMediaBlob(key) {
  const db = await openMediaDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(dbStore, "readonly");
    const request = transaction.objectStore(dbStore).get(key);
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
    transaction.addEventListener("complete", () => db.close());
  });
}
