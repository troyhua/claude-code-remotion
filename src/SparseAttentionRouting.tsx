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

// --- Design tokens ---
const C = {
  bg: "#0f1117",
  text: "#e2e8f0",
  textDim: "#94a3b8",
  textMuted: "#64748b",
  accent: "#6366f1",
  query: "#ec4899",
  qr: "#f472b6",
  routingKey: "#f59e0b",
  gpuBg: "#1a1033",
  gpuBorder: "#a855f7",
  gpuGlow: "rgba(168, 85, 247, 0.12)",
  cpuBg: "#0f1d2d",
  cpuBorder: "#0ea5e9",
  scoreHigh: "#10b981",
  scoreLow: "#475569",
  keyMatrix: "#3b82f6",
  valueMatrix: "#10b981",
};
const FONT = "SF Pro Display, Inter, Helvetica Neue, Arial, sans-serif";
const MONO = "SF Mono, Fira Code, Consolas, monospace";
const MATH = "Times New Roman, Georgia, serif";

// --- Math helpers ---
const Overline: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ textDecoration: "overline", textDecorationThickness: "2px" }}>{children}</span>
);
const Sup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ fontSize: "0.65em", verticalAlign: "super" }}>{children}</span>
);
const Sub: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ fontSize: "0.65em", verticalAlign: "sub" }}>{children}</span>
);
const M: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => <span style={{ fontFamily: MATH, fontStyle: "italic", ...style }}>{children}</span>;

// Helper: clamp interpolate
const ci = (
  frame: number,
  inputRange: [number, number],
  outputRange: [number, number]
) =>
  interpolate(frame, inputRange, outputRange, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// ============================================================
// Phase 1: Query → Router Q Projector → Q^R
// ============================================================
const Phase1: React.FC<{ globalFrame: number }> = ({ globalFrame: frame }) => {
  const { fps } = useVideoConfig();

  // Query box slides in
  const queryX = interpolate(frame, [0, 0.8 * fps], [-250, 80], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const queryOp = ci(frame, [0, 0.3 * fps], [0, 1]);

  // "hidden states" label
  const hsOp = ci(frame, [0.6 * fps, 1 * fps], [0, 1]);

  // Arrow query → projector
  const arr1 = ci(frame, [1 * fps, 1.4 * fps], [0, 1]);

  // Projector appears
  const projOp = ci(frame, [0.8 * fps, 1.3 * fps], [0, 1]);
  const projScale = spring({ frame: frame - 0.8 * fps, fps, config: { damping: 200 } });

  // Arrow projector → Q^R
  const arr2 = ci(frame, [1.8 * fps, 2.2 * fps], [0, 1]);

  // Q^R appears
  const qrOp = ci(frame, [2 * fps, 2.4 * fps], [0, 1]);
  const qrScale = spring({ frame: frame - 2 * fps, fps, config: { damping: 12 } });

  const Y = 460; // vertical center of the pipeline

  return (
    <>
      {/* Query box */}
      <div
        style={{
          position: "absolute",
          top: Y - 30,
          left: queryX,
          opacity: queryOp,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <div
          style={{
            width: 140,
            height: 56,
            backgroundColor: `${C.query}18`,
            border: `2px solid ${C.query}`,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: C.query,
            fontSize: 18,
            fontFamily: MONO,
            fontWeight: 700,
          }}
        >
          User Query
        </div>
        <div style={{ opacity: hsOp, color: C.textDim, fontSize: 18, fontFamily: MONO }}>
          <M>q</M> → hidden states
        </div>
      </div>

      {/* Arrow 1 */}
      <svg style={{ position: "absolute", top: Y - 2, left: 230, opacity: arr1 }} width="70" height="16">
        <line x1="0" y1="8" x2="50" y2="8" stroke={C.textDim} strokeWidth="2" />
        <polygon points="48,3 62,8 48,13" fill={C.textDim} />
      </svg>

      {/* Router Q Projector */}
      <div
        style={{
          position: "absolute",
          top: Y - 40,
          left: 300,
          opacity: projOp,
          transform: `scale(${projScale})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <div
          style={{
            width: 200,
            height: 70,
            background: `linear-gradient(135deg, ${C.accent}25, ${C.query}15)`,
            border: `2px solid ${C.accent}`,
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          {/* Neural net icon */}
          <svg width="28" height="28" viewBox="0 0 28 28">
            {[6, 14, 22].map((y) => (
              <React.Fragment key={`l-${y}`}>
                <circle cx="6" cy={y} r="3" fill={C.accent} opacity={0.6} />
                <circle cx="22" cy={y} r="3" fill={C.qr} opacity={0.6} />
                {[6, 14, 22].map((y2) => (
                  <line
                    key={`${y}-${y2}`}
                    x1="9" y1={y} x2="19" y2={y2}
                    stroke={C.accent}
                    strokeWidth="0.7"
                    opacity={0.3}
                  />
                ))}
              </React.Fragment>
            ))}
          </svg>
          <div style={{ color: C.text, fontSize: 18, fontFamily: MONO, fontWeight: 600 }}>
            Router Q Proj
          </div>
        </div>
        <div style={{ color: C.textMuted, fontSize: 18, fontFamily: MONO }}>
          <M>W</M><Sup>R</Sup> projection layer
        </div>
      </div>

      {/* Arrow 2 */}
      <svg style={{ position: "absolute", top: Y - 2, left: 510, opacity: arr2 }} width="70" height="16">
        <line x1="0" y1="8" x2="50" y2="8" stroke={C.qr} strokeWidth="2" />
        <polygon points="48,3 62,8 48,13" fill={C.qr} />
      </svg>

      {/* Q^R */}
      <div
        style={{
          position: "absolute",
          top: Y - 35,
          left: 585,
          opacity: qrOp,
          transform: `scale(${qrScale})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <div
          style={{
            width: 110,
            height: 52,
            backgroundColor: `${C.qr}20`,
            border: `2px solid ${C.qr}`,
            borderRadius: 12,
            boxShadow: `0 0 20px ${C.qr}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: C.qr,
                opacity: 0.4 + i * 0.1,
              }}
            />
          ))}
        </div>
        <div style={{ color: C.qr, fontSize: 28, fontFamily: MONO, fontWeight: 700 }}>
          <M>Q</M><Sup>R</Sup>
        </div>
        <div style={{ color: C.textMuted, fontSize: 18, fontFamily: MONO }}>
          Routing Query
        </div>
      </div>
    </>
  );
};

// ============================================================
// Phase 2: Q^R broadcasts to 2 GPUs
// ============================================================
const GPU_CARDS = [
  { id: 0, x: 900, y: 200, shardLabel: "Shard 0" },
  { id: 1, x: 900, y: 590, shardLabel: "Shard 1" },
];
const GPU_W = 940;
const GPU_H = 340;

const Phase2: React.FC<{ globalFrame: number }> = ({ globalFrame: frame }) => {
  const { fps } = useVideoConfig();

  // GPU cards appear
  const gpuAppear = GPU_CARDS.map((_, i) => {
    const delay = i * 6;
    return spring({ frame: frame - delay, fps, config: { damping: 200 } });
  });

  // Q^R fan-out: from center-left to each GPU
  const fanStart = 0.8 * fps;
  const fanEnd = 1.8 * fps;
  const fanProgress = ci(frame, [fanStart, fanEnd], [0, 1]);

  // Origin of Q^R (where phase 1 left it, roughly)
  const qrOriginX = 640;
  const qrOriginY = 460;

  // Target: left edge of each GPU card
  const targets = GPU_CARDS.map((g) => ({ x: g.x + 20, y: g.y + GPU_H / 2 }));

  // Flash on arrival
  const flashOp = GPU_CARDS.map((_, i) => {
    const arriveFrame = fanEnd + i * 2;
    return ci(frame, [arriveFrame, arriveFrame + 0.3 * fps], [0.8, 0]);
  });

  // "Broadcast" label
  const bcastOp = ci(frame, [fanStart, fanStart + 0.4 * fps], [0, 1]);

  // Routing key chips inside each GPU
  const KEYS_PER_GPU = 4;
  const chipAppear = ci(frame, [0, 0.6 * fps], [0, 1]);

  return (
    <>
      {/* GPU Cards */}
      {GPU_CARDS.map((gpu, gi) => (
        <div
          key={gi}
          style={{
            position: "absolute",
            top: gpu.y,
            left: gpu.x,
            width: GPU_W,
            height: GPU_H,
            backgroundColor: C.gpuBg,
            border: `2px solid ${C.gpuBorder}`,
            borderRadius: 14,
            opacity: gpuAppear[gi],
            transform: `scale(${interpolate(gpuAppear[gi], [0, 1], [0.95, 1])})`,
            boxShadow: `inset 0 0 40px ${C.gpuGlow}`,
          }}
        >
          {/* Header */}
          <div style={{ position: "absolute", top: 14, left: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: C.gpuBorder,
                boxShadow: `0 0 5px ${C.gpuBorder}`,
              }}
            />
            <span style={{ color: C.gpuBorder, fontSize: 18, fontFamily: MONO, fontWeight: 600 }}>
              GPU {gpu.id} — {gpu.shardLabel}
            </span>
          </div>

          {/* Arrival flash */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 14,
              backgroundColor: C.qr,
              opacity: flashOp[gi],
              pointerEvents: "none",
            }}
          />

          {/* Routing key chips */}
          <div
            style={{
              position: "absolute",
              top: 100,
              left: 24,
              display: "flex",
              gap: 24,
              opacity: chipAppear,
            }}
          >
            {Array.from({ length: KEYS_PER_GPU }, (_, ki) => {
              const globalIdx = gi * KEYS_PER_GPU + ki;
              return (
                <div key={ki} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 64,
                      height: 46,
                      border: `1.5px solid ${C.routingKey}`,
                      borderRadius: 6,
                      backgroundColor: `${C.routingKey}12`,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 2,
                      padding: 4,
                      alignContent: "center",
                      justifyContent: "center",
                    }}
                  >
                    {Array.from({ length: 6 }, (_, j) => (
                      <div key={j} style={{ width: 8, height: 6, backgroundColor: `${C.routingKey}35`, borderRadius: 1 }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 18, fontFamily: MONO, color: `${C.routingKey}99` }}>
                    <M><Overline>K</Overline></M><Sup>R</Sup><Sub>{globalIdx + 1}</Sub>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Fan-out arrows from Q^R to each GPU */}
      {targets.map((t, i) => {
        const progress = Math.min(1, fanProgress);
        const curX = interpolate(progress, [0, 1], [qrOriginX, t.x]);
        const curY = interpolate(progress, [0, 1], [qrOriginY, t.y]);
        return (
          <React.Fragment key={`fan-${i}`}>
            {/* Trail line */}
            <svg
              style={{ position: "absolute", top: 0, left: 0, width: 1920, height: 1080, pointerEvents: "none" }}
            >
              <line
                x1={qrOriginX}
                y1={qrOriginY}
                x2={curX}
                y2={curY}
                stroke={C.qr}
                strokeWidth="2"
                opacity={fanProgress * 0.6}
                strokeDasharray="6 4"
              />
            </svg>
            {/* Moving Q^R copy */}
            {fanProgress > 0 && fanProgress < 1 && (
              <div
                style={{
                  position: "absolute",
                  top: curY - 14,
                  left: curX - 14,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  backgroundColor: C.qr,
                  opacity: 0.8,
                  boxShadow: `0 0 14px ${C.qr}80`,
                }}
              />
            )}
          </React.Fragment>
        );
      })}

      {/* "Broadcast Q^R" label */}
      <div
        style={{
          position: "absolute",
          top: qrOriginY - 50,
          left: qrOriginX + 50,
          opacity: bcastOp,
          color: C.qr,
          fontSize: 22,
          fontFamily: MONO,
          fontWeight: 600,
        }}
      >
        Broadcast <M>Q</M><Sup>R</Sup> to all GPUs
      </div>
    </>
  );
};

// ============================================================
// Phase 3: Hierarchical scoring inside each GPU
// ============================================================
const SCORES_GPU0 = [0.72, 0.91, 0.31, 0.45];
const SCORES_GPU1 = [0.22, 0.83, 0.15, 0.67];
const ALL_SCORES = [SCORES_GPU0, SCORES_GPU1];
// After head avg + max pool → per-doc scores
const DOC_SCORES_GPU0 = [0.91, 0.45]; // doc0 = max(0.72,0.91), doc1 = max(0.31,0.45)
const DOC_SCORES_GPU1 = [0.83, 0.67]; // doc2 = max(0.22,0.83), doc3 = max(0.15,0.67)
const ALL_DOC_SCORES = [DOC_SCORES_GPU0, DOC_SCORES_GPU1];

const Phase3: React.FC<{ globalFrame: number }> = ({ globalFrame: frame }) => {
  const { fps } = useVideoConfig();

  const KEYS_PER_GPU = 4;

  // Staggered score reveals per GPU
  const scoreReveal = ALL_SCORES.map((gpuScores, gi) =>
    gpuScores.map((_, ki) => {
      const delay = gi * 0.3 * fps + ki * 6;
      return ci(frame, [delay, delay + 0.3 * fps], [0, 1]);
    })
  );

  // Funnel step 1: "avg across heads" label (1.5s)
  const funnel1Op = ci(frame, [1.5 * fps, 2 * fps], [0, 1]);

  // Funnel step 2: "max pool → per-chunk" (2.5s)
  const funnel2Op = ci(frame, [2.2 * fps, 2.7 * fps], [0, 1]);

  // Funnel step 3: "max → per-doc score" (3s) + doc scores appear
  const funnel3Op = ci(frame, [3 * fps, 3.5 * fps], [0, 1]);
  const docScoreOp = ci(frame, [3.2 * fps, 3.7 * fps], [0, 1]);

  return (
    <>
      {GPU_CARDS.map((gpu, gi) => {
        const scores = ALL_SCORES[gi];
        const docScores = ALL_DOC_SCORES[gi];

        return (
          <React.Fragment key={`scoring-${gi}`}>
            {/* Per-chunk cosine scores */}
            {scores.map((score, ki) => {
              const chipX = gpu.x + 24 + ki * 88 + 32;
              const chipY = gpu.y + 100;
              const isHigh = score >= 0.7;
              return (
                <div
                  key={`score-${gi}-${ki}`}
                  style={{
                    position: "absolute",
                    top: chipY - 36,
                    left: chipX - 26,
                    opacity: scoreReveal[gi][ki],
                    color: isHigh ? C.scoreHigh : C.scoreLow,
                    fontSize: 18,
                    fontFamily: MONO,
                    fontWeight: 700,
                    backgroundColor: isHigh ? `${C.scoreHigh}15` : `${C.scoreLow}10`,
                    border: `1px solid ${isHigh ? C.scoreHigh : C.scoreLow}40`,
                    borderRadius: 6,
                    padding: "4px 10px",
                    textAlign: "center",
                  }}
                >
                  {score.toFixed(2)}
                </div>
              );
            })}

            {/* Funnel pipeline (right side of each GPU) */}
            <div
              style={{
                position: "absolute",
                top: gpu.y + 60,
                left: gpu.x + 400,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                width: 530,
              }}
            >
              {/* Step 1 */}
              <div style={{ opacity: funnel1Op, display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    flex: "0 0 auto",
                    color: C.textDim,
                    fontSize: 18,
                    fontFamily: MONO,
                    backgroundColor: `${C.accent}15`,
                    border: `1px solid ${C.accent}30`,
                    borderRadius: 6,
                    padding: "4px 10px",
                  }}
                >
                  1. avg across heads
                </div>
                <svg width="30" height="10"><polygon points="0,0 0,10 12,5" fill={C.textMuted} /><line x1="12" y1="5" x2="30" y2="5" stroke={C.textMuted} strokeWidth="1" /></svg>
                <div style={{ fontSize: 18, fontFamily: MONO, color: C.textMuted }}>per-chunk scores</div>
              </div>
              {/* Step 2 */}
              <div style={{ opacity: funnel2Op, display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    flex: "0 0 auto",
                    color: C.textDim,
                    fontSize: 18,
                    fontFamily: MONO,
                    backgroundColor: `${C.accent}15`,
                    border: `1px solid ${C.accent}30`,
                    borderRadius: 6,
                    padding: "4px 10px",
                  }}
                >
                  2. max pool tokens
                </div>
                <svg width="30" height="10"><polygon points="0,0 0,10 12,5" fill={C.textMuted} /><line x1="12" y1="5" x2="30" y2="5" stroke={C.textMuted} strokeWidth="1" /></svg>
                <div style={{ fontSize: 18, fontFamily: MONO, color: C.textMuted }}>chunk → doc score</div>
              </div>
              {/* Step 3 */}
              <div style={{ opacity: funnel3Op, display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    flex: "0 0 auto",
                    color: C.textDim,
                    fontSize: 18,
                    fontFamily: MONO,
                    backgroundColor: `${C.accent}15`,
                    border: `1px solid ${C.accent}30`,
                    borderRadius: 6,
                    padding: "4px 10px",
                  }}
                >
                  3. max across chunks
                </div>
                <svg width="30" height="10"><polygon points="0,0 0,10 12,5" fill={C.textMuted} /><line x1="12" y1="5" x2="30" y2="5" stroke={C.textMuted} strokeWidth="1" /></svg>
                {/* Doc scores */}
                <div style={{ display: "flex", gap: 8, opacity: docScoreOp }}>
                  {docScores.map((ds, di) => {
                    const docIdx = gi * 2 + di;
                    const isHigh = ds >= 0.7;
                    return (
                      <div
                        key={di}
                        style={{
                          backgroundColor: isHigh ? `${C.scoreHigh}20` : `${C.scoreLow}10`,
                          border: `1.5px solid ${isHigh ? C.scoreHigh : C.scoreLow}`,
                          borderRadius: 8,
                          padding: "4px 12px",
                          color: isHigh ? C.scoreHigh : C.scoreLow,
                          fontSize: 18,
                          fontFamily: MONO,
                          fontWeight: 700,
                        }}
                      >
                        D{docIdx}: {ds.toFixed(2)}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </React.Fragment>
        );
      })}

      {/* "cosine similarity" label */}
      <div
        style={{
          position: "absolute",
          top: 220,
          width: "100%",
          textAlign: "center",
          opacity: ci(frame, [0.2 * fps, 0.6 * fps], [0, 1]),
        }}
      >
        <div
          style={{
            display: "inline-block",
            backgroundColor: `${C.qr}10`,
            border: `1px solid ${C.qr}30`,
            borderRadius: 8,
            padding: "8px 24px",
            color: C.qr,
            fontSize: 22,
            fontFamily: MONO,
            fontWeight: 600,
          }}
        >
          cos(<M>Q</M><Sup>R</Sup>, <M><Overline>K</Overline></M><Sup>R</Sup><Sub>i</Sub>) → scoring pipeline
        </div>
      </div>
    </>
  );
};

// ============================================================
// Phase 4: Global Top-k Selection
// ============================================================
const Phase4: React.FC<{ globalFrame: number }> = ({ globalFrame: frame }) => {
  const { fps } = useVideoConfig();

  // All 4 doc scores, sorted for display
  const docs = [
    { id: 0, score: 0.91, isTopK: true },
    { id: 2, score: 0.83, isTopK: true },
    { id: 3, score: 0.67, isTopK: false },
    { id: 1, score: 0.45, isTopK: false },
  ];

  // "All-Reduce" label
  const reduceOp = ci(frame, [0, 0.5 * fps], [0, 1]);

  // Ranked list appears
  const listAppear = docs.map((_, i) => {
    const delay = 0.5 * fps + i * 8;
    return spring({ frame: frame - delay, fps, config: { damping: 200 } });
  });

  // Top-k highlight
  const topKFlash = ci(frame, [1.5 * fps, 2 * fps], [0, 1]);

  // "Top-k" badge
  const badgeOp = ci(frame, [2 * fps, 2.5 * fps], [0, 1]);
  const badgeScale = spring({ frame: frame - 2 * fps, fps, config: { damping: 12 } });

  const listX = 960 - 200;
  const listY = 300;

  return (
    <>
      {/* "Global All-Reduce" label */}
      <div
        style={{
          position: "absolute",
          top: 230,
          width: "100%",
          textAlign: "center",
          opacity: reduceOp,
        }}
      >
        <div
          style={{
            display: "inline-block",
            color: C.accent,
            fontSize: 18,
            fontFamily: MONO,
            fontWeight: 600,
            backgroundColor: `${C.accent}12`,
            border: `1px solid ${C.accent}30`,
            borderRadius: 8,
            padding: "6px 20px",
          }}
        >
          Global All-Reduce: gather scores from all GPUs
        </div>
      </div>

      {/* Ranked list */}
      <div style={{ position: "absolute", top: listY, left: listX, width: 400 }}>
        <div style={{ color: C.textDim, fontSize: 18, fontFamily: MONO, marginBottom: 12, opacity: reduceOp }}>
          Ranked documents:
        </div>
        {docs.map((doc, i) => {
          const highlighted = doc.isTopK && topKFlash > 0.5;
          return (
            <div
              key={doc.id}
              style={{
                opacity: listAppear[i],
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 10,
                padding: "10px 20px",
                borderRadius: 10,
                backgroundColor: highlighted ? `${C.scoreHigh}15` : `${C.scoreLow}08`,
                border: `2px solid ${highlighted ? C.scoreHigh : "transparent"}`,
                transform: highlighted ? "scale(1.03)" : "scale(1)",
                boxShadow: highlighted ? `0 0 16px ${C.scoreHigh}30` : "none",
              }}
            >
              {/* Rank */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  backgroundColor: highlighted ? C.scoreHigh : C.scoreLow,
                  color: C.bg,
                  fontSize: 18,
                  fontFamily: MONO,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {i + 1}
              </div>
              {/* Doc name */}
              <div
                style={{
                  flex: 1,
                  color: highlighted ? C.text : C.textDim,
                  fontSize: 18,
                  fontFamily: MONO,
                  fontWeight: highlighted ? 600 : 400,
                }}
              >
                Document {doc.id}
              </div>
              {/* Score bar */}
              <div style={{ width: 120, height: 8, backgroundColor: `${C.scoreLow}30`, borderRadius: 4, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${doc.score * 100}%`,
                    height: "100%",
                    backgroundColor: highlighted ? C.scoreHigh : C.scoreLow,
                    borderRadius: 4,
                  }}
                />
              </div>
              {/* Score value */}
              <div
                style={{
                  color: highlighted ? C.scoreHigh : C.scoreLow,
                  fontSize: 18,
                  fontFamily: MONO,
                  fontWeight: 700,
                  width: 50,
                  textAlign: "right",
                }}
              >
                {doc.score.toFixed(2)}
              </div>
              {/* Top-k badge on item */}
              {highlighted && (
                <div
                  style={{
                    opacity: topKFlash,
                    color: C.scoreHigh,
                    fontSize: 18,
                    fontFamily: MONO,
                    fontWeight: 700,
                    backgroundColor: `${C.scoreHigh}20`,
                    borderRadius: 4,
                    padding: "2px 8px",
                  }}
                >
                  TOP-K
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Top-k selection badge */}
      <div
        style={{
          position: "absolute",
          top: listY + 280,
          width: "100%",
          textAlign: "center",
          opacity: badgeOp,
          transform: `scale(${badgeScale})`,
        }}
      >
        <div
          style={{
            display: "inline-block",
            backgroundColor: `${C.scoreHigh}15`,
            border: `2px solid ${C.scoreHigh}`,
            borderRadius: 14,
            padding: "10px 32px",
            color: C.scoreHigh,
            fontSize: 26,
            fontFamily: FONT,
            fontWeight: 700,
          }}
        >
          Top-<M style={{ fontStyle: "normal" }}>k</M> = 2 documents selected across 100M+ tokens
        </div>
      </div>
    </>
  );
};

// ============================================================
// Phase 5: Fetch from CPU DRAM
// ============================================================
const Phase5: React.FC<{ globalFrame: number }> = ({ globalFrame: frame }) => {
  const { fps } = useVideoConfig();

  // CPU DRAM zone appears
  const cpuOp = ci(frame, [0, 0.6 * fps], [0, 1]);

  // Signal arrow from top-k → CPU
  const signalProgress = ci(frame, [0.5 * fps, 1.5 * fps], [0, 1]);

  // K̄, V̄ emerge from CPU
  const fetchOp = ci(frame, [1.5 * fps, 2 * fps], [0, 1]);
  const fetchScale = spring({ frame: frame - 1.5 * fps, fps, config: { damping: 15 } });

  // "Only selected docs" label
  const labelOp = ci(frame, [2 * fps, 2.5 * fps], [0, 1]);

  // Final arrow → attention
  const finalOp = ci(frame, [2.5 * fps, 3 * fps], [0, 1]);

  const CPU_X = 300;
  const CPU_Y = 350;
  const CPU_W = 500;
  const CPU_H = 300;

  return (
    <>
      {/* Step label */}
      <div
        style={{
          position: "absolute",
          top: 230,
          width: "100%",
          textAlign: "center",
          opacity: ci(frame, [0, 0.4 * fps], [0, 1]),
        }}
      >
        <div
          style={{
            display: "inline-block",
            color: C.accent,
            fontSize: 18,
            fontFamily: MONO,
            fontWeight: 600,
            backgroundColor: `${C.accent}12`,
            border: `1px solid ${C.accent}30`,
            borderRadius: 8,
            padding: "5px 18px",
          }}
        >
          Signal CPU to fetch bulk <M><Overline>K</Overline></M>, <M><Overline>V</Overline></M> for selected documents
        </div>
      </div>

      {/* CPU DRAM zone */}
      <div
        style={{
          position: "absolute",
          top: CPU_Y,
          left: CPU_X,
          width: CPU_W,
          height: CPU_H,
          backgroundColor: C.cpuBg,
          border: `2px solid ${C.cpuBorder}`,
          borderRadius: 16,
          opacity: cpuOp,
          boxShadow: `inset 0 0 40px rgba(14, 165, 233, 0.06)`,
        }}
      >
        <div style={{ position: "absolute", top: 14, left: 18, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: C.cpuBorder }} />
          <span style={{ color: C.cpuBorder, fontSize: 18, fontFamily: MONO, fontWeight: 600 }}>
            CPU Host DRAM — Bulk KV Store
          </span>
        </div>

        {/* Matrix representations inside */}
        <div style={{ position: "absolute", top: 60, left: 30, display: "flex", gap: 20 }}>
          {["D0", "D1", "D2", "D3"].map((label, i) => {
            const selected = i === 0 || i === 2;
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div
                  style={{
                    width: 90,
                    height: 60,
                    border: `1.5px solid ${selected ? C.scoreHigh : C.textMuted}40`,
                    borderRadius: 6,
                    backgroundColor: selected ? `${C.scoreHigh}10` : `${C.textMuted}08`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    padding: 6,
                    justifyContent: "center",
                  }}
                >
                  <div style={{ height: 5, backgroundColor: `${C.keyMatrix}30`, borderRadius: 2, width: "80%" }} />
                  <div style={{ height: 5, backgroundColor: `${C.keyMatrix}30`, borderRadius: 2, width: "60%" }} />
                  <div style={{ height: 5, backgroundColor: `${C.valueMatrix}30`, borderRadius: 2, width: "70%" }} />
                  <div style={{ height: 5, backgroundColor: `${C.valueMatrix}30`, borderRadius: 2, width: "50%" }} />
                </div>
                <span style={{ fontSize: 18, fontFamily: MONO, color: selected ? C.scoreHigh : C.textMuted }}>
                  {label} <M><Overline>K</Overline></M>,<M><Overline>V</Overline></M>
                </span>
              </div>
            );
          })}
        </div>

        {/* "Only selected" highlight */}
        <div style={{ position: "absolute", bottom: 20, width: "100%", textAlign: "center", opacity: labelOp }}>
          <span style={{ color: C.scoreHigh, fontSize: 18, fontFamily: MONO, fontWeight: 600 }}>
            Fetch only D0, D2 (Top-k selected)
          </span>
        </div>
      </div>

      {/* Signal arrow */}
      <svg
        style={{ position: "absolute", top: CPU_Y + CPU_H / 2 - 10, left: CPU_X + CPU_W + 10, opacity: signalProgress }}
        width="100"
        height="20"
      >
        <line x1="0" y1="10" x2="70" y2="10" stroke={C.scoreHigh} strokeWidth="2" />
        <polygon points="68,4 84,10 68,16" fill={C.scoreHigh} />
      </svg>

      {/* Fetched K̄, V̄ */}
      <div
        style={{
          position: "absolute",
          top: CPU_Y + 60,
          left: CPU_X + CPU_W + 120,
          opacity: fetchOp,
          transform: `scale(${fetchScale})`,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {[
          { label: <><M><Overline>K</Overline></M> (selected)</>, color: C.keyMatrix },
          { label: <><M><Overline>V</Overline></M> (selected)</>, color: C.valueMatrix },
        ].map((mat, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 120,
                height: 50,
                border: `2px solid ${mat.color}`,
                borderRadius: 8,
                backgroundColor: `${mat.color}12`,
                display: "flex",
                flexWrap: "wrap",
                gap: 3,
                padding: 6,
                alignContent: "center",
                justifyContent: "center",
              }}
            >
              {Array.from({ length: 8 }, (_, j) => (
                <div key={j} style={{ width: 12, height: 8, backgroundColor: `${mat.color}35`, borderRadius: 2 }} />
              ))}
            </div>
            <div style={{ color: mat.color, fontSize: 18, fontFamily: MONO, fontWeight: 600 }}>
              {mat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Arrow → Attention */}
      <div
        style={{
          position: "absolute",
          top: CPU_Y + CPU_H / 2 + 80,
          left: CPU_X + CPU_W + 120,
          opacity: finalOp,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <svg width="40" height="16">
          <line x1="0" y1="8" x2="24" y2="8" stroke={C.accent} strokeWidth="2" />
          <polygon points="22,3 36,8 22,13" fill={C.accent} />
        </svg>
        <div
          style={{
            backgroundColor: `${C.accent}18`,
            border: `2px solid ${C.accent}`,
            borderRadius: 10,
            padding: "8px 20px",
            color: C.text,
            fontSize: 18,
            fontFamily: MONO,
            fontWeight: 600,
          }}
        >
          Attention Computation
        </div>
      </div>
    </>
  );
};

// ============================================================
// Main Composition
// ============================================================
const TitleBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = ci(frame, [0, 0.5 * fps], [0, 1]);
  const titleY = interpolate(frame, [0, 0.5 * fps], [-20, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Step label crossfades — extended timeline with hold time
  const steps = [
    { text: "STEP 1: GENERATE ROUTING QUERY", start: 0, end: 5 * fps },
    { text: "STEP 2: BROADCAST TO GPUs", start: 5 * fps, end: 9 * fps },
    { text: "STEP 3: HIERARCHICAL SCORING", start: 9 * fps, end: 15 * fps },
    { text: "STEP 4: GLOBAL TOP-K SELECTION", start: 15 * fps, end: 21 * fps },
    { text: "STEP 5: CONTEXT ASSEMBLY", start: 21 * fps, end: 27 * fps },
  ];

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 45,
          width: "100%",
          textAlign: "center",
          opacity: titleOp,
          transform: `translateY(${titleY}px)`,
          color: C.text,
          fontSize: 48,
          fontFamily: FONT,
          fontWeight: 700,
          letterSpacing: -1,
        }}
      >
        Sparse Attention Routing
      </div>
      <div style={{ position: "absolute", top: 110, width: "100%", textAlign: "center" }}>
        {steps.map((s, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: "100%",
              textAlign: "center",
              opacity: ci(
                frame,
                [s.start + (i === 0 ? 0 : -5), s.start + 12, s.end - 10, s.end],
                [0, 1, 1, 0]
              ),
              color: C.accent,
              fontSize: 22,
              fontFamily: MONO,
              fontWeight: 500,
              letterSpacing: 2,
            }}
          >
            {s.text}
          </div>
        ))}
      </div>
    </>
  );
};

export const SparseAttentionRouting: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* Persistent title bar */}
      <TitleBar />

      {/* Phase 1: 0-5s (3s animation + 2s hold) */}
      <Sequence from={0} durationInFrames={5 * fps} premountFor={fps}>
        <Phase1 globalFrame={frame} />
      </Sequence>

      {/* Phase 2+3: 5-15s (broadcast 5-9s, scoring 9-15s with hold) */}
      <Sequence from={5 * fps} durationInFrames={10 * fps} premountFor={fps}>
        <Phase2 globalFrame={frame - 5 * fps} />
        {frame >= 9 * fps && <Phase3 globalFrame={frame - 9 * fps} />}
      </Sequence>

      {/* Phase 4: 15-21s (4s animation + 2s hold) */}
      <Sequence from={15 * fps} durationInFrames={6 * fps} premountFor={fps}>
        <Phase4 globalFrame={frame - 15 * fps} />
      </Sequence>

      {/* Phase 5: 21-27s (4s animation + 2s hold) */}
      <Sequence from={21 * fps} durationInFrames={6 * fps} premountFor={fps}>
        <Phase5 globalFrame={frame - 21 * fps} />
      </Sequence>
    </AbsoluteFill>
  );
};
