import { chromium } from '@playwright/test';
import 'dotenv/config';
const BASE=process.env.BASE_URL, OUT='/home/dev1/.claude/jobs/739913d6/tmp';
const b = await chromium.launch(); let ok=0;
for (let i=1;i<=3;i++){
  const ctx = await b.newContext({ baseURL:BASE, storageState:`${OUT}/state-ptbr.json`, locale:'pt-BR' });
  const p = await ctx.newPage();
  try{
    await p.goto('/portal/p/1/acompanhamentoContrato',{waitUntil:'domcontentloaded'});
    await p.getByRole('status').filter({hasText:/Mostrando/}).first().waitFor({timeout:40000});
    const t=(await p.getByRole('status').filter({hasText:/Mostrando/}).first().innerText()).trim();
    const m=t.match(/de (\d+) registros/); if(m && +m[1]>0) ok++;
  }catch{}
  await ctx.close();
}
await b.close();
process.exit(ok===3 ? 0 : 1);
