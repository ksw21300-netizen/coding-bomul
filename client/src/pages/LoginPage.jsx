import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:4000';

function storedToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ user_id: '', password: '', remember: false });
  const [error, setError] = useState(() => location.state?.error ?? '');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);
  const [checking, setChecking] = useState(() => Boolean(storedToken()));

  useEffect(() => {
    const token = storedToken();
    if (!token) return;

    let ignore = false;
    fetch(`${API_BASE}/api/me`, { headers: { authorization: `Bearer ${token}` } })
      .then((response) => {
        if (ignore) return;
        if (response.ok) {
          navigate('/', { replace: true });
          return;
        }
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        setChecking(false);
      })
      .catch(() => {
        if (!ignore) setChecking(false);
      });

    return () => {
      ignore = true;
    };
  }, [navigate]);

  function update(event) {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  function startNaverLogin() {
    sessionStorage.setItem('naver_remember', form.remember ? '1' : '0');
    window.location.assign(`${API_BASE}/api/login/naver`);
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setPending(true);
    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ user_id: form.user_id, password: form.password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.message || '로그인에 실패했습니다.');
        return;
      }
      const storage = form.remember ? localStorage : sessionStorage;
      const other = form.remember ? sessionStorage : localStorage;
      storage.setItem('token', data.token);
      other.removeItem('token');
      navigate('/', { replace: true });
    } catch {
      setError('서버에 연결하지 못했습니다. 서버가 실행 중인지 확인해 주세요.');
    } finally {
      setPending(false);
    }
  }

  if (checking) return <section className="login-page" />;

  return (
    <section className="login-page">
      <form className="login-card" onSubmit={onSubmit}>
        <h1>로그인</h1>
        <p className="login-lead">카카오로 간편하게 시작하세요</p>
        <p className="login-switch">
          아직 회원이 아니신가요? <Link to="/signup">회원가입</Link>
        </p>

        <div className="login-divider">다른 방법으로 로그인</div>

        <div className="login-methods">
          <button type="button" className="method method-id" aria-pressed="true">
            <span className="method-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="28" height="28">
                <circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M6.5 18.5c1.2-2.4 3.1-3.6 5.5-3.6s4.3 1.2 5.5 3.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            아이디
          </button>
          <button type="button" className="method" onClick={startNaverLogin}>
            <span className="method-icon method-naver" aria-hidden="true">N</span>
            네이버
          </button>
        </div>

        <label className="sr-only" htmlFor="user_id">아이디</label>
        <input
          id="user_id"
          name="user_id"
          value={form.user_id}
          onChange={update}
          autoComplete="username"
          placeholder="아이디"
          required
        />

        <label className="sr-only" htmlFor="password">비밀번호</label>
        <input
          id="password"
          name="password"
          type="password"
          value={form.password}
          onChange={update}
          autoComplete="current-password"
          placeholder="비밀번호"
          required
        />

        {error ? <p className="form-error" role="alert">{error}</p> : null}
        {notice ? <p className="login-notice">{notice}</p> : null}

        <button className="submit-button login-submit" type="submit" disabled={pending}>
          {pending ? '로그인 중' : '로그인'}
        </button>

        <div className="login-footer">
          <label>
            <input type="checkbox" name="remember" checked={form.remember} onChange={update} />
            자동로그인
          </label>
          <button type="button" className="find-button" onClick={() => setNotice('ID/비밀번호 찾기는 준비 중입니다.')}>
            ID/비밀번호 찾기
          </button>
        </div>
      </form>
    </section>
  );
}

export default LoginPage;
