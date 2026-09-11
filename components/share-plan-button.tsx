"use client";
import { useEffect, useState } from "react";
export function SharePlanButton({ text }: { text: string }) { const [copied, setCopied] = useState(false); const [ready, setReady] = useState(false); useEffect(() => setReady(true), []); return <button type="button" className="button-secondary" disabled={!ready} onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); }}>{copied ? "Plan copied" : "Copy plan"}</button>; }
