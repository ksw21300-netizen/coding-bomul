import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import ImageSlot from '../components/ImageSlot.jsx';
import { COURSES } from '../data/courses.js';

const API_BASE = 'http://localhost:4000';
const EMPTY_INFO = { 거리: null, 소요시간: null, 난이도: null, 집결지: null };

function storedToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function openAddedWindow() {
  const popup = window.open('', 'cartAdded', 'popup,width=420,height=320');
  if (!popup) return null;

  popup.document.title = '장바구니';
  const style = popup.document.createElement('style');
  style.textContent = [
    'body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:sans-serif;background:#f7f4ff;color:#2a2150}',
    '.box{display:grid;justify-items:center;gap:22px;padding:24px}',
    'p{margin:0;font-size:20px;font-weight:700}',
    'a{display:grid;justify-items:center;gap:6px;color:#5b2fd6;font-size:15px;font-weight:800;text-decoration:none}',
    'a:hover{color:#4b2ad4}',
  ].join('');
  popup.document.head.replaceChildren(style);
  popup.document.body.replaceChildren();
  return popup;
}

function showAddedMessage(popup) {
  const text = '장바구니에 추가 되었습니다.';
  if (!popup || popup.closed) {
    window.alert(text);
    return;
  }

  const box = popup.document.createElement('div');
  box.className = 'box';
  const message = popup.document.createElement('p');
  message.textContent = text;
  const link = popup.document.createElement('a');
  link.href = `${window.location.origin}/order`;
  link.setAttribute('aria-label', '주문 페이지로 이동');
  link.innerHTML = '<svg viewBox="0 0 48 48" width="54" height="54" aria-hidden="true"><rect x="10" y="8" width="28" height="32" rx="3" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M16 8.5v-2.2a8 8 0 0 1 16 0v2.2" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M17 22h14M17 28h10" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
  const label = popup.document.createElement('span');
  label.textContent = '주문';
  link.append(label);
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const opener = popup.opener;
    if (opener && !opener.closed) opener.location.href = link.href;
    else popup.location.href = link.href;
    popup.close();
  });
  box.append(message, link);
  popup.document.body.replaceChildren(box);
}

function CourseDetail({ course, listTo, paidId }) {
  const navigate = useNavigate();
  const [reward, setReward] = useState('');
  const [chestOpen, setChestOpen] = useState(false);
  const [cartState, setCartState] = useState('');
  const [cartMessage, setCartMessage] = useState('');

  async function addToCart() {
    const token = storedToken();
    if (!token) {
      navigate('/login');
      return;
    }

    const popup = openAddedWindow();
    setCartState('pending');
    setCartMessage('');
    try {
      const response = await fetch(`${API_BASE}/api/carts`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ course: paidId, quantity: 1 }),
      });
      if (response.status === 401) {
        popup?.close();
        navigate('/login');
        return;
      }
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        popup?.close();
        setCartState('');
        setCartMessage(body.message || '장바구니에 담지 못했습니다.');
        return;
      }
      setCartState('');
      setCartMessage('');
      window.dispatchEvent(new Event('cart-updated'));
      showAddedMessage(popup);
    } catch {
      popup?.close();
      setCartState('');
      setCartMessage('서버에 연결하지 못했습니다.');
    }
  }

  return (
    <section>
      <div className="wrap detail">
        <Link className="back" to={listTo}>
          ← 코스 목록으로
        </Link>
        <div className="detail-head">
          <span className="badge">{course.region}</span>
          <span className="theme">{course.theme}</span>
        </div>
        <div className="detail-title-row">
          <h1>{course.title}</h1>
          <div className="reward-field">
            <label className="sr-only" htmlFor="course-reward">
              완주 보상 상품
            </label>
            <input
              id="course-reward"
              className="reward-input"
              value={reward}
              onChange={(event) => setReward(event.target.value)}
              placeholder="완주 보상 상품"
            />
            <button
              type="button"
              className={chestOpen ? 'chest is-open' : 'chest'}
              aria-pressed={chestOpen}
              aria-label={chestOpen ? '보물상자 닫기' : '보물상자 열기'}
              onClick={() => setChestOpen((open) => !open)}
            >
              <svg viewBox="0 0 72 64" width="64" height="56" aria-hidden="true">
                <g className="chest-loot">
                  <circle cx="30" cy="36" r="6" />
                  <circle cx="42" cy="38" r="5" />
                  <path d="M36 26l2 5 5 .4-4 3.2 1.4 5L36 37l-4.4 2.6 1.4-5-4-3.2 5-.4z" />
                </g>
                <path className="chest-body" d="M8 30h56v20a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6V30z" />
                <path className="chest-band" d="M8 40h56" />
                <g className="chest-lid">
                  <path d="M10 30V22a10 10 0 0 1 10-10h32a10 10 0 0 1 10 10v8H10z" />
                  <path className="chest-lid-edge" d="M10 28h52" />
                </g>
                <circle className="chest-lock" cx="36" cy="34" r="4" />
              </svg>
            </button>
          </div>
        </div>
        <p className="summary">{course.summary}</p>
        <ImageSlot className="hero-slot" src={course.hero} alt={course.title} label="대표 이미지" sub="자료 삽입 영역 (코스 대표 사진)" />

        <div className="info-row">
          {Object.entries(course.info).map(([label, value]) => (
            <div className="info" key={label}>
              <div className="k">{label}</div>
              <div className={value ? 'v' : 'v todo'}>{value || '입력 예정'}</div>
            </div>
          ))}
        </div>

        <div className="block">
          <h2>코스 경유지</h2>
          {course.stops.length === 0 ? (
            <p className="summary">입력 예정</p>
          ) : (
            <div className="stops">
              {course.stops.map((stop, index) => (
                <div className="stop" key={stop.name}>
                  <div className="idx">{String(index + 1).padStart(2, '0')}</div>
                  <div>
                    <div className="where">{stop.where}</div>
                    <h4>{stop.name}</h4>
                    <p>{stop.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="block">
          <h2>이 코스의 이야기</h2>
          {course.stories.length === 0 ? (
            <p className="summary">입력 예정</p>
          ) : (
            <div className="story-list">
              {course.stories.map((story) => (
                <div className="story" key={story}>
                  <span className="dot" />
                  <span>{story}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="block">
          <h2>코스 지도</h2>
          <ImageSlot className="map-slot" src={course.map} label="코스 지도" sub="자료 삽입 영역 (동선·지도)" />
        </div>

        <div className="block">
          <h2>상세 자료</h2>
          <div className="data-slot slot">
            <span className="lbl">상세 소개·사진·영상</span>
            <span className="sub">자료 삽입 영역 (추후 콘텐츠 연결)</span>
          </div>
        </div>

        <div className="detail-cta">
          {paidId ? (
            <button className="btn btn-primary" type="button" onClick={addToCart} disabled={cartState === 'pending'}>
              {cartState === 'pending' ? '담는 중' : '장바구니 담기'}
            </button>
          ) : null}
          <Link className="btn btn-primary" to="/apply">
            이 코스 신청하기
          </Link>
          <Link className="btn btn-ghost" to={listTo}>
            다른 코스 보기
          </Link>
        </div>
        {cartMessage ? <p className="course-status">{cartMessage}</p> : null}
      </div>
    </section>
  );
}

function CourseDetailPage() {
  const { id } = useParams();
  const saved = COURSES.find((item) => item.id === id);
  const [legend, setLegend] = useState(null);
  const [product, setProduct] = useState(null);
  const [missing, setMissing] = useState(false);
  const [loadedId, setLoadedId] = useState(id);

  if (loadedId !== id) {
    setLoadedId(id);
    setLegend(null);
    setProduct(null);
    setMissing(false);
  }

  useEffect(() => {
    let ignore = false;

    fetch(`${API_BASE}/api/legend-courses/${id}`)
      .then(async (response) => {
        if (ignore) return;
        if (response.ok) {
          setLegend(await response.json());
          return;
        }
        if (saved) {
          setLegend(saved);
          return;
        }
        const productResponse = await fetch(`${API_BASE}/api/courses/${id}`);
        if (ignore) return;
        if (!productResponse.ok) {
          setMissing(true);
          return;
        }
        setProduct(await productResponse.json());
      })
      .catch(() => {
        if (ignore) return;
        if (saved) setLegend(saved);
        else setMissing(true);
      });

    return () => {
      ignore = true;
    };
  }, [saved, id]);

  if (legend) {
    return <CourseDetail course={legend} listTo="/#all-courses" />;
  }
  if (missing) return <Navigate to="/" replace />;
  if (!product) {
    return (
      <section>
        <div className="wrap detail">
          <p>코스를 불러오는 중</p>
        </div>
      </section>
    );
  }

  return (
    <CourseDetail
      listTo="/#paid-courses"
      paidId={product._id}
      course={{
        region: product.category,
        theme: `${Number(product.price).toLocaleString('ko-KR')}원`,
        title: product.name,
        summary: product.description,
        hero: product.image,
        map: null,
        info: EMPTY_INFO,
        stops: [],
        stories: [],
      }}
    />
  );
}

export default CourseDetailPage;
