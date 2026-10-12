import { Link } from 'react-router-dom';
import ImageSlot from './ImageSlot.jsx';

function CourseCard({ course }) {
  return (
    <Link className="ccard" to={`/courses/${course.id}`}>
      <ImageSlot className="thumb" src={course.thumb} label="대표 이미지" />
      <div className="body">
        <div className="top">
          <span className="badge">{course.region}</span>
          <span className="theme">{course.theme}</span>
        </div>
        <h3>{course.title}</h3>
        <p>{course.summary}</p>
        <span className="more">코스 보기 →</span>
      </div>
    </Link>
  );
}

export default CourseCard;
