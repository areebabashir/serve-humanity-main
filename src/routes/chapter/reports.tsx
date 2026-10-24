import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  Download,
  FileText,
  HandCoins,
  HeartPulse,
  Loader2,
  RefreshCw,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { ChapterPageHeader, ChapterCard } from "@/components/chapter/ChapterPage";
import { useChapterRole } from "@/components/chapter/ChapterGuard";
import { canAccessChapterModule } from "@/lib/chapterRoles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, ApiRequestError } from "@/lib/api";
import {
  downloadChapterReportPdf,
  type ChapterReport,
} from "@/lib/chapter-report-pdf";
import logoAsset from "@/assets/logo.png";

function fmtPKR(n: number) {
  if (!n || n <= 0) return "PKR 0";
  return `PKR ${Number(n).toLocaleString()}`;
}

function StatTile({
  label,
  value,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "blue" | "orange" | "green";
}) {
  const tones = {
    blue: "bg-brand-blue/10 text-brand-blue",
    orange: "bg-brand-orange/15 text-brand-orange",
    green: "bg-emerald-500/15 text-emerald-700",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1.5 text-lg font-bold tracking-tight text-foreground">{value}</p>
        </div>
        <div className={`grid h-9 w-9 place-items-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

type ChapterReportResponse = {
  mode: "chapter";
  generatedAt: string;
  report: ChapterReport;
};

export default function ChapterReportsPage() {
  const role = useChapterRole();
  const canView = canAccessChapterModule(role, "reports");

  const [preview, setPreview] = useState<ChapterReport | null>(null);
  const [generatedAt, setGeneratedAt] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const loadPreview = useCallback(async () => {
    setLoadingPreview(true);
    try {
      const res = await api<{ success: true; data: ChapterReportResponse }>(
        "/dashboard/chapter-report",
      );
      setPreview(res.data.report);
      setGeneratedAt(res.data.generatedAt);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load report");
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  }, []);

  useEffect(() => {
    if (canView) void loadPreview();
  }, [canView, loadPreview]);

  async function downloadPdf() {
    setDownloading(true);
    try {
      const res = await api<{ success: true; data: ChapterReportResponse }>(
        "/dashboard/chapter-report",
      );
      await downloadChapterReportPdf(res.data.report, res.data.generatedAt, {
        logoSrc: logoAsset,
      });
      toast.success("Chapter PDF downloaded");
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "PDF download failed");
    } finally {
      setDownloading(false);
    }
  }

  if (!canView) {
    return (
      <div>
        <ChapterPageHeader
          title="Reports"
          description="Only chapter president and vice president can view reports."
        />
      </div>
    );
  }

  return (
    <div>
      <ChapterPageHeader
        title="Reports"
        description="Live chapter activity summary — download a branded PDF for your chapter."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void loadPreview()} disabled={loadingPreview}>
              {loadingPreview ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button
              className="gap-1.5 bg-gradient-warm text-white hover:opacity-95"
              disabled={downloading || loadingPreview || !preview}
              onClick={() => void downloadPdf()}
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download PDF
            </Button>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-12">
        <aside className="lg:col-span-4">
          <ChapterCard className="!p-0 overflow-hidden">
            <div className="border-b border-border bg-gradient-to-r from-brand-blue/[0.06] to-brand-orange/[0.08] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-warm text-white">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Export PDF</h2>
                  <p className="text-xs text-muted-foreground">Branded with Serve Humanity logo</p>
                </div>
              </div>
            </div>
            <div className="space-y-4 p-5">
              <div className="rounded-xl border border-dashed border-brand-blue/25 bg-brand-blue/[0.03] p-3 text-xs leading-relaxed text-muted-foreground">
                PDF includes president contact, members, team, donations, welfare cases,
                documentation cases, and events.
              </div>
              <Button
                className="h-11 w-full gap-2 bg-gradient-warm text-white hover:opacity-95"
                disabled={downloading || loadingPreview || !preview}
                onClick={() => void downloadPdf()}
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download PDF
              </Button>
              {preview ? (
                <p className="text-center text-xs text-muted-foreground">{preview.chapter.name}</p>
              ) : null}
            </div>
          </ChapterCard>
        </aside>

        <div className="lg:col-span-8">
          <ChapterCard className="!p-0 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <h2 className="text-base font-semibold tracking-tight">Live preview</h2>
                <p className="text-xs text-muted-foreground">
                  {generatedAt
                    ? `Updated ${new Date(generatedAt).toLocaleString()}`
                    : "Loading…"}
                </p>
              </div>
              {preview ? (
                <Badge className="rounded-full border-0 bg-gradient-warm px-3 py-1 text-white">
                  {preview.chapter.name}
                </Badge>
              ) : null}
            </div>

            <div className="p-5">
              {loadingPreview ? (
                <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-brand-blue" /> Loading live report…
                </div>
              ) : preview ? (
                <div className="space-y-5">
                  <div className="flex flex-col gap-3 rounded-2xl border border-brand-blue/15 bg-gradient-to-br from-brand-blue/[0.05] via-card to-brand-orange/[0.08] p-5 sm:flex-row sm:items-center">
                    <img
                      src={logoAsset}
                      alt=""
                      className="h-14 w-14 shrink-0 object-contain drop-shadow-sm"
                    />
                    <div className="min-w-0">
                      <p className="text-lg font-bold tracking-tight text-foreground">
                        {preview.chapter.name}
                        {preview.chapter.city ? (
                          <span className="font-medium text-muted-foreground">
                            {" "}
                            · {preview.chapter.city}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        President{" "}
                        <span className="font-medium text-foreground">{preview.president.name}</span>
                        {preview.president.email ? ` · ${preview.president.email}` : ""}
                        {preview.president.phone ? ` · ${preview.president.phone}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <StatTile
                      label="Members"
                      value={String(preview.summary.members)}
                      icon={Users}
                      tone="blue"
                    />
                    <StatTile
                      label="Funds raised"
                      value={fmtPKR(preview.summary.fundsRaised)}
                      icon={HandCoins}
                      tone="orange"
                    />
                    <StatTile
                      label="Cases pending / done"
                      value={`${preview.summary.casesPending} / ${preview.summary.casesDone}`}
                      icon={HeartPulse}
                      tone="green"
                    />
                    <StatTile
                      label="Events"
                      value={String(preview.summary.eventsTotal)}
                      icon={Building2}
                      tone="blue"
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-border bg-muted/20 p-4">
                      <p className="text-sm font-semibold text-brand-blue">Donations</p>
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <li>Verified · {fmtPKR(preview.summary.donationsVerified)}</li>
                        <li>Pending · {fmtPKR(preview.summary.donationsPending)}</li>
                        <li>Public · {fmtPKR(preview.summary.publicDonations)}</li>
                      </ul>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/20 p-4">
                      <p className="text-sm font-semibold text-brand-orange">Doc cases</p>
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <li>Pending · {preview.summary.docPending}</li>
                        <li>Running · {preview.summary.docRunning}</li>
                        <li>Complete · {preview.summary.docComplete}</li>
                      </ul>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/20 p-4">
                      <p className="text-sm font-semibold text-foreground">Team</p>
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <li>Accounts · {preview.summary.teamAccounts}</li>
                        <li>Active members · {preview.summary.activeMembers}</li>
                        <li className="capitalize">Status · {preview.chapter.status || "—"}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  Could not load report. Try refresh.
                </p>
              )}
            </div>
          </ChapterCard>
        </div>
      </div>
    </div>
  );
}
