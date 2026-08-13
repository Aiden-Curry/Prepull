"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function RootPage() { const router = useRouter(); useEffect(() => { const saved = localStorage.getItem("prepull-version"); router.replace(saved === "tbc" ? "/tbc" : "/era"); }, [router]); return <main className="grid min-h-screen place-items-center bg-[#17130F] text-sm text-[#A69A8B]">Loading PrePull…</main>; }
