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
  // BGM SHEET
  // =======================================================

  bgmSheetURL:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFYXQmFp7zwXk60tmqmK0aAdrrGJUaRUoTEGmKryumu7pRR1yfLf_AGGzx5pj7ArNQfslONPb948-j/pub?gid=397630639&single=true&output=csv",



  // =======================================================
  // REFRESH SETTINGS
  // =======================================================

  remoteRefreshMinutes: 5,


  // How often to check whether a SPECIAL BGM
  // should start or stop.
  bgmScheduleCheckSeconds: 15,


  // BGM Volume
  // 0.00 = mute
  // 1.00 = full volume
  bgmVolume: 0.30,



  // =======================================================
  // FLYERS
  // =======================================================

  localFlyers: [

    "images/flyer1.jpg",

    "images/flyer2.jpg"

  ],


  flyerDuration: 10,



  // =======================================================
  // ANNOUNCEMENT FALLBACK
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
  // WEEKLY PROGRAMS
  //
  // Sunday    = 0
  // Monday    = 1
  // Tuesday   = 2
  // Wednesday = 3
  // Thursday  = 4
  // Friday    = 5
  // Saturday  = 6
  // =======================================================

  weeklySchedule: {


    // MONDAY

    1: [

      {

        title:
          "Shiva Abhishekam",

        time:
          "6:30 PM"

      }

    ],



    // TUESDAY

    2: [

      {

        title:
          "Hanuman Abhishekam Followed By Hanumana Chalisa Parayanam, Archana, Aarati",

        time:
          "6:30 PM"

      }

    ],



    // FRIDAY

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
  // SATURDAY PROGRAMS
  // =======================================================

  saturdaySchedule: {


    // FIRST SATURDAY

    1: [

      {

        title:
          "Lakshmi Devi Abhishekam",

        time:
          "6:30 PM"

      }

    ],



    // SECOND SATURDAY

    2: [

      {

        title:
          "Durga Devi Abhishekam",

        time:
          "6:30 PM"

      }

    ],



    // THIRD SATURDAY

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
  // NO REGULAR PROGRAM
  // =======================================================

  noProgramMessage:
    "Please check announcements for today's temple programs."

};
