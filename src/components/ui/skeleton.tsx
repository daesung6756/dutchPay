import React from "react";

type SkeletonProps = {
  className?: string;
  style?: React.CSSProperties;
  role?: string;
};

export default function Skeleton({ className = "", style, role = "presentation" }: SkeletonProps) {
  return (
    <div
      role={role}
      aria-hidden="true"
      className={`bg-slate-200 rounded ${className} animate-pulse`}
      style={style}
    />
  );
}
