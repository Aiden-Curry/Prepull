import { Footer } from "./footer";
import { Header } from "./header";
import { ContentVersion } from "../lib/types";

export function VersionShell({ version, children }: { version: ContentVersion; children: React.ReactNode }) {
  return <div className="app-shell" data-content-version={version}><Header version={version} />{children}<Footer version={version} /></div>;
}
