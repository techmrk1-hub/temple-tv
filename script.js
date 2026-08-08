// ============================================================
// TEMPLE TV DIGITAL SIGNAGE SYSTEM
// Chinmaya Saraswati Ashram - Devi Temple
// ============================================================


// ============================================================
// GLOBAL VARIABLES
// ============================================================

let flyers = [];
let currentFlyerIndex = 0;

let specialEvents = [];


// ============================================================
// ELEMENT REFERENCES
// ============================================================

const flyerElement =
  document.getElementById("flyer");

const tickerText =
  document.getElementById("ticker-text");

const upcomingEventsText =
  document.getElementById("upcoming-events-text");

const todayDay =
  document.getElementById("today-day");

const todayProgram =
  document.getElementById("today-program");

const todayTime =
  document.getElementById("today-time");

const todayMessage =
  document.getElementById("today-message");

const clockElement =
  document.getElementById("clock");

const headerDateElement =
  document.getElementById("header-date");



// ============================================================
// CACHE BUSTER
// ============================================================

function addCacheBuster(url) {

  const separator =
    url.includes("?") ? "&" : "?";

  return `${url}${separator}_=${Date.now()}`;

}



// ============================================================
// CSV PARSER
// ============================================================

function parseCSV(csvText) {

  const rows = [];

  let row = [];
  let value = "";
  let insideQuotes = false;

  for (
    let i = 0;
    i < csvText.length;
    i++
  ) {

    const character =
      csvText[i];

    const nextCharacter =
      csvText[i + 1];


    if (character === '"') {

      if (
        insideQuotes &&
        nextCharacter === '"'
      ) {

        value += '"';

        i++;

      } else {

        insideQuotes =
          !insideQuotes;

      }

    }

    else if (
      character === "," &&
      !insideQuotes
    ) {

      row.push(value.trim());

      value = "";

    }

    else if (
      (character === "\n" ||
       character === "\r") &&
      !insideQuotes
    ) {

      if (
        character === "\r" &&
        nextCharacter === "\n"
      ) {

        i++;

      }

      row.push(value.trim());

      value = "";


      if (
        row.some(
          cell =>
            cell.trim() !== ""
        )
      ) {

        rows.push(row);

      }

      row = [];

    }

    else {

      value += character;

    }

  }


  if (
    value.length > 0 ||
    row.length > 0
  ) {

    row.push(value.trim());

    if (
      row.some(
        cell =>
          cell.trim() !== ""
      )
    ) {

      rows.push(row);

    }

  }


  return rows;

}



// ============================================================
// CLOCK AND DATE
// ============================================================

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
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric"
        }
      );

  }

}


updateClock();

setInterval(
  updateClock,
  1000
);



// ============================================================
// ANNOUNCEMENTS
// ============================================================

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
        "Announcement sheet could not be loaded"
      );

    }


    const csv =
      await response.text();


    const rows =
      parseCSV(csv);


    const announcements = [];


    rows.forEach(
      (row, index) => {

        if (
          index === 0 &&
          row.some(
            cell =>
              cell.toLowerCase()
                .includes("announcement")
          )
        ) {

          return;

        }


        row.forEach(
          cell => {

            const text =
              cell.trim();

            if (text) {

              announcements.push(
                text
              );

            }

          }
        );

      }
    );


    if (
      announcements.length > 0
    ) {

      tickerText.textContent =
        announcements.join(
          templeContent.separator
        );

    }

    else {

      loadLocalAnnouncements();

    }

  }

  catch (error) {

    console.error(
      "Announcement load error:",
      error
    );


    loadLocalAnnouncements();

  }

}



function loadLocalAnnouncements() {

  tickerText.textContent =
    templeContent.announcements.join(
      templeContent.separator
    );

}



// ============================================================
// GOOGLE DRIVE IMAGE CONVERSION
// ============================================================

function convertDriveURL(url) {

  if (!url) {

    return "";

  }


  let fileId = "";


  const fileMatch =
    url.match(
      /\/file\/d\/([^/]+)/
    );


  if (fileMatch) {

    fileId =
      fileMatch[1];

  }


  const idMatch =
    url.match(
      /[?&]id=([^&]+)/
    );


  if (!fileId && idMatch) {

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



// ============================================================
// IMAGE TEST
// ============================================================

function testImage(url) {

  return new Promise(
    resolve => {

      const image =
        new Image();


      image.onload =
        () =>
          resolve(true);


      image.onerror =
        () =>
          resolve(false);


      image.src =
        addCacheBuster(url);

    }
  );

}



// ============================================================
// LOAD REMOTE FLYERS
// ============================================================

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
        "Flyer sheet could not be loaded"
      );

    }


    const csv =
      await response.text();


    const rows =
      parseCSV(csv);


    if (rows.length < 2) {

      throw new Error(
        "Flyer sheet has no data"
      );

    }


    const headers =
      rows[0].map(
        item =>
          item.trim()
            .toLowerCase()
      );


    const imageURLIndex =
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


    const remoteFlyers =
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


      const originalURL =
        (
          row[imageURLIndex] ||
          ""
        ).trim();


      if (!originalURL) {

        continue;

      }


      const convertedURL =
        convertDriveURL(
          originalURL
        );


      const displayOrder =
        parseInt(
          row[orderIndex],
          10
        ) || 999;


      const works =
        await testImage(
          convertedURL
        );


      if (works) {

        remoteFlyers.push(
          {
            url:
              convertedURL,

            order:
              displayOrder
          }
        );

      }

    }


    remoteFlyers.sort(
      (a, b) =>
        a.order - b.order
    );


    if (
      remoteFlyers.length > 0
    ) {

      flyers =
        remoteFlyers.map(
          item =>
            item.url
        );

    }

    else {

      flyers =
        templeContent.localFlyers;

    }


    currentFlyerIndex = 0;

    showFlyer();

  }

  catch (error) {

    console.error(
      "Flyer loading error:",
      error
    );


    flyers =
      templeContent.localFlyers;


    currentFlyerIndex = 0;

    showFlyer();

  }

}



// ============================================================
// FLYER DISPLAY / ORIENTATION
// ============================================================

function showFlyer() {

  if (
    !flyerElement ||
    flyers.length === 0
  ) {

    return;

  }


  const flyerURL =
    flyers[
      currentFlyerIndex
    ];


  flyerElement.classList.remove(
    "flyer-landscape",
    "flyer-portrait",
    "flyer-square",
    "flyer-visible"
  );


  flyerElement.onload =
    function () {

      const width =
        flyerElement.naturalWidth;

      const height =
        flyerElement.naturalHeight;


      if (
        width > 0 &&
        height > 0
      ) {

        const ratio =
          width / height;


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


      requestAnimationFrame(
        () => {

          flyerElement.classList.add(
            "flyer-visible"
          );

        }
      );

    };


  flyerElement.src =
    addCacheBuster(
      flyerURL
    );

}



// ============================================================
// FLYER ROTATION
// ============================================================

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



// ============================================================
// SPECIAL EVENTS
// ============================================================

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
        "Special Events sheet could not be loaded"
      );

    }


    const csv =
      await response.text();


    const rows =
      parseCSV(csv);


    if (
      rows.length < 2
    ) {

      specialEvents = [];

      updateTodayCard();

      return;

    }


    const headers =
      rows[0].map(
        item =>
          item.trim()
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
        active &&
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
          date:

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


    updateTodayCard();

  }

  catch (error) {

    console.error(
      "Special Events error:",
      error
    );


    specialEvents = [];

    updateTodayCard();

  }

}



// ============================================================
// DATE NORMALIZATION
// ============================================================

function normalizeDate(value) {

  if (!value) {

    return "";

  }


  const clean =
    value.trim();


  // MM/DD/YYYY
  const usDate =
    clean.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );


  if (usDate) {

    const month =
      usDate[1]
        .padStart(
          2,
          "0"
        );

    const day =
      usDate[2]
        .padStart(
          2,
          "0"
        );

    const year =
      usDate[3];


    return (
      `${year}-${month}-${day}`
    );

  }


  // YYYY-MM-DD
  const isoDate =
    clean.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    );


  if (isoDate) {

    const year =
      isoDate[1];

    const month =
      isoDate[2]
        .padStart(
          2,
          "0"
        );

    const day =
      isoDate[3]
        .padStart(
          2,
          "0"
        );


    return (
      `${year}-${month}-${day}`
    );

  }


  const parsed =
    new Date(clean);


  if (
    !isNaN(
      parsed.getTime()
    )
  ) {

    return dateKey(
      parsed
    );

  }


  return "";

}



// ============================================================
// DATE KEY
// ============================================================

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



// ============================================================
// SATURDAY NUMBER IN MONTH
// ============================================================

function getSaturdayNumber(date) {

  return Math.ceil(
    date.getDate() / 7
  );

}



// ============================================================
// REGULAR PROGRAM
// ============================================================

function getRegularProgram(date) {

  const weekday =
    date.getDay();


  if (
    weekday === 6
  ) {

    const saturdayNumber =
      getSaturdayNumber(
        date
      );


    if (
      templeContent.saturdaySchedule[
        saturdayNumber
      ]
    ) {

      return (
        templeContent.saturdaySchedule[
          saturdayNumber
        ]
      );

    }

  }


  if (
    templeContent.weeklySchedule[
      weekday
    ]
  ) {

    return (
      templeContent.weeklySchedule[
        weekday
      ]
    );

  }


  return null;

}



// ============================================================
// TODAY CARD
// ============================================================

function updateTodayCard() {

  const today =
    new Date();


  const key =
    dateKey(
      today
    );


  const dayName =
    today.toLocaleDateString(
      "en-US",
      {
        weekday: "long"
      }
    );


  todayDay.textContent =
    dayName;


  const special =
    specialEvents.find(
      item =>
        item.date === key
    );


  const regular =
    getRegularProgram(
      today
    );


  if (special) {

    todayProgram.textContent =
      special.program ||
      special.event ||
      "Special Temple Program";


    todayTime.textContent =
      special.time || "";


    if (
      regular &&
      special.program !==
        regular.title
    ) {

      todayMessage.textContent =
        `Regular: ${regular.title} - ${regular.time}`;

    }

    else {

      todayMessage.textContent =
        special.event || "";

    }


    return;

  }


  if (regular) {

    todayProgram.textContent =
      regular.title;


    todayTime.textContent =
      regular.time;


    todayMessage.textContent =
      "";

  }

  else {

    todayProgram.textContent =
      "Temple Open";


    todayTime.textContent =
      "";


    todayMessage.textContent =
      templeContent.noProgramMessage;

  }

}



// ============================================================
// UPCOMING EVENTS
// ============================================================

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
        "Upcoming Events sheet could not be loaded"
      );

    }


    const csv =
      await response.text();


    const rows =
      parseCSV(csv);


    if (
      rows.length < 2
    ) {

      showUpcomingEventsFallback();

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


      const eventName =
        (
          row[eventIndex] ||
          ""
        ).trim();


      if (!eventName) {

        continue;

      }


      const rawDate =
        (
          row[dateIndex] ||
          ""
        ).trim();


      const normalized =
        normalizeDate(
          rawDate
        );


      if (!normalized) {

        continue;

      }


      const eventDate =
        new Date(
          `${normalized}T00:00:00`
        );


      if (
        eventDate <
        today
      ) {

        continue;

      }


      const time =
        (
          row[timeIndex] ||
          ""
        ).trim();


      const order =
        orderIndex >= 0
          ?
          parseInt(
            row[orderIndex],
            10
          ) || 999
          :
          999;


      events.push(
        {
          date:
            eventDate,

          event:
            eventName,

          time:
            time,

          order:
            order
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
      events.length === 0
    ) {

      showUpcomingEventsFallback();

      return;

    }


    const formattedEvents =
      events.map(
        item => {

          const dateText =
            item.date
              .toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric"
                }
              );


          if (item.time) {

            return (
              `${dateText} - ${item.event} - ${item.time}`
            );

          }


          return (
            `${dateText} - ${item.event}`
          );

        }
      );


    upcomingEventsText.textContent =
      formattedEvents.join(
        templeContent.separator
      );

  }

  catch (error) {

    console.error(
      "Upcoming Events error:",
      error
    );


    showUpcomingEventsFallback();

  }

}



function showUpcomingEventsFallback() {

  upcomingEventsText.textContent =
    templeContent
      .upcomingEventsFallback
      .join(
        templeContent.separator
      );

}



// ============================================================
// MUSIC
// ============================================================

function startBackgroundMusic() {

  const music =
    document.getElementById(
      "background-music"
    );


  if (!music) {

    return;

  }


  music.volume =
    0.25;


  const playPromise =
    music.play();


  if (
    playPromise !== undefined
  ) {

    playPromise.catch(
      error => {

        console.log(
          "Background music autoplay prevented:",
          error
        );

      }
    );

  }

}



// ============================================================
// INITIAL LOAD
// ============================================================

async function initializeTempleTV() {

  loadLocalAnnouncements();

  updateTodayCard();

  showUpcomingEventsFallback();


  await Promise.allSettled(
    [
      loadAnnouncements(),

      loadRemoteFlyers(),

      loadSpecialEvents(),

      loadUpcomingEvents()
    ]
  );


  startBackgroundMusic();

}



// ============================================================
// START
// ============================================================

initializeTempleTV();



// ============================================================
// FLYER TIMER
// ============================================================

setInterval(
  rotateFlyer,
  templeContent.flyerDuration *
  1000
);



// ============================================================
// REMOTE DATA REFRESH
// ============================================================

const refreshMilliseconds =
  templeContent.remoteRefreshMinutes *
  60 *
  1000;


setInterval(
  () => {

    loadAnnouncements();

    loadRemoteFlyers();

    loadSpecialEvents();

    loadUpcomingEvents();

  },

  refreshMilliseconds
);



// ============================================================
// MIDNIGHT / TODAY CARD REFRESH
// ============================================================

setInterval(
  updateTodayCard,
  60 * 1000
);
