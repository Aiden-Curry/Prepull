import { Footer } from "./footer";
import { Header } from "./header";
import { ContentVersion } from "../lib/types";
import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";

export async function VersionShell({ version, children }: { version: ContentVersion; children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  return <div className="app-shell" data-content-version={version}><Header version={version} signedIn={Boolean(session?.user?.id)} />{children}<Footer version={version} /></div>;
}
