import { redirect } from "next/navigation";
export default function NewGuildPage({ params }: { params: { version: string } }) { redirect(`/${params.version}/guilds`); }
