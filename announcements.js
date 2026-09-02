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

  bgmSheetURL:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFYXQmFp7zwXk60tmqmK0aAdrrGJUaRUoTEGmKryumu7pRR1yfLf_AGGzx5pj7ArNQfslONPb948-j/pub?gid=397630639&single=true&output=csv",

  weeklyScheduleSheetURL:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFYXQmFp7zwXk60tmqmK0aAdrrGJUaRUoTEGmKryumu7pRR1yfLf_AGGzx5pj7ArNQfslONPb948-j/pub?gid=1586421151&single=true&output=csv",


  // =======================================================
  // REFRESH
  // =======================================================

  remoteRefreshMinutes: 5,

  bgmScheduleCheckSeconds: 15,

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
          "6:30 PM"
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
