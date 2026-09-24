import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export function useFocusMainOnRouteChange() {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const main = document.getElementById('main-content');
    main?.focus();
  }, [location.pathname]);
}
