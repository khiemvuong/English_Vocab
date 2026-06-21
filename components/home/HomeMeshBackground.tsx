"use client";

import dynamic from "next/dynamic";

const MeshGradientImpl = dynamic(
  () => import("@paper-design/shaders-react").then((m) => ({ default: m.MeshGradient })),
  { ssr: false }
);

export function HomeMeshBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none select-none">
      <MeshGradientImpl
        className="absolute inset-0 w-full h-full"
        colors={["#0a021c", "#3b0764", "#581c87", "#0f255c"]}
        speed={0.15}
        distortion={0.4}
        swirl={0.3}
        grainOverlay={0.08}
        style={{ width: "100%", height: "100%" }}
      />
      {/* Subtle overlay to soften and darken the shader for readability */}
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
}
