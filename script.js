// Hero Carousel Auto-Slide
const carousel = document.getElementById("hero-carousel");
const slides = document.querySelectorAll(".hero-slide");
let index = 0;

function nextSlide() {
  index = (index + 1) % slides.length;
  carousel.style.transform = `translateX(-${index * 100}%)`;
}

// Auto slide every 5 seconds
setInterval(nextSlide, 5000);
