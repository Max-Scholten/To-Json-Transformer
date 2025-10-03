const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const projectsDir = path.join(root, 'json-projects');

function sendJSON(res, code, obj){
  res.writeHead(code, {'Content-Type':'application/json'});
  res.end(JSON.stringify(obj));
}

function listFolders(){
  try{
    const entries = fs.readdirSync(projectsDir, { withFileTypes: true });
    return entries.filter(e=>e.isDirectory()).map(e=>e.name);
  }catch(e){
    return [];
  }
}

function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

const server = http.createServer((req,res)=>{
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'GET' && url.pathname === '/api/folders'){
    sendJSON(res,200, { folders: listFolders() });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/save'){
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', ()=>{
      try{
        const { folder, fileName, payload } = JSON.parse(body);
        ensureDir(projectsDir);
        const outName = fileName;
        const outPath = folder ? path.join(projectsDir, outName) : path.join(projectsDir, outName);
        fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
        sendJSON(res,200,{ path: outPath });
      }catch(e){
        sendJSON(res,500, { error: e.message });
      }
    });
    return;
  }

  // serve static files from this folder
  let pathname = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = path.join(root, pathname.replace(/^\//,''));
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()){
    const ext = path.extname(filePath).toLowerCase();
    const map = { '.html':'text/html', '.css':'text/css', '.js':'application/javascript', '.json':'application/json' };
    res.writeHead(200, { 'Content-Type': map[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
    return;
  }
  res.writeHead(404); res.end('Not Found');
});

const port = process.env.PORT || 3000;
server.listen(port, ()=> console.log(`Save server running at http://localhost:${port}`));
