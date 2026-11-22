const {spawnSync}=require('child_process');const path=require('path');
test('insurance, blood bank and bed route modules pass syntax checks',()=>{for(const file of ['insurance.js','bloodbank.js','beds.js']){const r=spawnSync(process.execPath,['--check',path.join(__dirname,'../routes',file)],{encoding:'utf8'});expect(r.status).toBe(0);}});
