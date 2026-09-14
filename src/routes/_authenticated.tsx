import { useEffect } from "react";
import { createFileRoute, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/integrations/firebase/useAuth";
import { OrbitLogo } from "@/components/xrolx/OrbitLogo";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

function AuthLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate({
        to: "/login",
        search: { redirect: loc.href, mode: "login" },
        replace: true,
      });
    }
  }, [user, loading, navigate, loc.href]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deep">
        <OrbitLogo size={48} />
      </div>
    );
  }
  return <Outlet />;
}
