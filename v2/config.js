window.TEMPLE_TV_V2_CONFIG = {
  feeds: {
    announcements: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFYXQmFp7zwXk60tmqmK0aAdrrGJUaRUoTEGmKryumu7pRR1yfLf_AGGzx5pj7ArNQfslONPb948-j/pub?output=csv",
    flyers: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFYXQmFp7zwXk60tmqmK0aAdrrGJUaRUoTEGmKryumu7pRR1yfLf_AGGzx5pj7ArNQfslONPb948-j/pub?gid=1481450155&single=true&output=csv",
    specialEvents: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFYXQmFp7zwXk60tmqmK0aAdrrGJUaRUoTEGmKryumu7pRR1yfLf_AGGzx5pj7ArNQfslONPb948-j/pub?gid=159824805&single=true&output=csv",
    weeklySchedule: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFYXQmFp7zwXk60tmqmK0aAdrrGJUaRUoTEGmKryumu7pRR1yfLf_AGGzx5pj7ArNQfslONPb948-j/pub?gid=1586421151&single=true&output=csv",
    upcomingEvents: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFYXQmFp7zwXk60tmqmK0aAdrrGJUaRUoTEGmKryumu7pRR1yfLf_AGGzx5pj7ArNQfslONPb948-j/pub?gid=519294883&single=true&output=csv",
    bgm: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFYXQmFp7zwXk60tmqmK0aAdrrGJUaRUoTEGmKryumu7pRR1yfLf_AGGzx5pj7ArNQfslONPb948-j/pub?gid=397630639&single=true&output=csv",
    displayScenes: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFYXQmFp7zwXk60tmqmK0aAdrrGJUaRUoTEGmKryumu7pRR1yfLf_AGGzx5pj7ArNQfslONPb948-j/pub?gid=2026091301&single=true&output=csv",
    signageSettings: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFYXQmFp7zwXk60tmqmK0aAdrrGJUaRUoTEGmKryumu7pRR1yfLf_AGGzx5pj7ArNQfslONPb948-j/pub?gid=2026091302&single=true&output=csv"
  },

  assets: {
    logo: "../images/logo.png",
    whatsappQr: "../images/whatsapp-qr.png",
    fallbackMusic: "../music/music1.mp3"
  },

  defaults: {
    TempleName: "CHINMAYA SARASWATI ASHRAM",
    TempleSubtitle: "DEVI TEMPLE",
    Location: "Orange, Connecticut",
    Timezone: "America/New_York",
    DefaultSceneDuration: 15,
    TransitionDurationMs: 900,
    RemoteRefreshMinutes: 5,
    AnnouncementPixelsPerSecond: 65,
    UpcomingPixelsPerSecond: 55,
    BgmVolume: 0.30,
    ShowTomorrow: "YES",
    ShowCommunity: "YES",
    ShowStatusIndicator: "YES"
  },

  fallbackAnnouncements: [
    "Welcome to Chinmaya Saraswati Ashram - Devi Temple",
    "Please join us for our upcoming temple programs",
    "Scan the QR code to receive temple updates",
    "Hari Om"
  ],

  fallbackScenes: [
    {
      SceneID: "FALLBACK-SCHEDULE",
      Type: "SCHEDULE",
      Title: "Today at Devi Temple",
      Subtitle: "Temple programs and timings",
      Duration: 12,
      Transition: "REVEAL",
      Active: "YES",
      DisplayOrder: 90,
      Priority: "NORMAL"
    },
    {
      SceneID: "FALLBACK-COMMUNITY",
      Type: "COMMUNITY",
      Title: "Join Our Community",
      Subtitle: "Scan to receive temple updates",
      Duration: 10,
      Transition: "FADE",
      Active: "YES",
      DisplayOrder: 91,
      Priority: "NORMAL"
    }
  ]
};
