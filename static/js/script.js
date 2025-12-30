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

  // Initial load
  loadTab("photos");
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