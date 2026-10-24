import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ChapterCard, ChapterPageHeader } from "@/components/chapter/ChapterPage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiRequestError } from "@/lib/api";

type CaseRow = {
  _id: string;
  verifierName: string;
  verifierCity?: string;
  verifierPhone?: string;
  verifierEmail?: string;
  currentlyDoing?: string;
  relationship?: string;
  familyName: string;
  familyCity?: string;
  familyPhone?: string;
  caseType: string;
  helpNeeded: string;
  helpNeededWithinDays: number;
  status: string;
  createdAt: string;
  verifiedAt?: string | null;
  verificationEmailSentAt?: string | null;
  verifiedBy?: { name?: string } | null;
};

function formatWhen(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function statusBadge(status: string) {
  if (status === "verified") {
    return "border-0 bg-emerald-500/15 text-emerald-700";
  }
  if (status === "rejected") {
    return "border-0 bg-destructive/10 text-destructive";
  }
  return "border-0 bg-muted text-muted-foreground";
}

export default function ChapterCaseRegistrationsPage() {
  const [rows, setRows] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = statusFilter !== "all" ? `?status=${encodeURIComponent(statusFilter)}` : "";
      const res = await api<{ success: true; data: CaseRow[] }>(`/case-referrals${qs}`);
      setRows(res.data || []);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load cases");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onVerify(row: CaseRow) {
    if (!row.verifierEmail) {
      toast.error("This case has no registrant email on file.");
      return;
    }
    if (
      !window.confirm(
        `Verify this case and send confirmation email to ${row.verifierEmail}?`,
      )
    ) {
      return;
    }
    setVerifyingId(row._id);
    try {
      const res = await api<{
        success: true;
        message: string;
        data: CaseRow;
        meta?: { emailSent?: boolean };
      }>(`/case-referrals/${row._id}/verify`, { method: "PATCH" });
      toast.success(res.message || "Case verified");
      setRows((prev) => prev.map((r) => (r._id === row._id ? { ...r, ...res.data } : r)));
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to verify case");
    } finally {
      setVerifyingId(null);
    }
  }

  return (
    <div>
      <ChapterPageHeader
        title="Case registrations"
        description="Public Need Support submissions for your chapter. Verify a case to email the person who registered it."
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        }
      />

      <ChapterCard className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {loading ? "Loading…" : `${rows.length} case${rows.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submitted</TableHead>
                <TableHead>Registrant</TableHead>
                <TableHead>Family / case</TableHead>
                <TableHead>Help</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading cases…
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    No case registrations yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r._id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatWhen(r.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{r.verifierName}</div>
                      <div className="text-xs text-muted-foreground">{r.verifierEmail || "No email"}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.verifierPhone || "—"} · {r.verifierCity || "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {r.currentlyDoing || "—"} · {r.relationship || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{r.familyName}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.caseType} · {r.familyCity || "—"} · {r.familyPhone || "—"}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <div className="line-clamp-3 text-sm">{r.helpNeeded}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Within {r.helpNeededWithinDays} day(s)
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusBadge(r.status)}>{r.status}</Badge>
                      {r.status === "verified" ? (
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          {r.verificationEmailSentAt
                            ? `Email sent ${formatWhen(r.verificationEmailSentAt)}`
                            : r.verifiedAt
                              ? `Verified ${formatWhen(r.verifiedAt)}`
                              : null}
                          {r.verifiedBy?.name ? ` · ${r.verifiedBy.name}` : null}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === "verified" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          disabled={verifyingId === r._id || !r.verifierEmail}
                          onClick={() => void onVerify(r)}
                        >
                          {verifyingId === r._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Mail className="h-4 w-4" />
                          )}
                          Verify
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </ChapterCard>
    </div>
  );
}
