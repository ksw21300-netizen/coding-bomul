import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './admin.css';

const API_BASE = 'http://localhost:4000';

const ACTIONS = [
  { id: 'course', label: '유료 코스 등록하기', icon: 'plus', to: '/admin/courses/new' },
  { id: 'manage', label: '코스 관리', icon: 'list', to: '/admin/courses' },
  { id: 'legend', label: '전체 코스 등록', icon: 'route', to: '/admin/legend-courses' },
  { id: 'stats', label: '코스현황 통계', icon: 'chart' },
  { id: 'members', label: '회원 관리', icon: 'people' },
];

function storedToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function Icon({ name }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (name === 'plus') {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="M12 5v14M5 12h14" {...common} />
      </svg>
    );
  }
  if (name === 'list') {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="M8 7h11M8 12h11M8 17h11" {...common} />
        <path d="M4.5 7h.01M4.5 12h.01M4.5 17h.01" {...common} />
      </svg>
    );
  }
  if (name === 'chart') {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="M4 19h16M7 16V10M12 16V6M17 16v-4" {...common} />
      </svg>
    );
  }
  if (name === 'people') {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <circle cx="9" cy="8" r="2.2" {...common} />
        <path d="M4.8 17.5c.8-2.2 2.4-3.3 4.2-3.3s3.4 1.1 4.2 3.3" {...common} />
        <circle cx="16.2" cy="8.5" r="1.7" {...common} />
        <path d="M15.2 14.4c1.5.2 2.7 1.1 3.4 3.1" {...common} />
      </svg>
    );
  }
  if (name === 'route') {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M7 17a3 3 0 1 0-2.8-4H4a5 5 0 0 1 9.5-2" {...common} />
        <circle cx="17" cy="8" r="2.2" {...common} />
        <path d="M14 17h2.2A3.8 3.8 0 0 0 20 13.2V10" {...common} />
      </svg>
    );
  }
  if (name === 'inbox') {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M4 13h4l1.5 2h5L16 13h4" {...common} />
        <path d="M6 13l1.6-6h8.8L18 13" {...common} />
      </svg>
    );
  }
  if (name === 'trend') {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M4 16l5-5 3.5 3.5L20 7" {...common} />
        <path d="M14 7h6v6" {...common} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <circle cx="9" cy="8" r="2.2" {...common} />
      <path d="M4.8 17.5c.8-2.2 2.4-3.3 4.2-3.3s3.4 1.1 4.2 3.3" {...common} />
      <circle cx="16.2" cy="8.5" r="1.7" {...common} />
      <path d="M15.2 14.4c1.5.2 2.7 1.1 3.4 3.1" {...common} />
    </svg>
  );
}

function formatDate(value) {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function AdminPage() {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);
  const [memberCount, setMemberCount] = useState(null);
  const [applications, setApplications] = useState([]);
  const [thisMonth, setThisMonth] = useState(0);
  const [courseCount, setCourseCount] = useState(null);
  const [action, setAction] = useState('');

  useEffect(() => {
    const token = storedToken();
    if (!token) {
      navigate('/', { replace: true });
      return;
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
        const headers = { authorization: `Bearer ${token}` };
        const [usersResponse, applicationsResponse, coursesResponse] = await Promise.all([
          fetch(`${API_BASE}/api/users`, { headers }),
          fetch(`${API_BASE}/api/applications`, { headers }),
          fetch(`${API_BASE}/api/courses`),
        ]);
        const users = usersResponse.ok ? await usersResponse.json() : null;
        const saved = applicationsResponse.ok ? await applicationsResponse.json() : null;
        const courses = coursesResponse.ok ? await coursesResponse.json() : null;
        if (ignore) return;
        if (Array.isArray(users)) setMemberCount(users.length);
        if (Array.isArray(courses)) setCourseCount(courses.length);
        if (Array.isArray(saved)) {
          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);
          setApplications(saved);
          setThisMonth(saved.filter((item) => new Date(item.createdAt) >= monthStart).length);
        }
      })
      .catch(() => {
        if (!ignore) navigate('/', { replace: true });
      });

    return () => {
      ignore = true;
    };
  }, [navigate]);

  if (!allowed) return null;

  const recent = applications.slice(0, 5);

  const cards = [
    { label: '총 회원', value: memberCount === null ? '—' : memberCount.toLocaleString('ko-KR'), note: '가입된 계정', icon: 'people', tone: 'purple' },
    { label: '총 코스', value: courseCount === null ? '—' : courseCount.toLocaleString('ko-KR'), note: '등록된 코스', icon: 'route', tone: 'green' },
    { label: '총 신청', value: applications.length.toLocaleString('ko-KR'), note: '접수된 신청', icon: 'inbox', tone: 'blue' },
    { label: '이번 달 문의', value: thisMonth.toLocaleString('ko-KR'), note: '이번 달 접수', icon: 'trend', tone: 'orange' },
  ];

  return (
    <div className="admin-app">
      <header className="admin-top">
        <div className="admin-brand">
          <Link to="/">보물 여행</Link>
          <span>ADMIN</span>
        </div>
        <Link to="/">메인으로 돌아가기</Link>
      </header>

      <main className="admin-main">
        <h1>관리자 대시보드</h1>
        <p className="admin-lead">보물 여행 관리 화면에 오신 것을 환영합니다.</p>

        <div className="admin-stats">
          {cards.map((card) => (
            <article className="admin-stat" key={card.label}>
              <div>
                <p>{card.label}</p>
                <strong>{card.value}</strong>
                <span>{card.note}</span>
              </div>
              <span className={`admin-stat-icon is-${card.tone}`}>
                <Icon name={card.icon} />
              </span>
            </article>
          ))}
        </div>

        <div className="admin-grid">
          <section className="admin-panel">
            <h2>빠른 작업</h2>
            <div className="admin-actions">
              {ACTIONS.map((item) =>
                item.to ? (
                  <Link key={item.id} to={item.to}>
                    <Icon name={item.icon} />
                    {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.id}
                    type="button"
                    className={item.id === action ? 'is-on' : undefined}
                    aria-pressed={item.id === action}
                    onClick={() => setAction(item.id)}
                  >
                    <Icon name={item.icon} />
                    {item.label}
                  </button>
                ),
              )}
            </div>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-head">
              <h2>최근 신청</h2>
              <span>{applications.length > 0 ? `총 ${applications.length}건` : '아직 없음'}</span>
            </div>
            {recent.length === 0 ? (
              <p className="admin-empty">아직 접수된 신청이 없습니다.</p>
            ) : (
              <ul className="admin-orders">
                {recent.map((item) => (
                  <li key={item._id}>
                    <Link className="admin-order-link" to={`/admin/applications/${item._id}`}>
                      <div>
                        <strong>APP-{String(item._id).slice(-6).toUpperCase()}</strong>
                        <p>
                          {item.name}
                          {item.course ? <span>{item.course}</span> : null}
                        </p>
                        <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
                      </div>
                      <div className="admin-order-side">
                        <em className={`is-${item.status}`}>{item.status}</em>
                        <b>{item.people || '—'}</b>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default AdminPage;
