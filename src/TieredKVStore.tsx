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
//   0-2s:   Title + zones appear (2 GPUs + CPU DRAM)
//   2-4s:   Three matrices appear in center
//   4-6s:   K̄ᴿ splits and moves into both GPUs (distributed)
//   6.5-8s: K̄ and V̄ move to CPU DRAM
//   8-12s:  Explanation text + "100M tokens" callout
const TieredKVStoreScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const glowPulse = useGlowPulse(frame, fps, 0.6, 0.4);

  const ci = (ir: [number, number], or: [number, number]) =>
    interpolate(frame, ir, or, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // --- Layout: 2 GPUs on left, CPU on right ---
  const GPU0_X = 60;
  const GPU1_X = 60;
  const GPU_W = 380;
  const GPU0_Y = 190;
  const GPU1_Y = 530;
  const GPU_H = 280;

  const CPU_X = 1380;
  const CPU_W = 480;
  const CPU_Y = 190;
  const CPU_H = 620;

  // Center staging area for matrices
  const CENTER_X = 880;
  const CENTER_Y = 380;
  const MATRIX_GAP = 170;

  // Target positions inside GPU zones
  const GPU0_TARGET_X = GPU0_X + GPU_W / 2;
  const GPU0_TARGET_Y = GPU0_Y + GPU_H / 2 + 10;
  const GPU1_TARGET_X = GPU1_X + GPU_W / 2;
  const GPU1_TARGET_Y = GPU1_Y + GPU_H / 2 + 10;

  // CPU targets
  const CPU_KV_Y = CPU_Y + CPU_H / 2;
  const CPU_K_TARGET_X = CPU_X + CPU_W / 2 - 80;
  const CPU_V_TARGET_X = CPU_X + CPU_W / 2 + 80;

  // --- Animations ---
  const titleOp = ci([0, 0.5 * fps], [0, 1]);
  const titleY2 = interpolate(frame, [0, 0.5 * fps], [-20, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  const stepOp = ci([0.3 * fps, 0.6 * fps], [0, 1]);
  const zoneProgress = ci([0.5 * fps, 1.5 * fps], [0, 1]);
  const zoneLabelOp = ci([1 * fps, 1.5 * fps], [0, 1]);

  const matricesAppear = spring({ frame: frame - 2 * fps, fps, config: { damping: 15, stiffness: 120 } });

  // K̄ᴿ splits: one copy to GPU0, one to GPU1 (4-5.5s)
  const routingMoveP = ci([4 * fps, 5.5 * fps], [0, 1]);
  // K̄ᴿ starts as one, splits into two at ~50% progress
  const splitVisible = routingMoveP > 0.1;

  // K̄, V̄ move to CPU (6.5-8s)
  const kvMoveP = ci([6.5 * fps, 8 * fps], [0, 1]);

  // Starting positions
  const kStartX = CENTER_X - MATRIX_GAP;
  const vStartX = CENTER_X;
  const rStartX = CENTER_X + MATRIX_GAP;
  const startY = CENTER_Y;

  // K̄ᴿ copy 0 → GPU0
  const r0X = interpolate(routingMoveP, [0, 1], [rStartX, GPU0_TARGET_X]);
  const r0Y = interpolate(routingMoveP, [0, 1], [startY, GPU0_TARGET_Y]);
  // K̄ᴿ copy 1 → GPU1
  const r1X = interpolate(routingMoveP, [0, 1], [rStartX, GPU1_TARGET_X]);
  const r1Y = interpolate(routingMoveP, [0, 1], [startY, GPU1_TARGET_Y]);

  // K̄ → CPU
  const keyX = interpolate(kvMoveP, [0, 1], [kStartX, CPU_K_TARGET_X]);
  const keyY2 = interpolate(kvMoveP, [0, 1], [startY, CPU_KV_Y]);
  // V̄ → CPU
  const valX = interpolate(kvMoveP, [0, 1], [vStartX, CPU_V_TARGET_X]);
  const valY = interpolate(kvMoveP, [0, 1], [startY, CPU_KV_Y]);

  const gpuGlow = ci([5, 5.5 * fps], [0, 1]);
  const gpuLabelOp = ci([5.5 * fps, 6 * fps], [0, 1]);
  const cpuLabelOp = ci([8 * fps, 8.5 * fps], [0, 1]);
  const explainOp = ci([9 * fps, 9.5 * fps], [0, 1]);
  const calloutOp = ci([10 * fps, 10.3 * fps], [0, 1]);
  const calloutScale = spring({ frame: frame - 10 * fps, fps, config: { damping: 12 } });

  // GPU card component
  const GpuCard: React.FC<{ id: number; x: number; y: number }> = ({ id, x, y }) => (
    <div style={{
      position: "absolute", top: y, left: x, width: GPU_W, height: GPU_H,
      backgroundColor: COLORS.gpuBg, border: `2px solid ${COLORS.gpuBorder}`, borderRadius: 14,
      opacity: zoneProgress, transform: `scale(${interpolate(zoneProgress, [0, 1], [0.95, 1])})`,
      boxShadow: `inset 0 0 ${40 + 30 * gpuGlow}px ${COLORS.gpuGlow}, 0 0 ${10 + 20 * gpuGlow}px ${COLORS.gpuGlow}`,
    }}>
      <div style={{ position: "absolute", top: 14, left: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: COLORS.gpuBorder, opacity: zoneLabelOp * glowPulse, boxShadow: `0 0 6px ${COLORS.gpuBorder}` }} />
        <span style={{ color: COLORS.gpuBorder, fontSize: 20, fontFamily: MONO, fontWeight: 600 }}>
          GPU {id} VRAM
        </span>
      </div>
      <div style={{ position: "absolute", top: 14, right: 14, opacity: zoneLabelOp }}>
        <span style={{ color: `${COLORS.gpuBorder}80`, fontSize: 14, fontFamily: MONO }}>Shard {id}</span>
      </div>
      {/* Bottom label */}
      <div style={{ position: "absolute", bottom: 14, width: "100%", textAlign: "center", opacity: gpuLabelOp }}>
        <span style={{ color: COLORS.gpuBorder, fontSize: 14, fontFamily: MONO, fontWeight: 600 }}>
          <MathText><Overline>K</Overline></MathText><Sup>R</Sup> shard {id}
        </span>
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {/* Title */}
      <div style={{ position: "absolute", top: 45, width: "100%", textAlign: "center", opacity: titleOp, transform: `translateY(${titleY2}px)`, color: COLORS.text, fontSize: 48, fontFamily: FONT, fontWeight: 700, letterSpacing: -1 }}>
        Tiered KV Store
      </div>
      <div style={{ position: "absolute", top: 110, width: "100%", textAlign: "center", opacity: stepOp, color: COLORS.accent, fontSize: 22, fontFamily: MONO, fontWeight: 500, letterSpacing: 2 }}>
        MEMORY PARALLELISM
      </div>

      {/* GPU 0 */}
      <GpuCard id={0} x={GPU0_X} y={GPU0_Y} />
      {/* GPU 1 */}
      <GpuCard id={1} x={GPU1_X} y={GPU1_Y} />

      {/* "Distributed across GPUs" label */}
      <div style={{ position: "absolute", top: GPU0_Y + GPU_H + 8, left: GPU0_X, width: GPU_W, textAlign: "center", opacity: gpuLabelOp }}>
        <span style={{ color: COLORS.gpuBorder, fontSize: 16, fontFamily: MONO, fontWeight: 600 }}>
          ~56 GB distributed across GPUs
        </span>
      </div>

      {/* CPU DRAM */}
      <div style={{
        position: "absolute", top: CPU_Y, left: CPU_X, width: CPU_W, height: CPU_H,
        backgroundColor: COLORS.cpuBg, border: `2px solid ${COLORS.cpuBorder}`, borderRadius: 16,
        opacity: zoneProgress, transform: `scale(${interpolate(zoneProgress, [0, 1], [0.95, 1])})`,
        boxShadow: `inset 0 0 40px ${COLORS.cpuGlow}`,
      }}>
        <div style={{ position: "absolute", top: 20, width: "100%", textAlign: "center", opacity: zoneLabelOp }}>
          <div style={{ color: COLORS.cpuBorder, fontSize: 28, fontFamily: FONT, fontWeight: 700 }}>CPU Host DRAM</div>
          <div style={{ color: `${COLORS.cpuBorder}99`, fontSize: 14, fontFamily: MONO, marginTop: 4 }}>Large Capacity • Offloaded</div>
        </div>
        <div style={{ position: "absolute", top: 16, right: 16, width: 10, height: 10, borderRadius: "50%", backgroundColor: COLORS.cpuBorder, opacity: zoneLabelOp * 0.7 }} />
        <div style={{ position: "absolute", bottom: 30, width: "100%", textAlign: "center", opacity: cpuLabelOp }}>
          <div style={{ display: "inline-block", backgroundColor: `${COLORS.cpuBorder}15`, border: `1px solid ${COLORS.cpuBorder}40`, borderRadius: 8, padding: "8px 20px", color: COLORS.cpuBorder, fontSize: 14, fontFamily: MONO, fontWeight: 600 }}>
            Bulk content offloaded
          </div>
        </div>
      </div>

      {/* Connector */}
      {(() => {
        const connLeft = GPU0_X + GPU_W + 10;
        const connRight = CPU_X - 10;
        const connW = connRight - connLeft;
        const midY2 = CPU_Y + CPU_H - 60;
        return (
          <svg style={{ position: "absolute", top: midY2 - 20, left: connLeft, opacity: zoneLabelOp }} width={connW} height={40}>
            <line x1="10" y1="14" x2={connW - 10} y2="14" stroke={COLORS.textDim} strokeWidth="2" strokeDasharray="10 5" />
            <line x1="10" y1="26" x2={connW - 10} y2="26" stroke={COLORS.textDim} strokeWidth="2" strokeDasharray="10 5" />
            <polygon points={`14,6 4,20 14,34`} fill={COLORS.textDim} />
            <polygon points={`${connW - 14},6 ${connW - 4},20 ${connW - 14},34`} fill={COLORS.textDim} />
            <rect x={connW / 2 - 60} y={6} width={120} height={28} rx={6} fill={COLORS.bg} />
            <text x={connW / 2} y={25} fill={COLORS.textDim} fontSize="14" fontFamily={MONO} fontWeight="600" textAnchor="middle">PCIe / NVLink</text>
          </svg>
        );
      })()}

      {/* Matrix: K̄ (moves to CPU) */}
      <div style={{ position: "absolute", top: keyY2, left: keyX - 70, opacity: matricesAppear, transform: `scale(${interpolate(matricesAppear, [0, 1], [0.5, 1])})` }}>
        <MatrixBox label={<KBar />} sub="Compressed Keys" color={COLORS.keyMatrix} />
      </div>

      {/* Matrix: V̄ (moves to CPU) */}
      <div style={{ position: "absolute", top: valY, left: valX - 70, opacity: matricesAppear, transform: `scale(${interpolate(matricesAppear, [0, 1], [0.5, 1])})` }}>
        <MatrixBox label={<VBar />} sub="Compressed Values" color={COLORS.valueMatrix} />
      </div>

      {/* Matrix: K̄ᴿ — original (fades as it splits) */}
      {!splitVisible && (
        <div style={{ position: "absolute", top: startY, left: rStartX - 70, opacity: matricesAppear, transform: `scale(${interpolate(matricesAppear, [0, 1], [0.5, 1])})` }}>
          <MatrixBox label={<KBarR />} sub="Routing Keys" color={COLORS.routingMatrix} />
        </div>
      )}

      {/* K̄ᴿ shard 0 → GPU0 */}
      {splitVisible && (
        <div style={{ position: "absolute", top: r0Y, left: r0X - 60, opacity: 1, transform: `scale(${interpolate(routingMoveP, [0.1, 0.3], [1, 0.85])})` }}>
          <MatrixBox label={<><KBarR /> <span style={{ fontSize: 14 }}>[0]</span></>} sub="Shard 0" color={COLORS.routingMatrix} width={120} height={80} />
        </div>
      )}

      {/* K̄ᴿ shard 1 → GPU1 */}
      {splitVisible && (
        <div style={{ position: "absolute", top: r1Y, left: r1X - 60, opacity: 1, transform: `scale(${interpolate(routingMoveP, [0.1, 0.3], [1, 0.85])})` }}>
          <MatrixBox label={<><KBarR /> <span style={{ fontSize: 14 }}>[1]</span></>} sub="Shard 1" color={COLORS.routingMatrix} width={120} height={80} />
        </div>
      )}

      {/* "From Scene 1" label */}
      <div style={{
        position: "absolute", top: CENTER_Y - 50, width: "100%", textAlign: "center",
        opacity: ci([2 * fps, 2.5 * fps, 3.5 * fps, 4 * fps], [0, 1, 1, 0]),
        color: COLORS.textMuted, fontSize: 18, fontFamily: MONO,
      }}>
        Compressed matrices from Global Memory Encoding
      </div>

      {/* Explanation */}
      <div style={{ position: "absolute", bottom: 120, width: "100%", textAlign: "center", opacity: explainOp }}>
        <div style={{ color: COLORS.textDim, fontSize: 20, fontFamily: FONT, fontWeight: 400, lineHeight: 1.6 }}>
          Memory capacity decoupled from GPU VRAM — distributed routing keys + offloaded content
        </div>
      </div>

      {/* "100M tokens" callout */}
      <div style={{ position: "absolute", bottom: 40, width: "100%", textAlign: "center", opacity: calloutOp, transform: `scale(${calloutScale})` }}>
        <div style={{ display: "inline-block", background: "linear-gradient(135deg, #6366f120, #a855f720)", border: "2px solid #a855f7", borderRadius: 16, padding: "12px 36px", color: "#a855f7", fontSize: 28, fontFamily: FONT, fontWeight: 700 }}>
          100M tokens on 2&times;A800 GPUs
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
