/**
 * This script runs in <head> before React hydrates
 * to prevent flash of unstyled content (FOUC)
 *
 * It reads the theme from localStorage and applies the appropriate
 * class to the document element immediately.
 */
export const themeScript = `
(function() {
  try {
    // Try to access localStorage (may fail in private browsing or due to quota)
    if (typeof localStorage === 'undefined') {
      throw new Error('localStorage not available');
    }

    var theme = localStorage.getItem('ui-storage');
    if (theme) {
      var parsed = JSON.parse(theme);
      var userTheme = parsed.state?.theme || 'system';

      if (userTheme === 'system') {
        var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', systemDark);
      } else {
        document.documentElement.classList.toggle('dark', userTheme === 'dark');
      }
    } else {
      // Default to system preference
      var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', systemDark);
    }
  } catch (e) {
    // Fallback to system preference on any error
    // (localStorage quota exceeded, private browsing, JSON parse error, etc.)
    try {
      var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', systemDark);
    } catch (matchMediaError) {
      // Ultimate fallback: default to light mode
      document.documentElement.classList.remove('dark');
    }
  }
})();
`
