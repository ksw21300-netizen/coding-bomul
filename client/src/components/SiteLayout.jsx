import { Outlet, useLocation } from 'react-router-dom';
import SiteNav from './SiteNav.jsx';
import { useBomulTheme } from './useBomulTheme.js';
import '../bomul.css';

function SiteLayout() {
  const location = useLocation();
  const isSignup = location.pathname === '/signup';
  const isLogin = location.pathname.startsWith('/login');
  const isLoginPage = location.pathname === '/login';
  const { theme, toggleTheme } = useBomulTheme();

  return (
    <div className="site">
      {isLoginPage ? (
        <div className="bomul bomul-bar" data-theme={theme ?? undefined}>
          <SiteNav onToggleTheme={toggleTheme} />
        </div>
      ) : null}
      {isLogin ? null : <p className="top-phrase">회원가입</p>}
      {isSignup ? (
        <header className="site-header">
          <div className="header-inner">
            <h1 className="page-title">회원가입</h1>
          </div>
        </header>
      ) : null}

      <main className="site-main">
        <Outlet />
      </main>
    </div>
  );
}

export default SiteLayout;
