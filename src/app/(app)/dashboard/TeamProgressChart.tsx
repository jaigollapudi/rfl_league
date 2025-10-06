"use client";

import React, { useMemo, useState } from "react";

type Props = {
  dates: string[];
  cumPoints: number[];
  cumAvgRR: number[];
};

// Lightweight SVG line chart: two series (points and avg rr) sharing x-axis
export default function TeamProgressChart({ dates, cumPoints, cumAvgRR }: Props) {
  const width = 640; // responsive via viewBox
  const height = 200;
  const paddingLeft = 40; // allow y-axis labels
  const paddingRight = 40; // right y-axis for RR
  const paddingTop = 24;
  const paddingBottom = 28; // x-axis labels

  const n = dates.length;
  const maxPts = Math.max(...cumPoints, 1);
  const maxRR = Math.max(...cumAvgRR, 1);

  const innerW = width - paddingLeft - paddingRight;
  const innerH = height - paddingTop - paddingBottom;

  const x = (i: number) => paddingLeft + (i / Math.max(1, n - 1)) * innerW;
  const yPts = (v: number) => paddingTop + (1 - v / maxPts) * innerH;
  const yRR = (v: number) => paddingTop + (1 - v / maxRR) * innerH;

  const path = (vals: number[], y: (v: number) => number) =>
    vals.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");

  // ticks
  const xTickCount = 6;
  const xTicks = Array.from({ length: Math.min(xTickCount, n) }).map((_, idx) =>
    Math.round((idx / Math.max(1, xTickCount - 1)) * (n - 1))
  );

  const yLeftTicks = 4;
  const yRightTicks = 4;

  // Tooltip state
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const hoverHandlers = {
    onMouseMove: (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = (e.target as SVGElement).closest("svg")!.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const rel = Math.max(0, Math.min(1, (px - paddingLeft) / innerW));
      const idx = Math.round(rel * (n - 1));
      setHoverIdx(Number.isFinite(idx) ? Math.max(0, Math.min(n - 1, idx)) : null);
    },
    onMouseLeave: () => setHoverIdx(null),
  } as const;

  const hoverX = hoverIdx !== null ? x(hoverIdx) : null;
  const hoverYPts = hoverIdx !== null ? yPts(cumPoints[hoverIdx]) : null;
  const hoverYRR = hoverIdx !== null ? yRR(cumAvgRR[hoverIdx]) : null;

  const dateLabel = (d: string) => {
    // yyyy-mm-dd -> mm/dd
    const [y, m, da] = d.split("-");
    return `${Number(m)}/${Number(da)}`;
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48" {...hoverHandlers}>
        {/* Axes */}
        <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="#e5e7eb" />
        <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={height - paddingBottom} stroke="#e5e7eb" />
        {/* Right Y axis for RR */}
        <line x1={width - paddingRight} y1={paddingTop} x2={width - paddingRight} y2={height - paddingBottom} stroke="#e5e7eb" />

        {/* Y left ticks (points) */}
        {Array.from({ length: yLeftTicks + 1 }).map((_, i) => {
          const v = (i / yLeftTicks) * maxPts;
          const y = yPts(v);
          return (
            <g key={i}>
              <line x1={paddingLeft - 4} y1={y} x2={width - paddingRight} y2={y} stroke="#f3f4f6" />
              <text x={paddingLeft - 8} y={y + 3} fontSize="10" fill="#6b7280" textAnchor="end">{Math.round(v)}</text>
            </g>
          );
        })}

        {/* Y right ticks (RR) */}
        {Array.from({ length: yRightTicks + 1 }).map((_, i) => {
          const v = (i / yRightTicks) * maxRR;
          const y = yRR(v);
          return (
            <g key={`r-${i}`}>
              <text x={width - paddingRight + 6} y={y + 3} fontSize="10" fill="#6b7280">{(Math.round(v * 100) / 100).toFixed(2)}</text>
            </g>
          );
        })}

        {/* X ticks */}
        {xTicks.map((i, k) => (
          <g key={`x-${k}`}>
            <line x1={x(i)} y1={height - paddingBottom} x2={x(i)} y2={height - paddingBottom + 4} stroke="#9ca3af" />
            <text x={x(i)} y={height - paddingBottom + 14} fontSize="10" fill="#6b7280" textAnchor="middle">{dateLabel(dates[i])}</text>
          </g>
        ))}

        {/* Series */}
        <path d={path(cumPoints, yPts)} fill="none" stroke="#E85C49" strokeWidth={2} />
        <path d={path(cumAvgRR, yRR)} fill="none" stroke="#0F1E46" strokeWidth={2} />

        {/* Hover guideline and points */}
        {hoverIdx !== null && (
          <g>
            <line x1={hoverX!} y1={paddingTop} x2={hoverX!} y2={height - paddingBottom} stroke="#9ca3af" strokeDasharray="3 3" />
            <circle cx={hoverX!} cy={hoverYPts!} r={4} fill="#E85C49" />
            <circle cx={hoverX!} cy={hoverYRR!} r={4} fill="#0F1E46" />
          </g>
        )}

        {/* Legend */}
        <rect x={width - 190} y={8} width={180} height={24} rx={4} fill="#fff" stroke="#eee" />
        <circle cx={width - 175} cy={20} r={4} fill="#E85C49" />
        <text x={width - 165} y={24} fontSize="10" fill="#333">Cumulative Points</text>
        <circle cx={width - 80} cy={20} r={4} fill="#0F1E46" />
        <text x={width - 70} y={24} fontSize="10" fill="#333">Avg RR</text>

        {/* Tooltip */}
        {hoverIdx !== null && (
          <g>
            <foreignObject x={Math.min(width - 160, Math.max(paddingLeft, (hoverX || 0) + 8))} y={paddingTop + 8} width="150" height="60">
              <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 4, padding: '6px', fontSize: 12, color: '#111' }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{dateLabel(dates[hoverIdx])}</div>
                <div><span style={{ color: '#E85C49' }}>●</span> Points: {cumPoints[hoverIdx]}</div>
                <div><span style={{ color: '#0F1E46' }}>●</span> Avg RR: {cumAvgRR[hoverIdx].toFixed(2)}</div>
              </div>
            </foreignObject>
          </g>
        )}
      </svg>
    </div>
  );
}


