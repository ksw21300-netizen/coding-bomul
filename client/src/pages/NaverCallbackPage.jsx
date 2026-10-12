import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function NaverCallbackPage() {
  const navigate = useNavigate();
  const [result] = useState(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    return {
      token: params.get('token'),
      error: params.get('error'),
      remember: sessionStorage.getItem('naver_remember') === '1',
    };
  });

  useEffect(() => {
    sessionStorage.removeItem('naver_remember');
    if (result.token) {
      const storage = result.remember ? localStorage : sessionStorage;
      const other = result.remember ? sessionStorage : localStorage;
      storage.setItem('token', result.token);
      other.removeItem('token');
      navigate('/', { replace: true });
      return;
    }
    navigate('/login', { replace: true, state: { error: result.error || '네이버 로그인에 실패했습니다.' } });
  }, [navigate, result]);

  return (
    <section className="login-page">
      <p className="login-notice">네이버 로그인 중입니다.</p>
    </section>
  );
}

export default NaverCallbackPage;
