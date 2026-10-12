import { Link, NavLink } from 'react-router-dom';
import AuthMenu from './AuthMenu.jsx';
import CartLink from './CartLink.jsx';

function SiteNav({ onToggleTheme }) {
  return (
    <header className="nav">
      <div className="wrap">
        <Link className="brand" to="/">
          <span className="seal">寶</span>보물 여행
        </Link>
        <nav>
          <NavLink to="/" end>
            홈
          </NavLink>
          <NavLink to="/courses">전체 코스</NavLink>
          <NavLink to="/apply">신청·문의</NavLink>
        </nav>
        <div className="nav-tools">
          <button className="toggle" type="button" onClick={onToggleTheme}>
            ◑ 테마
          </button>
          <AuthMenu />
          <CartLink />
        </div>
      </div>
    </header>
  );
}

export default SiteNav;
