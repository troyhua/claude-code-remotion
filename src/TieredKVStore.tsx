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

// --- Shared design tokens ---
const COLORS = {
  bg: "#0f1117",
  text: "#e2e8f0",
  textDim: "#94a3b8",
  textMuted: "#64748b",
  accent: "#6366f1",
  keyMatrix: "#3b82f6",
  valueMatrix: "#10b981",
  routingMatrix: "#f59e0b",
  gpuBg: "#1a1033",
  gpuBorder: "#a855f7",
  gpuGlow: "rgba(168, 85, 247, 0.15)",
  cpuBg: "#0f1d2d",
  cpuBorder: "#0ea5e9",
  cpuGlow: "rgba(14, 165, 233, 0.08)",
};

const FONT = "SF Pro Display, Inter, Helvetica Neue, Arial, sans-serif";
const MONO = "SF Mono, Fira Code, Consolas, monospace";
const MATH = "Times New Roman, Georgia, serif";

// --- Math helpers (same as Scene 1) ---
const Overline: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ textDecoration: "overline", textDecorationThickness: "2px" }}>
    {children}
  </span>
);
const Sup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ fontSize: "0.65em", verticalAlign: "super" }}>{children}</span>
);
const MathText: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <span style={{ fontFamily: MATH, fontStyle: "italic", ...style }}>
    {children}
  </span>
);
const KBar = () => (
  <MathText>
    <Overline>K</Overline>
  </MathText>
);
const VBar = () => (
  <MathText>
    <Overline>V</Overline>
  </MathText>
);
const KBarR = () => (
  <MathText>
    <Overline>K</Overline>
    <Sup>R</Sup>
  </MathText>
);

// --- Matrix visual component ---
const MatrixBox: React.FC<{
  label: React.ReactNode;
  sub: string;
  color: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}> = ({ label, sub, color, width = 140, height = 100, style }) => {
  const rows = 4;
  const cols = 3;
  const cellW = (width - 20) / cols;
  const cellH = (height - 40) / rows;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        ...style,
      }}
    >
      <div
        style={{
          width,
          height,
          border: `2px solid ${color}`,
          borderRadius: 10,
          backgroundColor: `${color}10`,
          padding: 10,
          display: "flex",
          flexWrap: "wrap",
          gap: 3,
          alignContent: "center",
          justifyContent: "center",
        }}
      >
        {Array.from({ length: rows * cols }, (_, i) => (
          <div
            key={i}
            style={{
              width: cellW - 4,
              height: cellH - 4,
              backgroundColor: `${color}30`,
              borderRadius: 3,
              border: `1px solid ${color}50`,
            }}
          />
        ))}
      </div>
      <div
        style={{
          marginTop: 10,
          color,
          fontSize: 24,
          fontFamily: MONO,
          fontWeight: 700,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 3,
          color: COLORS.textDim,
          fontSize: 13,
          fontFamily: MONO,
        }}
      >
        {sub}
      </div>
    </div>
  );
};

// --- Animated glow pulse ---
const useGlowPulse = (
  frame: number,
  fps: number,
  baseIntensity: number,
  amplitude: number
) => {
  const cycle = interpolate(frame % (2 * fps), [0, fps, 2 * fps], [0, 1, 0]);
  return baseIntensity + amplitude * cycle;
};

// --- Main scene ---
// Timeline:
//   0-2s:   Title + step label appear, split-screen zones fade in
//   2-4s:   Three matrices appear in center (from Scene 1)
//   4-6.5s: K̄ᴿ moves into GPU VRAM
//   6.5-9s: K̄ and V̄ move into CPU DRAM
//   9-12s:  Explanation text + "100M tokens" callout
const TieredKVStoreScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const glowPulse = useGlowPulse(frame, fps, 0.6, 0.4);

  // --- Layout ---
  // Zones pushed to edges, leaving clear center for matrices
  const GPU_X = 60;
  const GPU_W = 460;
  const CPU_X = 1400;
  const CPU_W = 460;
  const ZONE_Y = 200;
  const ZONE_H = 580;

  // Center staging area for matrices (wide gap between zones)
  const CENTER_X = 960;
  const CENTER_Y = 350;
  const MATRIX_GAP = 180;

  // Target positions inside zones
  const GPU_TARGET_X = GPU_X + GPU_W / 2;
  const GPU_TARGET_Y = ZONE_Y + ZONE_H / 2 + 20;
  const CPU_KV_Y = ZONE_Y + ZONE_H / 2;
  const CPU_K_TARGET_X = CPU_X + CPU_W / 2 - 90;
  const CPU_V_TARGET_X = CPU_X + CPU_W / 2 + 90;

  // --- Animations ---

  // Title
  const titleOpacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, 0.5 * fps], [-20, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Step label
  const stepOpacity = interpolate(frame, [0.3 * fps, 0.6 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Zone appearance
  const zoneProgress = interpolate(
    frame,
    [0.5 * fps, 1.5 * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) }
  );

  // Zone labels
  const zoneLabelOpacity = interpolate(
    frame,
    [1 * fps, 1.5 * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Matrices appear in center (2-3s)
  const matricesAppear = spring({
    frame: frame - 2 * fps,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  // K̄ᴿ moves to GPU (4-5.5s)
  const routingMoveProgress = interpolate(
    frame,
    [4 * fps, 5.5 * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) }
  );

  // K̄, V̄ move to CPU (6.5-8s)
  const kvMoveProgress = interpolate(
    frame,
    [6.5 * fps, 8 * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) }
  );

  // Compute matrix positions
  // Starting positions (center, side by side)
  const kStartX = CENTER_X - MATRIX_GAP;
  const vStartX = CENTER_X;
  const rStartX = CENTER_X + MATRIX_GAP;
  const startY = CENTER_Y;

  // K̄ᴿ position
  const routingX = interpolate(routingMoveProgress, [0, 1], [rStartX, GPU_TARGET_X]);
  const routingY = interpolate(routingMoveProgress, [0, 1], [startY, GPU_TARGET_Y]);

  // K̄ position
  const keyX = interpolate(kvMoveProgress, [0, 1], [kStartX, CPU_K_TARGET_X]);
  const keyY = interpolate(kvMoveProgress, [0, 1], [startY, CPU_KV_Y]);

  // V̄ position
  const valX = interpolate(kvMoveProgress, [0, 1], [vStartX, CPU_V_TARGET_X]);
  const valY = interpolate(kvMoveProgress, [0, 1], [startY, CPU_KV_Y]);

  // Trail particle effect during movement
  const routingMoving = frame >= 4 * fps && frame <= 5.5 * fps;
  const kvMoving = frame >= 6.5 * fps && frame <= 8 * fps;

  // GPU glow intensifies when routing key arrives
  const gpuGlowIntensity = interpolate(
    routingMoveProgress,
    [0.8, 1],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // "Low-latency" label appears after routing key lands
  const gpuLabelOpacity = interpolate(
    frame,
    [5.5 * fps, 6 * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // "Offloaded" label appears after KV lands
  const cpuLabelOpacity = interpolate(
    frame,
    [8 * fps, 8.5 * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Explanation text (9-12s)
  const explainOpacity = interpolate(
    frame,
    [9 * fps, 9.5 * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const tokenCalloutScale = spring({
    frame: frame - 10 * fps,
    fps,
    config: { damping: 12 },
  });
  const tokenCalloutOpacity = interpolate(
    frame,
    [10 * fps, 10.3 * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {/* ===== Title ===== */}
      <div
        style={{
          position: "absolute",
          top: 45,
          width: "100%",
          textAlign: "center",
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          color: COLORS.text,
          fontSize: 48,
          fontFamily: FONT,
          fontWeight: 700,
          letterSpacing: -1,
        }}
      >
        Tiered KV Store
      </div>

      {/* Step label */}
      <div
        style={{
          position: "absolute",
          top: 110,
          width: "100%",
          textAlign: "center",
          opacity: stepOpacity,
          color: COLORS.accent,
          fontSize: 22,
          fontFamily: MONO,
          fontWeight: 500,
          letterSpacing: 2,
        }}
      >
        MEMORY PARALLELISM
      </div>

      {/* ===== GPU VRAM Zone ===== */}
      <div
        style={{
          position: "absolute",
          top: ZONE_Y,
          left: GPU_X,
          width: GPU_W,
          height: ZONE_H,
          backgroundColor: COLORS.gpuBg,
          border: `2px solid ${COLORS.gpuBorder}`,
          borderRadius: 16,
          opacity: zoneProgress,
          transform: `scale(${interpolate(zoneProgress, [0, 1], [0.95, 1])})`,
          boxShadow: `inset 0 0 ${60 + 40 * gpuGlowIntensity}px ${COLORS.gpuGlow}, 0 0 ${20 + 30 * gpuGlowIntensity}px ${COLORS.gpuGlow}`,
        }}
      >
        {/* GPU header */}
        <div
          style={{
            position: "absolute",
            top: 20,
            width: "100%",
            textAlign: "center",
            opacity: zoneLabelOpacity,
          }}
        >
          <div
            style={{
              color: COLORS.gpuBorder,
              fontSize: 28,
              fontFamily: FONT,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            GPU VRAM
          </div>
          <div
            style={{
              color: `${COLORS.gpuBorder}99`,
              fontSize: 14,
              fontFamily: MONO,
              marginTop: 4,
            }}
          >
            Fast • Limited Capacity
          </div>
        </div>

        {/* GPU status indicator */}
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: COLORS.gpuBorder,
            opacity: zoneLabelOpacity * glowPulse,
            boxShadow: `0 0 8px ${COLORS.gpuBorder}`,
          }}
        />

        {/* "Low-latency retrieval" label */}
        <div
          style={{
            position: "absolute",
            bottom: 30,
            width: "100%",
            textAlign: "center",
            opacity: gpuLabelOpacity,
          }}
        >
          <div
            style={{
              display: "inline-block",
              backgroundColor: `${COLORS.gpuBorder}15`,
              border: `1px solid ${COLORS.gpuBorder}40`,
              borderRadius: 8,
              padding: "8px 20px",
              color: COLORS.gpuBorder,
              fontSize: 14,
              fontFamily: MONO,
              fontWeight: 600,
            }}
          >
            Low-latency retrieval ready
          </div>
          <div style={{ marginTop: 6, color: COLORS.gpuBorder, fontSize: 13, fontFamily: MONO, opacity: gpuLabelOpacity }}>
            ~56 GB for 100M context
          </div>
        </div>
      </div>

      {/* ===== CPU DRAM Zone ===== */}
      <div
        style={{
          position: "absolute",
          top: ZONE_Y,
          left: CPU_X,
          width: CPU_W,
          height: ZONE_H,
          backgroundColor: COLORS.cpuBg,
          border: `2px solid ${COLORS.cpuBorder}`,
          borderRadius: 16,
          opacity: zoneProgress,
          transform: `scale(${interpolate(zoneProgress, [0, 1], [0.95, 1])})`,
          boxShadow: `inset 0 0 40px ${COLORS.cpuGlow}`,
        }}
      >
        {/* CPU header */}
        <div
          style={{
            position: "absolute",
            top: 20,
            width: "100%",
            textAlign: "center",
            opacity: zoneLabelOpacity,
          }}
        >
          <div
            style={{
              color: COLORS.cpuBorder,
              fontSize: 28,
              fontFamily: FONT,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            CPU Host DRAM
          </div>
          <div
            style={{
              color: `${COLORS.cpuBorder}99`,
              fontSize: 14,
              fontFamily: MONO,
              marginTop: 4,
            }}
          >
            Large Capacity • Offloaded
          </div>
        </div>

        {/* CPU capacity indicator */}
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: COLORS.cpuBorder,
            opacity: zoneLabelOpacity * 0.7,
          }}
        />

        {/* "Offloaded" label */}
        <div
          style={{
            position: "absolute",
            bottom: 30,
            width: "100%",
            textAlign: "center",
            opacity: cpuLabelOpacity,
          }}
        >
          <div
            style={{
              display: "inline-block",
              backgroundColor: `${COLORS.cpuBorder}15`,
              border: `1px solid ${COLORS.cpuBorder}40`,
              borderRadius: 8,
              padding: "8px 20px",
              color: COLORS.cpuBorder,
              fontSize: 14,
              fontFamily: MONO,
              fontWeight: 600,
            }}
          >
            Bulk storage offloaded
          </div>
        </div>
      </div>

      {/* ===== Connector between zones ===== */}
      {(() => {
        const connW = CPU_X - (GPU_X + GPU_W);
        const connH = 80;
        const midY = ZONE_Y + ZONE_H - 80;
        return (
          <svg
            style={{
              position: "absolute",
              top: midY - connH / 2,
              left: GPU_X + GPU_W,
              opacity: zoneLabelOpacity,
            }}
            width={connW}
            height={connH}
          >
            {/* Double dashed lines */}
            <line
              x1="20" y1={connH / 2 - 6}
              x2={connW - 20} y2={connH / 2 - 6}
              stroke={COLORS.textDim}
              strokeWidth="2"
              strokeDasharray="12 6"
            />
            <line
              x1="20" y1={connH / 2 + 6}
              x2={connW - 20} y2={connH / 2 + 6}
              stroke={COLORS.textDim}
              strokeWidth="2"
              strokeDasharray="12 6"
            />
            {/* Arrowheads on both ends */}
            <polygon
              points={`25,${connH / 2 - 14} 15,${connH / 2} 25,${connH / 2 + 14}`}
              fill={COLORS.textDim}
            />
            <polygon
              points={`${connW - 25},${connH / 2 - 14} ${connW - 15},${connH / 2} ${connW - 25},${connH / 2 + 14}`}
              fill={COLORS.textDim}
            />
            {/* Label with background */}
            <rect
              x={connW / 2 - 70} y={connH / 2 - 14}
              width={140} height={28}
              rx={6}
              fill={COLORS.bg}
            />
            <text
              x={connW / 2}
              y={connH / 2 + 5}
              fill={COLORS.textDim}
              fontSize="16"
              fontFamily={MONO}
              fontWeight="600"
              textAnchor="middle"
            >
              PCIe / NVLink
            </text>
          </svg>
        );
      })()}

      {/* ===== Moving trail particles ===== */}
      {routingMoving &&
        Array.from({ length: 5 }, (_, i) => {
          const trailDelay = i * 0.05;
          const trailProgress = Math.max(0, routingMoveProgress - trailDelay);
          const tx = interpolate(trailProgress, [0, 1], [rStartX, GPU_TARGET_X]);
          const ty = interpolate(trailProgress, [0, 1], [startY, GPU_TARGET_Y]);
          return (
            <div
              key={`r-trail-${i}`}
              style={{
                position: "absolute",
                top: ty + 50,
                left: tx - 4,
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: COLORS.routingMatrix,
                opacity: 0.3 - i * 0.05,
                filter: "blur(2px)",
              }}
            />
          );
        })}
      {kvMoving &&
        Array.from({ length: 5 }, (_, i) => {
          const trailDelay = i * 0.05;
          const trailProgress = Math.max(0, kvMoveProgress - trailDelay);
          const tx1 = interpolate(trailProgress, [0, 1], [kStartX, CPU_K_TARGET_X]);
          const ty1 = interpolate(trailProgress, [0, 1], [startY, CPU_KV_Y]);
          const tx2 = interpolate(trailProgress, [0, 1], [vStartX, CPU_V_TARGET_X]);
          const ty2 = interpolate(trailProgress, [0, 1], [startY, CPU_KV_Y]);
          return (
            <React.Fragment key={`kv-trail-${i}`}>
              <div
                style={{
                  position: "absolute",
                  top: ty1 + 50,
                  left: tx1 - 4,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: COLORS.keyMatrix,
                  opacity: 0.3 - i * 0.05,
                  filter: "blur(2px)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: ty2 + 50,
                  left: tx2 - 4,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: COLORS.valueMatrix,
                  opacity: 0.3 - i * 0.05,
                  filter: "blur(2px)",
                }}
              />
            </React.Fragment>
          );
        })}

      {/* ===== Matrix: K̄ (moves to CPU) ===== */}
      <div
        style={{
          position: "absolute",
          top: keyY,
          left: keyX - 70,
          opacity: matricesAppear,
          transform: `scale(${interpolate(matricesAppear, [0, 1], [0.5, 1])})`,
        }}
      >
        <MatrixBox
          label={<KBar />}
          sub="Compressed Keys"
          color={COLORS.keyMatrix}
        />
      </div>

      {/* ===== Matrix: V̄ (moves to CPU) ===== */}
      <div
        style={{
          position: "absolute",
          top: valY,
          left: valX - 70,
          opacity: matricesAppear,
          transform: `scale(${interpolate(matricesAppear, [0, 1], [0.5, 1])})`,
        }}
      >
        <MatrixBox
          label={<VBar />}
          sub="Compressed Values"
          color={COLORS.valueMatrix}
        />
      </div>

      {/* ===== Matrix: K̄ᴿ (moves to GPU) ===== */}
      <div
        style={{
          position: "absolute",
          top: routingY,
          left: routingX - 70,
          opacity: matricesAppear,
          transform: `scale(${interpolate(matricesAppear, [0, 1], [0.5, 1])})`,
        }}
      >
        <MatrixBox
          label={<KBarR />}
          sub="Routing Keys"
          color={COLORS.routingMatrix}
        />
      </div>

      {/* ===== "From Scene 1" label ===== */}
      <div
        style={{
          position: "absolute",
          top: CENTER_Y - 50,
          width: "100%",
          textAlign: "center",
          opacity: interpolate(
            frame,
            [2 * fps, 2.5 * fps, 3.5 * fps, 4 * fps],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          ),
          color: COLORS.textMuted,
          fontSize: 16,
          fontFamily: MONO,
        }}
      >
        Compressed matrices from Global Memory Encoding
      </div>

      {/* ===== Explanation text ===== */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          width: "100%",
          textAlign: "center",
          opacity: explainOpacity,
        }}
      >
        <div
          style={{
            color: COLORS.textDim,
            fontSize: 20,
            fontFamily: FONT,
            fontWeight: 400,
            lineHeight: 1.6,
          }}
        >
          Memory capacity is decoupled from GPU VRAM limits
        </div>
      </div>

      {/* ===== "100M tokens" callout ===== */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          width: "100%",
          textAlign: "center",
          opacity: tokenCalloutOpacity,
          transform: `scale(${tokenCalloutScale})`,
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: "linear-gradient(135deg, #6366f120, #a855f720)",
            border: "2px solid #a855f7",
            borderRadius: 16,
            padding: "12px 36px",
            color: "#a855f7",
            fontSize: 28,
            fontFamily: FONT,
            fontWeight: 700,
          }}
        >
          Store up to 100M+ tokens
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --- Bottleneck Scene: 169GB vs 160GB ---
const BottleneckScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ci = (ir: [number, number], or: [number, number]) =>
    interpolate(frame, ir, or, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const titleOp = ci([0, 0.5 * fps], [0, 1]);

  // Bar chart
  const barDelay = 0.8 * fps;
  const requiredW = interpolate(frame, [barDelay, barDelay + 1 * fps], [0, 680], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad),
  });
  const availableW = interpolate(frame, [barDelay + 0.3 * fps, barDelay + 1.3 * fps], [0, 640], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad),
  });

  const exclaimOp = ci([2.5 * fps, 3 * fps], [0, 1]);
  const exclaimScale = spring({ frame: frame - 2.5 * fps, fps, config: { damping: 12 } });

  // Insight text
  const insightOp = ci([3.5 * fps, 4 * fps], [0, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {/* Title */}
      <div style={{ position: "absolute", top: 45, width: "100%", textAlign: "center", opacity: titleOp, color: COLORS.text, fontSize: 48, fontFamily: FONT, fontWeight: 700, letterSpacing: -1 }}>
        Tiered KV Store
      </div>
      <div style={{ position: "absolute", top: 110, width: "100%", textAlign: "center", opacity: titleOp, color: COLORS.accent, fontSize: 22, fontFamily: MONO, fontWeight: 500, letterSpacing: 2 }}>
        THE HARDWARE BOTTLENECK
      </div>

      {/* Bar comparison */}
      <div style={{ position: "absolute", top: 260, left: 280 }}>
        {/* Required */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
          <div style={{ width: 220, color: COLORS.textDim, fontSize: 18, fontFamily: MONO, textAlign: "right", marginRight: 20 }}>
            100M token cache
          </div>
          <div style={{ width: requiredW, height: 48, backgroundColor: "#ef444430", border: "2px solid #ef4444", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 16 }}>
            {requiredW > 500 && <span style={{ color: "#ef4444", fontSize: 22, fontFamily: MONO, fontWeight: 700 }}>~169 GB</span>}
          </div>
        </div>
        {/* Available */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: 220, color: COLORS.textDim, fontSize: 18, fontFamily: MONO, textAlign: "right", marginRight: 20 }}>
            2&times;A800 VRAM
          </div>
          <div style={{ width: availableW, height: 48, backgroundColor: "#10b98130", border: "2px solid #10b981", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 16 }}>
            {availableW > 450 && <span style={{ color: "#10b981", fontSize: 22, fontFamily: MONO, fontWeight: 700 }}>160 GB</span>}
          </div>
        </div>
      </div>

      {/* "Exceeds!" badge */}
      <div style={{ position: "absolute", top: 420, width: "100%", textAlign: "center", opacity: exclaimOp, transform: `scale(${exclaimScale})` }}>
        <div style={{ display: "inline-block", backgroundColor: "#ef444418", border: "2px solid #ef4444", borderRadius: 14, padding: "12px 36px", color: "#ef4444", fontSize: 26, fontFamily: FONT, fontWeight: 700 }}>
          Monolithic storage physically impossible!
        </div>
      </div>

      {/* Key insight */}
      <div style={{ position: "absolute", top: 540, left: 200, right: 200, opacity: insightOp }}>
        <div style={{ backgroundColor: `${COLORS.accent}10`, border: `2px solid ${COLORS.accent}40`, borderRadius: 14, padding: "20px 36px" }}>
          <div style={{ color: COLORS.accent, fontSize: 22, fontFamily: FONT, fontWeight: 700, marginBottom: 10 }}>
            Key Insight
          </div>
          <div style={{ color: COLORS.textDim, fontSize: 18, fontFamily: MONO, lineHeight: 1.6 }}>
            Routing only needs <MathText><Overline>K</Overline></MathText><Sup>R</Sup> (~56 GB for 100M tokens).
            Content <MathText><Overline>K</Overline></MathText>, <MathText><Overline>V</Overline></MathText> are only fetched <em>if</em> a document is selected.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --- Main composition ---
export const TieredKVStore: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {/* Phase 1: Hardware bottleneck (0-6s) */}
      <Sequence from={0} durationInFrames={6 * fps} premountFor={fps}>
        <BottleneckScene />
      </Sequence>
      {/* Phase 2: Tiered storage (6-18s) */}
      <Sequence from={6 * fps} durationInFrames={12 * fps} premountFor={fps}>
        <TieredKVStoreScene />
      </Sequence>
    </AbsoluteFill>
  );
};
