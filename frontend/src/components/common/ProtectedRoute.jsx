import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { token } = useSelector((s) => s.auth);
  return token ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
