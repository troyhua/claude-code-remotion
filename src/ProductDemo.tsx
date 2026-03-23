import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Sequence,
} from "remotion";

// Scene 1: Title card with animated text
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame, fps, config: { damping: 12 } });
  const subtitleOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateRight: "clamp",
  });
  const lineWidth = interpolate(frame, [10, 50], [0, 400], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          transform: `scale(${titleScale})`,
          color: "white",
          fontSize: 80,
          fontFamily: "SF Pro Display, Helvetica Neue, Arial, sans-serif",
          fontWeight: 700,
          letterSpacing: -2,
        }}
      >
        Your Product
      </div>
      <div
        style={{
          width: lineWidth,
          height: 3,
          backgroundColor: "#6366f1",
          marginTop: 20,
          marginBottom: 20,
          borderRadius: 2,
        }}
      />
      <div
        style={{
          opacity: subtitleOpacity,
          color: "#888",
          fontSize: 28,
          fontFamily: "SF Pro Display, Helvetica Neue, Arial, sans-serif",
          fontWeight: 400,
          letterSpacing: 4,
          textTransform: "uppercase",
        }}
      >
        Tagline goes here
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: Feature highlights with staggered animation
const FeatureScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const features = [
    { icon: "⚡", title: "Lightning Fast", desc: "Built for speed" },
    { icon: "🔒", title: "Secure", desc: "Enterprise-grade security" },
    { icon: "🎯", title: "Precise", desc: "Pixel-perfect results" },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
        gap: 60,
        flexDirection: "row",
        padding: "0 120px",
      }}
    >
      {features.map((feature, i) => {
        const delay = i * 10;
        const scale = spring({
          frame: frame - delay,
          fps,
          config: { damping: 12 },
        });
        const opacity = interpolate(frame - delay, [0, 15], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={i}
            style={{
              opacity,
              transform: `scale(${scale})`,
              textAlign: "center",
              flex: 1,
            }}
          >
            <div style={{ fontSize: 64, marginBottom: 20 }}>{feature.icon}</div>
            <div
              style={{
                color: "white",
                fontSize: 32,
                fontFamily:
                  "SF Pro Display, Helvetica Neue, Arial, sans-serif",
                fontWeight: 600,
                marginBottom: 10,
              }}
            >
              {feature.title}
            </div>
            <div
              style={{
                color: "#666",
                fontSize: 20,
                fontFamily:
                  "SF Pro Display, Helvetica Neue, Arial, sans-serif",
              }}
            >
              {feature.desc}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// Scene 3: Call to action
const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 10 } });
  const buttonOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateRight: "clamp",
  });
  const glowIntensity = interpolate(
    frame,
    [40, 60, 80, 100],
    [0, 20, 10, 20],
    { extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          color: "white",
          fontSize: 56,
          fontFamily: "SF Pro Display, Helvetica Neue, Arial, sans-serif",
          fontWeight: 700,
          marginBottom: 40,
          letterSpacing: -1,
        }}
      >
        Ready to get started?
      </div>
      <div
        style={{
          opacity: buttonOpacity,
          backgroundColor: "#6366f1",
          color: "white",
          fontSize: 24,
          fontFamily: "SF Pro Display, Helvetica Neue, Arial, sans-serif",
          fontWeight: 600,
          padding: "18px 48px",
          borderRadius: 12,
          boxShadow: `0 0 ${glowIntensity}px ${glowIntensity / 2}px rgba(99, 102, 241, 0.6)`,
        }}
      >
        Try it free →
      </div>
    </AbsoluteFill>
  );
};

// Main composition: sequences the scenes together
export const ProductDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      {/* Scene 1: Title (frames 0-89, 3 seconds) */}
      <Sequence from={0} durationInFrames={90}>
        <TitleScene />
      </Sequence>

      {/* Scene 2: Features (frames 90-209, 4 seconds) */}
      <Sequence from={90} durationInFrames={120}>
        <FeatureScene />
      </Sequence>

      {/* Scene 3: CTA (frames 210-299, 3 seconds) */}
      <Sequence from={210} durationInFrames={90}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};
