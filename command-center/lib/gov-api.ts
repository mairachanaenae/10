// Live US federal data — no API key required.
//  • USAspending.gov  → outlays by budget function ("where it goes") + total
//  • Treasury FiscalData → debt held by the public / total public debt
// Both are public open-data APIs with CORS enabled. Returns null on failure so
// the UI can fall back to clearly-labelled sample numbers.

export interface GovFunction {
  name: string;
  amount: number; // dollars
}
export interface GovData {
  totalOutlays: number; // dollars
  fiscalLabel: string;
  functions: GovFunction[];
  debtPublic: number; // dollars
  totalDebt: number; // dollars
}

async function fetchSpending(): Promise<{ total: number; end: string; functions: GovFunction[] } | null> {
  const now = new Date();
  const fy = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
  const combos: [number, number][] = [
    [fy, 3], [fy, 2], [fy, 1], [fy - 1, 4], [fy - 2, 4],
  ];
  for (const [year, quarter] of combos) {
    try {
      const res = await fetch("https://api.usaspending.gov/api/v2/spending/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "budget_function", filters: { fy: String(year), quarter } }),
      });
      if (!res.ok) continue;
      const d = await res.json();
      if (Array.isArray(d?.results) && d.results.length) {
        const functions = d.results
          .map((r: { name: string; amount: string | number }) => ({ name: r.name, amount: +r.amount }))
          .filter((f: GovFunction) => f.amount > 0)
          .sort((a: GovFunction, b: GovFunction) => b.amount - a.amount);
        return { total: +d.total, end: String(d.end_date || "").slice(0, 4) || String(year), functions };
      }
    } catch {
      /* try next combo */
    }
  }
  return null;
}

async function fetchDebt(): Promise<{ debtPublic: number; totalDebt: number } | null> {
  try {
    const res = await fetch(
      "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?sort=-record_date&page%5Bsize%5D=1",
    );
    if (!res.ok) return null;
    const d = await res.json();
    const row = d?.data?.[0];
    if (!row) return null;
    return { debtPublic: +row.debt_held_public_amt, totalDebt: +row.tot_pub_debt_out_amt };
  } catch {
    return null;
  }
}

export async function fetchGov(): Promise<GovData | null> {
  const spend = await fetchSpending();
  if (!spend) return null; // spending is the core; without it, fall back to sample
  const debt = (await fetchDebt()) ?? { debtPublic: 0, totalDebt: 0 };
  // collapse the long tail into "Other" so the chart stays readable
  const top = spend.functions.slice(0, 9);
  const rest = spend.functions.slice(9).reduce((a, f) => a + f.amount, 0);
  const functions = rest > 0 ? [...top, { name: "Other", amount: rest }] : top;
  return {
    totalOutlays: spend.total,
    fiscalLabel: `FY ${spend.end}`,
    functions,
    debtPublic: debt.debtPublic,
    totalDebt: debt.totalDebt,
  };
}
