import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import './admin.css';

const API_BASE = 'http://localhost:4000';

function storedToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function shown(value) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || '—';
}

function ApplicationDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [allowed, setAllowed] = useState(false);
  const [application, setApplication] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = storedToken();
    if (!token) {
      navigate('/', { replace: true });
      return undefined;
    }

    let ignore = false;
    fetch(`${API_BASE}/api/me`, { headers: { authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (ignore) return;
        const user = response.ok ? await response.json() : null;
        if (user?.user_type !== 'admin') {
          navigate('/', { replace: true });
          return;
        }
        setAllowed(true);
        const detailResponse = await fetch(`${API_BASE}/api/applications/${id}`, {
          headers: { authorization: `Bearer ${token}` },
        });
        const body = await detailResponse.json().catch(() => ({}));
        if (ignore) return;
        if (!detailResponse.ok) {
          setError(body.message || '신청을 불러오지 못했습니다.');
          return;
        }
        setApplication(body);
      })
      .catch(() => {
        if (!ignore) navigate('/', { replace: true });
      });

    return () => {
      ignore = true;
    };
  }, [id, navigate]);

  if (!allowed) return null;

  const rows = application
    ? [
        ['신청번호', `APP-${String(application._id).slice(-6).toUpperCase()}`],
        ['상태', shown(application.status)],
        ['이름', shown(application.name)],
        ['연락처', shown(application.phone)],
        ['관심 코스', shown(application.course)],
        ['인원', shown(application.people)],
        ['희망 날짜', shown(application.hope_date)],
        ['남기실 말씀', shown(application.message)],
        ['접수일', formatDate(application.createdAt)],
      ]
    : [];

  return (
    <div className="admin-app">
      <header className="admin-top">
        <div className="admin-brand">
          <Link to="/">보물 여행</Link>
          <span>ADMIN</span>
        </div>
        <Link to="/admin">대시보드로 돌아가기</Link>
      </header>
      <main className="admin-main">
        <h1>신청 상세</h1>
        <p className="admin-lead">신청·문의에서 보낸 내용을 확인합니다.</p>
        {error ? <p className="admin-empty">{error}</p> : null}
        {!application && !error ? <p className="admin-empty">신청을 불러오는 중</p> : null}
        {application ? (
          <dl className="admin-detail">
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </main>
    </div>
  );
}

export default ApplicationDetailPage;
