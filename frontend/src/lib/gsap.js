import { gsap } from 'gsap';

export const animatePageIn = (element) => {
  if (!element) return;
  gsap.fromTo(element, {
    opacity: 0,
    y: 20,
  }, {
    opacity: 1,
    y: 0,
    duration: 0.5,
    ease: 'power3.out',
  });
};

export const animatePageOut = (element, callback) => {
  if (!element) { callback?.(); return; }
  gsap.to(element, {
    opacity: 0,
    y: -20,
    duration: 0.3,
    ease: 'power2.in',
    onComplete: callback,
  });
};

export const animateSlideIn = (element, direction = 'left', delay = 0) => {
  if (!element) return;
  const x = direction === 'left' ? -50 : direction === 'right' ? 50 : 0;
  const y = direction === 'up' ? 50 : direction === 'down' ? -50 : 0;
  gsap.fromTo(element, { opacity: 0, x, y }, {
    opacity: 1, x: 0, y: 0, duration: 0.5, delay, ease: 'power3.out',
  });
};

export const animateCounter = (element, start, end, duration = 1.5) => {
  if (!element) return;
  const obj = { val: start };
  gsap.to(obj, {
    val: end,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      if (element) {
        element.textContent = Math.round(obj.val).toLocaleString();
      }
    },
  });
};

export const animateStagger = (elements, stagger = 0.1) => {
  if (!elements?.length) return;
  gsap.fromTo(elements, { opacity: 0, y: 20 }, {
    opacity: 1, y: 0, duration: 0.4, stagger, ease: 'power2.out',
  });
};

export const animateModalIn = (element) => {
  if (!element) return;
  gsap.fromTo(element, { opacity: 0, scale: 0.9, y: 20 }, {
    opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'back.out(1.7)',
  });
};

export const animateModalOut = (element, callback) => {
  if (!element) { callback?.(); return; }
  gsap.to(element, {
    opacity: 0, scale: 0.95, y: -10, duration: 0.2, ease: 'power2.in',
    onComplete: callback,
  });
};

export const sidebarAnimate = (element, isOpen) => {
  if (!element) return;
  if (isOpen) {
    gsap.to(element, { width: 260, duration: 0.3, ease: 'power2.out' });
  } else {
    gsap.to(element, { width: 72, duration: 0.3, ease: 'power2.in' });
  }
};

export default gsap;
