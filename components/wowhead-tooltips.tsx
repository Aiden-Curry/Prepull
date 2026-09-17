"use client";
import Script from "next/script";
import { useEffect, useState } from "react";
import { WOWHEAD_SCRIPT } from "../lib/armory/wowhead";
export function WowheadTooltips({ refreshKey }: { refreshKey: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    (window as Window & { whTooltips?: object }).whTooltips = { colorLinks: false, renameLinks: false, iconizeLinks: false, iconSize: true };
    setReady(true);
    (window as Window & { $WowheadPower?: { refreshLinks: (force: boolean) => void } }).$WowheadPower?.refreshLinks(true);
  }, [refreshKey]);
  return ready ? <Script id="wowhead-tooltips" src={WOWHEAD_SCRIPT} strategy="afterInteractive" onReady={() => {
    (window as Window & { $WowheadPower?: { refreshLinks: (force: boolean) => void } }).$WowheadPower?.refreshLinks(true);
  }} /> : null;
}
