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

// --- Color palette ---
const COLORS = {
  bg: "#0f1117",
  textBlock: "#2a2d3a",
  textLine: "#4a4f65",
  chunkBorder: "#6366f1",
  poolingFilter: "rgba(99, 102, 241, 0.25)",
  poolingFilterBorder: "#6366f1",
  keyMatrix: "#3b82f6",
  valueMatrix: "#10b981",
  routingMatrix: "#f59e0b",
  text: "#e2e8f0",
  textDim: "#94a3b8",
  textMuted: "#64748b",
  accent: "#6366f1",
};

const FONT = "SF Pro Display, Inter, Helvetica Neue, Arial, sans-serif";
const MONO = "SF Mono, Fira Code, Consolas, monospace";
const MATH = "Times New Roman, Georgia, serif";

// --- Math rendering helpers ---
const Overline: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ textDecoration: "overline", textDecorationThickness: "2px", textUnderlineOffset: "-2px" }}>{children}</span>
);
const Sub: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ fontSize: "0.65em", verticalAlign: "sub" }}>{children}</span>
);
const Sup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ fontSize: "0.65em", verticalAlign: "super" }}>{children}</span>
);
const MathText: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <span style={{ fontFamily: MATH, fontStyle: "italic", ...style }}>{children}</span>
);
const KBar = () => <MathText><Overline>K</Overline></MathText>;
const VBar = () => <MathText><Overline>V</Overline></MathText>;
const KBarR = () => <MathText><Overline>K</Overline><Sup>R</Sup></MathText>;

const ci = (f: number, ir: [number, number], or: [number, number]) =>
  interpolate(f, ir, or, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// --- Layout constants ---
const CHUNK_COUNT = 4;
const BLOCKS_PER_CHUNK = 4;
const BLOCK_COUNT = CHUNK_COUNT * BLOCKS_PER_CHUNK;
const BLOCK_W = 80;
const BLOCK_H = 55;
const GAP = 6;
const CHUNK_GAP = 22;

const TITLE_Y = 250;
const STEP_LABEL_Y = 320;
const FORMULA_Y = 370;
const BLOCKS_Y = 470;

// --- Text block ---
const TextBlock: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div
    style={{
      width: BLOCK_W, height: BLOCK_H,
      backgroundColor: COLORS.textBlock, borderRadius: 6,
      display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 4,
      ...style,
    }}
  >
    {[0.7, 0.5, 0.6].map((w, j) => (
      <div key={j} style={{ width: `${w * 100}%`, height: 4, backgroundColor: COLORS.textLine, borderRadius: 2 }} />
    ))}
  </div>
);

// ============================================================
// Unified Encoding Scene
// Timeline:
//   0-3s:    Step 1 — Document appears as text blocks
//   3-7s:    Step 2 — Forward pass: projectors produce K, V, K^R
//   7-11s:   Step 3 — Fixed-length chunking (L=64)
//   11-17s:  Step 4 — Mean pooling → compressed matrices
//   (FootprintScene is a separate Sequence after this)
// ============================================================
const EncodingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Phase timing ---
  const P1_END = 3 * fps;       // doc visible
  const P2_START = 3 * fps;     // projection
  const P2_END = 7 * fps;
  const P3_START = 7 * fps;     // chunking
  const P3_END = 11 * fps;
  const P4_START = 11 * fps;    // mean pooling
  const P4_SWEEP_END = 14 * fps;
  const P4_END = 17 * fps;

  // --- Title ---
  const titleOpacity = ci(frame, [0, 0.5 * fps], [0, 1]);
  const titleY = interpolate(frame, [0, 0.5 * fps], [-20, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });

  // --- Step labels (crossfade) ---
  const steps = [
    { text: "STEP 1: DOCUMENT REPRESENTATION", start: 0, end: P1_END },
    { text: "STEP 2: FORWARD PASS — MATRIX GENERATION", start: P2_START, end: P2_END },
    { text: "STEP 3: FIXED-LENGTH CHUNKING (L = 64)", start: P3_START, end: P3_END },
    { text: "STEP 4: MEAN POOLING COMPRESSION", start: P4_START, end: P4_END },
  ];

  // --- Formula line (crossfade) ---
  const formulas = [
    { text: <span>Long document <MathText>D</MathText> = [<MathText>t</MathText><Sub>1</Sub>, <MathText>t</MathText><Sub>2</Sub>, ..., <MathText>t</MathText><Sub>N</Sub>]</span>, start: 0, end: P1_END },
    { text: <span><MathText>D</MathText> → <MathText>K</MathText>, <MathText>V</MathText> (backbone) and <MathText>K</MathText><Sup>R</Sup> (Router K Projector)</span>, start: P2_START, end: P2_END },
    { text: <span><MathText>D</MathText> → [<MathText>C</MathText><Sub>1</Sub>, <MathText>C</MathText><Sub>2</Sub>, ..., <MathText>C</MathText><Sub>M</Sub>] where |<MathText>C</MathText><Sub>i</Sub>| = 64 tokens</span>, start: P3_START, end: P3_END },
    { text: <span><KBar /> = MeanPool(<MathText>K</MathText>), <VBar /> = MeanPool(<MathText>V</MathText>), <KBarR /> = MeanPool(<MathText>K</MathText><Sup>R</Sup>)</span>, start: P4_START, end: P4_END },
  ];

  // --- Block positions ---
  const flatTotalW = BLOCK_COUNT * (BLOCK_W + GAP) - GAP;
  const flatStartX = (1920 - flatTotalW) / 2;
  const chunkW = BLOCKS_PER_CHUNK * (BLOCK_W + GAP) - GAP;
  const chunkedTotalW = CHUNK_COUNT * chunkW + (CHUNK_COUNT - 1) * CHUNK_GAP;
  const chunkedStartX = (1920 - chunkedTotalW) / 2;

  // Chunk transition (Phase 3)
  const chunkTransition = ci(frame, [P3_START, P3_START + 1 * fps], [0, 1]);
  const blockPositions = Array.from({ length: BLOCK_COUNT }, (_, i) => {
    const flatX = flatStartX + i * (BLOCK_W + GAP);
    const chunkIndex = Math.floor(i / BLOCKS_PER_CHUNK);
    const inChunkIndex = i % BLOCKS_PER_CHUNK;
    const chunkedX = chunkedStartX + chunkIndex * (chunkW + CHUNK_GAP) + inChunkIndex * (BLOCK_W + GAP);
    return { x: interpolate(chunkTransition, [0, 1], [flatX, chunkedX]) };
  });

  // Block entrance
  const blockEntries = Array.from({ length: BLOCK_COUNT }, (_, i) => {
    const delay = 0.3 * fps + i * 1.5;
    return spring({ frame: frame - delay, fps, config: { damping: 200 } });
  });

  // Document bracket (phase 1 only)
  const bracketOp = ci(frame, [1.5 * fps, 2 * fps, P1_END - 10, P1_END + 5], [0, 1, 1, 0]);

  // --- Phase 2: Forward Pass / Projection boxes ---
  const projBoxOp = ci(frame, [P2_START + 0.3 * fps, P2_START + 0.8 * fps], [0, 1]);
  const projScale = spring({ frame: frame - P2_START - 0.3 * fps, fps, config: { damping: 200 } });

  // Arrows from doc to projectors
  const projArrowOp = ci(frame, [P2_START + 0.8 * fps, P2_START + 1.2 * fps], [0, 1]);

  // Output matrices from projectors (K, V, K^R — before compression)
  const projOutputOp = ci(frame, [P2_START + 1.5 * fps, P2_START + 2 * fps], [0, 1]);
  const projOutputScale = spring({ frame: frame - P2_START - 1.5 * fps, fps, config: { damping: 15 } });

  // Phase 2 visible
  const p2Visible = frame >= P2_START && frame < P3_START;

  // --- Phase 3: Chunk borders ---
  const chunkBorderOps = Array.from({ length: CHUNK_COUNT }, (_, i) => {
    const delay = P3_START + 0.3 * fps + i * 8;
    return spring({ frame: frame - delay, fps, config: { damping: 200 } });
  });
  const chunkLabelOp = ci(frame, [P3_START + 1 * fps, P3_START + 1.4 * fps], [0, 1]);

  // --- Phase 4: Pooling sweep ---
  const sweepProgress = ci(frame, [P4_START + 0.5 * fps, P4_SWEEP_END], [0, 1]);
  const filterX = interpolate(sweepProgress, [0, 1], [chunkedStartX - 30, chunkedStartX + chunkedTotalW - chunkW - 10]);
  const filterOp = ci(frame, [P4_START + 0.3 * fps, P4_START + 0.6 * fps, P4_SWEEP_END, P4_SWEEP_END + 0.3 * fps], [0, 1, 1, 0]);

  const chunkDimming = Array.from({ length: CHUNK_COUNT }, (_, i) => {
    const chunkCenter = chunkedStartX + i * (chunkW + CHUNK_GAP) + chunkW / 2;
    const passFrame = interpolate((chunkCenter - chunkedStartX) / chunkedTotalW, [0, 1], [P4_START + 0.5 * fps, P4_SWEEP_END]);
    return ci(frame, [passFrame, passFrame + 0.3 * fps], [1, 0.4]);
  });

  // Matrices appear
  const matrices: { label: React.ReactNode; sub: string; color: string }[] = [
    { label: <KBar />, sub: "Compressed Keys", color: COLORS.keyMatrix },
    { label: <VBar />, sub: "Compressed Values", color: COLORS.valueMatrix },
    { label: <KBarR />, sub: "Routing Keys", color: COLORS.routingMatrix },
  ];
  const matrixW = 160;
  const matrixH = 120;
  const matrixGap = 80;
  const matrixTotalW = matrices.length * matrixW + (matrices.length - 1) * matrixGap;
  const matrixStartX = (1920 - matrixTotalW) / 2;
  const matrixY = 700;
  const matricesDelay = P4_SWEEP_END + 0.3 * fps;
  const arrowOp = ci(frame, [P4_SWEEP_END, P4_SWEEP_END + 0.4 * fps], [0, 1]);

  // Global vertical shift for phase 4 (make room for matrices)
  const globalShift = ci(frame, [P4_START, P4_START + 0.5 * fps], [0, -200]);

  // "Cached to memory bank" label
  const cacheOp = ci(frame, [P4_END - 2 * fps, P4_END - 1.5 * fps], [0, 1]);
  const cacheScale = spring({ frame: frame - (P4_END - 2 * fps), fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {/* ===== Title ===== */}
      <div
        style={{
          position: "absolute", top: TITLE_Y + globalShift, width: "100%", textAlign: "center",
          opacity: titleOpacity, transform: `translateY(${titleY}px)`,
          color: COLORS.text, fontSize: 48, fontFamily: FONT, fontWeight: 700, letterSpacing: -1,
        }}
      >
        Global Memory Encoding
      </div>

      {/* ===== Step labels ===== */}
      <div style={{ position: "absolute", top: STEP_LABEL_Y + globalShift, width: "100%", textAlign: "center" }}>
        {steps.map((s, i) => (
          <div key={i} style={{
            position: "absolute", width: "100%", textAlign: "center",
            opacity: ci(frame, [s.start + (i === 0 ? 5 : -5), s.start + 12, s.end - 10, s.end], [0, 1, 1, 0]),
            color: COLORS.accent, fontSize: 22, fontFamily: MONO, fontWeight: 500, letterSpacing: 2,
          }}>
            {s.text}
          </div>
        ))}
      </div>

      {/* ===== Formula line ===== */}
      <div style={{ position: "absolute", top: FORMULA_Y + globalShift, width: "100%", textAlign: "center" }}>
        {formulas.map((f, i) => (
          <div key={i} style={{
            position: "absolute", width: "100%", textAlign: "center",
            opacity: ci(frame, [f.start + (i === 0 ? 8 : 5), f.start + 18, f.end - 10, f.end], [0, 1, 1, 0]),
            color: COLORS.textDim, fontSize: 20, fontFamily: MONO,
          }}>
            {f.text}
          </div>
        ))}
      </div>

      {/* ===== Blocks area ===== */}
      <div style={{ position: "absolute", top: BLOCKS_Y + globalShift, left: 0, width: 1920, height: 200 }}>
        {/* Document bracket (phase 1) */}
        <div style={{
          position: "absolute", top: -15, left: flatStartX - 20,
          width: flatTotalW + 40, height: BLOCK_H + 30,
          border: `2px solid ${COLORS.textMuted}`, borderRadius: 12, opacity: bracketOp,
        }} />
        <div style={{
          position: "absolute", top: BLOCK_H + 20, width: "100%", textAlign: "center",
          opacity: bracketOp, color: COLORS.textMuted, fontSize: 16, fontFamily: MONO,
        }}>
          N tokens
        </div>

        {/* Chunk borders (phase 3+) */}
        {Array.from({ length: CHUNK_COUNT }, (_, ci2) => {
          const chunkX = chunkedStartX + ci2 * (chunkW + CHUNK_GAP);
          const borderProgress = chunkBorderOps[ci2];
          const dimming = frame >= P4_START ? chunkDimming[ci2] : 1;
          return (
            <React.Fragment key={`chunk-${ci2}`}>
              <div style={{
                position: "absolute", top: -10, left: chunkX - 10,
                width: chunkW + 20, height: BLOCK_H + 20,
                border: `2px solid ${COLORS.chunkBorder}`, borderRadius: 10,
                opacity: borderProgress * dimming,
                transform: `scale(${interpolate(borderProgress, [0, 1], [0.95, 1])})`,
              }} />
              <div style={{
                position: "absolute", top: -28, left: chunkX + chunkW / 2 - 15,
                opacity: chunkLabelOp * dimming,
                color: COLORS.chunkBorder, fontSize: 14, fontFamily: MONO, fontWeight: 600,
              }}>
                <MathText>C</MathText><Sub>{ci2 + 1}</Sub>
              </div>
            </React.Fragment>
          );
        })}

        {/* "M chunks, L=64" label (phase 3) */}
        <div style={{
          position: "absolute", top: BLOCK_H + 20, width: "100%", textAlign: "center",
          opacity: ci(frame, [P3_START + 1 * fps, P3_START + 1.4 * fps, P4_START - 10, P4_START + 5], [0, 1, 1, 0]),
          color: COLORS.textMuted, fontSize: 16, fontFamily: MONO,
        }}>
          M chunks, each of length L = 64 tokens
        </div>

        {/* Text blocks */}
        {blockPositions.map(({ x }, i) => {
          const entrance = blockEntries[i];
          const chunkIndex = Math.floor(i / BLOCKS_PER_CHUNK);
          const dimming = frame >= P4_START ? chunkDimming[chunkIndex] : 1;
          return (
            <TextBlock key={i} style={{
              position: "absolute", top: 0, left: x,
              opacity: entrance * dimming,
              transform: `scale(${interpolate(entrance, [0, 1], [0.7, 1])})`,
            }} />
          );
        })}

        {/* Mean pooling filter (phase 4) */}
        {frame >= P4_START && (
          <div style={{
            position: "absolute", top: -25, left: filterX,
            width: chunkW + 40, height: BLOCK_H + 50,
            backgroundColor: COLORS.poolingFilter, border: `2px solid ${COLORS.poolingFilterBorder}`,
            borderRadius: 12, opacity: filterOp,
            display: "flex", justifyContent: "center", alignItems: "flex-end", paddingBottom: 4,
          }}>
            <div style={{ color: COLORS.chunkBorder, fontSize: 16, fontFamily: MONO, fontWeight: 600 }}>
              Mean Pooling
            </div>
          </div>
        )}
      </div>

      {/* ===== Phase 2: Forward Pass Projector boxes ===== */}
      {p2Visible && (
        <div style={{ position: "absolute", top: BLOCKS_Y + BLOCK_H + 50 + globalShift, width: "100%", display: "flex", justifyContent: "center", gap: 50 }}>
          {/* Backbone → K, V */}
          <div style={{ opacity: projBoxOp, transform: `scale(${projScale})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 240, height: 64,
              background: `linear-gradient(135deg, ${COLORS.keyMatrix}20, ${COLORS.valueMatrix}15)`,
              border: `2px solid ${COLORS.keyMatrix}`,
              borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: COLORS.text, fontSize: 18, fontFamily: MONO, fontWeight: 600 }}>Backbone Projections</span>
            </div>
            <div style={{ display: "flex", gap: 20, opacity: projOutputOp, transform: `scale(${projOutputScale})` }}>
              <div style={{ padding: "8px 20px", border: `2px solid ${COLORS.keyMatrix}`, borderRadius: 8, backgroundColor: `${COLORS.keyMatrix}15`, color: COLORS.keyMatrix, fontSize: 20, fontFamily: MONO, fontWeight: 700 }}>
                <MathText>K</MathText>
              </div>
              <div style={{ padding: "8px 20px", border: `2px solid ${COLORS.valueMatrix}`, borderRadius: 8, backgroundColor: `${COLORS.valueMatrix}15`, color: COLORS.valueMatrix, fontSize: 20, fontFamily: MONO, fontWeight: 700 }}>
                <MathText>V</MathText>
              </div>
            </div>
          </div>

          {/* Router K Projector → K^R */}
          <div style={{ opacity: projBoxOp, transform: `scale(${projScale})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 260, height: 64,
              background: `linear-gradient(135deg, ${COLORS.routingMatrix}20, ${COLORS.accent}10)`,
              border: `2px solid ${COLORS.routingMatrix}`,
              borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: COLORS.text, fontSize: 18, fontFamily: MONO, fontWeight: 600 }}>Router K Projector</span>
            </div>
            <div style={{ opacity: projOutputOp, transform: `scale(${projOutputScale})` }}>
              <div style={{ padding: "8px 20px", border: `2px solid ${COLORS.routingMatrix}`, borderRadius: 8, backgroundColor: `${COLORS.routingMatrix}15`, color: COLORS.routingMatrix, fontSize: 20, fontFamily: MONO, fontWeight: 700 }}>
                <MathText>K</MathText><Sup>R</Sup>
              </div>
            </div>
          </div>

          {/* Down arrows from doc */}
          <svg style={{ position: "absolute", top: -40, left: "50%", transform: "translateX(-50%)", opacity: projArrowOp }} width="40" height="40">
            <line x1="20" y1="0" x2="20" y2="30" stroke={COLORS.textMuted} strokeWidth="2" />
            <polygon points="14,26 20,38 26,26" fill={COLORS.textMuted} />
          </svg>
        </div>
      )}

      {/* ===== Down arrow to matrices (phase 4) ===== */}
      <svg style={{
        position: "absolute", top: BLOCKS_Y + globalShift + BLOCK_H + 40,
        left: 1920 / 2 - 20, opacity: arrowOp,
      }} width="40" height="80" viewBox="0 0 40 80">
        <line x1="20" y1="0" x2="20" y2="65" stroke={COLORS.textMuted} strokeWidth="2" />
        <polygon points="10,60 20,78 30,60" fill={COLORS.textMuted} />
      </svg>

      {/* ===== Output matrices (phase 4) ===== */}
      {matrices.map((mat, i) => {
        const delay = matricesDelay + i * 8;
        const matProgress = spring({ frame: frame - delay, fps, config: { damping: 15, stiffness: 120 } });
        const x = matrixStartX + i * (matrixW + matrixGap);
        const rows = 4;
        const cols = 3;
        const cellW = (matrixW - 20) / cols;
        const cellH = (matrixH - 40) / rows;
        return (
          <div key={i} style={{
            position: "absolute", top: matrixY + globalShift, left: x, width: matrixW,
            opacity: matProgress, transform: `scale(${interpolate(matProgress, [0, 1], [0.5, 1])})`,
            display: "flex", flexDirection: "column", alignItems: "center",
          }}>
            <div style={{
              width: matrixW, height: matrixH, border: `2px solid ${mat.color}`, borderRadius: 10,
              backgroundColor: `${mat.color}10`, padding: 10,
              display: "flex", flexWrap: "wrap", gap: 3, alignContent: "center", justifyContent: "center",
            }}>
              {Array.from({ length: rows * cols }, (_, ci2) => (
                <div key={ci2} style={{ width: cellW - 4, height: cellH - 4, backgroundColor: `${mat.color}30`, borderRadius: 3, border: `1px solid ${mat.color}50` }} />
              ))}
            </div>
            <div style={{ marginTop: 12, color: mat.color, fontSize: 28, fontFamily: MONO, fontWeight: 700 }}>{mat.label}</div>
            <div style={{ marginTop: 4, color: COLORS.textDim, fontSize: 14, fontFamily: MONO }}>{mat.sub}</div>
          </div>
        );
      })}

      {/* ===== "Cached to Memory Bank" label ===== */}
      <div style={{
        position: "absolute", top: matrixY + globalShift + matrixH + 80,
        width: "100%", textAlign: "center",
        opacity: cacheOp, transform: `scale(${cacheScale})`,
      }}>
        <div style={{
          display: "inline-block", backgroundColor: `${COLORS.accent}15`,
          border: `2px solid ${COLORS.accent}`, borderRadius: 14,
          padding: "12px 36px", color: COLORS.accent, fontSize: 24, fontFamily: FONT, fontWeight: 700,
        }}>
          Cached to Memory Bank
        </div>
        <div style={{ color: COLORS.textDim, fontSize: 18, fontFamily: MONO, marginTop: 10 }}>
          One-time offline pre-computation — ready for high-speed retrieval
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --- Footprint Scene ---
const FootprintScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const matrices: { label: React.ReactNode; sub: string; color: string }[] = [
    { label: <KBar />, sub: "Compressed Keys", color: COLORS.keyMatrix },
    { label: <VBar />, sub: "Compressed Values", color: COLORS.valueMatrix },
    { label: <KBarR />, sub: "Routing Keys", color: COLORS.routingMatrix },
  ];

  const matrixW = 160; const matrixH = 120; const matrixGap = 80;
  const matrixTotalW = matrices.length * matrixW + (matrices.length - 1) * matrixGap;
  const matrixStartX = (1920 - matrixTotalW) / 2;
  const matrixY = 240;

  const barDelay = 0.5 * fps;
  const originalBarW = interpolate(frame, [barDelay, barDelay + 0.8 * fps], [0, 700], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  const compressedBarW = interpolate(frame, [barDelay + 0.4 * fps, barDelay + 1.2 * fps], [0, 140], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  const reductionOp = ci(frame, [2 * fps, 2.5 * fps], [0, 1]);
  const reductionScale = spring({ frame: frame - 2 * fps, fps, config: { damping: 12 } });
  const beforeInfOp = ci(frame, [3 * fps, 3.5 * fps], [0, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <div style={{ position: "absolute", top: TITLE_Y, width: "100%", textAlign: "center", color: COLORS.text, fontSize: 48, fontFamily: FONT, fontWeight: 700, letterSpacing: -1 }}>
        Global Memory Encoding
      </div>

      {matrices.map((mat, i) => {
        const x = matrixStartX + i * (matrixW + matrixGap);
        const rows = 4; const cols = 3;
        const cellW = (matrixW - 20) / cols;
        const cellH = (matrixH - 40) / rows;
        return (
          <div key={i} style={{ position: "absolute", top: matrixY, left: x, width: matrixW, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: matrixW, height: matrixH, border: `2px solid ${mat.color}`, borderRadius: 10, backgroundColor: `${mat.color}10`, padding: 10, display: "flex", flexWrap: "wrap", gap: 3, alignContent: "center", justifyContent: "center" }}>
              {Array.from({ length: rows * cols }, (_, ci2) => (
                <div key={ci2} style={{ width: cellW - 4, height: cellH - 4, backgroundColor: `${mat.color}30`, borderRadius: 3, border: `1px solid ${mat.color}50` }} />
              ))}
            </div>
            <div style={{ marginTop: 12, color: mat.color, fontSize: 28, fontFamily: MONO, fontWeight: 700 }}>{mat.label}</div>
            <div style={{ marginTop: 4, color: COLORS.textDim, fontSize: 14, fontFamily: MONO }}>{mat.sub}</div>
          </div>
        );
      })}

      <div style={{ position: "absolute", top: 560, left: 300 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
          <div style={{ width: 140, color: COLORS.textDim, fontSize: 16, fontFamily: MONO, textAlign: "right", marginRight: 16 }}>Original KV</div>
          <div style={{ width: originalBarW, height: 36, backgroundColor: "#ef444440", border: "1px solid #ef4444", borderRadius: 6 }} />
          <div style={{ marginLeft: 12, color: "#ef4444", fontSize: 16, fontFamily: MONO, opacity: originalBarW > 600 ? 1 : 0 }}>
            <MathText style={{ fontStyle: "normal" }}>N</MathText> &times; <MathText style={{ fontStyle: "normal" }}>d</MathText>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: 140, color: COLORS.textDim, fontSize: 16, fontFamily: MONO, textAlign: "right", marginRight: 16 }}>Compressed</div>
          <div style={{ width: compressedBarW, height: 36, backgroundColor: "#10b98140", border: "1px solid #10b981", borderRadius: 6 }} />
          <div style={{ marginLeft: 12, color: "#10b981", fontSize: 16, fontFamily: MONO, opacity: compressedBarW > 100 ? 1 : 0 }}>
            <MathText style={{ fontStyle: "normal" }}>M</MathText> &times; <MathText style={{ fontStyle: "normal" }}>d</MathText>
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", top: 680, width: "100%", textAlign: "center", opacity: reductionOp, transform: `scale(${reductionScale})` }}>
        <div style={{ display: "inline-block", backgroundColor: "#10b98120", border: "2px solid #10b981", borderRadius: 16, padding: "14px 40px", color: "#10b981", fontSize: 32, fontFamily: FONT, fontWeight: 700 }}>
          ~<MathText>L</MathText>&times; Reduction in Memory
        </div>
      </div>

      <div style={{ position: "absolute", top: 770, width: "100%", textAlign: "center", opacity: beforeInfOp, color: COLORS.textMuted, fontSize: 20, fontFamily: MONO }}>
        Computed once, before inference begins
      </div>
    </AbsoluteFill>
  );
};

// --- Main ---
export const GlobalMemoryEncoding: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <Sequence from={0} durationInFrames={17 * fps} premountFor={fps}>
        <EncodingScene />
      </Sequence>
      <Sequence from={17 * fps} durationInFrames={7 * fps} premountFor={fps}>
        <FootprintScene />
      </Sequence>
    </AbsoluteFill>
  );
};
