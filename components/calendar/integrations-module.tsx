"use client";
import { MetaConnection } from "./meta-connection";
import { SocialConnection } from "./social-connection";
import { TikTokConnection } from "./tiktok-connection";
export function IntegrationConnections({ company, server }: { company: string; server: boolean }) {
  return <div className="company-connections-grid"><MetaConnection key={`facebook-${company}`} company={company} server={server} /><SocialConnection key={`instagram-${company}`} company={company} server={server} provider="instagram" /><TikTokConnection key={`tiktok-${company}`} company={company} server={server} /></div>;
}
