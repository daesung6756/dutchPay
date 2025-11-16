"use client";
import nextDynamic from "next/dynamic";

export const dynamic = "force-dynamic";

const HomeClient = nextDynamic(() => import("@/components/HomeClient"), { ssr: false });

export default function Page() {
  return <HomeClient />;
}

