/* eslint-disable @typescript-eslint/no-require-imports -- Optional local PDF QA dependencies. */
// Install QA-only packages in tmp/pdf-qa; these are not application dependencies.
const fs=require('node:fs');
const path=require('node:path');
const canvas=require('../tmp/pdf-qa/node_modules/@napi-rs/canvas');
Object.assign(globalThis,{DOMMatrix:canvas.DOMMatrix,ImageData:canvas.ImageData,Path2D:canvas.Path2D});
(async()=>{
  const pdfjs=await import('../tmp/pdf-qa/node_modules/pdfjs-dist/legacy/build/pdf.mjs');
  const file=process.argv[2]||'output/pdf/Manabiche-informe-septiembre-2026.pdf';
  const doc=await pdfjs.getDocument({data:new Uint8Array(fs.readFileSync(file)),useSystemFonts:true}).promise;
  fs.mkdirSync('tmp/pdfs',{recursive:true});
  const pages=[],summary=[];
  for(let number=1;number<=doc.numPages;number++){
    const page=await doc.getPage(number),content=await page.getTextContent(),text=content.items.map(x=>x.str).join(' ');
    const viewport=page.getViewport({scale:.65}),render=canvas.createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));
    await page.render({canvasContext:render.getContext('2d'),viewport,canvas:render}).promise;
    fs.writeFileSync(path.join('tmp/pdfs','page-'+number+'.png'),render.toBuffer('image/png'));pages.push(render);
    summary.push({page:number,executive:text.includes('Informe de rendimiento digital Página'),appendix:text.includes('Anexo técnico Página'),heading:text.slice(0,220),pageNumberPresent:text.includes('Página '+number),textLength:text.length});
  }
  const width=430,height=640,sheet=canvas.createCanvas(width*4,height*Math.ceil(pages.length/4)),ctx=sheet.getContext('2d');
  ctx.fillStyle='#e5e0ed';ctx.fillRect(0,0,sheet.width,sheet.height);
  pages.forEach((page,index)=>{const scale=Math.min((width-20)/page.width,(height-35)/page.height),x=index%4*width+10,y=Math.floor(index/4)*height+25;ctx.drawImage(page,x,y,page.width*scale,page.height*scale);ctx.fillStyle='#29213b';ctx.font='16px Arial';ctx.fillText('Página '+(index+1),x,y-8);});
  fs.writeFileSync('tmp/pdfs/contact-sheet.png',sheet.toBuffer('image/png'));fs.writeFileSync('tmp/pdfs/pdf-validation.json',JSON.stringify(summary,null,2));
  console.log(JSON.stringify({pages:doc.numPages,executivePages:summary.filter(p=>p.executive).length,appendixPages:summary.filter(p=>p.appendix).length,pageNumbers:summary.every(p=>p.pageNumberPresent),headings:summary.map(p=>p.heading)}));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
