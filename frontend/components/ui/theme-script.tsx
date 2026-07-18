/**
 * Inline script that runs before React hydration to prevent theme flash.
 * Reads from localStorage and applies the correct class to <html>.
 */
export function ThemeScript() {
  const script = `
    (function() {
      try {
        var stored = localStorage.getItem('lingoquest-ui');
        var parsed = stored ? JSON.parse(stored) : null;
        var theme = parsed && parsed.state && parsed.state.theme;
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (theme === 'system') {
          if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
          }
        }
      } catch(e) {}
    })();
  `

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  )
}
