import { useState } from "react";
import { Building2, Check, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LOCAL_WEBSITE_DEFAULTS, useWebsitePage } from "@/lib/websiteContent";
import { cn } from "@/lib/utils";

export type BankAccountInfo = {
  bankName?: string;
  accountTitle?: string;
  accountNumber?: string;
  iban?: string;
  note?: string;
};

type DonateSections = {
  cta?: string;
  bankAccount?: BankAccountInfo;
};

const DEFAULT_BANK =
  ((LOCAL_WEBSITE_DEFAULTS.donate as DonateSections | undefined)?.bankAccount as BankAccountInfo) ||
  {};

export function useDonateBankAccount() {
  const { sections, loading } = useWebsitePage<DonateSections>("donate");
  const bank = { ...DEFAULT_BANK, ...(sections.bankAccount || {}) };
  const cta = sections.cta || "Donate now";
  return { bank, cta, loading };
}

export function DonateAccountButton({
  label,
  className,
  bank: bankOverride,
}: {
  label?: string;
  className?: string;
  bank?: BankAccountInfo;
}) {
  const { bank: cmsBank, cta } = useDonateBankAccount();
  const bank = { ...cmsBank, ...(bankOverride || {}) };
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyAccount() {
    const value = String(bank.accountNumber || "").trim();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "rounded-full bg-gradient-warm px-10 py-4 text-base font-bold text-white shadow-warm transition-transform hover:-translate-y-0.5",
          className,
        )}
      >
        {label || cta}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md overflow-hidden border-border sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Bank transfer details</DialogTitle>
            <DialogDescription>
              Send your donation to the official Serve Humanity account below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-secondary/60 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-blue">
                <Building2 className="h-3.5 w-3.5" />
                {bank.bankName || "Bank account"}
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Account title</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">
                    {bank.accountTitle || "Serve Humanity"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Account number</dt>
                  <dd className="mt-1 flex items-center gap-2">
                    <span className="font-display text-xl font-bold tracking-wide text-brand-blue">
                      {bank.accountNumber || "—"}
                    </span>
                    <button
                      type="button"
                      onClick={() => void copyAccount()}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:border-brand-orange hover:text-brand-orange"
                      aria-label="Copy account number"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </dd>
                </div>
                {bank.iban ? (
                  <div>
                    <dt className="text-xs text-muted-foreground">IBAN</dt>
                    <dd className="mt-0.5 break-all font-medium text-foreground">{bank.iban}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
            {bank.note ? (
              <p className="text-xs leading-relaxed text-muted-foreground">{bank.note}</p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
