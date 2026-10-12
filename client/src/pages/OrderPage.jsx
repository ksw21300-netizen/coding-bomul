import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = 'http://localhost:4000';
const PAYMENT_METHODS = ['신용카드', '계좌이체', '네이버페이'];

function storedToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function todayValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function money(value) {
  return `${Number(value || 0).toLocaleString('ko-KR')}원`;
}

function courseOf(item) {
  return item.course && typeof item.course === 'object' ? item.course : null;
}

function OrderPage() {
  const token = storedToken();
  const [status, setStatus] = useState(token ? 'loading' : 'guest');
  const [items, setItems] = useState([]);
  const [buyer, setBuyer] = useState({ name: '', phone: '', email: '' });
  const [departure, setDeparture] = useState(todayValue());
  const [departureTime, setDepartureTime] = useState('');
  const [departurePlace, setDeparturePlace] = useState('');
  const [people, setPeople] = useState('1');
  const [payment, setPayment] = useState('신용카드');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!token) return undefined;

    let ignore = false;
    const headers = { authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API_BASE}/api/carts`, { headers }),
      fetch(`${API_BASE}/api/me`, { headers }),
    ])
      .then(async ([cartResponse, meResponse]) => {
        if (ignore) return;
        if (cartResponse.status === 401 || meResponse.status === 401) {
          setStatus('guest');
          return;
        }
        if (!cartResponse.ok) {
          setStatus('error');
          return;
        }
        const cart = await cartResponse.json();
        const me = meResponse.ok ? await meResponse.json() : null;
        setItems(Array.isArray(cart.items) ? cart.items : []);
        if (me) {
          setBuyer((current) => (
            current.name || current.phone || current.email
              ? current
              : { name: me.name ?? '', phone: me.phone ?? '', email: me.email ?? '' }
          ));
        }
        setStatus('ready');
      })
      .catch(() => {
        if (!ignore) setStatus('error');
      });

    return () => {
      ignore = true;
    };
  }, [token]);

  const total = items.reduce((sum, item) => {
    const course = courseOf(item);
    return sum + (Number(course?.price) || 0) * (Number(item.quantity) || 0);
  }, 0);

  async function submit(event) {
    event.preventDefault();
    const nextPeople = Number(people);
    if (!departure) {
      setMessage('여행 출발일을 입력해 주세요.');
      return;
    }
    if (!departureTime) {
      setMessage('출발시간을 입력해 주세요.');
      return;
    }
    if (!departurePlace.trim()) {
      setMessage('출발장소를 입력해 주세요.');
      return;
    }
    if (!Number.isInteger(nextPeople) || nextPeople < 1) {
      setMessage('인원은 1명 이상이어야 합니다.');
      return;
    }
    if (!buyer.name.trim() || !buyer.phone.trim() || !buyer.email.trim()) {
      setMessage('이름, 연락처, 이메일을 입력해 주세요.');
      return;
    }

    setPending(true);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: items.map((item) => ({
            course: courseOf(item)?._id || item.course,
            quantity: Number(item.quantity) || 1,
          })),
          departure_date: departure,
          departure_time: departureTime,
          departure_place: departurePlace.trim(),
          people: nextPeople,
          payment_method: payment,
          buyer: {
            name: buyer.name.trim(),
            phone: buyer.phone.trim(),
            email: buyer.email.trim(),
          },
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (response.status === 401) {
        setStatus('guest');
        return;
      }
      if (!response.ok) {
        setMessage(body.message || '주문을 저장하지 못했습니다.');
        return;
      }
      await fetch(`${API_BASE}/api/carts`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } });
      window.dispatchEvent(new Event('cart-updated'));
      setOrder(body);
      setStatus('done');
    } catch {
      setMessage('서버에 연결하지 못했습니다.');
    } finally {
      setPending(false);
    }
  }

  if (status === 'done' && order) {
    const when = new Date(order.departure_date);
    const whenText = Number.isNaN(when.getTime()) ? departure : when.toLocaleDateString('ko-KR');
    return (
      <section className="order-page">
        <div className="wrap order-done">
          <p>주문번호 ORD-{String(order._id).slice(-6).toUpperCase()}</p>
          <h1>주문이 접수되었습니다</h1>
          <p>
            {whenText} {order.departure_time} · {order.departure_place} 출발 · {order.people}명 · {order.payment_method} · {money(order.total_price)}
          </p>
          <div className="order-done-actions">
            <Link className="btn btn-primary" to="/">
              메인으로
            </Link>
            <Link className="btn btn-ghost" to="/#paid-courses">
              다른 코스 보기
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="order-page">
      <div className="wrap">
        <Link className="back" to="/cart">
          ← 장바구니
        </Link>
        <div className="order-head">
          <h1>주문하기</h1>
          <p>출발일과 인원을 확인한 뒤 주문을 확정합니다.</p>
        </div>

        {status === 'guest' ? (
          <p className="course-status">
            주문은 로그인 후 할 수 있습니다. <Link to="/login">로그인</Link>
          </p>
        ) : null}
        {status === 'error' ? <p className="course-status">장바구니를 불러오지 못했습니다.</p> : null}
        {status === 'loading' ? <p className="course-status">주문 정보를 불러오는 중</p> : null}
        {status === 'ready' && items.length === 0 ? (
          <p className="course-status">
            주문할 코스가 없습니다. <Link to="/#paid-courses">유료 코스 보기</Link>
          </p>
        ) : null}

        {status === 'ready' && items.length > 0 ? (
          <form className="order-layout" onSubmit={submit} noValidate>
            <div className="order-fields">
              <h2>여행 정보</h2>
              <div className="two">
                <div className="field">
                  <label htmlFor="departure">여행 출발일</label>
                  <input
                    id="departure"
                    type="date"
                    min={todayValue()}
                    value={departure}
                    onChange={(event) => setDeparture(event.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="people">인원</label>
                  <input
                    id="people"
                    type="number"
                    min="1"
                    value={people}
                    onChange={(event) => setPeople(event.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="two">
                <div className="field">
                  <label htmlFor="departure-time">출발시간</label>
                  <input
                    id="departure-time"
                    type="time"
                    value={departureTime}
                    onChange={(event) => setDepartureTime(event.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="departure-place">출발장소</label>
                  <input
                    id="departure-place"
                    value={departurePlace}
                    placeholder="예: 서울역 4번 출구"
                    onChange={(event) => setDeparturePlace(event.target.value)}
                    required
                  />
                </div>
              </div>
              <h2>예약자</h2>
              <div className="field">
                <label htmlFor="order-name">이름</label>
                <input
                  id="order-name"
                  value={buyer.name}
                  autoComplete="name"
                  onChange={(event) => setBuyer({ ...buyer, name: event.target.value })}
                  required
                />
              </div>
              <div className="two">
                <div className="field">
                  <label htmlFor="order-phone">연락처</label>
                  <input
                    id="order-phone"
                    inputMode="tel"
                    autoComplete="tel"
                    value={buyer.phone}
                    onChange={(event) => setBuyer({ ...buyer, phone: event.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="order-email">이메일</label>
                  <input
                    id="order-email"
                    type="email"
                    autoComplete="email"
                    value={buyer.email}
                    onChange={(event) => setBuyer({ ...buyer, email: event.target.value })}
                    required
                  />
                </div>
              </div>
              {message ? <p className="course-status">{message}</p> : null}
            </div>

            <aside className="order-ticket">
              <h2>결제 코스</h2>
              <ul>
                {items.map((item) => {
                  const course = courseOf(item);
                  const courseId = course?._id || item.course;
                  const line = (Number(course?.price) || 0) * (Number(item.quantity) || 0);
                  return (
                    <li key={courseId}>
                      <div className="order-course">
                        {course?.image ? <img src={course.image} alt="" /> : <span className="order-thumb" />}
                        <strong>{course?.name || '코스'}</strong>
                      </div>
                      <div className="order-course-row">
                        <span>상품 수량</span>
                        <b>{item.quantity}개</b>
                      </div>
                      <div className="order-course-row">
                        <span>결제금액</span>
                        <b>{money(line)}</b>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="order-total">
                <span>합계</span>
                <strong>{money(total)}</strong>
              </div>
            </aside>

            <fieldset className="order-pay">
              <legend>
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <rect x="3" y="6" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M3 10h18" fill="none" stroke="currentColor" strokeWidth="1.8" />
                </svg>
                결제 정보
              </legend>
              <div className="order-pay-list">
                {PAYMENT_METHODS.map((method) => (
                  <label key={method} className={method === '네이버페이' ? 'is-naver' : undefined}>
                    <input
                      type="radio"
                      name="payment"
                      value={method}
                      checked={payment === method}
                      onChange={() => setPayment(method)}
                    />
                    {method}
                  </label>
                ))}
              </div>
              <button className="btn btn-primary" type="submit" disabled={pending}>
                {pending ? '주문 중' : '주문하기'}
              </button>
              <p className="order-agree">주문 완료 시 개인정보처리방침 및 이용약관에 동의한 것으로 간주됩니다.</p>
            </fieldset>
          </form>
        ) : null}
      </div>
    </section>
  );
}

export default OrderPage;
