import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config({ path: '/home/dev1/cassi-e2e/.env.test', quiet: true });
const BASE = process.env.BASE_URL;

const b = await chromium.launch();
const ctx = await b.newContext({
  baseURL: BASE,
  storageState: '/home/dev1/cassi-e2e/playwright/.auth/usuario.json',
  locale: 'pt-BR',
  viewport: { width: 1440, height: 900 },
});
const page = await ctx.newPage();
const reqs = [];
page.on('request', r => {
  const u = r.url();
  if (/centralTasks|process-management|workflowView/i.test(u))
    reqs.push({ m: r.method(), u: u.replace(BASE, '').slice(0, 220), body: r.postData()?.slice(0,400) });
});
await page.goto('/portal/p/1/pagecentraltask', { waitUntil: 'domcontentloaded' });
await page.getByRole('heading', { name: 'Central de tarefas' }).waitFor({ timeout: 40000 });
await page.getByRole('link', { name: 'Mais opções' }).click();
await page.getByRole('link', { name: /^Solicitações/ }).click();
await page.getByRole('link', { name: /^Minhas solicitações/ }).click();
await page.waitForTimeout(6000);
await page.screenshot({ path: '/home/dev1/cassi-e2e/tmp-cancel/central-minhas-solicitacoes.png', fullPage: true });

// cards
const cards = await page.evaluate(() => {
  return [...document.querySelectorAll('task-card-component')].slice(0, 6).map(c => ({
    text: c.textContent.trim().replace(/\s+/g, ' ').slice(0, 220),
    buttons: [...c.querySelectorAll('button, a')].map(e => ({ tag: e.tagName, id: e.id, cls: e.className.toString().slice(0,60), text: e.textContent.trim().slice(0,40), attrs: [...e.attributes].filter(a=>a.name.startsWith('data-')).map(a=>a.name) })),
  }));
});
console.log('CARDS:', JSON.stringify(cards, null, 1));
console.log('REQS:', JSON.stringify(reqs.filter(r=>/getTasks|requests/i.test(r.u)), null, 1));
// html de um card inteiro
const cardHtml = await page.evaluate(() => document.querySelector('task-card-component')?.outerHTML?.slice(0, 3000));
console.log('CARD HTML:', cardHtml);
await b.close();
