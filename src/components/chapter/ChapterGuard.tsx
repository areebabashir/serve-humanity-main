import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  canAccessChapterModule,
  canAccessChapterModuleForUser,
  isChapterAppUser,
  resolveChapterRole,
  type ChapterRole,
} from "@/lib/chapterRoles";

export function ChapterGuard({
  children,
  module,
}: {
  children: React.ReactNode;
  module?: string;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-brand-orange" />
      </div>
    );
  }

  if (!user || !isChapterAppUser(user.systemRole)) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (module) {
    if (!canAccessChapterModuleForUser(user, module)) {
      return <Navigate to="/chapter" replace />;
    }
  }

  return <>{children}</>;
}

export function ChapterModule({
  module,
  children,
}: {
  module: string;
  children: React.ReactNode;
}) {
  return <ChapterGuard module={module}>{children}</ChapterGuard>;
}

export function useChapterRole(): ChapterRole {
  const { user } = useAuth();
  return resolveChapterRole(user ?? { systemRole: "member", chapterRole: "member" });
}
