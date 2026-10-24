import { useState } from "react";
import { Outlet } from "react-router-dom";
import { ChapterGuard } from "./ChapterGuard";
import { ChapterSidebar } from "./ChapterSidebar";
import { ChapterTopBar } from "./ChapterTopBar";
import { cn } from "@/lib/utils";

export function ChapterShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ChapterGuard>
      <div className="relative flex min-h-screen bg-background">
        <div className="pointer-events-none absolute inset-0 bg-mesh opacity-40" />
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-40 transition-transform md:static md:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          )}
        >
          <ChapterSidebar />
        </div>
        {mobileOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}
        <div className="relative flex min-w-0 flex-1 flex-col">
          <ChapterTopBar onMenu={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </ChapterGuard>
  );
}
