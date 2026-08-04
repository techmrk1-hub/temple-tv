// =====================================================
// TEMPLE TV SYSTEM
// Remote Announcements + Remote Flyers
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

setInterval(updateClock, 1000);



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

            row.push(cell.trim());

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

                row.push(cell.trim());

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

        row.push(cell.trim());

        rows.push(row);

    }


    return rows;

}



// =====================================================
// ANNOUNCEMENTS
// =====================================================

const tickerText =
    document.getElementById("ticker-text");


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

        const separator =
            templeContent.announcementSheetURL.includes("?")
                ? "&"
                : "?";


        const response =
            await fetch(
                templeContent.announcementSheetURL
                +
                separator
                +
                "t="
                +
                Date.now(),

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
            messages.length > 0
        ) {

            displayAnnouncements(
                messages
            );

            console.log(
                "Remote announcements loaded."
            );

        }

        else {

            throw new Error(
                "No remote announcements"
            );

        }

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
// FLYER SYSTEM
// =====================================================

const flyerElement =
    document.getElementById("flyer");


let activeFlyers = [];

let currentFlyer = 0;



// =====================================================
// GOOGLE DRIVE LINK CONVERTER
// =====================================================

function convertDriveURL(url) {

    if (!url) {
        return "";
    }


    let fileID = null;



    // ------------------------------------------
    // Standard Google Drive sharing URL
    //
    // drive.google.com/file/d/FILE_ID/view
    // ------------------------------------------

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



    // ------------------------------------------
    // Links containing ?id=FILE_ID
    // ------------------------------------------

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



    // ------------------------------------------
    // Convert to Google image endpoint
    // ------------------------------------------

    if (fileID) {

        return (
            "https://drive.google.com/thumbnail?id="
            +
            fileID
            +
            "&sz=w3000"
        );

    }



    // Normal direct image URL

    return url;

}



// =====================================================
// TEST REMOTE IMAGE
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
// SHOW FLYER
// =====================================================

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



// =====================================================
// NEXT FLYER
// =====================================================

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



// =====================================================
// LOAD REMOTE FLYERS
// =====================================================

async function loadRemoteFlyers() {

    try {

        const separator =
            templeContent.flyerSheetURL.includes("?")
                ? "&"
                : "?";


        const response =
            await fetch(
                templeContent.flyerSheetURL
                +
                separator
                +
                "t="
                +
                Date.now(),

                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Flyer Sheet failed"
            );

        }


        const text =
            await response.text();


        const rows =
            parseCSV(text);


        const remoteFlyers = [];


        // Expected Google Sheet:
        //
        // ImageURL | Active | DisplayOrder


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

                const convertedURL =
                    convertDriveURL(
                        imageURL
                    );


                remoteFlyers.push({

                    src:
                        convertedURL,

                    order:
                        displayOrder

                });

            }

        }



        // Sort according to DisplayOrder

        remoteFlyers.sort(
            function (a, b) {

                return (
                    a.order -
                    b.order
                );

            }
        );



        // ------------------------------------------
        // CHECK THAT EACH IMAGE ACTUALLY WORKS
        // ------------------------------------------

        const workingFlyers = [];


        for (
            const flyer of remoteFlyers
        ) {

            const works =
                await testImage(
                    flyer.src
                );


            if (works) {

                workingFlyers.push(
                    flyer.src
                );


                console.log(
                    "Remote flyer OK:",
                    flyer.src
                );

            }

            else {

                console.log(
                    "Remote flyer failed:",
                    flyer.src
                );

            }

        }



        // ------------------------------------------
        // USE REMOTE FLYERS
        // ------------------------------------------

        if (
            workingFlyers.length > 0
        ) {

            activeFlyers =
                workingFlyers;


            console.log(
                "Using remote flyers:",
                activeFlyers
            );

        }


        // ------------------------------------------
        // FALLBACK
        // ------------------------------------------

        else {

            throw new Error(
                "No working remote flyers"
            );

        }

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
// START REMOTE CONTENT
// =====================================================

loadRemoteAnnouncements();

loadRemoteFlyers();



// =====================================================
// AUTOMATIC REMOTE REFRESH
// =====================================================

setInterval(

    loadRemoteAnnouncements,

    templeContent.remoteRefreshMinutes
    *
    60
    *
    1000

);


setInterval(

    loadRemoteFlyers,

    templeContent.remoteRefreshMinutes
    *
    60
    *
    1000

);



// =====================================================
// FLYER ROTATION
// =====================================================

setInterval(

    nextFlyer,

    templeContent.flyerDuration
    *
    1000

);



// =====================================================
// TODAY AT THE TEMPLE
// =====================================================

function getSaturdayNumber(date) {

    return Math.ceil(
        date.getDate() / 7
    );

}



function updateTodaySchedule() {

    const now =
        new Date();


    const dayNumber =
        now.getDay();


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


    let program = null;



    // ------------------------------------------
    // SATURDAY
    // ------------------------------------------

    if (dayNumber === 6) {

        const saturdayNumber =
            getSaturdayNumber(
                now
            );


        if (
            templeContent.saturdaySchedule
            &&
            templeContent.saturdaySchedule[
                saturdayNumber
            ]
        ) {

            program =
                templeContent.saturdaySchedule[
                    saturdayNumber
                ];

        }

    }



    // ------------------------------------------
    // OTHER DAYS
    // ------------------------------------------

    else if (
        templeContent.weeklySchedule
        &&
        templeContent.weeklySchedule[
            dayNumber
        ]
    ) {

        program =
            templeContent.weeklySchedule[
                dayNumber
            ];

    }



    if (program) {

        todayProgram.textContent =
            program.title;


        todayTime.textContent =
            program.time;


        todayMessage.textContent =
            "";

    }

    else {

        todayProgram.textContent =
            "No Regular Program";


        todayTime.textContent =
            "";


        todayMessage.textContent =
            templeContent.noProgramMessage;

    }

}



updateTodaySchedule();


setInterval(
    updateTodaySchedule,
    300000
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


    backgroundMusic.play().catch(
        function (error) {

            console.log(
                "Chrome blocked automatic music:",
                error
            );

        }
    );

}