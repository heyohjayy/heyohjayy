// Render the local WebGL sky into a script-free animation for the GitHub README.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--enable-unsafe-swiftshader']});
 for(const theme of ['light','dark']){
 const folder=path.join(root,'tmp/readme-sky',theme);await fs.mkdir(folder,{recursive:true});
 const page=await browser.newPage({viewport:{width:1200,height:1002},colorScheme:theme});
 await page.goto(process.env.PREVIEW_URL||'http://127.0.0.1:8768/');
 await page.waitForFunction(()=>document.documentElement.dataset.skyState==='webgl');
 await page.locator('#preview-pause').click();
 for(let i=0;i<72;i++){
   // More visible cloud travel; birds keep flying forward on a separate clock.
   const time=28*(1-Math.cos(2*Math.PI*i/72));
   const url=await page.locator('#sky').evaluate((canvas,{time,index})=>{
     const gl=canvas.getContext('webgl'),program=gl.getParameter(gl.CURRENT_PROGRAM);
     gl.uniform1f(gl.getUniformLocation(program,'u_time'),time);
     gl.uniform1f(gl.getUniformLocation(program,'u_sceneTime'),index*.2);
     gl.uniform1f(gl.getUniformLocation(program,'u_scenePeriod'),14.4);
     gl.drawArrays(gl.TRIANGLES,0,6);
     return canvas.toDataURL('image/png');
   },{time,index:i});
   await fs.writeFile(path.join(folder,`sky-${String(i).padStart(3,'0')}.png`),Buffer.from(url.split(',')[1],'base64'));
 }
 await page.close();console.log(`Rendered 72 ${theme} sky frames with ${theme==='light'?'birds':'stars'}.`);
 }
 await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
