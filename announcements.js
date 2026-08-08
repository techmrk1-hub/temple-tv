const templeContent = {

  // =========================================================
  // REMOTE GOOGLE SHEETS
  // =========================================================

  announcementSheetURL:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFYXQmFp7zwXk60tmqmK0aAdrrGJUaRUoTEGmKryumu7pRR1yfLf_AGGzx5pj7ArNQfslONPb948-j/pub?output=csv",

  flyerSheetURL:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFYXQmFp7zwXk60tmqmK0aAdrrGJUaRUoTEGmKryumu7pRR1yfLf_AGGzx5pj7ArNQfslONPb948-j/pub?gid=1481450155&single=true&output=csv",

  specialEventsSheetURL:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFYXQmFp7zwXk60tmqmK0aAdrrGJUaRUoTEGmKryumu7pRR1yfLf_AGGzx5pj7ArNQfslONPb948-j/pub?gid=159824805&single=true&output=csv",

  // NEW UPCOMING EVENTS SHEET
  upcomingEventsSheetURL:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFYXQmFp7zwXk60tmqmK0aAdrrGJUaRUoTEGmKryumu7pRR1yfLf_AGGzx5pj7ArNQfslONPb948-j/pub?gid=519294883&single=true&output=csv",


  // =========================================================
  // REMOTE REFRESH
  // =========================================================

  remoteRefreshMinutes: 5,


  // =========================================================
  // LOCAL FALLBACK FLYERS
  // =========================================================

  localFlyers: [
    "images/flyer1.jpg",
    "images/flyer2.jpg"
  ],


  // =========================================================
  // FLYER ROTATION
  // =========================================================

  flyerDuration: 10,


  // =========================================================
  // LOCAL FALLBACK ANNOUNCEMENTS
  // =========================================================

  announcements: [

    "Welcome to Chinmaya Saraswati Ashram - Devi Temple",

    "Please join us for our upcoming temple programs",

    "Scan the QR code to receive Temple WhatsApp updates",

    "Hari Om"

  ],


  separator: "     •     ",


  // =========================================================
  // FALLBACK UPCOMING EVENTS
  // =========================================================

  upcomingEventsFallback: [

    "Please check our temple announcements for upcoming programs"

  ],


  // =========================================================
  // REGULAR WEEKLY TEMPLE PROGRAMS
  // =========================================================

  weeklySchedule: {

    1: {
      title: "Shiva Puja",
      time: "6:30 PM"
    },

    2: {
      title: "Hanuman Puja",
      time: "6:30 PM"
    },

    5: {
      title: "Saraswati Abhishekam",
      time: "9:00 AM"
    }

  },


  // =========================================================
  // SATURDAY PROGRAMS
  // =========================================================

  saturdaySchedule: {

    1: {
      title: "Lakshmi Abhishekam",
      time: "9:00 AM"
    },

    2: {
      title: "Durga Devi Abhishekam",
      time: "9:00 AM"
    },

    3: {
      title: "Hanuman Abhishekam",
      time: "9:00 AM"
    }

  },


  // =========================================================
  // NO PROGRAM MESSAGE
  // =========================================================

  noProgramMessage:
    "Please check announcements for upcoming temple programs."

};
