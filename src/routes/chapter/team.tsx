import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Check, Loader2, Trash2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { ChapterCard, ChapterPageHeader } from "@/components/chapter/ChapterPage";
import {
  CABINET_ASSIGNABLE_ROLES,
  CHAPTER_ROLE_LABEL,
  canAssignChapterRoles,
  canManageCabinetTeam,
  canReviewJoinRequests,
  idOfRef,
  isCabinetRole,
  isChapterPresident,
  isOwnCollectionRole,
  isTeamDirectorRole,
  type ChapterRole,
} from "@/lib/chapterRoles";
import { api, ApiRequestError, type AuthUser } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

function roleLabel(role: string | undefined): string {
  if (!role) return CHAPTER_ROLE_LABEL.member;
  return CHAPTER_ROLE_LABEL[role as ChapterRole] || role;
}

/** Short team name from a cabinet seat role */
const TEAM_NAME: Record<string, string> = {
  operations_head: "Operations",
  verification_head: "Verification",
  media_head: "Media",
  finance_head: "Finance",
  documentation_head: "Documentation",
};

function teamNameFromCabinetRole(role?: string | null): string {
  if (!role) return "Team";
  return TEAM_NAME[role] || roleLabel(role).replace(/^Cabinet — /, "");
}

function cabinetRoleOf(user: AuthUser | null | undefined): string | null {
  if (!user) return null;
  if (isCabinetRole(user.chapterRole)) return user.chapterRole || null;
  const cm = user.cabinetMember;
  if (cm && typeof cm === "object" && cm.chapterRole) return cm.chapterRole;
  return null;
}

/** e.g. "Sara · Documentation Director" */
function directorDisplayName(
  director: { name?: string; cabinetMember?: AuthUser["cabinetMember"] } | null | undefined,
  fallbackCabinetRole?: string | null,
): string {
  if (!director?.name) return "—";
  const cm = director.cabinetMember;
  const role =
    (cm && typeof cm === "object" ? cm.chapterRole : null) || fallbackCabinetRole || null;
  const team = teamNameFromCabinetRole(role);
  return `${director.name} · ${team} Director`;
}

function memberRoleDisplay(u: AuthUser): string {
  if (isTeamDirectorRole(u.chapterRole)) {
    const team = teamNameFromCabinetRole(cabinetRoleOf(u));
    return `${team} Director`;
  }
  return roleLabel(u.chapterRole);
}

function refId(u: AuthUser, key: "cabinetMember" | "teamDirector"): string {
  return idOfRef(u[key]) || "none";
}

type JoinApproval = {
  leadershipApproved?: boolean;
  cabinetApproved?: boolean;
  leadershipApprovedBy?: { name?: string } | null;
  cabinetApprovedBy?: { name?: string } | null;
};

type JoinRequest = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  requestedCabinetRole?: string;
  teamLabel?: string;
  createdAt?: string;
  approvals?: JoinApproval;
};

const emptyForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  chapterRole: "operations_head" as ChapterRole,
  /** Cabinet create: director or general member */
  accountType: "member" as "director" | "member",
  teamDirector: "none",
};

export default function ChapterTeamPage() {
  const { user: me, refresh } = useAuth();
  const canAssign = canAssignChapterRoles(me);
  const isCabinet = canManageCabinetTeam(me);
  const canDeleteAccounts = isChapterPresident(me);
  const canReviewJoins = canReviewJoinRequests(me);
  const [rows, setRows] = useState<AuthUser[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [joinBusyId, setJoinBusyId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const myDirectors = useMemo(
    () =>
      rows.filter(
        (u) =>
          isTeamDirectorRole(u.chapterRole) &&
          idOfRef(u.cabinetMember) === me?._id &&
          u.isActive !== false,
      ),
    [rows, me?._id],
  );

  const takenRoles = useMemo(
    () =>
      new Set(
        rows
          .filter(
            (u) =>
              u.isActive !== false &&
              CABINET_ASSIGNABLE_ROLES.includes((u.chapterRole as ChapterRole) || "member"),
          )
          .map((u) => u.chapterRole as ChapterRole),
      ),
    [rows],
  );

  const availableRoles = useMemo(
    () => CABINET_ASSIGNABLE_ROLES.filter((r) => !takenRoles.has(r)),
    [takenRoles],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const tasks: Promise<unknown>[] = [
        api<{ success: true; data: AuthUser[] }>("/users?limit=200").then((res) => {
          setRows(res.data || []);
        }),
      ];
      if (canReviewJoins) {
        tasks.push(
          api<{ success: true; data: JoinRequest[] }>("/users/join-requests")
            .then((res) => setJoinRequests(res.data || []))
            .catch(() => setJoinRequests([])),
        );
      } else {
        setJoinRequests([]);
      }
      await Promise.all(tasks);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load team");
    } finally {
      setLoading(false);
    }
  }, [canReviewJoins]);

  useEffect(() => {
    void load();
  }, [load]);

  async function reviewJoin(id: string, action: "approve" | "reject") {
    setJoinBusyId(id);
    try {
      const res = await api<{ success: true; message?: string }>(`/users/${id}/join-${action}`, {
        method: "PATCH",
      });
      toast.success(
        res.message ||
          (action === "approve" ? "Approval recorded" : "Join request rejected"),
      );
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Update failed");
    } finally {
      setJoinBusyId(null);
    }
  }

  async function changeRole(userId: string, chapterRole: string) {
    if (userId === me?._id) {
      toast.error("You cannot change your own role.");
      return;
    }
    try {
      await api(`/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ chapterRole }),
      });
      toast.success("Role updated");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Update failed");
    }
  }

  async function changeDirector(userId: string, teamDirector: string) {
    try {
      await api(`/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({
          teamDirector: teamDirector === "none" ? null : teamDirector,
        }),
      });
      toast.success("Director assignment updated");
      await load();
      if (userId === me?._id) await refresh();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Update failed");
    }
  }

  async function deleteAccount(u: AuthUser) {
    if (
      !window.confirm(
        `Delete account for ${u.name} (${u.email})? This cannot be undone.`,
      )
    ) {
      return;
    }
    setDeletingId(u._id);
    try {
      await api(`/users/${u._id}`, { method: "DELETE" });
      toast.success("Account deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to delete account");
    } finally {
      setDeletingId(null);
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      toast.error("Name, email, and password are required");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setSaving(true);
    try {
      if (isCabinet && !canAssign) {
        if (form.accountType === "member") {
          await api("/users/team-members", {
            method: "POST",
            body: JSON.stringify({
              name: form.name.trim(),
              email: form.email.trim(),
              password: form.password,
              phone: form.phone.trim() || undefined,
              teamDirector: form.teamDirector === "none" ? null : form.teamDirector,
            }),
          });
          toast.success("Member created — share the email and password with them");
        } else {
          await api("/users/team-directors", {
            method: "POST",
            body: JSON.stringify({
              name: form.name.trim(),
              email: form.email.trim(),
              password: form.password,
              phone: form.phone.trim() || undefined,
            }),
          });
          toast.success("Director account created — share the email and password with them");
        }
      } else {
        await api("/users/chapter-directors", {
          method: "POST",
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
            phone: form.phone.trim() || undefined,
            chapterRole: form.chapterRole,
          }),
        });
        toast.success("Account created — share the email and password with them");
      }
      setForm(emptyForm);
      setOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to create account");
    } finally {
      setSaving(false);
    }
  }

  const canCreate = canAssign ? availableRoles.length > 0 : isCabinet;
  const createLabel = canAssign
    ? "Add VP / cabinet"
    : form.accountType === "director"
      ? "Add director"
      : "Add member";

  const generalMembers = useMemo(
    () =>
      rows.filter(
        (u) => u.chapterRole === "member" || u.chapterRole === "assistant_director",
      ),
    [rows],
  );

  return (
    <div>
      <ChapterPageHeader
        title="Team & Roles"
        description={
          canAssign
            ? "Approve join requests and create Vice Presidents / cabinet seats. Members are verified into a team on join — cabinet heads assign them to directors."
            : isCabinet
              ? "See all general members for your team, add members or directors, then assign each member to a director."
              : "Chapter login accounts and their roles."
        }
        actions={
          canCreate ? (
            <Dialog
              open={open}
              onOpenChange={(v) => {
                setOpen(v);
                if (v) {
                  setForm((f) => ({
                    ...emptyForm,
                    chapterRole: availableRoles[0] || f.chapterRole,
                    accountType: isCabinet && !canAssign ? "member" : f.accountType,
                  }));
                }
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4" />
                  {isCabinet && !canAssign ? "Add member / director" : createLabel}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md sm:rounded-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {canAssign
                      ? "Add VP or cabinet member"
                      : form.accountType === "director"
                        ? "Add director"
                        : "Add general member"}
                  </DialogTitle>
                  <DialogDescription>
                    {canAssign
                      ? "Creates a chapter login. One active seat per cabinet role."
                      : form.accountType === "director"
                        ? "Creates a director under your cabinet. Share the email and password with them."
                        : "Creates a general member on your team. You can assign them to a director now or later."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={onCreate} className="space-y-3">
                  {isCabinet && !canAssign ? (
                    <div>
                      <Label>Account type</Label>
                      <Select
                        value={form.accountType}
                        onValueChange={(v) =>
                          setForm((f) => ({
                            ...f,
                            accountType: v as "director" | "member",
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">General member</SelectItem>
                          <SelectItem value="director">Director</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                  <div>
                    <Label htmlFor="dir-name">Full name</Label>
                    <Input
                      id="dir-name"
                      required
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dir-email">Email</Label>
                    <Input
                      id="dir-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dir-phone">Phone (optional)</Label>
                    <Input
                      id="dir-phone"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                  {canAssign ? (
                    <div>
                      <Label>Role</Label>
                      <Select
                        value={form.chapterRole}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, chapterRole: v as ChapterRole }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRoles.map((r) => (
                            <SelectItem key={r} value={r}>
                              {CHAPTER_ROLE_LABEL[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                  {isCabinet && !canAssign && form.accountType === "member" ? (
                    <div>
                      <Label>Assign director (optional)</Label>
                      <Select
                        value={form.teamDirector}
                        onValueChange={(v) => setForm((f) => ({ ...f, teamDirector: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {myDirectors.map((d) => (
                            <SelectItem key={d._id} value={d._id}>
                              {directorDisplayName(d, me?.chapterRole)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                  <div>
                    <Label htmlFor="dir-password">Password</Label>
                    <Input
                      id="dir-password"
                      type="password"
                      required
                      minLength={6}
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dir-confirm">Confirm password</Label>
                    <Input
                      id="dir-confirm"
                      type="password"
                      required
                      minLength={6}
                      value={form.confirmPassword}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, confirmPassword: e.target.value }))
                      }
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={saving || (canAssign && availableRoles.length === 0)}>
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Creating…
                        </>
                      ) : (
                        "Create account"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      {canReviewJoins ? (
        <ChapterCard className="mb-5 overflow-x-auto p-0 md:p-0">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">Pending join requests</h3>
            <p className="text-xs text-muted-foreground">
              Any one of the president, a VP, or this team&apos;s cabinet head can approve. After
              that, the member can log in.
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Requested</TableHead>
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
              ) : joinRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No pending join requests.
                  </TableCell>
                </TableRow>
              ) : (
                joinRequests.map((r) => (
                  <TableRow key={r._id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{r.teamLabel || r.requestedCabinetRole || "—"}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="space-x-1 text-right">
                      <Button
                        size="sm"
                        disabled={joinBusyId === r._id}
                        onClick={() => void reviewJoin(r._id, "approve")}
                      >
                        {joinBusyId === r._id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        disabled={joinBusyId === r._id}
                        onClick={() => void reviewJoin(r._id, "reject")}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ChapterCard>
      ) : null}

      {isCabinet && !canAssign ? (
        <ChapterCard className="mb-4">
          <p className="text-sm font-semibold">
            Your team · {generalMembers.length} general member
            {generalMembers.length === 1 ? "" : "s"} · {myDirectors.length} director
            {myDirectors.length === 1 ? "" : "s"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Use the Director column on each general member to assign them. Or click{" "}
            <span className="font-medium">Add member / director</span> to create a new account.
          </p>
        </ChapterCard>
      ) : null}

      <ChapterCard className="overflow-x-auto p-0 md:p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Director</TableHead>
              {canDeleteAccounts ? <TableHead className="text-right">Actions</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={canDeleteAccounts ? 5 : 4} className="text-muted-foreground">
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canDeleteAccounts ? 5 : 4} className="text-muted-foreground">
                  No users found for this chapter.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((u) => {
                const isSelf = u._id === me?._id;
                const isTargetPresident =
                  u.systemRole === "president" || u.chapterRole === "president";
                const ownCollectionOnly =
                  isTargetPresident || isOwnCollectionRole(u.chapterRole);
                const canEditRole = canAssign && !isSelf && !isTargetPresident;
                const isMember =
                  u.chapterRole === "member" || u.chapterRole === "assistant_director";
                // President / VPs do not assign members — cabinet assigns directors to general members
                const inMyCabinet = idOfRef(u.cabinetMember) === me?._id;
                const relatedToMyTeam =
                  inMyCabinet || u.requestedCabinetRole === me?.chapterRole;
                const canEditDirector =
                  isCabinet && !canAssign && isMember && relatedToMyTeam;
                const current = (u.chapterRole as ChapterRole) || "member";
                const selectValue = CABINET_ASSIGNABLE_ROLES.includes(current)
                  ? current
                  : undefined;
                const showDelete = canDeleteAccounts && !isSelf && !isTargetPresident;

                return (
                  <TableRow key={u._id}>
                    <TableCell className="font-medium">
                      {u.name}
                      {isSelf ? (
                        <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                      ) : null}
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      {canEditRole ? (
                        <Select
                          value={selectValue}
                          onValueChange={(v) => void changeRole(u._id, v)}
                        >
                          <SelectTrigger className="w-[240px]">
                            <SelectValue placeholder={roleLabel(current)} />
                          </SelectTrigger>
                          <SelectContent>
                            {CABINET_ASSIGNABLE_ROLES.map((r) => (
                              <SelectItem key={r} value={r}>
                                {CHAPTER_ROLE_LABEL[r]}
                              </SelectItem>
                            ))}
                            {current !== "member" ? (
                              <SelectItem value="member">Remove role</SelectItem>
                            ) : null}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-sm">
                          {memberRoleDisplay(u)}
                          {isSelf && canAssign ? (
                            <span className="ml-2 text-xs text-muted-foreground">— locked</span>
                          ) : null}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {ownCollectionOnly || isCabinetRole(u.chapterRole) ? (
                        <span className="text-xs text-muted-foreground">Own collection</span>
                      ) : isTeamDirectorRole(u.chapterRole) ? (
                        <span className="text-xs font-medium text-foreground">
                          {memberRoleDisplay(u)}
                        </span>
                      ) : canEditDirector ? (
                        myDirectors.length === 0 ? (
                          <span className="text-xs text-amber-700 dark:text-amber-400">
                            Add a director first, then assign
                          </span>
                        ) : (
                          <Select
                            value={refId(u, "teamDirector")}
                            onValueChange={(v) => void changeDirector(u._id, v)}
                          >
                            <SelectTrigger className="w-[260px]">
                              <SelectValue placeholder="Assign director" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Unassigned</SelectItem>
                              {myDirectors.map((d) => (
                                <SelectItem key={d._id} value={d._id}>
                                  {directorDisplayName(d, me?.chapterRole)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {typeof u.teamDirector === "object" && u.teamDirector?.name
                            ? directorDisplayName(
                                {
                                  name: u.teamDirector.name,
                                  cabinetMember: u.cabinetMember,
                                },
                                cabinetRoleOf(u),
                              )
                            : "Unassigned"}
                        </span>
                      )}
                    </TableCell>
                    {canDeleteAccounts ? (
                      <TableCell className="text-right">
                        {showDelete ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            disabled={deletingId === u._id}
                            onClick={() => void deleteAccount(u)}
                          >
                            {deletingId === u._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Delete
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {isSelf ? "You" : isTargetPresident ? "President" : "—"}
                          </span>
                        )}
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </ChapterCard>
    </div>
  );
}
