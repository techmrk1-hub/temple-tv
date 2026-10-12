/* ==========================================================
   CHINMAYA SARASWATI ASHRAM - DEVI TEMPLE
   V1 SCHEDULE SLOW-SCROLL ADD-ON

   Safe add-on:
   - Shows a viewport approximately 3 schedule rows high
   - If more than 3 rows exist, rows scroll upward continuously
   - Uses a very slow, smooth speed (not rotate / page switching)
   - Keeps the Community / QR section visible
   - Does not change existing fonts, schedule data, or main logic
========================================================== */

(() => {

  const MAX_VISIBLE_ROWS = 3;

  /*
    Very slow continuous movement for TV readability.
    Increase only if you later want the list to move faster.
  */
  const SCROLL_PIXELS_PER_SECOND = 8;

  const states = [];


  function ensureStyles() {

    if (document.getElementById("temple-schedule-scroll-styles")) return;

    const style = document.createElement("style");
    style.id = "temple-schedule-scroll-styles";

    style.textContent = `
      #today-schedule-list.schedule-scroll-viewport,
      #tomorrow-schedule-list.schedule-scroll-viewport {
        display: block !important;
        overflow: hidden !important;
        position: relative;
      }

      .schedule-scroll-track {
        display: flex;
        flex-direction: column;
        width: 100%;
        will-change: transform;
        transform: translate3d(0, 0, 0);
      }

      .schedule-scroll-clone {
        pointer-events: none;
      }

      /*
        Sponsors.js may hide the community card on sponsor weeks.
        For this layout the QR must remain visible.
      */
      .community-section[hidden] {
        display: block !important;
      }
    `;

    document.head.appendChild(style);
  }


  function stopAnimation(state) {

    if (state.animationFrame) {
      cancelAnimationFrame(state.animationFrame);
      state.animationFrame = null;
    }

    state.lastTimestamp = null;
    state.offset = 0;
  }


  function observe(state) {

    state.observer.observe(state.element, {
      childList: true
    });
  }


  function disconnect(state) {
    state.observer.disconnect();
  }


  function getDirectItems(element, selector) {

    return Array.from(element.children)
      .filter(child => child.matches(selector));
  }


  function clearAddonState(state) {

    stopAnimation(state);

    state.element.classList.remove("schedule-scroll-viewport");
    state.element.style.height = "";
    state.element.style.maxHeight = "";
  }


  function buildSlowScroll(state) {

    disconnect(state);
    clearAddonState(state);

    /*
      Main V1 rendering replaces the list with normal schedule rows.
      At this point we only work with those direct rows.
    */
    const items = getDirectItems(
      state.element,
      state.itemSelector
    );

    if (items.length <= MAX_VISIBLE_ROWS) {
      observe(state);
      return;
    }

    const computed = getComputedStyle(state.element);
    const parsedGap = parseFloat(computed.rowGap || computed.gap || "0");
    const gap = Number.isFinite(parsedGap) ? parsedGap : 0;

    const track = document.createElement("div");
    track.className = "schedule-scroll-track";
    track.style.gap = `${gap}px`;

    /* Move the real rows into the scrolling track. */
    items.forEach(item => track.appendChild(item));

    /*
      Duplicate the full set so the upward movement can loop
      seamlessly instead of jumping/rotating to another page.
    */
    items.forEach(item => {
      const clone = item.cloneNode(true);
      clone.classList.add("schedule-scroll-clone");
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
    });

    state.element.appendChild(track);
    state.element.classList.add("schedule-scroll-viewport");

    state.track = track;

    /*
      Measure after the track is in the page. The viewport is exactly
      the height needed for the first 3 rows, including their gaps.
    */
    const realItems = Array.from(track.children)
      .slice(0, items.length);

    const firstThreeHeight =
      realItems
        .slice(0, MAX_VISIBLE_ROWS)
        .reduce((total, item) => total + item.getBoundingClientRect().height, 0)
      +
      gap * (MAX_VISIBLE_ROWS - 1);

    if (firstThreeHeight > 0) {
      state.element.style.height = `${Math.ceil(firstThreeHeight)}px`;
      state.element.style.maxHeight = `${Math.ceil(firstThreeHeight)}px`;
    }

    const firstClone = track.children[items.length];

    state.loopHeight = firstClone
      ? firstClone.offsetTop
      : 0;

    state.offset = 0;
    state.lastTimestamp = null;

    const animate = timestamp => {

      if (!state.track || !state.track.isConnected) {
        state.animationFrame = null;
        return;
      }

      if (state.lastTimestamp === null) {
        state.lastTimestamp = timestamp;
      }

      const elapsedSeconds =
        Math.min(100, timestamp - state.lastTimestamp) / 1000;

      state.lastTimestamp = timestamp;

      state.offset +=
        SCROLL_PIXELS_PER_SECOND * elapsedSeconds;

      if (state.loopHeight > 0 && state.offset >= state.loopHeight) {
        state.offset = state.offset % state.loopHeight;
      }

      state.track.style.transform =
        `translate3d(0, -${state.offset.toFixed(2)}px, 0)`;

      state.animationFrame = requestAnimationFrame(animate);
    };

    state.animationFrame = requestAnimationFrame(animate);

    observe(state);
  }


  function scheduleRebuild(state) {

    if (state.refreshTimer) {
      clearTimeout(state.refreshTimer);
    }

    /*
      Wait briefly because the main V1 code writes the whole innerHTML
      during its schedule refresh.
    */
    state.refreshTimer = setTimeout(() => {
      buildSlowScroll(state);
    }, 80);
  }


  function setupList(elementId, itemSelector) {

    const element = document.getElementById(elementId);
    if (!element) return;

    const state = {
      element,
      itemSelector,
      track: null,
      loopHeight: 0,
      offset: 0,
      lastTimestamp: null,
      animationFrame: null,
      refreshTimer: null,
      observer: null
    };

    state.observer = new MutationObserver(() => {
      scheduleRebuild(state);
    });

    states.push(state);

    buildSlowScroll(state);
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

    setupList(
      "today-schedule-list",
      ".schedule-item"
    );

    setupList(
      "tomorrow-schedule-list",
      ".tomorrow-schedule-item"
    );

    keepCommunityVisible();
  }


  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      start,
      { once: true }
    );
  }
  else {
    start();
  }

})();
