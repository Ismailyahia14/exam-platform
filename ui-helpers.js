import { getDarkMode, setDarkMode } from './storage.js';

export function initializeDarkMode() {
    const toggle = document.getElementById('darkModeToggle');
    if (!toggle) return;

    if (getDarkMode()) {
        document.body.setAttribute('data-theme', 'dark');
        toggle.innerHTML = '<i class="fas fa-sun"></i>';
        toggle.setAttribute('aria-label', 'الوضع النهاري');
    } else {
        toggle.innerHTML = '<i class="fas fa-moon"></i>';
        toggle.setAttribute('aria-label', 'الوضع الليلي');
    }

    toggle.addEventListener('click', () => {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.body.removeAttribute('data-theme');
            toggle.innerHTML = '<i class="fas fa-moon"></i>';
            toggle.setAttribute('aria-label', 'الوضع الليلي');
            setDarkMode(false);
        } else {
            document.body.setAttribute('data-theme', 'dark');
            toggle.innerHTML = '<i class="fas fa-sun"></i>';
            toggle.setAttribute('aria-label', 'الوضع النهاري');
            setDarkMode(true);
        }
    });
}