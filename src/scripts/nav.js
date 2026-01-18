export function setupNav() {
  const navButton = document.querySelector('.navbar-icon-button');
  const navMenu = document.querySelector('.w-nav-menu');
  const sidebar = document.querySelector('.sidebar');

  if (!navButton || !navMenu) return;

  // Create backdrop overlay
  let backdrop = document.querySelector('.nav-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    document.body.appendChild(backdrop);
  }

  const openNav = () => {
    navMenu.classList.add('is-visible');
    navButton.classList.add('is-active');
    backdrop.classList.add('is-visible');
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      navMenu.classList.add('is-open');
      backdrop.classList.add('is-open');
    });
  };

  const closeNav = () => {
    navMenu.classList.remove('is-open');
    navButton.classList.remove('is-active');
    backdrop.classList.remove('is-open');
    document.body.style.overflow = '';

    setTimeout(() => {
      navMenu.classList.remove('is-visible');
      backdrop.classList.remove('is-visible');
    }, 300);
  };

  const toggleNav = () => {
    const isOpen = navMenu.classList.contains('is-open');
    if (isOpen) {
      closeNav();
    } else {
      openNav();
    }
  };

  // Close on backdrop click
  const handleBackdropClick = () => {
    closeNav();
  };

  // Close on nav link click
  const handleNavLinkClick = (e) => {
    if (e.target.closest('.nav-link-container')) {
      closeNav();
    }
  };

  // Close on escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
      closeNav();
    }
  };

  navButton.addEventListener('click', toggleNav);
  backdrop.addEventListener('click', handleBackdropClick);
  navMenu.addEventListener('click', handleNavLinkClick);
  document.addEventListener('keydown', handleEscape);

  return () => {
    navButton.removeEventListener('click', toggleNav);
    backdrop.removeEventListener('click', handleBackdropClick);
    navMenu.removeEventListener('click', handleNavLinkClick);
    document.removeEventListener('keydown', handleEscape);
    if (backdrop && backdrop.parentNode) {
      backdrop.parentNode.removeChild(backdrop);
    }
    document.body.style.overflow = '';
  };
}
