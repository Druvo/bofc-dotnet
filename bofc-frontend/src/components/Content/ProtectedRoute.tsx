import { Navigate } from "react-router-dom";
import { useAuthHook } from "../../hooks/useAuthHook";

interface ProtectedRouteProps {
  children: JSX.Element;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user } = useAuthHook();

  if (!user?.token) {
    return <Navigate to="/" />;
  }

  return children;
};
