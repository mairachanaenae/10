"use client";

import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DIVIDEND_HISTORY,
  NET_WORTH_HISTORY,
  TXNS,
  historyStats,
  type TxnType,
} from "@/lib/history";

const typeStyle: Record<TxnType, string> = {
  Buy: "border-blue/60 text-blue",
  Sell: "border-gold/60 text-gold",
  Dividend: "border-emerald/60 text-emerald",
  Deposit: "border-violet/60 text-violet",
};

const tip = {
  background: "#0e1320",
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 12,
  fontSize: 12,
};

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="glass p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-faint">{label}</div>
      <div className={"mt-1 font-display text-xl font-bold tnum " + (accent ?? "text-ink")}>{value}</div>
    </div>
  );
}

export function FinancialHistory() {
  const s = historyStats();
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Net worth now" value={`$${s.last.toLocaleString()}`} />
        <Stat label="Growth (10mo)" value={`+${s.growthPct.toFixed(1)}%`} accent="text-emerald" />
        <Stat label="Dividends booked" value={`$${s.dividends.toFixed(0)}`} accent="text-emerald" />
        <Stat label="Contributions" value={`$${s.deposits.toFixed(0)}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass p-5 lg:col-span-2">
          <div className="mb-3 font-display text-[13px] font-semibold">Net worth over time</div>
          <div className="h-[210px] w-full">
            <ResponsiveContainer>
              <AreaChart data={NET_WORTH_HISTORY} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="nw" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6ea8fe" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6ea8fe" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fill: "#5e6b86", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#5e6b86", fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
                <Tooltip contentStyle={tip} formatter={(v: number) => [`$${v.toLocaleString()}`, "net worth"]} />
                <Area type="monotone" dataKey="value" stroke="#6ea8fe" strokeWidth={2.4} fill="url(#nw)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-5">
          <div className="mb-3 font-display text-[13px] font-semibold">Dividend income / quarter</div>
          <div className="h-[210px] w-full">
            <ResponsiveContainer>
              <BarChart data={DIVIDEND_HISTORY} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
                <XAxis dataKey="period" tick={{ fill: "#5e6b86", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#5e6b86", fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
                <Tooltip contentStyle={tip} cursor={{ fill: "rgba(255,255,255,.04)" }} formatter={(v: number) => [`$${v}`, "dividends"]} />
                <Bar dataKey="amount" fill="#38bdf8" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass p-5">
        <div className="mb-3 font-display text-[13px] font-semibold">Transaction history</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Detail</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {TXNS.map((t, i) => (
              <TableRow key={i}>
                <TableCell className="tnum text-muted">{t.date}</TableCell>
                <TableCell>
                  <span className={"rounded-full border px-2 py-0.5 text-[11px] " + typeStyle[t.type]}>{t.type}</span>
                </TableCell>
                <TableCell className="font-mono text-blue">{t.symbol}</TableCell>
                <TableCell className="text-muted">{t.detail}</TableCell>
                <TableCell className={"text-right tnum " + (t.amount >= 0 ? "text-emerald" : "text-ink")}>
                  {t.amount >= 0 ? "+" : "−"}${Math.abs(t.amount).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="mt-3 text-[11px] text-faint">Illustrative ledger. On a live deploy this is your real, private transaction history.</p>
      </div>
    </div>
  );
}
