const { spawnSync } = require('child_process');
const files=['routes/cases.js','routes/payments.js','routes/discharge.js','utils/clinicalRecordAccess.js'];
test('clinical route modules pass Node syntax checks',()=>{for(const file of files){const result=spawnSync(process.execPath,['--check',require('path').join(__dirname,'..',file)],{encoding:'utf8'});expect(result.status).toBe(0);}});
