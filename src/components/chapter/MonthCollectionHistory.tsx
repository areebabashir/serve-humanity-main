import { ChapterCard } from "@/components/chapter/ChapterPage";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type MonthCollectionRow = {
  year: number;
  month: number;
  label: string;
  pending?: number;
  verified?: number;
  total: number;
  count?: number;
};

function fmt(n: number) {
  return `PKR ${Number(n || 0).toLocaleString()}`;
}

/** Saved previous months; current month is shown separately in KPI cards. */
export function MonthCollectionHistory({
  rows,
  currentYear,
  currentMonth,
}: {
  rows: MonthCollectionRow[];
  currentYear?: number;
  currentMonth?: number;
}) {
  const now = new Date();
  const y = currentYear ?? now.getFullYear();
  const m = currentMonth ?? now.getMonth() + 1;

  const previous = rows.filter((r) => !(r.year === y && r.month === m));

  return (
    <ChapterCard className="overflow-x-auto p-0 md:p-0">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">Previous months (saved)</h3>
        <p className="text-xs text-muted-foreground">
          When a new month starts, this month&apos;s total resets to zero. Past months stay here.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Month</TableHead>
            <TableHead className="text-right">Pending</TableHead>
            <TableHead className="text-right">Verified</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Entries</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {previous.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground">
                No previous months yet. Totals for past months will appear here after month end.
              </TableCell>
            </TableRow>
          ) : (
            previous.map((r) => (
              <TableRow key={`${r.year}-${r.month}`}>
                <TableCell className="font-medium">{r.label}</TableCell>
                <TableCell className="text-right text-amber-700">{fmt(r.pending ?? 0)}</TableCell>
                <TableCell className="text-right text-emerald-700">{fmt(r.verified ?? 0)}</TableCell>
                <TableCell className="text-right font-semibold">{fmt(r.total)}</TableCell>
                <TableCell className="text-right">{r.count ?? 0}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </ChapterCard>
  );
}
