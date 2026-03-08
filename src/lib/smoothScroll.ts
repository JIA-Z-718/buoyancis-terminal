/**
 * Smooth scroll to an element with custom easing and offset
 */
export const smoothScrollTo = (elementId: string, offset: number = 80) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const targetPosition = element.getBoundingClientRect().top + window.scrollY - offset;
  const startPosition = window.scrollY;
  const distance = targetPosition - startPosition;
  const duration = 800;
  let startTime: number | null = null;

  // Easing function - easeInOutCubic
  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const animation = (currentTime: number) => {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    const easedProgress = easeInOutCubic(progress);

    window.scrollTo(0, startPosition + distance * easedProgress);

    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  };

  requestAnimationFrame(animation);
};

/**
 * Handle anchor link clicks with smooth scrolling
 */
export const handleAnchorClick = (
  e: React.MouseEvent<HTMLAnchorElement>,
  href: string,
  callback?: () => void
) => {
  if (href.startsWith("#")) {
    e.preventDefault();
    const elementId = href.slice(1);
    smoothScrollTo(elementId);
    
    // Update URL hash without jumping
    window.history.pushState(null, "", href);
    
    if (callback) callback();
  }
};
