const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const {spawn}=require('child_process');
(async()=>{
  const FPS=30;
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1080,height:1920}});
  await p.goto('file://'+__dirname+'/index.html?dev='+(process.env.DEV||'ios')); await p.evaluate(()=>document.fonts.ready);
  const D=await p.evaluate(()=>DURATION); const N=Math.round(D*FPS);
  const ff=spawn('ffmpeg',['-loglevel','error','-y','-f','image2pipe','-framerate',String(FPS),'-c:v','mjpeg','-i','-',
    '-f','lavfi','-i','anullsrc=r=44100:cl=stereo','-shortest',
    '-c:v','libx264','-preset','slow','-crf','18','-pix_fmt','yuv420p','-profile:v','high','-movflags','+faststart',
    '-c:a','aac','-b:a','64k','../IPPO-'+(process.env.DEV==='and'?'Samsung':'iPhone')+'-ornatish.mp4'],{stdio:['pipe','inherit','inherit']});
  for(let f=0;f<N;f++){
    await p.evaluate(t=>render(t),f/FPS);
    const buf=await p.screenshot({type:'jpeg',quality:95});
    if(!ff.stdin.write(buf)) await new Promise(r=>ff.stdin.once('drain',r));
    if(f%150===0) console.log('frame',f,'/',N);
  }
  ff.stdin.end(); await new Promise(r=>ff.on('close',r)); await b.close(); console.log('done');
})();
