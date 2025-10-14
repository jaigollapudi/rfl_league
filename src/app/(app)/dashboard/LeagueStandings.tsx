"use client";

import React from "react";

export type LeagueTeam = {
  teamId: string;
  teamName: string;
  points: number;
  missedDays: number;
  avgRR?: number | null;
  restUsed?: number;
};

type Props = {
  teams: LeagueTeam[]; // already sorted desc by points
};

// Horizontal bar chart to show total points with missed days label at right
export default function LeagueStandings({ teams }: Props) {
  // Responsive canvas width: make the chart longer on phones for readability (scrollable within card)
  const [isSmall, setIsSmall] = React.useState(false);
  React.useEffect(() => {
    const m = window.matchMedia('(max-width: 640px)');
    const onChange = () => setIsSmall(m.matches);
    onChange();
    m.addEventListener ? m.addEventListener('change', onChange) : m.addListener(onChange);
    return () => { m.removeEventListener ? m.removeEventListener('change', onChange) : m.removeListener(onChange); };
  }, []);

  const width = isSmall ? 1024 : 720; // wider on phones; container scrolls horizontally
  const rowH = isSmall ? 44 : 34; // slightly taller rows on phones
  const paddingTop = 18;
  const paddingBottom = 16;
  const paddingLeft = 180; // space for team names
  const paddingRight = 16; // tighter since labels moved to tooltip
  const height = paddingTop + paddingBottom + rowH * Math.max(1, teams.length);

  const maxPts = Math.max(1, ...teams.map(t => t.points));
  const x = (v: number) => paddingLeft + (v / maxPts) * (width - paddingLeft - paddingRight);

  const palette = "#6377F1"; // single color for consistency

  // Tooltip state (hover on desktop, click on mobile)
  const [activeIdx, setActiveIdx] = React.useState<number | null>(null);
  const barY = (idx: number) => paddingTop + idx * rowH;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: isSmall ? `${width}px` : '100%' }} aria-label="League standings bars">
        {/* X grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
          const gx = paddingLeft + p * (width - paddingLeft - paddingRight);
          return (
            <g key={i}>
              <line x1={gx} y1={paddingTop - 6} x2={gx} y2={height - paddingBottom} stroke="#e5e7eb" />
              <text x={gx} y={height - 2} fontSize={isSmall ? 12 : 10} fill="#6b7280" textAnchor="middle">{Math.round(p * maxPts)}</text>
            </g>
          );
        })}

        {/* Rows */}
        {teams.map((t, idx) => {
          const y = barY(idx);
          const barW = Math.max(0, x(t.points) - paddingLeft);
          return (
            <g key={t.teamId}>
              {/* Team label */}
              <text x={8} y={y + rowH / 2 + 4} fontSize={isSmall ? 14 : 12} fill="#0f172a">{t.teamName}</text>
              {/* Bar background */}
              <rect x={paddingLeft} y={y + 8} width={width - paddingLeft - paddingRight} height={rowH - 16} fill="#f1f5f9" rx={4} />
              {/* Bar value */}
              <rect
                x={paddingLeft}
                y={y + 8}
                width={barW}
                height={rowH - 16}
                fill={palette}
                rx={4}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseLeave={() => setActiveIdx(null)}
                onClick={() => setActiveIdx(prev => (prev === idx ? null : idx))}
              />
              {/* Value label on bar (center vertically) */}
              <text x={paddingLeft + barW - 6} y={y + rowH / 2} fontSize={isSmall ? 13 : 12} fill="#fff" textAnchor="end" fontWeight={600} dominantBaseline="middle">{t.points}</text>
            </g>
          );
        })}

        {/* Tooltip */}
        {activeIdx !== null && (() => {
          const t = teams[activeIdx];
          const y = barY(activeIdx);
          const barW = Math.max(0, x(t.points) - paddingLeft);
          const tipX = Math.min(width - 220, paddingLeft + barW + 8);
          const tipY = y + 4;
          return (
            <foreignObject x={tipX} y={tipY} width={isSmall ? 240 : 210} height={isSmall ? 84 : 72}>
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, fontSize: isSmall ? 13 : 12, color: '#0f172a' }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{t.teamName}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 6 }}>
                  <span>Points:</span><span style={{ fontWeight: 600 }}>{t.points}</span>
                  <span>Missed:</span><span>{Math.max(0, t.missedDays)}</span>
                  <span>Rest used:</span><span>{t.restUsed ?? 0}</span>
                  <span>Avg RR:</span><span>{typeof t.avgRR === 'number' ? t.avgRR.toFixed(2) : '0.00'}</span>
                </div>
              </div>
            </foreignObject>
          );
        })()}
      </svg>
      <div className="text-[11px] text-gray-500 mt-1">Bars are sorted high to low. Number on each bar is total points.</div>
    </div>
  );
}


