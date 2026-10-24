import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { ChapterCard, ChapterPageHeader } from "@/components/chapter/ChapterPage";
import { MonthCollectionHistory, type MonthCollectionRow } from "@/components/chapter/MonthCollectionHistory";
import { useAuth } from "@/lib/auth";
import { api, ApiRequestError } from "@/lib/api";
import { isOwnCollectionRole, resolveChapterRole } from "@/lib/chapterRoles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DonationRow = {
  _id: string;
  amount: number;
  screenshotUrl?: string;
  note?: string;
  status: "pending" | "verified" | "rejected";
  createdAt?: string;
  teamDirector?: { name?: string } | null;
};

function fmt(n: number) {
  return `PKR ${Number(n || 0).toLocaleString()}`;
}

export default function MyDonationPage() {
  const { user } = useAuth();
  const role = resolveChapterRole(user ?? {});
  const ownCollection = isOwnCollectionRole(role);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<DonationRow[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [verifiedTotal, setVerifiedTotal] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [periodLabel, setPeriodLabel] = useState("This month");
  const [byMonth, setByMonth] = useState<MonthCollectionRow[]>([]);

  const directorName =
    user?.teamDirector && typeof user.teamDirector === "object"
      ? user.teamDirector.name
      : null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{
        success: true;
        data: DonationRow[];
        pendingTotal: number;
        verifiedTotal: number;
        grandTotal: number;
        period?: { label?: string };
        byMonth?: MonthCollectionRow[];
      }>("/chapter-donations?mine=1");
      setRows(res.data || []);
      setPendingTotal(res.pendingTotal || 0);
      setVerifiedTotal(res.verifiedTotal || 0);
      setGrandTotal(res.grandTotal || 0);
      setPeriodLabel(res.period?.label || "This month");
      setByMonth(res.byMonth || []);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load donations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const livePreview = useMemo(() => {
    const n = Number(amount);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [amount]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("amount", String(n));
      if (note.trim()) fd.append("note", note.trim());
      if (file) fd.append("screenshot", file);
      await api("/chapter-donations", { method: "POST", body: fd });
      toast.success("Donation saved — pending verification");
      setAmount("");
      setNote("");
      setFile(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <ChapterPageHeader
        title={ownCollection ? "My collection" : "My donation"}
        description={
          ownCollection
            ? `Your personal collection for ${periodLabel}. Resets each new month; previous months are saved.`
            : `Add donations for ${periodLabel}. Month totals reset when a new month starts; past months stay saved.`
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <ChapterCard>
          <p className="text-xs text-muted-foreground">This month · Pending</p>
          <p className="mt-1 font-display text-xl font-bold text-amber-700">{fmt(pendingTotal)}</p>
        </ChapterCard>
        <ChapterCard>
          <p className="text-xs text-muted-foreground">This month · Verified</p>
          <p className="mt-1 font-display text-xl font-bold text-emerald-700">{fmt(verifiedTotal)}</p>
        </ChapterCard>
        <ChapterCard>
          <p className="text-xs text-muted-foreground">
            {ownCollection ? "This month · Total" : "Your team director"}
          </p>
          {ownCollection ? (
            <p className="mt-1 font-display text-xl font-bold">{fmt(grandTotal)}</p>
          ) : (
            <p className="mt-1 text-sm font-semibold">{directorName || "Not assigned yet"}</p>
          )}
        </ChapterCard>
      </div>

      <div className="mb-5">
        <MonthCollectionHistory rows={byMonth} />
      </div>

      <ChapterCard className="mb-5">
        <h3 className="mb-3 text-sm font-semibold">Submit donation</h3>
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Amount (PKR)</Label>
            <Input
              type="number"
              min={1}
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
              required
            />
            {livePreview > 0 ? (
              <p className="text-xs text-muted-foreground">
                Will add {fmt(livePreview)} to this month&apos;s pending
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label>Screenshot (optional)</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Note (optional)</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Bank / JazzCash ref…"
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Save donation
            </Button>
          </div>
        </form>
      </ChapterCard>

      <ChapterCard className="overflow-x-auto p-0 md:p-0">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">This month&apos;s donations</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Screenshot</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No donations this month yet. Submit your first amount above.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r._id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                  </TableCell>
                  <TableCell className="font-medium">{fmt(r.amount)}</TableCell>
                  <TableCell>
                    {r.screenshotUrl ? (
                      <a
                        href={r.screenshotUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-brand-blue hover:underline"
                      >
                        View
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        r.status === "verified"
                          ? "border-0 bg-emerald-500/15 text-emerald-700"
                          : r.status === "rejected"
                            ? "border-0 bg-red-500/15 text-red-700"
                            : "border-0 bg-amber-500/15 text-amber-700"
                      }
                    >
                      {r.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ChapterCard>
    </div>
  );
}
