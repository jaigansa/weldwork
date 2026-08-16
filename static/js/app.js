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
  teams: { id: 'screen-teams', path: '/teams/' }
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
        }
      } else {
        el.classList.remove('active');
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
        history.pushState({ screen: targetScreen }, '', screens[targetScreen].path);
        switchScreen(targetScreen);
      }
    });
  });

  const logoBtn = document.getElementById('header-logo-btn');
  if (logoBtn) {
    logoBtn.addEventListener('click', () => {
      history.pushState({ screen: 'home' }, '', screens.home.path);
      switchScreen('home');
    });
  }

  document.querySelectorAll('[data-team-trigger], [data-worker-trigger]').forEach(tag => {
    tag.addEventListener('click', () => {
      history.pushState({ screen: 'teams' }, '', screens.teams.path);
      switchScreen('teams');
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
  if (currentPath === '/catalogue/' || currentPath === '/catalogue' || currentPath === '/services/' || currentPath === '/services') {
    switchScreen('catalogue');
  } else if (currentPath === '/teams/' || currentPath === '/teams' || currentPath === '/workers/' || currentPath === '/workers') {
    switchScreen('teams');
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
  document.querySelectorAll('.product-feature-media').forEach(media => {
    media.addEventListener('click', () => {
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
    }
    if (photoLightbox && !photoLightbox.classList.contains('hidden')) {
      if (e.key === 'ArrowRight') nextAlbumPhoto();
      if (e.key === 'ArrowLeft') prevAlbumPhoto();
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
const drawerCert = document.getElementById('drawer-cert');
const drawerMaterials = document.getElementById('drawer-materials');
const drawerBrief = document.getElementById('drawer-brief');

function openDetailsDrawer(btn) {
  if (!detailsDrawer) return;

  if (drawerCategory) drawerCategory.textContent = btn.dataset.category || 'Custom Fabrication';
  if (drawerTitle) drawerTitle.textContent = btn.dataset.title || 'Product Details';
  if (drawerRate) drawerRate.textContent = btn.dataset.rate || '₹0';
  if (drawerRateType) drawerRateType.textContent = btn.dataset.rateType || 'Fixed Labour Rate';
  if (drawerRateDate) drawerRateDate.textContent = `as of ${btn.dataset.rateDate || 'Today'}`;
  if (drawerLead) drawerLead.textContent = btn.dataset.lead || '2 – 4 Days';
  if (drawerCert) drawerCert.textContent = btn.dataset.certifications || 'AWS Certified';

  if (drawerMaterials) {
    drawerMaterials.innerHTML = '';
    const mats = (btn.dataset.materials || '').split(',');
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
    drawerBrief.textContent = btn.dataset.brief || '';
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
  document.querySelectorAll('.open-details-btn').forEach(btn => {
    btn.addEventListener('click', () => {
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

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
  initTheme();
  initRouting();
  initScrollWatcher();
  initPhotoAlbum();
  initDetailsDrawer();
});
