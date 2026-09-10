import { abrir, ler, salvar, campos } from './.inv-lib.mjs';
const { navegador, pagina } = await abrir();

const erp = await ler(pagina, '/api/public/2.0/authorize/client/test?serviceCode=apiRESTProtheusCompras');
console.log('ERP:', erp.status, erp.corpo?.content?.description);

// catálogo de processos
const procs = await ler(pagina, '/process-management/api/v2/processes?pageSize=200');
const lista = (procs.corpo?.items ?? []).map((p) => `${p.processId} | ${p.processDescription ?? p.description ?? ''} | v${p.version ?? ''}`);
console.log('processos:', procs.status, lista.length);
for (const l of lista) console.log('   ', l);
salvar('processos.json', procs.corpo);

// desenho do faturamento
for (const pid of ['wf_faturamento_contratos']) {
  const at = await ler(pagina, `/process-management/api/v2/processes/${pid}/activities?pageSize=1000`);
  console.log(pid, 'activities:', at.status, (at.corpo?.items ?? []).length);
  salvar(`${pid}-activities.json`, at.corpo);
}

// formulários de SC que passaram pelo fluxo + nossas 8
for (const id of [95753, 95275, 95274, 96363, 96380]) {
  const f = await ler(pagina, `/process-management/api/v2/requests/${id}?expand=formFields`);
  const t = await ler(pagina, `/process-management/api/v2/requests/${id}/tasks?pageSize=100`);
  const c = campos(f.corpo);
  console.log(id, 'form:', f.status, Object.keys(c).length, 'campos; tarefas:', (t.corpo?.items ?? []).length);
  salvar(`sc-${id}-form.json`, c);
  salvar(`sc-${id}-tasks.json`, t.corpo);
}
await navegador.close();
