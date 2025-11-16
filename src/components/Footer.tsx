"use client";

import React from "react";

type FooterProps = {
  className?: string;
};

export default function Footer({ className = "" }: FooterProps) {
  const year = new Date().getFullYear();
  return (
    <footer
      aria-label="site footer"
      className={`w-full border-t border-dashed border-slate-200 bg-transparent py-4 text-center text-sm text-slate-600 ${className}`}
    >
      <div className="max-w-[980px] mx-auto px-4 flex items-center justify-center gap-2">
        <span>Copyright © {year} <strong className="text-slate-700">DS.Lee</strong>. All rights reserved.</span>
      </div>
    </footer>
  );
}
