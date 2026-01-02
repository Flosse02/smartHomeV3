let tokenClient;
let gapiInited = false;
let calendar;
let initialised = false;

let GOOGLE_CLIENT_ID;
let GOOGLE_API_KEY;

export function setGoogleCredentials(clientId, apiKey) {
  GOOGLE_CLIENT_ID = clientId;
  GOOGLE_API_KEY = apiKey;
}

// Load GAPI client (for Calendar API)
export function gapiLoaded() {
  if (initialised) return;
  initialised = true;
  gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: GOOGLE_API_KEY,
    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"]
  });
  gapiInited = true;
}

// Initialize OAuth token client
export function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    callback: (tokenResponse) => {
      loadCalendarEvents();
      startCalendarAutoRefresh(5);
    },
  });

  document.getElementById('login-btn').onclick = () => {
    tokenClient.requestAccessToken();
  };
}

// Load calendar events
async function loadCalendarEvents() {
  const response = await gapi.client.calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    showDeleted: false,
    singleEvents: true,
    maxResults: 10,
    orderBy: 'startTime'
  });

  const container = document.getElementById('calendar-container');
  container.innerHTML = '';
  const events = response.result.items;

  if (!events.length) {
    container.innerHTML = '<p>No upcoming events</p>';
    return;
  }

  renderEvents(events);
}

window.addEventListener('load', () => {
    if (typeof gisLoaded === 'function') gisLoaded();
    if (typeof gapiLoaded === 'function') gapiLoaded();
});

function renderEvents(events) {
  const calendarEl = document.getElementById('calendar-container');

  const fcEvents = events.map(e => ({
    title: e.summary,
    start: e.start.dateTime || e.start.date,
    end: e.end?.dateTime || e.end?.date
  }));

  if (calendar) {
    calendar.destroy();
  }

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    events: fcEvents,
    height: '100%',
    counterHeight: '100%'
  });

  calendar.render();
}

// Refresh calendar events periodically
function startCalendarAutoRefresh(intervalMinutes = 5) {
  setInterval(() => {
    if (gapiInited && localStorage.getItem('google_access_token')) {
      loadCalendarEvents();
    }
  }, intervalMinutes * 60 * 1000);
}

function requestAccessTokenSilently() {
  tokenClient.requestAccessToken({ prompt: '' }); // silent request
}

// call every 50 minutes
setInterval(() => {
  if (localStorage.getItem('google_access_token')) {
    requestAccessTokenSilently();
  }
}, 50 * 60 * 1000);
