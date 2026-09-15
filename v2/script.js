(() => {
  "use strict";

  const CONFIG = window.TEMPLE_TV_V2_CONFIG;
  if (!CONFIG) {
    console.error("Temple TV V2: config.js did not load.");
    return;
  }

  const state = {
    settings: { ...CONFIG.defaults },
    announcements: [],
    flyers: [],
    specialEvents: [],
    weeklySchedule: [],
    upcomingEvents: [],
    bgmRows: [],
    scenes: [],
    sceneIndex: 0,
    sceneTimer: null,
    sceneStartedAt: 0,
    currentSceneEl: null,
    remoteRefreshTimer: null,
    bgmCheckTimer: null,
    scheduleRefreshTimer: null,
    activeAudioIndex: 0,
    activeBgmSignature: "",
    activeBgmPlaylist: [],
    activeBgmTrackIndex: 0,
    audioBlocked: false,
    fetchStats: { success: 0, failed: 0, cache: 0 }
  };

  const els = {
    app: document.getElementById("app"),
    logo: document.getElementById("temple-logo"),
    templeName: document.getElementById("temple-name"),
    templeSubtitle: document.getElementById("temple-subtitle"),
    templeLocation: document.getElementById("temple-location"),
    headerDate: document.getElementById("header-date"),
    clock: document.getElementById("clock"),
    connectionStatus: document.getElementById("connection-status"),
    connectionLabel: document.getElementById("connection-label"),
    mainLayout: document.getElementById("main-layout"),
    sceneStage: document.getElementById("scene-stage"),
    sceneProgress: document.getElementById("scene-progress"),
    sceneDots: document.getElementById("scene-dots"),
    todayLabel: document.getElementById("today-label"),
    tomorrowLabel: document.getElementById("tomorrow-label"),
    todaySchedule: document.getElementById("today-schedule-list"),
    tomorrowSchedule: document.getElementById("tomorrow-schedule-list"),
    tomorrowCard: document.getElementById("tomorrow-card"),
    communityCard: document.getElementById("community-card"),
    communityQr: document.getElementById("community-qr"),
    announcementTrack: document.getElementById("announcement-track"),
    upcomingTrack: document.getElementById("upcoming-track"),
    audioA: document.getElementById("audio-a"),
    audioB: document.getElementById("audio-b")
  };

  const PRIORITY_WEIGHT = {
    EMERGENCY: 0,
    FESTIVAL: 1,
    IMPORTANT: 2,
    NORMAL: 3
  };

  const DEFAULT_END_MINUTES = 90;
  const CACHE_PREFIX = "temple-tv-v2:";

  function normalize(value) {
    return String(value ?? "").trim();
  }

  function upper(value) {
    return normalize(value).toUpperCase();
  }

  function yes(value) {
    return ["YES", "Y", "TRUE", "1", "ACTIVE"].includes(upper(value));
  }

  function numberOr(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function safeText(value, fallback = "") {
    const v = normalize(value);
    return v || fallback;
  }

  function parseCSV(text) {
    if (!text || !text.trim()) return [];

    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;

    for (let i = 0; i < text.length; i += 1) {
      const c = text[i];
      const next = text[i + 1];

      if (c === '"') {
        if (quoted && next === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = !quoted;
        }
      } else if (c === "," && !quoted) {
        row.push(field);
        field = "";
      } else if ((c === "\n" || c === "\r") && !quoted) {
        if (c === "\r" && next === "\n") i += 1;
        row.push(field);
        field = "";
        if (row.some(cell => normalize(cell) !== "")) rows.push(row);
        row = [];
      } else {
        field += c;
      }
    }

    row.push(field);
    if (row.some(cell => normalize(cell) !== "")) rows.push(row);
    return rows;
  }

  function csvToObjects(text) {
    const rows = parseCSV(text);
    if (!rows.length) return [];

    const headers = rows[0].map(h => normalize(h));
    return rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        if (!header) return;
        obj[header] = row[index] ?? "";
      });
      return obj;
    }).filter(obj => Object.values(obj).some(v => normalize(v) !== ""));
  }

  function cacheKey(name) {
    return `${CACHE_PREFIX}${name}`;
  }

  async function fetchCsvWithCache(name, url) {
    if (!url) return [];

    try {
      const joiner = url.includes("?") ? "&" : "?";
      const response = await fetch(`${url}${joiner}_=${Date.now()}`, {
        cache: "no-store",
        mode: "cors"
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const text = await response.text();
      if (!text.trim()) throw new Error("Empty CSV response");
      localStorage.setItem(cacheKey(name), text);
      localStorage.setItem(`${cacheKey(name)}:time`, String(Date.now()));
      state.fetchStats.success += 1;
      return csvToObjects(text);
    } catch (error) {
      console.warn(`Temple TV V2: ${name} remote load failed`, error);
      const cached = localStorage.getItem(cacheKey(name));
      if (cached) {
        state.fetchStats.cache += 1;
        return csvToObjects(cached);
      }
      state.fetchStats.failed += 1;
      return [];
    }
  }

  function parseSettings(rows) {
    const result = { ...CONFIG.defaults };
    rows.forEach(row => {
      const key = normalize(row.Setting || row.Key);
      if (!key) return;
      const raw = row.Value;
      if (raw === undefined || raw === null || raw === "") return;
      result[key] = raw;
    });

    result.DefaultSceneDuration = numberOr(result.DefaultSceneDuration, 15);
    result.TransitionDurationMs = clamp(numberOr(result.TransitionDurationMs, 900), 250, 3000);
    result.RemoteRefreshMinutes = clamp(numberOr(result.RemoteRefreshMinutes, 5), 1, 60);
    result.AnnouncementPixelsPerSecond = clamp(numberOr(result.AnnouncementPixelsPerSecond, 65), 20, 180);
    result.UpcomingPixelsPerSecond = clamp(numberOr(result.UpcomingPixelsPerSecond, 55), 20, 180);
    result.BgmVolume = clamp(numberOr(result.BgmVolume, 0.30), 0, 1);
    return result;
  }

  function applySettings() {
    document.documentElement.style.setProperty("--transition-ms", `${state.settings.TransitionDurationMs}ms`);
    els.templeName.textContent = state.settings.TempleName || CONFIG.defaults.TempleName;
    els.templeSubtitle.textContent = state.settings.TempleSubtitle || CONFIG.defaults.TempleSubtitle;
    els.templeLocation.textContent = state.settings.Location || CONFIG.defaults.Location;
    els.logo.src = CONFIG.assets.logo;
    els.communityQr.src = CONFIG.assets.whatsappQr;

    els.tomorrowCard.style.display = yes(state.settings.ShowTomorrow) ? "block" : "none";
    els.communityCard.style.display = yes(state.settings.ShowCommunity) ? "grid" : "none";
    els.connectionStatus.classList.toggle("hidden-status", !yes(state.settings.ShowStatusIndicator));
  }

  function getTimeZone() {
    return state.settings.Timezone || CONFIG.defaults.Timezone || "America/New_York";
  }

  function zonedParts(date = new Date()) {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: getTimeZone(),
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
    const parts = formatter.formatToParts(date);
    const map = {};
    parts.forEach(p => {
      if (p.type !== "literal") map[p.type] = p.value;
    });
    return {
      year: Number(map.year),
      month: Number(map.month),
      day: Number(map.day),
      weekday: map.weekday,
      hour: Number(map.hour) % 24,
      minute: Number(map.minute),
      second: Number(map.second)
    };
  }

  function dateKeyFromParts(parts) {
    const mm = String(parts.month).padStart(2, "0");
    const dd = String(parts.day).padStart(2, "0");
    return `${parts.year}-${mm}-${dd}`;
  }

  function localDateFromParts(parts) {
    return new Date(parts.year, parts.month - 1, parts.day, 12, 0, 0, 0);
  }

  function getTodayDate() {
    return localDateFromParts(zonedParts());
  }

  function addDays(date, amount) {
    const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
    copy.setDate(copy.getDate() + amount);
    return copy;
  }

  function formatDateLabel(date, options = {}) {
    return new Intl.DateTimeFormat("en-US", {
      weekday: options.weekday || "short",
      month: options.month || "short",
      day: options.day || "numeric",
      year: options.year,
      timeZone: getTimeZone()
    }).format(date);
  }

  function updateClock() {
    const now = new Date();
    const tz = getTimeZone();
    els.clock.textContent = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }).format(now);
    els.headerDate.textContent = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(now).toUpperCase();
  }

  function parseSheetDate(value) {
    const raw = normalize(value);
    if (!raw) return null;

    let match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) {
      return new Date(Number(match[3]), Number(match[1]) - 1, Number(match[2]), 12, 0, 0, 0);
    }

    match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0, 0);
    }

    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 12, 0, 0, 0);
    }
    return null;
  }

  function dateOnlyTime(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0).getTime();
  }

  function isSameDate(a, b) {
    return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function parseTimeToMinutes(value) {
    const raw = upper(value).replace(/\s+/g, " ");
    if (!raw) return null;

    let match = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
    if (match) {
      let hour = Number(match[1]) % 12;
      if (match[3] === "PM") hour += 12;
      return hour * 60 + Number(match[2]);
    }

    match = raw.match(/^(\d{1,2})\s*(AM|PM)$/);
    if (match) {
      let hour = Number(match[1]) % 12;
      if (match[2] === "PM") hour += 12;
      return hour * 60;
    }

    match = raw.match(/^(\d{1,2}):(\d{2})$/);
    if (match) return Number(match[1]) * 60 + Number(match[2]);
    return null;
  }

  function currentMinutesInTimezone() {
    const p = zonedParts();
    return p.hour * 60 + p.minute;
  }

  function nthWeekdayOccurrence(date) {
    return Math.floor((date.getDate() - 1) / 7) + 1;
  }

  function weekdayName(date) {
    return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date).toUpperCase();
  }

  function weekdayMatches(value, date) {
    const rule = upper(value || "ALL");
    if (!rule || rule === "ALL") return true;

    const day = weekdayName(date);
    if (rule === day) return true;

    const match = rule.match(/^(SUNDAY|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY)-(\d)$/);
    if (match) return day === match[1] && nthWeekdayOccurrence(date) === Number(match[2]);
    return false;
  }

  function getField(row, ...names) {
    for (const name of names) {
      const exact = Object.keys(row).find(k => upper(k) === upper(name));
      if (exact !== undefined) return row[exact];
    }
    return "";
  }

  function isWithinDateRange(row, date) {
    const start = parseSheetDate(getField(row, "StartDate", "Start Date"));
    const end = parseSheetDate(getField(row, "EndDate", "End Date"));
    const target = dateOnlyTime(date);
    if (start && target < dateOnlyTime(start)) return false;
    if (end && target > dateOnlyTime(end)) return false;
    return true;
  }

  function rowHasDateOverride(row) {
    return Boolean(normalize(getField(row, "StartDate", "Start Date")) || normalize(getField(row, "EndDate", "End Date")));
  }

  function weeklyRowsForDate(date) {
    const day = weekdayName(date);
    const occurrence = nthWeekdayOccurrence(date);

    const candidates = state.weeklySchedule.filter(row => {
      if (!yes(getField(row, "Active"))) return false;
      const rowDay = upper(getField(row, "Weekday"));
      if (rowDay !== day) return false;

      const weekNumber = upper(getField(row, "WeekNumber", "Week Number") || "ALL");
      if (weekNumber !== "ALL" && Number(weekNumber) !== occurrence) return false;
      return isWithinDateRange(row, date);
    });

    const grouped = new Map();
    candidates.forEach(row => {
      const key = upper(getField(row, "Program"));
      if (!key) return;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(row);
    });

    const selected = [];
    grouped.forEach(rows => {
      const overrides = rows.filter(rowHasDateOverride);
      const pool = overrides.length ? overrides : rows.filter(row => !rowHasDateOverride(row));
      selected.push(...pool);
    });

    return selected.map(row => ({
      title: safeText(getField(row, "Program"), "Temple Program"),
      time: safeText(getField(row, "Time"), ""),
      endTime: safeText(getField(row, "EndTime", "End Time"), ""),
      source: "weekly"
    }));
  }

  function specialRowsForDate(date) {
    return state.specialEvents
      .filter(row => yes(getField(row, "Active")))
      .filter(row => {
        const d = parseSheetDate(getField(row, "Date"));
        return d && isSameDate(d, date);
      })
      .map(row => ({
        title: safeText(getField(row, "Program", "Event"), "Special Event"),
        event: safeText(getField(row, "Event"), ""),
        time: safeText(getField(row, "Time"), ""),
        endTime: safeText(getField(row, "EndTime", "End Time"), ""),
        source: "special"
      }));
  }

  function scheduleForDate(date) {
    const combined = [...weeklyRowsForDate(date), ...specialRowsForDate(date)];
    const seen = new Set();
    const unique = combined.filter(item => {
      const key = `${upper(item.title)}|${upper(item.time)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    unique.sort((a, b) => {
      const ta = parseTimeToMinutes(a.time);
      const tb = parseTimeToMinutes(b.time);
      if (ta === null && tb === null) return a.title.localeCompare(b.title);
      if (ta === null) return 1;
      if (tb === null) return -1;
      return ta - tb;
    });

    const today = getTodayDate();
    const nowMin = currentMinutesInTimezone();
    unique.forEach(item => {
      item.status = "upcoming";
      if (!isSameDate(date, today)) return;
      const start = parseTimeToMinutes(item.time);
      if (start === null) return;
      const end = parseTimeToMinutes(item.endTime) ?? (start + DEFAULT_END_MINUTES);
      if (nowMin >= end) item.status = "completed";
      else if (nowMin >= start && nowMin < end) item.status = "current";
    });

    return unique;
  }

  function renderRailSchedule(container, date, limit) {
    const rows = scheduleForDate(date).slice(0, limit);
    container.innerHTML = "";
    container.classList.remove("has-items");
    container.removeAttribute("data-count");
    container.style.removeProperty("--schedule-count");

    if (!rows.length) {
      const empty = document.createElement("div");
      empty.className = "no-programs";
      empty.textContent = "No scheduled programs";
      container.appendChild(empty);
      return;
    }

    container.classList.add("has-items");
    container.dataset.count = String(rows.length);
    container.style.setProperty("--schedule-count", String(rows.length));

    rows.forEach(item => {
      const row = document.createElement("div");
      row.className = `schedule-item ${item.status}`;

      const time = document.createElement("div");
      time.className = "schedule-time";
      time.textContent = item.time || "—";

      const title = document.createElement("div");
      title.className = "schedule-program";
      title.textContent = item.title;

      const status = document.createElement("div");
      status.className = "schedule-state";
      status.textContent = item.status === "current" ? "NOW" : item.status === "completed" ? "✓ Done" : "Upcoming";

      row.append(time, title, status);
      container.appendChild(row);
    });
  }

  function updateSchedules() {
    const today = getTodayDate();
    const tomorrow = addDays(today, 1);
    els.todayLabel.textContent = formatDateLabel(today, { weekday: "short", month: "short", day: "numeric" });
    els.tomorrowLabel.textContent = formatDateLabel(tomorrow, { weekday: "short", month: "short", day: "numeric" });
    renderRailSchedule(els.todaySchedule, today, 5);
    renderRailSchedule(els.tomorrowSchedule, tomorrow, 4);
  }

  function driveIdFromUrl(url) {
    const raw = normalize(url);
    if (!raw) return "";
    const match = raw.match(/\/d\/([a-zA-Z0-9_-]+)/) || raw.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : "";
  }

  function imageUrl(url) {
    const raw = normalize(url);
    if (!raw) return "";
    const id = driveIdFromUrl(raw);
    if (id) return `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w2400`;
    return raw;
  }

  function audioUrl(url) {
    const raw = normalize(url);
    if (!raw) return "";
    const id = driveIdFromUrl(raw);
    if (id) return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`;
    return raw;
  }

  function sceneIsActive(row, nowDate) {
    if (!yes(getField(row, "Active"))) return false;

    const start = parseSheetDate(getField(row, "StartDate", "Start Date"));
    const end = parseSheetDate(getField(row, "EndDate", "End Date"));
    const target = dateOnlyTime(nowDate);
    if (start && target < dateOnlyTime(start)) return false;
    if (end && target > dateOnlyTime(end)) return false;

    if (!weekdayMatches(getField(row, "Weekday") || "ALL", nowDate)) return false;

    const startTime = parseTimeToMinutes(getField(row, "StartTime", "Start Time"));
    const endTime = parseTimeToMinutes(getField(row, "EndTime", "End Time"));
    const nowMin = currentMinutesInTimezone();
    if (startTime !== null && nowMin < startTime) return false;
    if (endTime !== null && nowMin >= endTime) return false;

    return true;
  }

  function normalizeScene(row, index) {
    return {
      SceneID: safeText(getField(row, "SceneID"), `SCENE-${index + 1}`),
      Type: upper(getField(row, "Type") || "HERO_FLYER"),
      Title: safeText(getField(row, "Title"), ""),
      Subtitle: safeText(getField(row, "Subtitle"), ""),
      ImageURL: imageUrl(getField(row, "ImageURL", "Image URL")),
      Duration: clamp(numberOr(getField(row, "Duration"), state.settings.DefaultSceneDuration), 5, 120),
      Transition: upper(getField(row, "Transition") || "FADE"),
      DisplayOrder: numberOr(getField(row, "DisplayOrder", "Display Order"), index + 1),
      Priority: upper(getField(row, "Priority") || "NORMAL"),
      Active: getField(row, "Active")
    };
  }

  function buildScenes(displayRows) {
    const nowDate = getTodayDate();
    let scenes = displayRows
      .filter(row => sceneIsActive(row, nowDate))
      .map(normalizeScene)
      .sort((a, b) => {
        const pa = PRIORITY_WEIGHT[a.Priority] ?? PRIORITY_WEIGHT.NORMAL;
        const pb = PRIORITY_WEIGHT[b.Priority] ?? PRIORITY_WEIGHT.NORMAL;
        return pa - pb || a.DisplayOrder - b.DisplayOrder;
      });

    if (!scenes.length) {
      const flyerScenes = state.flyers
        .filter(row => yes(getField(row, "Active")))
        .sort((a, b) => numberOr(getField(a, "DisplayOrder"), 999) - numberOr(getField(b, "DisplayOrder"), 999))
        .map((row, index) => ({
          SceneID: `FLYER-FALLBACK-${index + 1}`,
          Type: "HERO_FLYER",
          Title: "",
          Subtitle: "",
          ImageURL: imageUrl(getField(row, "ImageURL", "Image URL")),
          Duration: state.settings.DefaultSceneDuration,
          Transition: ["FADE", "SLIDE", "ZOOM"][index % 3],
          DisplayOrder: index + 1,
          Priority: "NORMAL"
        }));

      scenes = flyerScenes.concat(CONFIG.fallbackScenes.map((row, index) => normalizeScene({ ...row, Active: "YES" }, flyerScenes.length + index)));
    }

    if (!scenes.length) {
      scenes = CONFIG.fallbackScenes.map((row, index) => normalizeScene({ ...row, Active: "YES" }, index));
    }

    state.scenes = scenes;
    state.sceneIndex = Math.min(state.sceneIndex, Math.max(0, scenes.length - 1));
    renderDots();
    preloadAllLikelyImages();
  }

  function preloadImage(url) {
    return new Promise(resolve => {
      if (!url) return resolve(false);
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  function preloadAllLikelyImages() {
    state.scenes.slice(0, 5).forEach(scene => {
      if (scene.ImageURL) preloadImage(scene.ImageURL);
    });
  }

  function makeEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined && text !== null) el.textContent = text;
    return el;
  }

  function transitionClass(scene) {
    const t = upper(scene.Transition);
    if (t === "SLIDE") return "transition-slide";
    if (t === "ZOOM") return "transition-zoom";
    if (t === "REVEAL") return "transition-reveal";
    if (t === "WIPE") return "transition-wipe";
    return "transition-fade";
  }

  function buildHeroScene(scene) {
    const root = makeEl("div", `scene hero-scene ${transitionClass(scene)}`);
    const wrap = makeEl("div", "hero-image-wrap");
    if (scene.ImageURL) {
      // Preserve the entire flyer while still filling the stage elegantly.
      // The same image is used as a softly blurred backdrop so portrait or
      // non-16:9 artwork never creates harsh empty bars.
      wrap.style.setProperty("--hero-bg", `url("${scene.ImageURL.replace(/"/g, '\\"')}")`);
    }
    const img = document.createElement("img");
    img.className = "hero-image";
    img.alt = scene.Title || "Temple flyer";
    img.src = scene.ImageURL || "";
    wrap.appendChild(img);
    root.appendChild(wrap);

    if (scene.Title || scene.Subtitle) {
      const overlay = makeEl("div", "hero-overlay");
      if (scene.Title) overlay.appendChild(makeEl("h2", "", scene.Title));
      if (scene.Subtitle) overlay.appendChild(makeEl("p", "", scene.Subtitle));
      root.appendChild(overlay);
    }
    return root;
  }

  function buildSplitScene(scene) {
    const root = makeEl("div", `scene split-scene ${transitionClass(scene)}`);
    const image = makeEl("div", "split-image");
    if (scene.ImageURL) {
      const img = document.createElement("img");
      img.src = scene.ImageURL;
      img.alt = scene.Title || "Temple program";
      image.appendChild(img);
    }

    const copy = makeEl("div", "split-copy");
    copy.appendChild(makeEl("div", "eyebrow", scene.Type === "BALAVIHAR" ? "CULTURE • VALUES • LEARNING" : "TEMPLE PROGRAM"));
    copy.appendChild(makeEl("h2", "split-title", scene.Title || "Temple Program"));
    if (scene.Subtitle) copy.appendChild(makeEl("div", "split-subtitle", scene.Subtitle));
    copy.appendChild(makeEl("div", "split-accent"));

    root.append(image, copy);
    return root;
  }

  function buildScheduleScene(scene) {
    const root = makeEl("div", `scene schedule-scene ${transitionClass(scene)}`);
    const header = makeEl("div", "schedule-scene-header");
    const left = makeEl("div");
    left.appendChild(makeEl("div", "eyebrow", "TODAY AT DEVI TEMPLE"));
    left.appendChild(makeEl("h2", "schedule-scene-title", scene.Title || "Today's Schedule"));
    const date = makeEl("div", "schedule-scene-date", formatDateLabel(getTodayDate(), { weekday: "long", month: "long", day: "numeric" }));
    header.append(left, date);
    root.appendChild(header);

    const list = makeEl("div", "schedule-scene-list");
    const rows = scheduleForDate(getTodayDate()).slice(0, 6);
    if (!rows.length) {
      const empty = makeEl("div", "no-programs", "No scheduled programs today");
      empty.style.minHeight = "260px";
      list.appendChild(empty);
    } else {
      rows.forEach((item, index) => {
        const row = makeEl("div", `schedule-scene-row ${item.status}`);
        row.style.animationDelay = `${160 + index * 115}ms`;
        row.append(
          makeEl("div", "schedule-scene-time", item.time || "—"),
          makeEl("div", "schedule-scene-program", item.title),
          makeEl("div", "schedule-scene-status", item.status === "current" ? "NOW" : item.status === "completed" ? "Completed" : "Upcoming")
        );
        list.appendChild(row);
      });
    }
    root.appendChild(list);
    return root;
  }

  function buildCommunityScene(scene) {
    const root = makeEl("div", `scene community-scene ${transitionClass(scene)}`);
    const copy = makeEl("div", "community-scene-copy");
    copy.appendChild(makeEl("div", "eyebrow", "STAY CONNECTED"));
    copy.appendChild(makeEl("h2", "community-scene-title", scene.Title || "Join Our Community"));
    copy.appendChild(makeEl("p", "", scene.Subtitle || "Scan the QR code for temple updates, events, classes and seva opportunities."));

    const qr = makeEl("div", "community-scene-qr");
    const img = document.createElement("img");
    img.src = CONFIG.assets.whatsappQr;
    img.alt = "Temple WhatsApp QR code";
    qr.appendChild(img);
    root.append(copy, qr);
    return root;
  }

  function buildDevotionalScene(scene) {
    const root = makeEl("div", `scene devotional-scene ${transitionClass(scene)}`);

    if (scene.ImageURL) {
      root.classList.add("has-image");
      const bg = document.createElement("img");
      bg.className = "devotional-bg";
      bg.src = scene.ImageURL;
      bg.alt = "";
      root.appendChild(bg);
    }

    const panel = makeEl("div", "devotional-panel");
    panel.appendChild(makeEl("div", "devotional-eyebrow", "CHINMAYA SARASWATI ASHRAM"));
    panel.appendChild(makeEl("div", "devotional-symbol", "ॐ"));
    panel.appendChild(makeEl("h2", "devotional-title", scene.Title || "Hari Om"));
    panel.appendChild(makeEl("div", "devotional-subtitle", scene.Subtitle || "Knowledge • Devotion • Service"));
    panel.appendChild(makeEl("div", "devotional-line"));
    root.appendChild(panel);
    return root;
  }

  function buildAnnouncementScene(scene) {
    const root = makeEl("div", `scene announcement-scene ${transitionClass(scene)}`);
    root.appendChild(makeEl("div", "eyebrow", scene.Priority === "EMERGENCY" ? "IMPORTANT NOTICE" : "TEMPLE ANNOUNCEMENT"));
    root.appendChild(makeEl("h2", "announcement-title", scene.Title || "Temple Announcement"));
    if (scene.Subtitle) root.appendChild(makeEl("div", "announcement-subtitle", scene.Subtitle));
    return root;
  }

  function buildSceneElement(scene) {
    switch (scene.Type) {
      case "SCHEDULE": return buildScheduleScene(scene);
      case "COMMUNITY": return buildCommunityScene(scene);
      case "DEVOTIONAL": return buildDevotionalScene(scene);
      case "ANNOUNCEMENT": return buildAnnouncementScene(scene);
      case "EVENT_SPLIT":
      case "PROGRAM":
      case "FEATURED_EVENT":
      case "BALAVIHAR": return buildSplitScene(scene);
      case "HERO_FLYER":
      default: return buildHeroScene(scene);
    }
  }

  function renderDots() {
    els.sceneDots.innerHTML = "";
    if (state.scenes.length <= 1 || state.scenes.length > 10) {
      els.sceneDots.style.display = "none";
      return;
    }
    els.sceneDots.style.display = "flex";
    state.scenes.forEach((_, index) => {
      const dot = makeEl("span", `scene-dot ${index === state.sceneIndex ? "active" : ""}`);
      els.sceneDots.appendChild(dot);
    });
  }

  function updateDots() {
    Array.from(els.sceneDots.children).forEach((dot, index) => {
      dot.classList.toggle("active", index === state.sceneIndex);
    });
  }

  function runProgress(durationSeconds) {
    els.sceneProgress.classList.remove("run");
    els.sceneProgress.style.animationDuration = `${durationSeconds}s`;
    // Force reflow so the animation restarts.
    void els.sceneProgress.offsetWidth;
    els.sceneProgress.classList.add("run");
  }

  async function showScene(index, immediate = false) {
    if (!state.scenes.length) return;
    clearTimeout(state.sceneTimer);

    state.sceneIndex = ((index % state.scenes.length) + state.scenes.length) % state.scenes.length;
    const scene = state.scenes[state.sceneIndex];
    const nextScene = state.scenes[(state.sceneIndex + 1) % state.scenes.length];

    // Keep the current scene on screen until the next image is actually ready.
    // This prevents white flashes or blank frames on slower network connections.
    if (scene?.ImageURL) await preloadImage(scene.ImageURL);
    if (nextScene?.ImageURL) preloadImage(nextScene.ImageURL);

    const nextEl = buildSceneElement(scene);
    const previous = state.currentSceneEl;
    els.sceneStage.appendChild(nextEl);

    // TD-Bank-style scene choreography: informational scenes temporarily
    // take over the full presentation canvas, while flyer/program scenes
    // retain the persistent Today/Tomorrow/Community rail.
    const takeoverTypes = new Set([
      "SCHEDULE",
      "COMMUNITY",
      "DEVOTIONAL",
      "FEATURED_EVENT",
      "ANNOUNCEMENT"
    ]);
    const takeover = takeoverTypes.has(scene.Type);
    els.mainLayout.classList.toggle("takeover", takeover);
    els.mainLayout.dataset.sceneType = scene.Type;

    if (immediate) {
      nextEl.classList.add("is-entered");
      if (previous) previous.remove();
    } else {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => nextEl.classList.add("is-entered"));
      });
      if (previous) {
        previous.classList.remove("is-entered");
        previous.classList.add("is-leaving");
        window.setTimeout(() => previous.remove(), state.settings.TransitionDurationMs + 100);
      }
    }

    state.currentSceneEl = nextEl;
    state.sceneStartedAt = Date.now();
    updateDots();
    runProgress(scene.Duration);

    state.sceneTimer = window.setTimeout(() => {
      showScene(state.sceneIndex + 1);
    }, scene.Duration * 1000);
  }

  function sanitizeAnnouncementRows(rows) {
    const texts = [];
    rows.forEach(row => {
      const first = Object.values(row)[0];
      const text = normalize(first);
      if (!text || upper(text) === "ANNOUNCEMENT") return;
      texts.push(text);
    });
    return texts;
  }

  function upcomingItems(rows) {
    const today = getTodayDate();
    return rows
      .filter(row => yes(getField(row, "Active")))
      .map(row => ({
        date: parseSheetDate(getField(row, "Date")),
        event: safeText(getField(row, "Event"), "Temple Event"),
        time: safeText(getField(row, "Time"), ""),
        order: numberOr(getField(row, "DisplayOrder", "Display Order"), 999)
      }))
      .filter(item => item.date && dateOnlyTime(item.date) >= dateOnlyTime(today))
      .sort((a, b) => a.order - b.order || dateOnlyTime(a.date) - dateOnlyTime(b.date));
  }

  function makeTickerCopy(items) {
    const copy = makeEl("div", "ticker-copy");
    items.forEach((item, index) => {
      const span = makeEl("span", "", item);
      copy.appendChild(span);
      if (index !== items.length - 1) copy.appendChild(makeEl("span", "sep", "•"));
    });
    return copy;
  }

  function setupTicker(track, items, pixelsPerSecond) {
    track.innerHTML = "";
    let safeItems = items.filter(Boolean);
    if (!safeItems.length) safeItems = ["Hari Om"];

    const baseChars = safeItems.join(" • ").length;
    const repeatCount = baseChars < 80 ? Math.ceil(80 / Math.max(baseChars, 1)) : 1;
    const expanded = [];
    for (let i = 0; i < repeatCount; i += 1) expanded.push(...safeItems);

    const copyA = makeTickerCopy(expanded);
    const copyB = makeTickerCopy(expanded);
    track.append(copyA, copyB);

    requestAnimationFrame(() => {
      const distance = copyA.getBoundingClientRect().width;
      const seconds = clamp(distance / pixelsPerSecond, 14, 120);
      track.style.setProperty("--ticker-duration", `${seconds}s`);
      track.style.animation = "none";
      void track.offsetWidth;
      track.style.animation = `marquee ${seconds}s linear infinite`;
    });
  }

  function updateTickers() {
    const announcements = state.announcements.length ? state.announcements : CONFIG.fallbackAnnouncements;
    setupTicker(els.announcementTrack, announcements, state.settings.AnnouncementPixelsPerSecond);

    const upcoming = upcomingItems(state.upcomingEvents).slice(0, 12).map(item => {
      const dateText = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(item.date);
      return `${dateText} — ${item.event}${item.time ? ` • ${item.time}` : ""}`;
    });
    setupTicker(els.upcomingTrack, upcoming.length ? upcoming : ["Please check temple announcements for upcoming events"], state.settings.UpcomingPixelsPerSecond);
  }

  function updateConnectionStatus() {
    const live = navigator.onLine && state.fetchStats.success > 0;
    els.connectionStatus.classList.toggle("offline", !live);
    els.connectionLabel.textContent = live ? "LIVE" : state.fetchStats.cache > 0 ? "CACHED" : "OFFLINE";
  }

  function bgmWeekdayMatches(row, nowDate) {
    return weekdayMatches(getField(row, "Weekday") || "ALL", nowDate);
  }

  function bgmTimeMatches(row) {
    const start = parseTimeToMinutes(getField(row, "Start Time", "StartTime"));
    const end = parseTimeToMinutes(getField(row, "End Time", "EndTime"));
    const now = currentMinutesInTimezone();
    if (start !== null && now < start) return false;
    if (end !== null && now >= end) return false;
    return true;
  }

  function chooseBgmPlaylist() {
    const nowDate = getTodayDate();
    const active = state.bgmRows
      .filter(row => yes(getField(row, "Active")))
      .filter(row => bgmWeekdayMatches(row, nowDate))
      .filter(bgmTimeMatches)
      .sort((a, b) => numberOr(getField(a, "DisplayOrder", "Display Order"), 999) - numberOr(getField(b, "DisplayOrder", "Display Order"), 999));

    const special = active.filter(row => upper(getField(row, "Type")) === "SPECIAL");
    const defaults = active.filter(row => upper(getField(row, "Type")) === "DEFAULT");
    const chosen = special.length ? special : defaults;

    const urls = chosen.map(row => audioUrl(getField(row, "MusicURL", "Music URL"))).filter(Boolean);
    if (!urls.length && CONFIG.assets.fallbackMusic) urls.push(CONFIG.assets.fallbackMusic);
    return urls;
  }

  function fadeAudio(audio, from, to, durationMs, onDone) {
    const steps = 24;
    let step = 0;
    const interval = Math.max(20, Math.floor(durationMs / steps));
    audio.volume = clamp(from, 0, 1);
    const timer = window.setInterval(() => {
      step += 1;
      const progress = step / steps;
      audio.volume = clamp(from + (to - from) * progress, 0, 1);
      if (step >= steps) {
        window.clearInterval(timer);
        audio.volume = clamp(to, 0, 1);
        if (onDone) onDone();
      }
    }, interval);
  }

  async function startAudioUrl(url, crossfade = true) {
    if (!url) return;

    const outgoing = state.activeAudioIndex === 0 ? els.audioA : els.audioB;
    const incoming = state.activeAudioIndex === 0 ? els.audioB : els.audioA;
    incoming.src = url;
    incoming.volume = 0;
    incoming.loop = false;

    try {
      await incoming.play();
      state.audioBlocked = false;
      const target = state.settings.BgmVolume;
      const fadeMs = crossfade ? 1400 : 350;
      fadeAudio(incoming, 0, target, fadeMs);
      if (!outgoing.paused && !outgoing.ended) {
        fadeAudio(outgoing, outgoing.volume, 0, fadeMs, () => {
          outgoing.pause();
          outgoing.removeAttribute("src");
          outgoing.load();
        });
      }
      state.activeAudioIndex = state.activeAudioIndex === 0 ? 1 : 0;
    } catch (error) {
      console.warn("Temple TV V2: autoplay blocked", error);
      state.audioBlocked = true;
    }
  }

  function checkBgmSchedule(force = false) {
    const playlist = chooseBgmPlaylist();
    const signature = playlist.join("||");
    if (!playlist.length) return;

    if (force || signature !== state.activeBgmSignature) {
      state.activeBgmSignature = signature;
      state.activeBgmPlaylist = playlist;
      state.activeBgmTrackIndex = 0;
      startAudioUrl(playlist[0], true);
    }
  }

  function onAudioEnded() {
    if (!state.activeBgmPlaylist.length) return;
    state.activeBgmTrackIndex = (state.activeBgmTrackIndex + 1) % state.activeBgmPlaylist.length;
    startAudioUrl(state.activeBgmPlaylist[state.activeBgmTrackIndex], false);
  }

  function setupAudio() {
    els.audioA.addEventListener("ended", onAudioEnded);
    els.audioB.addEventListener("ended", onAudioEnded);

    const unlock = () => {
      if (state.audioBlocked || els.audioA.paused && els.audioB.paused) {
        checkBgmSchedule(true);
      }
    };
    document.addEventListener("pointerdown", unlock, { passive: true });
    document.addEventListener("keydown", unlock);
  }

  async function loadAllRemoteData(initial = false) {
    state.fetchStats = { success: 0, failed: 0, cache: 0 };

    const settingsRows = await fetchCsvWithCache("signageSettings", CONFIG.feeds.signageSettings);
    state.settings = parseSettings(settingsRows);
    applySettings();

    const [announcementRows, flyerRows, specialRows, weeklyRows, upcomingRows, bgmRows, displayRows] = await Promise.all([
      fetchCsvWithCache("announcements", CONFIG.feeds.announcements),
      fetchCsvWithCache("flyers", CONFIG.feeds.flyers),
      fetchCsvWithCache("specialEvents", CONFIG.feeds.specialEvents),
      fetchCsvWithCache("weeklySchedule", CONFIG.feeds.weeklySchedule),
      fetchCsvWithCache("upcomingEvents", CONFIG.feeds.upcomingEvents),
      fetchCsvWithCache("bgm", CONFIG.feeds.bgm),
      fetchCsvWithCache("displayScenes", CONFIG.feeds.displayScenes)
    ]);

    state.announcements = sanitizeAnnouncementRows(announcementRows);
    state.flyers = flyerRows;
    state.specialEvents = specialRows;
    state.weeklySchedule = weeklyRows;
    state.upcomingEvents = upcomingRows;
    state.bgmRows = bgmRows;

    updateSchedules();
    updateTickers();
    buildScenes(displayRows);
    updateConnectionStatus();
    checkBgmSchedule(initial);

    if (initial) showScene(0, true);

    clearInterval(state.remoteRefreshTimer);
    state.remoteRefreshTimer = window.setInterval(() => {
      loadAllRemoteData(false).catch(error => console.error("Temple TV V2 refresh failed", error));
    }, state.settings.RemoteRefreshMinutes * 60 * 1000);
  }

  function startTimers() {
    updateClock();
    window.setInterval(updateClock, 1000);

    clearInterval(state.scheduleRefreshTimer);
    state.scheduleRefreshTimer = window.setInterval(() => {
      updateSchedules();
      const scene = state.scenes[state.sceneIndex];
      if (scene?.Type === "SCHEDULE") {
        showScene(state.sceneIndex, false);
      }
    }, 30 * 1000);

    clearInterval(state.bgmCheckTimer);
    state.bgmCheckTimer = window.setInterval(() => checkBgmSchedule(false), 15 * 1000);
  }

  async function init() {
    applySettings();
    startTimers();
    setupAudio();

    window.addEventListener("online", () => loadAllRemoteData(false));
    window.addEventListener("offline", updateConnectionStatus);

    try {
      await loadAllRemoteData(true);
    } catch (error) {
      console.error("Temple TV V2 initial load failed", error);
      state.announcements = CONFIG.fallbackAnnouncements;
      state.scenes = CONFIG.fallbackScenes.map((row, index) => normalizeScene({ ...row, Active: "YES" }, index));
      updateTickers();
      renderDots();
      showScene(0, true);
      updateConnectionStatus();
    }
  }

  init();
})();
