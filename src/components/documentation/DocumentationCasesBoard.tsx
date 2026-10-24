import { useCallback, useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { ChapterCard, ChapterPageHeader } from "@/components/chapter/ChapterPage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, ApiRequestError } from "@/lib/api";
import { docTypeLabel, type DocType } from "@/lib/documentation";

type CaseStatus = "pending" | "running" | "complete";

type DocCase = {
  _id: string;
  type: DocType;
  title?: string;
  caseNumber?: string;
  status?: string;
  caseStatus?: CaseStatus;
  fields?: Record<string, unknown>;
  updatedAt?: string;
  createdAt?: string;
};

const CASE_TYPES: Array<DocType | "all"> = ["all", "health", "marriage", "fee", "ration"];

function fieldStr(fields: Record<string, unknown> | undefined, key: string) {
  const v = fields?.[key];
  if (v == null || v === "") return "—";
  return String(v);
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function statusBadge(status: CaseStatus) {
  if (status === "running") return "default" as const;
  if (status === "complete") return "secondary" as const;
  return "outline" as const;
}

export function DocumentationCasesBoard() {
  const [typeFilter, setTypeFilter] = useState<DocType | "all">("all");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<DocCase[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        casesOnly: "1",
        limit: "200",
      });
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (search.trim()) params.set("q", search.trim());
      const res = await api<{ success: true; total: number; data: DocCase[] }>(
        `/documentation?${params.toString()}`,
      );
      setRows(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load cases");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, search]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateCaseStatus(row: DocCase, next: CaseStatus) {
    if ((row.caseStatus || "pending") === next) return;
    setBusyId(row._id);
    try {
      await api(`/documentation/${row._id}`, {
        method: "PATCH",
        body: JSON.stringify({ caseStatus: next }),
      });
      toast.success(`Status set to ${next}`);
      setRows((prev) =>
        prev.map((r) => (r._id === row._id ? { ...r, caseStatus: next } : r)),
      );
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <ChapterPageHeader
        title="All cases"
        description="All health, marriage, fee, and ration cases. Change status from the Action dropdown."
        actions={
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Refresh
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Badge variant="secondary" className="h-8 w-fit px-3">
          {total} case{total === 1 ? "" : "s"}
        </Badge>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as DocType | "all")}
          >
            <SelectTrigger className="h-9 w-[150px] bg-background">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {CASE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t === "all" ? "All types" : docTypeLabel(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(q);
            }}
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search case #, name…"
                className="h-9 w-[200px] pl-8"
              />
            </div>
            <Button type="submit" size="sm" variant="secondary">
              Search
            </Button>
          </form>
        </div>
      </div>

      <ChapterCard className="overflow-hidden p-0 md:p-0">
        {loading ? (
          <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading cases…
          </div>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No documentation cases found.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Beneficiary</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const current = row.caseStatus || "pending";
                return (
                  <TableRow key={row._id}>
                    <TableCell>
                      <div className="font-medium">{row.caseNumber || "—"}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {row.title || "Untitled"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{docTypeLabel(row.type)}</Badge>
                    </TableCell>
                    <TableCell>{fieldStr(row.fields, "beneficiaryName")}</TableCell>
                    <TableCell>
                      {fieldStr(row.fields, "amount") !== "—"
                        ? `PKR ${Number(row.fields?.amount || 0).toLocaleString()}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {fmtDate(row.updatedAt || row.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadge(current)} className="capitalize">
                        {current}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={current}
                        disabled={busyId === row._id}
                        onValueChange={(v) => void updateCaseStatus(row, v as CaseStatus)}
                      >
                        <SelectTrigger className="ml-auto h-8 w-[130px]">
                          {busyId === row._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <SelectValue placeholder="Change status" />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="running">Running</SelectItem>
                          <SelectItem value="complete">Complete</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </ChapterCard>
    </div>
  );
}
