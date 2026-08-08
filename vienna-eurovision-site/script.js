// Header shadow on scroll
const topbar = document.querySelector('.topbar');
let lastY = 0;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  topbar.style.borderBottomColor = y > 10 ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.10)';
  lastY = y;
}, { passive: true });

// Reveal-on-scroll for sections
const revealTargets = document.querySelectorAll('.about-body p, .country-list li, .gallery-grid img, .vote-inner');
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

revealTargets.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(16px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  io.observe(el);
});

const style = document.createElement('style');
style.textContent = `.in-view { opacity: 1 !important; transform: translateY(0) !important; }`;
document.head.appendChild(style);
