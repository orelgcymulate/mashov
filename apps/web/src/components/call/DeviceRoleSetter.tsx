'use client';

import { useEffect } from 'react';

/**
 * Persists `device=tablet` from the URL into a long-lived cookie so the wall
 * tablet keeps its role across reboots and reloads. Rendered once in the dash
 * layout; reads the URL on mount and no-ops if the param is absent.
 */
export function DeviceRoleSetter() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('device') === 'tablet') {
      // 5 years, root path. Not HttpOnly — we don't need server-only access.
      document.cookie = 'mashov_device=tablet; path=/; max-age=157680000; samesite=lax';
    }
  }, []);
  return null;
}
