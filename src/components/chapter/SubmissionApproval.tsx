import { Check, Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type ApprovalStatus = "draft" | "pending" | "approved" | "rejected";

export function approvalBadgeVariant(status?: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "approved") return "default";
  if (status === "rejected") return "destructive";
  if (status === "pending") return "outline";
  return "secondary";
}

export function ApprovalStatusBadge({ status }: { status?: string }) {
  const label = status || "pending";
  return (
    <Badge variant={approvalBadgeVariant(status)} className="capitalize">
      {label}
    </Badge>
  );
}

export function SubmissionApprovalActions({
  approvalStatus,
  canReview,
  busy,
  onApprove,
  onReject,
}: {
  approvalStatus?: string;
  canReview: boolean;
  busy?: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  if (!canReview || approvalStatus !== "pending") return null;
  return (
    <>
      <Button size="sm" variant="outline" disabled={busy} onClick={onApprove}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        Approve
      </Button>
      <Button size="sm" variant="ghost" className="text-destructive" disabled={busy} onClick={onReject}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </>
  );
}
