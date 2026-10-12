import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './admin.css';

const API_BASE = 'http://localhost:4000';
const CATEGORIES = ['경주', '제주', '부여', '공주', '강원', '설악', '전라', '기타'];

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

function storedToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function CourseCreatePage() {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', category: '', description: '' });
  const [image, setImage] = useState('');
  const [imageName, setImageName] = useState('');
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const widgetRef = useRef(null);

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
        try {
          const coursesResponse = await fetch(`${API_BASE}/api/courses`);
          const saved = coursesResponse.ok ? await coursesResponse.json() : null;
          if (ignore) return;
          if (Array.isArray(saved)) setCourses(saved);
          else setError('코스 정보를 불러오지 못했습니다.');
        } catch {
          if (!ignore) setError('서버에 연결하지 못했습니다. 서버가 실행 중인지 확인해 주세요.');
        }
      })
      .catch(() => {
        if (!ignore) navigate('/', { replace: true });
      });

    return () => {
      ignore = true;
    };
  }, [navigate]);

  function update(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  useEffect(() => {
    return () => {
      widgetRef.current?.destroy();
      widgetRef.current = null;
    };
  }, []);

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
              setImage(result.info.secure_url);
              setImageName(result.info.original_filename || '업로드된 이미지');
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

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    if (!image) {
      setError('이미지를 선택해 주세요.');
      return;
    }

    const token = storedToken();
    setPending(true);
    try {
      const response = await fetch(`${API_BASE}/api/courses`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name.trim(),
          price: Number(form.price),
          category: form.category,
          image,
          description: form.description.trim(),
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.message || '코스를 등록하지 못했습니다.');
        return;
      }
      navigate('/admin/courses', { replace: true });
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
        <h1>코스 등록</h1>
        <p className="admin-lead">코스 이름, 가격, 카테고리, 이미지, 설명을 입력해 주세요.</p>

        <form className="admin-form" onSubmit={onSubmit}>
          <div className="admin-field">
            <span className="admin-field-label">이미지</span>
            <button className="admin-upload" type="button" onClick={openImageWidget}>
              {image ? <img src={image} alt="업로드한 코스 이미지 미리보기" /> : <span>Cloudinary로 이미지 올리기</span>}
            </button>
            {image ? (
              <div className="admin-preview">
                <img src={image} alt="" />
                <p>{imageName}</p>
              </div>
            ) : null}
          </div>

          <div className="admin-field">
            <label htmlFor="course-name">코스</label>
            <input id="course-name" name="name" value={form.name} onChange={update} placeholder="코스 이름" required />
          </div>

          <div className="admin-field">
            <label htmlFor="course-price">가격</label>
            <input
              id="course-price"
              name="price"
              type="number"
              min="0"
              step="1"
              value={form.price}
              onChange={update}
              placeholder="0"
              required
            />
          </div>

          <div className="admin-field">
            <label htmlFor="course-category">카테고리</label>
            <select id="course-category" name="category" value={form.category} onChange={update} required>
              <option value="">카테고리를 선택해 주세요</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-field">
            <label htmlFor="course-description">코스 설명</label>
            <textarea
              id="course-description"
              name="description"
              rows={5}
              value={form.description}
              onChange={update}
              placeholder="코스에 대한 설명을 입력해 주세요"
              required
            />
          </div>

          {error ? (
            <p className="admin-form-error" role="alert">
              {error}
            </p>
          ) : null}
          <button className="admin-submit" type="submit" disabled={pending}>
            {pending ? '등록 중' : '등록하기'}
          </button>
        </form>

        <section className="admin-saved" aria-label="등록된 코스 정보">
          <h2>코스 정보</h2>
          {courses.length === 0 ? (
            <p className="admin-empty">등록된 코스가 없습니다.</p>
          ) : (
            <ul className="admin-saved-list">
              {courses.map((course) => (
                <li key={course._id}>
                  <img src={course.image} alt="" />
                  <div>
                    <strong>{course.name}</strong>
                    <p>
                      {course.category} · {Number(course.price).toLocaleString('ko-KR')}원
                    </p>
                    <p>{course.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default CourseCreatePage;
