const templeContent = {

    // ==========================================
    // REMOTE ANNOUNCEMENTS
    // ==========================================

    announcementSheetURL:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFYXQmFp7zwXk60tmqmK0aAdrrGJUaRUoTEGmKryumu7pRR1yfLf_AGGzx5pj7ArNQfslONPb948-j/pub?output=csv",


    // ==========================================
    // REMOTE FLYERS
    // ==========================================

    flyerSheetURL:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFYXQmFp7zwXk60tmqmK0aAdrrGJUaRUoTEGmKryumu7pRR1yfLf_AGGzx5pj7ArNQfslONPb948-j/pub?gid=1481450155&single=true&output=csv",


    // ==========================================
    // SPECIAL EVENTS
    // ==========================================

    specialEventsSheetURL:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFYXQmFp7zwXk60tmqmK0aAdrrGJUaRUoTEGmKryumu7pRR1yfLf_AGGzx5pj7ArNQfslONPb948-j/pub?gid=159824805&single=true&output=csv",


    // Refresh remote data every 5 minutes

    remoteRefreshMinutes: 5,


    // ==========================================
    // LOCAL FLYER FALLBACK
    // ==========================================

    localFlyers: [
        "images/flyer1.jpg",
        "images/flyer2.jpg"
    ],


    flyerDuration: 10,


    // ==========================================
    // LOCAL ANNOUNCEMENT FALLBACK
    // ==========================================

    announcements: [

        "Welcome to Chinmaya Saraswati Ashram - Devi Temple",

        "Please join us for our upcoming temple programs",

        "Scan the QR code to join our WhatsApp updates group",

        "Hari Om"

    ],


    separator: "   •   ",


    // ==========================================
    // REGULAR WEEKLY PROGRAMS
    // ==========================================

    weeklySchedule: {

        1: {
            title: "Shiva Abhishekam",
            time: "6:30 PM"
        },

        2: {
            title: "Hanuman Abhishekam Followed by Chalisa Parayanam",
            time: "6:30 PM"
        },

        5: {
            title: "Saraswati Abhishekam",
            time: "6:30 PM"
        }

    },


    // ==========================================
    // SATURDAY PROGRAMS
    // ==========================================

    saturdaySchedule: {

        1: {
            title: "Lakshmi Devi Abhishekam",
            time: "6:30 PM"
        },

        2: {
            title: "Durga Devi Abhishekam",
            time: "6:30 PM"
        },

        3: {
            title: "Hanuman Abhishekam Tulasidas Sundarakanda Parayanam",
            time: "10:00 AM"
        }

    },


    noProgramMessage:
        "Please check announcements for upcoming temple programs."

};
