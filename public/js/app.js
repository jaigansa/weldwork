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
        const container = el.querySelector('.screen-scroll-container');
        if (container) {
          checkScrollPosition(container.scrollTop);
          if (container._indicator) container._indicator.classList.add('visible');
        }
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

function checkScrollPosition(scrollTop) {
  const centerBtn = document.getElementById('app-center-btn');
  if (!centerBtn) return;
  if (scrollTop > 120) {
    centerBtn.classList.add('is-scroll-top');
    centerBtn.setAttribute('aria-label', 'Back to top');
  } else {
    centerBtn.classList.remove('is-scroll-top');
    centerBtn.setAttribute('aria-label', 'Product Catalogue');
  }
}

function initRouting() {
  document.querySelectorAll('[data-screen]').forEach(button => {
    button.addEventListener('click', (e) => {
      const centerBtn = document.getElementById('app-center-btn');
      if (button === centerBtn && centerBtn.classList.contains('is-scroll-top')) {
        e.preventDefault();
        e.stopPropagation();
        const activeScreenContainer = document.querySelector('.screen-view.active .screen-scroll-container');
        if (activeScreenContainer) {
          activeScreenContainer.scrollTo({ top: 0, behavior: 'smooth' });
        }
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
    if (e.state && e.state.screen && screens[e.state.screen]) {
      switchScreen(e.state.screen);
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
}

const photoLightbox = document.getElementById('photo-lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const lightboxCounter = document.getElementById('lightbox-counter');
const lightboxDots = document.getElementById('lightbox-dots');
const closeLightboxBtn = document.getElementById('close-lightbox');
const prevPhotoBtn = document.getElementById('lightbox-prev');
const nextPhotoBtn = document.getElementById('lightbox-next');

let currentAlbumImages = [];
let currentAlbumIndex = 0;
let currentAlbumTitle = '';

function renderAlbumImage() {
  if (!currentAlbumImages.length || !lightboxImg) return;
  lightboxImg.src = currentAlbumImages[currentAlbumIndex];
  if (lightboxCaption) lightboxCaption.textContent = currentAlbumTitle;
  if (lightboxCounter) lightboxCounter.textContent = `${currentAlbumIndex + 1} / ${currentAlbumImages.length}`;

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
}

function closePhotoLightbox() {
  if (!photoLightbox) return;
  photoLightbox.classList.add('hidden');
  photoLightbox.setAttribute('aria-hidden', 'true');
  if (lightboxImg) lightboxImg.src = '';
  currentAlbumImages = [];
}

let touchStartX = 0;
let touchEndX = 0;

function handleTouchStart(e) {
  touchStartX = e.changedTouches[0].screenX;
}

function handleTouchEnd(e) {
  touchEndX = e.changedTouches[0].screenX;
  if (touchStartX - touchEndX > 50) {
    nextAlbumPhoto();
  } else if (touchEndX - touchStartX > 50) {
    prevAlbumPhoto();
  }
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

  if (photoLightbox) {
    photoLightbox.addEventListener('click', (e) => {
      if (e.target === photoLightbox) {
        closePhotoLightbox();
      }
    });

    photoLightbox.addEventListener('touchstart', handleTouchStart, { passive: true });
    photoLightbox.addEventListener('touchend', handleTouchEnd, { passive: true });
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
    }
    if (photoLightbox && !photoLightbox.classList.contains('hidden')) {
      const activeTag = document.activeElement ? document.activeElement.tagName : '';
      if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA' && activeTag !== 'SELECT') {
        if (e.key === 'ArrowRight') nextAlbumPhoto();
        if (e.key === 'ArrowLeft') prevAlbumPhoto();
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
  if (drawerRateType) drawerRateType.textContent = btn.getAttribute('data-rate-type') || 'Fixed Labour Rate';
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
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const hour = now.getHours();
  const minute = now.getMinutes();
  const timeInMinutes = hour * 60 + minute;

  if (day >= 1 && day <= 5) {
    // Mon - Fri: 8:30 AM to 8:00 PM
    return timeInMinutes >= 510 && timeInMinutes <= 1200;
  } else if (day === 6) {
    // Saturday: 8:30 AM to 7:30 PM
    return timeInMinutes >= 510 && timeInMinutes <= 1170;
  } else if (day === 0) {
    // Sunday: 9:00 AM to 1:30 PM
    return timeInMinutes >= 540 && timeInMinutes <= 810;
  }
  return false;
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
        const lang = document.documentElement.getAttribute('lang') || 'en';
        if (lang === 'ta') {
          alert('எங்கள் விசாரிப்பு சேவை வேலை நேரங்களில் மட்டுமே கிடைக்கும்:\nதிங்கள்-வெள்ளி: 8:30 AM - 8:00 PM\nசனி: 8:30 AM - 7:30 PM\nஞாயிறு: 9:00 AM - 1:30 PM');
        } else {
          alert('Our Enquiry Support is only available during working hours:\nMon-Fri: 8:30 AM - 8:00 PM\nSat: 8:30 AM - 7:30 PM\nSun: 9:00 AM - 1:30 PM');
        }
        return;
      }
      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');

      if (typeof turnstile !== 'undefined' && !modal.dataset.turnstileRendered) {
        const sitekey = modal.querySelector('input[name="access_key"]')?.value;
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
  if (!supabaseClient && window.supabase && window.supabaseConfig && window.supabaseConfig.url !== 'YOUR_SUPABASE_URL') {
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
  initShortsCards();
  initVideoFallback();
  initHoursToggle();
  initWorkerInfo();
  initVideoLightbox();
  initCustomRating();
});

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
