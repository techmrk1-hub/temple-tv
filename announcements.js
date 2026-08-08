const templeContent = {

  // =======================================================
  // GOOGLE SHEETS
  // =======================================================

  announcementSheetURL:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFYXQmFp7zwXk60tmqmK0aAdrrGJUaRUoTEGmKryumu7pRR1yfLf_AGGzx5pj7ArNQfslONPb948-j/pub?output=csv",

  flyerSheetURL:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFYXQmFp7zwXk60tmqmK0aAdrrGJUaRUoTEGmKryumu7pRR1yfLf_AGGzx5pj7ArNQfslONPb948-j/pub?gid=1481450155&single=true&output=csv",

  specialEventsSheetURL:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFYXQmFp7zwXk60tmqmK0aAdrrGJUaRUoTEGmKryumu7pRR1yfLf_AGGzx5pj7ArNQfslONPb948-j/pub?gid=159824805&single=true&output=csv",

  upcomingEventsSheetURL:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFYXQmFp7zwXk60tmqmK0aAdrrGJUaRUoTEGmKryumu7pRR1yfLf_AGGzx5pj7ArNQfslONPb948-j/pub?gid=519294883&single=true&output=csv",


  // =======================================================
  // REFRESH
  // =======================================================

  remoteRefreshMinutes: 5,


  // =======================================================
  // FLYERS
  // =======================================================

  localFlyers: [
    "images/flyer1.jpg",
    "images/flyer2.jpg"
  ],

  flyerDuration: 10,


  // =======================================================
  // FALLBACK ANNOUNCEMENTS
  // =======================================================

  announcements: [
    "Welcome to Chinmaya Saraswati Ashram - Devi Temple",
    "Please join us for our upcoming temple programs",
    "Scan the QR code to receive temple updates",
    "Hari Om"
  ],

  separator: "     •     ",


  // =======================================================
  // FALLBACK UPCOMING EVENTS
  // =======================================================

  upcomingEventsFallback: [
    "Please check temple announcements for upcoming events"
  ],


  // =======================================================
  // WEEKLY PROGRAMS
  // JavaScript weekday:
  // Sunday 0
  // Monday 1
  // Tuesday 2
  // Wednesday 3
  // Thursday 4
  // Friday 5
  // Saturday 6
  // =======================================================

  weeklySchedule: {

    1: [
      {
        title: "Shiva Puja",
        time: "6:30 PM"
      }
    ],

    2: [
      {
        title: "Hanuman Puja",
        time: "6:30 PM"
      }
    ],

    5: [
      {
        title: "Saraswati Abhishekam",
        time: "9:00 AM"
      }
    ]

  },


  // =======================================================
  // SATURDAY PROGRAMS
  // =======================================================

  saturdaySchedule: {

    1: [
      {
        title: "Lakshmi Abhishekam",
        time: "9:00 AM"
      }
    ],

    2: [
      {
        title: "Durga Devi Abhishekam",
        time: "9:00 AM"
      }
    ],

    3: [
      {
        title: "Hanuman Abhishekam",
        time: "9:00 AM"
      }
    ]

  },


  noProgramMessage:
    "Please check announcements for today's temple programs."

};
