/* ==========================================================
   CHINMAYA SARASWATI ASHRAM - DEVI TEMPLE
   TEMPLE TV DIGITAL SIGNAGE
========================================================== */


/* ==========================================================
   STATE
========================================================== */

let flyers = [];
let currentFlyerIndex = 0;

let specialEvents = [];

let weeklyScheduleRows = [];
let weeklyScheduleLoaded = false;

let flyerChanging = false;


/* ==========================================================
   BGM STATE
========================================================== */

let defaultBGMPlaylist = [];
let specialBGMTracks = [];

let currentBGMMode = "NONE";

let currentBGMPlaylist = [];
let currentBGMIndex = 0;

let currentSpecialSignature = "";

let savedDefaultIndex = 0;
let savedDefaultTime = 0;


/* ==========================================================
   ELEMENTS
========================================================== */

const flyerElement =
  document.getElementById(
    "flyer"
  );

const tickerText =
  document.getElementById(
    "ticker-text"
  );

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
  document.getElementById(
    "clock"
  );

const headerDateElement =
  document.getElementById(
    "header-date"
  );

const musicElement =
  document.getElementById(
    "background-music"
  );


/* ==========================================================
   CACHE BUSTER
========================================================== */

function addCacheBuster(url) {

  if (!url) {
    return "";
  }

  const separator =
    url.includes("?")
      ? "&"
      : "?";

  return (
    url +
    separator +
    "_=" +
    Date.now()
  );
}


/* ==========================================================
   CSV PARSER
========================================================== */

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


    if (
      char === '"'
    ) {

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

        rows.push(
          row
        );

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

async function fetchCSV(url) {

  if (!url) {
    return [];
  }


  const response =
    await fetch(
      addCacheBuster(
        url
      ),
      {
        cache:
          "no-store"
      }
    );


  if (
    !response.ok
  ) {

    throw new Error(
      "Google Sheet request failed: " +
      response.status
    );

  }


  const text =
    await response.text();


  return parseCSV(
    text
  );
}


/* ==========================================================
   CLOCK
========================================================== */

function updateClock() {

  const now =
    new Date();


  if (
    clockElement
  ) {

    clockElement.textContent =
      now.toLocaleTimeString(
        "en-US",
        {
          hour:
            "numeric",

          minute:
            "2-digit",

          hour12:
            true
        }
      );

  }


  if (
    headerDateElement
  ) {

    headerDateElement.textContent =
      now.toLocaleDateString(
        "en-US",
        {
          weekday:
            "short",

          month:
            "short",

          day:
            "numeric"
        }
      )
      .toUpperCase();

  }

}


/* ==========================================================
   DATE HELPERS
========================================================== */

function dateKey(date) {

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    )
    .padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    )
    .padStart(
      2,
      "0"
    );


  return (
    `${year}-${month}-${day}`
  );
}


function normalizeDate(value) {

  if (!value) {
    return "";
  }


  const text =
    String(
      value
    )
    .trim();


  const us =
    text.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );


  if (
    us
  ) {

    return (
      us[3] +
      "-" +
      us[1].padStart(
        2,
        "0"
      ) +
      "-" +
      us[2].padStart(
        2,
        "0"
      )
    );

  }


  const iso =
    text.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    );


  if (
    iso
  ) {

    return (
      iso[1] +
      "-" +
      iso[2].padStart(
        2,
        "0"
      ) +
      "-" +
      iso[3].padStart(
        2,
        "0"
      )
    );

  }


  const parsed =
    new Date(
      text
    );


  if (
    !Number.isNaN(
      parsed.getTime()
    )
  ) {

    return dateKey(
      parsed
    );

  }


  return "";
}


/* ==========================================================
   WEEKDAY
========================================================== */

function getWeekdayName(date) {

  return [

    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY"

  ][
    date.getDay()
  ];
}


function getSaturdayNumber(date) {

  return Math.ceil(
    date.getDate() /
    7
  );
}


/* ==========================================================
   DRIVE URL
========================================================== */

function getDriveFileId(url) {

  if (!url) {
    return "";
  }


  let match =
    String(
      url
    )
    .match(
      /\/file\/d\/([^/]+)/
    );


  if (
    match
  ) {

    return match[1];

  }


  match =
    String(
      url
    )
    .match(
      /\/d\/([^/]+)/
    );


  if (
    match
  ) {

    return match[1];

  }


  match =
    String(
      url
    )
    .match(
      /[?&]id=([^&]+)/
    );


  if (
    match
  ) {

    return match[1];

  }


  return "";
}


function convertDriveImageURL(url) {

  const fileId =
    getDriveFileId(
      url
    );


  if (
    !fileId
  ) {

    return url;

  }


  return (
    "https://drive.google.com/thumbnail" +
    `?id=${fileId}&sz=w3000`
  );
}


function convertDriveAudioURL(url) {

  const fileId =
    getDriveFileId(
      url
    );


  if (
    !fileId
  ) {

    return url;

  }


  return (
    "https://drive.google.com/uc" +
    `?export=download&id=${fileId}`
  );
}


/* ==========================================================
   ESCAPE HTML
========================================================== */

function escapeHTML(value) {

  return String(
    value ||
    ""
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
   ANNOUNCEMENTS
========================================================== */

function loadLocalAnnouncements() {

  if (
    !tickerText
  ) {

    return;

  }


  tickerText.textContent =
    (
      templeContent
        .announcements ||
      []
    )
    .join(
      templeContent
        .separator ||
      "     •     "
    );
}


async function loadAnnouncements() {

  try {

    const rows =
      await fetchCSV(
        templeContent
          .announcementSheetURL
      );


    const messages =
      [];


    rows.forEach(
      (
        row,
        index
      ) => {

        row.forEach(
          cell => {

            const value =
              String(
                cell ||
                ""
              )
              .trim();


            if (
              !value
            ) {

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


            messages.push(
              value
            );

          }
        );

      }
    );


    if (
      tickerText
    ) {

      tickerText.textContent =
        messages.length
          ?
          messages.join(
            templeContent.separator
          )
          :
          (
            templeContent
              .announcements ||
            []
          )
          .join(
            templeContent.separator
          );

    }

  }

  catch (
    error
  ) {

    console.error(
      "Announcements:",
      error
    );

    loadLocalAnnouncements();

  }

}


/* ==========================================================
   FLYERS
========================================================== */

function setFlyerOrientation() {

  if (
    !flyerElement
  ) {

    return;

  }


  flyerElement
    .classList
    .remove(
      "flyer-landscape",
      "flyer-portrait",
      "flyer-square"
    );


  const width =
    flyerElement
      .naturalWidth;

  const height =
    flyerElement
      .naturalHeight;


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
    ratio >
    1.15
  ) {

    flyerElement
      .classList
      .add(
        "flyer-landscape"
      );

  }

  else if (
    ratio <
    0.85
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

}


/* ==========================================================
   SAFE FLYER DISPLAY
========================================================== */

function showFlyer(
  animate = true
) {

  if (
    !flyerElement
  ) {

    console.warn(
      "Flyer element #flyer was not found."
    );

    return;

  }


  if (
    !Array.isArray(
      flyers
    ) ||
    !flyers.length
  ) {

    return;

  }


  if (
    currentFlyerIndex >=
    flyers.length
  ) {

    currentFlyerIndex =
      0;

  }


  const nextURL =
    flyers[
      currentFlyerIndex
    ];


  flyerElement.onload =
    () => {

      setFlyerOrientation();


      flyerElement
        .classList
        .remove(
          "flyer-transition-in",
          "flyer-transition-out"
        );


      requestAnimationFrame(
        () => {

          flyerElement
            .classList
            .add(
              "flyer-visible"
            );

        }
      );


      flyerChanging =
        false;

    };


  flyerElement.onerror =
    () => {

      console.error(
        "Could not load flyer:",
        nextURL
      );


      flyerChanging =
        false;

    };


  flyerElement
    .classList
    .remove(
      "flyer-visible",
      "flyer-transition-out"
    );


  if (
    animate
  ) {

    flyerElement
      .classList
      .add(
        "flyer-transition-in"
      );

  }


  flyerElement.src =
    addCacheBuster(
      nextURL
    );

}


/* ==========================================================
   SAFE FLYER ROTATION
========================================================== */

function rotateFlyer() {

  /*
    This guard prevents the classList null error
    that appeared in your browser console.
  */

  if (
    !flyerElement
  ) {

    console.warn(
      "Cannot rotate flyer: #flyer is missing."
    );

    return;

  }


  if (
    flyerChanging
  ) {

    return;

  }


  if (
    !Array.isArray(
      flyers
    ) ||
    flyers.length <=
    1
  ) {

    return;

  }


  flyerChanging =
    true;


  flyerElement
    .classList
    .remove(
      "flyer-visible",
      "flyer-transition-in"
    );


  flyerElement
    .classList
    .add(
      "flyer-transition-out"
    );


  setTimeout(
    () => {

      currentFlyerIndex =
        (
          currentFlyerIndex +
          1
        )
        %
        flyers.length;


      showFlyer(
        true
      );

    },

    650
  );

}


/* ==========================================================
   LOAD REMOTE FLYERS
========================================================== */

async function loadRemoteFlyers() {

  try {

    const rows =
      await fetchCSV(
        templeContent
          .flyerSheetURL
      );


    if (
      rows.length <
      2
    ) {

      throw new Error(
        "Flyer sheet is empty."
      );

    }


    const headers =
      rows[0]
        .map(
          value =>
            String(
              value ||
              ""
            )
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


    if (
      imageIndex ===
      -1
    ) {

      throw new Error(
        "ImageURL column not found."
      );

    }


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
        activeIndex >= 0
          ?
          String(
            row[
              activeIndex
            ] ||
            ""
          )
          .trim()
          .toUpperCase()
          :
          "YES";


      if (
        active !==
        "YES"
      ) {

        continue;

      }


      const original =
        String(
          row[
            imageIndex
          ] ||
          ""
        )
        .trim();


      if (
        !original
      ) {

        continue;

      }


      remote.push(
        {

          url:
            convertDriveImageURL(
              original
            ),

          order:
            orderIndex >= 0
              ?
              (
                parseInt(
                  row[
                    orderIndex
                  ],
                  10
                ) ||
                999
              )
              :
              999

        }
      );

    }


    remote.sort(
      (
        a,
        b
      ) =>
        a.order -
        b.order
    );


    if (
      remote.length
    ) {

      flyers =
        remote.map(
          item =>
            item.url
        );

    }

    else {

      flyers =
        (
          templeContent
            .localFlyers ||
          []
        )
        .slice();

    }


    if (
      currentFlyerIndex >=
      flyers.length
    ) {

      currentFlyerIndex =
        0;

    }


    showFlyer(
      false
    );

  }

  catch (
    error
  ) {

    console.error(
      "Flyers:",
      error
    );


    flyers =
      (
        templeContent
          .localFlyers ||
        []
      )
      .slice();


    currentFlyerIndex =
      0;


    showFlyer(
      false
    );

  }

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
      rows.length <
      2
    ) {

      throw new Error(
        "WeeklySchedule is empty."
      );

    }


    const headers =
      rows[0]
      .map(
        value =>
          String(
            value ||
            ""
          )
          .trim()
          .toLowerCase()
      );


    const weekdayIndex =
      headers.indexOf(
        "weekday"
      );

    const weekNumberIndex =
      headers.indexOf(
        "weeknumber"
      );

    const programIndex =
      headers.indexOf(
        "program"
      );

    const timeIndex =
      headers.indexOf(
        "time"
      );

    const endTimeIndex =
      headers.indexOf(
        "endtime"
      );

    const activeIndex =
      headers.indexOf(
        "active"
      );

    const startDateIndex =
      headers.indexOf(
        "startdate"
      );

    const endDateIndex =
      headers.indexOf(
        "enddate"
      );


    if (
      weekdayIndex < 0 ||
      programIndex < 0
    ) {

      throw new Error(
        "Required WeeklySchedule columns are missing."
      );

    }


    const loaded =
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
          String(
            row[
              activeIndex
            ] ||
            "YES"
          )
          .trim()
          .toUpperCase()
          :
          "YES";


      if (
        active !==
        "YES"
      ) {

        continue;

      }


      const weekday =
        String(
          row[
            weekdayIndex
          ] ||
          ""
        )
        .trim()
        .toUpperCase();


      const program =
        String(
          row[
            programIndex
          ] ||
          ""
        )
        .trim();


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
            weekNumberIndex >= 0
              ?
              String(
                row[
                  weekNumberIndex
                ] ||
                "ALL"
              )
              .trim()
              .toUpperCase()
              :
              "ALL",

          program,

          time:
            timeIndex >= 0
              ?
              String(
                row[
                  timeIndex
                ] ||
                ""
              )
              .trim()
              :
              "",

          endTime:
            endTimeIndex >= 0
              ?
              String(
                row[
                  endTimeIndex
                ] ||
                ""
              )
              .trim()
              :
              "",

          startDate:
            startDateIndex >= 0
              ?
              normalizeDate(
                row[
                  startDateIndex
                ]
              )
              :
              "",

          endDate:
            endDateIndex >= 0
              ?
              normalizeDate(
                row[
                  endDateIndex
                ]
              )
              :
              "",

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

  catch (
    error
  ) {

    console.error(
      "Weekly Schedule:",
      error
    );


    weeklyScheduleLoaded =
      false;

  }

}


/* ==========================================================
   SCHEDULE MATCH
========================================================== */

function scheduleDateMatches(
  row,
  date
) {

  const key =
    dateKey(
      date
    );


  if (
    row.startDate &&
    key <
    row.startDate
  ) {

    return false;

  }


  if (
    row.endDate &&
    key >
    row.endDate
  ) {

    return false;

  }


  return true;
}


function weeklyRowMatchesDay(
  row,
  date
) {

  const weekday =
    getWeekdayName(
      date
    );


  if (
    row.weekday !==
    weekday
  ) {

    return false;

  }


  if (
    weekday !==
    "SATURDAY"
  ) {

    return (
      row.weekNumber ===
        "ALL" ||
      row.weekNumber ===
        ""
    );

  }


  if (
    row.weekNumber ===
      "ALL" ||
    row.weekNumber ===
      ""
  ) {

    return true;

  }


  return (
    Number(
      row.weekNumber
    )
    ===
    getSaturdayNumber(
      date
    )
  );
}


/* ==========================================================
   WEEKLY PROGRAMS
========================================================== */

function getSheetProgramsForDate(
  date
) {

  if (
    !weeklyScheduleLoaded
  ) {

    return null;

  }


  const matching =
    weeklyScheduleRows
      .filter(
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
          .trim()
          .toLowerCase();


      if (
        !groups.has(
          key
        )
      ) {

        groups.set(
          key,
          []
        );

      }


      groups
        .get(
          key
        )
        .push(
          row
        );

    }
  );


  const selected =
    [];


  groups.forEach(
    rows => {

      const temporary =
        rows
        .filter(
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


/* ==========================================================
   FALLBACK PROGRAMS
========================================================== */

function getFallbackRegularPrograms(
  date
) {

  const day =
    date.getDay();


  if (
    day === 6
  ) {

    return (
      (
        templeContent
          .saturdaySchedule ||
        {}
      )[
        getSaturdayNumber(
          date
        )
      ]
      ||
      []
    );

  }


  return (
    (
      templeContent
        .weeklySchedule ||
      {}
    )[
      day
    ]
    ||
    []
  );
}


function getRegularPrograms(
  date
) {

  const sheet =
    getSheetProgramsForDate(
      date
    );


  if (
    sheet !==
    null
  ) {

    return sheet;

  }


  return getFallbackRegularPrograms(
    date
  );
}


/* ==========================================================
   SPECIAL EVENTS
========================================================== */

async function loadSpecialEvents() {

  try {

    const rows =
      await fetchCSV(
        templeContent
          .specialEventsSheetURL
      );


    if (
      rows.length <
      2
    ) {

      specialEvents =
        [];

      return;

    }


    const headers =
      rows[0]
        .map(
          value =>
            String(
              value ||
              ""
            )
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


    specialEvents =
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
          String(
            row[
              activeIndex
            ] ||
            "YES"
          )
          .trim()
          .toUpperCase()
          :
          "YES";


      if (
        active !==
        "YES"
      ) {

        continue;

      }


      const date =
        dateIndex >= 0
          ?
          normalizeDate(
            row[
              dateIndex
            ]
          )
          :
          "";


      if (
        !date
      ) {

        continue;

      }


      specialEvents.push(
        {

          date,

          event:
            eventIndex >= 0
              ?
              String(
                row[
                  eventIndex
                ] ||
                ""
              )
              .trim()
              :
              "",

          program:
            programIndex >= 0
              ?
              String(
                row[
                  programIndex
                ] ||
                ""
              )
              .trim()
              :
              "",

          time:
            timeIndex >= 0
              ?
              String(
                row[
                  timeIndex
                ] ||
                ""
              )
              .trim()
              :
              "",

          endTime:
            ""

        }
      );

    }


    renderTodaySchedule();

    renderTomorrowSchedule();

  }

  catch (
    error
  ) {

    console.error(
      "Special Events:",
      error
    );

  }

}


/* ==========================================================
   TIME
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
    String(
      value
    )
    .trim()
    .toUpperCase();


  let match =
    text.match(
      /^(\d{1,2}):(\d{2})\s*(AM|PM)$/
    );


  if (
    match
  ) {

    let hour =
      Number(
        match[1]
      );

    const minute =
      Number(
        match[2]
      );


    if (
      match[3] ===
        "PM" &&
      hour !==
        12
    ) {

      hour +=
        12;

    }


    if (
      match[3] ===
        "AM" &&
      hour ===
        12
    ) {

      hour =
        0;

    }


    return (
      hour *
      60 +
      minute
    );

  }


  match =
    text.match(
      /^(\d{1,2}):(\d{2})$/
    );


  if (
    match
  ) {

    return (
      Number(
        match[1]
      ) *
      60
      +
      Number(
        match[2]
      )
    );

  }


  return null;
}


/* ==========================================================
   PROGRAM STATUS
========================================================== */

function getProgramTimeStatus(
  start,
  end
) {

  const startMinutes =
    parseTimeToMinutes(
      start
    );


  if (
    startMinutes ===
    null
  ) {

    return {

      current:
        false,

      completed:
        false

    };

  }


  let endMinutes =
    parseTimeToMinutes(
      end
    );


  if (
    endMinutes ===
    null
  ) {

    endMinutes =
      startMinutes +
      90;

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
      nowMinutes >=
        startMinutes &&
      nowMinutes <
        endMinutes,

    completed:
      nowMinutes >=
        endMinutes

  };
}


/* ==========================================================
   COMBINE SCHEDULE
========================================================== */

function getProgramsForDate(
  date
) {

  const programs =
    [];


  getRegularPrograms(
    date
  )
  .forEach(
    program => {

      programs.push(
        {

          title:
            program.title,

          time:
            program.time,

          endTime:
            program.endTime ||
            ""

        }
      );

    }
  );


  const key =
    dateKey(
      date
    );


  specialEvents
    .filter(
      event =>
        event.date ===
        key
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
              String(
                program.title
              )
              .trim()
              .toLowerCase()
              ===
              String(
                title
              )
              .trim()
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

              endTime:
                event.endTime ||
                ""

            }
          );

        }

      }
    );


  programs.sort(
    (
      a,
      b
    ) => {

      const aTime =
        parseTimeToMinutes(
          a.time
        );

      const bTime =
        parseTimeToMinutes(
          b.time
        );


      return (
        (
          aTime ===
          null
            ?
            9999
            :
            aTime
        )
        -
        (
          bTime ===
          null
            ?
            9999
            :
            bTime
        )
      );

    }
  );


  return programs;
}


/* ==========================================================
   TODAY
========================================================== */

function renderTodaySchedule() {

  if (
    !scheduleList
  ) {

    return;

  }


  const today =
    new Date();


  const programs =
    getProgramsForDate(
      today
    );


  if (
    !programs.length
  ) {

    scheduleList.innerHTML =
      `
        <div class="empty-schedule">
          ${
            escapeHTML(
              templeContent
                .noProgramMessage ||
              "No scheduled programs"
            )
          }
        </div>
      `;

    return;

  }


  scheduleList.innerHTML =
    programs
      .map(
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
      )
      .join("");

}


/* ==========================================================
   TOMORROW
========================================================== */

function renderTomorrowSchedule() {

  if (
    !tomorrowScheduleList
  ) {

    return;

  }


  const tomorrow =
    new Date();


  tomorrow.setDate(
    tomorrow.getDate() +
    1
  );


  tomorrow.setHours(
    12,
    0,
    0,
    0
  );


  const programs =
    getProgramsForDate(
      tomorrow
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
    programs
      .map(
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
      )
      .join("");

}


/* ==========================================================
   UPCOMING EVENTS
========================================================== */

function showUpcomingFallback() {

  if (
    !upcomingEventsText
  ) {

    return;

  }


  upcomingEventsText.textContent =
    (
      templeContent
        .upcomingEventsFallback ||
      []
    )
    .join(
      templeContent.separator
    );
}


async function loadUpcomingEvents() {

  try {

    const rows =
      await fetchCSV(
        templeContent
          .upcomingEventsSheetURL
      );


    if (
      rows.length <
      2
    ) {

      showUpcomingFallback();

      return;

    }


    const headers =
      rows[0]
      .map(
        value =>
          String(
            value ||
            ""
          )
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
          String(
            row[
              activeIndex
            ] ||
            ""
          )
          .trim()
          .toUpperCase()
          :
          "YES";


      if (
        active !==
        "YES"
      ) {

        continue;

      }


      const normalized =
        dateIndex >= 0
          ?
          normalizeDate(
            row[
              dateIndex
            ]
          )
          :
          "";


      if (
        !normalized
      ) {

        continue;

      }


      const eventDate =
        new Date(
          normalized +
          "T00:00:00"
        );


      if (
        eventDate <
        today
      ) {

        continue;

      }


      const title =
        eventIndex >= 0
          ?
          String(
            row[
              eventIndex
            ] ||
            ""
          )
          .trim()
          :
          "";


      if (
        !title
      ) {

        continue;

      }


      events.push(
        {

          date:
            eventDate,

          title,

          time:
            timeIndex >= 0
              ?
              String(
                row[
                  timeIndex
                ] ||
                ""
              )
              .trim()
              :
              "",

          order:
            orderIndex >= 0
              ?
              (
                parseInt(
                  row[
                    orderIndex
                  ],
                  10
                ) ||
                999
              )
              :
              999

        }
      );

    }


    events.sort(
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

            const date =
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

  catch (
    error
  ) {

    console.error(
      "Upcoming Events:",
      error
    );


    showUpcomingFallback();

  }

}


/* ==========================================================
   BGM
========================================================== */

function weekdayMatches(
  value,
  date
) {

  const weekday =
    String(
      value ||
      "ALL"
    )
    .trim()
    .toUpperCase();


  if (
    weekday ===
    "ALL"
  ) {

    return true;

  }


  if (
    weekday ===
    getWeekdayName(
      date
    )
  ) {

    return true;

  }


  if (
    date.getDay() ===
      6 &&
    weekday.startsWith(
      "SATURDAY-"
    )
  ) {

    return (
      Number(
        weekday.split(
          "-"
        )[1]
      )
      ===
      getSaturdayNumber(
        date
      )
    );

  }


  return false;
}


/* ==========================================================
   BGM TIME
========================================================== */

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
    start <=
    end
  ) {

    return (
      now >=
        start &&
      now <
        end
    );

  }


  return (
    now >=
      start ||
    now <
      end
  );
}


/* ==========================================================
   LOAD BGM
========================================================== */

async function loadBGMPlaylist() {

  try {

    const rows =
      await fetchCSV(
        templeContent
          .bgmSheetURL
      );


    if (
      rows.length <
      2
    ) {

      return;

    }


    const headers =
      rows[0]
      .map(
        value =>
          String(
            value ||
            ""
          )
          .trim()
          .toLowerCase()
      );


    const musicIndex =
      headers.indexOf(
        "musicurl"
      );

    const typeIndex =
      headers.indexOf(
        "type"
      );

    const activeIndex =
      headers.indexOf(
        "active"
      );

    const orderIndex =
      headers.indexOf(
        "displayorder"
      );

    const weekdayIndex =
      headers.indexOf(
        "weekday"
      );

    const startIndex =
      headers.indexOf(
        "starttime"
      );

    const endIndex =
      headers.indexOf(
        "endtime"
      );


    if (
      musicIndex <
      0
    ) {

      return;

    }


    const defaults =
      [];

    const specials =
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
          String(
            row[
              activeIndex
            ] ||
            "YES"
          )
          .trim()
          .toUpperCase()
          :
          "YES";


      if (
        active !==
        "YES"
      ) {

        continue;

      }


      const original =
        String(
          row[
            musicIndex
          ] ||
          ""
        )
        .trim();


      if (
        !original
      ) {

        continue;

      }


      const track =
        {

          url:
            convertDriveAudioURL(
              original
            ),

          order:
            orderIndex >= 0
              ?
              (
                parseInt(
                  row[
                    orderIndex
                  ],
                  10
                ) ||
                999
              )
              :
              999,

          weekday:
            weekdayIndex >= 0
              ?
              String(
                row[
                  weekdayIndex
                ] ||
                "ALL"
              )
              .trim()
              .toUpperCase()
              :
              "ALL",

          startTime:
            startIndex >= 0
              ?
              String(
                row[
                  startIndex
                ] ||
                ""
              )
              .trim()
              :
              "",

          endTime:
            endIndex >= 0
              ?
              String(
                row[
                  endIndex
                ] ||
                ""
              )
              .trim()
              :
              ""

        };


      const type =
        typeIndex >= 0
          ?
          String(
            row[
              typeIndex
            ] ||
            "DEFAULT"
          )
          .trim()
          .toUpperCase()
          :
          "DEFAULT";


      if (
        type ===
        "SPECIAL"
      ) {

        specials.push(
          track
        );

      }

      else {

        defaults.push(
          track
        );

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

  catch (
    error
  ) {

    console.error(
      "BGM Sheet:",
      error
    );

  }

}


/* ==========================================================
   SPECIAL BGM
========================================================== */

function getActiveSpecialPlaylist() {

  const now =
    new Date();


  return specialBGMTracks
    .filter(
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

        ]
        .join(
          "~"
        )
    )
    .join(
      "|"
    );
}


/* ==========================================================
   PLAY BGM
========================================================== */

function playCurrentBGMTrack(
  resumeSeconds = 0
) {

  if (
    !musicElement ||
    !currentBGMPlaylist.length
  ) {

    return;

  }


  if (
    currentBGMIndex >=
    currentBGMPlaylist.length
  ) {

    currentBGMIndex =
      0;

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
    Number(
      templeContent
        .bgmVolume
    ) ||
    0.30;


  musicElement.load();


  const start =
    () => {

      if (
        resumeSeconds >
        0
      ) {

        try {

          musicElement.currentTime =
            resumeSeconds;

        }

        catch (
          error
        ) {}

      }


      musicElement
        .play()
        .catch(
          error => {

            /*
              Normal in ordinary browsers.
              Kiosk Chrome should use:
              --autoplay-policy=no-user-gesture-required
            */

            console.warn(
              "BGM autoplay blocked:",
              error.message
            );

          }
        );

    };


  if (
    resumeSeconds >
    0
  ) {

    musicElement
      .addEventListener(
        "loadedmetadata",
        start,
        {
          once:
            true
        }
      );

  }

  else {

    start();

  }

}


/* ==========================================================
   DEFAULT BGM
========================================================== */

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
      Math.min(
        savedDefaultIndex,
        currentBGMPlaylist.length -
        1
      );


    playCurrentBGMTrack(
      savedDefaultTime
    );


    savedDefaultTime =
      0;

  }

  else {

    currentBGMIndex =
      0;


    playCurrentBGMTrack();

  }

}


/* ==========================================================
   SPECIAL BGM START
========================================================== */

function startSpecialBGM(
  playlist
) {

  if (
    !playlist.length
  ) {

    return;

  }


  if (
    currentBGMMode ===
      "DEFAULT" &&
    musicElement
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


  currentBGMIndex =
    0;


  playCurrentBGMTrack();

}


/* ==========================================================
   BGM SCHEDULE
========================================================== */

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
    &&
    defaultBGMPlaylist.length
  ) {

    startDefaultBGM();

  }

}


/* ==========================================================
   NEXT BGM
========================================================== */

function playNextBGM() {

  if (
    !currentBGMPlaylist.length
  ) {

    return;

  }


  currentBGMIndex =
    (
      currentBGMIndex +
      1
    )
    %
    currentBGMPlaylist.length;


  playCurrentBGMTrack();

}


/* ==========================================================
   AUDIO EVENTS
========================================================== */

if (
  musicElement
) {

  musicElement
    .addEventListener(
      "ended",
      () => {

        const oldMode =
          currentBGMMode;

        const oldSignature =
          currentSpecialSignature;


        evaluateBGMSchedule();


        if (
          oldMode ===
            currentBGMMode
          &&
          oldSignature ===
            currentSpecialSignature
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


  document
    .addEventListener(
      "click",
      resumeAudio
    );


  document
    .addEventListener(
      "keydown",
      resumeAudio
    );

}


/* ==========================================================
   INITIALIZE
========================================================== */

async function initializeTempleTV() {

  /*
    Clock first.
    Even if Google Sheets fail, the header must work.
  */

  updateClock();


  loadLocalAnnouncements();

  showUpcomingFallback();


  /*
    Schedule first.
  */

  await Promise.allSettled(
    [

      loadWeeklySchedule(),

      loadSpecialEvents()

    ]
  );


  renderTodaySchedule();

  renderTomorrowSchedule();


  /*
    Remaining remote content.
  */

  await Promise.allSettled(
    [

      loadAnnouncements(),

      loadRemoteFlyers(),

      loadUpcomingEvents(),

      loadBGMPlaylist()

    ]
  );

}


/* ==========================================================
   START
========================================================== */

updateClock();


setInterval(
  updateClock,
  1000
);


initializeTempleTV();


/* ==========================================================
   FLYER TIMER
   15 SEC FROM announcements.js
========================================================== */

setInterval(
  rotateFlyer,

  (
    Number(
      templeContent
        .flyerDuration
    )
    ||
    15
  )
  *
  1000
);


/* ==========================================================
   BGM CHECK TIMER
========================================================== */

setInterval(
  evaluateBGMSchedule,

  (
    Number(
      templeContent
        .bgmScheduleCheckSeconds
    )
    ||
    15
  )
  *
  1000
);


/* ==========================================================
   REMOTE REFRESH
========================================================== */

const refreshTime =

  (
    Number(
      templeContent
        .remoteRefreshMinutes
    )
    ||
    5
  )

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


/* ==========================================================
   SCHEDULE STATUS REFRESH
========================================================== */

setInterval(
  () => {

    renderTodaySchedule();

    renderTomorrowSchedule();

  },

  60 *
  1000
);
