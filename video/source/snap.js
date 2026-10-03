const {chromium}=require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1080,height:1920}});
  p.on('pageerror',e=>console.log('ERR',e.message)); p.on('console',m=>console.log('LOG',m.text()));
  await p.goto('file://'+__dirname+'/index.html?dev='+(process.env.DEV||'ios')); await p.evaluate(()=>document.fonts.ready);
  const ts=process.argv.slice(2).map(Number);
  for(const t of ts){await p.evaluate(t=>render(t),t); await p.screenshot({path:`snap/${process.env.DEV||'ios'}_${t}.png`});}
  await b.close();
})();
