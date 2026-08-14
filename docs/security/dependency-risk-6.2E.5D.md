# Dependency and content-boundary risk record — 6.2E.5D

Audited against the installed Next.js 15.5.21 tree on 2026-08-14. No
`npm audit fix`, forced install, or framework downgrade was used.

| Package/path | Finding | Reachability and mitigation | Follow-up |
| --- | --- | --- | --- |
| `next > postcss@8.4.31` | Four high advisories reported by npm audit (GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849). | Nested build-time dependency required by Next 15.5.21. PrePull does not parse user CSS or accept CSS uploads. The app's direct Tailwind/PostCSS toolchain is `postcss@8.4.47`. | Reassess when a patched Next 15 maintenance release resolves the nested dependency. Next 16 was explicitly out of scope. |
| `next > sharp@0.34.5` (optional) | GHSA-f88m-g3jw-g9cj; npm reports CVE-2026-33327, CVE-2026-33328, CVE-2026-35590 and CVE-2026-35591. | No `next/image`, remote image pattern, image route, upload, or arbitrary image URL exists in the application. The image trust helper rejects unreviewed origins; UI currently uses text/icons. | Reassess before introducing image uploads, remote images, or an image optimizer route, and when a patched compatible Next release is available. |

No separately installed `react-server-dom-*` package was found; RSC packages
are supplied by Next. Production config remains PostgreSQL-only and the local
memory adapter remains unavailable in production. This record is evidence,
not a waiver: CI should fail on newly introduced direct dependencies or a
reachable high/critical finding.
