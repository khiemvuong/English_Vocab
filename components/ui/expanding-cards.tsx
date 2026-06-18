"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardItem {
  id: string | number;
  title: string;
  description: string;
  imgSrc: string;
  icon: React.ReactNode;
  linkHref?: string;
}

interface ExpandingCardsProps extends Omit<React.HTMLAttributes<HTMLUListElement>, "onChange"> {
  items: CardItem[];
  defaultActiveIndex?: number;
  onChange?: (id: string | number) => void;
}

export const ExpandingCards = React.forwardRef<
  HTMLUListElement,
  ExpandingCardsProps
>(({ className, items, defaultActiveIndex = 0, onChange, ...props }, ref) => {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(
    defaultActiveIndex,
  );
  
  // Update activeIndex if defaultActiveIndex changes
  React.useEffect(() => {
    setActiveIndex(defaultActiveIndex);
  }, [defaultActiveIndex]);

  const gridStyle = React.useMemo(() => {
    if (activeIndex === null) return {};
    const rows = items
      .map((_, index) => (index === activeIndex ? "5fr" : "1fr"))
      .join(" ");
    return { gridTemplateRows: rows, gridTemplateColumns: "1fr" };
  }, [activeIndex, items.length]);

  const handleInteraction = (index: number) => {
    setActiveIndex(index);
    if (onChange) {
      onChange(items[index].id);
    }
  };

  return (
    <ul
      className={cn(
        "w-full h-full gap-3",
        "grid",
        "transition-[grid-template-rows] duration-500 ease-out",
        className,
      )}
      style={gridStyle}
      ref={ref}
      {...props}
    >
      {items.map((item, index) => (
        <li
          key={item.id}
          className={cn(
            "group relative cursor-pointer overflow-hidden rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md shadow-xl transition-all duration-300 hover:bg-white/10",
            "min-h-0 min-w-0 flex items-center justify-start p-4 md:p-6"
          )}
          onMouseEnter={() => handleInteraction(index)}
          onFocus={() => handleInteraction(index)}
          onClick={() => handleInteraction(index)}
          tabIndex={0}
          data-active={activeIndex === index}
        >
          {/* Subtle gradient for active state */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-data-[active=true]:opacity-100 transition-opacity duration-500" />

          <div className="relative z-10 flex flex-row items-center justify-start w-full gap-4 md:gap-6 h-full">
            <div className="text-white/70 transition-all duration-300 ease-out group-data-[active=true]:text-white group-data-[active=true]:scale-110 shrink-0">
              {item.icon}
            </div>

            <div className="flex flex-col justify-center overflow-hidden w-full h-full">
              <h3 className="text-lg md:text-2xl font-bold text-white/90 transition-all duration-300 ease-out group-data-[active=true]:text-white truncate">
                {item.title}
              </h3>

              <p className="text-sm font-medium text-slate-300 opacity-0 max-h-0 transition-all duration-500 ease-in-out group-data-[active=true]:opacity-100 group-data-[active=true]:max-h-[100px] mt-1 md:mt-2 line-clamp-2">
                {item.description}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
});
ExpandingCards.displayName = "ExpandingCards";
