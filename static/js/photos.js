export async function startSlideshow() {
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