"use client";

import * as React from "react";
import { ProgressiveFluxLoader } from "@/components/ui/progressive-flux-loader";

const PHASES = [
  { at: 0, label: "Đang tải dữ liệu bài học..." },
  { at: 30, label: "Khởi tạo môi trường..." },
  { at: 65, label: "Thiết lập giao diện..." },
  { at: 90, label: "Chuẩn bị sẵn sàng!" },
  { at: 100, label: "Hoàn tất!" }
];

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-9999 px-4 overflow-hidden">
      {/* Premium ambient glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(29,111,251,0.06),transparent_65%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(116,225,255,0.03),transparent_75%)] pointer-events-none" />
      
      <div className="w-full max-w-sm relative z-10 text-center animate-in fade-in duration-300">
        <ProgressiveFluxLoader
          phases={PHASES}
          duration={6}
          loop={true}
          showLabel={true}
          className="w-full"
          textClassName="text-white font-bold tracking-tight bg-linear-to-br from-white via-white to-zinc-400 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
        />
      </div>
    </div>
  );
}
