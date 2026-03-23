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
  key: "#3b82f6",
  value: "#10b981",
  query: "#ec4899",
  topK: "#10b981",
  gpuBg: "#1a1033",
  gpuBorder: "#a855f7",
  gpuGlow: "rgba(168, 85, 247, 0.12)",
  cpuBg: "#0f1d2d",
  cpuBorder: "#0ea5e9",
  generated: "#f59e0b",
};
const FONT = "SF Pro Display, Inter, Helvetica Neue, Arial, sans-serif";
const MONO = "SF Mono, Fira Code, Consolas, monospace";
const MATH = "Times New Roman, Georgia, serif";

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

const ci = (f: number, ir: [number, number], or: [number, number]) =>
  interpolate(f, ir, or, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// ============================================================
// Phase 1: Targeted Context Assembly (CPU → GPU fetch)
// ============================================================
const FetchPhase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cpuOp = ci(frame, [0, 0.5 * fps], [0, 1]);

  // CPU DRAM with doc slots
  const docs = [
    { id: 0, selected: true },
    { id: 1, selected: false },
    { id: 2, selected: true },
    { id: 3, selected: false },
  ];

  // GPU VRAM zone
  const gpuOp = ci(frame, [0.3 * fps, 0.8 * fps], [0, 1]);

  // Fetch animation: selected docs fly from CPU to GPU
  const fetchStart = 1.5 * fps;
  const fetchEnd = 3.5 * fps;
  const fetchProgress = ci(frame, [fetchStart, fetchEnd], [0, 1]);

  // "Async fetch" label
  const fetchLabelOp = ci(frame, [1 * fps, 1.5 * fps], [0, 1]);

  // Arrival in GPU
  const arrivedOp = ci(frame, [fetchEnd, fetchEnd + 0.3 * fps], [0, 1]);

  // Layout
  const CPU_X = 80;
  const CPU_Y = 260;
  const CPU_W = 500;
  const CPU_H = 460;
  const GPU_X = 1100;
  const GPU_Y = 260;
  const GPU_W = 700;
  const GPU_H = 460;

  return (
    <>
      {/* CPU DRAM */}
      <div
        style={{
          position: "absolute",
          top: CPU_Y, left: CPU_X, width: CPU_W, height: CPU_H,
          backgroundColor: C.cpuBg,
          border: `2px solid ${C.cpuBorder}`,
          borderRadius: 16,
          opacity: cpuOp,
          boxShadow: `inset 0 0 40px rgba(14,165,233,0.06)`,
        }}
      >
        <div style={{ position: "absolute", top: 16, left: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: C.cpuBorder }} />
          <span style={{ color: C.cpuBorder, fontSize: 20, fontFamily: MONO, fontWeight: 600 }}>
            CPU Host DRAM
          </span>
        </div>

        {/* Doc slots */}
        <div style={{ position: "absolute", top: 70, left: 30, display: "flex", flexDirection: "column", gap: 16 }}>
          {docs.map((doc) => (
            <div
              key={doc.id}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "12px 18px",
                borderRadius: 10,
                backgroundColor: doc.selected ? `${C.topK}12` : `${C.textMuted}08`,
                border: `2px solid ${doc.selected ? C.topK : C.textMuted}40`,
                opacity: doc.selected && fetchProgress > 0.5 ? 0.4 : 1,
              }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ width: 50, height: 28, borderRadius: 5, backgroundColor: `${C.key}25`, border: `1px solid ${C.key}50` }} />
                <div style={{ width: 50, height: 28, borderRadius: 5, backgroundColor: `${C.value}25`, border: `1px solid ${C.value}50` }} />
              </div>
              <span style={{ color: doc.selected ? C.topK : C.textMuted, fontSize: 18, fontFamily: MONO, fontWeight: 600 }}>
                Doc {doc.id}: <M><Overline>K</Overline></M>, <M><Overline>V</Overline></M>
              </span>
              {doc.selected && (
                <span style={{ color: C.topK, fontSize: 14, fontFamily: MONO, fontWeight: 700, backgroundColor: `${C.topK}20`, borderRadius: 4, padding: "2px 8px" }}>
                  TOP-K
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* GPU VRAM */}
      <div
        style={{
          position: "absolute",
          top: GPU_Y, left: GPU_X, width: GPU_W, height: GPU_H,
          backgroundColor: C.gpuBg,
          border: `2px solid ${C.gpuBorder}`,
          borderRadius: 16,
          opacity: gpuOp,
          boxShadow: `inset 0 0 50px ${C.gpuGlow}`,
        }}
      >
        <div style={{ position: "absolute", top: 16, left: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: C.gpuBorder, boxShadow: `0 0 6px ${C.gpuBorder}` }} />
          <span style={{ color: C.gpuBorder, fontSize: 20, fontFamily: MONO, fontWeight: 600 }}>
            GPU VRAM
          </span>
        </div>

        {/* Arrived content */}
        <div style={{ position: "absolute", top: 70, left: 30, display: "flex", flexDirection: "column", gap: 16, opacity: arrivedOp }}>
          {[0, 2].map((docId) => (
            <div
              key={docId}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "12px 18px",
                borderRadius: 10,
                backgroundColor: `${C.topK}12`,
                border: `2px solid ${C.topK}`,
                boxShadow: `0 0 12px ${C.topK}25`,
              }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ width: 50, height: 28, borderRadius: 5, backgroundColor: `${C.key}30`, border: `1px solid ${C.key}` }} />
                <div style={{ width: 50, height: 28, borderRadius: 5, backgroundColor: `${C.value}30`, border: `1px solid ${C.value}` }} />
              </div>
              <span style={{ color: C.topK, fontSize: 18, fontFamily: MONO, fontWeight: 600 }}>
                Doc {docId}: <M><Overline>K</Overline></M>, <M><Overline>V</Overline></M>
              </span>
            </div>
          ))}
        </div>

        {/* "Only top-k" label */}
        <div style={{ position: "absolute", bottom: 24, width: "100%", textAlign: "center", opacity: arrivedOp }}>
          <span style={{ color: C.gpuBorder, fontSize: 18, fontFamily: MONO, fontWeight: 600 }}>
            Only Top-k content fetched
          </span>
        </div>
      </div>

      {/* Fetch arrows */}
      <svg style={{ position: "absolute", top: 0, left: 0, width: 1920, height: 1080, pointerEvents: "none" }}>
        {[0, 2].map((docId, i) => {
          const srcX = CPU_X + CPU_W;
          const srcY = CPU_Y + 90 + (docId === 0 ? 0 : 1) * 76 + 20;
          const dstX = GPU_X;
          const dstY = GPU_Y + 90 + i * 76 + 20;
          const curX = interpolate(fetchProgress, [0, 1], [srcX, dstX]);
          const curY = interpolate(fetchProgress, [0, 1], [srcY, dstY]);
          return (
            <React.Fragment key={docId}>
              <line
                x1={srcX} y1={srcY} x2={curX} y2={curY}
                stroke={C.topK} strokeWidth="2" strokeDasharray="8 5" opacity={fetchProgress > 0 ? 0.5 : 0}
              />
              {fetchProgress > 0.05 && fetchProgress < 0.95 && (
                <circle cx={curX} cy={curY} r="8" fill={C.topK} opacity={0.8} />
              )}
            </React.Fragment>
          );
        })}
      </svg>

      {/* "Async fetch" label */}
      <div
        style={{
          position: "absolute",
          top: CPU_Y + CPU_H / 2 - 30,
          left: CPU_X + CPU_W + 30,
          opacity: fetchLabelOp,
          color: C.topK,
          fontSize: 20,
          fontFamily: MONO,
          fontWeight: 600,
        }}
      >
        Async fetch
        <div style={{ color: C.textDim, fontSize: 16, fontFamily: MONO, marginTop: 4 }}>
          CPU → GPU transfer
        </div>
      </div>
    </>
  );
};

// ============================================================
// Phase 2: Concatenation
// ============================================================
const ConcatPhase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const Y = 300;
  const blockH = 80;
  const gap = 12;

  // Retrieved docs slide in from left
  const doc0X = ci(frame, [0, 0.6 * fps], [-300, 200]);
  const doc2X = ci(frame, [0.2 * fps, 0.8 * fps], [-300, 430]);
  const docsOp = ci(frame, [0, 0.4 * fps], [0, 1]);

  // "+" symbol
  const plusOp = ci(frame, [0.8 * fps, 1.2 * fps], [0, 1]);

  // Local Kq, Vq slide in from right
  const localX = ci(frame, [1 * fps, 1.6 * fps], [1920, 690]);
  const localOp = ci(frame, [1 * fps, 1.3 * fps], [0, 1]);

  // Merge into unified bar
  const mergeProgress = ci(frame, [2 * fps, 3 * fps], [0, 1]);

  // "Sparse context" label
  const contextLabelOp = ci(frame, [3 * fps, 3.5 * fps], [0, 1]);
  const contextScale = spring({ frame: frame - 3 * fps, fps, config: { damping: 15 } });

  const mergedWidth = interpolate(mergeProgress, [0, 1], [0, 1200]);

  return (
    <>
      {/* Retrieved doc blocks (before merge) */}
      {mergeProgress < 0.5 && (
        <>
          <div style={{ position: "absolute", top: Y, left: doc0X, opacity: docsOp }}>
            <MatrixBlock label={<>Doc 0: <M><Overline>K</Overline></M>, <M><Overline>V</Overline></M></>} color={C.topK} width={200} height={blockH} />
          </div>
          <div style={{ position: "absolute", top: Y, left: doc2X, opacity: docsOp }}>
            <MatrixBlock label={<>Doc 2: <M><Overline>K</Overline></M>, <M><Overline>V</Overline></M></>} color={C.topK} width={200} height={blockH} />
          </div>
          {/* Plus */}
          <div style={{ position: "absolute", top: Y + 20, left: 655, opacity: plusOp, color: C.textDim, fontSize: 36, fontFamily: FONT, fontWeight: 700 }}>
            +
          </div>
          {/* Local KV */}
          <div style={{ position: "absolute", top: Y, left: localX, opacity: localOp }}>
            <MatrixBlock label={<>Local: <M>K</M><Sub>q</Sub>, <M>V</M><Sub>q</Sub></>} color={C.query} width={200} height={blockH} />
          </div>
        </>
      )}

      {/* Merged bar */}
      {mergeProgress > 0 && (
        <div
          style={{
            position: "absolute",
            top: Y + blockH + 40,
            left: (1920 - mergedWidth) / 2,
            width: mergedWidth,
            height: blockH,
            borderRadius: 12,
            overflow: "hidden",
            display: "flex",
            opacity: mergeProgress,
          }}
        >
          {/* Doc 0 segment */}
          <div style={{ flex: 3, backgroundColor: `${C.topK}20`, borderLeft: `3px solid ${C.topK}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: C.topK, fontSize: 18, fontFamily: MONO, fontWeight: 600 }}>
              Doc 0: <M><Overline>K</Overline></M>, <M><Overline>V</Overline></M>
            </span>
          </div>
          {/* Doc 2 segment */}
          <div style={{ flex: 3, backgroundColor: `${C.topK}15`, borderLeft: `2px solid ${C.topK}50`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: C.topK, fontSize: 18, fontFamily: MONO, fontWeight: 600 }}>
              Doc 2: <M><Overline>K</Overline></M>, <M><Overline>V</Overline></M>
            </span>
          </div>
          {/* Local segment */}
          <div style={{ flex: 2, backgroundColor: `${C.query}15`, borderLeft: `2px solid ${C.query}50`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: C.query, fontSize: 18, fontFamily: MONO, fontWeight: 600 }}>
              <M>K</M><Sub>q</Sub>, <M>V</M><Sub>q</Sub>
            </span>
          </div>
        </div>
      )}

      {/* Border around merged bar */}
      {mergeProgress > 0.5 && (
        <div
          style={{
            position: "absolute",
            top: Y + blockH + 36,
            left: (1920 - mergedWidth) / 2 - 4,
            width: mergedWidth + 8,
            height: blockH + 8,
            border: `2px solid ${C.accent}`,
            borderRadius: 14,
            opacity: mergeProgress,
          }}
        />
      )}

      {/* "Sparse Context" label */}
      <div
        style={{
          position: "absolute",
          top: Y + blockH * 2 + 60,
          width: "100%",
          textAlign: "center",
          opacity: contextLabelOp,
          transform: `scale(${contextScale})`,
        }}
      >
        <div
          style={{
            display: "inline-block",
            backgroundColor: `${C.accent}15`,
            border: `2px solid ${C.accent}`,
            borderRadius: 12,
            padding: "10px 32px",
            color: C.accent,
            fontSize: 24,
            fontFamily: FONT,
            fontWeight: 700,
          }}
        >
          Unified Sparse Context
        </div>
        <div style={{ color: C.textDim, fontSize: 18, fontFamily: MONO, marginTop: 10 }}>
          Concatenated: [Retrieved Top-k KVs] ⊕ [Local <M>K</M><Sub>q</Sub>, <M>V</M><Sub>q</Sub>]
        </div>
      </div>
    </>
  );
};

const MatrixBlock: React.FC<{
  label: React.ReactNode;
  color: string;
  width: number;
  height: number;
}> = ({ label, color, width, height }) => (
  <div
    style={{
      width, height,
      backgroundColor: `${color}18`,
      border: `2px solid ${color}`,
      borderRadius: 10,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 16px",
    }}
  >
    <span style={{ color, fontSize: 18, fontFamily: MONO, fontWeight: 600 }}>{label}</span>
  </div>
);

// ============================================================
// Phase 3: Autoregressive Generation
// ============================================================
const GenerationPhase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const Y = 260;
  const barH = 70;
  const barW = 1200;
  const barX = (1920 - barW) / 2;

  // Sparse context bar (static)
  const barOp = ci(frame, [0, 0.3 * fps], [0, 1]);

  // Qq appears above
  const qqOp = ci(frame, [0.5 * fps, 1 * fps], [0, 1]);
  const qqScale = spring({ frame: frame - 0.5 * fps, fps, config: { damping: 15 } });

  // Attention arrows from Qq down to context
  const attnOp = ci(frame, [1.5 * fps, 2 * fps], [0, 1]);

  // Token generation
  const tokens = ["The", "answer", "is", "based", "on", "retrieved", "context", "..."];
  const tokenOps = tokens.map((_, i) => {
    const delay = 2.5 * fps + i * 8;
    return spring({ frame: frame - delay, fps, config: { damping: 200 } });
  });

  // "End-to-end differentiable" label
  const e2eOp = ci(frame, [4 * fps, 4.5 * fps], [0, 1]);

  return (
    <>
      {/* Sparse context bar */}
      <div
        style={{
          position: "absolute",
          top: Y, left: barX, width: barW, height: barH,
          borderRadius: 12,
          border: `2px solid ${C.accent}`,
          overflow: "hidden",
          display: "flex",
          opacity: barOp,
        }}
      >
        <div style={{ flex: 3, backgroundColor: `${C.topK}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: C.topK, fontSize: 18, fontFamily: MONO, fontWeight: 600 }}>
            Doc 0: <M><Overline>K</Overline></M>, <M><Overline>V</Overline></M>
          </span>
        </div>
        <div style={{ flex: 3, backgroundColor: `${C.topK}10`, borderLeft: `2px solid ${C.topK}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: C.topK, fontSize: 18, fontFamily: MONO, fontWeight: 600 }}>
            Doc 2: <M><Overline>K</Overline></M>, <M><Overline>V</Overline></M>
          </span>
        </div>
        <div style={{ flex: 2, backgroundColor: `${C.query}10`, borderLeft: `2px solid ${C.query}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: C.query, fontSize: 18, fontFamily: MONO, fontWeight: 600 }}>
            <M>K</M><Sub>q</Sub>, <M>V</M><Sub>q</Sub>
          </span>
        </div>
      </div>
      <div style={{ position: "absolute", top: Y - 30, left: barX, opacity: barOp, color: C.textDim, fontSize: 16, fontFamily: MONO }}>
        Sparse Context
      </div>

      {/* Qq query vector */}
      <div
        style={{
          position: "absolute",
          top: Y + barH + 50,
          left: barX + barW / 2 - 80,
          opacity: qqOp,
          transform: `scale(${qqScale})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 160, height: 52,
            backgroundColor: `${C.query}20`,
            border: `2px solid ${C.query}`,
            borderRadius: 12,
            boxShadow: `0 0 16px ${C.query}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: C.query, fontSize: 22, fontFamily: MONO, fontWeight: 700 }}>
            <M>Q</M><Sub>q</Sub> (Active)
          </span>
        </div>
        <span style={{ color: C.textDim, fontSize: 16, fontFamily: MONO }}>
          Attends to sparse context
        </span>
      </div>

      {/* Attention arrows */}
      <svg
        style={{ position: "absolute", top: Y + barH, left: barX, width: barW, height: 55, opacity: attnOp, pointerEvents: "none" }}
      >
        {[0.15, 0.35, 0.55, 0.75, 0.9].map((pct, i) => (
          <line
            key={i}
            x1={barW / 2} y1={50}
            x2={barW * pct} y2={5}
            stroke={C.query}
            strokeWidth="1.5"
            opacity={0.4}
            strokeDasharray="4 3"
          />
        ))}
      </svg>

      {/* Generated tokens */}
      <div
        style={{
          position: "absolute",
          top: Y + barH + 170,
          left: barX,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          width: barW,
        }}
      >
        <span style={{ color: C.textDim, fontSize: 18, fontFamily: MONO, marginRight: 8, lineHeight: "44px" }}>
          Output:
        </span>
        {tokens.map((tok, i) => (
          <div
            key={i}
            style={{
              opacity: tokenOps[i],
              backgroundColor: `${C.generated}18`,
              border: `1.5px solid ${C.generated}`,
              borderRadius: 8,
              padding: "6px 16px",
              color: C.generated,
              fontSize: 20,
              fontFamily: MONO,
              fontWeight: 600,
            }}
          >
            {tok}
          </div>
        ))}
      </div>

      {/* End-to-end label */}
      <div
        style={{
          position: "absolute",
          bottom: 70,
          width: "100%",
          textAlign: "center",
          opacity: e2eOp,
        }}
      >
        <div
          style={{
            display: "inline-block",
            backgroundColor: `${C.accent}12`,
            border: `2px solid ${C.accent}`,
            borderRadius: 14,
            padding: "12px 36px",
            color: C.accent,
            fontSize: 24,
            fontFamily: FONT,
            fontWeight: 700,
          }}
        >
          End-to-end differentiable retrieval + generation
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
    { text: "STEP 1: TARGETED CONTEXT ASSEMBLY", start: 0, end: 7 * fps },
    { text: "STEP 2: CONCATENATION", start: 7 * fps, end: 14 * fps },
    { text: "STEP 3: AUTOREGRESSIVE GENERATION", start: 14 * fps, end: 22 * fps },
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
        Context Assembly &amp; Sparse Generation
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
export const ContextAssembly: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <TitleBar />
      <Sequence from={0} durationInFrames={7 * fps} premountFor={fps}>
        <FetchPhase />
      </Sequence>
      <Sequence from={7 * fps} durationInFrames={7 * fps} premountFor={fps}>
        <ConcatPhase />
      </Sequence>
      <Sequence from={14 * fps} durationInFrames={8 * fps} premountFor={fps}>
        <GenerationPhase />
      </Sequence>
    </AbsoluteFill>
  );
};
