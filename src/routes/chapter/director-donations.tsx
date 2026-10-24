import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { ChapterCard, ChapterPageHeader } from "@/components/chapter/ChapterPage";
import { MonthCollectionHistory, type MonthCollectionRow } from "@/components/chapter/MonthCollectionHistory";
import { api, ApiRequestError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { isCabinetRole, resolveChapterRole } from "@/lib/chapterRoles";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TeamMember = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  teamDirector?: { _id?: string; name?: string | null } | null;
};

type DirectorTotal = {
  director: { _id: string; name: string; email?: string; chapterRole?: string };
  members?: TeamMember[];
  pendingTotal: number;
  verifiedTotal: number;
  grandTotal: number;
  pendingCount: number;
  verifiedCount: number;
};

type DonationRow = {
  _id: string;
  amount: number;
  screenshotUrl?: string;
  status: string;
  createdAt?: string;
  source?: string;
  donor?: { name?: string; systemRole?: string };
  teamDirector?: { _id?: string; name?: string } | null;
};

function fmt(n: number) {
  return `PKR ${Number(n || 0).toLocaleString()}`;
}

export default function DirectorDonationsPage() {
  const { user } = useAuth();
  const role = resolveChapterRole(user ?? {});
  const isCabinet = isCabinetRole(role);

  const [loading, setLoading] = useState(true);
  const [directors, setDirectors] = useState<DirectorTotal[]>([]);
  const [unassignedMembers, setUnassignedMembers] = useState<TeamMember[]>([]);
  const [cabinetMembers, setCabinetMembers] = useState<TeamMember[]>([]);
  const [unassigned, setUnassigned] = useState({ pendingTotal: 0, verifiedTotal: 0, grandTotal: 0 });
  const [chapterPending, setChapterPending] = useState(0);
  const [chapterVerified, setChapterVerified] = useState(0);
  const [chapterGrand, setChapterGrand] = useState(0);
  const [periodLabel, setPeriodLabel] = useState("This month");
  const [byMonth, setByMonth] = useState<MonthCollectionRow[]>([]);
  const [rows, setRows] = useState<DonationRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [canVerify, setCanVerify] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [bogTotals, setBogTotals] = useState({ pendingTotal: 0, verifiedTotal: 0, grandTotal: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [totals, list] = await Promise.all([
        api<{
          success: true;
          scope?: "cabinet" | "chapter";
          directors: DirectorTotal[];
          unassignedMembers?: TeamMember[];
          cabinetMembers?: TeamMember[];
          unassigned: { pendingTotal: number; verifiedTotal: number; grandTotal: number };
          chapterPendingTotal: number;
          chapterVerifiedTotal: number;
          chapterGrandTotal: number;
          canVerify?: boolean;
          period?: { label?: string; year?: number; month?: number };
          byMonth?: MonthCollectionRow[];
          bog?: { pendingTotal: number; verifiedTotal: number; grandTotal: number };
        }>("/chapter-donations/director-totals"),
        api<{ success: true; data: DonationRow[] }>("/chapter-donations"),
      ]);
      setDirectors(totals.directors || []);
      setUnassignedMembers(totals.unassignedMembers || []);
      setCabinetMembers(totals.cabinetMembers || []);
      setUnassigned(totals.unassigned || { pendingTotal: 0, verifiedTotal: 0, grandTotal: 0 });
      setChapterPending(totals.chapterPendingTotal || 0);
      setChapterVerified(totals.chapterVerifiedTotal || 0);
      setChapterGrand(totals.chapterGrandTotal || 0);
      setPeriodLabel(totals.period?.label || "This month");
      setByMonth(totals.byMonth || []);
      setCanVerify(Boolean(totals.canVerify));
      setBogTotals(totals.bog || { pendingTotal: 0, verifiedTotal: 0, grandTotal: 0 });
      setRows(list.data || []);
      if ((totals.directors || []).length > 0) {
        setExpanded((prev) => {
          const next = { ...prev };
          for (const d of totals.directors) {
            if (next[d.director._id] === undefined) next[d.director._id] = true;
          }
          return next;
        });
      }
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load donations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const donationsByDirector = useMemo(() => {
    const map = new Map<string, DonationRow[]>();
    for (const r of rows) {
      const id = r.teamDirector?._id || "none";
      if (!map.has(id)) map.set(id, []);
      map.get(id)!.push(r);
    }
    return map;
  }, [rows]);

  async function verify(id: string, status: "verified" | "rejected") {
    setBusyId(id);
    try {
      await api(`/chapter-donations/${id}/verify`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast.success(status === "verified" ? "Donation verified" : "Donation rejected");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  const pageTitle = isCabinet ? "Cabinet team donations" : "Director team donations";
  const pageDescription = isCabinet
    ? `Your directors, their members, and donations for ${periodLabel}.`
    : `Month-wise chapter collection for ${periodLabel}. Totals reset when a new month starts.`;

  return (
    <div>
      <ChapterPageHeader title={pageTitle} description={pageDescription} />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <ChapterCard>
          <p className="text-xs text-muted-foreground">This month · Pending</p>
          <p className="mt-1 font-display text-xl font-bold text-amber-700">{fmt(chapterPending)}</p>
        </ChapterCard>
        <ChapterCard>
          <p className="text-xs text-muted-foreground">This month · Verified</p>
          <p className="mt-1 font-display text-xl font-bold text-emerald-700">{fmt(chapterVerified)}</p>
        </ChapterCard>
        <ChapterCard>
          <p className="text-xs text-muted-foreground">
            {isCabinet ? "This month · Cabinet total" : "This month · Total collection"}
          </p>
          <p className="mt-1 font-display text-xl font-bold">{fmt(chapterGrand)}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{periodLabel}</p>
        </ChapterCard>
      </div>

      {bogTotals.grandTotal > 0 || bogTotals.pendingTotal > 0 ? (
        <ChapterCard className="mb-5 border-sky-200 bg-sky-50/40">
          <p className="text-sm font-semibold text-sky-900">BOG / Board donations this month</p>
          <p className="mt-1 text-xs text-sky-800">
            Pending {fmt(bogTotals.pendingTotal)} · Verified {fmt(bogTotals.verifiedTotal)}. Verify them in
            “This month&apos;s donations” (labeled BOG / Board).
          </p>
        </ChapterCard>
      ) : null}

      {isCabinet && unassignedMembers.length > 0 ? (
        <ChapterCard className="mb-5 border-amber-200 bg-amber-50/50">
          <p className="text-sm font-semibold text-amber-900">
            {unassignedMembers.length} member{unassignedMembers.length === 1 ? "" : "s"} not assigned to a director yet
          </p>
          <p className="mt-1 text-xs text-amber-800">
            {unassignedMembers.map((m) => m.name).join(", ")} — assign them from Team & Roles.
          </p>
        </ChapterCard>
      ) : null}

      <div className="mb-5">
        <MonthCollectionHistory rows={byMonth} />
      </div>

      <Tabs defaultValue={isCabinet ? "teams" : "by-director"} className="gap-4">
        <TabsList>
          {isCabinet ? <TabsTrigger value="teams">Directors & members</TabsTrigger> : null}
          <TabsTrigger value="by-director">By director (this month)</TabsTrigger>
          <TabsTrigger value="all">This month&apos;s donations</TabsTrigger>
        </TabsList>

        {isCabinet ? (
          <TabsContent value="teams">
            <div className="space-y-4">
              <ChapterCard className="overflow-x-auto p-0 md:p-0">
                <div className="border-b border-border px-4 py-3">
                  <h3 className="text-sm font-semibold">
                    All members in your cabinet ({cabinetMembers.length})
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Same as your team view — only members linked to this cabinet head
                  </p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Director</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-muted-foreground">
                          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading…
                        </TableCell>
                      </TableRow>
                    ) : cabinetMembers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-muted-foreground">
                          No members in your cabinet yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      cabinetMembers.map((m) => (
                        <TableRow key={m._id}>
                          <TableCell className="font-medium">{m.name}</TableCell>
                          <TableCell>{m.email || "—"}</TableCell>
                          <TableCell>{m.phone || "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {m.teamDirector?.name || "Unassigned"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ChapterCard>

              {loading ? (
                <ChapterCard className="text-muted-foreground">
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading…
                </ChapterCard>
              ) : directors.length === 0 ? (
                <ChapterCard className="text-muted-foreground">
                  No directors yet. Add directors from Team & Roles.
                </ChapterCard>
              ) : (
                directors.map((d) => {
                  const open = expanded[d.director._id] !== false;
                  const directorDonations = donationsByDirector.get(d.director._id) || [];
                  return (
                    <ChapterCard key={d.director._id} className="overflow-hidden p-0">
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left hover:bg-secondary/50"
                        onClick={() =>
                          setExpanded((prev) => ({
                            ...prev,
                            [d.director._id]: !open,
                          }))
                        }
                      >
                        {open ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{d.director.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(d.members || []).length} member{(d.members || []).length === 1 ? "" : "s"} ·{" "}
                            {fmt(d.grandTotal)} this month
                          </p>
                        </div>
                        <div className="text-right text-xs">
                          <p className="text-amber-700">Pending {fmt(d.pendingTotal)}</p>
                          <p className="text-emerald-700">Verified {fmt(d.verifiedTotal)}</p>
                        </div>
                      </button>
                      {open ? (
                        <div className="grid gap-0 lg:grid-cols-2">
                          <div className="border-b border-border lg:border-b-0 lg:border-r">
                            <div className="border-b border-border px-4 py-2">
                              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Members
                              </h4>
                            </div>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Email</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(d.members || []).length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={2} className="text-muted-foreground">
                                      No members assigned yet.
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  (d.members || []).map((m) => (
                                    <TableRow key={m._id}>
                                      <TableCell className="font-medium">{m.name}</TableCell>
                                      <TableCell className="text-sm">{m.email || "—"}</TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </div>
                          <div>
                            <div className="border-b border-border px-4 py-2">
                              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Donations ({periodLabel})
                              </h4>
                            </div>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Member</TableHead>
                                  <TableHead>Amount</TableHead>
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {directorDonations.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={3} className="text-muted-foreground">
                                      No donations this month.
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  directorDonations.map((r) => (
                                    <TableRow key={r._id}>
                                      <TableCell className="font-medium">{r.donor?.name || "—"}</TableCell>
                                      <TableCell>{fmt(r.amount)}</TableCell>
                                      <TableCell>
                                        <Badge variant="secondary">{r.status}</Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      ) : null}
                    </ChapterCard>
                  );
                })
              )}
            </div>
          </TabsContent>
        ) : null}

        <TabsContent value="by-director">
          <ChapterCard className="overflow-x-auto p-0 md:p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Director</TableHead>
                  <TableHead className="text-right">Members</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                  <TableHead className="text-right">Verified</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading…
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {directors.map((d) => (
                      <TableRow key={d.director._id}>
                        <TableCell className="font-medium">
                          {d.director.name}
                          {d.director.chapterRole ? (
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {d.director.chapterRole.replace(/_/g, " ")}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {(d.members || []).length}
                        </TableCell>
                        <TableCell className="text-right text-amber-700">{fmt(d.pendingTotal)}</TableCell>
                        <TableCell className="text-right text-emerald-700">
                          {fmt(d.verifiedTotal)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">{fmt(d.grandTotal)}</TableCell>
                      </TableRow>
                    ))}
                    {!isCabinet ? (
                      <TableRow>
                        <TableCell className="text-muted-foreground">President / VP own collection</TableCell>
                        <TableCell className="text-right text-muted-foreground">—</TableCell>
                        <TableCell className="text-right text-amber-700">
                          {fmt(unassigned.pendingTotal)}
                        </TableCell>
                        <TableCell className="text-right text-emerald-700">
                          {fmt(unassigned.verifiedTotal)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {fmt(unassigned.grandTotal)}
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </>
                )}
              </TableBody>
            </Table>
          </ChapterCard>
        </TabsContent>

        <TabsContent value="all">
          <ChapterCard className="overflow-x-auto p-0 md:p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Director team</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading…
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      No donations this month yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell className="font-medium">{r.donor?.name || "—"}</TableCell>
                      <TableCell>
                        {r.source === "bog"
                          ? "BOG / Board"
                          : r.teamDirector?.name || "Own collection"}
                      </TableCell>
                      <TableCell>{fmt(r.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{r.status}</Badge>
                      </TableCell>
                      <TableCell className="space-x-1 text-right">
                        {r.screenshotUrl ? (
                          <Button size="sm" variant="outline" asChild>
                            <a href={r.screenshotUrl} target="_blank" rel="noreferrer">
                              SS
                            </a>
                          </Button>
                        ) : null}
                        {r.status === "pending" && canVerify ? (
                          <>
                            <Button
                              size="sm"
                              disabled={busyId === r._id}
                              onClick={() => void verify(r._id, "verified")}
                            >
                              {busyId === r._id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                              Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              disabled={busyId === r._id}
                              onClick={() => void verify(r._id, "rejected")}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ChapterCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
