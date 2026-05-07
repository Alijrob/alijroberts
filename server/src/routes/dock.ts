import type { FastifyInstance } from 'fastify';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config.js';

const PAGE = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Upload</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{background:#0d0d0d;color:#fff;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh}.card{background:#1c1c1c;border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:2.5rem;max-width:400px;width:100%;text-align:center}h1{font-size:1.1rem;letter-spacing:.1em;text-transform:uppercase;margin-bottom:2rem}input[type=file]{display:none}label{display:block;border:2px dashed rgba(255,255,255,0.2);border-radius:8px;padding:2rem;cursor:pointer;font-size:.85rem;color:rgba(255,255,255,.5);margin-bottom:1.5rem}label:hover{border-color:rgba(255,255,255,.5);color:#fff}button{background:#fff;color:#0d0d0d;border:none;border-radius:8px;padding:.75rem 2rem;font-size:1rem;font-weight:700;cursor:pointer;width:100%}button:disabled{opacity:.3}#s{margin-top:1rem;font-size:.85rem}.ok{color:#4ade80}.err{color:#f87171}</style>
</head><body><div class="card"><h1>Upload RAVEN Image</h1>
<label id="lbl" for="f">Browse or drag image here</label>
<input type="file" id="f" accept="image/*"/>
<button id="btn" disabled>Upload</button>
<div id="s"></div></div>
<script>
const f=document.getElementById('f'),lbl=document.getElementById('lbl'),btn=document.getElementById('btn'),s=document.getElementById('s');
f.addEventListener('change',()=>{if(f.files[0]){lbl.textContent=f.files[0].name;btn.disabled=false;}});
btn.addEventListener('click',async()=>{if(!f.files[0])return;btn.disabled=true;btn.textContent='Uploading…';
const fd=new FormData();fd.append('image',f.files[0]);
try{const r=await fetch('/api/dock/upload',{method:'POST',body:fd});const d=await r.json();
if(d.ok){s.innerHTML='<span class="ok">Saved as '+d.saved+' — done.</span>';btn.textContent='Done';}
else{s.innerHTML='<span class="err">'+(d.error||'Error')+'</span>';btn.disabled=false;btn.textContent='Upload';}}
catch(e){s.innerHTML='<span class="err">Failed</span>';btn.disabled=false;btn.textContent='Upload';}});
</script></body></html>`;

export async function dockRoutes(app: FastifyInstance) {
  app.get('/dock', (_req, reply) => {
    reply.type('text/html').send(PAGE);
  });

  app.post('/api/dock/upload', async (req, reply) => {
    const parts = req.parts();
    for await (const part of parts) {
      if (part.type === 'file' && part.fieldname === 'image') {
        await fs.mkdir(config.uploadDir, { recursive: true });
        const ext = path.extname(part.filename) || '.png';
        const filename = `raven${ext}`;
        await fs.writeFile(path.join(config.uploadDir, filename), await part.toBuffer());
        return { ok: true, saved: filename };
      }
    }
    return reply.code(400).send({ error: 'No image field found' });
  });
}
