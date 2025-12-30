let GOOGLE_CLIENT_ID
let GOOGLE_API_KEY

fetch("/config")
  .then(res => res.json())
  .then(config => {
    GOOGLE_CLIENT_ID = config.client_id;
    GOOGLE_API_KEY = config.api_key;

    // Initialize GAPI + OAuth after config loads
    gapiLoaded();
    gisLoaded();
  })
  .catch(err => console.error("Error loading config:", err));

document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".tabs button");
    const content = document.getElementById("content");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            loadTab(tab.dataset.tab);
        });
    });

    loadTab("photos"); // initial load
});

async function loadTab(tabName) {
  try {
    const res = await fetch(`/static/tabs/${tabName}.html`);
    const html = await res.text();
    document.getElementById("content").innerHTML = html;

    // Only start slideshow after tab content exists
    if (tabName === "photos") {
      startSlideshow();
    }
  } catch (err) {
    document.getElementById("content").innerHTML = "<p>Failed to load tab.</p>";
    console.error(err);
  }
}

async function startSlideshow() {
  const slideshowImage = document.getElementById("slideshow-img");
  if (!slideshowImage) return;

  try {
    const res = await fetch("/slideshow-images");
    const slideshowImages = await res.json();

    if (!slideshowImages.length) return;

    let currentIndex = 0;
    slideshowImage.src = slideshowImages[currentIndex];

    function nextImage() {
      currentIndex = (currentIndex + 1) % slideshowImages.length;
      slideshowImage.src = slideshowImages[currentIndex];
    }

    setInterval(nextImage, 60000);
  } catch (err) {
    console.error("Failed to load slideshow images:", err);
  }
}

let tokenClient;
let gapiInited = false;

// Load GAPI client (for Calendar API)
function gapiLoaded() {
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
function gisLoaded() {
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

let calendar; 

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