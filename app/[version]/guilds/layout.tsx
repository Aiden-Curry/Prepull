import { guildFeatureEnabled } from "../../../lib/config/production.ts";

export default function GuildFeatureLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (process.env.NODE_ENV === "production" && !guildFeatureEnabled()) return <main className="mx-auto max-w-xl px-5 py-24"><h1 className="display text-4xl">Guild workspaces unavailable</h1><p className="mt-3 text-sm text-[var(--muted)]">Guild workspaces are currently disabled.</p></main>;
  return children;
}
