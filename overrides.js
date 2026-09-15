(() => {
  const data = window.CAPRICHE_DATA;
  if (!data) return;

  const dayNames = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  data.content.forEach(item => {
    const d = new Date(`${item.Data}T12:00:00`);
    d.setDate(d.getDate() + 3);
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    item.Data = `${y}-${m}-${day}`;
    item.Dia = dayNames[d.getDay()];
  });

  data.campaigns.period = '18/09/2026 a 18/10/2026';
  data.campaigns.stages[0].period = '18–24/09';
  data.campaigns.stages[1].period = '25/09–08/10';
  data.campaigns.stages[2].period = '09–18/10';
})();
