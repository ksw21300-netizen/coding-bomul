import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SiteNav from './SiteNav.jsx';
import { useBomulTheme } from './useBomulTheme.js';
import '../bomul.css';

function BomulLayout() {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useBomulTheme();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="bomul" data-theme={theme ?? undefined}>
      <SiteNav onToggleTheme={toggleTheme} />

      <main>
        <Outlet />
      </main>

      <footer>
        <div className="wrap">
          <div>보물 여행 · 역사와 설화를 찾아 떠나는 전설여행</div>
          <div>예시 페이지 (프로토타입)</div>
        </div>
      </footer>
    </div>
  );
}

export default BomulLayout;
