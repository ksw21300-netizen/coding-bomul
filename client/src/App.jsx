import { BrowserRouter, Route, Routes } from 'react-router-dom';
import BomulLayout from './components/BomulLayout.jsx';
import SiteLayout from './components/SiteLayout.jsx';
import AdminPage from './pages/AdminPage.jsx';
import ApplicationDetailPage from './pages/ApplicationDetailPage.jsx';
import ApplyPage from './pages/ApplyPage.jsx';
import CourseCreatePage from './pages/CourseCreatePage.jsx';
import CourseListPage from './pages/CourseListPage.jsx';
import LegendCoursesPage from './pages/LegendCoursesPage.jsx';
import CourseDetailPage from './pages/CourseDetailPage.jsx';
import CartPage from './pages/CartPage.jsx';
import OrderPage from './pages/OrderPage.jsx';
import CoursesPage from './pages/CoursesPage.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import NaverCallbackPage from './pages/NaverCallbackPage.jsx';
import SignupPage from './pages/SignupPage.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<BomulLayout />}>
          <Route index element={<HomePage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="courses/:id" element={<CourseDetailPage />} />
          <Route path="apply" element={<ApplyPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="order" element={<OrderPage />} />
        </Route>
        <Route path="admin" element={<AdminPage />} />
        <Route path="admin/applications/:id" element={<ApplicationDetailPage />} />
        <Route path="admin/courses" element={<CourseListPage />} />
        <Route path="admin/courses/new" element={<CourseCreatePage />} />
        <Route path="admin/legend-courses" element={<LegendCoursesPage />} />
        <Route element={<SiteLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="login/naver" element={<NaverCallbackPage />} />
          <Route path="signup" element={<SignupPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
