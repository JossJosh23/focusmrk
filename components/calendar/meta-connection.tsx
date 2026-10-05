"use client";
import { SocialConnection } from "./social-connection";
export function MetaConnection({ company, server }: { company: string; server: boolean }) {
  return <SocialConnection company={company} server={server} provider="facebook" />;
}
