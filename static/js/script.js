import { gapiLoaded, gisLoaded, setGoogleCredentials } from "./calendar.js";
import { startSlideshow } from "./photos.js";
import { updateDateTime } from "./dateTime.js";

/* Initilse Application */
async function initApp() {
  try {
    await loadGoogleConfig();
    initTabs();
    initClock();
  } catch (err) {
    console.error("App failed to initialise:", err);
  }
}

/* Google Calendar Start */

async function loadGoogleConfig() {
  const res = await fetch("/config");
  const config = await res.json();

  setGoogleCredentials(config.client_id, config.api_key);

  await Promise.all([
    waitForGlobal("gapi"),
    waitForGlobal("google")
  ]);

  gapiLoaded();
  gisLoaded();
}

/* UI Setup */

function initTabs() {
  const tabs = document.querySelectorAll(".tabs button");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      loadTab(tab.dataset.tab);
    });
  });

  loadTab("photos");
}

async function loadTab(tabName) {
  try {
    const res = await fetch(`/static/tabs/${tabName}.html`);
    document.getElementById("content").innerHTML = await res.text();

    if (tabName === "photos") {
      startSlideshow();
    }
  } catch (err) {
    document.getElementById("content").innerHTML = "<p>Failed to load tab.</p>";
    console.error(err);
  }
}

/* Utility Functions */
function waitForGlobal(name) { // Avoids Race Conditions
  return new Promise(resolve => {
    const check = () => {
      if (window[name]) resolve();
      else setTimeout(check, 50);
    };
    check();
  });
}

/* Clock Setup*/

function initClock() {
  updateDateTime();
  setInterval(updateDateTime, 30_000);
}

/* Start App */

document.addEventListener("DOMContentLoaded", initApp);
