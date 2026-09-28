"use client";

import { Check, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { AgeLineChart } from "@/components/charts/age-line-chart";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { useStoredState } from "@/hooks/use-stored-state";
import { MUTED_SERIES } from "@/lib/chart";
import { simulatePath } from "@/lib/engine";
import { usdCompact } from "@/lib/format";
import { buildPathInput } from "@/services/catalog";
import { majorOptions } from "@/services/options";
import { COMPARE_KEY, MAX_COMPARE } from "./explorer";

const EMPTY: string[] = [];

export function AddToCompareButton({ collegeId, name }: { collegeId: string; name: string }) {
  const [ids, setIds] = useStoredState<string[]>(COMPARE_KEY, EMPTY);
  const on = ids.includes(collegeId);
  return (
    <Button
      variant={on ? "secondary" : "outline"}
      disabled={!on && ids.length >= MAX_COMPARE}
      onClick={() => setIds((prev) => (prev.includes(collegeId) ? prev.filter((x) => x !== collegeId) : [...prev, collegeId]))}
      aria-pressed={on}
      aria-label={on ? `Remove ${name} from comparison list` : `Add ${name} to comparison list`}
    >
      {on ? <Check /> : <Plus />} {on ? "In comparison list" : "Add to compare"}
    </Button>
  );
}

export function CollegeRoiChart({ collegeId }: { collegeId: string }) {
  const [majorId, setMajorId] = useState<string | null>(null);
  const result = useMemo(() => simulatePath(buildPathInput({ collegeId, majorId })), [collegeId, majorId]);
  const s = result.summary;
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">Cumulative earnings vs. working from 18</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Cumulative pre-tax earnings minus net price and interest, next to a high school graduate in the same metro.
          </p>
        </div>
        <Combobox aria-label="Major" options={majorOptions} value={majorId} onChange={setMajorId} placeholder="All majors" allowClear className="sm:w-56" searchPlaceholder="Search majors" />
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Breakeven</dt>
          <dd className="font-semibold tabular">{s.breakevenAge ? `Age ${s.breakevenAge}` : "After 40"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Starting salary</dt>
          <dd className="font-semibold tabular">{usdCompact(s.startingSalaryToday)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Value by 40 (PV)</dt>
          <dd className="font-semibold tabular">{usdCompact(s.netPresentValue)}</dd>
        </div>
      </dl>
      <div className="mt-5">
        <AgeLineChart
          ariaLabel="Cumulative earnings with and without this degree"
          height={300}
          series={[
            {
              key: "degree",
              label: "With this degree (net of costs)",
              color: "var(--chart-1)",
              points: result.rows.map((r) => {
                const paid = result.rows.filter((x) => x.index <= r.index).reduce((sum, x) => sum + x.educationCost + x.interestPaid, 0);
                return { age: r.age, value: r.cumulativeEarnings - paid };
              }),
            },
            { key: "hs", label: "High school graduate", color: MUTED_SERIES, dashed: true, points: result.rows.map((r) => ({ age: r.age, value: r.cumulativeHighSchool })) },
          ]}
          zeroLine
        />
      </div>
    </div>
  );
}
