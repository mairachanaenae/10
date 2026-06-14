import Link from "next/link";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { TXNS, type TxnType } from "@/lib/history";

const typeStyle: Record<TxnType, string> = {
  Buy: "border-blue/60 text-blue",
  Sell: "border-gold/60 text-gold",
  Dividend: "border-emerald/60 text-emerald",
  Deposit: "border-violet/60 text-violet",
};

export function RecentActivity() {
  const rows = TXNS.slice(0, 5);
  return (
    <div>
      <Table>
        <TableBody>
          {rows.map((t, i) => (
            <TableRow key={i}>
              <TableCell className="tnum text-[12px] text-muted">{t.date.slice(5)}</TableCell>
              <TableCell>
                <span className={"rounded-full border px-2 py-0.5 text-[11px] " + typeStyle[t.type]}>{t.type}</span>
              </TableCell>
              <TableCell className="font-mono text-[12.5px] text-blue">{t.symbol}</TableCell>
              <TableCell className="text-[12.5px] text-muted">{t.detail}</TableCell>
              <TableCell className={"text-right tnum text-[12.5px] " + (t.amount >= 0 ? "text-emerald" : "text-ink")}>
                {t.amount >= 0 ? "+" : "−"}${Math.abs(t.amount).toFixed(0)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Link href="/portfolio" className="mt-3 inline-block text-[12px] text-blue hover:underline">
        View full portfolio →
      </Link>
    </div>
  );
}
