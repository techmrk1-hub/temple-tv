/* ==========================================================
   TEMPLE TV DIGITAL SIGNAGE
   Chinmaya Saraswati Ashram - Devi Temple
========================================================== */


// ==========================================================
// STATE
// ==========================================================

let flyers = [];
let currentFlyerIndex = 0;

let specialEvents = [];


// ==========================================================
// ELEMENTS
// ==========================================================

const flyerElement =
  document.getElementById("flyer");

const tickerText =
  document.getElementById("ticker-text");

const upcomingEventsText =
  document.getElementById("upcoming-events-text");

const scheduleList =
  document.getElementById("today-schedule-list");

const clockElement =
  document.getElementById("clock");

const headerDateElement =
  document.getElementById("header-date");


// ==========================================================
// CACHE BUSTER
// ==========================================================

function addCacheBuster(url) {

  const separator =
    url.includes("?") ? "&" : "?";

  return `${url}${separator}_=${Date.now()}`;

}


// ==========================================================
// CSV PARSER
// ==========================================================

function parseCSV(text) {

  const rows = [];

  let row = [];
  let field = "";
  let inQuotes = false;


  for (
    let i = 0;
    i < text.length;
    i++
  ) {

    const char =
      text[i];

    const next =
      text[i + 1];


    if (char === '"') {

      if (
        inQuotes &&
        next === '"'
      ) {

        field += '"';
        i++;

      }

      else {

        inQuotes =
          !inQuotes;

      }

    }

    else if (
      char === "," &&
      !inQuotes
    ) {

      row.push(
        field.trim()
      );

      field = "";

    }

    else if (
      (char === "\n" ||
       char === "\r") &&
      !inQuotes
    ) {

      if (
        char === "\r" &&
        next === "\n"
      ) {
        i++;
      }


      row.push(
        field.trim()
      );

      field = "";


      if (
        row.some(
          value =>
            value !== ""
        )
      ) {

        rows.push(row);

      }


      row = [];

    }

    else {

      field += char;

    }

  }


  if (
    field ||
    row.length
  ) {

    row.push(
      field.trim()
    );


    if (
      row.some(
        value =>
          value !== ""
      )
    ) {

      rows.push(row);

    }

  }


  return rows;

}


// ==========================================================
// CLOCK
// ==========================================================

function updateClock() {

  const now =
    new Date();


  clockElement.textContent =
    now.toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      }
    );


  headerDateElement.textContent =
    now.toLocaleDateString(
      "en-US",
      {
        weekday: "short",
        month: "short",
        day: "numeric"
      }
    ).toUpperCase();

}


updateClock();

setInterval(
  updateClock,
  1000
);


// ==========================================================
// DATE HELPERS
// ==========================================================

function dateKey(date) {

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return `${year}-${month}-${day}`;

}


function normalizeDate(value) {

  if (!value) {
    return "";
  }


  const text =
    String(value).trim();


  const us =
    text.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );


  if (us) {

    return (
      us[3] +
      "-" +
      us[1].padStart(2, "0") +
      "-" +
      us[2].padStart(2, "0")
    );

  }


  const iso =
    text.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    );


  if (iso) {

    return (
      iso[1] +
      "-" +
      iso[2].padStart(2, "0") +
      "-" +
      iso[3].padStart(2, "0")
    );

  }


  const parsed =
    new Date(text);


  if (
    !isNaN(
      parsed.getTime()
    )
  ) {

    return dateKey(parsed);

  }


  return "";

}


// ==========================================================
// ANNOUNCEMENTS
// ==========================================================

function loadLocalAnnouncements() {

  tickerText.textContent =
    templeContent.announcements.join(
      templeContent.separator
    );

}


async function loadAnnouncements() {

  try {

    const response =
      await fetch(
        addCacheBuster(
          templeContent.announcementSheetURL
        ),
        {
          cache: "no-store"
        }
      );


    if (!response.ok) {
      throw new Error(
        "Announcement data unavailable"
      );
    }


    const csv =
      await response.text();


    const rows =
      parseCSV(csv);


    const messages = [];


    rows.forEach(
      (row, index) => {

        row.forEach(
          cell => {

            const value =
              cell.trim();


            if (!value) {
              return;
            }


            if (
              index === 0 &&
              value
                .toLowerCase()
                .includes(
                  "announcement"
                )
            ) {
              return;
            }


            messages.push(value);

          }
        );

      }
    );


    if (
      messages.length
    ) {

      tickerText.textContent =
        messages.join(
          templeContent.separator
        );

    }

    else {

      loadLocalAnnouncements();

    }

  }

  catch (error) {

    console.error(
      error
    );

    loadLocalAnnouncements();

  }

}


// ==========================================================
// DRIVE URL
// ==========================================================

function convertDriveURL(url) {

  if (!url) {
    return "";
  }


  let fileId = "";


  const slashMatch =
    url.match(
      /\/file\/d\/([^/]+)/
    );


  if (slashMatch) {

    fileId =
      slashMatch[1];

  }


  const idMatch =
    url.match(
      /[?&]id=([^&]+)/
    );


  if (
    !fileId &&
    idMatch
  ) {

    fileId =
      idMatch[1];

  }


  if (!fileId) {
    return url;
  }


  return (
    "https://drive.google.com/thumbnail" +
    `?id=${fileId}&sz=w3000`
  );

}


// ==========================================================
// IMAGE VALIDATION
// ==========================================================

function testImage(url) {

  return new Promise(
    resolve => {

      const image =
        new Image();


      image.onload =
        () => resolve(true);


      image.onerror =
        () => resolve(false);


      image.src =
        addCacheBuster(url);

    }
  );

}


// ==========================================================
// FLYERS
// ==========================================================

async function loadRemoteFlyers() {

  try {

    const response =
      await fetch(
        addCacheBuster(
          templeContent.flyerSheetURL
        ),
        {
          cache: "no-store"
        }
      );


    if (!response.ok) {
      throw new Error(
        "Flyer sheet unavailable"
      );
    }


    const rows =
      parseCSV(
        await response.text()
      );


    if (
      rows.length < 2
    ) {

      throw new Error(
        "No remote flyers"
      );

    }


    const headers =
      rows[0].map(
        value =>
          value
            .trim()
            .toLowerCase()
      );


    const imageIndex =
      headers.indexOf(
        "imageurl"
      );

    const activeIndex =
      headers.indexOf(
        "active"
      );

    const orderIndex =
      headers.indexOf(
        "displayorder"
      );


    const remote =
      [];


    for (
      let i = 1;
      i < rows.length;
      i++
    ) {

      const row =
        rows[i];


      const active =
        (
          row[activeIndex] ||
          ""
        )
          .trim()
          .toUpperCase();


      if (
        active !== "YES"
      ) {
        continue;
      }


      const original =
        (
          row[imageIndex] ||
          ""
        ).trim();


      if (!original) {
        continue;
      }


      const url =
        convertDriveURL(
          original
        );


      const order =
        parseInt(
          row[orderIndex],
          10
        ) || 999;


      if (
        await testImage(url)
      ) {

        remote.push(
          {
            url,
            order
          }
        );

      }

    }


    remote.sort(
      (a, b) =>
        a.order - b.order
    );


    flyers =
      remote.length
        ?
        remote.map(
          item =>
            item.url
        )
        :
        templeContent.localFlyers;


    currentFlyerIndex = 0;

    showFlyer();

  }

  catch (error) {

    console.error(
      error
    );


    flyers =
      templeContent.localFlyers;


    currentFlyerIndex = 0;

    showFlyer();

  }

}


// ==========================================================
// DISPLAY FLYER
// ==========================================================

function showFlyer() {

  if (
    !flyerElement ||
    !flyers.length
  ) {
    return;
  }


  flyerElement.classList.remove(
    "flyer-landscape",
    "flyer-portrait",
    "flyer-square",
    "flyer-visible"
  );


  flyerElement.onload =
    () => {

      const ratio =
        flyerElement.naturalWidth /
        flyerElement.naturalHeight;


      if (
        ratio > 1.15
      ) {

        flyerElement
          .classList
          .add(
            "flyer-landscape"
          );

      }

      else if (
        ratio < 0.85
      ) {

        flyerElement
          .classList
          .add(
            "flyer-portrait"
          );

      }

      else {

        flyerElement
          .classList
          .add(
            "flyer-square"
          );

      }


      requestAnimationFrame(
        () =>
          flyerElement
            .classList
            .add(
              "flyer-visible"
            )
      );

    };


  flyerElement.src =
    addCacheBuster(
      flyers[
        currentFlyerIndex
      ]
    );

}


function rotateFlyer() {

  if (
    flyers.length <= 1
  ) {
    return;
  }


  currentFlyerIndex =
    (
      currentFlyerIndex + 1
    ) %
    flyers.length;


  showFlyer();

}


// ==========================================================
// REGULAR SCHEDULE
// ==========================================================

function getSaturdayNumber(date) {

  return Math.ceil(
    date.getDate() / 7
  );

}


function getRegularPrograms(date) {

  const day =
    date.getDay();


  if (
    day === 6
  ) {

    const number =
      getSaturdayNumber(
        date
      );


    return (
      templeContent
        .saturdaySchedule[
          number
        ] ||
      []
    );

  }


  return (
    templeContent
      .weeklySchedule[
        day
      ] ||
    []
  );

}


// ==========================================================
// SPECIAL EVENTS
// ==========================================================

async function loadSpecialEvents() {

  try {

    const response =
      await fetch(
        addCacheBuster(
          templeContent.specialEventsSheetURL
        ),
        {
          cache: "no-store"
        }
      );


    if (!response.ok) {
      throw new Error(
        "Special events unavailable"
      );
    }


    const rows =
      parseCSV(
        await response.text()
      );


    if (
      rows.length < 2
    ) {

      specialEvents = [];

      renderTodaySchedule();

      return;

    }


    const headers =
      rows[0].map(
        value =>
          value
            .trim()
            .toLowerCase()
      );


    const dateIndex =
      headers.indexOf(
        "date"
      );

    const eventIndex =
      headers.indexOf(
        "event"
      );

    const programIndex =
      headers.indexOf(
        "program"
      );

    const timeIndex =
      headers.indexOf(
        "time"
      );

    const activeIndex =
      headers.indexOf(
        "active"
      );


    specialEvents = [];


    for (
      let i = 1;
      i < rows.length;
      i++
    ) {

      const row =
        rows[i];


      const active =
        activeIndex >= 0
          ?
          (
            row[activeIndex] ||
            ""
          )
            .trim()
            .toUpperCase()
          :
          "YES";


      if (
        active !== "YES"
      ) {
        continue;
      }


      const date =
        normalizeDate(
          row[dateIndex]
        );


      if (!date) {
        continue;
      }


      specialEvents.push(
        {
          date,

          event:
            (
              row[eventIndex] ||
              ""
            ).trim(),

          program:
            (
              row[programIndex] ||
              ""
            ).trim(),

          time:
            (
              row[timeIndex] ||
              ""
            ).trim()
        }
      );

    }


    renderTodaySchedule();

  }

  catch (error) {

    console.error(
      error
    );


    specialEvents = [];

    renderTodaySchedule();

  }

}


// ==========================================================
// TODAY SCHEDULE
// Supports multiple programs
// ==========================================================

function renderTodaySchedule() {

  const now =
    new Date();


  const key =
    dateKey(now);


  const programs =
    [];


  // Regular programs
  getRegularPrograms(
    now
  ).forEach(
    item => {

      programs.push(
        {
          title:
            item.title,

          time:
            item.time,

          note:
            ""
        }
      );

    }
  );


  // Special events for today
  specialEvents
    .filter(
      event =>
        event.date === key
    )
    .forEach(
      event => {

        const title =
          event.program ||
          event.event ||
          "Special Temple Program";


        const duplicate =
          programs.some(
            item =>
              item.title
                .toLowerCase() ===
              title
                .toLowerCase()
          );


        if (
          !duplicate
        ) {

          programs.push(
            {
              title,

              time:
                event.time,

              note:
                event.event &&
                event.event !== title
                  ?
                  event.event
                  :
                  ""
            }
          );

        }

      }
    );


  if (
    programs.length === 0
  ) {

    scheduleList.innerHTML =
      `
        <div class="empty-schedule">
          ${templeContent.noProgramMessage}
        </div>
      `;

    return;

  }


  scheduleList.innerHTML =
    programs
      .map(
        program =>
          `
            <article class="schedule-item">

              <div class="schedule-time">
                ${escapeHTML(program.time || "Temple Program")}
              </div>

              <div class="schedule-name">
                ${escapeHTML(program.title)}
              </div>

              ${
                program.note
                  ?
                  `
                    <div class="schedule-note">
                      ${escapeHTML(program.note)}
                    </div>
                  `
                  :
                  ""
              }

            </article>
          `
      )
      .join("");

}


// ==========================================================
// HTML SAFETY
// ==========================================================

function escapeHTML(value) {

  return String(
    value || ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


// ==========================================================
// UPCOMING EVENTS
// ==========================================================

function showUpcomingFallback() {

  upcomingEventsText.textContent =
    templeContent
      .upcomingEventsFallback
      .join(
        templeContent.separator
      );

}


async function loadUpcomingEvents() {

  try {

    const response =
      await fetch(
        addCacheBuster(
          templeContent.upcomingEventsSheetURL
        ),
        {
          cache: "no-store"
        }
      );


    if (!response.ok) {
      throw new Error(
        "Upcoming events unavailable"
      );
    }


    const rows =
      parseCSV(
        await response.text()
      );


    if (
      rows.length < 2
    ) {

      showUpcomingFallback();

      return;

    }


    const headers =
      rows[0].map(
        value =>
          value
            .trim()
            .toLowerCase()
      );


    const dateIndex =
      headers.indexOf(
        "date"
      );

    const eventIndex =
      headers.indexOf(
        "event"
      );

    const timeIndex =
      headers.indexOf(
        "time"
      );

    const activeIndex =
      headers.indexOf(
        "active"
      );

    const orderIndex =
      headers.indexOf(
        "displayorder"
      );


    const today =
      new Date();


    today.setHours(
      0,
      0,
      0,
      0
    );


    const events =
      [];


    for (
      let i = 1;
      i < rows.length;
      i++
    ) {

      const row =
        rows[i];


      const active =
        activeIndex >= 0
          ?
          (
            row[activeIndex] ||
            ""
          )
            .trim()
            .toUpperCase()
          :
          "YES";


      if (
        active !== "YES"
      ) {
        continue;
      }


      const title =
        (
          row[eventIndex] ||
          ""
        ).trim();


      if (!title) {
        continue;
      }


      const normalized =
        normalizeDate(
          row[dateIndex]
        );


      if (!normalized) {
        continue;
      }


      const eventDate =
        new Date(
          normalized +
          "T00:00:00"
        );


      if (
        eventDate < today
      ) {
        continue;
      }


      events.push(
        {
          date:
            eventDate,

          title,

          time:
            (
              row[timeIndex] ||
              ""
            ).trim(),

          order:
            orderIndex >= 0
              ?
              parseInt(
                row[orderIndex],
                10
              ) || 999
              :
              999
        }
      );

    }


    events.sort(
      (a, b) => {

        if (
          a.order !==
          b.order
        ) {

          return (
            a.order -
            b.order
          );

        }


        return (
          a.date -
          b.date
        );

      }
    );


    if (
      !events.length
    ) {

      showUpcomingFallback();

      return;

    }


    upcomingEventsText.textContent =
      events
        .map(
          event => {

            const dateText =
              event.date
                .toLocaleDateString(
                  "en-US",
                  {
                    month:
                      "short",

                    day:
                      "numeric"
                  }
                );


            return (
              event.time
                ?
                `${dateText} – ${event.title} (${event.time})`
                :
                `${dateText} – ${event.title}`
            );

          }
        )
        .join(
          templeContent.separator
        );

  }

  catch (error) {

    console.error(
      error
    );

    showUpcomingFallback();

  }

}


// ==========================================================
// MUSIC
// ==========================================================

function startMusic() {

  const music =
    document.getElementById(
      "background-music"
    );


  if (!music) {
    return;
  }


  music.volume =
    0.25;


  const promise =
    music.play();


  if (
    promise
  ) {

    promise.catch(
      () => {}
    );

  }

}


// ==========================================================
// INITIALIZATION
// ==========================================================

async function initialize() {

  loadLocalAnnouncements();

  showUpcomingFallback();

  renderTodaySchedule();


  await Promise.allSettled(
    [
      loadAnnouncements(),
      loadRemoteFlyers(),
      loadSpecialEvents(),
      loadUpcomingEvents()
    ]
  );


  startMusic();

}


initialize();


// ==========================================================
// TIMERS
// ==========================================================

setInterval(
  rotateFlyer,
  templeContent.flyerDuration *
  1000
);


setInterval(
  () => {

    loadAnnouncements();

    loadRemoteFlyers();

    loadSpecialEvents();

    loadUpcomingEvents();

  },

  templeContent.remoteRefreshMinutes *
  60 *
  1000
);


setInterval(
  renderTodaySchedule,
  60 *
  1000
);
