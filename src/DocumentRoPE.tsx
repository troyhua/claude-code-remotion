import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Easing,
} from "remotion";

const C = {
  bg: "#0f1117",
  text: "#e2e8f0",
  textDim: "#94a3b8",
  textMuted: "#64748b",
  accent: "#6366f1",
  danger: "#ef4444",
  success: "#10b981",
  query: "#ec4899",
  doc0: "#3b82f6",
  doc1: "#10b981",
  doc2: "#f59e0b",
  docQuery: "#ec4899",
};
const FONT = "SF Pro Display, Inter, Helvetica Neue, Arial, sans-serif";
const MONO = "SF Mono, Fira Code, Consolas, monospace";
const MATH = "Times New Roman, Georgia, serif";

const M: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => <span style={{ fontFamily: MATH, fontStyle: "italic", ...style }}>{children}</span>;

const ci = (f: number, ir: [number, number], or: [number, number]) =>
  interpolate(f, ir, or, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// A position-ID block
const PosBlock: React.FC<{
  id: number;
  color: string;
  label?: string;
  danger?: boolean;
  style?: React.CSSProperties;
}> = ({ id, color, label, danger, style }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 4,
      ...style,
    }}
  >
    <div
      style={{
        width: 52,
        height: 44,
        backgroundColor: `${color}20`,
        border: `2px solid ${danger ? C.danger : color}`,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: danger ? C.danger : color,
        fontSize: 18,
        fontFamily: MONO,
        fontWeight: 700,
        boxShadow: danger ? `0 0 8px ${C.danger}40` : "none",
      }}
    >
      {id}
    </div>
    {label && (
      <span style={{ color: `${color}99`, fontSize: 13, fontFamily: MONO }}>{label}</span>
    )}
  </div>
);

// ============================================================
// Phase 1: The Problem — Standard Continuous Position IDs
// ============================================================
const ProblemPhase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labelOp = ci(frame, [0, 0.5 * fps], [0, 1]);

  // Show a sequence of continuously increasing position IDs
  const totalBlocks = 16;
  const blockOp = (i: number) => {
    const delay = 0.3 * fps + i * 3;
    return spring({ frame: frame - delay, fps, config: { damping: 200 } });
  };

  // Danger zone appears (past training range)
  const dangerOp = ci(frame, [2.5 * fps, 3 * fps], [0, 1]);

  // Warning label
  const warnOp = ci(frame, [3 * fps, 3.5 * fps], [0, 1]);
  const warnScale = spring({ frame: frame - 3 * fps, fps, config: { damping: 12 } });

  const Y = 320;
  const startX = 100;
  const gap = 108;

  // Position IDs: 0,1,2... then jump to big numbers
  const posIds = [0, 1, 2, 3, 4, 5, 6, 7, "...", 64000, 64001, "...", 500000, 999000, 1500000, 2000000];
  const colors = posIds.map((_, i) => {
    if (i < 4) return C.doc0;
    if (i < 8) return C.doc1;
    if (i < 9) return C.textMuted;
    if (i < 12) return C.doc2;
    return C.danger;
  });
  const isDanger = posIds.map((_, i) => i >= 12);

  return (
    <>
      {/* "Standard RoPE" label */}
      <div style={{ position: "absolute", top: 220, width: "100%", textAlign: "center", opacity: labelOp }}>
        <div style={{ display: "inline-block", backgroundColor: `${C.danger}12`, border: `1px solid ${C.danger}40`, borderRadius: 8, padding: "8px 24px", color: C.danger, fontSize: 22, fontFamily: MONO, fontWeight: 600 }}>
          Standard RoPE: Continuous Position IDs
        </div>
      </div>

      {/* Position blocks */}
      <div style={{ position: "absolute", top: Y, left: startX, display: "flex", gap: 8, flexWrap: "wrap", width: 1720 }}>
        {posIds.map((id, i) => (
          <div key={i} style={{ opacity: blockOp(i) }}>
            {id === "..." ? (
              <div style={{ width: 52, height: 44, display: "flex", alignItems: "center", justifyContent: "center", color: C.textMuted, fontSize: 24, fontFamily: MONO }}>
                ···
              </div>
            ) : (
              <PosBlock
                id={typeof id === "number" ? id : 0}
                color={colors[i]}
                danger={isDanger[i]}
              />
            )}
          </div>
        ))}
      </div>

      {/* Training range bracket */}
      <div style={{ position: "absolute", top: Y + 60, left: startX, opacity: dangerOp }}>
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          <div style={{ width: 9 * gap - 16, borderTop: `2px solid ${C.success}`, borderLeft: `2px solid ${C.success}`, borderRight: `2px solid ${C.success}`, height: 16, borderRadius: "0 0 0 0" }} />
        </div>
        <div style={{ textAlign: "center", width: 9 * gap - 16, color: C.success, fontSize: 16, fontFamily: MONO, marginTop: 4 }}>
          Training range (0 — 64k)
        </div>
      </div>

      {/* Danger zone */}
      <div style={{ position: "absolute", top: Y + 60, left: startX + 10 * gap, opacity: dangerOp }}>
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          <div style={{ width: 6 * gap, borderTop: `2px solid ${C.danger}`, borderLeft: `2px solid ${C.danger}`, borderRight: `2px solid ${C.danger}`, height: 16 }} />
        </div>
        <div style={{ textAlign: "center", width: 6 * gap, color: C.danger, fontSize: 16, fontFamily: MONO, marginTop: 4 }}>
          Far beyond training range!
        </div>
      </div>

      {/* Warning */}
      <div
        style={{
          position: "absolute",
          top: Y + 140,
          width: "100%",
          textAlign: "center",
          opacity: warnOp,
          transform: `scale(${warnScale})`,
        }}
      >
        <div
          style={{
            display: "inline-block",
            backgroundColor: `${C.danger}15`,
            border: `2px solid ${C.danger}`,
            borderRadius: 14,
            padding: "14px 36px",
            color: C.danger,
            fontSize: 24,
            fontFamily: FONT,
            fontWeight: 700,
          }}
        >
          Severe performance degradation from positional shift
        </div>
      </div>
    </>
  );
};

// ============================================================
// Phase 2: Document-wise RoPE Solution
// ============================================================
const SolutionPhase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labelOp = ci(frame, [0, 0.5 * fps], [0, 1]);

  const Y = 280;
  const docConfigs = [
    { label: "Doc 0", color: C.doc0, count: 4 },
    { label: "Doc 1", color: C.doc1, count: 4 },
    { label: "Doc 2", color: C.doc2, count: 4 },
  ];

  const docAppear = docConfigs.map((_, i) => {
    const delay = 0.5 * fps + i * 15;
    return spring({ frame: frame - delay, fps, config: { damping: 200 } });
  });

  // "Position resets to 0" arrows
  const resetOp = ci(frame, [2 * fps, 2.5 * fps], [0, 1]);

  // Success label
  const successOp = ci(frame, [2.5 * fps, 3 * fps], [0, 1]);
  const successScale = spring({ frame: frame - 2.5 * fps, fps, config: { damping: 12 } });

  return (
    <>
      {/* Label */}
      <div style={{ position: "absolute", top: 210, width: "100%", textAlign: "center", opacity: labelOp }}>
        <div style={{ display: "inline-block", backgroundColor: `${C.success}12`, border: `1px solid ${C.success}40`, borderRadius: 8, padding: "8px 24px", color: C.success, fontSize: 22, fontFamily: MONO, fontWeight: 600 }}>
          Document-wise RoPE: Independent Position IDs
        </div>
      </div>

      {/* Document groups, each starting from 0 */}
      <div style={{ position: "absolute", top: Y, left: 160, display: "flex", gap: 60 }}>
        {docConfigs.map((doc, di) => (
          <div key={di} style={{ opacity: docAppear[di], display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            {/* Doc label */}
            <div style={{ color: doc.color, fontSize: 20, fontFamily: MONO, fontWeight: 700 }}>
              {doc.label}
            </div>
            {/* Position blocks */}
            <div style={{ display: "flex", gap: 8 }}>
              {Array.from({ length: doc.count }, (_, i) => (
                <PosBlock key={i} id={i} color={doc.color} />
              ))}
            </div>
            {/* "Starts at 0" indicator */}
            <div style={{ opacity: resetOp, color: doc.color, fontSize: 16, fontFamily: MONO }}>
              pos: 0 → {doc.count - 1}
            </div>
          </div>
        ))}
      </div>

      {/* "Reset" arrows between groups */}
      {[0, 1].map((i) => (
        <div
          key={`reset-${i}`}
          style={{
            position: "absolute",
            top: Y + 50,
            left: 160 + (i + 1) * (4 * 60 + 60 * 0.8) + i * 60 + 30,
            opacity: resetOp,
            color: C.success,
            fontSize: 28,
            fontFamily: MONO,
          }}
        >
          ↺
        </div>
      ))}

      {/* Success badge */}
      <div
        style={{
          position: "absolute",
          top: Y + 200,
          width: "100%",
          textAlign: "center",
          opacity: successOp,
          transform: `scale(${successScale})`,
        }}
      >
        <div
          style={{
            display: "inline-block",
            backgroundColor: `${C.success}15`,
            border: `2px solid ${C.success}`,
            borderRadius: 14,
            padding: "14px 36px",
            color: C.success,
            fontSize: 24,
            fontFamily: FONT,
            fontWeight: 700,
          }}
        >
          Position IDs always within training range — scales to 100M+ tokens
        </div>
      </div>
    </>
  );
};

// ============================================================
// Phase 3: Global RoPE for Active Query
// ============================================================
const GlobalRoPEPhase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labelOp = ci(frame, [0, 0.5 * fps], [0, 1]);

  const Y = 280;

  // Show retrieved docs + query with offset
  const docsOp = ci(frame, [0.3 * fps, 0.8 * fps], [0, 1]);
  const queryOp = ci(frame, [1 * fps, 1.5 * fps], [0, 1]);

  // Offset annotation
  const offsetOp = ci(frame, [1.5 * fps, 2 * fps], [0, 1]);

  // Explanation
  const explainOp = ci(frame, [2.5 * fps, 3 * fps], [0, 1]);
  const explainScale = spring({ frame: frame - 2.5 * fps, fps, config: { damping: 15 } });

  const topKCount = 8; // total chunks from top-k docs

  return (
    <>
      {/* Label */}
      <div style={{ position: "absolute", top: 210, width: "100%", textAlign: "center", opacity: labelOp }}>
        <div style={{ display: "inline-block", backgroundColor: `${C.accent}12`, border: `1px solid ${C.accent}40`, borderRadius: 8, padding: "8px 24px", color: C.accent, fontSize: 22, fontFamily: MONO, fontWeight: 600 }}>
          Global RoPE: Active Query Offset
        </div>
      </div>

      {/* Retrieved docs (each with local positions) */}
      <div style={{ position: "absolute", top: Y, left: 120, display: "flex", gap: 40, opacity: docsOp }}>
        {/* Doc 0 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <span style={{ color: C.doc0, fontSize: 18, fontFamily: MONO, fontWeight: 700 }}>Doc 0 (retrieved)</span>
          <div style={{ display: "flex", gap: 6 }}>
            {[0, 1, 2, 3].map((i) => <PosBlock key={i} id={i} color={C.doc0} />)}
          </div>
        </div>
        {/* Doc 2 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <span style={{ color: C.doc2, fontSize: 18, fontFamily: MONO, fontWeight: 700 }}>Doc 2 (retrieved)</span>
          <div style={{ display: "flex", gap: 6 }}>
            {[0, 1, 2, 3].map((i) => <PosBlock key={i} id={i} color={C.doc2} />)}
          </div>
        </div>
      </div>

      {/* Active query with offset positions */}
      <div style={{ position: "absolute", top: Y, left: 920, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: queryOp }}>
        <span style={{ color: C.docQuery, fontSize: 18, fontFamily: MONO, fontWeight: 700 }}>Active Query</span>
        <div style={{ display: "flex", gap: 6 }}>
          {[0, 1, 2, 3].map((i) => (
            <PosBlock key={i} id={topKCount + i} color={C.docQuery} />
          ))}
        </div>
      </div>

      {/* Offset annotation */}
      <div
        style={{
          position: "absolute",
          top: Y + 90,
          left: 920,
          opacity: offsetOp,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div style={{ color: C.docQuery, fontSize: 18, fontFamily: MONO, fontWeight: 600 }}>
          pos = <M style={{ fontStyle: "normal" }}>{topKCount}</M> + local_idx
        </div>
        <div style={{ color: C.textDim, fontSize: 16, fontFamily: MONO }}>
          Offset by # of retrieved Top-k chunks
        </div>
      </div>

      {/* Arrow showing causal continuation */}
      <svg
        style={{ position: "absolute", top: Y + 50, left: 780, opacity: offsetOp, pointerEvents: "none" }}
        width="130" height="20"
      >
        <line x1="0" y1="10" x2="100" y2="10" stroke={C.accent} strokeWidth="2" />
        <polygon points="98,4 114,10 98,16" fill={C.accent} />
        <text x="50" y="8" fill={C.textMuted} fontSize="12" fontFamily={MONO} textAnchor="middle">causal</text>
      </svg>

      {/* Explanation */}
      <div
        style={{
          position: "absolute",
          top: Y + 190,
          width: "100%",
          textAlign: "center",
          opacity: explainOp,
          transform: `scale(${explainScale})`,
        }}
      >
        <div
          style={{
            display: "inline-block",
            backgroundColor: `${C.accent}12`,
            border: `2px solid ${C.accent}`,
            borderRadius: 14,
            padding: "14px 36px",
            color: C.accent,
            fontSize: 22,
            fontFamily: FONT,
            fontWeight: 700,
          }}
        >
          Query perceives retrieved docs as causal prefix — coherent generation preserved
        </div>
      </div>
    </>
  );
};

// ============================================================
// Title Bar
// ============================================================
const TitleBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = ci(frame, [0, 0.5 * fps], [0, 1]);
  const titleY = interpolate(frame, [0, 0.5 * fps], [-20, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const steps = [
    { text: "THE PROBLEM: POSITIONAL SHIFT", start: 0, end: 8 * fps },
    { text: "SOLUTION: DOCUMENT-WISE RoPE", start: 8 * fps, end: 15 * fps },
    { text: "GLOBAL RoPE FOR ACTIVE QUERY", start: 15 * fps, end: 22 * fps },
  ];

  return (
    <>
      <div
        style={{
          position: "absolute", top: 45, width: "100%", textAlign: "center",
          opacity: titleOp, transform: `translateY(${titleY}px)`,
          color: C.text, fontSize: 48, fontFamily: FONT, fontWeight: 700, letterSpacing: -1,
        }}
      >
        Document-wise Positional Encoding
      </div>
      <div style={{ position: "absolute", top: 110, width: "100%", textAlign: "center" }}>
        {steps.map((s, i) => (
          <div
            key={i}
            style={{
              position: "absolute", width: "100%", textAlign: "center",
              opacity: ci(frame, [s.start + (i === 0 ? 0 : -5), s.start + 12, s.end - 10, s.end], [0, 1, 1, 0]),
              color: C.accent, fontSize: 22, fontFamily: MONO, fontWeight: 500, letterSpacing: 2,
            }}
          >
            {s.text}
          </div>
        ))}
      </div>
    </>
  );
};

// ============================================================
// Main
// ============================================================
export const DocumentRoPE: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <TitleBar />
      <Sequence from={0} durationInFrames={8 * fps} premountFor={fps}>
        <ProblemPhase />
      </Sequence>
      <Sequence from={8 * fps} durationInFrames={7 * fps} premountFor={fps}>
        <SolutionPhase />
      </Sequence>
      <Sequence from={15 * fps} durationInFrames={7 * fps} premountFor={fps}>
        <GlobalRoPEPhase />
      </Sequence>
    </AbsoluteFill>
  );
};
