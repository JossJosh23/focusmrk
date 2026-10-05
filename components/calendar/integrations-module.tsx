"use client";
import { CompanySelector } from "./company-selector";
import { MetaConnection } from "./meta-connection";
import { SocialConnection } from "./social-connection";
import { TikTokConnection } from "./tiktok-connection";
export function IntegrationConnections({ company, server }: { company: string; server: boolean }) {
  return <div className="company-connections-grid"><MetaConnection key={`facebook-${company}`} company={company} server={server} /><SocialConnection key={`instagram-${company}`} company={company} server={server} provider="instagram" /><TikTokConnection key={`tiktok-${company}`} company={company} server={server} /></div>;
}
export function IntegrationsModule({ company, known, server, onChange }: { company: string; known: string[]; server: boolean; onChange: (company: string) => void }) {
  return <section className="company-module"><div className="page-heading"><div><span className="eyebrow">CUENTAS DE TU EMPRESA</span><h1>Integraciones<span>.</span></h1><p>Conecta Facebook e Instagram de forma independiente.</p></div></div><CompanySelector server={server} known={known} value={company} onChange={onChange} />{company ? <div className="company-connections"><IntegrationConnections company={company} server={server} /></div> : <p>Selecciona una empresa para gestionar sus conexiones.</p>}</section>;
}
