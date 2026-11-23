if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}
window.scrollTo({ top: 0, left: 0, behavior: "instant" });
window.addEventListener("pageshow", () => {
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
}, { once: true });

const cursor = document.querySelector(".cursor");
if (!cursor) {
  throw new Error("Custom cursor element not found.");
}

const interactiveSelector = [
  "a",
  "button",
  "input",
  "textarea",
  "select",
  "option",
  "summary",
  "[role='button']",
  ".link",
  ".btn",
  ".clickable",
].join(", ");

const interactiveElements = document.querySelectorAll(interactiveSelector);

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let cursorX = mouseX;
let cursorY = mouseY;

function cursorControl(e) {
  mouseX = e.clientX;
  mouseY = e.clientY;
}

function animateCursor() {
  const scrollParallaxX = window.scrollX * 0.08;
  const scrollParallaxY = window.scrollY * 0.12;

  cursorX += ((mouseX + scrollParallaxX) - cursorX) * 0.20;
  cursorY += ((mouseY + scrollParallaxY) - cursorY) * 0.20;

  cursor.style.left = `${cursorX}px`;
  cursor.style.top = `${cursorY}px`;

  requestAnimationFrame(animateCursor);
}

document.addEventListener("mousemove", cursorControl);
window.addEventListener("scroll", () => {
  cursor.style.transform = `translate(-50%, -50%) scale(${cursor.classList.contains("cursorGrow") ? 1.9 : 1})`;
}, { passive: true });
requestAnimationFrame(animateCursor);

interactiveElements.forEach((element) => {
  element.addEventListener("mouseenter", () => cursor.classList.add("cursorGrow"));
  element.addEventListener("mouseleave", () => cursor.classList.remove("cursorGrow"));
  element.addEventListener("focus", () => cursor.classList.add("cursorGrow"));
  element.addEventListener("blur", () => cursor.classList.remove("cursorGrow"));
});

const gradient = document.querySelector(".decoration-gradient");
const heroCopy = document.querySelector(".hero-copy");
const navbar = document.querySelector(".navbar");
const expandedSection = document.querySelector(".expanded-section");
const root = document.documentElement;
const body = document.body;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
let expansionProgress = 0;

function getGradientSettings() {
  const styles = getComputedStyle(root);
  return {
    startScale: Number.parseFloat(styles.getPropertyValue("--gradient-start-scale")) || 1,
    expandAmount: Number.parseFloat(styles.getPropertyValue("--gradient-expand-amount")) || 1.8,
    coverScroll: Number.parseFloat(styles.getPropertyValue("--gradient-cover-scroll")) || 800,
    expandSpeed: Number.parseFloat(styles.getPropertyValue("--gradient-expand-speed")) || 1.4,
  };
}

function updateGradientScale() {
  if (!gradient) return;

  const { startScale, expandAmount, expandSpeed } = getGradientSettings();
  const eased = easeOutCubic(expansionProgress ** expandSpeed);
  const scale = startScale + expandAmount * eased;

  root.style.setProperty("--gradient-scale", scale.toFixed(4));
  gradient.style.transform = `scale(${scale.toFixed(4)})`;
}

function advanceGradientExpansion(delta) {
  if (!gradient || expansionProgress >= 1 && delta > 0 || expansionProgress <= 0 && delta < 0) {
    return false;
  }

  const { coverScroll } = getGradientSettings();
  expansionProgress = clamp(expansionProgress + delta / coverScroll, 0, 1);
  if (expansionProgress > 0) {
    gradient.classList.add("is-expanding");
    heroCopy?.classList.add("is-fading");
  } else {
    gradient.classList.remove("is-expanding");
    heroCopy?.classList.remove("is-fading");
  }
  navbar?.classList.toggle("is-gradient-expanded", expansionProgress >= 1);
  body.classList.toggle("is-gradient-expanded", expansionProgress >= 1);
  expandedSection?.classList.toggle("is-visible", expansionProgress >= 1);
  expandedSection?.setAttribute("aria-hidden", String(expansionProgress < 1));
  updateGradientScale();
  return expansionProgress > 0 && expansionProgress < 1;
}

function shouldCaptureScroll(delta) {
  if (delta > 0) return expansionProgress < 1;
  return delta < 0 && expansionProgress > 0 && (!expandedSection || expandedSection.scrollTop <= 0);
}

window.addEventListener("wheel", (event) => {
  const delta = event.deltaMode === WheelEvent.DOM_DELTA_LINE
    ? event.deltaY * 16
    : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
      ? event.deltaY * window.innerHeight
      : event.deltaY;

  if (shouldCaptureScroll(delta)) {
    event.preventDefault();
    advanceGradientExpansion(delta);
  }
}, { passive: false });

window.addEventListener("keydown", (event) => {
  const downKeys = ["ArrowDown", "PageDown", " "];
  const upKeys = ["ArrowUp", "PageUp"];
  const { coverScroll } = getGradientSettings();
  const delta = downKeys.includes(event.key)
    ? coverScroll * 0.15
    : upKeys.includes(event.key)
      ? -coverScroll * 0.15
      : 0;

  if (expansionProgress >= 1 && expandedSection && (delta > 0 || delta < 0 && expandedSection.scrollTop > 0)) {
    event.preventDefault();
    expandedSection.scrollBy({ top: delta, behavior: "auto" });
  } else if (shouldCaptureScroll(delta)) {
    event.preventDefault();
    advanceGradientExpansion(delta);
  }
});

let previousTouchY = null;
window.addEventListener("touchstart", (event) => {
  previousTouchY = event.touches[0]?.clientY ?? null;
}, { passive: true });

window.addEventListener("touchmove", (event) => {
  const currentTouchY = event.touches[0]?.clientY;
  if (previousTouchY === null || currentTouchY === undefined) return;

  const delta = previousTouchY - currentTouchY;
  if (shouldCaptureScroll(delta)) {
    event.preventDefault();
    advanceGradientExpansion(delta);
  }
  previousTouchY = currentTouchY;
}, { passive: false });

const interestCarousel = document.querySelector(".interest-carousel");

if (interestCarousel) {
  const interestTrack = interestCarousel.querySelector(".interest-track");
  const interestViewport = interestCarousel.querySelector(".interest-viewport");
  const interestSlides = [...interestCarousel.querySelectorAll(".interest-slide")];
  const previousInterestButton = interestCarousel.querySelector("[data-interest-previous]");
  const nextInterestButton = interestCarousel.querySelector("[data-interest-next]");
  const interestDots = [...document.querySelectorAll(".interest-dot")];
  let activeInterest = 0;

  function showInterest(index) {
    activeInterest = (index + interestSlides.length) % interestSlides.length;
    interestTrack.style.transform = `translateX(-${activeInterest * 100}%)`;

    interestSlides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeInterest;
      slide.setAttribute("aria-hidden", String(!isActive));
      slide.inert = !isActive;
    });

    interestDots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === activeInterest;
      dot.classList.toggle("is-active", isActive);
      if (isActive) {
        dot.setAttribute("aria-current", "true");
      } else {
        dot.removeAttribute("aria-current");
      }
    });
  }

  previousInterestButton.addEventListener("click", () => showInterest(activeInterest - 1));
  nextInterestButton.addEventListener("click", () => showInterest(activeInterest + 1));
  interestDots.forEach((dot, index) => dot.addEventListener("click", () => showInterest(index)));

  interestCarousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showInterest(activeInterest - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      showInterest(activeInterest + 1);
    }
  });

  let pointerStartX = null;
  interestViewport.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointerStartX = event.clientX;
  });
  interestViewport.addEventListener("pointerup", (event) => {
    if (pointerStartX === null) return;
    const swipeDistance = event.clientX - pointerStartX;
    if (Math.abs(swipeDistance) > 45) {
      showInterest(activeInterest + (swipeDistance < 0 ? 1 : -1));
    }
    pointerStartX = null;
  });
  interestViewport.addEventListener("pointercancel", () => {
    pointerStartX = null;
  });

  showInterest(0);
}

updateGradientScale();