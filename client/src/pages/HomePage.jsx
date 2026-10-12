import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CourseCard from '../components/CourseCard.jsx';
import ImageSlot from '../components/ImageSlot.jsx';
import { COURSES } from '../data/courses.js';

const API_BASE = 'http://localhost:4000';
const ALL = '전체';
const LEGEND_REGIONS = [ALL, '서울', '강원도', '충청도', '경상도', '전라도', '제주도'];

function legendProvince(region) {
  const name = String(region ?? '');
  if (name.includes('서울')) return '서울';
  if (name.includes('강원') || name.includes('설악')) return '강원도';
  if (name.includes('충청') || name.includes('부여') || name.includes('공주')) return '충청도';
  if (name.includes('경상') || name.includes('경주')) return '경상도';
  if (name.includes('전라')) return '전라도';
  if (name.includes('제주')) return '제주도';
  return name;
}

function toCardCourse(course) {
  return {
    id: course._id,
    region: course.category,
    theme: `${Number(course.price).toLocaleString('ko-KR')}원`,
    title: course.name,
    summary: course.description,
    thumb: course.image,
  };
}

function HomePage() {
  const [region, setRegion] = useState(ALL);
  const [paidRegion, setPaidRegion] = useState(ALL);
  const [legendCourses, setLegendCourses] = useState(COURSES);
  const [savedCourses, setSavedCourses] = useState([]);
  const [legendError, setLegendError] = useState(false);
  const [paidError, setPaidError] = useState(false);

  useEffect(() => {
    let ignore = false;

    Promise.all([
      fetch(`${API_BASE}/api/legend-courses`).then((response) => (response.ok ? response.json() : null)),
      fetch(`${API_BASE}/api/courses`).then((response) => (response.ok ? response.json() : null)),
    ])
      .then(([legend, saved]) => {
        if (ignore) return;
        if (Array.isArray(legend)) setLegendCourses(legend);
        else setLegendError(true);
        if (Array.isArray(saved)) setSavedCourses(saved.map(toCardCourse));
        else setPaidError(true);
      })
      .catch(() => {
        if (!ignore) {
          setLegendError(true);
          setPaidError(true);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const legendView = legendCourses.map((course) => ({ ...course, region: legendProvince(course.region) }));
  const visible = region === ALL ? legendView : legendView.filter((course) => course.region === region);
  const paidRegions = [ALL, ...new Set(savedCourses.map((course) => course.region))];
  const visiblePaid = paidRegion === ALL ? savedCourses : savedCourses.filter((course) => course.region === paidRegion);

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="eyebrow">보물 여행</div>
            <h1>
              역사와 설화를 찾아 떠나는
              <br />
              <span className="hl">전설여행</span>
            </h1>
            <p className="lede">전국에 잠든 전설·설화·역사를 코스로 엮어, 이야기를 따라 걷는 새로운 여행을 제안합니다.</p>
            <div className="cta-row">
              <a className="btn btn-primary" href="#all-courses">
                전체 코스
              </a>
              <Link className="btn btn-ghost" to="/apply">
                신청·문의
              </Link>
            </div>
          </div>
          <div className="hero-media">
            <ImageSlot src="/img/hero-main.jpg" alt="보물 여행 — 역사를 여행하는 가장 즐거운 방법" label="대표 이미지" />
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="sec-head">
            <div className="sec-kicker">무엇을 하나요</div>
            <h2>이야기가 있는 여행</h2>
            <p className="intro-big">
              전설이 살아 숨 쉬는 곳, 보물을 찾아 여행을 떠나요!
              <br />
              모든 사람에게 지식과 공부가 되는 특별한 여행.
            </p>
          </div>
          <div className="vals">
            <div className="val">
              <div className="n">탐험</div>
              <h3>전설이 된 코스</h3>
              <p>흩어진 이야기를 지역·테마별 코스로 묶어, 길을 따라 전설을 만납니다.</p>
            </div>
            <div className="val">
              <div className="n">이야기</div>
              <h3>깊이 있는 경험</h3>
              <p>각 코스에 담긴 설화와 역사를 안내해, 오래 기억에 남는 하루를 만듭니다.</p>
            </div>
            <div className="val">
              <div className="n">가족과 함께</div>
              <h3>아이와 떠나는 역사</h3>
              <p>아이들과 함께 떠나는 신비로운 역사여행. 이야기를 따라 걸으며 온 가족이 함께 배우고 즐깁니다.</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="sec-head">
            <div className="sec-kicker">미리보기</div>
            <h2>이렇게 즐겨요</h2>
            <p>
              소개 영상과 &apos;보물 코스&apos; 앱 화면을 미리 만나 보세요. 지도를 따라 보물을 찾고, 미션을 수행하며
              이야기를 완성합니다.
            </p>
          </div>
          <div className="preview-grid">
            <div className="media-card">
              <div className="frame">
                <video src="/intro.mp4" poster="/poster.jpg" controls muted loop playsInline preload="metadata" />
              </div>
              <div className="cap">
                <h4>30초 소개 영상</h4>
                <p>보물 여행이 어떤 여행인지 짧게 보여드립니다.</p>
              </div>
            </div>
            <div className="media-card">
              <div className="frame">
                <ImageSlot src="/img/app-buyeo.jpg" alt="부여 보물 코스 지도 앱 화면" label="앱 화면 (코스 지도)" />
              </div>
              <div className="cap">
                <h4>보물 코스 지도</h4>
                <p>지역의 숨은 보물 지점을 지도에서 한눈에.</p>
              </div>
            </div>
            <div className="media-card">
              <div className="frame">
                <ImageSlot src="/img/app-course.jpg" alt="보물 코스 미션 앱 화면" label="앱 화면 (미션)" />
              </div>
              <div className="cap">
                <h4>미션으로 즐기기</h4>
                <p>코스를 따라 미션을 수행하며 이야기를 모읍니다.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec-alt" id="all-courses">
        <div className="wrap">
          <div className="sec-head">
            <div className="sec-kicker">전체 코스</div>
            <h2>전설 코스 둘러보기</h2>
            <p>전국의 전설·설화·역사로 만든 코스입니다. 이 페이지에서 지역으로 골라 보세요.</p>
          </div>
          <div className="filters">
            {LEGEND_REGIONS.map((name) => (
              <button
                key={name}
                type="button"
                className="chip"
                aria-pressed={name === region}
                onClick={() => setRegion(name)}
              >
                {name}
              </button>
            ))}
          </div>
          {legendError ? <p className="course-status">전설 코스를 불러오지 못했습니다.</p> : null}
          {visible.length === 0 ? <p className="course-status">이 지역의 코스가 없습니다.</p> : null}
          <div className="course-grid">
            {visible.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      <section id="paid-courses">
        <div className="wrap">
          <div className="sec-head">
            <div className="sec-kicker">유료 코스</div>
            <h2>유료 코스</h2>
            <p>등록된 유료 코스입니다. 이 페이지에서 지역으로 골라 보세요.</p>
          </div>
          <div className="filters">
            {paidRegions.map((name) => (
              <button
                key={name}
                type="button"
                className="chip"
                aria-pressed={name === paidRegion}
                onClick={() => setPaidRegion(name)}
              >
                {name}
              </button>
            ))}
          </div>
          {paidError ? <p className="course-status">유료 코스를 불러오지 못했습니다.</p> : null}
          {!paidError && visiblePaid.length === 0 ? <p className="course-status">등록된 유료 코스가 없습니다.</p> : null}
          <div className="course-grid">
            {visiblePaid.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="wrap band">
          <div className="fig">
            <ImageSlot src="/img/map-nation.jpg" alt="전국으로 넓어지는 보물 여행 지도" label="전국 지도" />
          </div>
          <div>
            <div className="sec-kicker">확장 계획</div>
            <h2>전국으로 넓어집니다</h2>
            <p>
              춘천에서 시작해 부여·공주·익산 등 전국의 역사 도시로 코스를 넓혀 갑니다. 지역의 이야기와 상점을 잇는 길이
              전국으로 이어집니다.
            </p>
          </div>
        </div>
      </section>

      <section className="sec-alt">
        <div className="wrap band">
          <div>
            <div className="sec-kicker">보물 여행</div>
            <h2>역사를 여행하는 가장 즐거운 방법</h2>
            <p>이야기를 따라 걷는 여행, 지금 함께 시작해요.</p>
            <div className="cta-row">
              <Link className="btn btn-primary" to="/apply">
                신청·문의
              </Link>
              <a className="btn btn-ghost" href="#all-courses">
                전체 코스
              </a>
            </div>
          </div>
          <div className="fig">
            <ImageSlot src="/img/traveler-lake.jpg" alt="새벽 호숫가에서 보물 지도를 보는 여행자" label="여행 사진" />
          </div>
        </div>
      </section>
    </>
  );
}

export default HomePage;
