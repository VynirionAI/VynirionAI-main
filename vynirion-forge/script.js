/* ============================================================
   Vynirion Forge V2 — script.js  (shared across all pages)
   ============================================================ */

// ── NAV scroll tint
const nav = document.getElementById('site-nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

// ── Hamburger / mobile nav
const hamburger  = document.getElementById('hamburger');
const mobileNav  = document.getElementById('mobile-nav');

if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', open);
  });
  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !mobileNav.contains(e.target)) {
      mobileNav.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });
  // Close on nav link click
  mobileNav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });
}

// ── Smooth scroll (in-page anchors)
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (!href || href === '#') return; // bare # — let browser handle naturally
    let target;
    try { target = document.querySelector(href); } catch { return; }
    if (target) {
      e.preventDefault();
      const navH = nav ? nav.offsetHeight : 68;
      const top  = target.getBoundingClientRect().top + window.scrollY - navH - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// ── Back to top
const backTop = document.getElementById('back-top');
if (backTop) {
  window.addEventListener('scroll', () => {
    backTop.classList.toggle('show', window.scrollY > 400);
  }, { passive: true });
  backTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ── FAQ accordion
document.querySelectorAll('.faq-item').forEach(item => {
  const btn = item.querySelector('.faq-q');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    // Close all
    document.querySelectorAll('.faq-item.open').forEach(o => o.classList.remove('open'));
    // Open clicked unless it was already open
    if (!isOpen) item.classList.add('open');
  });
});

// ── TIER TOGGLE  (templates.html — Option B)
//    Both tier-1 and tier-2 live in the DOM at all times.
//    setTier() switches which is visible via the .active class.
//    ?tier=1 or ?tier=2 URL params set the default on load.

const tierDescriptions = {
  1: 'Clean, professional, and approachable — great for most local businesses.',
  2: 'Dark, bold, and high-end — stands out and signals premium pricing.',
};

function setTier(n) {
  const t1 = document.getElementById('tier-1');
  const t2 = document.getElementById('tier-2');
  const tab1 = document.getElementById('tab-t1');
  const tab2 = document.getElementById('tab-t2');
  const desc = document.getElementById('tier-desc');

  if (!t1 || !t2) return; // not on templates page

  if (n === 1) {
    t1.classList.add('active');    t2.classList.remove('active');
    tab1.classList.add('active');  tab2.classList.remove('active');
    tab1.setAttribute('aria-selected', 'true');
    tab2.setAttribute('aria-selected', 'false');
  } else {
    t2.classList.add('active');    t1.classList.remove('active');
    tab2.classList.add('active');  tab1.classList.remove('active');
    tab2.setAttribute('aria-selected', 'true');
    tab1.setAttribute('aria-selected', 'false');
  }
  if (desc) desc.textContent = tierDescriptions[n];

  // Update URL param without reload (so direct links work)
  const url = new URL(window.location);
  url.searchParams.set('tier', n);
  history.replaceState(null, '', url);
}

// Read ?tier param on page load and scroll to top
(function initTier() {
  const t1 = document.getElementById('tier-1');
  if (!t1) return; // not on templates page
  const params = new URLSearchParams(window.location.search);
  const tier = parseInt(params.get('tier'), 10);
  if (tier === 2) setTier(2);
  // Ensure page always starts at top regardless of browser scroll restoration
  window.scrollTo(0, 0);
})();

// Expose setTier globally (called by inline onclick on tabs)
window.setTier = setTier;


// ── IFRAME anchor isolation (templates.html)
// Root cause: the template's own JS calls element.scrollIntoView() when a nav
// link is clicked. scrollIntoView() propagates up through the iframe boundary
// and scrolls the outer Forge page too.
//
// Two-layer fix:
//   1. Override Element.prototype.scrollIntoView inside the iframe so every
//      call — including from the template's own handlers — scrolls only the
//      iframe's window.
//   2. Use capture-phase click listener on the iframe document so we intercept
//      anchor clicks BEFORE the template's bubble-phase handlers run, preventing
//      any default navigation and stopping immediate propagation.
function bindIframeAnchors(iframe) {
  try {
    const iWin = iframe.contentWindow;
    const iDoc = iframe.contentDocument || iWin.document;

    // Layer 1 — override scrollIntoView at the prototype level
    iWin.Element.prototype.scrollIntoView = function(arg) {
      const behavior = (arg && typeof arg === 'object') ? (arg.behavior || 'auto') : 'auto';
      const top = this.getBoundingClientRect().top + iWin.scrollY - 80;
      iWin.scrollTo({ top: Math.max(0, top), behavior });
    };

    // Layer 2 — capture-phase click handler fires before template's own handlers
    iDoc.addEventListener('click', function(e) {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href === '#') { e.preventDefault(); return; }
      let target;
      try { target = iDoc.querySelector(href); } catch { return; }
      if (target) {
        e.preventDefault();
        e.stopImmediatePropagation(); // block template's own handler from running
        const top = target.getBoundingClientRect().top + iWin.scrollY - 80;
        iWin.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      }
    }, true); // true = capture phase

  } catch (err) {
    // Cross-origin iframe — skip silently
  }
}

document.querySelectorAll('.template-iframe').forEach(function(iframe) {
  iframe.addEventListener('load', function() { bindIframeAnchors(iframe); });
  if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
    bindIframeAnchors(iframe);
  }
});


// ── CONTACT FORM — Formspree AJAX submit (contact.html)
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn       = document.getElementById('submit-btn');
    const formBox   = document.getElementById('form-box');
    const successEl = document.getElementById('form-success');
    const errorEl   = document.getElementById('form-error');

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…';

    try {
      const res = await fetch(contactForm.action, {
        method:  'POST',
        body:    new FormData(contactForm),
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        formBox.style.display   = 'none';
        if (successEl) successEl.style.display = 'block';
      } else {
        throw new Error('Server error');
      }
    } catch {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send My Quote Request';
      if (formBox)  formBox.style.display   = 'none';
      if (errorEl)  errorEl.style.display   = 'block';
    }
  });
}
