import React from "react";
import { Star } from "lucide-react";

export default function StarRating({ rating = 0, total, size = "sm", showValue = true }) {
  const stars = 5;
  const filled = Math.round(rating);

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: stars }).map((_, i) => (
          <Star
            key={i}
            className={`${size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5"} ${
              i < filled
                ? "fill-amber-400 text-amber-400"
                : "fill-muted text-muted stroke-muted-foreground/30"
            }`}
          />
        ))}
      </div>
      {showValue && (
        <span className={`font-semibold text-foreground ${size === "lg" ? "text-sm" : "text-xs"}`}>
          {rating.toFixed(1)}
        </span>
      )}
      {total !== undefined && (
        <span className={`text-muted-foreground ${size === "lg" ? "text-sm" : "text-xs"}`}>
          ({total})
        </span>
      )}
    </div>
  );
}