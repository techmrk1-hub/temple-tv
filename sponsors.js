/* ==========================================================
   CHINMAYA SARASWATI ASHRAM - DEVI TEMPLE
   CONDITIONAL SEVA SPONSOR CARD

   Safe V1 add-on:
   - Existing header, schedules, flyers and tickers stay unchanged
   - Sponsor heading uses the same typography as Today/Tomorrow
   - Sponsor content uses the same schedule font family and sizes
   - Shows only when active sponsors exist in the current week
   - Shows approximately 3 sponsor rows at a time
   - If more than 3 sponsors exist, scrolls upward continuously
   - Uses the same slow-scroll behavior as Today/Tomorrow schedules
   - Community / QR card always remains visible
========================================================== */

(() => {

  const PUBLISHED_SPONSOR_CSV =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFYXQmFp7zwXk60tmqmK0aAdrrGJUaRUoTEGmKryumu7pRR1yfLf_AGGzx5pj7ArNQfslONPb948-j/pub?gid=2026101101&single=true&output=csv";

  const GVIZ_SPONSOR_CSV =
    "https://docs.google.com/spreadsheets/d/1rljGlqs80q6qdqddXd5Rh6BZE7fAEvG3OsHAny81t1s/gviz/tq?tqx=out:csv&gid=2026101101";

  const REFRESH_MS = 5 * 60 * 1000;
  const MAX_VISIBLE_ROWS = 3;
  const SCROLL_PIXELS_PER_SECOND = 8;

  let sponsors = [];

  const scrollState = {
    track: null,
    viewport: null,
    loopHeight: 0,
    offset: 0,
    lastTimestamp: null,
    animationFrame: null
  };


  function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const next = text[i + 1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          field += '"';
          i++;
        }
        else {
          inQuotes = !inQuotes;
        }
      }
      else if (char === "," && !inQuotes) {
        row.push(field.trim());
        field = "";
      }
      else if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && next === "\n") i++;

        row.push(field.trim());
        field = "";

        if (row.some(value => value !== "")) rows.push(row);
        row = [];
      }
      else {
        field += char;
      }
    }

    if (field || row.length) {
      row.push(field.trim());
      if (row.some(value => value !== "")) rows.push(row);
    }

    return rows;
  }


  function escapeHTML(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  function normalizeHeader(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");
  }


  function parseLocalDate(value) {
    const text = String(value || "").trim();
    if (!text) return null;

    let match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

    if (match) {
      const date = new Date(
        Number(match[3]),
        Number(match[1]) - 1,
        Number(match[2]),
        12, 0, 0, 0
      );

      return Number.isNaN(date.getTime()) ? null : date;
    }

    match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

    if (match) {
      const date = new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
        12, 0, 0, 0
      );

      return Number.isNaN(date.getTime()) ? null : date;
    }

    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }


  function getCurrentWeekRange() {
    const now = new Date();

    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0, 0, 0, 0
    );

    start.setDate(start.getDate() - start.getDay());

    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    return { start, end };
  }


  function deityShouldDisplay(value) {
    const deity = String(value || "").trim();
    if (!deity) return false;

    const normalized = deity
      .toUpperCase()
      .replace(/[^A-Z]/g, "");

    return ![
      "ALL",
      "ALLDEITY",
      "ALLDEITIES",
      "ALLGODS"
    ].includes(normalized);
  }


  function formatSponsorDate(date) {
    return date.toLocaleDateString(
      "en-US",
      {
        weekday: "short",
        month: "short",
        day: "numeric"
      }
    );
  }


  function ensureStyles() {
    if (document.getElementById("temple-sponsor-card-styles")) return;

    const style = document.createElement("style");
    style.id = "temple-sponsor-card-styles";

    style.textContent = `
      .sponsor-section {
        flex: 0 0 auto;
        margin-top: 7px;
        padding-top: 6px;
        border-top: 1px solid var(--line);
        overflow: hidden;
      }

      .sponsor-section[hidden] {
        display: none !important;
      }

      /* Use the exact existing schedule heading typography. */
      .sponsor-section .schedule-ornament {
        height: 18px;
      }

      .sponsor-section .schedule-heading-divider {
        height: 14px;
        margin: 1px 0 7px;
      }

      .sponsor-viewport {
        width: 100%;
        overflow: hidden;
        position: relative;
        padding: 0 1px 1px;
      }

      .sponsor-list {
        display: flex;
        flex-direction: column;
        gap: 5px;
        width: 100%;
        transform: translate3d(0, 0, 0);
        will-change: transform;
      }

      .sponsor-scroll-clone {
        pointer-events: none;
      }

      .sponsor-item {
        flex: 0 0 auto;
        border: 1px solid #ead9b7;
        border-left: 3px solid var(--gold);
        border-radius: 6px;
        padding: 5px 7px 6px;
        background: linear-gradient(90deg, #fffaf0, #fffdf8);
      }

      .sponsor-topline {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px;
      }

      /* Same font and size as schedule program names. */
      .sponsor-type,
      .sponsor-deity,
      .sponsor-name {
        min-width: 0;
        font-family: "Segoe UI", Arial, sans-serif;
        font-size: clamp(14px, .95vw, 18px);
        line-height: 1.16;
        color: #25211e;
        overflow-wrap: anywhere;
      }

      .sponsor-type {
        font-weight: 600;
        color: #65150e;
        text-transform: uppercase;
      }

      .sponsor-deity,
      .sponsor-name {
        font-weight: 600;
      }

      /* Same font and size as Today/Tomorrow time. */
      .sponsor-date {
        flex: 0 0 auto;
        font-family: "Segoe UI", Arial, sans-serif;
        font-size: clamp(14px, .95vw, 18px);
        line-height: 1.15;
        font-weight: 800;
        color: #171717;
        white-space: nowrap;
      }

      .sponsor-info-line {
        display: flex;
        align-items: baseline;
        flex-wrap: wrap;
        gap: 5px;
        margin-top: 3px;
        min-width: 0;
      }

      .sponsor-deity::after {
        content: "•";
        margin-left: 5px;
        color: var(--gold);
      }

      /* Same font family/size as schedule status text. */
      .sponsor-by,
      .sponsor-details {
        font-family: "Segoe UI", Arial, sans-serif;
        font-size: clamp(11px, .75vw, 13px);
        line-height: 1.1;
        font-weight: 700;
        color: #887a70;
      }

      .sponsor-details {
        margin-top: 3px;
        font-weight: 600;
        color: #6d5f55;
      }

      /* Keep QR/community visible during sponsor weeks. */
      .community-section[hidden] {
        display: block !important;
      }

      @media (max-height: 850px) {
        .sponsor-section {
          margin-top: 5px;
          padding-top: 4px;
        }

        .sponsor-list {
          gap: 4px;
        }

        .sponsor-item {
          padding: 4px 6px 5px;
        }
      }
    `;

    document.head.appendChild(style);
  }


  function ensureCard() {
    let card = document.getElementById("weekly-sponsor-section");
    if (card) return card;

    const rail = document.querySelector(".info-rail");
    const community = document.querySelector(".community-section");

    if (!rail || !community) return null;

    card = document.createElement("section");
    card.id = "weekly-sponsor-section";
    card.className = "rail-section sponsor-section";
    card.hidden = true;

    card.innerHTML = `
      <div class="schedule-ornament" aria-hidden="true">
        <span></span>
      </div>

      <div class="schedule-heading">
        SEVA SPONSORS
      </div>

      <div class="schedule-heading-divider">
        <span class="divider-diamond"></span>
      </div>

      <div id="sponsor-viewport" class="sponsor-viewport">
        <div id="weekly-sponsor-list" class="sponsor-list"></div>
      </div>
    `;

    rail.insertBefore(card, community);
    return card;
  }


  function sponsorItemHTML(item) {
    const showDeity = deityShouldDisplay(item.deity);

    const deity = showDeity
      ? `<span class="sponsor-deity">${escapeHTML(item.deity)}</span>`
      : "";

    const details = item.details
      ? `<div class="sponsor-details">${escapeHTML(item.details)}</div>`
      : "";

    return `
      <article class="sponsor-item">
        <div class="sponsor-topline">
          <div class="sponsor-type">${escapeHTML(item.sevaType)}</div>
          <div class="sponsor-date">${escapeHTML(formatSponsorDate(item.date))}</div>
        </div>

        <div class="sponsor-info-line">
          ${deity}
          <span class="sponsor-by">Sponsored by</span>
          <span class="sponsor-name">${escapeHTML(item.sponsorName)}</span>
        </div>

        ${details}
      </article>
    `;
  }


  function stopSponsorScroll() {
    if (scrollState.animationFrame) {
      cancelAnimationFrame(scrollState.animationFrame);
      scrollState.animationFrame = null;
    }

    scrollState.track = null;
    scrollState.viewport = null;
    scrollState.loopHeight = 0;
    scrollState.offset = 0;
    scrollState.lastTimestamp = null;
  }


  function buildSponsorScroll() {
    stopSponsorScroll();

    const viewport = document.getElementById("sponsor-viewport");
    const list = document.getElementById("weekly-sponsor-list");

    if (!viewport || !list) return;

    viewport.style.height = "";
    viewport.style.maxHeight = "";

    const realItems = Array.from(list.children)
      .filter(child => child.classList.contains("sponsor-item") &&
        !child.classList.contains("sponsor-scroll-clone"));

    if (!realItems.length) return;

    const computed = getComputedStyle(list);
    const parsedGap = parseFloat(computed.rowGap || computed.gap || "0");
    const gap = Number.isFinite(parsedGap) ? parsedGap : 0;

    const visibleItems = realItems.slice(0, MAX_VISIBLE_ROWS);

    const viewportHeight =
      visibleItems.reduce(
        (total, item) => total + item.getBoundingClientRect().height,
        0
      )
      +
      gap * Math.max(0, visibleItems.length - 1);

    if (viewportHeight > 0) {
      const height = `${Math.ceil(viewportHeight)}px`;
      viewport.style.height = height;
      viewport.style.maxHeight = height;
    }

    if (realItems.length <= MAX_VISIBLE_ROWS) {
      list.style.transform = "translate3d(0, 0, 0)";
      return;
    }

    /* Duplicate the whole sponsor set for a seamless slow loop. */
    realItems.forEach(item => {
      const clone = item.cloneNode(true);
      clone.classList.add("sponsor-scroll-clone");
      clone.setAttribute("aria-hidden", "true");
      list.appendChild(clone);
    });

    const firstClone = list.children[realItems.length];

    scrollState.track = list;
    scrollState.viewport = viewport;
    scrollState.loopHeight = firstClone ? firstClone.offsetTop : 0;
    scrollState.offset = 0;
    scrollState.lastTimestamp = null;

    const animate = timestamp => {
      if (!scrollState.track || !scrollState.track.isConnected) {
        scrollState.animationFrame = null;
        return;
      }

      if (scrollState.lastTimestamp === null) {
        scrollState.lastTimestamp = timestamp;
      }

      const elapsedSeconds =
        Math.min(100, timestamp - scrollState.lastTimestamp) / 1000;

      scrollState.lastTimestamp = timestamp;

      scrollState.offset +=
        SCROLL_PIXELS_PER_SECOND * elapsedSeconds;

      if (
        scrollState.loopHeight > 0 &&
        scrollState.offset >= scrollState.loopHeight
      ) {
        scrollState.offset =
          scrollState.offset % scrollState.loopHeight;
      }

      scrollState.track.style.transform =
        `translate3d(0, -${scrollState.offset.toFixed(2)}px, 0)`;

      scrollState.animationFrame = requestAnimationFrame(animate);
    };

    scrollState.animationFrame = requestAnimationFrame(animate);
  }


  function renderSponsors() {
    const card = ensureCard();
    const list = document.getElementById("weekly-sponsor-list");
    const community = document.querySelector(".community-section");

    if (!card || !list) return;

    /* QR/community must always remain visible. */
    if (community) {
      community.hidden = false;
      community.removeAttribute("hidden");
    }

    stopSponsorScroll();

    if (!sponsors.length) {
      card.hidden = true;
      list.innerHTML = "";
      return;
    }

    card.hidden = false;
    list.innerHTML = sponsors.map(sponsorItemHTML).join("");

    requestAnimationFrame(() => {
      requestAnimationFrame(buildSponsorScroll);
    });
  }


  async function fetchRows() {
    const urls = [PUBLISHED_SPONSOR_CSV, GVIZ_SPONSOR_CSV];
    let lastError = null;

    for (const url of urls) {
      try {
        const response = await fetch(
          url + (url.includes("?") ? "&" : "?") + "_=" + Date.now(),
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error("Sponsor sheet request failed: " + response.status);
        }

        const text = await response.text();

        if (/^\s*</.test(text)) {
          throw new Error("Sponsor sheet returned HTML instead of CSV.");
        }

        const rows = parseCSV(text);
        if (rows.length) return rows;
      }
      catch (error) {
        lastError = error;
      }
    }

    if (lastError) throw lastError;
    return [];
  }


  async function loadSponsors() {
    try {
      const rows = await fetchRows();

      if (rows.length < 2) {
        sponsors = [];
        renderSponsors();
        return;
      }

      const headers = rows[0].map(normalizeHeader);

      const dateIndex = headers.indexOf("date");
      const sevaTypeIndex = headers.indexOf("sevatype");
      const deityIndex = headers.indexOf("deity");
      const sponsorNameIndex = headers.indexOf("sponsorname");
      const detailsIndex = headers.indexOf("details");
      const activeIndex = headers.indexOf("active");
      const orderIndex = headers.indexOf("displayorder");

      if (dateIndex < 0 || sevaTypeIndex < 0 || sponsorNameIndex < 0) {
        throw new Error("Sponsors sheet is missing required columns.");
      }

      const { start, end } = getCurrentWeekRange();
      const loaded = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];

        const active = activeIndex >= 0
          ? String(row[activeIndex] || "YES").trim().toUpperCase()
          : "YES";

        if (active !== "YES") continue;

        const date = parseLocalDate(row[dateIndex]);
        if (!date || date < start || date >= end) continue;

        const sevaType = String(row[sevaTypeIndex] || "").trim();
        const sponsorName = String(row[sponsorNameIndex] || "").trim();

        if (!sevaType || !sponsorName) continue;

        loaded.push({
          date,
          sevaType,
          deity:
            deityIndex >= 0
              ? String(row[deityIndex] || "").trim()
              : "",
          sponsorName,
          details:
            detailsIndex >= 0
              ? String(row[detailsIndex] || "").trim()
              : "",
          order:
            orderIndex >= 0
              ? (parseInt(row[orderIndex], 10) || 999)
              : 999,
          rowOrder: i
        });
      }

      loaded.sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        if (a.date.getTime() !== b.date.getTime()) return a.date - b.date;
        return a.rowOrder - b.rowOrder;
      });

      sponsors = loaded;
      renderSponsors();
    }
    catch (error) {
      console.warn("Sponsors:", error);

      sponsors = [];
      renderSponsors();
    }
  }


  function keepCommunityVisible() {
    const community = document.querySelector(".community-section");
    if (!community) return;

    const reveal = () => {
      if (community.hidden) community.hidden = false;
      if (community.hasAttribute("hidden")) {
        community.removeAttribute("hidden");
      }
    };

    reveal();

    const observer = new MutationObserver(reveal);

    observer.observe(community, {
      attributes: true,
      attributeFilter: ["hidden"]
    });
  }


  function start() {
    ensureStyles();
    ensureCard();
    keepCommunityVisible();
    loadSponsors();
    setInterval(loadSponsors, REFRESH_MS);
  }


  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  }
  else {
    start();
  }

})();
