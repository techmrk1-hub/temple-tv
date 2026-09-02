/* ==========================================================
   TEMPLE TV DIGITAL SIGNAGE
   Chinmaya Saraswati Ashram - Devi Temple
========================================================== */


/* ==========================================================
   GLOBAL STATE
========================================================== */

let flyers = [];
let currentFlyerIndex = 0;

let specialEvents = [];
let upcomingEvents = [];

let weeklyScheduleRows = [];
let weeklyScheduleLoaded = false;

let defaultBGMPlaylist = [];
let specialBGMPlaylist = [];

let currentBGMIndex = 0;
let currentBGMMode = "";
let currentBGMSignature = "";

let flyerTimer = null;


/* ==========================================================
   ELEMENT REFERENCES
========================================================== */

const flyerElement =
  document.getElementById(
    "feature-flyer"
  );

const todayScheduleList =
  document.getElementById(
    "today-schedule-list"
  );

const tomorrowScheduleList =
  document.getElementById(
    "tomorrow-schedule-list"
  );

const announcementsTicker =
  document.getElementById(
    "announcements-track"
  );

const upcomingEventsTicker =
  document.getElementById(
    "upcoming-events-track"
  );

const backgroundMusic =
  document.getElementById(
    "background-music"
  );


/* ==========================================================
   CSV PARSER
========================================================== */

function parseCSV(text) {

  const rows = [];

  let row = [];
  let value = "";
  let insideQuotes = false;

  for (
    let i = 0;
    i < text.length;
    i++
  ) {

    const char = text[i];

    if (
      char === '"'
    ) {

      if (
        insideQuotes &&
        text[i + 1] === '"'
      ) {

        value += '"';

        i++;

      }

      else {

        insideQuotes =
          !insideQuotes;

      }

    }

    else if (
      char === "," &&
      !insideQuotes
    ) {

      row.push(
        value.trim()
      );

      value = "";

    }

    else if (
      (
        char === "\n" ||
        char === "\r"
      ) &&
      !insideQuotes
    ) {

      if (
        char === "\r" &&
        text[i + 1] === "\n"
      ) {

        i++;

      }

      row.push(
        value.trim()
      );

      if (
        row.some(
          cell =>
            cell !== ""
        )
      ) {

        rows.push(
          row
        );

      }

      row = [];
      value = "";

    }

    else {

      value += char;

    }

  }


  if (
    value.length ||
    row.length
  ) {

    row.push(
      value.trim()
    );

    if (
      row.some(
        cell =>
          cell !== ""
      )
    ) {

      rows.push(
        row
      );

    }

  }

  return rows;

}


/* ==========================================================
   FETCH CSV
========================================================== */

async function fetchCSV(
  url
) {

  if (
    !url
  ) {

    return [];

  }

  const separator =
    url.includes("?")
      ? "&"
      : "?";

  const freshURL =
    url +
    separator +
    "t=" +
    Date.now();

  const response =
    await fetch(
      freshURL,
      {
        cache:
          "no-store"
      }
    );

  if (
    !response.ok
  ) {

    throw new Error(
      "Unable to fetch CSV"
    );

  }

  const text =
    await response.text();

  return parseCSV(
    text
  );

}


/* ==========================================================
   CACHE BUSTER
========================================================== */

function addCacheBuster(
  url
) {

  if (
    !url
  ) {

    return url;

  }

  const separator =
    url.includes("?")
      ? "&"
      : "?";

  return (
    url +
    separator +
    "_tv=" +
    Date.now()
  );

}


/* ==========================================================
   GOOGLE DRIVE IMAGE URL
========================================================== */

function normalizeFlyerURL(
  url
) {

  if (
    !url
  ) {

    return "";

  }

  const trimmed =
    url.trim();

  const driveMatch =
    trimmed.match(
      /\/d\/([^/]+)/
    );

  if (
    driveMatch
  ) {

    return (
      "https://drive.google.com/thumbnail?id=" +
      driveMatch[1] +
      "&sz=w2000"
    );

  }


  const idMatch =
    trimmed.match(
      /[?&]id=([^&]+)/
    );

  if (
    idMatch
  ) {

    return (
      "https://drive.google.com/thumbnail?id=" +
      idMatch[1] +
      "&sz=w2000"
    );

  }

  return trimmed;

}


/* ==========================================================
   CLOCK
========================================================== */

function updateClock() {

  const now =
    new Date();

  const timeElement =
    document.getElementById(
      "clock-time"
    );

  const dateElement =
    document.getElementById(
      "clock-date"
    );

  if (
    timeElement
  ) {

    timeElement.textContent =
      now.toLocaleTimeString(
        [],
        {
          hour:
            "numeric",

          minute:
            "2-digit"
        }
      );

  }


  if (
    dateElement
  ) {

    dateElement.textContent =
      now.toLocaleDateString(
        [],
        {
          weekday:
            "long",

          month:
            "long",

          day:
            "numeric",

          year:
            "numeric"
        }
      );

  }

}


/* ==========================================================
   FLYER ORIENTATION
========================================================== */

function setFlyerOrientation() {

  if (
    !flyerElement
  ) {

    return;

  }

  flyerElement.classList.remove(
    "flyer-landscape",
    "flyer-portrait",
    "flyer-square"
  );

  const width =
    flyerElement.naturalWidth;

  const height =
    flyerElement.naturalHeight;

  if (
    !width ||
    !height
  ) {

    return;

  }

  const ratio =
    width /
    height;

  if (
    ratio > 1.15
  ) {

    flyerElement.classList.add(
      "flyer-landscape"
    );

  }

  else if (
    ratio < 0.85
  ) {

    flyerElement.classList.add(
      "flyer-portrait"
    );

  }

  else {

    flyerElement.classList.add(
      "flyer-square"
    );

  }

}


/* ==========================================================
   MORPH FLYER DISPLAY
========================================================== */

function showFlyer() {

  if (
    !flyerElement ||
    !flyers.length
  ) {

    return;

  }

  const flyerURL =
    flyers[
      currentFlyerIndex
    ];


  flyerElement.classList.remove(
    "flyer-visible",
    "flyer-exit"
  );


  flyerElement.onload =
    function () {

      setFlyerOrientation();


      requestAnimationFrame(
        () => {

          requestAnimationFrame(
            () => {

              flyerElement
                .classList
                .add(
                  "flyer-visible"
                );

            }
          );

        }
      );

    };


  flyerElement.onerror =
    function () {

      console.warn(
        "Flyer failed:",
        flyerURL
      );

      rotateFlyer(
        true
      );

    };


  flyerElement.src =
    addCacheBuster(
      flyerURL
    );

}


/* ==========================================================
   FLYER ROTATION
========================================================== */

function rotateFlyer(
  immediate = false
) {

  if (
    flyers.length <= 1
  ) {

    return;

  }

  const advance =
    () => {

      currentFlyerIndex =
        (
          currentFlyerIndex + 1
        ) %
        flyers.length;

      flyerElement
        .classList
        .remove(
          "flyer-exit"
        );

      showFlyer();

    };


  if (
    immediate
  ) {

    advance();

    return;

  }


  flyerElement
    .classList
    .remove(
      "flyer-visible"
    );


  flyerElement
    .classList
    .add(
      "flyer-exit"
    );


  setTimeout(
    advance,
    850
  );

}


/* ==========================================================
   START FLYER TIMER
========================================================== */

function startFlyerRotation() {

  if (
    flyerTimer
  ) {

    clearInterval(
      flyerTimer
    );

  }


  const seconds =
    Number(
      templeContent.flyerDuration
    ) ||
    15;


  flyerTimer =
    setInterval(
      rotateFlyer,
      seconds *
      1000
    );

}


/* ==========================================================
   LOAD FLYERS
========================================================== */

async function loadFlyers() {

  let remoteFlyers =
    [];

  try {

    const rows =
      await fetchCSV(
        templeContent.flyerSheetURL
      );

    if (
      rows.length > 1
    ) {

      const headers =
        rows[0].map(
          header =>
            header.trim()
        );

      const imageIndex =
        headers.indexOf(
          "ImageURL"
        );

      const activeIndex =
        headers.indexOf(
          "Active"
        );

      const orderIndex =
        headers.indexOf(
          "DisplayOrder"
        );


      remoteFlyers =
        rows
          .slice(1)
          .map(
            row => ({

              url:
                normalizeFlyerURL(
                  row[
                    imageIndex
                  ] ||
                  ""
                ),

              active:
                (
                  row[
                    activeIndex
                  ] ||
                  ""
                )
                  .trim()
                  .toUpperCase(),

              order:
                Number(
                  row[
                    orderIndex
                  ]
                ) ||
                999

            })
          )
          .filter(
            item =>
              item.url &&
              item.active ===
                "YES"
          )
          .sort(
            (
              a,
              b
            ) =>
              a.order -
              b.order
          )
          .map(
            item =>
              item.url
          );

    }

  }

  catch (
    error
  ) {

    console.warn(
      "Remote flyers failed:",
      error
    );

  }


  if (
    remoteFlyers.length
  ) {

    flyers =
      remoteFlyers;

  }

  else {

    flyers =
      (
        templeContent.localFlyers ||
        []
      ).slice();

  }


  if (
    currentFlyerIndex >=
    flyers.length
  ) {

    currentFlyerIndex =
      0;

  }


  if (
    flyers.length
  ) {

    showFlyer();

    startFlyerRotation();

  }

}


/* ==========================================================
   ANNOUNCEMENTS
========================================================== */

async function loadAnnouncements() {

  let announcements =
    [];

  try {

    const rows =
      await fetchCSV(
        templeContent
          .announcementSheetURL
      );

    if (
      rows.length > 1
    ) {

      const headers =
        rows[0].map(
          h =>
            h.trim()
        );

      let messageIndex =
        headers.indexOf(
          "Announcement"
        );

      if (
        messageIndex === -1
      ) {

        messageIndex =
          headers.indexOf(
            "Message"
          );

      }

      const activeIndex =
        headers.indexOf(
          "Active"
        );

      const orderIndex =
        headers.indexOf(
          "DisplayOrder"
        );


      announcements =
        rows
          .slice(1)
          .map(
            row => ({

              message:
                (
                  row[
                    messageIndex
                  ] ||
                  ""
                ).trim(),

              active:
                (
                  row[
                    activeIndex
                  ] ||
                  ""
                )
                  .trim()
                  .toUpperCase(),

              order:
                Number(
                  row[
                    orderIndex
                  ]
                ) ||
                999

            })
          )
          .filter(
            item =>
              item.message &&
              (
                activeIndex === -1 ||
                item.active === "YES"
              )
          )
          .sort(
            (
              a,
              b
            ) =>
              a.order -
              b.order
          )
          .map(
            item =>
              item.message
          );

    }

  }

  catch (
    error
  ) {

    console.warn(
      "Announcements failed:",
      error
    );

  }


  if (
    !announcements.length
  ) {

    announcements =
      templeContent
        .announcements ||
      [];

  }


  if (
    announcementsTicker
  ) {

    announcementsTicker
      .textContent =
        announcements.join(
          templeContent.separator ||
          "     •     "
        );

  }

}


/* ==========================================================
   DATE HELPERS
========================================================== */

function normalizeDate(
  value
) {

  if (
    !value
  ) {

    return null;

  }

  const parsed =
    new Date(
      value
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {

    return null;

  }

  return new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate()
  );

}


function sameDate(
  a,
  b
) {

  return (
    a &&
    b &&
    a.getFullYear() ===
      b.getFullYear() &&
    a.getMonth() ===
      b.getMonth() &&
    a.getDate() ===
      b.getDate()
  );

}


function getTomorrow() {

  const tomorrow =
    new Date();

  tomorrow.setDate(
    tomorrow.getDate() +
    1
  );

  return tomorrow;

}


function weekdayName(
  date
) {

  return date
    .toLocaleDateString(
      "en-US",
      {
        weekday:
          "long"
      }
    )
    .toUpperCase();

}


function getSaturdayNumber(
  date
) {

  const day =
    date.getDate();

  return Math.ceil(
    day /
    7
  );

}


/* ==========================================================
   TIME HELPERS
========================================================== */

function parseTimeToMinutes(
  value
) {

  if (
    !value
  ) {

    return null;

  }

  const text =
    value
      .trim()
      .toUpperCase();


  /* 12-hour */

  const twelve =
    text.match(
      /^(\d{1,2}):(\d{2})\s*(AM|PM)$/
    );

  if (
    twelve
  ) {

    let hour =
      Number(
        twelve[1]
      );

    const minute =
      Number(
        twelve[2]
      );

    const period =
      twelve[3];

    if (
      period === "AM" &&
      hour === 12
    ) {

      hour =
        0;

    }

    if (
      period === "PM" &&
      hour !== 12
    ) {

      hour +=
        12;

    }

    return (
      hour *
      60 +
      minute
    );

  }


  /* 24-hour */

  const twentyFour =
    text.match(
      /^(\d{1,2}):(\d{2})$/
    );

  if (
    twentyFour
  ) {

    return (
      Number(
        twentyFour[1]
      ) *
      60 +
      Number(
        twentyFour[2]
      )
    );

  }

  return null;

}


/* ==========================================================
   WEEKLY SCHEDULE
========================================================== */

async function loadWeeklySchedule() {

  try {

    const rows =
      await fetchCSV(
        templeContent
          .weeklyScheduleSheetURL
      );

    if (
      rows.length <= 1
    ) {

      weeklyScheduleLoaded =
        false;

      return;

    }

    const headers =
      rows[0].map(
        h =>
          h.trim()
      );

    const weekdayIndex =
      headers.indexOf(
        "Weekday"
      );

    const weekIndex =
      headers.indexOf(
        "WeekNumber"
      );

    const programIndex =
      headers.indexOf(
        "Program"
      );

    const timeIndex =
      headers.indexOf(
        "Time"
      );

    const endTimeIndex =
      headers.indexOf(
        "EndTime"
      );

    const activeIndex =
      headers.indexOf(
        "Active"
      );

    const startDateIndex =
      headers.indexOf(
        "StartDate"
      );

    const endDateIndex =
      headers.indexOf(
        "EndDate"
      );


    weeklyScheduleRows =
      rows
        .slice(1)
        .map(
          row => ({

            weekday:
              (
                row[
                  weekdayIndex
                ] ||
                ""
              )
                .trim()
                .toUpperCase(),

            weekNumber:
              Number(
                row[
                  weekIndex
                ]
              ) ||
              0,

            program:
              (
                row[
                  programIndex
                ] ||
                ""
              ).trim(),

            time:
              (
                row[
                  timeIndex
                ] ||
                ""
              ).trim(),

            endTime:
              endTimeIndex >= 0
                ?
                  (
                    row[
                      endTimeIndex
                    ] ||
                    ""
                  ).trim()
                :
                  "",

            active:
              (
                row[
                  activeIndex
                ] ||
                ""
              )
                .trim()
                .toUpperCase(),

            startDate:
              startDateIndex >= 0
                ?
                  normalizeDate(
                    row[
                      startDateIndex
                    ]
                  )
                :
                  null,

            endDate:
              endDateIndex >= 0
                ?
                  normalizeDate(
                    row[
                      endDateIndex
                    ]
                  )
                :
                  null

          })
        )
        .filter(
          row =>
            row.program &&
            row.active === "YES"
        );

    weeklyScheduleLoaded =
      true;

  }

  catch (
    error
  ) {

    console.warn(
      "Weekly schedule failed:",
      error
    );

    weeklyScheduleLoaded =
      false;

  }

}


/* ==========================================================
   ACTIVE WEEKLY ROWS FOR DATE
========================================================== */

function getWeeklyScheduleForDate(
  date
) {

  if (
    !weeklyScheduleLoaded
  ) {

    return [];

  }

  const weekday =
    weekdayName(
      date
    );

  const saturdayNumber =
    weekday === "SATURDAY"
      ?
        getSaturdayNumber(
          date
        )
      :
        0;


  const candidates =
    weeklyScheduleRows
      .filter(
        row => {

          if (
            row.weekday !==
            weekday
          ) {

            return false;

          }


          if (
            weekday ===
            "SATURDAY"
          ) {

            if (
              row.weekNumber &&
              row.weekNumber !==
                saturdayNumber
            ) {

              return false;

            }

          }


          return true;

        }
      );


  const grouped =
    new Map();


  candidates.forEach(
    row => {

      const key =
        row.program
          .toLowerCase();

      if (
        !grouped.has(
          key
        )
      ) {

        grouped.set(
          key,
          []
        );

      }

      grouped
        .get(
          key
        )
        .push(
          row
        );

    }
  );


  const result =
    [];


  grouped.forEach(
    rows => {

      const temporary =
        rows.find(
          row => {

            if (
              !row.startDate &&
              !row.endDate
            ) {

              return false;

            }

            const current =
              new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
              );


            if (
              row.startDate &&
              current <
              row.startDate
            ) {

              return false;

            }

            if (
              row.endDate &&
              current >
              row.endDate
            ) {

              return false;

            }

            return true;

          }
        );


      if (
        temporary
      ) {

        result.push(
          temporary
        );

        return;

      }


      const permanent =
        rows.find(
          row =>
            !row.startDate &&
            !row.endDate
        );


      if (
        permanent
      ) {

        result.push(
          permanent
        );

      }

    }
  );


  result.sort(
    (
      a,
      b
    ) => {

      const aMinutes =
        parseTimeToMinutes(
          a.time
        ) ??
        9999;

      const bMinutes =
        parseTimeToMinutes(
          b.time
        ) ??
        9999;

      return (
        aMinutes -
        bMinutes
      );

    }
  );


  return result;

}


/* ==========================================================
   SPECIAL EVENTS
========================================================== */

async function loadSpecialEvents() {

  specialEvents =
    [];

  try {

    const rows =
      await fetchCSV(
        templeContent
          .specialEventsSheetURL
      );

    if (
      rows.length <= 1
    ) {

      return;

    }

    const headers =
      rows[0].map(
        h =>
          h.trim()
      );

    const dateIndex =
      headers.indexOf(
        "Date"
      );

    const eventIndex =
      headers.indexOf(
        "Event"
      );

    const programIndex =
      headers.indexOf(
        "Program"
      );

    const timeIndex =
      headers.indexOf(
        "Time"
      );

    const activeIndex =
      headers.indexOf(
        "Active"
      );


    specialEvents =
      rows
        .slice(1)
        .map(
          row => ({

            date:
              normalizeDate(
                row[
                  dateIndex
                ]
              ),

            title:
              (
                row[
                  programIndex
                ] ||
                row[
                  eventIndex
                ] ||
                ""
              ).trim(),

            time:
              (
                row[
                  timeIndex
                ] ||
                ""
              ).trim(),

            active:
              (
                row[
                  activeIndex
                ] ||
                ""
              )
                .trim()
                .toUpperCase()

          })
        )
        .filter(
          item =>
            item.date &&
            item.title &&
            item.active ===
              "YES"
        );

  }

  catch (
    error
  ) {

    console.warn(
      "Special events failed:",
      error
    );

  }

}


/* ==========================================================
   SPECIAL EVENTS FOR DATE
========================================================== */

function getSpecialEventsForDate(
  date
) {

  return specialEvents
    .filter(
      event =>
        sameDate(
          event.date,
          date
        )
    )
    .sort(
      (
        a,
        b
      ) => {

        const aTime =
          parseTimeToMinutes(
            a.time
          ) ??
          9999;

        const bTime =
          parseTimeToMinutes(
            b.time
          ) ??
          9999;

        return (
          aTime -
          bTime
        );

      }
    );

}


/* ==========================================================
   MERGE SCHEDULES
========================================================== */

function getScheduleForDate(
  date
) {

  const weekly =
    getWeeklyScheduleForDate(
      date
    );

  const special =
    getSpecialEventsForDate(
      date
    );


  const output =
    weekly.map(
      row => ({
        title:
          row.program,

        time:
          row.time,

        endTime:
          row.endTime
      })
    );


  special.forEach(
    event => {

      const duplicate =
        output.some(
          item =>
            item.title
              .trim()
              .toLowerCase() ===
            event.title
              .trim()
              .toLowerCase()
        );

      if (
        !duplicate
      ) {

        output.push({
          title:
            event.title,

          time:
            event.time,

          endTime:
            ""
        });

      }

    }
  );


  output.sort(
    (
      a,
      b
    ) => {

      const aTime =
        parseTimeToMinutes(
          a.time
        ) ??
        9999;

      const bTime =
        parseTimeToMinutes(
          b.time
        ) ??
        9999;

      return (
        aTime -
        bTime
      );

    }
  );


  return output;

}


/* ==========================================================
   ESCAPE HTML
========================================================== */

function escapeHTML(
  value
) {

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


/* ==========================================================
   TODAY STATUS
========================================================== */

function getProgramStatus(
  program,
  date
) {

  const now =
    new Date();

  if (
    !sameDate(
      now,
      date
    )
  ) {

    return "";

  }


  const start =
    parseTimeToMinutes(
      program.time
    );

  if (
    start === null
  ) {

    return "";

  }


  let end =
    parseTimeToMinutes(
      program.endTime
    );


  if (
    end === null
  ) {

    end =
      start +
      90;

  }


  const current =
    now.getHours() *
    60 +
    now.getMinutes();


  if (
    current >
    end
  ) {

    return "Completed";

  }


  if (
    current >=
    start &&
    current <=
    end
  ) {

    return "In Progress";

  }

  return "";

}


/* ==========================================================
   RENDER TODAY
========================================================== */

function renderTodaySchedule() {

  if (
    !todayScheduleList
  ) {

    return;

  }

  const today =
    new Date();

  const programs =
    getScheduleForDate(
      today
    );


  if (
    !programs.length
  ) {

    todayScheduleList
      .innerHTML =
        `
        <div class="empty-schedule">
          ${
            escapeHTML(
              templeContent
                .noProgramMessage ||
              "Please check announcements for today's temple programs."
            )
          }
        </div>
        `;

    return;

  }


  todayScheduleList
    .innerHTML =
      programs
        .map(
          program => {

            const status =
              getProgramStatus(
                program,
                today
              );

            return `
              <div class="schedule-item">

                <div class="schedule-time">
                  ${
                    escapeHTML(
                      program.time
                    )
                  }
                </div>

                <div class="schedule-separator"></div>

                <div class="schedule-name">

                  ${
                    escapeHTML(
                      program.title
                    )
                  }

                  ${
                    status
                      ?
                        `
                        <span class="schedule-status">
                          (${escapeHTML(status)})
                        </span>
                        `
                      :
                        ""
                  }

                </div>

              </div>
            `;

          }
        )
        .join("");

}


/* ==========================================================
   RENDER TOMORROW
========================================================== */

function renderTomorrowSchedule() {

  if (
    !tomorrowScheduleList
  ) {

    return;

  }

  const tomorrow =
    getTomorrow();

  const programs =
    getScheduleForDate(
      tomorrow
    );


  if (
    !programs.length
  ) {

    tomorrowScheduleList
      .innerHTML =
        `
        <div class="tomorrow-empty">
          No scheduled programs.
        </div>
        `;

    return;

  }


  tomorrowScheduleList
    .innerHTML =
      programs
        .map(
          program => `
            <div class="tomorrow-schedule-item">

              <div class="tomorrow-time">
                ${
                  escapeHTML(
                    program.time
                  )
                }
              </div>

              <div class="tomorrow-separator"></div>

              <div class="tomorrow-name">
                ${
                  escapeHTML(
                    program.title
                  )
                }
              </div>

            </div>
          `
        )
        .join("");

}


/* ==========================================================
   UPCOMING EVENTS
========================================================== */

async function loadUpcomingEvents() {

  upcomingEvents =
    [];

  try {

    const rows =
      await fetchCSV(
        templeContent
          .upcomingEventsSheetURL
      );

    if (
      rows.length <= 1
    ) {

      throw new Error(
        "No upcoming events rows"
      );

    }

    const headers =
      rows[0].map(
        h =>
          h.trim()
      );

    const dateIndex =
      headers.indexOf(
        "Date"
      );

    const eventIndex =
      headers.indexOf(
        "Event"
      );

    const timeIndex =
      headers.indexOf(
        "Time"
      );

    const activeIndex =
      headers.indexOf(
        "Active"
      );

    const orderIndex =
      headers.indexOf(
        "DisplayOrder"
      );


    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );


    upcomingEvents =
      rows
        .slice(1)
        .map(
          row => ({

            date:
              normalizeDate(
                row[
                  dateIndex
                ]
              ),

            event:
              (
                row[
                  eventIndex
                ] ||
                ""
              ).trim(),

            time:
              (
                row[
                  timeIndex
                ] ||
                ""
              ).trim(),

            active:
              (
                row[
                  activeIndex
                ] ||
                ""
              )
                .trim()
                .toUpperCase(),

            order:
              Number(
                row[
                  orderIndex
                ]
              ) ||
              999

          })
        )
        .filter(
          item =>
            item.date &&
            item.event &&
            item.active ===
              "YES" &&
            item.date >=
              today
        )
        .sort(
          (
            a,
            b
          ) => {

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

  }

  catch (
    error
  ) {

    console.warn(
      "Upcoming events failed:",
      error
    );

  }


  let tickerText =
    "";


  if (
    upcomingEvents.length
  ) {

    tickerText =
      upcomingEvents
        .map(
          item => {

            const date =
              item.date
                .toLocaleDateString(
                  "en-US",
                  {
                    month:
                      "short",

                    day:
                      "numeric"
                  }
                );

            const time =
              item.time
                ?
                  ` • ${item.time}`
                :
                  "";

            return (
              `${date} • ${item.event}${time}`
            );

          }
        )
        .join(
          templeContent.separator ||
          "     •     "
        );

  }

  else {

    tickerText =
      (
        templeContent
          .upcomingEventsFallback ||
        [
          "Please check temple announcements for upcoming events"
        ]
      )
        .join(
          templeContent.separator ||
          "     •     "
        );

  }


  if (
    upcomingEventsTicker
  ) {

    upcomingEventsTicker
      .textContent =
        tickerText;

  }

}


/* ==========================================================
   BGM HELPERS
========================================================== */

function weekdayMatches(
  rule,
  date
) {

  const normalized =
    (
      rule ||
      "ALL"
    )
      .trim()
      .toUpperCase();


  if (
    normalized ===
    "ALL"
  ) {

    return true;

  }


  const weekday =
    weekdayName(
      date
    );


  if (
    normalized ===
    weekday
  ) {

    return true;

  }


  if (
    weekday ===
    "SATURDAY"
  ) {

    const saturdayRule =
      "SATURDAY-" +
      getSaturdayNumber(
        date
      );

    if (
      normalized ===
      saturdayRule
    ) {

      return true;

    }

  }

  return false;

}


function timeWindowMatches(
  startTime,
  endTime,
  date
) {

  if (
    !startTime &&
    !endTime
  ) {

    return true;

  }


  const nowMinutes =
    date.getHours() *
    60 +
    date.getMinutes();


  const startMinutes =
    parseTimeToMinutes(
      startTime
    );

  const endMinutes =
    parseTimeToMinutes(
      endTime
    );


  if (
    startMinutes !==
      null &&
    nowMinutes <
      startMinutes
  ) {

    return false;

  }


  if (
    endMinutes !==
      null &&
    nowMinutes >
      endMinutes
  ) {

    return false;

  }

  return true;

}


/* ==========================================================
   LOAD BGM
========================================================== */

async function loadBGMPlaylist() {

  defaultBGMPlaylist =
    [];

  specialBGMPlaylist =
    [];

  try {

    const rows =
      await fetchCSV(
        templeContent
          .bgmSheetURL
      );

    if (
      rows.length <= 1
    ) {

      return;

    }

    const headers =
      rows[0].map(
        h =>
          h.trim()
      );

    const urlIndex =
      headers.indexOf(
        "MusicURL"
      );

    const typeIndex =
      headers.indexOf(
        "Type"
      );

    const activeIndex =
      headers.indexOf(
        "Active"
      );

    const orderIndex =
      headers.indexOf(
        "DisplayOrder"
      );

    const weekdayIndex =
      headers.indexOf(
        "Weekday"
      );

    const startTimeIndex =
      headers.indexOf(
        "StartTime"
      );

    const endTimeIndex =
      headers.indexOf(
        "EndTime"
      );


    const tracks =
      rows
        .slice(1)
        .map(
          row => ({

            url:
              (
                row[
                  urlIndex
                ] ||
                ""
              ).trim(),

            type:
              (
                row[
                  typeIndex
                ] ||
                "DEFAULT"
              )
                .trim()
                .toUpperCase(),

            active:
              (
                row[
                  activeIndex
                ] ||
                ""
              )
                .trim()
                .toUpperCase(),

            order:
              Number(
                row[
                  orderIndex
                ]
              ) ||
              999,

            weekday:
              (
                row[
                  weekdayIndex
                ] ||
                "ALL"
              ).trim(),

            startTime:
              (
                row[
                  startTimeIndex
                ] ||
                ""
              ).trim(),

            endTime:
              (
                row[
                  endTimeIndex
                ] ||
                ""
              ).trim()

          })
        )
        .filter(
          track =>
            track.url &&
            track.active ===
              "YES"
        )
        .sort(
          (
            a,
            b
          ) =>
            a.order -
            b.order
        );


    defaultBGMPlaylist =
      tracks.filter(
        track =>
          track.type ===
          "DEFAULT"
      );


    specialBGMPlaylist =
      tracks.filter(
        track =>
          track.type ===
          "SPECIAL"
      );

  }

  catch (
    error
  ) {

    console.warn(
      "BGM failed:",
      error
    );

  }


  evaluateBGMSchedule();

}


/* ==========================================================
   BGM PLAYER
========================================================== */

function getTrackSignature(
  tracks
) {

  return tracks
    .map(
      track =>
        track.url
    )
    .join("|");

}


function getCurrentBGMPlaylist() {

  return currentBGMMode ===
    "SPECIAL"
      ?
        specialBGMPlaylist.filter(
          track => {

            const now =
              new Date();

            return (
              weekdayMatches(
                track.weekday,
                now
              ) &&
              timeWindowMatches(
                track.startTime,
                track.endTime,
                now
              )
            );

          }
        )
      :
        defaultBGMPlaylist;

}


function playCurrentBGM() {

  if (
    !backgroundMusic
  ) {

    return;

  }


  const playlist =
    getCurrentBGMPlaylist();


  if (
    !playlist.length
  ) {

    backgroundMusic.pause();

    return;

  }


  if (
    currentBGMIndex >=
    playlist.length
  ) {

    currentBGMIndex =
      0;

  }


  const track =
    playlist[
      currentBGMIndex
    ];


  backgroundMusic.volume =
    Number(
      templeContent.bgmVolume
    ) ||
    0.30;


  backgroundMusic.src =
    track.url;


  backgroundMusic
    .play()
    .catch(
      error => {

        console.warn(
          "BGM play blocked:",
          error
        );

      }
    );

}


function playNextBGM() {

  const playlist =
    getCurrentBGMPlaylist();


  if (
    !playlist.length
  ) {

    return;

  }


  currentBGMIndex =
    (
      currentBGMIndex + 1
    ) %
    playlist.length;


  playCurrentBGM();

}


/* ==========================================================
   EVALUATE BGM MODE
========================================================== */

function evaluateBGMSchedule() {

  const now =
    new Date();


  const activeSpecial =
    specialBGMPlaylist.filter(
      track =>
        weekdayMatches(
          track.weekday,
          now
        ) &&
        timeWindowMatches(
          track.startTime,
          track.endTime,
          now
        )
    );


  const nextMode =
    activeSpecial.length
      ?
        "SPECIAL"
      :
        "DEFAULT";


  const nextPlaylist =
    nextMode ===
    "SPECIAL"
      ?
        activeSpecial
      :
        defaultBGMPlaylist;


  const nextSignature =
    getTrackSignature(
      nextPlaylist
    );


  if (
    nextMode !==
      currentBGMMode ||
    nextSignature !==
      currentBGMSignature
  ) {

    currentBGMMode =
      nextMode;

    currentBGMSignature =
      nextSignature;

    currentBGMIndex =
      0;

    playCurrentBGM();

  }

}


/* ==========================================================
   AUDIO ENDED
========================================================== */

if (
  backgroundMusic
) {

  backgroundMusic.addEventListener(
    "ended",
    () => {

      const previousMode =
        currentBGMMode;

      const previousSignature =
        currentBGMSignature;


      evaluateBGMSchedule();


      if (
        previousMode ===
          currentBGMMode &&
        previousSignature ===
          currentBGMSignature
      ) {

        playNextBGM();

      }

    }
  );

}


/* ==========================================================
   REFRESH EVERYTHING
========================================================== */

async function refreshRemoteContent() {

  await Promise.allSettled([

    loadAnnouncements(),

    loadFlyers(),

    loadSpecialEvents(),

    loadWeeklySchedule(),

    loadUpcomingEvents(),

    loadBGMPlaylist()

  ]);


  renderTodaySchedule();

  renderTomorrowSchedule();

}


/* ==========================================================
   INITIALIZATION
========================================================== */

async function initializeTempleTV() {

  updateClock();

  setInterval(
    updateClock,
    1000
  );


  await refreshRemoteContent();


  setInterval(
    refreshRemoteContent,

    (
      Number(
        templeContent
          .remoteRefreshMinutes
      ) ||
      5
    ) *
    60 *
    1000
  );


  setInterval(
    () => {

      renderTodaySchedule();

      renderTomorrowSchedule();

    },
    60 *
    1000
  );


  setInterval(
    evaluateBGMSchedule,

    (
      Number(
        templeContent
          .bgmScheduleCheckSeconds
      ) ||
      15
    ) *
    1000
  );

}


/* ==========================================================
   START
========================================================== */

document.addEventListener(
  "DOMContentLoaded",
  initializeTempleTV
);
