/* ==========================================================
   CHINMAYA SARASWATI ASHRAM - DEVI TEMPLE
   TEMPLE TV DIGITAL SIGNAGE

   FEATURES:

   - Google Drive Flyers
   - Flyer Rotation
   - Google Sheet Announcements
   - Google Sheet Special Events
   - Google Sheet Upcoming Events
   - Google Sheet Independent BGM Playlist
   - Today's Schedule
   - Automatic Clock
   - Automatic Remote Refresh
========================================================== */



// ==========================================================
// GLOBAL STATE
// ==========================================================

let flyers = [];

let currentFlyerIndex = 0;


let specialEvents = [];


// BGM playlist

let bgmPlaylist = [];

let currentBGMIndex = 0;

let currentBGMURL = "";



// ==========================================================
// HTML ELEMENTS
// ==========================================================

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



// ==========================================================
// CACHE BUSTER
// ==========================================================

function addCacheBuster(url) {

  if (!url) {

    return "";

  }


  const separator =
    url.includes("?")
      ?
      "&"
      :
      "?";


  return (
    `${url}${separator}_=${Date.now()}`
  );

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


      field =
        "";

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


      field =
        "";


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


      row =
        [];

    }


    else {

      field +=
        char;

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

          hour:
            "numeric",

          minute:
            "2-digit",

          hour12:
            true

        }
      );

  }


  if (headerDateElement) {

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



  // MM/DD/YYYY

  const usDate =
    text.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );


  if (usDate) {

    return (

      usDate[3] +

      "-" +

      usDate[1]
        .padStart(
          2,
          "0"
        ) +

      "-" +

      usDate[2]
        .padStart(
          2,
          "0"
        )

    );

  }



  // YYYY-MM-DD

  const isoDate =
    text.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    );


  if (isoDate) {

    return (

      isoDate[1] +

      "-" +

      isoDate[2]
        .padStart(
          2,
          "0"
        ) +

      "-" +

      isoDate[3]
        .padStart(
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
    !isNaN(
      parsed.getTime()
    )
  ) {

    return (
      dateKey(
        parsed
      )
    );

  }


  return "";

}



// ==========================================================
// GOOGLE DRIVE FILE ID
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

    return (
      match[1]
    );

  }



  match =
    url.match(
      /[?&]id=([^&]+)/
    );


  if (match) {

    return (
      match[1]
    );

  }



  match =
    url.match(
      /\/d\/([^/]+)/
    );


  if (match) {

    return (
      match[1]
    );

  }


  return "";

}



// ==========================================================
// GOOGLE DRIVE FLYER IMAGE CONVERSION
// ==========================================================

function convertDriveImageURL(url) {

  if (!url) {

    return "";

  }


  const fileId =
    getDriveFileId(
      url
    );


  if (!fileId) {

    return (
      url
    );

  }


  return (

    "https://drive.google.com/thumbnail" +

    `?id=${fileId}&sz=w3000`

  );

}



// ==========================================================
// GOOGLE DRIVE AUDIO CONVERSION
// ==========================================================

function convertDriveAudioURL(url) {

  if (!url) {

    return "";

  }


  const fileId =
    getDriveFileId(
      url
    );


  if (!fileId) {

    return (
      url
    );

  }


  return (

    "https://drive.google.com/uc" +

    `?export=download&id=${fileId}`

  );

}



// ==========================================================
// IMAGE TEST
// ==========================================================

function testImage(url) {

  return (
    new Promise(
      resolve => {

        const image =
          new Image();


        image.onload =
          () =>
            resolve(
              true
            );


        image.onerror =
          () =>
            resolve(
              false
            );


        image.src =
          addCacheBuster(
            url
          );

      }
    )
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
          cache:
            "no-store"
        }
      );


    if (!response.ok) {

      throw new Error(
        "Announcement data unavailable"
      );

    }


    const rows =
      parseCSV(
        await response.text()
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


            messages.push(
              value
            );

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
      "Announcement error:",
      error
    );


    loadLocalAnnouncements();

  }

}



// ==========================================================
// LOAD REMOTE FLYERS
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
          cache:
            "no-store"
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
      rows.length <
      2
    ) {

      throw new Error(
        "No remote flyers"
      );

    }



    const headers =
      rows[0]
        .map(
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
          row[
            activeIndex
          ] ||
          ""
        )
        .trim()
        .toUpperCase();


      if (
        active !==
        "YES"
      ) {

        continue;

      }


      const originalURL =
        (
          row[
            imageIndex
          ] ||
          ""
        )
        .trim();


      if (
        !originalURL
      ) {

        continue;

      }


      const imageURL =
        convertDriveImageURL(
          originalURL
        );


      const displayOrder =
        parseInt(
          row[
            orderIndex
          ],
          10
        )
        ||
        999;



      const works =
        await testImage(
          imageURL
        );


      if (
        works
      ) {

        remoteFlyers.push(
          {

            url:
              imageURL,

            order:
              displayOrder

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



    if (
      remoteFlyers.length
    ) {

      flyers =
        remoteFlyers
          .map(
            item =>
              item.url
          );

    }


    else {

      flyers =
        templeContent
          .localFlyers;

    }



    currentFlyerIndex =
      0;


    showFlyer();

  }


  catch (error) {

    console.error(
      "Flyer error:",
      error
    );


    flyers =
      templeContent
        .localFlyers;


    currentFlyerIndex =
      0;


    showFlyer();

  }

}



// ==========================================================
// SHOW FLYER
// ==========================================================

function showFlyer() {

  if (
    !flyerElement ||
    !flyers.length
  ) {

    return;

  }


  flyerElement
    .classList
    .remove(
      "flyer-landscape",
      "flyer-portrait",
      "flyer-square",
      "flyer-visible"
    );



  flyerElement.onload =
    () => {


      const width =
        flyerElement
          .naturalWidth;


      const height =
        flyerElement
          .naturalHeight;



      if (
        width &&
        height
      ) {


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



      requestAnimationFrame(
        () => {

          flyerElement
            .classList
            .add(
              "flyer-visible"
            );

        }
      );

    };



  flyerElement.src =
    addCacheBuster(
      flyers[
        currentFlyerIndex
      ]
    );

}



// ==========================================================
// ROTATE FLYER
// ==========================================================

function rotateFlyer() {

  if (
    flyers.length <=
    1
  ) {

    return;

  }


  currentFlyerIndex =
    (
      currentFlyerIndex +
      1
    )
    %
    flyers.length;


  showFlyer();

}



// ==========================================================
// BGM PLAYLIST
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
          cache:
            "no-store"
        }
      );


    if (
      !response.ok
    ) {

      throw new Error(
        "BGM Sheet unavailable"
      );

    }



    const rows =
      parseCSV(
        await response.text()
      );


    if (
      rows.length <
      2
    ) {

      console.log(
        "No BGM tracks found."
      );

      return;

    }



    const headers =
      rows[0]
        .map(
          value =>
            value
              .trim()
              .toLowerCase()
        );


    const musicIndex =
      headers.indexOf(
        "musicurl"
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
      musicIndex === -1
    ) {

      console.error(
        "BGM Sheet requires MusicURL column."
      );

      return;

    }



    const playlist =
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



      const originalMusicURL =
        (
          row[
            musicIndex
          ] ||
          ""
        )
        .trim();


      if (
        !originalMusicURL
      ) {

        continue;

      }



      const musicURL =
        convertDriveAudioURL(
          originalMusicURL
        );



      const order =
        orderIndex >= 0
          ?
          (
            parseInt(
              row[
                orderIndex
              ],
              10
            )
            ||
            999
          )
          :
          999;



      playlist.push(
        {

          url:
            musicURL,

          order:
            order

        }
      );

    }



    playlist.sort(
      (
        a,
        b
      ) =>
        a.order -
        b.order
    );



    const newPlaylist =
      playlist
        .map(
          item =>
            item.url
        );



    if (
      !newPlaylist.length
    ) {

      console.log(
        "No active BGM tracks."
      );


      return;

    }



    const oldPlaylistSignature =
      bgmPlaylist.join(
        "|"
      );


    const newPlaylistSignature =
      newPlaylist.join(
        "|"
      );



    bgmPlaylist =
      newPlaylist;



    /*
       IMPORTANT:

       If the playlist changed,
       start from the first track.

       If it did not change,
       do NOT restart currently playing music.
    */

    if (
      oldPlaylistSignature !==
      newPlaylistSignature
    ) {

      currentBGMIndex =
        0;


      startCurrentBGM();

    }


    else if (
      musicElement &&
      musicElement.paused &&
      !currentBGMURL
    ) {

      startCurrentBGM();

    }

  }


  catch (error) {

    console.error(
      "BGM loading error:",
      error
    );

  }

}



// ==========================================================
// START CURRENT BGM TRACK
// ==========================================================

function startCurrentBGM() {

  if (
    !musicElement ||
    !bgmPlaylist.length
  ) {

    return;

  }



  const musicURL =
    bgmPlaylist[
      currentBGMIndex
    ];



  currentBGMURL =
    musicURL;



  musicElement.pause();


  musicElement.src =
    musicURL;


  musicElement.loop =
    false;


  musicElement.volume =
    0.25;


  musicElement.load();



  const playPromise =
    musicElement.play();



  if (
    playPromise
  ) {

    playPromise.catch(
      error => {

        console.log(
          "BGM autoplay blocked or audio unavailable:",
          error
        );

      }
    );

  }

}



// ==========================================================
// PLAY NEXT BGM
// ==========================================================

function playNextBGM() {

  if (
    !bgmPlaylist.length
  ) {

    return;

  }


  currentBGMIndex =
    (
      currentBGMIndex +
      1
    )
    %
    bgmPlaylist.length;


  startCurrentBGM();

}



// ==========================================================
// BGM ENDED EVENT
// ==========================================================

if (
  musicElement
) {

  musicElement.addEventListener(
    "ended",
    playNextBGM
  );


  musicElement.addEventListener(
    "error",
    () => {

      console.error(
        "Current BGM failed. Moving to next track."
      );


      setTimeout(
        playNextBGM,
        2000
      );

    }
  );

}



// ==========================================================
// SATURDAY NUMBER
// ==========================================================

function getSaturdayNumber(date) {

  return (
    Math.ceil(
      date.getDate() /
      7
    )
  );

}



// ==========================================================
// REGULAR PROGRAMS
// ==========================================================

function getRegularPrograms(date) {

  const day =
    date.getDay();



  if (
    day === 6
  ) {


    const saturdayNumber =
      getSaturdayNumber(
        date
      );


    return (

      templeContent
        .saturdaySchedule[
          saturdayNumber
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
          cache:
            "no-store"
        }
      );


    if (
      !response.ok
    ) {

      throw new Error(
        "Special Events unavailable"
      );

    }



    const rows =
      parseCSV(
        await response.text()
      );



    if (
      rows.length <
      2
    ) {

      specialEvents =
        [];


      renderTodaySchedule();


      return;

    }



    const headers =
      rows[0]
        .map(
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
          (
            row[
              activeIndex
            ]
            ||
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



      const date =
        normalizeDate(
          row[
            dateIndex
          ]
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
              row[
                eventIndex
              ]
              ||
              ""
            )
            .trim(),


          program:
            (
              row[
                programIndex
              ]
              ||
              ""
            )
            .trim(),


          time:
            (
              row[
                timeIndex
              ]
              ||
              ""
            )
            .trim()

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


    specialEvents =
      [];


    renderTodaySchedule();

  }

}



// ==========================================================
// TODAY'S SCHEDULE
// ==========================================================

function renderTodaySchedule() {

  if (
    !scheduleList
  ) {

    return;

  }


  const today =
    new Date();


  const todayKey =
    dateKey(
      today
    );


  const programs =
    [];



  // -----------------------------------------
  // REGULAR PROGRAMS
  // -----------------------------------------

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

          note:
            ""

        }
      );

    }
  );



  // -----------------------------------------
  // SPECIAL EVENTS
  // -----------------------------------------

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
              program
                .title
                .toLowerCase()
              ===
              title
                .toLowerCase()
          );



        if (
          !duplicate
        ) {

          programs.push(
            {

              title:
                title,


              time:
                event.time,


              note:
                (
                  event.event &&
                  event.event !==
                  title
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
    programs.length ===
    0
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

                ${escapeHTML(
                  program.time ||
                  "Temple Program"
                )}

              </div>


              <div class="schedule-name">

                ${escapeHTML(
                  program.title
                )}

              </div>


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


            </article>

          `
      )
      .join("");

}



// ==========================================================
// HTML ESCAPE
// ==========================================================

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



// ==========================================================
// UPCOMING EVENTS FALLBACK
// ==========================================================

function showUpcomingFallback() {

  if (
    !upcomingEventsText
  ) {

    return;

  }


  upcomingEventsText.textContent =
    templeContent
      .upcomingEventsFallback
      .join(
        templeContent.separator
      );

}



// ==========================================================
// LOAD UPCOMING EVENTS
// ==========================================================

async function loadUpcomingEvents() {

  try {

    const response =
      await fetch(
        addCacheBuster(
          templeContent
            .upcomingEventsSheetURL
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
        "Upcoming Events unavailable"
      );

    }



    const rows =
      parseCSV(
        await response.text()
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
            row[
              activeIndex
            ]
            ||
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



      const title =
        (
          row[
            eventIndex
          ]
          ||
          ""
        )
        .trim();



      if (
        !title
      ) {

        continue;

      }



      const normalizedDate =
        normalizeDate(
          row[
            dateIndex
          ]
        );



      if (
        !normalizedDate
      ) {

        continue;

      }



      const eventDate =
        new Date(
          normalizedDate +
          "T00:00:00"
        );



      if (
        eventDate <
        today
      ) {

        continue;

      }



      const order =
        orderIndex >= 0
          ?
          (
            parseInt(
              row[
                orderIndex
              ],
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


          title:
            title,


          time:
            (
              row[
                timeIndex
              ]
              ||
              ""
            )
            .trim(),


          order:
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



            if (
              event.time
            ) {

              return (
                `${eventDate} – ${event.title} (${event.time})`
              );

            }


            return (
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
// INITIALIZATION
// ==========================================================

async function initializeTempleTV() {


  // Immediate fallbacks

  loadLocalAnnouncements();


  showUpcomingFallback();


  renderTodaySchedule();



  // Load everything remotely

  await Promise.allSettled(
    [

      loadAnnouncements(),

      loadRemoteFlyers(),

      loadSpecialEvents(),

      loadUpcomingEvents(),

      loadBGMPlaylist()

    ]
  );

}



initializeTempleTV();



// ==========================================================
// FLYER ROTATION TIMER
// ==========================================================

setInterval(
  rotateFlyer,

  templeContent
    .flyerDuration
  *
  1000
);



// ==========================================================
// REMOTE REFRESH TIMER
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


    /*
       This refreshes the BGM playlist.

       IMPORTANT:
       Music will NOT restart unless
       playlist data actually changed.
    */

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
