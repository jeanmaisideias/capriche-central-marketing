(() => {
  const DATA = window.CAPRICHE_DATA;
  const KEY = 'capriche-central-marketing-v1';

  const defaultState = {
    contentClient: Object.fromEntries(DATA.content.map(x => [x.ID, x['Status Luciana'] || 'A fazer'])),
    contentAgency: Object.fromEntries(DATA.content.map(x => [x.ID, x['Status Mais Ideias'] || 'Planejado'])),
    materialStatus: Object.fromEntries(DATA.materials.map(x => [x.ID, x.Status || 'Pendente'])),
    materialNotes: Object.fromEntries(DATA.materials.map(x => [x.ID, x['Observação da Luciana'] || ''])),
    metrics: {spend:0, reach:0, clicks:0, conversations:0, leads:0, opportunities:0},
    learningNotes: '',
    ideas: DATA.ideas,
    campaignStage: 0,
  };

  function clone(v){ return JSON.parse(JSON.stringify(v)); }
  function loadState(){
    try{
      const stored = JSON.parse(localStorage.getItem(KEY) || '{}');
      return {
        ...clone(defaultState),
        ...stored,
        contentClient:{...defaultState.contentClient,...(stored.contentClient||{})},
        contentAgency:{...defaultState.contentAgency,...(stored.contentAgency||{})},
        materialStatus:{...defaultState.materialStatus,...(stored.materialStatus||{})},
        materialNotes:{...defaultState.materialNotes,...(stored.materialNotes||{})},
        metrics:{...defaultState.metrics,...(stored.metrics||{})},
        ideas:Array.isArray(stored.ideas) ? stored.ideas : clone(defaultState.ideas),
      };
    }catch(e){ return clone(defaultState); }
  }
  let state = loadState();
  function save(){ localStorage.setItem(KEY, JSON.stringify(state)); updateGlobalProgress(); }

  const money = n => Number.isFinite(+n) ? (+n).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) : '—';
  const pct = (a,b) => b ? Math.round((a/b)*100) : 0;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const dateFmt = iso => {
    const [y,m,d] = iso.split('-');
    return `${d}/${m}`;
  };
  const fullDate = iso => {
    const d = new Date(`${iso}T12:00:00`);
    return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});
  };

  // NAV
  function showView(name){
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === `view-${name}`));
    document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === name));
    window.scrollTo({top:0,behavior:'smooth'});
    if(name==='conteudo') renderContent();
    if(name==='materiais') renderMaterials();
    if(name==='campanhas') renderCampaigns();
    if(name==='resultados') renderResults();
    if(name==='ideias') renderIdeas();
    if(name==='dashboard') renderDashboard();
  }
  document.querySelectorAll('[data-view]').forEach(btn => btn.addEventListener('click',()=>showView(btn.dataset.view)));
  document.querySelectorAll('[data-go]').forEach(btn => btn.addEventListener('click',()=>showView(btn.dataset.go)));

  // GLOBAL PROGRESS
  function updateGlobalProgress(){
    const published = DATA.content.filter(x => state.contentAgency[x.ID] === 'Publicado').length;
    const sent = DATA.materials.filter(x => state.materialStatus[x.ID] === 'Enviado').length;
    const progress = Math.round(((published / DATA.content.length) * .65 + (sent / DATA.materials.length) * .35) * 100);
    const bar = document.getElementById('cycleProgress');
    const label = document.getElementById('cycleProgressLabel');
    if(bar) bar.style.width = `${progress}%`;
    if(label) label.textContent = `${progress}%`;
  }

  // DASHBOARD
  function renderDashboard(){
    const published = DATA.content.filter(x => state.contentAgency[x.ID] === 'Publicado').length;
    const sent = DATA.materials.filter(x => state.materialStatus[x.ID] === 'Enviado').length;
    document.getElementById('dashPublished').textContent = `${published}/${DATA.content.length}`;
    document.getElementById('dashMaterials').textContent = `${sent}/${DATA.materials.length}`;
    document.getElementById('dashContentProgress').style.width = `${pct(published,DATA.content.length)}%`;
    document.getElementById('dashMaterialProgress').style.width = `${pct(sent,DATA.materials.length)}%`;

    const stage = DATA.campaigns.stages[state.campaignStage] || DATA.campaigns.stages[0];
    document.getElementById('campaignStageLabel').textContent = stage.name;
    document.getElementById('campaignStagePeriod').textContent = stage.period;

    const pending = DATA.materials
      .filter(x => state.materialStatus[x.ID] !== 'Enviado' && x.Prioridade === 'Alta')
      .slice(0,3);
    const nextActions = document.getElementById('nextActions');
    nextActions.innerHTML = pending.length ? pending.map(x=>`
      <div class="action-item">
        <span class="action-priority"></span>
        <div><strong>${esc(x.Material)}</strong><span>${esc(x['Para que será usado'])}</span></div>
        <button data-go-materials>Resolver →</button>
      </div>
    `).join('') : `<div class="empty-state">Nenhum material prioritário pendente.</div>`;
    nextActions.querySelectorAll('[data-go-materials]').forEach(b=>b.addEventListener('click',()=>showView('materiais')));

    const queue = DATA.content.filter(x => state.contentAgency[x.ID] !== 'Publicado').slice(0,4);
    document.getElementById('nextContents').innerHTML = queue.map(x=>`
      <div class="compact-item">
        <span class="format-pill ${String(x['Formato principal']).toLowerCase()}">${esc(x['Formato principal'])}</span>
        <div><strong>${esc(x['Gancho / título'])}</strong><span>${dateFmt(x.Data)} · ${esc(x.Horário)}</span></div>
        <button data-open-content="${x.ID}">Abrir →</button>
      </div>
    `).join('');
    document.querySelectorAll('[data-open-content]').forEach(b=>b.addEventListener('click',()=>openContentModal(b.dataset.openContent)));
    updateGlobalProgress();
  }

  // CONTENT
  const searchEl = document.getElementById('contentSearch');
  const filterFormat = document.getElementById('filterFormat');
  const filterStatus = document.getElementById('filterStatus');
  const filterMIStatus = document.getElementById('filterMIStatus');

  [...new Set(DATA.content.map(x=>x['Formato principal']))].forEach(fmt=>{
    const o=document.createElement('option'); o.value=fmt; o.textContent=fmt; filterFormat.appendChild(o);
  });
  [searchEl,filterFormat,filterStatus,filterMIStatus].forEach(el=>el?.addEventListener('input',renderContent));
  [filterFormat,filterStatus,filterMIStatus].forEach(el=>el?.addEventListener('change',renderContent));

  function renderContent(){
    const q=(searchEl.value||'').toLowerCase().trim();
    const fmt=filterFormat.value, st=filterStatus.value, mi=filterMIStatus.value;
    const list=DATA.content.filter(x=>{
      const hay=[x.Tema,x['Gancho / título'],x.Pilar,x['Formato principal'],x['Copy base']].join(' ').toLowerCase();
      return (!q||hay.includes(q)) && (!fmt||x['Formato principal']===fmt) && (!st||state.contentClient[x.ID]===st) && (!mi||state.contentAgency[x.ID]===mi);
    });
    const grid=document.getElementById('contentGrid');
    grid.innerHTML=list.length?list.map(x=>`
      <article class="content-card">
        <div class="content-top">
          <div><span class="date-badge">${fullDate(x.Data)} · ${esc(x.Dia)}</span><div class="theme">${esc(x.Tema)}</div></div>
          <span class="format-pill ${String(x['Formato principal']).toLowerCase()}">${esc(x['Formato principal'])}</span>
        </div>
        <h3>${esc(x['Gancho / título'])}</h3>
        <p>${esc(x.Pilar)}</p>
        <div class="content-footer">
          <label>Status Luciana
            <select class="inline-select" data-client-status="${x.ID}">
              ${['A fazer','Material enviado','Aprovado'].map(v=>`<option ${state.contentClient[x.ID]===v?'selected':''}>${v}</option>`).join('')}
            </select>
          </label>
          <label>Status Mais Ideias
            <select class="inline-select" data-agency-status="${x.ID}">
              ${['Planejado','Em produção','Agendado','Publicado'].map(v=>`<option ${state.contentAgency[x.ID]===v?'selected':''}>${v}</option>`).join('')}
            </select>
          </label>
          <button class="card-open" data-open-content="${x.ID}">Ver detalhes e copy</button>
        </div>
      </article>
    `).join(''):`<div class="empty-state">Nenhum conteúdo encontrado com esses filtros.</div>`;

    grid.querySelectorAll('[data-client-status]').forEach(s=>s.addEventListener('change',e=>{state.contentClient[e.target.dataset.clientStatus]=e.target.value;save();renderDashboard();updateContentKpi();}));
    grid.querySelectorAll('[data-agency-status]').forEach(s=>s.addEventListener('change',e=>{state.contentAgency[e.target.dataset.agencyStatus]=e.target.value;save();renderDashboard();updateContentKpi();}));
    grid.querySelectorAll('[data-open-content]').forEach(b=>b.addEventListener('click',()=>openContentModal(b.dataset.openContent)));
    updateContentKpi();
  }
  function updateContentKpi(){
    const published=DATA.content.filter(x=>state.contentAgency[x.ID]==='Publicado').length;
    document.getElementById('contentDoneKpi').textContent=`${pct(published,DATA.content.length)}%`;
  }

  function openContentModal(id){
    const x=DATA.content.find(v=>v.ID===id); if(!x)return;
    document.getElementById('modalContent').innerHTML=`
      <span class="eyebrow">${fullDate(x.Data)} · ${esc(x['Formato principal'])} · ${esc(x.Pilar)}</span>
      <h2>${esc(x['Gancho / título'])}</h2>
      <p class="modal-lead">${esc(x.Tema)}</p>
      <div class="detail-grid">
        <div class="detail-block"><span>Horário sugerido</span><p>${esc(x.Horário)}</p></div>
        <div class="detail-block"><span>Status</span><p>${esc(state.contentClient[id])} · ${esc(state.contentAgency[id])}</p></div>
        <div class="detail-block full"><span>O que a Capriche precisa enviar ou gravar</span><p>${esc(x['O que a Capriche precisa enviar ou gravar'])}</p></div>
        <div class="detail-block full"><span>Stories do dia</span><p>${esc(x['Stories do dia'])}</p></div>
        <div class="detail-block full copy-block"><span>Copy base</span><p>${esc(x['Copy base'])}</p></div>
        <div class="detail-block full"><span>CTA</span><p>${esc(x.CTA)}</p></div>
      </div>
    `;
    document.getElementById('contentModal').classList.add('open');
  }
  document.querySelector('[data-close-modal]').addEventListener('click',()=>document.getElementById('contentModal').classList.remove('open'));
  document.getElementById('contentModal').addEventListener('click',e=>{if(e.target.id==='contentModal')e.currentTarget.classList.remove('open')});

  // MATERIALS
  function renderMaterials(){
    const grid=document.getElementById('materialsGrid');
    grid.innerHTML=DATA.materials.map(x=>{
      const priorityClass=x.Prioridade==='Alta'?'alta':'media';
      return `
        <article class="material-card">
          <div class="material-head">
            <div>
              <span class="eyebrow">${esc(x.ID)}</span>
              <h3>${esc(x.Material)}</h3>
            </div>
            <span class="priority-pill ${priorityClass}">${esc(x.Prioridade)}</span>
          </div>
          <p>${esc(x['Para que será usado'])}</p>
          <div class="material-status-row">
            <select class="inline-select" data-material-status="${x.ID}">
              ${['Pendente','Separando','Enviado','Não disponível'].map(v=>`<option ${state.materialStatus[x.ID]===v?'selected':''}>${v}</option>`).join('')}
            </select>
            <textarea class="material-note" data-material-note="${x.ID}" placeholder="Observação da Luciana...">${esc(state.materialNotes[x.ID]||'')}</textarea>
          </div>
          ${x['Observação Mais Ideias']?`<p class="small-note"><strong>Orientação:</strong> ${esc(x['Observação Mais Ideias'])}</p>`:''}
        </article>`;
    }).join('');

    grid.querySelectorAll('[data-material-status]').forEach(s=>s.addEventListener('change',e=>{state.materialStatus[e.target.dataset.materialStatus]=e.target.value;save();renderDashboard();updateMaterialKpi();}));
    grid.querySelectorAll('[data-material-note]').forEach(t=>t.addEventListener('change',e=>{state.materialNotes[e.target.dataset.materialNote]=e.target.value;save();}));
    updateMaterialKpi();
  }
  function updateMaterialKpi(){
    const n=DATA.materials.filter(x=>state.materialStatus[x.ID]==='Enviado').length;
    document.getElementById('materialDoneKpi').textContent=`${pct(n,DATA.materials.length)}%`;
  }

  // CAMPAIGNS
  function renderCampaigns(){
    const c=DATA.campaigns;
    document.getElementById('campaignSummary').innerHTML=[
      ['Plataforma',c.platform],['Objetivo',c.objective],['Destino',c.destination],['Região',c.region]
    ].map(([a,b])=>`<div class="summary-card"><span>${esc(a)}</span><strong>${esc(b)}</strong></div>`).join('');

    document.getElementById('campaignStages').innerHTML=c.stages.map((s,i)=>`
      <article class="stage-card ${state.campaignStage===i?'active':''}">
        <span class="stage-no">Etapa ${i+1}</span>
        <h3>${esc(s.name)}</h3>
        <span class="stage-period">${esc(s.period)}</span>
        <p>${esc(s.action)}</p>
        <p class="muted-line">${esc(s.goal)}</p>
        <div class="stage-budget"><span>Verba prevista</span><strong>${money(s.budget)}</strong></div>
        <button class="card-open" data-stage="${i}" style="margin-top:12px">${state.campaignStage===i?'Etapa atual':'Marcar como atual'}</button>
      </article>
    `).join('');
    document.querySelectorAll('[data-stage]').forEach(b=>b.addEventListener('click',()=>{state.campaignStage=+b.dataset.stage;save();renderCampaigns();renderDashboard();}));

    document.getElementById('campaignAngles').innerHTML=c.angles.map(a=>`
      <article class="angle-card">
        <span class="format-pill reel">${esc(a.format)}</span>
        <h3>${esc(a.name)}</h3>
        <div class="hook">${esc(a.hook)}</div>
        <dl>
          <div><dt>Quem queremos atingir</dt><dd>${esc(a.audience)}</dd></div>
          <div><dt>CTA</dt><dd>${esc(a.cta)}</dd></div>
          <div><dt>Material necessário</dt><dd>${esc(a.material)}</dd></div>
        </dl>
      </article>
    `).join('');
  }

  // RESULTS
  document.querySelectorAll('[data-metric]').forEach(input=>{
    input.addEventListener('input',e=>{
      state.metrics[e.target.dataset.metric]=Number(e.target.value)||0;
      save(); updateResultCalculations();
    });
  });
  document.getElementById('learningNotes').addEventListener('input',e=>{state.learningNotes=e.target.value;save()});

  function renderResults(){
    document.querySelectorAll('[data-metric]').forEach(input=>{input.value=state.metrics[input.dataset.metric]||''});
    document.getElementById('learningNotes').value=state.learningNotes||'';
    updateResultCalculations();
  }
  function divMoney(a,b){return b>0?money(a/b):'—'}
  function updateResultCalculations(){
    const m=state.metrics;
    document.getElementById('kpiCpc').textContent=divMoney(m.spend,m.clicks);
    document.getElementById('kpiConversation').textContent=divMoney(m.spend,m.conversations);
    document.getElementById('kpiCpl').textContent=divMoney(m.spend,m.leads);
    document.getElementById('kpiOpportunity').textContent=divMoney(m.spend,m.opportunities);
    document.getElementById('resultsLeadKpi').textContent=m.leads||0;
  }

  // IDEAS
  function renderIdeas(){
    const board=document.getElementById('ideaBoard');
    board.innerHTML=state.ideas.map(x=>`
      <article class="idea-card">
        <span class="eyebrow">${esc(x.pillar)}</span>
        <h3>${esc(x.title)}</h3>
        <div class="idea-meta">
          <select data-idea-status="${x.id}">
            ${['Ideia','Aprovada','Próximo mês','Descartada'].map(v=>`<option ${x.status===v?'selected':''}>${v}</option>`).join('')}
          </select>
          <button class="idea-remove" data-remove-idea="${x.id}">Remover</button>
        </div>
      </article>
    `).join('');
    board.querySelectorAll('[data-idea-status]').forEach(s=>s.addEventListener('change',e=>{
      const idea=state.ideas.find(i=>i.id===e.target.dataset.ideaStatus); if(idea){idea.status=e.target.value;save();}
    }));
    board.querySelectorAll('[data-remove-idea]').forEach(b=>b.addEventListener('click',()=>{
      state.ideas=state.ideas.filter(i=>i.id!==b.dataset.removeIdea);save();renderIdeas();
    }));
  }
  const ideaModal=document.getElementById('ideaModal');
  document.getElementById('newIdeaBtn').addEventListener('click',()=>ideaModal.classList.add('open'));
  document.querySelector('[data-close-idea]').addEventListener('click',()=>ideaModal.classList.remove('open'));
  ideaModal.addEventListener('click',e=>{if(e.target.id==='ideaModal')ideaModal.classList.remove('open')});
  document.getElementById('ideaForm').addEventListener('submit',e=>{
    e.preventDefault();
    const fd=new FormData(e.currentTarget);
    state.ideas.unshift({id:`I${Date.now()}`,title:fd.get('title'),pillar:fd.get('pillar'),status:fd.get('status')});
    save();e.currentTarget.reset();ideaModal.classList.remove('open');renderIdeas();
  });

  // EXPORT / PRINT
  document.getElementById('printBtn').addEventListener('click',()=>window.print());
  document.getElementById('exportBtn').addEventListener('click',()=>{
    const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),state},null,2)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);a.download='capriche-central-marketing-backup.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  });

  // INIT
  renderDashboard();
  renderContent();
  renderMaterials();
  renderCampaigns();
  renderResults();
  renderIdeas();
  updateGlobalProgress();
})();