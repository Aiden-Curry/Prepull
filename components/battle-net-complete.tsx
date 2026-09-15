"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function BattleNetComplete({ callbackUrl }: { callbackUrl: string }) {
  const started = useRef(false); const [error, setError] = useState("");
  useEffect(() => {
    if (started.current) return; started.current = true;
    void signIn("credentials", { battleNetGrant: "1", redirect: false, callbackUrl }).then((result) => {
      if (result?.error) setError("This Battle.net sign-in link expired. Please start again.");
      else window.location.replace(result?.url ?? callbackUrl);
    }).catch(() => setError("Battle.net sign-in could not be completed. Please start again."));
  }, [callbackUrl]);
  return <div role="status" aria-live="polite"><p>{error || "Finishing your secure Battle.net sign-in…"}</p>{error && <Link className="button-secondary mt-5 inline-flex" href="/auth/signin">Return to sign in</Link>}</div>;
}
