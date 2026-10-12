import { useEffect, useRef, useState } from 'react';

const API_BASE = 'http://localhost:4000';
const CONTACT_EMAIL = 'ksw2130@naver.com';

function ApplyPage() {
  const [toast, setToast] = useState(null);
  const [pending, setPending] = useState(false);
  const [copyLabel, setCopyLabel] = useState('복사');
  const copyTimer = useRef(0);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  async function onSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name')).trim();
    const phone = String(data.get('phone')).trim();

    if (!name || !phone) {
      setToast({ error: true, text: '이름과 연락처를 입력해 주세요.' });
      return;
    }

    setPending(true);
    setToast(null);
    try {
      const response = await fetch(`${API_BASE}/api/applications`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          course: String(data.get('course') ?? '').trim(),
          name,
          phone,
          people: String(data.get('people') ?? '').trim(),
          hope_date: String(data.get('date') ?? '').trim(),
          message: String(data.get('msg') ?? '').trim(),
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setToast({ error: true, text: body.message || '신청을 저장하지 못했습니다.' });
        return;
      }
      setToast({ error: false, text: `${name} 님, 신청이 접수되었습니다.` });
      event.currentTarget.reset();
    } catch {
      setToast({ error: true, text: '서버에 연결하지 못했습니다. 서버가 실행 중인지 확인해 주세요.' });
    } finally {
      setPending(false);
    }
  }

  async function copyMail() {
    let copied = false;
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      copied = true;
    } catch {
      const input = document.createElement('textarea');
      input.value = CONTACT_EMAIL;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.left = '-9999px';
      document.body.append(input);
      input.select();
      copied = document.execCommand('copy');
      input.remove();
    }
    setCopyLabel(copied ? '복사됨' : '복사 실패');
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopyLabel('복사'), 1500);
  }

  return (
    <section>
      <div className="wrap apply-grid">
        <div className="apply-copy">
          <div className="sec-kicker">신청·문의</div>
          <h2>함께 떠나요</h2>
          <p>관심 있는 코스나 제휴·문의를 남겨 주세요. 확인 후 안내드리겠습니다.</p>
          <div className="contact">
            <div className="row">
              <span>문의</span>
              <code>{CONTACT_EMAIL}</code>
              <button className={copyLabel === '복사됨' ? 'copy is-done' : 'copy'} type="button" onClick={copyMail}>
                {copyLabel}
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor="course">관심 코스</label>
            <input id="course" name="course" placeholder="예: 신라 천년의 보물길" />
          </div>
          <div className="two">
            <div className="field">
              <label htmlFor="name">이름</label>
              <input id="name" name="name" autoComplete="name" required />
            </div>
            <div className="field">
              <label htmlFor="phone">연락처</label>
              <input id="phone" name="phone" inputMode="tel" placeholder="010-0000-0000" required />
            </div>
          </div>
          <div className="two">
            <div className="field">
              <label htmlFor="people">인원</label>
              <input id="people" name="people" placeholder="예: 2명" />
            </div>
            <div className="field">
              <label htmlFor="date">희망 날짜</label>
              <input id="date" name="date" placeholder="예: 11월 둘째 주말" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="msg">남기실 말씀</label>
            <textarea id="msg" name="msg" rows={3} placeholder="궁금한 점을 적어 주세요" />
          </div>
          <button className="btn btn-primary" type="submit" disabled={pending}>
            {pending ? '접수 중' : '신청 보내기'}
          </button>
          {toast ? (
            <div className={toast.error ? 'toast is-error' : 'toast'} role="status">
              {toast.text}
            </div>
          ) : null}
        </form>
      </div>
    </section>
  );
}

export default ApplyPage;
