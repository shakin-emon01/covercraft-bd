import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const AdminRoute = () => {
  const { user } = useAuthStore();

  // যদি ইউজার লগিন করা না থাকে, লগিন পেজে পাঠাও
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // যদি ইউজারের রোল 'ADMIN' না হয়, ড্যাশবোর্ডে পাঠাও
  if (user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  // সব ঠিক থাকলে অ্যাডমিন পেজ দেখাও
  return <Outlet />;
};

export default AdminRoute;
