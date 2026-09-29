import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export function useFocusMainOnRouteChange() {
  const { pathname } = useLocation();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    document.getElementById('main-content')?.focus();
  }, [pathname]);
}