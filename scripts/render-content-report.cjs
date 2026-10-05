// Read-only artifact QA: renders the same executive components and current API data.
/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS loader for TSX artifact rendering. */
// Run with localhost active. No records, tokens or credentials are written to the artifact.
const fs=require('node:fs');
const path=require('node:path');
const Module=require('node:module');
const ts=require('typescript');
require('@next/env').loadEnvConfig(process.cwd());
const originalResolve=Module._resolveFilename;
Module._resolveFilename=function(request,parent,...rest){
  if(request.startsWith('@/'))request=path.join(process.cwd(),request.slice(2));
  if(request.startsWith('.')||path.isAbsolute(request)){
    const base=path.isAbsolute(request)?request:path.resolve(path.dirname(parent.filename),request);
    if(fs.existsSync(base+'.ts'))request=base+'.ts';else if(fs.existsSync(base+'.tsx'))request=base+'.tsx';
  }
  return originalResolve.call(this,request,parent,...rest);
};
for(const extension of ['.tsx','.ts'])require.extensions[extension]=(m,file)=>m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,file);
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const {ExecutiveReportView}=require('../components/content-reports/executive-report.tsx');
const company=process.argv[2]||'Manabiche',start=process.argv[3]||'2026-09-01',end=process.argv[4]||'2026-09-30';
const mode=process.argv.includes('--demo')?'demo':'production';
const query=new URLSearchParams({companyId:company,platform:'Todas',startDate:start,endDate:end,mode});
const headers={Authorization:'Basic '+Buffer.from(process.env.PANEL_USER+':'+process.env.PANEL_PASSWORD).toString('base64')};
(async()=>{
  const response=await fetch('http://localhost:3000/api/reports/summary?'+query,{headers});if(!response.ok)throw new Error('Report HTTP '+response.status);const report=await response.json();
  const profileResponse=await fetch('http://localhost:3000/api/company-profile?company='+encodeURIComponent(company),{headers});const profile=profileResponse.ok?(await profileResponse.json()).profile:null;
  const markup=renderToStaticMarkup(React.createElement(ExecutiveReportView,{report,sort:'views',onSort:()=>{},onDetail:()=>{},notes:report.notes,logo:profile?.logo,companyName:profile?.name}));
  const css=fs.readFileSync('app/tokens.css','utf8')+'\n'+fs.readFileSync('app/content-reports.css','utf8');
  const footer=JSON.stringify((profile?.name||company)+' · '+start+' — '+end).replace(/</g,'\\3c ');
  const footerCss=`@page executive { @bottom-left { content: ${footer}; } } @page technical { @bottom-left { content: ${footer}; } }`;
  fs.mkdirSync('tmp/pdfs',{recursive:true});
  fs.writeFileSync('tmp/pdfs/content-report.html',`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Focus MRKT - Informe</title><style>${css}\nbody{font-family:Arial,sans-serif;color:var(--foreground);background:var(--surface);margin:0;} .eyebrow{color:var(--accent);font-size:var(--font-size-sm);font-weight:var(--font-weight-semibold);} ${footerCss}</style></head><body><main class="ci-content">${markup}</main></body></html>`);
  fs.writeFileSync('tmp/pdfs/report-qa-summary.json',JSON.stringify({company,start,end,mode,publications:report.publications.length,sections:10,metrics:report.executive.kpis.map(k=>({key:k.key,value:k.value,complete:k.complete})),manual:report.executive.manualMetrics.length},null,2));
  console.log(JSON.stringify({html:'tmp/pdfs/content-report.html',publications:report.publications.length,mode}));
})().catch(error=>{console.error('Artifact render failed:',error.message);process.exitCode=1;});
