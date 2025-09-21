import React from "react";

type Props = { className?: string };

export default function Divider({ className }: Props) {
  return (
    <div
      className={[
        "w-full h-[2px]",
        // Centered 1px line using background image to avoid fractional pixel rounding
        "bg-[length:100%_2px]",
        "bg-no-repeat",
        "bg-[linear-gradient(to_bottom,transparent_0,rgba(255,255,255,0.18)_1px,transparent_1px)]",
        className || "",
      ].join(" ")}
    />
  );
}

