const templeContent = {

  // =======================================================
  // GOOGLE SHEETS
  // =======================================================

  announcementSheetURL:
    "https://docs.google.com/spreadsheets/d/1rljGlqs80q6qdqddXd5Rh6BZE7fAEvG3OsHAny81t1s/gviz/tq?tqx=out:csv&gid=0",

  flyerSheetURL:
    "https://docs.google.com/spreadsheets/d/1rljGlqs80q6qdqddXd5Rh6BZE7fAEvG3OsHAny81t1s/gviz/tq?tqx=out:csv&gid=1481450155",

  specialEventsSheetURL:
    "https://docs.google.com/spreadsheets/d/1rljGlqs80q6qdqddXd5Rh6BZE7fAEvG3OsHAny81t1s/gviz/tq?tqx=out:csv&gid=159824805",

  upcomingEventsSheetURL:
    "https://docs.google.com/spreadsheets/d/1rljGlqs80q6qdqddXd5Rh6BZE7fAEvG3OsHAny81t1s/gviz/tq?tqx=out:csv&gid=519294883",

  bgmSheetURL:
    "https://docs.google.com/spreadsheets/d/1rljGlqs80q6qdqddXd5Rh6BZE7fAEvG3OsHAny81t1s/gviz/tq?tqx=out:csv&gid=397630639",

  weeklyScheduleSheetURL:
    "https://docs.google.com/spreadsheets/d/1rljGlqs80q6qdqddXd5Rh6BZE7fAEvG3OsHAny81t1s/gviz/tq?tqx=out:csv&gid=1586421151",


  // =======================================================
  // REFRESH
  // =======================================================

  remoteRefreshSeconds: 30,

  bgmScheduleCheckSeconds: 5,

  bgmVolume: 0.30,


  // =======================================================
  // FLYERS
  // 15 SECONDS
  // =======================================================

  localFlyers: [
    "images/flyer1.jpg",
    "images/flyer2.jpg"
  ],

  flyerDuration: 15,


  // =======================================================
  // ANNOUNCEMENTS FALLBACK
  // =======================================================

  announcements: [

    "Welcome to Chinmaya Saraswati Ashram - Devi Temple",

    "Please join us for our upcoming temple programs",

    "Scan the QR code to receive temple updates",

    "Hari Om"

  ],

  separator:
    "     •     ",


  // =======================================================
  // UPCOMING EVENTS FALLBACK
  // =======================================================

  upcomingEventsFallback: [

    "Please check temple announcements for upcoming events"

  ],


  // =======================================================
  // EMERGENCY WEEKLY FALLBACK
  // =======================================================

  weeklySchedule: {

    1: [
      {
        title:
          "Shiva Abhishekam",

        time:
          "6:30 PM"
      }
    ],

    2: [
      {
        title:
          "Hanuman Abhishekam Followed By Hanuman Chalisa Parayanam, Archana, Aarati",

        time:
          "6:30 PM"
      }
    ],

    5: [
      {
        title:
          "Saraswati Devi Abhishekam",

        time:
          "10:00 AM",

        endTime:
          "11:00 AM"
      },

      {
        title:
          "Saraswati Devi Archana",

        time:
          "11:00 AM",

        endTime:
          "12:00 PM"
      }
    ]

  },


  // =======================================================
  // EMERGENCY SATURDAY FALLBACK
  // =======================================================

  saturdaySchedule: {

    1: [
      {
        title:
          "Lakshmi Devi Abhishekam",

        time:
          "6:30 PM"
      }
    ],

    2: [
      {
        title:
          "Durga Devi Abhishekam",

        time:
          "6:30 PM"
      }
    ],

    3: [
      {
        title:
          "Hanuman Abhishekam Followed by Tulasidas Sundarakanda Parayanam",

        time:
          "10:00 AM"
      }
    ]

  },


  // =======================================================
  // NO PROGRAM
  // =======================================================

  noProgramMessage:
    "No scheduled programs"

};
