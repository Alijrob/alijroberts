#!/usr/bin/env python3
import http.server, os, sys

PORT = 8888
SAVE_PATH = '/root/ajr-central/server/uploads/raven.png'

HTML = b"""<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Upload</title>
<style>body{background:#0d0d0d;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh}
.c{background:#1c1c1c;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:2.5rem;max-width:380px;width:100%;text-align:center}
h1{font-size:1rem;letter-spacing:.1em;text-transform:uppercase;margin-bottom:1.5rem}
input[type=file]{display:none}label{display:block;border:2px dashed rgba(255,255,255,.2);border-radius:8px;padding:2rem;cursor:pointer;font-size:.85rem;color:rgba(255,255,255,.5);margin-bottom:1.5rem}
label:hover{border-color:rgba(255,255,255,.5);color:#fff}
button{background:#fff;color:#0d0d0d;border:none;border-radius:8px;padding:.75rem 2rem;font-size:1rem;font-weight:700;cursor:pointer;width:100%}
button:disabled{opacity:.3}#s{margin-top:1rem;font-size:.85rem}.ok{color:#4ade80}.err{color:#f87171}</style></head>
<body><div class="c"><h1>Upload RAVEN Image</h1>
<label id="lbl" for="f">Browse or drag image here</label>
<input type="file" id="f" accept="image/*">
<button id="btn" disabled>Upload</button><div id="s"></div></div>
<script>
const f=document.getElementById('f'),lbl=document.getElementById('lbl'),btn=document.getElementById('btn'),s=document.getElementById('s');
f.addEventListener('change',()=>{if(f.files[0]){lbl.textContent=f.files[0].name;btn.disabled=false;}});
btn.addEventListener('click',async()=>{if(!f.files[0])return;btn.disabled=true;btn.textContent='Uploading...';
const fd=new FormData();fd.append('file',f.files[0]);
try{const r=await fetch('/',{method:'POST',body:fd});const t=await r.text();
if(r.ok){s.innerHTML='<span class="ok">'+t+'</span>';btn.textContent='Done';}
else{s.innerHTML='<span class="err">'+t+'</span>';btn.disabled=false;btn.textContent='Upload';}}
catch(e){s.innerHTML='<span class="err">Failed</span>';btn.disabled=false;btn.textContent='Upload';}});
</script></body></html>"""

class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass  # suppress request logs

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        self.wfile.write(HTML)

    def do_POST(self):
        ct = self.headers.get('Content-Type', '')
        if 'boundary=' not in ct:
            self.respond(400, 'Bad request')
            return
        boundary = ct.split('boundary=')[1].strip().encode()
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length)
        for part in body.split(b'--' + boundary):
            if b'filename=' not in part:
                continue
            sep = part.find(b'\r\n\r\n')
            if sep == -1:
                continue
            data = part[sep + 4:]
            if data.endswith(b'\r\n'):
                data = data[:-2]
            os.makedirs(os.path.dirname(SAVE_PATH), exist_ok=True)
            with open(SAVE_PATH, 'wb') as fp:
                fp.write(data)
            self.respond(200, 'Saved — you can close this tab.')
            print(f'[upload-server] Saved to {SAVE_PATH}')
            return
        self.respond(400, 'No file found in request')

    def respond(self, code, text):
        body = text.encode()
        self.send_response(code)
        self.send_header('Content-Type', 'text/plain')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

if __name__ == '__main__':
    server = http.server.HTTPServer(('0.0.0.0', PORT), Handler)
    print(f'Upload server running on port {PORT}')
    print(f'Go to http://72.61.2.245:{PORT}')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nStopped.')
        sys.exit(0)
