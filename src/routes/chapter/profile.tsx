import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ChapterCard, ChapterPageHeader } from "@/components/chapter/ChapterPage";
import { useAuth } from "@/lib/auth";
import { CHAPTER_ROLE_LABEL, resolveChapterRole } from "@/lib/chapterRoles";
import { api, ApiRequestError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ChapterProfilePage() {
  const { user, refresh } = useAuth();
  const role = resolveChapterRole(user ?? {});
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setPhone(user?.phone || "");
  }, [user?.name, user?.email, user?.phone]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    setSaving(true);
    try {
      await api(`/users/${user._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
        }),
      });
      await refresh();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    if (pw.next.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (pw.next !== pw.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setPwSaving(true);
    try {
      await api("/auth/change-password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
      });
      toast.success("Password changed");
      setPw({ current: "", next: "", confirm: "" });
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Password change failed");
    } finally {
      setPwSaving(false);
    }
  }

  const chapterName =
    user?.chapter && typeof user.chapter === "object" ? user.chapter.name : "—";

  return (
    <div>
      <ChapterPageHeader title="My Profile" description="Your chapter account details." />

      <div className="grid gap-5 lg:grid-cols-2">
        <ChapterCard>
          <h3 className="mb-4 text-sm font-semibold">Account</h3>
          <dl className="mb-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Role</dt>
              <dd>{CHAPTER_ROLE_LABEL[role]}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Chapter</dt>
              <dd>{chapterName || "—"}</dd>
            </div>
          </dl>
          <form onSubmit={saveProfile} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">Name</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-email">Email (login)</Label>
              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <p className="text-xs text-muted-foreground">
                This is your login email. It must be unique.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-phone">Phone</Label>
              <Input
                id="profile-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save profile"}
            </Button>
          </form>
        </ChapterCard>

        <ChapterCard>
          <h3 className="mb-4 text-sm font-semibold">Change password</h3>
          <form onSubmit={changePassword} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Current password</Label>
              <Input
                type="password"
                value={pw.current}
                onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>New password</Label>
              <Input
                type="password"
                value={pw.next}
                onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm</Label>
              <Input
                type="password"
                value={pw.confirm}
                onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
              />
            </div>
            <Button type="submit" disabled={pwSaving}>
              {pwSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
            </Button>
          </form>
        </ChapterCard>
      </div>
    </div>
  );
}
