// Render the local WebGL sky into a script-free animation for the GitHub README.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
(async()=>{
 const folder=path.join(root,'tmp/readme-sky');await fs.mkdir(folder,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1200,height:1002},colorScheme:'light'});
 await page.goto(process.env.PREVIEW_URL||'http://127.0.0.1:8768/');
 await page.waitForFunction(()=>document.documentElement.dataset.skyState==='webgl');
 await page.locator('#preview-pause').click();
 for(let i=0;i<48;i++){
   // A cosine traversal returns smoothly to the same sky, avoiding a loop jump.
   const time=16*(1-Math.cos(2*Math.PI*i/48));
   const url=await page.locator('#sky').evaluate((canvas,time)=>{
     const gl=canvas.getContext('webgl'),program=gl.getParameter(gl.CURRENT_PROGRAM);
     gl.uniform1f(gl.getUniformLocation(program,'u_time'),time);
     gl.drawArrays(gl.TRIANGLES,0,6);
     return canvas.toDataURL('image/png');
   },time);
   await fs.writeFile(path.join(folder,`sky-${String(i).padStart(3,'0')}.png`),Buffer.from(url.split(',')[1],'base64'));
 }
 await browser.close();console.log('Rendered 48 local Shader Sky frames.');
})().catch(error=>{console.error(error);process.exit(1)});
