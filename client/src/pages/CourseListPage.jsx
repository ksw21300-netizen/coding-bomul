import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './admin.css';

const API_BASE = 'http://localhost:4000';

function storedToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function CourseListPage() {
  const navigate = useNavigate();
  const filterRef = useRef(null);
  const [allowed, setAllowed] = useState(false);
  const [courses, setCourses] = useState([]);
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('전체');
  const [filterOpen, setFilterOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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
        const coursesResponse = await fetch(`${API_BASE}/api/legend-courses`);
        const saved = coursesResponse.ok ? await coursesResponse.json() : null;
        if (ignore) return;
        if (Array.isArray(saved)) setCourses(saved);
        else setError('전설 코스 목록을 불러오지 못했습니다.');
      })
      .catch(() => {
        if (!ignore) navigate('/', { replace: true });
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (!filterOpen) return undefined;

    function close(event) {
      if (!filterRef.current?.contains(event.target)) setFilterOpen(false);
    }

    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [filterOpen]);

  async function removeCourse(course) {
    const ok = window.confirm(`「${course.title}」 전설 코스를 삭제할까요?`);
    if (!ok) return;

    const token = storedToken();
    setError('');
    try {
      const response = await fetch(`${API_BASE}/api/legend-courses/${course.id}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${token}` },
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.message || '코스를 삭제하지 못했습니다.');
        return;
      }
      setCourses((current) => current.filter((item) => item.id !== course.id));
    } catch {
      setError('서버에 연결하지 못했습니다. 서버가 실행 중인지 확인해 주세요.');
    }
  }

  if (!allowed) return null;

  const regions = ['전체', ...new Set(courses.map((course) => course.region).filter(Boolean))];
  const keyword = query.trim().toLowerCase();
  const visible = courses.filter((course) => {
    const matchesName = `${course.title} ${course.summary}`.toLowerCase().includes(keyword);
    const matchesRegion = region === '전체' || course.region === region;
    return matchesName && matchesRegion;
  });

  return (
    <div className="admin-app">
      <header className="admin-top">
        <div className="admin-brand">
          <Link to="/">보물 여행</Link>
          <span>ADMIN</span>
        </div>
        <Link to="/admin">대시보드로 돌아가기</Link>
      </header>

      <main className="admin-main admin-course-page">
        <div className="admin-course-head">
          <h1>코스 관리</h1>
          <Link className="admin-course-new" to="/admin/legend-courses">
            + 새 코스 등록
          </Link>
        </div>

        <div className="admin-course-tabs">
          <span className="is-on">전설 코스 목록</span>
          <Link to="/admin/legend-courses">코스 등록</Link>
        </div>

        <div className="admin-course-tools">
          <label className="admin-course-search">
            <span className="sr-only">코스 이름 검색</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="코스 이름으로 검색..."
            />
          </label>
          <div className="admin-course-filter" ref={filterRef}>
            <button type="button" aria-expanded={filterOpen} onClick={() => setFilterOpen((open) => !open)}>
              필터{region === '전체' ? '' : ` · ${region}`}
            </button>
            {filterOpen ? (
              <div className="admin-course-filter-menu" role="listbox" aria-label="지역">
                {regions.map((name) => (
                  <button
                    key={name}
                    type="button"
                    role="option"
                    aria-selected={name === region}
                    onClick={() => {
                      setRegion(name);
                      setFilterOpen(false);
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {error ? (
          <p className="admin-form-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="admin-course-table-wrap">
          <table className="admin-course-table">
            <thead>
              <tr>
                <th>이미지</th>
                <th>코스</th>
                <th>지역</th>
                <th>테마</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="admin-course-empty" colSpan={5}>
                    코스를 불러오는 중
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td className="admin-course-empty" colSpan={5}>
                    {courses.length === 0 ? '등록된 전설 코스가 없습니다.' : '검색 결과가 없습니다.'}
                  </td>
                </tr>
              ) : (
                visible.map((course) => (
                  <tr key={course.id}>
                    <td>
                      {course.thumb || course.hero ? <img src={course.thumb || course.hero} alt="" /> : <span className="admin-course-blank" />}
                    </td>
                    <td className="admin-course-name">
                      <strong>{course.title}</strong>
                      <p>{course.summary}</p>
                    </td>
                    <td>{course.region}</td>
                    <td>{course.theme}</td>
                    <td>
                      <div className="admin-course-actions">
                        <Link className="admin-course-edit" to={`/admin/legend-courses?course=${course.id}`}>
                          수정
                        </Link>
                        <button
                          type="button"
                          className="admin-course-delete"
                          aria-label={`${course.title} 삭제`}
                          onClick={() => removeCourse(course)}
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                            <path
                              d="M5 7h14M9 7V5h6v2M8 7l.8 12h6.4L16 7"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default CourseListPage;
