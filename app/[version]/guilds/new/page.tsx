import { redirect } from "next/navigation";
export default async function NewGuildPage({ params }: { params: Promise<{ version: string }> }) {
  const resolvedParams = await params; redirect(`/${resolvedParams.version}/guilds`); }
