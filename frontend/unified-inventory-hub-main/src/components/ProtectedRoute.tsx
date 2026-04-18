import { Navigate } from "react-router-dom";

interface Props {
  children: JSX.Element;
  adminOnly?: boolean;
}

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export default function ProtectedRoute({ children, adminOnly = false }: Props) {
  const user = getStoredUser();

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
