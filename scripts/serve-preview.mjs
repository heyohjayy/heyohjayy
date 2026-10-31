import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../site/',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.gif':'image/gif','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 try{
  const route=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const assetRoute=route.startsWith('/readme-assets/');
  const base=assetRoute?fileURLToPath(new URL('../assets/',import.meta.url)):root;
  const relative=assetRoute?route.slice('/readme-assets/'.length):'.'+(route==='/'?'/index.html':route);
  const filename=path.resolve(base,relative);
  if(!filename.startsWith(base)){res.writeHead(403).end();return;}
  const bytes=await fs.readFile(filename);res.writeHead(200,{'Content-Type':types[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404).end('Not found');}
});
const port=Number(process.env.PREVIEW_PORT||8768);
server.listen(port,'127.0.0.1',()=>console.log(`Local-only preview: http://127.0.0.1:${port}`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
