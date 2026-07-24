"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export interface FlapProgress {
  cornerRight: number;
  cornerLeft: number;
  base: number;
}

function kraftBackground(tone: "light" | "mid" | "dark"): React.CSSProperties {
  const colors: Record<string, [string, string]> = {
    light: ["#d9b98a", "#c7a06e"],
    mid: ["#c39a67", "#ad8250"],
    dark: ["#a97f47", "#8e6838"],
  };
  const [from, to] = colors[tone];

  return {
    backgroundImage: `
      repeating-linear-gradient(112deg, rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 1px, transparent 1px, transparent 3px),
      repeating-linear-gradient(24deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 4px),
      radial-gradient(circle at 30% 20%, rgba(255,255,255,0.08), transparent 60%),
      linear-gradient(135deg, ${from}, ${to})
    `,
  };
}

function Panel({
  clipPath,
  hinge,
  progress,
  dragging,
  z,
  tone,
}: {
  clipPath: string;
  hinge: "left" | "right";
  progress: number;
  dragging: boolean;
  z: number;
  tone: "light" | "mid" | "dark";
}) {
  const angle = (hinge === "right" ? -1 : 1) * 150 * progress;

  const scale = 1 + 0.18 * progress;

  return (
    <div
      className="absolute inset-0"
      style={{
        ...kraftBackground(tone),
        clipPath,
        transformOrigin: hinge === "right" ? "100% 50%" : "0% 50%",
        transformStyle: "preserve-3d",
        transform: `rotateY(${angle}deg)`,
        opacity: 1 - progress * 0.9,
        zIndex: z,
        filter: "drop-shadow(0 2px 5px rgba(35,20,8,0.55))",
        transition: dragging
          ? "none"
          : "transform 1.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 1.4s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    />
  );
}

export function GiftWrap({
  flapProgress,
  fadeProgress,
  dragging,
  children,
}: {
  flapProgress: FlapProgress;
  fadeProgress: number;
  dragging: boolean;
  children: ReactNode;
}) {
  const transition = dragging
    ? { duration: 0 }
    : { duration: 1.4, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <div
      className="relative h-full w-full rounded-2xl"
      style={{ perspective: 500 }}
    >
      <motion.div
        className="absolute inset-0 z-0 flex items-center justify-center"
        animate={{
          opacity: Math.max(0, (fadeProgress - 0.4) / 0.6),
          scale: 0.9 + 0.1 * Math.max(0, (fadeProgress - 0.4) / 0.6),
        }}
        transition={transition}
      >
        {children}
      </motion.div>

      <Panel
        clipPath="polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)"
        hinge="right"
        progress={flapProgress.base}
        dragging={dragging}
        z={5}
        tone="dark"
      />

      <Panel
        clipPath="polygon(100% 50%, 0% 0%, 0% 100%, 100% 100%)"
        hinge="left"
        progress={flapProgress.cornerLeft}
        dragging={dragging}
        z={10}
        tone="mid"
      />

      <Panel
        clipPath="polygon(0% 50%, 100% 0%, 100% 100%, 0% 100%)"
        hinge="right"
        progress={flapProgress.cornerRight}
        dragging={dragging}
        z={15}
        tone="light"
      />
    </div>
  );
}