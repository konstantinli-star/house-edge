"use client";

import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RatingPoint } from "@/lib/game/journal";

// Rating history: the main reward of the game.
export function RatingChart({ points, target }: { points: RatingPoint[]; target: number }) {
  const values = points.map((p) => p.rating).concat(target);
  const domain = [Math.floor((Math.min(...values) - 20) / 50) * 50, Math.ceil((Math.max(...values) + 20) / 50) * 50];

  return (
    <div className="h-56 w-full" role="img" aria-label={`Rating history, latest ${points[points.length - 1].rating}, target ${target}`}>
      <ResponsiveContainer>
        <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <XAxis dataKey="label" stroke="var(--color-muted)" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis domain={domain} stroke="var(--color-muted)" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: "var(--color-raised)", border: "1px solid var(--color-line)", borderRadius: 6 }}
            labelStyle={{ color: "var(--color-muted)" }}
            itemStyle={{ color: "var(--color-text)" }}
          />
          <ReferenceLine
            y={target}
            stroke="var(--color-warn)"
            strokeDasharray="4 4"
            label={{ value: `target ${target}`, fill: "var(--color-warn)", fontSize: 11, position: "insideTopRight" }}
          />
          <Line
            type="monotone"
            dataKey="rating"
            stroke="var(--color-accent)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-accent)" }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
