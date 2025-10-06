"use client";

import React from "react";

type Props = {
  dates: string[];
  cumPoints: number[];
  cumAvgRR: number[];
};

// Lightweight SVG line chart: two series (points and avg rr) sharing x-axis
export default function TeamProgressChart({ dates, cumPoints, cumAvgRR }: Props) {
  const width = 600; // will scale via CSS container
  const height = 160;
  const padding = 32;

  const n = dates.length;
  const maxPts = Math.max(...cumPoints, 1);
  const maxRR = Math.max(...cumAvgRR, 1);

  const x = (i: number) => padding + (i / Math.max(1, n - 1)) * (width - padding * 2);
  const yPts = (v: number) => height - padding - (v / maxPts) * (height - padding * 2);
  const yRR = (v: number) => height - padding - (v / maxRR) * (height - padding * 2);

  const path = (vals: number[], y: (v: number) => number) => {
    return vals
      .map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`)
      .join(" ");
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40">
        {/* Axes */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#ddd" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#ddd" />

        {/* Points series (coral) */}
        <path d={path(cumPoints, yPts)} fill="none" stroke="#E85C49" strokeWidth={2} />
        {/* Avg RR series (navy) */}
        <path d={path(cumAvgRR, yRR)} fill="none" stroke="#0F1E46" strokeWidth={2} />

        {/* Legend */}
        <rect x={width - 180} y={8} width={170} height={24} rx={4} fill="#fff" stroke="#eee" />
        <circle cx={width - 165} cy={20} r={4} fill="#E85C49" />
        <text x={width - 155} y={24} fontSize="10" fill="#333">Cumulative Points</text>
        <circle cx={width - 60} cy={20} r={4} fill="#0F1E46" />
        <text x={width - 50} y={24} fontSize="10" fill="#333">Avg RR</text>
      </svg>
    </div>
  );
}


