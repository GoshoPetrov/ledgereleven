import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
} from "recharts";
import type { HistoryRecord } from "./HistoryComponent";

type ChartItem = {
  label: string;
  value: number;
};

type Props = {
  data: HistoryRecord[];
  title: string;
};

type HistoryRecord = {
  date: string;
  value: number;
};

function createChartData(
  data: HistoryRecord[],
  title: "Daily" | "Weekly" | "Monthly",
  N: number = 10
): { label: string; value: number }[] {
  if (!data.length) return [];

  // Map for lookup
  const map = new Map<string, number>();
  let total = 0;

  data.forEach(d => {
    map.set(d.date, d.value);
    total += d.value;
  });

  const result: { label: string; value: number }[] = [];

  let current = data[data.length - 1].date; // start from last
  let remainingSum = total;

  for (let i = 0; i < N; i++) {
    result.push({
      label: current,
      value: remainingSum
    });

    const value = map.get(current);
    if (value !== undefined) {
      remainingSum -= value;
    }

    current = getPreviousPeriod(current, title);
  }

  // reverse so chart is chronological (optional but usually desired)
  return result.reverse();
}

function getPreviousPeriod(
  date: string,
  title: "Daily" | "Weekly" | "Monthly"
): string {
  if (title === "Daily") {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }

  if (title === "Monthly") {
    const [year, month] = date.split("-").map(Number);
    const d = new Date(year, month - 1);
    d.setMonth(d.getMonth() - 1);

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  // Weekly: YYYY-WNN
  if (title === "Weekly") {
    const [yearStr, weekStr] = date.split("-W");
    let year = Number(yearStr);
    let week = Number(weekStr);

    week--;

    if (week < 1) {
      year--;
      week = getISOWeeksInYear(year);
    }

    return `${year}-W${String(week).padStart(2, "0")}`;
  }

  throw new Error("Invalid title");
}

function getNextPeriod(date: string, title: "Daily" | "Weekly" | "Monthly"): string {
  if (title === "Daily") {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  if (title === "Monthly") {
    const [year, month] = date.split("-").map(Number);
    const d = new Date(year, month - 1);
    d.setMonth(d.getMonth() + 1);

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  // Weekly: format YYYY-WNN
  if (title === "Weekly") {
    const [yearStr, weekStr] = date.split("-W");
    let year = Number(yearStr);
    let week = Number(weekStr);

    week++;

    const weeksInYear = getISOWeeksInYear(year);

    if (week > weeksInYear) {
      week = 1;
      year++;
    }

    return `${year}-W${String(week).padStart(2, "0")}`;
  }

  throw new Error("Invalid title");
}

function getISOWeeksInYear(year: number): number {
  const d = new Date(Date.UTC(year, 11, 31));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export default function RevolutChartComponent({ data, title }: Props) {
  const latestValue = data[data.length - 1]?.value ?? 0;
  const maxValue = Math.max(...data.map((d) => d.value), 0);

  // const chartData:{label:string; value: number}[] = [];
  // let sum = 0;
  // data.forEach(d => {
  //   sum += d.value;
  //   chartData.push({
  //     label: `${d.date}`,
  //     value: sum
  //   })
  // })

  const chartData = createChartData(data, title as ("Daily" | "Weekly" | "Monthly"));
  console.log(chartData);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md rounded-3xl p-5 bg-gradient-to-br from-[#1a1c2e] to-[#121322] shadow-2xl"
    >
      {/* Header */}
      <div className="mb-4">
        <p className="text-sm text-gray-400">{title}</p>
        <div className="flex items-end gap-2">
          <h1 className="text-3xl font-semibold">
            {new Intl.NumberFormat("fr-FR").format(Math.round(latestValue))}
          </h1>
        </div>
      </div>

      {/* Chart */}
      <div className="h-40">  
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 12 }}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "#111",
                border: "none",
                borderRadius: "10px",
                color: "#fff",
              }}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke="#34d399"
              strokeWidth={2.5}
              fill="url(#colorValue)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top value hint */}
      <div className="flex justify-end text-xs text-gray-400 mt-1">
        {maxValue.toFixed(0)} €
      </div>
    </motion.div>
  );
}