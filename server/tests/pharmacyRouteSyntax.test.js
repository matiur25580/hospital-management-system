const {spawnSync}=require('child_process');const path=require('path');
test('pharmacy route passes syntax validation',()=>{const r=spawnSync(process.execPath,['--check',path.join(__dirname,'../routes/pharmacy.js')],{encoding:'utf8'});expect(r.status).toBe(0);});
