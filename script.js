/* ==========================================================
   CHINMAYA SARASWATI ASHRAM - DEVI TEMPLE
   TEMPLE TV DIGITAL SIGNAGE
========================================================== */


// ==========================================================
// STATE
// ==========================================================

let flyers = [];
let currentFlyerIndex = 0;

let specialEvents = [];

let weeklyScheduleRows = [];
let weeklyScheduleLoaded = false;


// ==========================================================
// BGM STATE
// ==========================================================

let defaultBGMPlaylist = [];
let specialBGMTracks = [];

let currentBGMMode = "NONE";

let currentBGMPlaylist = [];
let currentBGMIndex = 0;

let currentSpecialSignature = "";

let savedDefaultIndex = 0;
let savedDefaultTime = 0;

let bgmErrorCount = 0;


// ==========================================================
// ELEMENTS
// ==========================================================

const flyerElement =
  document.getElementById("flyer");

const tickerText =
  document.getElementById("ticker-text");

const upcomingEventsText =
  document.getElementById(
    "upcoming-events-text"
  );

const scheduleList =
  document.getElementById(
    "today-schedule-list"
  );

const tomorrowScheduleList =
  document.getElementById(
    "tomorrow-schedule-list"
  );

const clockElement =
  document.getElementById("clock");

const headerDateElement =
  document.getElementById(
    "header-date"
  );

const musicElement =
  document.getElementById(
    "background-music"
  );


// ==========================================================
// CACHE BUSTER
// ==========================================================

function addCacheBuster(url) {

  if (!url) {
    return "";
  }

  const separator =
    url.includes("?")
      ? "&"
      : "?";

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

    const char = text[i];
    const next = text[i + 1];


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
      (
        char === "\n" ||
        char === "\r"
      ) &&
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


  if (clockElement) {

    clockElement.textContent =
      now.toLocaleTimeString(
        "en-US",
        {
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        }
      );

  }


  if (headerDateElement) {

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
    String(value)
      .trim();


  const usDate =
    text.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );


  if (usDate) {

    return (
      usDate[3] +
      "-" +
      usDate[1].padStart(2, "0") +
      "-" +
      usDate[2].padStart(2, "0")
    );

  }


  const isoDate =
    text.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    );


  if (isoDate) {

    return (
      isoDate[1] +
      "-" +
      isoDate[2].padStart(2, "0") +
      "-" +
      isoDate[3].padStart(2, "0")
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
// SATURDAY NUMBER
// ==========================================================

function getSaturdayNumber(date) {

  return Math.ceil(
    date.getDate() / 7
  );
}


// ==========================================================
// WEEKDAY
// ==========================================================

function getWeekdayName(date) {

  return [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY"
  ][date.getDay()];
}


// ==========================================================
// GOOGLE DRIVE
// ==========================================================

function getDriveFileId(url) {

  if (!url) {
    return "";
  }


  let match =
    url.match(
      /\/file\/d\/([^/]+)/
    );


  if (match) {
    return match[1];
  }


  match =
    url.match(
      /[?&]id=([^&]+)/
    );


  if (match) {
    return match[1];
  }


  return "";
}


function convertDriveImageURL(url) {

  const fileId =
    getDriveFileId(url);


  if (!fileId) {
    return url;
  }


  return (
    "https://drive.google.com/thumbnail"
    +
    `?id=${fileId}&sz=w3000`
  );
}


function convertDriveAudioURL(url) {

  const fileId =
    getDriveFileId(url);


  if (!fileId) {
    return url;
  }


  return (
    "https://drive.google.com/uc"
    +
    `?export=download&id=${fileId}`
  );
}


// ==========================================================
// IMAGE TEST
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
// ANNOUNCEMENTS
// ==========================================================

function loadLocalAnnouncements() {

  if (!tickerText) {
    return;
  }


  tickerText.textContent =
    templeContent
      .announcements
      .join(
        templeContent.separator
      );
}


async function loadAnnouncements() {

  try {

    const response =
      await fetch(
        addCacheBuster(
          templeContent
            .announcementSheetURL
        ),
        {
          cache: "no-store"
        }
      );


    if (!response.ok) {
      throw new Error(
        "Announcement error"
      );
    }


    const rows =
      parseCSV(
        await response.text()
      );


    const messages = [];


    rows.forEach(
      (
        row,
        index
      ) => {

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


    tickerText.textContent =
      messages.length
        ?
        messages.join(
          templeContent.separator
        )
        :
        templeContent
          .announcements
          .join(
            templeContent.separator
          );

  }

  catch (error) {

    console.error(error);

    loadLocalAnnouncements();

  }

}


// ==========================================================
// FLYERS
// ==========================================================

async function loadRemoteFlyers() {

  try {

    const response =
      await fetch(
        addCacheBuster(
          templeContent
            .flyerSheetURL
        ),
        {
          cache: "no-store"
        }
      );


    const rows =
      parseCSV(
        await response.text()
      );


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


    const remote = [];


    for (
      let i = 1;
      i < rows.length;
      i++
    ) {

      const row = rows[i];


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
        convertDriveImageURL(
          original
        );


      if (
        await testImage(url)
      ) {

        remote.push(
          {

            url,

            order:
              parseInt(
                row[orderIndex],
                10
              ) ||
              999

          }
        );

      }

    }


    remote.sort(
      (
        a,
        b
      ) =>
        a.order -
        b.order
    );


    flyers =
      remote.length
        ?
        remote.map(
          item => item.url
        )
        :
        templeContent.localFlyers;


    currentFlyerIndex = 0;


    showFlyer();

  }

  catch (error) {

    console.error(error);


    flyers =
      templeContent.localFlyers;


    showFlyer();

  }

}


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


      flyerElement
        .classList
        .add(
          "flyer-visible"
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
    )
    %
    flyers.length;


  showFlyer();

}


// ==========================================================
// WEEKLY SCHEDULE
// ==========================================================

async function loadWeeklySchedule() {

  try {

    const response =
      await fetch(
        addCacheBuster(
          templeContent
            .weeklyScheduleSheetURL
        ),
        {
          cache: "no-store"
        }
      );


    const rows =
      parseCSV(
        await response.text()
      );


    const headers =
      rows[0].map(
        value =>
          value
            .trim()
            .toLowerCase()
      );


    const weekdayIndex =
      headers.indexOf("weekday");

    const weekNumberIndex =
      headers.indexOf(
        "weeknumber"
      );

    const programIndex =
      headers.indexOf("program");

    const timeIndex =
      headers.indexOf("time");

    const endTimeIndex =
      headers.indexOf("endtime");

    const activeIndex =
      headers.indexOf("active");

    const startDateIndex =
      headers.indexOf(
        "startdate"
      );

    const endDateIndex =
      headers.indexOf(
        "enddate"
      );


    const loaded = [];


    for (
      let i = 1;
      i < rows.length;
      i++
    ) {

      const row = rows[i];


      const active =
        (
          row[activeIndex] ||
          "YES"
        )
        .trim()
        .toUpperCase();


      if (
        active !== "YES"
      ) {
        continue;
      }


      const weekday =
        (
          row[weekdayIndex] ||
          ""
        )
        .trim()
        .toUpperCase();


      const program =
        (
          row[programIndex] ||
          ""
        ).trim();


      if (
        !weekday ||
        !program
      ) {
        continue;
      }


      loaded.push(
        {

          weekday,

          weekNumber:
            (
              row[weekNumberIndex] ||
              "ALL"
            )
            .trim()
            .toUpperCase(),

          program,

          time:
            (
              row[timeIndex] ||
              ""
            ).trim(),

          endTime:
            (
              row[endTimeIndex] ||
              ""
            ).trim(),

          startDate:
            normalizeDate(
              row[startDateIndex]
            ),

          endDate:
            normalizeDate(
              row[endDateIndex]
            ),

          rowOrder:
            i

        }
      );

    }


    weeklyScheduleRows =
      loaded;


    weeklyScheduleLoaded =
      true;


    renderTodaySchedule();

    renderTomorrowSchedule();

  }

  catch (error) {

    console.error(
      "Weekly Schedule:",
      error
    );

  }

}


// ==========================================================
// DATE MATCH
// ==========================================================

function scheduleDateMatches(
  row,
  date
) {

  const today =
    dateKey(date);


  if (
    row.startDate &&
    today < row.startDate
  ) {
    return false;
  }


  if (
    row.endDate &&
    today > row.endDate
  ) {
    return false;
  }


  return true;
}


// ==========================================================
// WEEKDAY MATCH
// ==========================================================

function weeklyRowMatchesDay(
  row,
  date
) {

  const weekday =
    getWeekdayName(date);


  if (
    row.weekday !== weekday
  ) {
    return false;
  }


  if (
    weekday !==
    "SATURDAY"
  ) {

    return (
      row.weekNumber === "ALL" ||
      row.weekNumber === ""
    );

  }


  if (
    row.weekNumber === "ALL" ||
    row.weekNumber === ""
  ) {

    return true;

  }


  return (
    Number(row.weekNumber)
    ===
    getSaturdayNumber(date)
  );
}


// ==========================================================
// GET SHEET PROGRAMS
// ==========================================================

function getSheetProgramsForDate(
  date
) {

  if (
    !weeklyScheduleLoaded
  ) {
    return null;
  }


  const matching =
    weeklyScheduleRows.filter(
      row =>

        weeklyRowMatchesDay(
          row,
          date
        )

        &&

        scheduleDateMatches(
          row,
          date
        )
    );


  const groups =
    new Map();


  matching.forEach(
    row => {

      const key =
        row.program
          .toLowerCase();


      if (
        !groups.has(key)
      ) {

        groups.set(
          key,
          []
        );

      }


      groups
        .get(key)
        .push(row);

    }
  );


  const selected = [];


  groups.forEach(
    rows => {

      const temporary =
        rows.filter(
          row =>
            row.startDate ||
            row.endDate
        );


      if (
        temporary.length
      ) {

        temporary.sort(
          (
            a,
            b
          ) => {

            const aStart =
              a.startDate ||
              "0000-00-00";

            const bStart =
              b.startDate ||
              "0000-00-00";


            if (
              aStart !==
              bStart
            ) {

              return (
                bStart.localeCompare(
                  aStart
                )
              );

            }


            return (
              b.rowOrder -
              a.rowOrder
            );

          }
        );


        selected.push(
          temporary[0]
        );

      }

      else {

        selected.push(
          rows[0]
        );

      }

    }
  );


  selected.sort(
    (
      a,
      b
    ) =>
      a.rowOrder -
      b.rowOrder
  );


  return selected.map(
    row => ({

      title:
        row.program,

      time:
        row.time,

      endTime:
        row.endTime

    })
  );
}


// ==========================================================
// FALLBACK SCHEDULE
// ==========================================================

function getFallbackRegularPrograms(
  date
) {

  const day =
    date.getDay();


  if (
    day === 6
  ) {

    return (
      templeContent
        .saturdaySchedule[
          getSaturdayNumber(date)
        ]
      ||
      []
    );

  }


  return (
    templeContent
      .weeklySchedule[
        day
      ]
    ||
    []
  );
}


function getRegularPrograms(date) {

  const sheet =
    getSheetProgramsForDate(
      date
    );


  if (
    sheet !== null
  ) {

    return sheet;

  }


  return getFallbackRegularPrograms(
    date
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
          templeContent
            .specialEventsSheetURL
        ),
        {
          cache: "no-store"
        }
      );


    const rows =
      parseCSV(
        await response.text()
      );


    const headers =
      rows[0].map(
        value =>
          value
            .trim()
            .toLowerCase()
      );


    const dateIndex =
      headers.indexOf("date");

    const eventIndex =
      headers.indexOf("event");

    const programIndex =
      headers.indexOf("program");

    const timeIndex =
      headers.indexOf("time");

    const activeIndex =
      headers.indexOf("active");


    specialEvents = [];


    for (
      let i = 1;
      i < rows.length;
      i++
    ) {

      const row = rows[i];


      const active =
        (
          row[activeIndex] ||
          "YES"
        )
        .trim()
        .toUpperCase();


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
            ).trim(),

          endTime: ""

        }
      );

    }


    renderTodaySchedule();

    renderTomorrowSchedule();

  }

  catch (error) {

    console.error(error);

  }

}


// ==========================================================
// TIME TO MINUTES
// ==========================================================

function parseTimeToMinutes(value) {

  if (!value) {
    return null;
  }


  const text =
    String(value)
      .trim()
      .toUpperCase();


  let match =
    text.match(
      /^(\d{1,2}):(\d{2})\s*(AM|PM)$/
    );


  if (match) {

    let hour =
      Number(match[1]);


    const minute =
      Number(match[2]);


    if (
      match[3] === "PM" &&
      hour !== 12
    ) {
      hour += 12;
    }


    if (
      match[3] === "AM" &&
      hour === 12
    ) {
      hour = 0;
    }


    return (
      hour * 60 +
      minute
    );

  }


  return null;
}


// ==========================================================
// PROGRAM STATUS
// ==========================================================

function getProgramTimeStatus(
  start,
  end
) {

  const startMinutes =
    parseTimeToMinutes(start);


  if (
    startMinutes === null
  ) {

    return {
      current: false,
      completed: false
    };

  }


  let endMinutes =
    parseTimeToMinutes(end);


  if (
    endMinutes === null
  ) {

    endMinutes =
      startMinutes + 90;

  }


  const now =
    new Date();


  const nowMinutes =
    now.getHours() *
    60
    +
    now.getMinutes();


  return {

    current:
      nowMinutes >= startMinutes &&
      nowMinutes < endMinutes,

    completed:
      nowMinutes >= endMinutes

  };
}


// ==========================================================
// TODAY
// ==========================================================

function renderTodaySchedule() {

  if (!scheduleList) {
    return;
  }


  const today =
    new Date();


  const programs = [];


  getRegularPrograms(
    today
  )
  .forEach(
    program =>
      programs.push(
        {
          ...program,
          note: ""
        }
      )
  );


  const key =
    dateKey(today);


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
            program =>
              program.title
                .toLowerCase()
              ===
              title.toLowerCase()
          );


        if (!duplicate) {

          programs.push(
            {

              title,

              time:
                event.time,

              endTime:
                event.endTime,

              note:
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
    !programs.length
  ) {

    scheduleList.innerHTML =
      `
        <div class="empty-schedule">
          No scheduled programs
        </div>
      `;

    return;

  }


  scheduleList.innerHTML =
    programs.map(
      program => {

        const status =
          getProgramTimeStatus(
            program.time,
            program.endTime
          );


        let className =
          "schedule-item";


        if (
          status.completed
        ) {

          className +=
            " is-completed";

        }

        else if (
          status.current
        ) {

          className +=
            " is-current";

        }


        return `
          <article class="${className}">

            <div class="schedule-time">
              ${escapeHTML(program.time)}
            </div>

            <div class="schedule-separator"></div>

            <div class="schedule-content">

              <div class="schedule-name">
                ${escapeHTML(program.title)}
              </div>

              ${
                status.completed
                  ?
                  `
                    <span class="schedule-status">
                      (Completed)
                    </span>
                  `
                  :
                  ""
              }

            </div>

          </article>
        `;

      }
    ).join("");

}


// ==========================================================
// TOMORROW
// ==========================================================

function renderTomorrowSchedule() {

  if (!tomorrowScheduleList) {
    return;
  }


  const tomorrow =
    new Date();


  tomorrow.setDate(
    tomorrow.getDate() + 1
  );


  tomorrow.setHours(
    12,
    0,
    0,
    0
  );


  const programs = [];


  getRegularPrograms(
    tomorrow
  )
  .forEach(
    program =>
      programs.push(
        program
      )
  );


  const tomorrowKey =
    dateKey(tomorrow);


  specialEvents
    .filter(
      event =>
        event.date ===
        tomorrowKey
    )
    .forEach(
      event => {

        const title =
          event.program ||
          event.event ||
          "Special Temple Program";


        const duplicate =
          programs.some(
            program =>
              program.title
                .toLowerCase()
              ===
              title.toLowerCase()
          );


        if (!duplicate) {

          programs.push(
            {

              title,

              time:
                event.time,

              endTime:
                event.endTime

            }
          );

        }

      }
    );


  if (
    !programs.length
  ) {

    tomorrowScheduleList.innerHTML =
      `
        <div class="tomorrow-empty">
          No scheduled programs
        </div>
      `;

    return;

  }


  tomorrowScheduleList.innerHTML =
    programs.map(
      program =>
        `
          <div class="tomorrow-schedule-item">

            <div class="tomorrow-time">
              ${escapeHTML(program.time)}
            </div>

            <div class="tomorrow-separator"></div>

            <div class="tomorrow-name">
              ${escapeHTML(program.title)}
            </div>

          </div>
        `
    ).join("");

}


// ==========================================================
// ESCAPE HTML
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

  if (!upcomingEventsText) {
    return;
  }


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
          templeContent
            .upcomingEventsSheetURL
        ),
        {
          cache: "no-store"
        }
      );


    const rows =
      parseCSV(
        await response.text()
      );


    const headers =
      rows[0].map(
        value =>
          value
            .trim()
            .toLowerCase()
      );


    const dateIndex =
      headers.indexOf("date");

    const eventIndex =
      headers.indexOf("event");

    const timeIndex =
      headers.indexOf("time");

    const activeIndex =
      headers.indexOf("active");

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


    const events = [];


    for (
      let i = 1;
      i < rows.length;
      i++
    ) {

      const row = rows[i];


      if (
        (
          row[activeIndex] ||
          ""
        )
        .trim()
        .toUpperCase()
        !==
        "YES"
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


      const eventDate =
        new Date(
          date +
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

          title:
            (
              row[eventIndex] ||
              ""
            ).trim(),

          time:
            (
              row[timeIndex] ||
              ""
            ).trim(),

          order:
            parseInt(
              row[orderIndex],
              10
            ) ||
            999

        }
      );

    }


    events.sort(
      (
        a,
        b
      ) =>
        a.order !== b.order
          ?
          a.order - b.order
          :
          a.date - b.date
    );


    upcomingEventsText.textContent =
      events.map(
        event => {

          const date =
            event.date
              .toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric"
                }
              );


          return (
            event.time
              ?
              `${date} – ${event.title} (${event.time})`
              :
              `${date} – ${event.title}`
          );

        }
      )
      .join(
        templeContent.separator
      );

  }

  catch (error) {

    console.error(error);

    showUpcomingFallback();

  }

}


// ==========================================================
// BGM WEEKDAY MATCH
// ==========================================================

function weekdayMatches(
  value,
  date
) {

  const weekday =
    String(
      value || "ALL"
    )
    .trim()
    .toUpperCase();


  if (
    weekday === "ALL"
  ) {
    return true;
  }


  if (
    weekday ===
    getWeekdayName(date)
  ) {
    return true;
  }


  if (
    date.getDay() === 6 &&
    weekday.startsWith(
      "SATURDAY-"
    )
  ) {

    return (
      Number(
        weekday.split("-")[1]
      )
      ===
      getSaturdayNumber(date)
    );

  }


  return false;
}


// ==========================================================
// BGM TIME WINDOW
// ==========================================================

function timeWindowMatches(
  startValue,
  endValue,
  date
) {

  const start =
    parseTimeToMinutes(
      startValue
    );


  const end =
    parseTimeToMinutes(
      endValue
    );


  if (
    start === null ||
    end === null
  ) {
    return false;
  }


  const now =
    date.getHours() *
    60
    +
    date.getMinutes();


  if (
    start <= end
  ) {

    return (
      now >= start &&
      now < end
    );

  }


  return (
    now >= start ||
    now < end
  );
}


// ==========================================================
// BGM LOAD
// ==========================================================

async function loadBGMPlaylist() {

  try {

    const response =
      await fetch(
        addCacheBuster(
          templeContent
            .bgmSheetURL
        ),
        {
          cache: "no-store"
        }
      );


    const rows =
      parseCSV(
        await response.text()
      );


    const headers =
      rows[0].map(
        value =>
          value
            .trim()
            .toLowerCase()
      );


    const musicIndex =
      headers.indexOf("musicurl");

    const typeIndex =
      headers.indexOf("type");

    const activeIndex =
      headers.indexOf("active");

    const orderIndex =
      headers.indexOf(
        "displayorder"
      );

    const weekdayIndex =
      headers.indexOf("weekday");

    const startIndex =
      headers.indexOf("starttime");

    const endIndex =
      headers.indexOf("endtime");


    const defaults = [];
    const specials = [];


    for (
      let i = 1;
      i < rows.length;
      i++
    ) {

      const row = rows[i];


      if (
        (
          row[activeIndex] ||
          "YES"
        )
        .trim()
        .toUpperCase()
        !==
        "YES"
      ) {
        continue;
      }


      const original =
        (
          row[musicIndex] ||
          ""
        ).trim();


      if (!original) {
        continue;
      }


      const track =
        {

          url:
            convertDriveAudioURL(
              original
            ),

          order:
            parseInt(
              row[orderIndex],
              10
            ) ||
            999,

          weekday:
            (
              row[weekdayIndex] ||
              "ALL"
            )
            .trim()
            .toUpperCase(),

          startTime:
            (
              row[startIndex] ||
              ""
            ).trim(),

          endTime:
            (
              row[endIndex] ||
              ""
            ).trim()

        };


      const type =
        (
          row[typeIndex] ||
          "DEFAULT"
        )
        .trim()
        .toUpperCase();


      if (
        type === "SPECIAL"
      ) {

        specials.push(track);

      }

      else {

        defaults.push(track);

      }

    }


    defaults.sort(
      (
        a,
        b
      ) =>
        a.order -
        b.order
    );


    specials.sort(
      (
        a,
        b
      ) =>
        a.order -
        b.order
    );


    defaultBGMPlaylist =
      defaults;


    specialBGMTracks =
      specials;


    evaluateBGMSchedule();

  }

  catch (error) {

    console.error(error);

  }

}


// ==========================================================
// SPECIAL BGM
// ==========================================================

function getActiveSpecialPlaylist() {

  const now =
    new Date();


  return specialBGMTracks.filter(
    track =>

      weekdayMatches(
        track.weekday,
        now
      )

      &&

      timeWindowMatches(
        track.startTime,
        track.endTime,
        now
      )
  );
}


function makeSpecialSignature(
  playlist
) {

  return playlist
    .map(
      track =>
        [
          track.url,
          track.weekday,
          track.startTime,
          track.endTime
        ].join("~")
    )
    .join("|");
}


// ==========================================================
// PLAY BGM
// ==========================================================

function playCurrentBGMTrack(
  resumeSeconds = 0
) {

  if (
    !musicElement ||
    !currentBGMPlaylist.length
  ) {
    return;
  }


  const track =
    currentBGMPlaylist[
      currentBGMIndex
    ];


  musicElement.pause();


  musicElement.src =
    track.url;


  musicElement.loop =
    false;


  musicElement.volume =
    templeContent.bgmVolume
    ??
    0.30;


  musicElement.load();


  const start =
    () => {

      if (
        resumeSeconds > 0
      ) {

        try {

          musicElement.currentTime =
            resumeSeconds;

        }

        catch (error) {}

      }


      musicElement
        .play()
        .catch(
          error =>
            console.error(
              "BGM:",
              error
            )
        );

    };


  if (
    resumeSeconds > 0
  ) {

    musicElement.addEventListener(
      "loadedmetadata",
      start,
      {
        once: true
      }
    );

  }

  else {

    start();

  }

}


function startDefaultBGM(
  resume = false
) {

  if (
    !defaultBGMPlaylist.length
  ) {
    return;
  }


  currentBGMMode =
    "DEFAULT";


  currentSpecialSignature =
    "";


  currentBGMPlaylist =
    defaultBGMPlaylist;


  if (
    resume
  ) {

    currentBGMIndex =
      savedDefaultIndex;


    playCurrentBGMTrack(
      savedDefaultTime
    );


    savedDefaultTime = 0;

  }

  else {

    currentBGMIndex = 0;

    playCurrentBGMTrack();

  }

}


function startSpecialBGM(
  playlist
) {

  if (
    currentBGMMode ===
    "DEFAULT"
  ) {

    savedDefaultIndex =
      currentBGMIndex;


    savedDefaultTime =
      musicElement.currentTime ||
      0;

  }


  currentBGMMode =
    "SPECIAL";


  currentBGMPlaylist =
    playlist;


  currentBGMIndex = 0;


  playCurrentBGMTrack();

}


function evaluateBGMSchedule() {

  const special =
    getActiveSpecialPlaylist();


  if (
    special.length
  ) {

    const signature =
      makeSpecialSignature(
        special
      );


    if (
      currentBGMMode ===
      "SPECIAL"
      &&
      currentSpecialSignature ===
      signature
    ) {
      return;
    }


    currentSpecialSignature =
      signature;


    startSpecialBGM(
      special
    );


    return;

  }


  if (
    currentBGMMode ===
    "SPECIAL"
  ) {

    startDefaultBGM(
      true
    );

    return;

  }


  if (
    currentBGMMode !==
    "DEFAULT"
  ) {

    startDefaultBGM();

  }

}


function playNextBGM() {

  if (
    !currentBGMPlaylist.length
  ) {
    return;
  }


  currentBGMIndex =
    (
      currentBGMIndex + 1
    )
    %
    currentBGMPlaylist.length;


  playCurrentBGMTrack();

}


if (musicElement) {

  musicElement.addEventListener(
    "ended",
    () => {

      const mode =
        currentBGMMode;


      evaluateBGMSchedule();


      if (
        mode ===
        currentBGMMode
      ) {

        playNextBGM();

      }

    }
  );


  const resumeAudio =
    () => {

      if (
        musicElement.paused &&
        currentBGMPlaylist.length
      ) {

        musicElement
          .play()
          .catch(
            () => {}
          );

      }

    };


  document.addEventListener(
    "click",
    resumeAudio
  );


  document.addEventListener(
    "keydown",
    resumeAudio
  );

}


// ==========================================================
// INITIALIZE
// ==========================================================

async function initializeTempleTV() {

  loadLocalAnnouncements();

  showUpcomingFallback();


  await Promise.allSettled(
    [
      loadWeeklySchedule(),
      loadSpecialEvents()
    ]
  );


  renderTodaySchedule();

  renderTomorrowSchedule();


  await Promise.allSettled(
    [
      loadAnnouncements(),
      loadRemoteFlyers(),
      loadUpcomingEvents(),
      loadBGMPlaylist()
    ]
  );

}


initializeTempleTV();


// ==========================================================
// TIMERS
// ==========================================================

setInterval(
  rotateFlyer,

  templeContent.flyerDuration *
  1000
);


setInterval(
  evaluateBGMSchedule,

  templeContent
    .bgmScheduleCheckSeconds
  *
  1000
);


const refreshTime =

  templeContent
    .remoteRefreshMinutes

  *

  60

  *

  1000;


setInterval(
  () => {

    loadAnnouncements();

    loadRemoteFlyers();

    loadWeeklySchedule();

    loadSpecialEvents();

    loadUpcomingEvents();

    loadBGMPlaylist();

  },

  refreshTime
);


setInterval(
  () => {

    renderTodaySchedule();

    renderTomorrowSchedule();

  },

  60 *
  1000
);
