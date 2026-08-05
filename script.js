// =====================================================
// CHINMAYA SARASWATI ASHRAM - TEMPLE TV
//
// Remote Announcements
// Remote Flyers
// Special Events
// Regular Schedule
// Clock + Music
// =====================================================



// =====================================================
// CLOCK AND DATE
// =====================================================

function updateClock() {

    const now = new Date();

    const clockElement =
        document.getElementById("clock");

    const dateElement =
        document.getElementById("date");


    if (clockElement) {

        clockElement.textContent =
            now.toLocaleTimeString(
                "en-US",
                {
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit"
                }
            );

    }


    if (dateElement) {

        dateElement.textContent =
            now.toLocaleDateString(
                "en-US",
                {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                }
            );

    }

}


updateClock();

setInterval(
    updateClock,
    1000
);



// =====================================================
// CSV PARSER
// =====================================================

function parseCSV(text) {

    const rows = [];

    let row = [];
    let cell = "";
    let insideQuotes = false;


    for (let i = 0; i < text.length; i++) {

        const char = text[i];

        const nextChar =
            text[i + 1];


        if (
            char === '"' &&
            insideQuotes &&
            nextChar === '"'
        ) {

            cell += '"';

            i++;

        }

        else if (char === '"') {

            insideQuotes =
                !insideQuotes;

        }

        else if (
            char === "," &&
            !insideQuotes
        ) {

            row.push(
                cell.trim()
            );

            cell = "";

        }

        else if (
            (
                char === "\n" ||
                char === "\r"
            )
            &&
            !insideQuotes
        ) {

            if (
                cell !== "" ||
                row.length > 0
            ) {

                row.push(
                    cell.trim()
                );

                rows.push(row);

                row = [];

                cell = "";

            }

        }

        else {

            cell += char;

        }

    }


    if (
        cell !== "" ||
        row.length > 0
    ) {

        row.push(
            cell.trim()
        );

        rows.push(row);

    }


    return rows;

}



// =====================================================
// CACHE-BUSTER HELPER
// =====================================================

function addCacheBuster(url) {

    const separator =
        url.includes("?")
            ? "&"
            : "?";


    return (
        url
        +
        separator
        +
        "t="
        +
        Date.now()
    );

}



// =====================================================
// ANNOUNCEMENTS
// =====================================================

const tickerText =
    document.getElementById(
        "ticker-text"
    );


function displayAnnouncements(messages) {

    if (!tickerText) {
        return;
    }


    tickerText.textContent =
        messages.join(
            templeContent.separator
        );

}



async function loadRemoteAnnouncements() {

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
                "Announcement sheet failed"
            );

        }


        const text =
            await response.text();


        const rows =
            parseCSV(text);


        const messages = [];


        for (
            let i = 1;
            i < rows.length;
            i++
        ) {

            if (
                rows[i][0] &&
                rows[i][0].trim() !== ""
            ) {

                messages.push(
                    rows[i][0].trim()
                );

            }

        }


        if (
            messages.length === 0
        ) {

            throw new Error(
                "No remote announcements"
            );

        }


        displayAnnouncements(
            messages
        );

    }

    catch (error) {

        console.log(
            "Using local announcements:",
            error
        );


        displayAnnouncements(
            templeContent.announcements
        );

    }

}



// =====================================================
// GOOGLE DRIVE IMAGE CONVERTER
// =====================================================

function convertDriveURL(url) {

    if (!url) {
        return "";
    }


    let fileID = null;


    let match =
        url.match(
            /\/file\/d\/([^/]+)/
        );


    if (
        match &&
        match[1]
    ) {

        fileID =
            match[1];

    }


    if (!fileID) {

        match =
            url.match(
                /[?&]id=([^&]+)/
            );


        if (
            match &&
            match[1]
        ) {

            fileID =
                match[1];

        }

    }


    if (fileID) {

        return (
            "https://drive.google.com/thumbnail?id="
            +
            fileID
            +
            "&sz=w3000"
        );

    }


    return url;

}



// =====================================================
// TEST IMAGE
// =====================================================

function testImage(url) {

    return new Promise(

        function (resolve) {

            const image =
                new Image();


            image.onload =
                function () {

                    resolve(true);

                };


            image.onerror =
                function () {

                    resolve(false);

                };


            image.src =
                url;

        }

    );

}



// =====================================================
// REMOTE FLYERS
// =====================================================

const flyerElement =
    document.getElementById(
        "flyer"
    );


let activeFlyers = [];

let currentFlyer = 0;



function showFlyer() {

    if (
        !flyerElement ||
        activeFlyers.length === 0
    ) {

        return;

    }


    if (
        currentFlyer >=
        activeFlyers.length
    ) {

        currentFlyer = 0;

    }


    flyerElement.style.opacity =
        "0";


    setTimeout(

        function () {

            flyerElement.src =
                activeFlyers[
                    currentFlyer
                ];


            flyerElement.onload =
                function () {

                    flyerElement.style.opacity =
                        "1";

                };


            flyerElement.onerror =
                function () {

                    console.log(
                        "Flyer failed:",
                        flyerElement.src
                    );


                    flyerElement.style.opacity =
                        "1";

                };

        },

        500

    );

}



function nextFlyer() {

    if (
        activeFlyers.length <= 1
    ) {

        return;

    }


    currentFlyer =
        (
            currentFlyer + 1
        )
        %
        activeFlyers.length;


    showFlyer();

}



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
                "Flyer sheet failed"
            );

        }


        const text =
            await response.text();


        const rows =
            parseCSV(text);


        const remoteFlyers = [];


        // Columns:
        //
        // ImageURL
        // Active
        // DisplayOrder


        for (
            let i = 1;
            i < rows.length;
            i++
        ) {

            const imageURL =
                rows[i][0]
                    ?
                    rows[i][0].trim()
                    :
                    "";


            const active =
                rows[i][1]
                    ?
                    rows[i][1]
                        .trim()
                        .toUpperCase()
                    :
                    "";


            const displayOrder =
                rows[i][2]
                    ?
                    Number(
                        rows[i][2]
                    )
                    :
                    9999;


            if (
                imageURL !== ""
                &&
                (
                    active === "YES"
                    ||
                    active === "TRUE"
                    ||
                    active === "1"
                )
            ) {

                remoteFlyers.push({

                    src:
                        convertDriveURL(
                            imageURL
                        ),

                    order:
                        displayOrder

                });

            }

        }


        remoteFlyers.sort(

            function (a, b) {

                return (
                    a.order
                    -
                    b.order
                );

            }

        );


        const workingFlyers = [];


        for (
            const flyer
            of remoteFlyers
        ) {

            const works =
                await testImage(
                    flyer.src
                );


            if (works) {

                workingFlyers.push(
                    flyer.src
                );

            }

        }


        if (
            workingFlyers.length === 0
        ) {

            throw new Error(
                "No working remote flyers"
            );

        }


        activeFlyers =
            workingFlyers;

    }

    catch (error) {

        console.log(
            "Using local flyer fallback:",
            error
        );


        activeFlyers =
            templeContent.localFlyers;

    }


    currentFlyer = 0;


    showFlyer();

}



// =====================================================
// SPECIAL EVENTS
// =====================================================

let specialEvents = [];



function normalizeDateString(
    dateString
) {

    if (!dateString) {
        return "";
    }


    const value =
        dateString.trim();


    // MM/DD/YYYY

    const usMatch =
        value.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
        );


    if (usMatch) {

        const month =
            usMatch[1]
                .padStart(
                    2,
                    "0"
                );


        const day =
            usMatch[2]
                .padStart(
                    2,
                    "0"
                );


        const year =
            usMatch[3];


        return (
            year
            +
            "-"
            +
            month
            +
            "-"
            +
            day
        );

    }



    // YYYY-MM-DD

    const isoMatch =
        value.match(
            /^(\d{4})-(\d{1,2})-(\d{1,2})$/
        );


    if (isoMatch) {

        return (
            isoMatch[1]
            +
            "-"
            +
            isoMatch[2]
                .padStart(
                    2,
                    "0"
                )
            +
            "-"
            +
            isoMatch[3]
                .padStart(
                    2,
                    "0"
                )
        );

    }


    return value;

}



function getTodayKey() {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );


    return (
        year
        +
        "-"
        +
        month
        +
        "-"
        +
        day
    );

}



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
                "SpecialEvents sheet failed"
            );

        }


        const text =
            await response.text();


        const rows =
            parseCSV(text);


        const events = [];


        // Expected:
        //
        // Date
        // Event
        // Program
        // Time
        // Active


        for (
            let i = 1;
            i < rows.length;
            i++
        ) {

            const date =
                rows[i][0]
                    ?
                    normalizeDateString(
                        rows[i][0]
                    )
                    :
                    "";


            const event =
                rows[i][1]
                    ?
                    rows[i][1].trim()
                    :
                    "";


            const program =
                rows[i][2]
                    ?
                    rows[i][2].trim()
                    :
                    "";


            const time =
                rows[i][3]
                    ?
                    rows[i][3].trim()
                    :
                    "";


            const active =
                rows[i][4]
                    ?
                    rows[i][4]
                        .trim()
                        .toUpperCase()
                    :
                    "";


            if (
                date !== ""
                &&
                event !== ""
                &&
                (
                    active === "YES"
                    ||
                    active === "TRUE"
                    ||
                    active === "1"
                )
            ) {

                events.push({

                    date:
                        date,

                    event:
                        event,

                    program:
                        program,

                    time:
                        time

                });

            }

        }


        specialEvents =
            events;


        console.log(
            "Special events loaded:",
            specialEvents
        );


        updateTodaySchedule();

    }

    catch (error) {

        console.log(
            "Special events unavailable:",
            error
        );


        specialEvents = [];


        updateTodaySchedule();

    }

}



// =====================================================
// REGULAR SCHEDULE HELPERS
// =====================================================

function getSaturdayNumber(date) {

    return Math.ceil(
        date.getDate() / 7
    );

}



function getRegularProgram(now) {

    const dayNumber =
        now.getDay();


    let program = null;


    if (
        dayNumber === 6
    ) {

        const saturdayNumber =
            getSaturdayNumber(
                now
            );


        if (
            templeContent
                .saturdaySchedule
            &&
            templeContent
                .saturdaySchedule[
                    saturdayNumber
                ]
        ) {

            program =
                templeContent
                    .saturdaySchedule[
                        saturdayNumber
                    ];

        }

    }


    else if (
        templeContent
            .weeklySchedule
        &&
        templeContent
            .weeklySchedule[
                dayNumber
            ]
    ) {

        program =
            templeContent
                .weeklySchedule[
                    dayNumber
                ];

    }


    return program;

}



// =====================================================
// TODAY AT THE TEMPLE
// =====================================================

function updateTodaySchedule() {

    const now =
        new Date();


    const todayDay =
        document.getElementById(
            "today-day"
        );


    const todayProgram =
        document.getElementById(
            "today-program"
        );


    const todayTime =
        document.getElementById(
            "today-time"
        );


    const todayMessage =
        document.getElementById(
            "today-message"
        );


    if (
        !todayDay ||
        !todayProgram ||
        !todayTime ||
        !todayMessage
    ) {

        return;

    }


    todayDay.textContent =
        now.toLocaleDateString(
            "en-US",
            {
                weekday: "long"
            }
        );


    const todayKey =
        getTodayKey();


    const todaysSpecialEvents =
        specialEvents.filter(

            function (item) {

                return (
                    item.date
                    ===
                    todayKey
                );

            }

        );


    const regularProgram =
        getRegularProgram(
            now
        );



    // =================================================
    // SPECIAL EVENT EXISTS
    // =================================================

    if (
        todaysSpecialEvents.length > 0
    ) {

        const primary =
            todaysSpecialEvents[0];


        // Example:
        // POURNAMI
        // Sri Satyanarayana Puja

        todayProgram.innerHTML =
            primary.event
            +
            (
                primary.program
                    ?
                    "<br>"
                    +
                    primary.program
                    :
                    ""
            );


        todayTime.textContent =
            primary.time || "";


        let extraText = "";


        // Additional special events

        if (
            todaysSpecialEvents.length > 1
        ) {

            const additional =
                todaysSpecialEvents
                .slice(1)
                .map(

                    function (item) {

                        return (
                            item.event
                            +
                            (
                                item.program
                                    ?
                                    " - "
                                    +
                                    item.program
                                    :
                                    ""
                            )
                            +
                            (
                                item.time
                                    ?
                                    " "
                                    +
                                    item.time
                                    :
                                    ""
                            )
                        );

                    }

                );


            extraText +=
                additional.join(
                    " • "
                );

        }



        // Also show regular program if one exists

        if (regularProgram) {

            if (extraText !== "") {

                extraText +=
                    " • ";

            }


            extraText +=
                "Regular: "
                +
                regularProgram.title
                +
                " - "
                +
                regularProgram.time;

        }


        todayMessage.textContent =
            extraText;


        return;

    }



    // =================================================
    // NO SPECIAL EVENT - REGULAR PROGRAM
    // =================================================

    if (regularProgram) {

        todayProgram.textContent =
            regularProgram.title;


        todayTime.textContent =
            regularProgram.time;


        todayMessage.textContent =
            "";


        return;

    }



    // =================================================
    // NOTHING TODAY
    // =================================================

    todayProgram.textContent =
        "No Regular Program";


    todayTime.textContent =
        "";


    todayMessage.textContent =
        templeContent
            .noProgramMessage;

}



// =====================================================
// LOAD EVERYTHING
// =====================================================

loadRemoteAnnouncements();

loadRemoteFlyers();

loadSpecialEvents();

updateTodaySchedule();



// =====================================================
// AUTOMATIC REFRESH
// =====================================================

const refreshMilliseconds =

    templeContent
        .remoteRefreshMinutes

    *

    60

    *

    1000;



setInterval(

    loadRemoteAnnouncements,

    refreshMilliseconds

);


setInterval(

    loadRemoteFlyers,

    refreshMilliseconds

);


setInterval(

    loadSpecialEvents,

    refreshMilliseconds

);


setInterval(

    updateTodaySchedule,

    300000

);



// =====================================================
// FLYER ROTATION
// =====================================================

setInterval(

    nextFlyer,

    templeContent
        .flyerDuration

    *

    1000

);



// =====================================================
// BACKGROUND MUSIC
// =====================================================

const backgroundMusic =
    document.getElementById(
        "background-music"
    );


if (backgroundMusic) {

    backgroundMusic.volume =
        0.25;


    backgroundMusic
        .play()
        .catch(

            function (error) {

                console.log(
                    "Automatic music blocked:",
                    error
                );

            }

        );

}
