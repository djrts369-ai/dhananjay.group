'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import QRCode from 'qrcode';
import {
  Search, FileImage, FilePlus2, Scissors, FileDown, Images, QrCode, Type,
  KeyRound, CalendarDays, Percent, Receipt, Ruler, Braces, Menu, X,
  Download, Upload, ShieldCheck, ArrowRight, Sparkles, Check, Heart
} from 'lucide-react';

type ToolId = 'image-compressor'|'image-resizer'|'image-cropper'|'pdf-merger'|'pdf-splitter'|'pdf-to-jpg'|'jpg-to-pdf'|'qr-generator'|'word-counter'|'password-generator'|'age-calculator'|'percentage-calculator'|'gst-calculator'|'unit-converter'|'json-formatter';
type ToolDef = {id:ToolId; name:string; description:string; category:string; icon:any; keywords:string};
const tools: ToolDef[] = [
  {id:'image-compressor',name:'Image Compressor',description:'Reduce image file size while keeping quality under control.',category:'Images',icon:FileImage,keywords:'jpg jpeg png webp optimize reduce size'},
  {id:'image-resizer',name:'Image Resizer',description:'Resize an image to exact pixel dimensions.',category:'Images',icon:Images,keywords:'resize dimensions pixels photo'},
  {id:'image-cropper',name:'Image Cropper',description:'Crop an image to a custom area and download it.',category:'Images',icon:FileImage,keywords:'crop photo picture'},
  {id:'pdf-merger',name:'PDF Merger',description:'Combine multiple PDF files into one document.',category:'PDF',icon:FilePlus2,keywords:'join combine pdf'},
  {id:'pdf-splitter',name:'PDF Splitter',description:'Extract a page range into a new PDF.',category:'PDF',icon:Scissors,keywords:'extract separate pages'},
  {id:'pdf-to-jpg',name:'PDF to JPG',description:'Convert every page of a PDF into a JPG image.',category:'PDF',icon:FileDown,keywords:'convert pdf image png jpeg'},
  {id:'jpg-to-pdf',name:'JPG to PDF',description:'Turn one or more images into a PDF.',category:'PDF',icon:Images,keywords:'image photo convert pdf'},
  {id:'qr-generator',name:'QR Code Generator',description:'Create a downloadable QR code from text or a link.',category:'Everyday',icon:QrCode,keywords:'barcode url scan'},
  {id:'word-counter',name:'Word Counter',description:'Count words, characters, sentences and reading time.',category:'Everyday',icon:Type,keywords:'text count characters'},
  {id:'password-generator',name:'Password Generator',description:'Generate a strong random password on your device.',category:'Everyday',icon:KeyRound,keywords:'secure random key'},
  {id:'age-calculator',name:'Age Calculator',description:'Calculate age in years, months and days.',category:'Calculators',icon:CalendarDays,keywords:'birthday date'},
  {id:'percentage-calculator',name:'Percentage Calculator',description:'Calculate percentages and percentage changes.',category:'Calculators',icon:Percent,keywords:'percent increase decrease'},
  {id:'gst-calculator',name:'GST Calculator',description:'Calculate GST amount and inclusive or exclusive totals.',category:'Calculators',icon:Receipt,keywords:'tax india goods services'},
  {id:'unit-converter',name:'Unit Converter',description:'Convert common length, weight and temperature units.',category:'Calculators',icon:Ruler,keywords:'measurement km cm kg celsius'},
  {id:'json-formatter',name:'JSON Formatter',description:'Format, validate and minify JSON data.',category:'Developer',icon:Braces,keywords:'developer validate beautify minify'}
];

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}
function downloadCanvas(canvas: HTMLCanvasElement, name: string, type='image/png', quality=0.92) {
  canvas.toBlob(blob => { if (blob) saveBlob(blob, name); }, type, quality);
}
function FilePicker({multiple=false, accept, onFiles, label='Choose files'}:{multiple?:boolean;accept:string;onFiles:(files:File[])=>void;label?:string}) {
  const ref = useRef<HTMLInputElement>(null);
  return <><input ref={ref} type="file" accept={accept} multiple={multiple} hidden onChange={e=>{onFiles(Array.from(e.target.files||[])); e.currentTarget.value='';}}/><button className="button secondary" onClick={()=>ref.current?.click()}><Upload size={16}/>{label}</button></>;
}
function Field({label,children}:{label:string;children:React.ReactNode}) { return <label className="field"><span>{label}</span>{children}</label>; }
function ToolPanel({id,onStatus}:{id:ToolId;onStatus:(message:string)=>void}) {
  const [files,setFiles] = useState<File[]>([]);
  const setStatus = (message:string) => onStatus(message);
  const [quality,setQuality] = useState(75);
  const [width,setWidth] = useState(1200);
  const [height,setHeight] = useState(800);
  const [lockRatio,setLockRatio] = useState(true);
  const [crop,setCrop] = useState({x:0,y:0,w:100,h:100});
  const [pages,setPages] = useState('1');
  const [qrText,setQrText] = useState('https://dhananjay.group');
  const [text,setText] = useState('');
  const [length,setLength] = useState(16);
  const [upper,setUpper] = useState(true); const [lower,setLower] = useState(true); const [numbers,setNumbers] = useState(true); const [symbols,setSymbols] = useState(true);
  const [birth,setBirth] = useState('2000-01-01');
  const [gstAmount,setGstAmount] = useState('1000'); const [gstRate,setGstRate] = useState('18'); const [gstMode,setGstMode] = useState<'add'|'remove'>('add');
  const [percentA,setPercentA] = useState(''); const [percentB,setPercentB] = useState('');
  const [unitType,setUnitType] = useState('length'); const [unitFrom,setUnitFrom] = useState('km'); const [unitTo,setUnitTo] = useState('mi'); const [unitValue,setUnitValue] = useState('1');
  const [jsonMode,setJsonMode] = useState<'pretty'|'minify'>('pretty');
  const first = files[0];

  async function loadImage(file:File):Promise<HTMLImageElement> {
    return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file);const img=new Image();img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Could not read this image.'))};img.src=url;});
  }
  async function imageAction(mode:'compress'|'resize'|'crop') {
    if(!first) return setStatus('Choose an image first.');
    try {
      const img=await loadImage(first); const canvas=document.createElement('canvas'); const ctx=canvas.getContext('2d');
      if(!ctx) throw new Error('Canvas is not available.');
      if(mode==='compress'){canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;}
      if(mode==='resize'){canvas.width=Math.max(1,Number(width));canvas.height=Math.max(1,Number(height));}
      if(mode==='crop'){
        const sx=Math.round(img.naturalWidth*crop.x/100), sy=Math.round(img.naturalHeight*crop.y/100);
        const sw=Math.max(1,Math.round(img.naturalWidth*crop.w/100)), sh=Math.max(1,Math.round(img.naturalHeight*crop.h/100));
        canvas.width=sw;canvas.height=sh;ctx.drawImage(img,sx,sy,sw,sh,0,0,sw,sh);
      } else ctx.drawImage(img,0,0,canvas.width,canvas.height);
      const mime=first.type==='image/png'?'image/png':'image/jpeg';
      canvas.toBlob(blob=>{if(blob){saveBlob(blob,`${first.name.replace(/\.[^.]+$/,'')}-${mode}.${mime==='image/png'?'png':'jpg'}`);setStatus(`Done. Original: ${(first.size/1024).toFixed(1)} KB · Result: ${(blob.size/1024).toFixed(1)} KB`)}else setStatus('Could not export this image.')},mime,mode==='compress'?quality/100:0.92);
    } catch(e){setStatus(e instanceof Error?e.message:'Image processing failed.');}
  }
  async function pdfMerge() {
    try {const out=await PDFDocument.create();for(const f of files){const src=await PDFDocument.load(await f.arrayBuffer());const copied=await out.copyPages(src,src.getPageIndices());copied.forEach(p=>out.addPage(p));}saveBlob(new Blob([await out.save()] as any,{type:'application/pdf'}),'merged.pdf');setStatus('PDFs merged successfully.');}catch(e){setStatus('Could not merge these PDFs. Check that they are valid and not encrypted.');}
  }
  async function pdfSplit() {
    try {if(!first)throw new Error('Choose a PDF first.');const src=await PDFDocument.load(await first.arrayBuffer());const indices=parsePageRanges(pages,src.getPageCount());const out=await PDFDocument.create();const copied=await out.copyPages(src,indices);copied.forEach(p=>out.addPage(p));saveBlob(new Blob([await out.save()] as any,{type:'application/pdf'}),'extracted-pages.pdf');setStatus(`Extracted ${indices.length} page(s).`);}catch(e){setStatus(e instanceof Error?e.message:'Could not split this PDF.');}
  }
  async function imagesToPdf() {
    try {const out=await PDFDocument.create();for(const f of files){const bytes=await f.arrayBuffer();const img=f.type==='image/png'?await out.embedPng(bytes):await out.embedJpg(bytes);const page=out.addPage([img.width,img.height]);page.drawImage(img,{x:0,y:0,width:img.width,height:img.height});}saveBlob(new Blob([await out.save()] as any,{type:'application/pdf'}),'images.pdf');setStatus('PDF created successfully.');}catch(e){setStatus('Could not convert. Use JPG or PNG images.');}
  }
  async function pdfToImages() {
    try {
      if(!first)throw new Error('Choose a PDF first.');
      const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');
      // The PDF.js worker is bundled locally by Next.js; no third-party processing service is used.
      pdfjs.GlobalWorkerOptions.workerSrc=new URL('pdfjs-dist/legacy/build/pdf.worker.mjs',import.meta.url).toString();
      const pdf=await pdfjs.getDocument({data:await first.arrayBuffer()}).promise;
      for(let i=1;i<=pdf.numPages;i++){const page=await pdf.getPage(i);const viewport=page.getViewport({scale:1.6});const canvas=document.createElement('canvas');canvas.width=viewport.width;canvas.height=viewport.height;const ctx=canvas.getContext('2d');if(!ctx)continue;await page.render({canvasContext:ctx,viewport}).promise;await new Promise<void>(resolve=>canvas.toBlob(blob=>{if(blob)saveBlob(blob,`page-${i}.jpg`);resolve();},'image/jpeg',0.9));}
      setStatus(`Converted ${pdf.numPages} page(s). Your browser may ask permission for multiple downloads.`);
    }catch(e){setStatus(e instanceof Error?e.message:'PDF conversion failed.');}
  }
  function parsePageRanges(input:string,total:number){const set=new Set<number>();for(const part of input.split(',')){const p=part.trim();if(!p)continue;if(p.includes('-')){const [a,b]=p.split('-').map(Number);if(!Number.isInteger(a)||!Number.isInteger(b)||a<1||b<a||b>total)throw new Error(`Invalid page range: ${p}`);for(let i=a;i<=b;i++)set.add(i-1);}else{const n=Number(p);if(!Number.isInteger(n)||n<1||n>total)throw new Error(`Invalid page number: ${p}`);set.add(n-1);}}if(!set.size)throw new Error('Enter pages such as 1, 3-5.');return [...set].sort((a,b)=>a-b);}
  const inputFiles=(accept:string,multiple=false)=> <div className="uploadbox"><FilePicker accept={accept} multiple={multiple} onFiles={setFiles}/><span>{files.length?files.map(f=>f.name).join(', '):'Files are processed locally in your browser.'}</span></div>;
  const action=(label:string,fn:()=>void|Promise<void>)=><button className="button primary" onClick={()=>{setStatus('Processing…');void fn();}}>{label}<ArrowRight size={16}/></button>;

  switch(id){
    case 'image-compressor': return <>{inputFiles('image/*')}<Field label={`JPEG quality · ${quality}%`}><input type="range" min="10" max="95" value={quality} onChange={e=>setQuality(Number(e.target.value))}/></Field>{action('Compress image',()=>imageAction('compress'))}</>;
    case 'image-resizer': return <>{inputFiles('image/*')}<div className="two"><Field label="Width (px)"><input type="number" min="1" value={width} onChange={e=>setWidth(Number(e.target.value))}/></Field><Field label="Height (px)"><input type="number" min="1" value={height} onChange={e=>setHeight(Number(e.target.value))}/></Field></div><p className="hint">Tip: dimensions are applied exactly. The image may stretch if its aspect ratio differs.</p>{action('Resize image',()=>imageAction('resize'))}</>;
    case 'image-cropper': return <>{inputFiles('image/*')}<div className="two">{(['x','y','w','h'] as const).map(k=><Field key={k} label={`${({x:'Left offset',y:'Top offset',w:'Width',h:'Height'} as any)[k]} (%)`}><input type="number" min="0" max="100" value={crop[k]} onChange={e=>setCrop({...crop,[k]:Math.min(100,Math.max(0,Number(e.target.value)))})}/></Field>)}</div><p className="hint">Crop values are percentages of the original image. Width and height must stay within the image bounds.</p>{action('Crop image',()=>imageAction('crop'))}</>;
    case 'pdf-merger': return <>{inputFiles('application/pdf',true)}<p className="hint">PDFs are combined in the order shown above. Select them in the desired order.</p>{action('Merge PDFs',pdfMerge)}</>;
    case 'pdf-splitter': return <>{inputFiles('application/pdf')}<Field label="Pages to extract"><input value={pages} onChange={e=>setPages(e.target.value)} placeholder="e.g. 1, 3-5, 8"/></Field>{action('Extract pages',pdfSplit)}</>;
    case 'pdf-to-jpg': return <>{inputFiles('application/pdf')}<p className="hint">Each page is rendered as a JPG. Large documents may take a little time and memory.</p>{action('Convert to JPG',pdfToImages)}</>;
    case 'jpg-to-pdf': return <>{inputFiles('image/jpeg,image/png',true)}<p className="hint">Choose JPG or PNG images. Each image becomes one PDF page.</p>{action('Create PDF',imagesToPdf)}</>;
    case 'qr-generator': return <><Field label="Text or URL"><textarea rows={4} value={qrText} onChange={e=>setQrText(e.target.value)} placeholder="Enter a website URL or text"/></Field><div className="qr-preview">{qrText?<QRCodePreview value={qrText}/>:<span>Your QR code appears here.</span>}</div><button className="button secondary" onClick={async()=>{try{const url=await QRCode.toDataURL(qrText,{width:900,margin:2});const a=document.createElement('a');a.href=url;a.download='dhananjay-qr.png';a.click();setStatus('QR code downloaded.')}catch{setStatus('Enter some text first.')}}}><Download size={16}/>Download QR code</button></>;
    case 'word-counter': {const words=text.trim()?text.trim().split(/\s+/).length:0;const chars=text.length;const sentences=text.trim()?text.trim().split(/[.!?]+/).filter(s=>s.trim()).length:0;return <><Field label="Paste or type your text"><textarea rows={8} value={text} onChange={e=>setText(e.target.value)} placeholder="Start typing or paste your text here…"/></Field><div className="stats"><Stat label="Words" value={words}/><Stat label="Characters" value={chars}/><Stat label="Sentences" value={sentences}/><Stat label="Reading time" value={`${Math.ceil(words/200)} min`}/></div></>;}
    case 'password-generator': {const [unused] = [0]; return <PasswordTool length={length} setLength={setLength} upper={upper} setUpper={setUpper} lower={lower} setLower={setLower} numbers={numbers} setNumbers={setNumbers} symbols={symbols} setSymbols={setSymbols} setStatus={setStatus}/>;}
    case 'age-calculator': {const d=new Date(birth+'T00:00:00');const now=new Date();let y=now.getFullYear()-d.getFullYear(),m=now.getMonth()-d.getMonth(),day=now.getDate()-d.getDate();if(day<0){m--;day+=new Date(now.getFullYear(),now.getMonth(),0).getDate();}if(m<0){y--;m+=12;}const valid=!Number.isNaN(d.getTime())&&d<=now;return <><Field label="Date of birth"><input type="date" max={new Date().toISOString().slice(0,10)} value={birth} onChange={e=>setBirth(e.target.value)}/></Field><div className="result"><strong>{valid?`${y} years, ${m} months, ${day} days`:'Enter a valid date of birth.'}</strong><span>Your age as of today.</span></div></>;}
    case 'percentage-calculator': {const a=Number(percentA),b=Number(percentB);return <><div className="two"><Field label="Value"><input type="number" value={percentA} onChange={e=>setPercentA(e.target.value)} placeholder="e.g. 250"/></Field><Field label="Percentage (%)"><input type="number" value={percentB} onChange={e=>setPercentB(e.target.value)} placeholder="e.g. 15"/></Field></div><div className="result"><strong>{percentA!==''&&percentB!==''?`${(a*b/100).toLocaleString(undefined,{maximumFractionDigits:6})}`:'—'}</strong><span>{percentA!==''&&percentB!==''?`${b}% of ${a}`:'Enter both values to calculate.'}</span></div></>;}
    case 'gst-calculator': {const amount=Math.max(0,Number(gstAmount)||0),rate=Math.max(0,Number(gstRate)||0),tax=gstMode==='add'?amount*rate/100:amount*rate/(100+rate),total=gstMode==='add'?amount+tax:amount-tax;return <><div className="segmented"><button className={gstMode==='add'?'selected':''} onClick={()=>setGstMode('add')}>Add GST</button><button className={gstMode==='remove'?'selected':''} onClick={()=>setGstMode('remove')}>Remove GST</button></div><div className="two"><Field label="Amount (₹)"><input type="number" min="0" value={gstAmount} onChange={e=>setGstAmount(e.target.value)}/></Field><Field label="GST rate (%)"><select value={gstRate} onChange={e=>setGstRate(e.target.value)}>{['0','5','12','18','28'].map(v=><option key={v} value={v}>{v}%</option>)}</select></Field></div><div className="stats"><Stat label="GST amount" value={`₹${tax.toFixed(2)}`}/><Stat label={gstMode==='add'?'Total including GST':'Amount before GST'} value={`₹${total.toFixed(2)}`}/></div></>;}
    case 'unit-converter': {const units:any={length:{km:1000,m:1,cm:.01,mm:.001,mi:1609.344,ft:.3048,in:.0254},weight:{kg:1000,g:1,mg:.001,lb:453.59237,oz:28.3495},temperature:{C:'C',F:'F',K:'K'}};const names:any={length:['km','m','cm','mm','mi','ft','in'],weight:['kg','g','mg','lb','oz'],temperature:['C','F','K']};const convert=(v:number)=>{if(unitType==='temperature'){const c=unitFrom==='C'?v:unitFrom==='F'?(v-32)*5/9:v-273.15;return unitTo==='C'?c:unitTo==='F'?c*9/5+32:c+273.15;}return v*units[unitType][unitFrom]/units[unitType][unitTo];};return <><Field label="Measurement"><select value={unitType} onChange={e=>{const t=e.target.value;setUnitType(t);setUnitFrom(names[t][0]);setUnitTo(names[t][1]);}}><option value="length">Length</option><option value="weight">Weight</option><option value="temperature">Temperature</option></select></Field><div className="two"><Field label="Value"><input type="number" value={unitValue} onChange={e=>setUnitValue(e.target.value)}/></Field><Field label="From"><select value={unitFrom} onChange={e=>setUnitFrom(e.target.value)}>{names[unitType].map((u:string)=><option key={u}>{u}</option>)}</select></Field><Field label="To"><select value={unitTo} onChange={e=>setUnitTo(e.target.value)}>{names[unitType].map((u:string)=><option key={u}>{u}</option>)}</select></Field></div><div className="result"><strong>{unitValue!==''?convert(Number(unitValue)).toLocaleString(undefined,{maximumFractionDigits:8}):'—'} {unitTo}</strong><span>Converted result</span></div></>;}
    case 'json-formatter': {let result='',error='';try{if(text.trim())result=JSON.stringify(JSON.parse(text),null,jsonMode==='pretty'?2:0);}catch(e){error=e instanceof Error?e.message:'Invalid JSON';}return <><Field label="JSON input"><textarea rows={9} value={text} onChange={e=>setText(e.target.value)} placeholder='{"name":"Dhananjay","tools":15}'/></Field><div className="segmented"><button className={jsonMode==='pretty'?'selected':''} onClick={()=>setJsonMode('pretty')}>Pretty</button><button className={jsonMode==='minify'?'selected':''} onClick={()=>setJsonMode('minify')}>Minify</button></div><div className={`json-result ${error?'error':''}`}>{error||result||'Formatted output will appear here.'}</div>{result&&!error&&<button className="button secondary" onClick={()=>{void navigator.clipboard.writeText(result);setStatus('Copied formatted JSON.')}}>Copy output</button>}</>;}
  }
}
function QRCodePreview({value}:{value:string}) {const [src,setSrc]=useState('');useEffect(()=>{let live=true;QRCode.toDataURL(value,{width:300,margin:2}).then(v=>{if(live)setSrc(v)}).catch(()=>{if(live)setSrc('')});return()=>{live=false};},[value]);return src?<img src={src} alt="Generated QR code" width="190" height="190"/>:<span>Generating…</span>;}
function Stat({label,value}:{label:string;value:string|number}) {return <div className="stat"><span>{label}</span><strong>{value}</strong></div>;}
function PasswordTool(p:any) {const [password,setPassword]=useState('');function generate(){let chars=(p.upper?'ABCDEFGHJKLMNPQRSTUVWXYZ':'')+(p.lower?'abcdefghijkmnopqrstuvwxyz':'')+(p.numbers?'23456789':'')+(p.symbols?'!@#$%^&*()-_=+[]{}?':'');if(!chars)return p.setStatus('Select at least one character type.');const bytes=new Uint32Array(p.length);crypto.getRandomValues(bytes);setPassword(Array.from(bytes,b=>chars[b%chars.length]).join(''));p.setStatus('Password generated locally.');}return <><Field label={`Password length · ${p.length}`}><input type="range" min="8" max="64" value={p.length} onChange={e=>p.setLength(Number(e.target.value))}/></Field><div className="checkgrid">{[['Uppercase',p.upper,p.setUpper],['Lowercase',p.lower,p.setLower],['Numbers',p.numbers,p.setNumbers],['Symbols',p.symbols,p.setSymbols]].map(([name,val,set]:any)=><label key={name}><input type="checkbox" checked={val} onChange={e=>set(e.target.checked)}/>{name}</label>)}</div><button className="button primary" onClick={generate}>Generate password <Sparkles size={16}/></button>{password&&<div className="password-output"><code>{password}</code><button className="button secondary" onClick={()=>{void navigator.clipboard.writeText(password);p.setStatus('Password copied.')}}>Copy</button></div>}<p className="hint">Use a password manager to store generated passwords. This tool does not transmit or save them.</p></>;}

export default function Home() {
  const [selected,setSelected]=useState<ToolId>('image-compressor');
  const [search,setSearch]=useState('');
  const [category,setCategory]=useState('All tools');
  const [mobileOpen,setMobileOpen]=useState(false);
  const [status,setStatus]=useState('');
  const filtered=useMemo(()=>tools.filter(t=>(category==='All tools'||t.category===category)&&(`${t.name} ${t.description} ${t.keywords}`.toLowerCase().includes(search.toLowerCase()))),[search,category]);
  const active=tools.find(t=>t.id===selected)!;
  const categories=['All tools','Images','PDF','Calculators','Everyday','Developer'];
  return <main>
    <header className="topbar"><a className="brand" href="#"><span className="brand-mark">D</span><span>Dhananjay<span className="brand-dot">.group</span></span></a><nav><a href="#tools">All tools</a><a href="#privacy">Privacy</a><a href="#about">About</a></nav><button className="mobile-menu" onClick={()=>setMobileOpen(!mobileOpen)} aria-label="Toggle menu">{mobileOpen?<X/>:<Menu/>}</button></header>
    {mobileOpen&&<div className="mobile-nav"><a href="#tools" onClick={()=>setMobileOpen(false)}>All tools</a><a href="#privacy" onClick={()=>setMobileOpen(false)}>Privacy</a><a href="#about" onClick={()=>setMobileOpen(false)}>About</a></div>}
    <section className="hero"><div className="eyebrow"><span className="eyebrow-dot"/> FREE ONLINE UTILITIES</div><h1>Everything useful.<br/><span>Nothing complicated.</span></h1><p>Simple tools for everyday tasks. Fast, free and designed to keep your files on your device.</p><a className="button primary hero-button" href="#tools">Explore all tools <ArrowRight size={17}/></a><div className="trust-row"><span><ShieldCheck size={15}/> Browser-based processing</span><span><Check size={15}/> No sign-up required</span></div></section>
    <section className="ad-slot" aria-label="Advertisement"><span>ADVERTISEMENT</span><div>Ad space · Ads may appear here after publisher setup</div></section>
    <section className="tools-section" id="tools"><div className="section-heading"><div><div className="eyebrow">THE TOOLBOX</div><h2>What do you need to do?</h2><p>Pick a tool and get it done in seconds.</p></div><div className="tool-count">15 TOOLS</div></div>
      <div className="searchbar"><Search size={19}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tools, e.g. compress PDF…"/><kbd>⌘ K</kbd></div>
      <div className="category-row">{categories.map(c=><button key={c} className={category===c?'category active':'category'} onClick={()=>setCategory(c)}>{c}</button>)}</div>
      <div className="workspace"><aside className="tool-list">{filtered.map(t=>{const Icon=t.icon;return <button key={t.id} className={`tool-link ${selected===t.id?'current':''}`} onClick={()=>{setSelected(t.id);setStatus('');}}><span className="tool-icon"><Icon size={18}/></span><span>{t.name}</span><ArrowRight size={14} className="tool-arrow"/></button>})}{filtered.length===0&&<p className="empty">No tools match your search.</p>}</aside>
        <article className="tool-card"><div className="tool-card-top"><div className="large-icon"><active.icon size={23}/></div><span className="category-label">{active.category}</span></div><h3>{active.name}</h3><p className="tool-description">{active.description}</p><div className="tool-form"><ToolPanel key={selected} id={selected} onStatus={setStatus}/></div>{status&&<div className="status" role="status">{status}</div>}<div className="local-note"><ShieldCheck size={16}/> Your files are processed locally in your browser.</div></article>
      </div>
    </section>
    <section className="ad-slot lower-ad" aria-label="Advertisement"><span>ADVERTISEMENT</span><div>Ad space · Publisher setup required</div></section>
    <section className="info-section" id="privacy"><div className="info-icon"><ShieldCheck/></div><div><h2>Your files stay yours.</h2><p>For supported tools, processing happens directly in your browser. Your selected files are not uploaded to Dhananjay.group. Avoid using this site on shared devices for sensitive documents, and close the tab when finished.</p></div></section>
    <section className="about-section" id="about"><h2>Useful tools, without the clutter.</h2><p>Dhananjay.group brings everyday file utilities, calculators and developer helpers together in one simple place. No account, no unnecessary steps.</p></section>
    <footer><a className="brand" href="#"><span className="brand-mark">D</span><span>Dhananjay<span className="brand-dot">.group</span></span></a><span>© {new Date().getFullYear()} Dhananjay.group</span><div><a href="mailto:hello@dhananjay.group">Contact</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></div></footer>
  </main>;
}
