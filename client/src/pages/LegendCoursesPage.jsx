import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './admin.css';

const API_BASE = 'http://localhost:4000';
const INFO_FIELDS = ['거리', '소요시간', '난이도', '집결지'];

function storedToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function blankStop() {
  return { where: '', name: '', desc: '', addr: '' };
}

function emptyForm() {
  return {
    slug: '',
    title: '',
    region: '',
    theme: '',
    summary: '',
    hero: '',
    thumb: '',
    map: '',
    info: { 거리: '', 소요시간: '', 난이도: '', 집결지: '' },
    stops: [blankStop()],
    storiesText: '',
  };
}

function formFromCourse(course) {
  return {
    slug: course.id,
    title: course.title,
    region: course.region,
    theme: course.theme,
    summary: course.summary,
    hero: course.hero || '',
    thumb: course.thumb || '',
    map: course.map || '',
    info: {
      거리: course.info?.거리 || '',
      소요시간: course.info?.소요시간 || '',
      난이도: course.info?.난이도 || '',
      집결지: course.info?.집결지 || '',
    },
    stops: course.stops?.length
      ? course.stops.map((stop) => ({ where: stop.where || '', name: stop.name || '', desc: stop.desc || '', addr: stop.addr || '' }))
      : [blankStop()],
    storiesText: (course.stories || []).join('\n'),
  };
}

function loadCloudinary() {
  if (window.cloudinary) return Promise.resolve(window.cloudinary);

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-cloudinary-widget]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.cloudinary), { once: true });
      existing.addEventListener('error', () => reject(new Error('widget')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://upload-widget.cloudinary.com/global/all.js';
    script.async = true;
    script.dataset.cloudinaryWidget = 'true';
    script.onload = () => resolve(window.cloudinary);
    script.onerror = () => reject(new Error('widget'));
    document.body.appendChild(script);
  });
}

function LegendCoursesPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const courseId = params.get('course');
  const previousCourseId = useRef(courseId);
  const widgetRef = useRef(null);
  const [allowed, setAllowed] = useState(false);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);

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
        const listResponse = await fetch(`${API_BASE}/api/legend-courses`);
        const saved = listResponse.ok ? await listResponse.json() : null;
        if (!ignore && Array.isArray(saved)) setCourses(saved);
        else if (!ignore) setError('전설 코스를 불러오지 못했습니다.');
      })
      .catch(() => {
        if (!ignore) navigate('/', { replace: true });
      });

    return () => {
      ignore = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (previousCourseId.current && !courseId) setForm(emptyForm());
    previousCourseId.current = courseId;
    if (!courseId) return;
    const found = courses.find((course) => course.id === courseId);
    if (found) setForm(formFromCourse(found));
  }, [courseId, courses]);

  useEffect(() => {
    return () => {
      widgetRef.current?.destroy();
      widgetRef.current = null;
    };
  }, []);

  function update(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateInfo(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, info: { ...current.info, [name]: value } }));
  }

  function updateStop(index, event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      stops: current.stops.map((stop, stopIndex) => (stopIndex === index ? { ...stop, [name]: value } : stop)),
    }));
  }

  async function openImageWidget() {
    try {
      const configResponse = await fetch(`${API_BASE}/api/cloudinary`);
      const config = await configResponse.json().catch(() => ({}));
      if (!configResponse.ok || !config.cloudName || !config.uploadPreset) {
        setError(config.message || 'Cloudinary 설정을 불러오지 못했습니다.');
        return;
      }

      const cloudinary = await loadCloudinary();
      if (!widgetRef.current) {
        widgetRef.current = cloudinary.createUploadWidget(
          {
            cloudName: config.cloudName,
            uploadPreset: config.uploadPreset,
            multiple: false,
            maxFiles: 1,
            resourceType: 'image',
            clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
            maxFileSize: 2_000_000,
          },
          (uploadError, result) => {
            if (uploadError) {
              setError('이미지 업로드에 실패했습니다.');
              return;
            }
            if (result?.event === 'success' && result.info?.secure_url) {
              const image = result.info.secure_url;
              setForm((current) => ({
                ...current,
                hero: image,
                thumb: !current.thumb || current.thumb === current.hero ? image : current.thumb,
              }));
              setError('');
            }
          },
        );
      }
      widgetRef.current.open();
    } catch {
      setError('Cloudinary 위젯을 불러오지 못했습니다.');
    }
  }

  async function reload() {
    const listResponse = await fetch(`${API_BASE}/api/legend-courses`);
    const saved = listResponse.ok ? await listResponse.json() : null;
    if (Array.isArray(saved)) setCourses(saved);
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    const token = storedToken();
    const editing = Boolean(form.slug);
    setPending(true);
    try {
      const response = await fetch(
        editing ? `${API_BASE}/api/legend-courses/${form.slug}` : `${API_BASE}/api/legend-courses`,
        {
          method: editing ? 'PATCH' : 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
          body: JSON.stringify({
            title: form.title,
            region: form.region,
            theme: form.theme,
            summary: form.summary,
            hero: form.hero,
            thumb: form.thumb || form.hero,
            map: form.map,
            info: form.info,
            stops: form.stops,
            stories: form.storiesText.split('\n'),
          }),
        },
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.message || '코스를 저장하지 못했습니다.');
        return;
      }
      await reload();
      setForm(formFromCourse(body));
      setNotice('저장했습니다. 메인 페이지의 전체 코스에 반영됩니다.');
    } catch {
      setError('서버에 연결하지 못했습니다. 서버가 실행 중인지 확인해 주세요.');
    } finally {
      setPending(false);
    }
  }

  if (!allowed) return null;

  return (
    <div className="admin-app">
      <header className="admin-top">
        <div className="admin-brand">
          <Link to="/">보물 여행</Link>
          <span>ADMIN</span>
        </div>
        <Link to="/admin">대시보드로 돌아가기</Link>
      </header>

      <main className="admin-main admin-form-page">
        <h1>{form.slug ? '코스 수정' : '코스 등록'}</h1>
        <p className="admin-lead">등록된 전설 코스를 같은 항목으로 고치거나 새로 등록합니다. 저장하면 메인 페이지에 반영됩니다.</p>
        <p><Link to="/admin/courses">코스 목록으로</Link></p>

        <div className="legend-picks">
          {courses.map((course) => (
            <button key={course.id} type="button" onClick={() => setParams({ course: course.id })}>
              {course.title}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setParams({});
              setForm(emptyForm());
            }}
          >
            새 전설 코스
          </button>
        </div>

        <form className="admin-form" onSubmit={onSubmit}>
          <div className="admin-field">
            <span className="admin-field-label">대표 이미지</span>
            <button className="admin-upload" type="button" onClick={openImageWidget}>
              {form.hero ? <img src={form.hero} alt="전설 코스 대표 이미지" /> : <span>Cloudinary로 이미지 올리기</span>}
            </button>
          </div>

          <div className="admin-field">
            <label htmlFor="legend-title">제목</label>
            <input id="legend-title" name="title" value={form.title} onChange={update} required />
          </div>
          <div className="legend-grid">
            <div className="admin-field">
              <label htmlFor="legend-region">지역</label>
              <input id="legend-region" name="region" value={form.region} onChange={update} required />
            </div>
            <div className="admin-field">
              <label htmlFor="legend-theme">테마</label>
              <input id="legend-theme" name="theme" value={form.theme} onChange={update} required />
            </div>
          </div>
          <div className="admin-field">
            <label htmlFor="legend-summary">설명</label>
            <textarea id="legend-summary" name="summary" rows={3} value={form.summary} onChange={update} required />
          </div>

          <div className="legend-grid">
            {INFO_FIELDS.map((name) => (
              <div className="admin-field" key={name}>
                <label htmlFor={`legend-${name}`}>{name}</label>
                <input id={`legend-${name}`} name={name} value={form.info[name]} onChange={updateInfo} placeholder="입력 예정" />
              </div>
            ))}
          </div>

          <div className="admin-field">
            <span className="admin-field-label">코스 경유지</span>
            {form.stops.map((stop, index) => (
              <div className="legend-stop" key={index}>
                <input name="where" value={stop.where} onChange={(event) => updateStop(index, event)} placeholder="장소" />
                <input name="name" value={stop.name} onChange={(event) => updateStop(index, event)} placeholder="이야기 이름" />
                <input name="desc" value={stop.desc} onChange={(event) => updateStop(index, event)} placeholder="설명" />
                <input name="addr" value={stop.addr || ''} onChange={(event) => updateStop(index, event)} placeholder="주소" />
              </div>
            ))}
            <button
              className="legend-add"
              type="button"
              onClick={() => setForm((current) => ({ ...current, stops: [...current.stops, blankStop()] }))}
            >
              경유지 추가
            </button>
          </div>

          <div className="admin-field">
            <label htmlFor="legend-stories">이 코스의 이야기</label>
            <textarea
              id="legend-stories"
              rows={4}
              value={form.storiesText}
              onChange={(event) => setForm((current) => ({ ...current, storiesText: event.target.value }))}
              placeholder="한 줄에 이야기 하나씩"
            />
          </div>

          <div className="admin-field">
            <label htmlFor="legend-map">지도 이미지 주소</label>
            <input id="legend-map" name="map" value={form.map} onChange={update} placeholder="/img/지도.jpg" />
          </div>

          {error ? (
            <p className="admin-form-error" role="alert">
              {error}
            </p>
          ) : null}
          {notice ? <p className="legend-notice">{notice}</p> : null}
          <button className="admin-submit" type="submit" disabled={pending}>
            {pending ? '저장 중' : form.slug ? '수정하기' : '등록하기'}
          </button>
        </form>
      </main>
    </div>
  );
}

export default LegendCoursesPage;
