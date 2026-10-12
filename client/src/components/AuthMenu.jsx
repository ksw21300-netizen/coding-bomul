import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = 'http://localhost:4000';

function storedToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function clearToken() {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
}

function AuthMenu() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(() => Boolean(storedToken()));
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const token = storedToken();
    if (!token) return;

    let ignore = false;
    fetch(`${API_BASE}/api/me`, { headers: { authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (ignore) return;
        if (response.ok) {
          setUser(await response.json());
        } else {
          clearToken();
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setChecking(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(event) {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setMenuOpen(false);
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  function logout() {
    clearToken();
    setMenuOpen(false);
    setUser(null);
  }

  if (checking) return null;

  if (user) {
    return (
      <>
        <Link className="btn btn-ghost btn-sm" to="/admin">
          어드민
        </Link>
        <div className="user-menu" ref={menuRef}>
          <button
            type="button"
            className="user-menu-button"
            aria-expanded={menuOpen}
            aria-controls="user-menu-list"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {user.name} 님 반갑습니다
            <span className="user-menu-caret" aria-hidden="true">▾</span>
          </button>
        {menuOpen ? (
          <div className="user-menu-list" id="user-menu-list">
            <button type="button" onClick={logout}>
              로그아웃
            </button>
          </div>
        ) : null}
        </div>
      </>
    );
  }

  return (
    <div className="nav-auth">
      <Link className="btn btn-ghost btn-sm" to="/login">
        로그인
      </Link>
      <Link className="btn btn-primary btn-sm" to="/signup">
        회원가입
      </Link>
    </div>
  );
}

export default AuthMenu;
