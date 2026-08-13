import { Footer } from "./footer";
import { Header } from "./header";
import { ContentVersion } from "../lib/types";
const theme = { era: { "--background": "#17130F", "--surface": "#211A14", "--surface-raised": "#2A2118", "--primary": "#B88946", "--primary-light": "#D7B87A", "--secondary": "#8F3D2E", "--text": "#F5EEE3", "--muted": "#A69A8B", "--line": "rgba(215,184,122,.16)", "--glow": "rgba(184,137,70,.12)" }, tbc: { "--background": "#0C1411", "--surface": "#101C17", "--surface-raised": "#12221B", "--primary": "#58D68D", "--primary-light": "#A4F26A", "--secondary": "#6D4BC3", "--text": "#EFF8F1", "--muted": "#91A99A", "--line": "rgba(88,214,141,.16)", "--glow": "rgba(54,185,116,.11)" } };
export function VersionShell({ version, children }: { version: ContentVersion; children: React.ReactNode }) { return <div className="app-shell" style={theme[version] as React.CSSProperties}><Header version={version} />{children}<Footer version={version} /></div>; }
