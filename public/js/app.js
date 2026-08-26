if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered successfully', reg.scope))
      .catch(err => console.error('Service Worker registration failed', err));
  });
}

function initTheme() {
  const toggleBtn = document.getElementById('theme-toggle-btn');
  const savedTheme = localStorage.getItem('weldwork_theme');
  const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;

  let currentTheme = savedTheme || (systemPrefersLight ? 'light' : 'dark');
  document.documentElement.setAttribute('data-theme', currentTheme);

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute('content', currentTheme === 'light' ? '#f8fafc' : '#111827');
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', currentTheme);
      localStorage.setItem('weldwork_theme', currentTheme);

      if (themeMeta) {
        themeMeta.setAttribute('content', currentTheme === 'light' ? '#f8fafc' : '#111827');
      }
    });
  }
}

const screens = {
  home: { id: 'screen-home', path: '/' },
  catalogue: { id: 'screen-catalogue', path: '/catalogue/' },
  teams: { id: 'screen-teams', path: '/teams/' },
  about: { id: 'screen-about', path: '/about/' }
};

function switchScreen(screenKey) {
  const normalizedKey = (screenKey === 'workers') ? 'teams' : screenKey;
  Object.keys(screens).forEach(key => {
    const el = document.getElementById(screens[key].id);
    if (el) {
      if (key === normalizedKey) {
        el.classList.add('active');
        checkScrollPosition(currentScrollTop());
        const container = el.querySelector('.screen-scroll-container');
        if (container && container._indicator) container._indicator.classList.add('visible');
      } else {
        el.classList.remove('active');
        const container = el.querySelector('.screen-scroll-container');
        if (container && container._indicator) container._indicator.classList.remove('visible');
      }
    }
  });

  document.querySelectorAll('.nav-tab').forEach(tab => {
    const tabScreen = (tab.dataset.screen === 'workers') ? 'teams' : tab.dataset.screen;
    if (tabScreen === normalizedKey) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

// Desktop uses window scroll (containers are static flow); mobile uses inner container.
function isDesktopLayout() {
  return window.matchMedia('(min-width: 768px)').matches;
}

function currentScrollTop() {
  if (!isDesktopLayout()) {
    const container = document.querySelector('.screen-view.active .screen-scroll-container');
    if (container) return container.scrollTop;
  }
  return window.scrollY || document.documentElement.scrollTop || 0;
}

function smoothScrollToTop() {
  if (!isDesktopLayout()) {
    const container = document.querySelector('.screen-view.active .screen-scroll-container');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function checkScrollPosition(scrollTop) {
  const centerBtn = document.getElementById('app-center-btn');
  if (!centerBtn) return;
  const lang = getLang();
  if (scrollTop > 120) {
    centerBtn.classList.add('is-scroll-top');
    centerBtn.setAttribute('aria-label', lang === 'ta' ? 'மேலே செல்' : 'Back to top');
  } else {
    centerBtn.classList.remove('is-scroll-top');
    centerBtn.setAttribute('aria-label', lang === 'ta' ? 'தயாரிப்பு வகைப்பாடு' : 'Product Catalogue');
  }
}

function initRouting() {
  document.querySelectorAll('[data-screen]').forEach(button => {
    button.addEventListener('click', (e) => {
      const centerBtn = document.getElementById('app-center-btn');
      if (button === centerBtn && centerBtn.classList.contains('is-scroll-top')) {
        e.preventDefault();
        e.stopPropagation();
        smoothScrollToTop();
        return;
      }

      const targetScreen = (button.dataset.screen === 'workers') ? 'teams' : button.dataset.screen;
      if (screens[targetScreen]) {
        const lang = window.location.pathname.startsWith('/ta') ? 'ta' : 'en';
        const path = `/${lang}${screens[targetScreen].path}`;
        history.pushState({ screen: targetScreen }, '', path);
        switchScreen(targetScreen);
      }
    });
  });

  const logoBtn = document.getElementById('header-logo-btn');
  if (logoBtn) {
    logoBtn.addEventListener('click', () => {
      const lang = window.location.pathname.startsWith('/ta') ? 'ta' : 'en';
      const path = `/${lang}${screens.home.path}`;
      history.pushState({ screen: 'home' }, '', path);
      switchScreen('home');
    });
  }

  document.querySelectorAll('[data-team-trigger], [data-worker-trigger]').forEach(tag => {
    tag.addEventListener('click', (e) => {
      const teamMembersData = tag.dataset.teamMembers;
      const lang = window.location.pathname.startsWith('/ta') ? 'ta' : 'en';
      if (teamMembersData) {
        e.stopPropagation();
        const itemTitle = tag.getAttribute('data-item-title-' + lang) || tag.dataset.itemTitle || '';
        try {
          const teamMembers = JSON.parse(teamMembersData);
          openTeamSelector(teamMembers, itemTitle);
        } catch (err) {
          console.error('Failed to parse team members data:', err);
        }
      } else {
        const path = `/${lang}${screens.teams.path}`;
        history.pushState({ screen: 'teams' }, '', path);
        switchScreen('teams');
      }
    });
  });

  window.addEventListener('popstate', (e) => {
    if (photoLightbox && !photoLightbox.classList.contains('hidden')) {
      closePhotoLightbox(true);
      return;
    }
    if (e.state && e.state.lbOpen) return;
    if (e.state && e.state.screen && screens[e.state.screen]) {
      switchScreen(e.state.screen);
      if (e.state.screen === 'catalogue') {
        applyCompanyFilter(e.state.company || null);
      }
    } else {
      switchScreen('home');
    }
  });

  const currentPath = window.location.pathname;
  const normalizedPath = currentPath.replace(/^\/(en|ta)/, '');
  if (normalizedPath.startsWith('/catalogue') || normalizedPath.startsWith('/services')) {
    switchScreen('catalogue');
  } else if (normalizedPath.startsWith('/teams') || normalizedPath.startsWith('/workers')) {
    switchScreen('teams');
  } else if (normalizedPath.startsWith('/about')) {
    switchScreen('about');
  } else {
    switchScreen('home');
  }
}

function initScrollWatcher() {
  document.querySelectorAll('.screen-scroll-container').forEach(container => {
    container.addEventListener('scroll', (e) => {
      checkScrollPosition(e.target.scrollTop);
    }, { passive: true });
  });

  window.addEventListener('scroll', () => {
    if (isDesktopLayout()) {
      checkScrollPosition(currentScrollTop());
    }
  }, { passive: true });

  requestAnimationFrame(() => {
    checkScrollPosition(currentScrollTop());
  });
}

const photoLightbox = document.getElementById('photo-lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const lightboxCounter = document.getElementById('lightbox-counter');
const lightboxDots = document.getElementById('lightbox-dots');
const closeLightboxBtn = document.getElementById('close-lightbox');
const prevPhotoBtn = document.getElementById('lightbox-prev');
const nextPhotoBtn = document.getElementById('lightbox-next');
const lbImgWrapper = document.querySelector('#photo-lightbox .lightbox-img-wrapper');

let currentAlbumImages = [];
let currentAlbumIndex = 0;
let currentAlbumTitle = '';
let lastFocusedTrigger = null;
let lbHistoryPushed = false;

function renderAlbumImage() {
  if (!currentAlbumImages.length || !lightboxImg) return;
  lightboxImg.src = currentAlbumImages[currentAlbumIndex];
  lightboxImg.alt = currentAlbumTitle ? `${currentAlbumTitle} — photo ${currentAlbumIndex + 1}` : '';
  if (lightboxCaption) lightboxCaption.textContent = currentAlbumTitle;
  if (lightboxCounter) lightboxCounter.textContent = `${currentAlbumIndex + 1} / ${currentAlbumImages.length}`;

  if (typeof lightboxImg.animate === 'function') {
    lightboxImg.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
  }

  preloadAlbumNeighbours();

  if (lightboxDots) {
    lightboxDots.querySelectorAll('.album-dot').forEach((dot, idx) => {
      if (idx === currentAlbumIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }
}

function preloadAlbumNeighbours() {
  const total = currentAlbumImages.length;
  if (total < 2 || !lightboxImg) return;
  [(currentAlbumIndex + 1) % total, (currentAlbumIndex - 1 + total) % total].forEach((i) => {
    const img = new Image();
    img.src = currentAlbumImages[i];
  });
}

function nextAlbumPhoto() {
  if (!currentAlbumImages.length) return;
  currentAlbumIndex = (currentAlbumIndex + 1) % currentAlbumImages.length;
  renderAlbumImage();
}

function prevAlbumPhoto() {
  if (!currentAlbumImages.length) return;
  currentAlbumIndex = (currentAlbumIndex - 1 + currentAlbumImages.length) % currentAlbumImages.length;
  renderAlbumImage();
}

function openPhotoAlbum(images, title) {
  if (!photoLightbox || !images || !images.length) return;
  currentAlbumImages = images;
  currentAlbumIndex = 0;
  currentAlbumTitle = title || 'Product Photo Album';

  if (lightboxDots) {
    lightboxDots.innerHTML = '';
    currentAlbumImages.forEach((_, idx) => {
      const dot = document.createElement('button');
      dot.className = `album-dot ${idx === 0 ? 'active' : ''}`;
      dot.setAttribute('aria-label', `Go to photo ${idx + 1}`);
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        currentAlbumIndex = idx;
        renderAlbumImage();
      });
      lightboxDots.appendChild(dot);
    });
  }

  renderAlbumImage();
  photoLightbox.classList.remove('hidden');
  photoLightbox.setAttribute('aria-hidden', 'false');

  const lbContent = photoLightbox.querySelector('.lightbox-content');
  if (lbContent && typeof lbContent.animate === 'function') {
    lbContent.animate(
      [
        { opacity: 0, transform: 'scale(0.96) translateY(10px)' },
        { opacity: 1, transform: 'none' }
      ],
      { duration: 260, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
    );
  }

  lastFocusedTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  if (closeLightboxBtn) closeLightboxBtn.focus();

  if (!lbHistoryPushed) {
    history.pushState({ lbOpen: true }, '');
    lbHistoryPushed = true;
  }
}

function closePhotoLightbox(fromPop = false) {
  if (!photoLightbox || photoLightbox.classList.contains('hidden')) return;
  photoLightbox.classList.add('hidden');
  photoLightbox.setAttribute('aria-hidden', 'true');
  if (lightboxImg) lightboxImg.src = '';
  currentAlbumImages = [];

  if (lbHistoryPushed && !fromPop) {
    lbHistoryPushed = false;
    history.back();
  } else {
    lbHistoryPushed = false;
  }

  if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === 'function') {
    lastFocusedTrigger.focus();
  }
  lastFocusedTrigger = null;
}

let touchStartX = 0;
let touchStartY = 0;
let touchDeltaX = 0;
let touchDeltaY = 0;
let isGestureActive = false;
const SWIPE_THRESHOLD = 50;
const DISMISS_THRESHOLD = 90;

function setLightboxDrag(dragging) {
  if (!lbImgWrapper) return;
  lbImgWrapper.classList.toggle('lb-dragging', dragging);
  if (!dragging) {
    lbImgWrapper.style.transform = '';
    lbImgWrapper.style.opacity = '';
  }
}

function handleTouchStart(e) {
  const touch = e.changedTouches[0];
  touchStartX = touch.screenX;
  touchStartY = touch.screenY;
  touchDeltaX = 0;
  touchDeltaY = 0;
  isGestureActive = true;
  if (lbImgWrapper) lbImgWrapper.classList.add('lb-dragging');
}

function handleTouchMove(e) {
  if (!isGestureActive || !lbImgWrapper) return;
  const touch = e.changedTouches[0];
  touchDeltaX = touch.screenX - touchStartX;
  touchDeltaY = touch.screenY - touchStartY;

  if (Math.abs(touchDeltaY) > Math.abs(touchDeltaX)) {
    if (touchDeltaY > 0) {
      lbImgWrapper.style.transform = `translateY(${touchDeltaY * 0.55}px) scale(${Math.max(1 - touchDeltaY / 2400, 0.92)})`;
      lbImgWrapper.style.opacity = String(Math.max(1 - touchDeltaY / 480, 0.45));
    }
  } else if (currentAlbumImages.length > 1) {
    lbImgWrapper.style.transform = `translateX(${touchDeltaX}px)`;
  }
}

function handleTouchEnd() {
  if (!isGestureActive) return;
  isGestureActive = false;
  const isHorizontal = Math.abs(touchDeltaX) > Math.abs(touchDeltaY);

  if (!isHorizontal && touchDeltaY > DISMISS_THRESHOLD) {
    setLightboxDrag(false);
    closePhotoLightbox();
    return;
  }

  if (isHorizontal && currentAlbumImages.length > 1) {
    if (touchDeltaX < -SWIPE_THRESHOLD) { setLightboxDrag(false); nextAlbumPhoto(); return; }
    if (touchDeltaX > SWIPE_THRESHOLD) { setLightboxDrag(false); prevAlbumPhoto(); return; }
  }

  setLightboxDrag(false);
}

function initPhotoAlbum() {
  document.querySelectorAll('.product-feature-media, .catalogue-album-badge, .compact-btn.btn-album').forEach(media => {
    media.addEventListener('click', (e) => {
      e.stopPropagation();
      try {
        const images = JSON.parse(media.dataset.albumImages || '[]');
        const title = media.dataset.albumTitle;
        if (images.length) {
          openPhotoAlbum(images, title);
        }
      } catch (err) {
        console.error('Failed to parse album images:', err);
      }
    });
  });

  if (closeLightboxBtn) closeLightboxBtn.addEventListener('click', closePhotoLightbox);
  if (prevPhotoBtn) prevPhotoBtn.addEventListener('click', (e) => { e.stopPropagation(); prevAlbumPhoto(); });
  if (nextPhotoBtn) nextPhotoBtn.addEventListener('click', (e) => { e.stopPropagation(); nextAlbumPhoto(); });

  if (lightboxImg) {
    lightboxImg.addEventListener('click', (e) => {
      e.stopPropagation();
      if (photoLightbox && !photoLightbox.classList.contains('hidden')) {
        nextAlbumPhoto();
      }
    });
  }

  if (photoLightbox) {
    photoLightbox.addEventListener('click', (e) => {
      if (e.target === photoLightbox) {
        closePhotoLightbox();
      }
    });

    photoLightbox.addEventListener('touchstart', handleTouchStart, { passive: true });
    photoLightbox.addEventListener('touchmove', handleTouchMove, { passive: true });
    photoLightbox.addEventListener('touchend', handleTouchEnd, { passive: true });
    photoLightbox.addEventListener('touchcancel', () => {
      isGestureActive = false;
      setLightboxDrag(false);
    }, { passive: true });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (photoLightbox && !photoLightbox.classList.contains('hidden')) {
        closePhotoLightbox();
      }
      if (detailsDrawer && !detailsDrawer.classList.contains('hidden')) {
        closeDetailsDrawer();
      }
      const contactModal = document.getElementById('contact-modal');
      if (contactModal && !contactModal.classList.contains('hidden')) {
        contactModal.classList.add('hidden');
        contactModal.setAttribute('aria-hidden', 'true');
      }
      if (quoteModal && !quoteModal.classList.contains('hidden')) {
        closeQuoteModal();
      }
      const hoursNotice = document.getElementById('hours-notice-modal');
      if (hoursNotice && !hoursNotice.classList.contains('hidden') && typeof window.hideHoursNotice === 'function') {
        window.hideHoursNotice();
      }
    }
    if (photoLightbox && !photoLightbox.classList.contains('hidden')) {
      const activeTag = document.activeElement ? document.activeElement.tagName : '';
      if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA' && activeTag !== 'SELECT') {
        if (e.key === 'ArrowRight') { e.preventDefault(); nextAlbumPhoto(); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); prevAlbumPhoto(); }
      }
    }
    if (e.key === 'Tab' && photoLightbox && !photoLightbox.classList.contains('hidden')) {
      const focusables = Array.from(photoLightbox.querySelectorAll('button:not([disabled])'));
      if (focusables.length) {
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        const outside = !active || !photoLightbox.contains(active);
        if (e.shiftKey && (active === first || outside)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (active === last || outside)) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  });
}

const detailsDrawer = document.getElementById('details-drawer');
const closeDetailsBtn = document.getElementById('close-details');
const drawerCategory = document.getElementById('drawer-category');
const drawerTitle = document.getElementById('drawer-title');
const drawerRate = document.getElementById('drawer-rate');
const drawerRateType = document.getElementById('drawer-rate-type');
const drawerRateDate = document.getElementById('drawer-rate-date');
const drawerLead = document.getElementById('drawer-lead');
const drawerMaterials = document.getElementById('drawer-materials');
const drawerBrief = document.getElementById('drawer-brief');

function openDetailsDrawer(btn) {
  if (!detailsDrawer) return;

  if (drawerCategory) drawerCategory.textContent = btn.getAttribute('data-category') || 'Custom Fabrication';
  if (drawerTitle) drawerTitle.textContent = btn.getAttribute('data-title') || 'Product Details';
  if (drawerRate) drawerRate.textContent = btn.getAttribute('data-rate') || '₹0';
  if (drawerRateType) drawerRateType.textContent = btn.getAttribute('data-rate-type') || 'Starting Labour Rate';
  if (drawerRateDate) drawerRateDate.textContent = `as of ${btn.getAttribute('data-rate-date') || 'Today'}`;
  if (drawerLead) drawerLead.textContent = btn.getAttribute('data-lead') || '—';

  if (drawerMaterials) {
    drawerMaterials.innerHTML = '';
    const mats = (btn.getAttribute('data-materials') || '').split(',');
    mats.forEach(m => {
      const trimmed = m.trim();
      if (trimmed) {
        const span = document.createElement('span');
        span.className = 'material-tag';
        span.textContent = trimmed;
        drawerMaterials.appendChild(span);
      }
    });
  }

  if (drawerBrief) {
    drawerBrief.textContent = btn.getAttribute('data-brief') || '';
  }

  detailsDrawer.classList.remove('hidden');
  detailsDrawer.setAttribute('aria-hidden', 'false');
}

function closeDetailsDrawer() {
  if (!detailsDrawer) return;
  detailsDrawer.classList.add('hidden');
  detailsDrawer.setAttribute('aria-hidden', 'true');
}

function initDetailsDrawer() {
  document.querySelectorAll('.open-details-btn, .catalogue-info-btn, .btn-info').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openDetailsDrawer(btn);
    });
  });

  if (closeDetailsBtn) closeDetailsBtn.addEventListener('click', closeDetailsDrawer);
  if (detailsDrawer) {
    detailsDrawer.addEventListener('click', (e) => {
      if (e.target === detailsDrawer) {
        closeDetailsDrawer();
      }
    });
  }
}

function isWithinWorkingHours() {
  const schedule = Array.isArray(window.enquirySchedule) ? window.enquirySchedule : null;
  if (!schedule || schedule.length === 0) return true;

  const now = new Date();
  const day = now.getDay(); // 0 = Sunday ... 6 = Saturday
  const timeInMinutes = now.getHours() * 60 + now.getMinutes();

  const toMinutes = (hhmm) => {
    const [h, m] = String(hhmm).split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  return schedule.some(slot =>
    Array.isArray(slot.days) && slot.days.includes(day) &&
    timeInMinutes >= toMinutes(slot.open) &&
    timeInMinutes <= toMinutes(slot.close)
  );
}

function initContactModal() {
  const openBtn = document.getElementById('open-inquiry-btn');
  const modal = document.getElementById('contact-modal');
  const closeBtn = document.getElementById('close-modal');
  const form = document.getElementById('inquiry-form');
  const feedback = document.getElementById('form-feedback');
  const submitBtn = document.getElementById('submit-btn');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      if (!isWithinWorkingHours()) {
        const hoursModal = document.getElementById('hours-notice-modal');
        if (hoursModal) {
          hoursModal.classList.remove('hidden');
          hoursModal.setAttribute('aria-hidden', 'false');
        }
        return;
      }
      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');

      if (typeof turnstile !== 'undefined' && !modal.dataset.turnstileRendered) {
        const widgetEl = document.getElementById('turnstile-widget');
        if (widgetEl && window.turnstileSitekey) {
          window.turnstile.render(widgetEl, {
            sitekey: window.turnstileSitekey,
            theme: document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
          });
          modal.dataset.turnstileRendered = 'true';
        }
      }
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
      }
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const phoneInput = document.getElementById('inquiry-phone');
      if (phoneInput && phoneInput.value.trim()) {
        const digits = phoneInput.value.replace(/\D/g, '');
        if (digits.length < 7 || digits.length > 15) {
          if (feedback) {
            const lang = document.documentElement.getAttribute('lang') || 'en';
            feedback.textContent = lang === 'ta' ? 'சரியான தொலைபேசி எண்ணை உள்ளிடவும்.' : 'Please enter a valid phone number.';
            feedback.className = 'form-feedback error';
            feedback.classList.remove('hidden');
          }
          return;
        }
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }

      try {
        const formData = new FormData(form);
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: formData
        });
        const result = await response.json();

        if (result.success) {
          if (feedback) {
            feedback.textContent = 'Message sent successfully! We\'ll get back to you shortly.';
            feedback.className = 'form-feedback success';
            feedback.classList.remove('hidden');
          }
          form.reset();
          setTimeout(() => {
            if (modal) {
              modal.classList.add('hidden');
              modal.setAttribute('aria-hidden', 'true');
            }
            if (feedback) feedback.classList.add('hidden');
          }, 3000);
        } else {
          throw new Error(result.message || 'Submission failed');
        }
      } catch (err) {
        if (feedback) {
          feedback.textContent = 'Something went wrong. Please try again or call us directly.';
          feedback.className = 'form-feedback error';
          feedback.classList.remove('hidden');
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Message';
        }
      }
    });
  }

  const hoursModal = document.getElementById('hours-notice-modal');
  const closeHoursNotice = document.getElementById('close-hours-notice');
  if (hoursModal) {
    const hideHoursNotice = () => {
      hoursModal.classList.add('hidden');
      hoursModal.setAttribute('aria-hidden', 'true');
    };
    if (closeHoursNotice) closeHoursNotice.addEventListener('click', hideHoursNotice);
    hoursModal.addEventListener('click', (e) => {
      if (e.target === hoursModal) hideHoursNotice();
    });
    window.hideHoursNotice = hideHoursNotice;
  }
}

const quoteModal = document.getElementById('quote-modal');
const quoteForm = document.getElementById('quote-form');
const quoteCloseBtn = document.getElementById('close-quote-modal');
const quoteFeedback = document.getElementById('quote-form-feedback');
const quoteSubmitBtn = document.getElementById('quote-submit-btn');
const quotePhotosInput = document.getElementById('quote-photos');
const quoteProductInput = document.getElementById('quote-product-input');
const quoteBanner = document.getElementById('quote-product-banner');
const quoteBannerTitle = document.getElementById('quote-product-title');
const quoteBannerRate = document.getElementById('quote-product-rate');

function openQuoteModal(btn) {
  if (!quoteModal) return;
  const title = btn.getAttribute('data-title') || '';
  const rate = btn.getAttribute('data-rate') || '';
  const category = btn.getAttribute('data-category') || '';
  const companyName = btn.getAttribute('data-company-name') || '';

  if (quoteProductInput) quoteProductInput.value = title;
  quoteModal.dataset.category = category;
  quoteModal.dataset.rate = rate;
  quoteModal.dataset.companyName = companyName;
  if (quoteBanner && title) {
    if (quoteBannerTitle) quoteBannerTitle.textContent = title;
    if (quoteBannerRate) quoteBannerRate.textContent = [category, rate].filter(Boolean).join(' • ');
    quoteBanner.classList.remove('hidden');
  }

  quoteModal.classList.remove('hidden');
  quoteModal.setAttribute('aria-hidden', 'false');

  if (typeof turnstile !== 'undefined' && !quoteModal.dataset.turnstileRendered) {
    const widgetEl = document.getElementById('turnstile-widget-quote');
    if (widgetEl && window.turnstileSitekey) {
      turnstile.render(widgetEl, {
        sitekey: window.turnstileSitekey,
        theme: document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
      });
      quoteModal.dataset.turnstileRendered = 'true';
    }
  }
}

function closeQuoteModal() {
  if (!quoteModal) return;
  quoteModal.classList.add('hidden');
  quoteModal.setAttribute('aria-hidden', 'true');
}

async function compressImage(file, maxDim = 1600, quality = 0.8) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  try {
    const img = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    if (scale >= 1 && file.size < 300 * 1024) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (blob && blob.size < file.size) {
      const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
      return new File([blob], name, { type: 'image/jpeg' });
    }
    return file;
  } catch {
    return file;
  }
}

async function uploadQuotePhotos(files) {
  const db = getSupabase();
  if (!db || !files.length) return [];
  const urls = [];
  const dateStamp = new Date().toISOString().slice(0, 10);
  for (let i = 0; i < files.length; i++) {
    try {
      const compressed = await compressImage(files[i]);
      const path = `quotes/${dateStamp}/${Date.now()}-${i}.jpg`;
      const { error } = await db.storage.from('quote-attachments').upload(path, compressed, {
        contentType: compressed.type,
        upsert: false
      });
      if (error) continue;
      const { data } = db.storage.from('quote-attachments').getPublicUrl(path);
      if (data?.publicUrl) urls.push(data.publicUrl);
    } catch {
      continue;
    }
  }
  return urls;
}

async function initQuoteModal() {
  if (!quoteModal) return;

  document.querySelectorAll('.btn-quote').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openQuoteModal(btn);
    });
  });

  if (quoteCloseBtn) quoteCloseBtn.addEventListener('click', closeQuoteModal);

  quoteModal.addEventListener('click', (e) => {
    if (e.target === quoteModal) closeQuoteModal();
  });

  const dropzone = document.getElementById('quote-dropzone');
  const dropzonePrompt = document.getElementById('dropzone-prompt');
  const previewsContainer = document.getElementById('quote-file-previews');
  let dropzoneFiles = [];

  function renderDropzonePreviews() {
    if (!previewsContainer) return;
    if (!dropzoneFiles.length) {
      previewsContainer.classList.add('hidden');
      previewsContainer.innerHTML = '';
      if (dropzonePrompt) dropzonePrompt.style.display = '';
      return;
    }
    if (dropzonePrompt) dropzonePrompt.style.display = 'none';
    previewsContainer.classList.remove('hidden');
    previewsContainer.innerHTML = '';
    dropzoneFiles.forEach((file, i) => {
      const item = document.createElement('div');
      item.className = 'quote-preview-item';
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.alt = file.name;
      item.appendChild(img);
      const name = document.createElement('div');
      name.className = 'quote-preview-name';
      name.textContent = file.name;
      item.appendChild(name);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quote-preview-remove';
      btn.textContent = '\u00d7';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        URL.revokeObjectURL(img.src);
        dropzoneFiles.splice(i, 1);
        renderDropzonePreviews();
      });
      item.appendChild(btn);
      previewsContainer.appendChild(item);
    });
    if (dropzoneFiles.length < parseInt(quotePhotosInput?.dataset.maxFiles || '4', 10)) {
      const addMore = document.createElement('div');
      addMore.className = 'dropzone-add-more';
      addMore.innerHTML = '<i data-lucide="plus" class="dropzone-add-more-icon"></i><span class="dropzone-add-more-text">+</span>';
      previewsContainer.appendChild(addMore);
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    }
  }

  function addDropzoneFiles(fileList) {
    const max = parseInt(quotePhotosInput?.dataset.maxFiles || '4', 10);
    const incoming = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    const available = max - dropzoneFiles.length;
    const toAdd = incoming.slice(0, available);
    dropzoneFiles = dropzoneFiles.concat(toAdd);
    renderDropzonePreviews();
  }

  if (dropzone) {
    ['dragenter', 'dragover'].forEach(evt => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('is-dragover');
      });
    });
    ['dragleave', 'drop'].forEach(evt => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('is-dragover');
      });
    });
    dropzone.addEventListener('drop', (e) => {
      if (e.dataTransfer?.files?.length) {
        addDropzoneFiles(e.dataTransfer.files);
      }
    });
  }

  if (quotePhotosInput) {
    quotePhotosInput.addEventListener('change', () => {
      if (quotePhotosInput.files?.length) {
        addDropzoneFiles(quotePhotosInput.files);
        quotePhotosInput.value = '';
      }
    });
  }

  if (quoteForm) {
    quoteForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const lang = getLang();
      const ta = lang === 'ta';

      const botcheck = quoteForm.querySelector('input[name="botcheck"]');
      if (botcheck && botcheck.checked) {
        closeQuoteModal();
        return;
      }

      const phoneInput = document.getElementById('quote-phone');
      if (phoneInput && phoneInput.value.trim()) {
        const digits = phoneInput.value.replace(/\D/g, '');
        if (digits.length < 7 || digits.length > 15) {
          if (quoteFeedback) {
            quoteFeedback.textContent = ta ? 'சரியான தொலைபேசி எண்ணை உள்ளிடவும்.' : 'Please enter a valid phone number.';
            quoteFeedback.className = 'form-feedback error';
            quoteFeedback.classList.remove('hidden');
          }
          return;
        }
      }

      const db = getSupabase();
      if (!db) {
        if (quoteFeedback) {
          quoteFeedback.textContent = ta
            ? 'மேற்கோள் சேவை தற்போது கிடைக்கவில்லை. தயவுசெய்து நேரடியாக எங்களை அழைக்கவும்.'
            : 'Quote service is currently unavailable. Please call us directly.';
          quoteFeedback.className = 'form-feedback error';
          quoteFeedback.classList.remove('hidden');
        }
        return;
      }

      const captchaToken = quoteForm.querySelector('[name="cf-turnstile-response"]')?.value;
      if (quoteModal.dataset.turnstileRendered === 'true' && !captchaToken) {
        if (quoteFeedback) {
          quoteFeedback.textContent = ta ? 'கேப்சாவை உறுதிப்படுத்தவும்.' : 'Please complete the captcha.';
          quoteFeedback.className = 'form-feedback error';
          quoteFeedback.classList.remove('hidden');
        }
        return;
      }

      const maxFiles = parseInt(quotePhotosInput?.dataset.maxFiles || '4', 10);
      const photoFiles = dropzoneFiles.slice(0, maxFiles);

      if (quoteSubmitBtn) {
        quoteSubmitBtn.disabled = true;
        quoteSubmitBtn.textContent = photoFiles.length
          ? (ta ? 'புகைப்படங்கள் பதிவேற்றுகிறது...' : 'Uploading photos...')
          : (ta ? 'அனுப்புகிறது...' : 'Sending...');
      }

      try {
        const photoUrls = await uploadQuotePhotos(photoFiles);

        const { error } = await db.from('quotes').insert({
          product_title: quoteProductInput ? quoteProductInput.value : '',
          product_category: quoteModal.dataset.category || null,
          product_rate: quoteModal.dataset.rate || null,
          company_name: quoteModal.dataset.companyName || null,
          name: document.getElementById('quote-name')?.value || '',
          phone: phoneInput?.value || '',
          email: document.getElementById('quote-email')?.value || null,
          message: document.getElementById('quote-message')?.value || '',
          attachments: photoUrls,
          status: 'new',
          lang
        });
        if (error) throw error;

        if (quoteFeedback) {
          quoteFeedback.textContent = ta
            ? 'மேற்கோள் கோரிக்கை அனுப்பப்பட்டது! நாங்கள் விரைவில் உங்களைத் தொடர்பு கொள்கிறோம்.'
            : "Quote request sent! We'll get back to you shortly.";
          quoteFeedback.className = 'form-feedback success';
          quoteFeedback.classList.remove('hidden');
        }
        quoteForm.reset();
        dropzoneFiles = [];
        if (previewsContainer) {
          previewsContainer.innerHTML = '';
          previewsContainer.classList.add('hidden');
        }
        if (dropzonePrompt) dropzonePrompt.style.display = '';
        setTimeout(() => {
          closeQuoteModal();
          if (quoteFeedback) quoteFeedback.classList.add('hidden');
        }, 3000);
      } catch {
        if (quoteFeedback) {
          quoteFeedback.textContent = ta
            ? 'ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும் அல்லது நேரடியாக எங்களை அழைக்கவும்.'
            : 'Something went wrong. Please try again or call us directly.';
          quoteFeedback.className = 'form-feedback error';
          quoteFeedback.classList.remove('hidden');
        }
      } finally {
        if (quoteSubmitBtn) {
          quoteSubmitBtn.disabled = false;
          quoteSubmitBtn.textContent = ta ? 'மேற்கோள் கோரிக்கை அனுப்பு' : 'Request Quote';
        }
      }
    });
  }
}

function initShortsCards() {
  if (typeof Hammer === 'undefined') return;

  document.querySelectorAll('.shorts-scroll').forEach(container => {
    const cards = container.querySelectorAll('.shorts-card');
    if (!cards.length) return;

    const hammer = new Hammer.Manager(container, {
      recognizers: [
        [Hammer.Swipe, { direction: Hammer.DIRECTION_VERTICAL, threshold: 30, velocity: 0.3 }]
      ]
    });

    hammer.on('swipeup', () => {
      scrollToNextCard(container, cards);
    });

    hammer.on('swipedown', () => {
      scrollToPrevCard(container, cards);
    });

    let scrollTimeout;
    container.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        updateActiveCardIndicator(container, cards);
      }, 80);
    }, { passive: true });

    createIndicatorDots(container, cards);
    updateActiveCardIndicator(container, cards);
  });
}

function scrollToNextCard(container, cards) {
  const scrollTop = container.scrollTop;
  for (let i = 0; i < cards.length; i++) {
    if (cards[i].offsetTop > scrollTop + 10) {
      cards[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
      break;
    }
  }
}

function scrollToPrevCard(container, cards) {
  const scrollTop = container.scrollTop;
  for (let i = cards.length - 1; i >= 0; i--) {
    if (cards[i].offsetTop < scrollTop - 10) {
      cards[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
      break;
    }
  }
}

function createIndicatorDots(container, cards) {
  const indicator = document.createElement('div');
  indicator.className = 'shorts-indicator';
  indicator.setAttribute('aria-hidden', 'true');

  cards.forEach((_, idx) => {
    const dot = document.createElement('div');
    dot.className = 'shorts-dot';
    if (idx === 0) dot.classList.add('active');
    indicator.appendChild(dot);
  });

  document.querySelector('.app-container').appendChild(indicator);

  const screenId = container.closest('.screen-view')?.id;
  container._indicator = indicator;
  container._screenId = screenId;
}

function updateActiveCardIndicator(container, cards) {
  if (!container._indicator) return;

  const scrollTop = container.scrollTop;
  let activeIdx = 0;
  let minDist = Infinity;

  cards.forEach((card, idx) => {
    const dist = Math.abs(card.offsetTop - scrollTop);
    if (dist < minDist) {
      minDist = dist;
      activeIdx = idx;
    }
  });

  const dots = container._indicator.querySelectorAll('.shorts-dot');
  dots.forEach((dot, idx) => {
    dot.classList.toggle('active', idx === activeIdx);
  });

  const isActive = document.querySelector('.screen-view.active')?.id === container._screenId;
  container._indicator.classList.toggle('visible', isActive);
}

function initVideoFallback() {
  document.querySelectorAll('.shop-card-video').forEach(video => {
    const source = video.querySelector('source');
    const fallback = video.previousElementSibling;

    function showFallback() {
      video.pause();
      video.removeAttribute('src');
      video.load();
      video.style.display = 'none';
      video.style.zIndex = '-1';
      if (fallback) {
        fallback.style.opacity = '1';
        fallback.style.zIndex = '0';
      }
    }

    if (!source || !source.src) {
      showFallback();
      return;
    }

    video.addEventListener('error', showFallback);
    source.addEventListener('error', showFallback);
    video.addEventListener('loadeddata', () => {
      video.classList.add('is-loaded');
      if (fallback) fallback.style.opacity = '0';
    });

    setTimeout(() => {
      if (video.readyState < 2) {
        showFallback();
      }
    }, 3000);
  });
}

function initHoursToggle() {
  document.querySelectorAll('[data-hours-toggle]').forEach(box => {
    box.addEventListener('click', (e) => {
      e.stopPropagation();
      box.classList.toggle('is-expanded');
    });
  });
  document.querySelectorAll('[data-catalogue-toggle]').forEach(box => {
    box.addEventListener('click', (e) => {
      e.stopPropagation();
      box.classList.toggle('is-expanded');
    });
  });
}

const teamSelectorModal = document.getElementById('team-selector-modal');
const teamSelectorList = document.getElementById('team-selector-list');
const teamSelectorItemTitle = document.getElementById('team-selector-item-title');
const closeTeamSelectorBtn = document.getElementById('close-team-selector');

function openTeamSelector(teamMembers, itemTitle) {
  if (!teamSelectorModal || !teamSelectorList) return;
  teamSelectorList.innerHTML = '';

  const lang = document.documentElement.getAttribute('lang') || 'en';

  if (teamSelectorItemTitle && itemTitle) {
    if (lang === 'ta') {
      teamSelectorItemTitle.textContent = `"${itemTitle}"-க்கான நிபுணரைத் தேர்ந்தெடுக்கவும்`;
    } else {
      teamSelectorItemTitle.textContent = `Select Specialist for "${itemTitle}"`;
    }
  }

  teamMembers.forEach(member => {
    const name = member.name || member.slug || 'Unknown';
    const role = member.role || '';
    const photo = member.photo || '/icons/icon-192.png';
    const whatsapp = member.whatsapp || '919840562997';

    const chatMsg = encodeURIComponent(lang === 'ta' ? `வணக்கம் ${name}, எனக்கு "${itemTitle}" பற்றி உதவி தேவை. ` : `Hi ${name}, I need help with "${itemTitle}". `);
    const chatUrl = `https://wa.me/${whatsapp}?text=${chatMsg}`;

    const item = document.createElement('div');
    item.className = 'team-selector-item';

    const img = document.createElement('img');
    img.src = photo;
    img.alt = name;
    img.className = 'selector-avatar';
    img.loading = 'lazy';

    const meta = document.createElement('div');
    meta.className = 'selector-meta';

    const nameEl = document.createElement('div');
    nameEl.className = 'selector-name';
    nameEl.textContent = name;

    const roleEl = document.createElement('div');
    roleEl.className = 'selector-role';
    roleEl.textContent = role;

    meta.appendChild(nameEl);
    meta.appendChild(roleEl);

    const actions = document.createElement('div');
    actions.className = 'selector-actions';

    const chatLink = document.createElement('a');
    chatLink.href = chatUrl;
    chatLink.target = '_blank';
    chatLink.rel = 'noopener';
    chatLink.className = 'selector-chat';
    chatLink.setAttribute('aria-label', `Chat with ${name}`);
    chatLink.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>';

    actions.appendChild(chatLink);

    item.appendChild(img);
    item.appendChild(meta);
    item.appendChild(actions);
    teamSelectorList.appendChild(item);
  });

  teamSelectorModal.classList.remove('hidden');
  teamSelectorModal.setAttribute('aria-hidden', 'false');
}

function closeTeamSelector() {
  if (!teamSelectorModal) return;
  teamSelectorModal.classList.add('hidden');
  teamSelectorModal.setAttribute('aria-hidden', 'true');
}

if (closeTeamSelectorBtn) closeTeamSelectorBtn.addEventListener('click', closeTeamSelector);
if (teamSelectorModal) {
  teamSelectorModal.addEventListener('click', (e) => {
    if (e.target === teamSelectorModal) closeTeamSelector();
  });
}

function toggleWorkerInfo(cardIndex) {
  const section = document.getElementById('screen-teams');
  const card = section ? section.querySelector('[data-card-index="' + cardIndex + '"]') : null;
  if (card) {
    card.classList.toggle('worker-info-expanded');
    const btn = card.querySelector('.worker-info-btn');
    if (btn) {
      btn.setAttribute('aria-expanded', card.classList.contains('worker-info-expanded'));
    }
  }
}

function initWorkerInfo() {
  const workerCards = document.querySelectorAll('.worker-card.shorts-card');
  workerCards.forEach((card) => {
    const infoBtn = card.querySelector('.worker-info-btn');
    if (infoBtn) {
      infoBtn.setAttribute('aria-expanded', 'false');
      const infoSection = card.querySelector('.worker-info');
      if (infoSection) {
        infoSection.style.visibility = '';
        infoSection.style.opacity = '';
      }
    }
  });
}

let currentRatingShopId = null;
let currentRatingValue = 0;
let currentRatingAlreadyRated = false;
let supabaseClient = null;

function getSupabase() {
  if (!supabaseClient && window.supabase && window.supabaseConfig && window.supabaseConfig.url && window.supabaseConfig.url !== 'YOUR_SUPABASE_URL') {
    supabaseClient = window.supabase.createClient(window.supabaseConfig.url, window.supabaseConfig.anonKey);
  }
  return supabaseClient;
}

function formatRatingAvg(val) {
  return val != null ? Number(val).toFixed(1) : '—';
}

function createStarSVG(filled) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.classList.add('rating-star-icon');
  if (filled) {
    svg.setAttribute('fill', '#fbbf24');
    svg.setAttribute('stroke', '#fbbf24');
  }
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z');
  svg.appendChild(path);
  return svg;
}

function renderStars(container, avg) {
  const display = container.querySelector('.stars-display');
  if (!display) return;
  display.innerHTML = '';
  const rounded = Math.round(avg || 0);
  for (let i = 0; i < 5; i++) {
    display.appendChild(createStarSVG(i < rounded));
  }
}

async function fetchAndRenderRatings() {
  const db = getSupabase();
  document.querySelectorAll('.shop-rating-display').forEach(async display => {
    const shopId = display.getAttribute('data-shop-rating-id');
    if (!shopId) return;

    if (!db) {
      const avgEl = display.querySelector('[data-rating-avg]');
      if (avgEl) avgEl.textContent = '—';
      return;
    }

    const { data, error } = await db
      .from('ratings')
      .select('rating')
      .eq('shop_id', shopId);

    if (error || !data || data.length === 0) return;

    const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
    const count = data.length;

    const avgEl = display.querySelector('[data-rating-avg]');
    const countEl = display.querySelector('[data-rating-count]');
    if (avgEl) avgEl.textContent = formatRatingAvg(avg);
    if (countEl) countEl.textContent = `(${count} ${getLang() === 'ta' ? 'வாக்குகள்' : 'votes'})`;
    renderStars(display, avg);

    const userRating = localStorage.getItem('weldwork_rating_' + shopId);
    if (userRating) {
      const labelEl = display.querySelector('.user-rated-label');
      if (labelEl) {
        const lang = getLang();
        labelEl.textContent = lang === 'ta' ? `(நீங்கள் அளித்தவை: ${userRating}★)` : `(You rated: ${userRating}★)`;
        labelEl.classList.remove('hidden');
      }
    }
  });
}

function getLang() {
  return document.documentElement.getAttribute('lang') || 'en';
}

function showRatingFeedback(msg, type) {
  const fb = document.getElementById('rating-feedback');
  if (!fb) return;
  fb.textContent = msg;
  fb.className = 'form-feedback ' + type;
  fb.classList.remove('hidden');
}

function hideRatingFeedback() {
  const fb = document.getElementById('rating-feedback');
  if (fb) fb.classList.add('hidden');
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const lang = getLang();
  return d.toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function buildStarsHtml(rating) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

async function fetchAndRenderReviews(shopId) {
  const db = getSupabase();
  const listEl = document.getElementById('reviews-list');
  const emptyEl = document.getElementById('reviews-empty');
  const countEl = document.getElementById('reviews-count');
  if (!listEl) return;

  listEl.innerHTML = '';
  if (!db) {
    if (emptyEl) { emptyEl.textContent = ''; emptyEl.classList.remove('hidden'); listEl.appendChild(emptyEl); }
    return;
  }

  const { data, error } = await db
    .from('ratings')
    .select('rating, name, message, created_at')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'reviews-empty';
    empty.textContent = getLang() === 'ta' ? 'இன்னும் விமர்சனங்கள் இல்லை' : 'No reviews yet';
    listEl.appendChild(empty);
    if (countEl) countEl.textContent = '';
    return;
  }

  if (countEl) countEl.textContent = `(${data.length})`;

  data.forEach(r => {
    const card = document.createElement('div');
    card.className = 'review-card';
    const name = r.name ? r.name : (getLang() === 'ta' ? 'அநாமதூ' : 'Anonymous');
    const msg = r.message ? `<div class="review-card-message">${r.message}</div>` : '';
    const date = r.created_at ? `<div class="review-card-date">${formatDate(r.created_at)}</div>` : '';
    card.innerHTML = `
      <div class="review-card-top">
        <span class="review-card-name">${name}</span>
        <span class="review-card-stars">${buildStarsHtml(r.rating)}</span>
      </div>
      ${msg}
      ${date}
    `;
    listEl.appendChild(card);
  });
}

function initCustomRating() {
  const ratingModal = document.getElementById('rating-modal');
  const shopNameEl = document.getElementById('rating-modal-shop-name');
  const closeBtn = document.getElementById('close-rating-modal');
  const submitBtn = document.getElementById('submit-rating-btn');
  const starBtns = document.querySelectorAll('.star-input-btn');
  const nameInput = document.getElementById('rating-name');
  const messageInput = document.getElementById('rating-message');

  fetchAndRenderRatings();

  document.querySelectorAll('.btn-rating-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const shopId = btn.getAttribute('data-shop-id');
      const shopName = btn.getAttribute('data-shop-name');
      currentRatingShopId = shopId;
      currentRatingValue = 0;

      if (shopNameEl) shopNameEl.textContent = shopName;
      hideRatingFeedback();
      starBtns.forEach(star => star.classList.remove('active'));
      if (submitBtn) submitBtn.disabled = true;
      if (nameInput) nameInput.value = '';
      if (messageInput) messageInput.value = '';

      const existingRating = localStorage.getItem('weldwork_rating_' + shopId);
      if (existingRating) {
        currentRatingValue = parseInt(existingRating);
        currentRatingAlreadyRated = true;
        highlightStars(currentRatingValue);
        if (submitBtn) submitBtn.disabled = false;
        if (getLang() === 'ta') {
          showRatingFeedback('நீங்கள் ஏற்கனவே இந்த கடைக்கு மதிப்பிட்டுள்ளீர்கள்.', 'success');
        } else {
          showRatingFeedback("You've already rated this shop.", 'success');
        }
      } else {
        currentRatingAlreadyRated = false;
      }

      if (ratingModal) {
        ratingModal.classList.remove('hidden');
        ratingModal.setAttribute('aria-hidden', 'false');
      }

      fetchAndRenderReviews(shopId);
    });
  });

  function highlightStars(rating) {
    starBtns.forEach(btn => {
      const starVal = parseInt(btn.getAttribute('data-star'));
      btn.classList.toggle('active', starVal <= rating);
    });
  }

  starBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const rating = parseInt(btn.getAttribute('data-star'));
      currentRatingValue = rating;
      highlightStars(rating);
      if (!currentRatingAlreadyRated) {
        hideRatingFeedback();
      }
      if (submitBtn) submitBtn.disabled = false;
    });
  });

  const closeRatingModal = () => {
    if (ratingModal) {
      ratingModal.classList.add('hidden');
      ratingModal.setAttribute('aria-hidden', 'true');
    }
    currentRatingShopId = null;
    currentRatingValue = 0;
    currentRatingAlreadyRated = false;
    hideRatingFeedback();
  };

  if (closeBtn) closeBtn.addEventListener('click', closeRatingModal);
  if (ratingModal) {
    ratingModal.addEventListener('click', (e) => {
      if (e.target === ratingModal) closeRatingModal();
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      if (!currentRatingShopId || currentRatingValue <= 0) return;

      const db = getSupabase();
      if (!db) {
        showRatingFeedback(getLang() === 'ta' ? 'மதிப்பீட்டு சேவை தற்போது கிடைக்கவில்லை.' : 'Rating service is currently unavailable.', 'error');
        return;
      }

      const existingRating = localStorage.getItem('weldwork_rating_' + currentRatingShopId);
      if (existingRating) {
        showRatingFeedback(getLang() === 'ta' ? 'நீங்கள் ஏற்கனவே இந்த கடைக்கு மதிப்பிட்டுள்ளீர்கள்.' : "You've already rated this shop.", 'success');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = getLang() === 'ta' ? 'சமர்ப்பிக்கிறது...' : 'Submitting...';

      const payload = {
        shop_id: currentRatingShopId,
        rating: currentRatingValue,
        name: nameInput ? nameInput.value.trim() : null,
        message: messageInput ? messageInput.value.trim() : null,
      };

      try {
        const { error } = await db.from('ratings').insert(payload);
        if (error) throw error;

        localStorage.setItem('weldwork_rating_' + currentRatingShopId, currentRatingValue);
        showRatingFeedback(getLang() === 'ta' ? 'உங்கள் விமர்சனத்திற்கு நன்றி!' : 'Thank you for your review!', 'success');

        await fetchAndRenderRatings();
        await fetchAndRenderReviews(currentRatingShopId);

        setTimeout(closeRatingModal, 2000);
      } catch (err) {
        console.error('Rating submit error:', err);
        showRatingFeedback(getLang() === 'ta' ? 'ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.' : 'Something went wrong. Please try again.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = getLang() === 'ta' ? 'சமர்ப்பிக்கவும்' : 'Submit';
      }
    });
  }
}

function initGlobalSearch() {
  const overlay = document.getElementById('global-search-overlay');
  const input = document.getElementById('global-search-input');
  const closeBtn = document.getElementById('global-search-close');
  const body = document.getElementById('global-search-body');
  const emptyState = document.getElementById('global-search-empty');
  const centerBtn = document.getElementById('app-center-btn');
  const centerWrap = document.getElementById('nav-tab-center');
  if (!overlay || !input || !centerBtn) return;

  const lang = getLang();
  const ta = lang === 'ta';

  const PAGE_LINKS = [
    { screen: 'home', title: ta ? 'முகப்பு' : 'Home', icon: 'home', sub: ta ? 'முகப்பு பக்கம்' : 'Home page' },
    { screen: 'catalogue', title: ta ? 'பட்டியல்' : 'Catalogue', icon: 'layers', sub: ta ? 'சேவைகள் & விலைப்பட்டியல்' : 'Services & pricing' },
    { screen: 'teams', title: ta ? 'குழு' : 'Team', icon: 'users', sub: ta ? 'எங்கள் குழு உறுப்பினர்கள்' : 'Our team members' },
    { screen: 'about', title: ta ? 'எங்களைப் பற்றி' : 'About Us', icon: 'info', sub: ta ? 'நிறுவன விவரம்' : 'Company info' },
  ];

  const LONG_PRESS_MS = 500;
  let pressTimer = null;
  let didLongPress = false;
  let isOverlayOpen = false;

  function openSearch() {
    if (isOverlayOpen) return;
    isOverlayOpen = true;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    input.value = '';
    renderResults('');
    setTimeout(() => input.focus(), 100);
  }

  function closeSearch() {
    if (!isOverlayOpen) return;
    isOverlayOpen = false;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    input.value = '';
    input.blur();
  }

  function navigateTo(screen) {
    const lang2 = window.location.pathname.startsWith('/ta') ? 'ta' : 'en';
    if (screens[screen]) {
      const path = `/${lang2}${screens[screen].path}`;
      history.pushState({ screen }, '', path);
      switchScreen(screen);
    }
  }

  function scrollToCard(selector) {
    const screen = document.querySelector('.screen-view.active');
    if (!screen) return;
    const card = screen.querySelector(selector);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.style.transition = 'box-shadow 0.3s';
      card.style.boxShadow = '0 0 0 2px var(--accent-color)';
      setTimeout(() => { card.style.boxShadow = ''; }, 1500);
    }
  }

  function renderResults(query) {
    if (!body) return;
    const q = query.trim().toLowerCase();

    const serviceCards = document.querySelectorAll('#screen-catalogue .service-card');
    const workerCards = document.querySelectorAll('#screen-teams .worker-card');

    let serviceResults = [];
    if (q.length > 0) {
      serviceCards.forEach(card => {
        const search = (card.getAttribute('data-search') || '').toLowerCase();
        if (search.includes(q)) {
          const title = card.querySelector('.catalogue-quote-title')?.textContent?.trim() || '';
          const cat = card.getAttribute('data-item-category') || '';
          if (title) serviceResults.push({ title, sub: cat, cardId: card.id });
        }
      });
    }

    let teamResults = [];
    if (q.length > 0) {
      workerCards.forEach(card => {
        const name = card.querySelector('.worker-header-meta h3')?.textContent?.trim() || '';
        const role = card.querySelector('.worker-role')?.textContent?.trim() || '';
        const combined = (name + ' ' + role).toLowerCase();
        if (combined.includes(q)) {
          teamResults.push({ title: name, sub: role, cardId: card.id });
        }
      });
    }

    let pageResults = [];
    if (q.length > 0) {
      PAGE_LINKS.forEach(p => {
        if (p.title.toLowerCase().includes(q)) {
          pageResults.push(p);
        }
      });
    }

    const totalResults = serviceResults.length + teamResults.length + pageResults.length;

    if (emptyState) {
      emptyState.classList.toggle('hidden', q.length === 0);
    }

    const existingGroups = body.querySelectorAll('.gs-group, .gs-no-results');
    existingGroups.forEach(el => el.remove());

    if (q.length === 0) {
      body.scrollTop = 0;
      return;
    }

    if (totalResults === 0) {
      const noRes = document.createElement('div');
      noRes.className = 'gs-no-results';
      noRes.innerHTML = '<i data-lucide="search-x" class="gs-no-results-icon"></i><span class="gs-no-results-text">' + (ta ? 'நபரங்கள் கிடைக்கவில்லை' : 'No results found') + '</span>';
      body.appendChild(noRes);
      if (window.lucide?.createIcons) window.lucide.createIcons();
      return;
    }

    function buildGroup(label, icon, items) {
      if (items.length === 0) return null;
      const group = document.createElement('div');
      group.className = 'gs-group';
      group.innerHTML = '<div class="gs-group-label">' + label + '</div>';
      items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'gs-result';
        row.innerHTML =
          '<div class="gs-result-icon"><i data-lucide="' + icon + '"></i></div>' +
          '<div class="gs-result-info"><div class="gs-result-title">' + escapeHtml(item.title) + '</div>' +
          (item.sub ? '<div class="gs-result-sub">' + escapeHtml(item.sub) + '</div>' : '') +
          '</div><i data-lucide="chevron-right" class="gs-result-arrow"></i>';
        row.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (item.cardId) {
            const isService = item.cardId.startsWith('card-');
            navigateTo(isService ? 'catalogue' : 'teams');
            setTimeout(() => scrollToCard('#' + item.cardId), 350);
          } else if (item.screen) {
            navigateTo(item.screen);
          }
          setTimeout(closeSearch, 50);
        });
        group.appendChild(row);
      });
      return group;
    }

    const serviceGroup = buildGroup(ta ? 'சேவைகள்' : 'Services', 'wrench', serviceResults);
    const teamGroup = buildGroup(ta ? 'குழு' : 'Team', 'users', teamResults);
    const pageGroup = buildGroup(ta ? 'பக்கங்கள்' : 'Pages', 'file-text', pageResults);

    if (serviceGroup) body.appendChild(serviceGroup);
    if (teamGroup) body.appendChild(teamGroup);
    if (pageGroup) body.appendChild(pageGroup);

    if (window.lucide?.createIcons) window.lucide.createIcons();
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  centerBtn.addEventListener('pointerdown', (e) => {
    if (centerBtn.classList.contains('is-scroll-top')) return;
    didLongPress = false;
    if (centerWrap) centerWrap.classList.add('is-long-pressing');
    centerBtn.classList.add('is-long-press');
    pressTimer = setTimeout(() => {
      didLongPress = true;
      centerBtn.classList.remove('is-long-press');
      openSearch();
    }, LONG_PRESS_MS);
  });

  const cancelPress = () => {
    clearTimeout(pressTimer);
    pressTimer = null;
    centerBtn.classList.remove('is-long-press');
    if (centerWrap) centerWrap.classList.remove('is-long-pressing');
  };

  centerBtn.addEventListener('pointerup', cancelPress);
  centerBtn.addEventListener('pointercancel', cancelPress);
  centerBtn.addEventListener('pointerleave', cancelPress);

  centerBtn.addEventListener('click', (e) => {
    if (didLongPress) {
      e.preventDefault();
      e.stopPropagation();
      didLongPress = false;
    }
  }, true);

  if (closeBtn) closeBtn.addEventListener('click', closeSearch);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeSearch();
  });

  input.addEventListener('input', () => renderResults(input.value));

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSearch();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOverlayOpen) closeSearch();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
  initTheme();
  initRouting();
  initScrollWatcher();
  initPhotoAlbum();
  initDetailsDrawer();
  initContactModal();
  initQuoteModal();
  initGlobalSearch();
  initShortsCards();
  initVideoFallback();
  initHoursToggle();
  initWorkerInfo();
  initVideoLightbox();
  initCustomRating();
  initCompanyFilter();
});

function initCompanyFilter() {
  const lang = getLang();
  const params = new URLSearchParams(window.location.search);
  const companySlug = params.get('company');

  // Build slug -> {logo, name} map from rendered buttons so back/popstate
  // and direct ?company= loads still show correct company info.
  window.__companyMeta = {};
  document.querySelectorAll('.btn-products').forEach(btn => {
    const slug = btn.getAttribute('data-company-slug');
    if (!slug) return;
    window.__companyMeta[slug] = {
      logo: btn.getAttribute('data-company-logo') || '',
      name: btn.getAttribute('data-company-name') || slug
    };
  });

  document.querySelectorAll('.btn-products').forEach(btn => {
    btn.addEventListener('click', () => {
      const slug = btn.getAttribute('data-company-slug');
      if (!slug) return;
      const path = `/${lang}/catalogue/`;
      history.pushState({ screen: 'catalogue', company: slug }, '', `${path}?company=${slug}`);
      applyCompanyFilter(slug);
      switchScreen('catalogue');
    });
  });

  const filterBack = document.getElementById('company-filter-back');
  if (filterBack) {
    filterBack.addEventListener('click', () => {
      const path = `/${lang}/catalogue/`;
      history.pushState({ screen: 'catalogue' }, '', path);
      applyCompanyFilter(null);
    });
  }

  if (companySlug) {
    applyCompanyFilter(companySlug);
  }
}

function applyCompanyFilter(slug) {
  const filterBar = document.getElementById('company-filter-bar');
  const filterLogo = document.getElementById('company-filter-logo');
  const filterName = document.getElementById('company-filter-name');
  const filterCount = document.getElementById('company-filter-count');
  const filterBack = document.getElementById('company-filter-back');
  const cards = document.querySelectorAll('#screen-catalogue .service-card');
  let emptyMsg = document.getElementById('company-empty-msg');

  if (!emptyMsg) {
    emptyMsg = document.createElement('div');
    emptyMsg.id = 'company-empty-msg';
    emptyMsg.className = 'company-empty-msg hidden';
    const grid = document.querySelector('#screen-catalogue .services-grid');
    if (grid) grid.parentNode.insertBefore(emptyMsg, grid.nextSibling);
  }

  const lang = getLang();
  const tCount = lang === 'ta' ? 'தயாரிப்புகள்' : 'products';

  // Count matching products directly from the DOM (single source of truth)
  let matchCount = 0;
  cards.forEach(card => {
    if (slug && card.getAttribute('data-company') === slug) matchCount++;
  });

  if (filterBar) {
    if (slug) {
      filterBar.classList.remove('hidden');
      const meta = (window.__companyMeta && window.__companyMeta[slug]) || {};
      if (filterLogo) {
        const logo = meta.logo || '';
        filterLogo.alt = meta.name || '';
        if (logo) {
          filterLogo.src = logo;
          filterLogo.style.display = 'block';
        } else {
          filterLogo.removeAttribute('src');
          filterLogo.style.display = 'none';
        }
      }
      if (filterName) {
        filterName.textContent = meta.name || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
      if (filterCount) {
        filterCount.textContent = `${matchCount} ${tCount}`;
      }
    } else {
      filterBar.classList.add('hidden');
    }
  }

  if (filterBack) {
    filterBack.classList.toggle('hidden', !slug);
  }

  let visibleCount = 0;
  cards.forEach(card => {
    card.classList.add('filter-animate');
    const cardCompany = card.getAttribute('data-company');
    const show = !slug || cardCompany === slug;
    card.classList.toggle('filter-hidden', !show);
    if (show) visibleCount++;
  });

  if (slug) {
    emptyMsg.textContent = lang === 'ta' ? 'இந்த நிறுவனத்திற்கு தயாரிப்புகள் இல்லை' : 'No products found for this company';
    emptyMsg.classList.toggle('hidden', visibleCount > 0);
  } else {
    emptyMsg.classList.add('hidden');
  }
}

function extractYouTubeId(url) {
  if (!url) return null;
  url = url.trim();
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  return null;
}

function isShortsUrl(url) {
  if (!url) return false;
  return /youtube\.com\/shorts\//.test(url.trim());
}

function setVideoAspect(isVertical) {
  const wrapper = document.querySelector('.video-wrapper');
  const container = document.querySelector('.video-container');
  if (!wrapper || !container) return;

  if (isVertical) {
    container.classList.add('video-vertical');
    container.classList.remove('video-horizontal');
    wrapper.style.paddingBottom = '177.78%';
  } else {
    container.classList.add('video-horizontal');
    container.classList.remove('video-vertical');
    wrapper.style.paddingBottom = '56.25%';
  }
}

function initVideoLightbox() {
  const videoLightbox = document.getElementById('video-lightbox');
  const videoIframe = document.getElementById('video-iframe');
  const closeVideoBtn = document.getElementById('close-video');

  if (!videoLightbox || !videoIframe || !closeVideoBtn) return;

  document.querySelectorAll('.btn-youtube').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-youtube');
      const videoId = extractYouTubeId(url);
      if (!videoId) return;
      const vertical = isShortsUrl(url);
      setVideoAspect(vertical);
      videoIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      videoLightbox.classList.remove('hidden');
      videoLightbox.setAttribute('aria-hidden', 'false');
    });
  });

  const closeVideoLightbox = () => {
    videoIframe.src = '';
    videoLightbox.classList.add('hidden');
    videoLightbox.setAttribute('aria-hidden', 'true');
    const container = document.querySelector('.video-container');
    if (container) {
      container.classList.remove('video-vertical', 'video-horizontal');
    }
  };

  closeVideoBtn.addEventListener('click', closeVideoLightbox);
  videoLightbox.addEventListener('click', (e) => {
    if (e.target === videoLightbox) closeVideoLightbox();
  });
}
