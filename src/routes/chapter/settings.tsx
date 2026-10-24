import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { ChapterCard, ChapterPageHeader } from "@/components/chapter/ChapterPage";
import {
  isChapterLeadership,
  isChapterPresident,
  resolveChapterRole,
} from "@/lib/chapterRoles";
import { useAuth } from "@/lib/auth";
import { api, ApiRequestError, chapterIdFromUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DonationAccount = {
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  note: string;
};

const emptyAccount = (): DonationAccount => ({
  bankName: "",
  accountTitle: "",
  accountNumber: "",
  iban: "",
  note: "",
});

export default function ChapterSettingsPage() {
  const { user } = useAuth();
  const role = resolveChapterRole(user ?? {});
  const isPresident = isChapterPresident(user);
  const chapterId = chapterIdFromUser(user);

  const [accounts, setAccounts] = useState<DonationAccount[]>([emptyAccount()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const chapterName =
    user?.chapter && typeof user.chapter === "object" ? user.chapter.name : "Chapter";
  const city =
    user?.chapter && typeof user.chapter === "object" ? user.chapter.city || "—" : "—";

  const load = useCallback(async () => {
    if (!chapterId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api<{
        success: true;
        data: { donationAccounts?: DonationAccount[] };
      }>(`/chapters/${chapterId}`);
      const list = (res.data?.donationAccounts || []).map((a) => ({
        bankName: a.bankName || "",
        accountTitle: a.accountTitle || "",
        accountNumber: a.accountNumber || "",
        iban: a.iban || "",
        note: a.note || "",
      }));
      setAccounts(list.length ? list : [emptyAccount()]);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load chapter settings");
    } finally {
      setLoading(false);
    }
  }, [chapterId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!isChapterLeadership(role)) {
    return <Navigate to="/chapter" replace />;
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!chapterId || !isPresident) return;
    const cleaned = accounts
      .map((a) => ({
        bankName: a.bankName.trim(),
        accountTitle: a.accountTitle.trim(),
        accountNumber: a.accountNumber.trim(),
        iban: a.iban.trim(),
        note: a.note.trim(),
      }))
      .filter((a) => a.accountNumber || a.bankName || a.accountTitle);
    if (cleaned.length === 0) {
      toast.error("Add at least one account with an account number");
      return;
    }
    if (cleaned.some((a) => !a.accountNumber)) {
      toast.error("Each account needs an account number");
      return;
    }
    setSaving(true);
    try {
      await api(`/chapters/${chapterId}/donation-accounts`, {
        method: "PATCH",
        body: JSON.stringify({ donationAccounts: cleaned }),
      });
      toast.success("Donation accounts updated — they now show on the website Donate page");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to save accounts");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <ChapterPageHeader
        title="Chapter settings"
        description="Leadership preferences for your chapter workspace."
      />
      <ChapterCard>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-3 border-b border-border pb-3">
            <dt className="text-muted-foreground">Chapter</dt>
            <dd className="font-medium">{chapterName}</dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-border pb-3">
            <dt className="text-muted-foreground">City</dt>
            <dd className="font-medium">{city}</dd>
          </div>
          <p className="text-muted-foreground">
            Role assignments are managed under Team & Roles. Contact the CEO office for chapter
            profile changes (name, city, budget).
          </p>
        </dl>
      </ChapterCard>

      {isPresident ? (
        <ChapterCard className="mt-5">
          <h3 className="font-display text-lg font-semibold">Website donation accounts</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            These accounts appear when someone clicks your chapter on the public Donate page. You can
            add up to 3 accounts.
          </p>

          {loading ? (
            <p className="mt-4 text-sm text-muted-foreground">
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading…
            </p>
          ) : (
            <form onSubmit={(e) => void onSave(e)} className="mt-5 space-y-5">
              {accounts.map((acc, idx) => (
                <div key={idx} className="rounded-2xl border border-border bg-secondary/40 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold">Account {idx + 1}</p>
                    {accounts.length > 1 ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => setAccounts((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    ) : null}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Bank name</Label>
                      <Input
                        value={acc.bankName}
                        onChange={(e) =>
                          setAccounts((prev) =>
                            prev.map((a, i) => (i === idx ? { ...a, bankName: e.target.value } : a)),
                          )
                        }
                        placeholder="e.g. Meezan Bank"
                      />
                    </div>
                    <div>
                      <Label>Account title</Label>
                      <Input
                        value={acc.accountTitle}
                        onChange={(e) =>
                          setAccounts((prev) =>
                            prev.map((a, i) =>
                              i === idx ? { ...a, accountTitle: e.target.value } : a,
                            ),
                          )
                        }
                        placeholder="Serve Humanity — City"
                      />
                    </div>
                    <div>
                      <Label>
                        Account number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        required
                        value={acc.accountNumber}
                        onChange={(e) =>
                          setAccounts((prev) =>
                            prev.map((a, i) =>
                              i === idx ? { ...a, accountNumber: e.target.value } : a,
                            ),
                          )
                        }
                        placeholder="0123456789"
                      />
                    </div>
                    <div>
                      <Label>IBAN (optional)</Label>
                      <Input
                        value={acc.iban}
                        onChange={(e) =>
                          setAccounts((prev) =>
                            prev.map((a, i) => (i === idx ? { ...a, iban: e.target.value } : a)),
                          )
                        }
                        placeholder="PK00XXXX…"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Note (optional)</Label>
                      <Input
                        value={acc.note}
                        onChange={(e) =>
                          setAccounts((prev) =>
                            prev.map((a, i) => (i === idx ? { ...a, note: e.target.value } : a)),
                          )
                        }
                        placeholder="e.g. For Zakat only"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {accounts.length < 3 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAccounts((prev) => [...prev, emptyAccount()])}
                >
                  <Plus className="h-4 w-4" />
                  Add another account
                </Button>
              ) : null}

              <div>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                    </>
                  ) : (
                    "Save donation accounts"
                  )}
                </Button>
              </div>
            </form>
          )}
        </ChapterCard>
      ) : (
        <ChapterCard className="mt-5">
          <p className="text-sm text-muted-foreground">
            Only the chapter president can publish bank account numbers for the website Donate page.
          </p>
        </ChapterCard>
      )}
    </div>
  );
}
