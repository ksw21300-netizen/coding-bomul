import { useSearchParams } from 'react-router-dom';
import CourseCard from '../components/CourseCard.jsx';
import { COURSES } from '../data/courses.js';

const ALL = '전체';
const REGIONS = [ALL, ...new Set(COURSES.map((course) => course.region))];

function CoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const region = searchParams.get('region') ?? ALL;
  const courses = region === ALL ? COURSES : COURSES.filter((course) => course.region === region);

  function selectRegion(name) {
    setSearchParams(name === ALL ? {} : { region: name }, { replace: true });
  }

  return (
    <section>
      <div className="wrap">
        <div className="sec-head">
          <div className="sec-kicker">전체 코스</div>
          <h2>전설 코스 둘러보기</h2>
          <p>전국의 전설·설화·역사로 만든 코스입니다. 지역으로 골라 보세요.</p>
        </div>
        <div className="filters">
          {REGIONS.map((name) => (
            <button
              key={name}
              type="button"
              className="chip"
              aria-pressed={name === region}
              onClick={() => selectRegion(name)}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="course-grid">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default CoursesPage;
