"use client";
import { useState } from "react";
export function SharePlanButton({ text }: { text: string }) { const [copied, setCopied] = useState(false); return <button type="button" className="button-secondary" onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); }}>{copied ? "Plan copied" : "Copy plan"}</button>; }
