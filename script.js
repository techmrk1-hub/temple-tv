/* ==========================================================
   CHINMAYA SARASWATI ASHRAM - DEVI TEMPLE
   TEMPLE TV DIGITAL SIGNAGE

   FEATURES
   ----------------------------------------------------------
   ✓ Google Sheet Flyers
   ✓ Announcements
   ✓ Upcoming Events
   ✓ Special Events
   ✓ Weekly Schedule from Google Sheets
   ✓ Start Time + End Time
   ✓ Temporary Date Overrides
   ✓ 1st / 2nd / 3rd Saturday Support
   ✓ Today's Schedule
   ✓ Automatic Completed Status
   ✓ Default BGM
   ✓ Scheduled Special BGM
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
  document.getElementById("upcoming-events-text");

const scheduleList =
  document.getElementById("today-schedule-list");

const clockElement =
  document.getElementById("clock");

const headerDateElement =
  document.getElementById("header-date");

const musicElement =
  document.getElementById("background-music");


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
    String(value).trim();


  // MM/DD/YYYY

  const usDate =
    text.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );

  if (usDate) {

    return (
      usDate[3]
      +
      "-"
      +
      usDate[1].padStart(2, "0")
      +
      "-"
      +
      usDate[2].padStart(2, "0")
    );

  }


  // YYYY-MM-DD

  const isoDate =
    text.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    );

  if (isoDate) {

    return (
      isoDate[1]
      +
      "-"
      +
      isoDate[2].padStart(2, "0")
      +
      "-"
      +
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
// WEEKDAY NAME
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


  match =
    url.match(
      /\/d\/([^/]+)/
    );

  if (match) {
    return match[1];
  }

  return "";
}


// ==========================================================
// DRIVE IMAGE
// ==========================================================

function convertDriveImageURL(url) {

  if (!url) {
    return "";
  }

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


// ==========================================================
// DRIVE AUDIO
// ==========================================================

function convertDriveAudioURL(url) {

  if (!url) {
    return "";
  }

  const fileId =
    getDriveFileId(url);

  /*
     Local GitHub MP3 paths such as:

     music/default1.mp3

     are returned directly.
  */

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
        "Announcement Sheet unavailable"
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
      "Announcement Error:",
      error
    );

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


    if (!response.ok) {

      throw new Error(
        "Flyer Sheet unavailable"
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


    const remoteFlyers = [];


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


      const originalURL =
        (
          row[imageIndex] ||
          ""
        ).trim();


      if (!originalURL) {
        continue;
      }


      const imageURL =
        convertDriveImageURL(
          originalURL
        );


      const order =
        orderIndex >= 0
          ?
          (
            parseInt(
              row[orderIndex],
              10
            )
            ||
            999
          )
          :
          999;


      if (
        await testImage(
          imageURL
        )
      ) {

        remoteFlyers.push(
          {
            url: imageURL,
            order
          }
        );

      }

    }


    remoteFlyers.sort(
      (
        a,
        b
      ) =>
        a.order -
        b.order
    );


    flyers =
      remoteFlyers.length
        ?
        remoteFlyers.map(
          item => item.url
        )
        :
        templeContent.localFlyers;


    currentFlyerIndex = 0;

    showFlyer();

  }

  catch (error) {

    console.error(
      "Flyer Error:",
      error
    );


    flyers =
      templeContent.localFlyers;


    currentFlyerIndex = 0;

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

      const width =
        flyerElement.naturalWidth;

      const height =
        flyerElement.naturalHeight;


      if (
        width &&
        height
      ) {

        const ratio =
          width / height;


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
    )
    %
    flyers.length;


  showFlyer();

}


// ==========================================================
// WEEKLY SCHEDULE GOOGLE SHEET
//
// Expected Columns:
//
// Weekday
// WeekNumber
// Program
// Time
// EndTime
// Active
// StartDate
// EndDate
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


    if (!response.ok) {

      throw new Error(
        "WeeklySchedule Sheet unavailable"
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
        "WeeklySchedule Sheet contains no programs"
      );

    }


    const headers =
      rows[0].map(
        value =>
          value
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
      weekdayIndex === -1 ||
      programIndex === -1 ||
      timeIndex === -1
    ) {

      throw new Error(
        "WeeklySchedule requires Weekday, Program and Time columns."
      );

    }


    const loadedRows = [];


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
        )
        .trim();


      const time =
        (
          row[timeIndex] ||
          ""
        )
        .trim();


      const endTime =
        endTimeIndex >= 0
          ?
          (
            row[endTimeIndex] ||
            ""
          )
          .trim()
          :
          "";


      if (
        !weekday ||
        !program
      ) {
        continue;
      }


      loadedRows.push(
        {

          weekday,

          weekNumber:
            weekNumberIndex >= 0
              ?
              (
                row[weekNumberIndex] ||
                "ALL"
              )
              .trim()
              .toUpperCase()
              :
              "ALL",

          program,

          time,

          endTime,

          startDate:
            startDateIndex >= 0
              ?
              normalizeDate(
                row[startDateIndex]
              )
              :
              "",

          endDate:
            endDateIndex >= 0
              ?
              normalizeDate(
                row[endDateIndex]
              )
              :
              "",

          rowOrder:
            i

        }
      );

    }


    weeklyScheduleRows =
      loadedRows;


    weeklyScheduleLoaded =
      true;


    console.log(
      "WeeklySchedule loaded:",
      weeklyScheduleRows.length
    );


    renderTodaySchedule();

  }

  catch (error) {

    console.error(
      "WeeklySchedule Error:",
      error
    );


    /*
      If there was already a successfully loaded
      WeeklySchedule, keep using it.
    */

    if (
      !weeklyScheduleRows.length
    ) {

      weeklyScheduleLoaded =
        false;

    }


    renderTodaySchedule();

  }

}


// ==========================================================
// WEEKLY ROW DATE RANGE
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
// WEEKLY ROW WEEKDAY MATCH
// ==========================================================

function weeklyRowMatchesDay(
  row,
  date
) {

  const todayName =
    getWeekdayName(date);


  if (
    row.weekday !==
    todayName
  ) {
    return false;
  }


  /*
     Sunday-Friday usually use ALL.
  */

  if (
    todayName !==
    "SATURDAY"
  ) {

    return (
      row.weekNumber === "ALL" ||
      row.weekNumber === ""
    );

  }


  /*
     SATURDAY:
     ALL = every Saturday
     1 = First Saturday
     2 = Second Saturday
     etc.
  */

  if (
    row.weekNumber === "ALL" ||
    row.weekNumber === ""
  ) {
    return true;
  }


  return (
    Number(row.weekNumber) ===
    getSaturdayNumber(date)
  );

}


// ==========================================================
// TEMPORARY / PERMANENT SCHEDULE LOGIC
// ==========================================================

function getSheetProgramsForDate(date) {

  if (
    !weeklyScheduleLoaded ||
    !weeklyScheduleRows.length
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


  if (
    !matching.length
  ) {
    return [];
  }


  /*
     Group rows by Program.

     Permanent Example:
     Saraswati Devi Abhishekam
     5:00 PM - 6:00 PM

     Temporary Example:
     Saraswati Devi Abhishekam
     6:30 PM - 8:00 PM
     StartDate / EndDate

     During temporary date range,
     temporary row wins.
  */

  const programGroups =
    new Map();


  matching.forEach(
    row => {

      const key =
        row.program
          .trim()
          .toLowerCase();


      if (
        !programGroups.has(key)
      ) {

        programGroups.set(
          key,
          []
        );

      }


      programGroups
        .get(key)
        .push(row);

    }
  );


  const selected =
    [];


  programGroups.forEach(
    rows => {

      const temporaryRows =
        rows.filter(
          row =>
            row.startDate ||
            row.endDate
        );


      if (
        temporaryRows.length
      ) {

        temporaryRows.sort(
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
          temporaryRows[0]
        );

        return;

      }


      rows.sort(
        (
          a,
          b
        ) =>
          a.rowOrder -
          b.rowOrder
      );


      selected.push(
        rows[0]
      );

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
// EMERGENCY HARDCODED FALLBACK
// ==========================================================

function getFallbackRegularPrograms(date) {

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


// ==========================================================
// GET REGULAR PROGRAMS
// ==========================================================

function getRegularPrograms(date) {

  const sheetPrograms =
    getSheetProgramsForDate(
      date
    );


  /*
     null = WeeklySchedule unavailable

     [] = WeeklySchedule loaded successfully,
          but there is no program today.
  */

  if (
    sheetPrograms !== null
  ) {

    return sheetPrograms;

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


    if (!response.ok) {

      throw new Error(
        "Special Events unavailable"
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
            ).trim(),

          /*
             SpecialEvents currently has no EndTime column,
             so it uses the 90-minute fallback.
          */

          endTime:
            ""

        }
      );

    }


    renderTodaySchedule();

  }

  catch (error) {

    console.error(
      "Special Event Error:",
      error
    );

  }

}


// ==========================================================
// TIME → MINUTES
//
// Supports:
//
// 6:30 PM
// 06:30 PM
// 18:30
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
      Number(
        match[1]
      );


    const minute =
      Number(
        match[2]
      );


    const period =
      match[3];


    if (
      period === "PM" &&
      hour !== 12
    ) {

      hour += 12;

    }


    if (
      period === "AM" &&
      hour === 12
    ) {

      hour = 0;

    }


    return (
      hour * 60 +
      minute
    );

  }


  match =
    text.match(
      /^(\d{1,2}):(\d{2})$/
    );


  if (match) {

    return (
      Number(match[1]) *
      60
      +
      Number(match[2])
    );

  }


  return null;

}


// ==========================================================
// PROGRAM STATUS
//
// If EndTime exists:
//   Time → EndTime = current
//   after EndTime = completed
//
// If EndTime blank:
//   fallback = 90 minutes
// ==========================================================

function getProgramTimeStatus(
  startTimeText,
  endTimeText
) {

  const startMinutes =
    parseTimeToMinutes(
      startTimeText
    );


  if (
    startMinutes === null
  ) {

    return {
      completed: false,
      current: false
    };

  }


  const now =
    new Date();


  const nowMinutes =
    now.getHours() *
    60
    +
    now.getMinutes();


  let endMinutes =
    parseTimeToMinutes(
      endTimeText
    );


  /*
     If EndTime is blank,
     use 90-minute fallback.
  */

  if (
    endMinutes === null
  ) {

    endMinutes =
      startMinutes +
      90;

  }


  /*
     Normal same-day program:

     6:30 PM → 8:00 PM
  */

  if (
    endMinutes >=
    startMinutes
  ) {

    return {

      current:
        nowMinutes >=
        startMinutes
        &&
        nowMinutes <
        endMinutes,

      completed:
        nowMinutes >=
        endMinutes

    };

  }


  /*
     Program crosses midnight:

     10:00 PM → 1:00 AM
  */

  return {

    current:
      nowMinutes >=
      startMinutes
      ||
      nowMinutes <
      endMinutes,

    completed:
      false

  };

}


// ==========================================================
// TODAY'S SCHEDULE
// ==========================================================

function renderTodaySchedule() {

  if (!scheduleList) {
    return;
  }


  const today =
    new Date();


  const todayKey =
    dateKey(today);


  const programs = [];


  // --------------------------------------------------------
  // WEEKLY SCHEDULE
  // --------------------------------------------------------

  getRegularPrograms(
    today
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
            "",

          note:
            ""

        }
      );

    }
  );


  // --------------------------------------------------------
  // SPECIAL EVENTS
  // --------------------------------------------------------

  specialEvents

    .filter(
      event =>
        event.date ===
        todayKey
    )

    .forEach(
      event => {

        const title =
          event.program
          ||
          event.event
          ||
          "Special Temple Program";


        const duplicate =
          programs.some(
            program =>
              program.title
                .toLowerCase()
              ===
              title
                .toLowerCase()
          );


        if (!duplicate) {

          programs.push(
            {

              title,

              time:
                event.time,

              endTime:
                event.endTime ||
                "",

              note:
                (
                  event.event &&
                  event.event !== title
                )
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
          ${escapeHTML(
            templeContent.noProgramMessage
          )}
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


          let itemClass =
            "schedule-item";


          if (
            status.completed
          ) {

            itemClass +=
              " is-completed";

          }

          else if (
            status.current
          ) {

            itemClass +=
              " is-current";

          }


          return `
            <article class="${itemClass}">

              <div class="schedule-time">
                ${escapeHTML(
                  program.time ||
                  "Program"
                )}
              </div>

              <div class="schedule-separator"></div>

              <div class="schedule-content">

                <div class="schedule-name">
                  ${escapeHTML(
                    program.title
                  )}
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

                ${
                  program.note
                    ?
                    `
                      <div class="schedule-note">
                        ${escapeHTML(
                          program.note
                        )}
                      </div>
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


    if (!response.ok) {

      throw new Error(
        "Upcoming Events unavailable"
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


    const events = [];


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


      const normalizedDate =
        normalizeDate(
          row[dateIndex]
        );


      if (!normalizedDate) {
        continue;
      }


      const eventDate =
        new Date(
          normalizedDate +
          "T00:00:00"
        );


      if (
        eventDate < today
      ) {
        continue;
      }


      const order =
        orderIndex >= 0
          ?
          (
            parseInt(
              row[orderIndex],
              10
            )
            ||
            999
          )
          :
          999;


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

          order

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

            const eventDate =
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
                `${eventDate} – ${event.title} (${event.time})`
                :
                `${eventDate} – ${event.title}`
            );

          }
        )
        .join(
          templeContent.separator
        );

  }

  catch (error) {

    console.error(
      "Upcoming Events Error:",
      error
    );


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
    weekday === "" ||
    weekday === "ALL"
  ) {

    return true;

  }


  const today =
    getWeekdayName(date);


  if (
    weekday === today
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


  const nowMinutes =
    date.getHours() *
    60
    +
    date.getMinutes();


  if (
    start <= end
  ) {

    return (
      nowMinutes >= start &&
      nowMinutes < end
    );

  }


  return (
    nowMinutes >= start ||
    nowMinutes < end
  );

}


// ==========================================================
// LOAD BGM
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


    if (!response.ok) {

      throw new Error(
        "BGM Sheet unavailable"
      );

    }


    const rows =
      parseCSV(
        await response.text()
      );


    if (
      rows.length < 2
    ) {
      return;
    }


    const headers =
      rows[0].map(
        value =>
          value
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


    const defaults = [];
    const specials = [];


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
          "YES"
        )
        .trim()
        .toUpperCase();


      if (
        active !== "YES"
      ) {
        continue;
      }


      const originalURL =
        (
          row[musicIndex] ||
          ""
        ).trim();


      if (!originalURL) {
        continue;
      }


      const type =
        (
          row[typeIndex] ||
          "DEFAULT"
        )
        .trim()
        .toUpperCase();


      const track =
        {

          url:
            convertDriveAudioURL(
              originalURL
            ),

          order:
            parseInt(
              row[orderIndex],
              10
            )
            ||
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

    console.error(
      "BGM Error:",
      error
    );

  }

}


// ==========================================================
// ACTIVE SPECIAL BGM
// ==========================================================

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
    )
    .sort(
      (
        a,
        b
      ) =>
        a.order -
        b.order
    );

}


// ==========================================================
// SPECIAL SIGNATURE
// ==========================================================

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
          track.endTime,
          track.order
        ].join("~")
    )
    .join("|");

}


// ==========================================================
// PLAY BGM TRACK
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


  if (!track) {
    return;
  }


  musicElement.pause();

  musicElement.src =
    track.url;

  musicElement.loop =
    false;

  musicElement.preload =
    "auto";

  musicElement.volume =
    templeContent.bgmVolume
    ??
    0.30;


  musicElement.load();


  const startPlayback =
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
              "BGM play error:",
              error
            )
        );

    };


  if (
    resumeSeconds > 0
  ) {

    musicElement.addEventListener(
      "loadedmetadata",
      startPlayback,
      {
        once: true
      }
    );

  }

  else {

    startPlayback();

  }

}


// ==========================================================
// DEFAULT BGM
// ==========================================================

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
    resume &&
    savedDefaultIndex <
    currentBGMPlaylist.length
  ) {

    currentBGMIndex =
      savedDefaultIndex;


    const restoreTime =
      savedDefaultTime;


    savedDefaultTime = 0;


    playCurrentBGMTrack(
      restoreTime
    );

  }

  else {

    currentBGMIndex = 0;

    playCurrentBGMTrack();

  }

}


// ==========================================================
// SPECIAL BGM
// ==========================================================

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
    "DEFAULT"
  ) {

    savedDefaultIndex =
      currentBGMIndex;


    if (
      musicElement &&
      Number.isFinite(
        musicElement.currentTime
      )
    ) {

      savedDefaultTime =
        musicElement.currentTime;

    }

  }


  currentBGMMode =
    "SPECIAL";


  currentBGMPlaylist =
    playlist;


  currentBGMIndex = 0;


  playCurrentBGMTrack();

}


// ==========================================================
// EVALUATE BGM
// ==========================================================

function evaluateBGMSchedule() {

  const activeSpecial =
    getActiveSpecialPlaylist();


  if (
    activeSpecial.length
  ) {

    const signature =
      makeSpecialSignature(
        activeSpecial
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
      activeSpecial
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

    startDefaultBGM(
      false
    );

  }

}


// ==========================================================
// NEXT BGM
// ==========================================================

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


// ==========================================================
// AUDIO EVENTS
// ==========================================================

if (musicElement) {

  musicElement.addEventListener(
    "ended",
    () => {

      const previousMode =
        currentBGMMode;


      const previousSignature =
        currentSpecialSignature;


      evaluateBGMSchedule();


      if (
        previousMode !==
        currentBGMMode
      ) {
        return;
      }


      if (
        previousSignature !==
        currentSpecialSignature
      ) {
        return;
      }


      playNextBGM();

    }
  );


  musicElement.addEventListener(
    "error",
    () => {

      bgmErrorCount++;


      console.error(
        "Audio Error:",
        musicElement.error
      );


      if (
        currentBGMPlaylist.length > 1
      ) {

        setTimeout(
          playNextBGM,
          1200
        );

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

  document.addEventListener(
    "touchstart",
    resumeAudio
  );

}


// ==========================================================
// INITIALIZATION
// ==========================================================

async function initializeTempleTV() {

  loadLocalAnnouncements();

  showUpcomingFallback();


  /*
     Load Weekly Schedule and Special Events first
     so Today's Schedule appears correctly.
  */

  await Promise.allSettled(
    [
      loadWeeklySchedule(),
      loadSpecialEvents()
    ]
  );


  renderTodaySchedule();


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
// FLYER TIMER
// ==========================================================

setInterval(
  rotateFlyer,

  templeContent.flyerDuration *
  1000
);


// ==========================================================
// BGM SCHEDULE CHECK
// ==========================================================

setInterval(
  evaluateBGMSchedule,

  templeContent
    .bgmScheduleCheckSeconds
  *
  1000
);


// ==========================================================
// REMOTE REFRESH
// ==========================================================

const remoteRefreshMilliseconds =

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

    loadSpecialEvents();

    loadUpcomingEvents();

    loadWeeklySchedule();

    loadBGMPlaylist();

  },

  remoteRefreshMilliseconds
);


// ==========================================================
// TODAY SCHEDULE REFRESH
// ==========================================================

setInterval(
  renderTodaySchedule,

  60 *
  1000
);
