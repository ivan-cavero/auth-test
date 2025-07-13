// @ts-ignore - provided by Nuxt at runtime
import { defineNuxtPlugin } from '#app'

// Nuxt plugin to automatically add the X-CSRF-Token header (double-submit cookie pattern)
export default defineNuxtPlugin(() => {
  // Ensure running in browser
  if (typeof window === 'undefined') return

  const unsafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE']
  const originalFetch: typeof window.fetch = window.fetch.bind(window)

  /**
   * Extract the value of a cookie by name.
   */
  function getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name.replace(/[-.+*?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : null
  }

  // Override global fetch
  window.fetch = (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
    const method = (init.method || (input instanceof Request ? input.method : 'GET')).toUpperCase()

    // Always send cookies unless explicitly configured
    if (!init.credentials) {
      init.credentials = 'include'
    }

    // Add CSRF header on state-changing requests
    if (unsafeMethods.indexOf(method) !== -1) {
      const token = getCookie('csrf_token')
      if (token) {
        if (init.headers instanceof Headers) {
          init.headers.set('X-CSRF-Token', token)
        } else {
          init.headers = {
            ...(init.headers as Record<string, string> | undefined),
            'X-CSRF-Token': token
          }
        }
      }
    }

    return originalFetch(input, init)
  }
}) 