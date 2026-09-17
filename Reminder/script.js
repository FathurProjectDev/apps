(function(){
  const STORAGE_KEY = 'reminder_app_data_v1';
  const HARI = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

  function defaultData(){
    return {
      theme: 'light',
      categories: [
        { id: 'kelas', title: 'Piket Kelas', names: ['', '', '', ''], note: 'Dimohonkan Nama-nama yang disebutkan Dapat menjalankan dan Mengerjakan Tugas Piketnya dengan Baik.' },
        { id: 'mbg', title: 'Piket MBG', names: ['', '', '', ''], note: 'Dimohonkan Nama-nama yang disebut Nanti mengambil MBG dan Mengembalikannya Dengan Bersama-Sama Sesuai Jadwalnya.' },
        { id: 'hp', title: 'Piket HP', names: ['', '', '', ''], note: 'Dimohonkan Nama-nama yang disebutkan Dapat menjalankan dan Mengerjakan Amanah dan Tanggung jawabnya dengan Baik.' }
      ],
      besok: {
        seragam: [''],
        jadwal: ['', '', '', ''],
        tugas: [''],
        bawaan: ['Buku sesuai jadwal', 'LKS/Buku paket', 'Alat tulis'],
        catatan: ['']
      }
    };
  }

  const BESOK_FIELDS = [
    { key:'seragam', label:'👕 Seragam' },
    { key:'jadwal', label:'📚 Jadwal Pelajaran' },
    { key:'tugas', label:'📝 PR/Tugas yang dikumpulkan' },
    { key:'bawaan', label:'🎒 Yang harus dibawa' },
    { key:'catatan', label:'📌 Catatan' }
  ];

  function loadData(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return defaultData();
      const parsed = JSON.parse(raw);
      if(!parsed.categories || !Array.isArray(parsed.categories)) return defaultData();
      if(!parsed.besok || typeof parsed.besok === 'string'){
        const oldNote = typeof parsed.besok === 'string' ? parsed.besok : '';
        parsed.besok = defaultData().besok;
        if(oldNote.trim()) parsed.besok.catatan = [oldNote.trim()];
      }
      BESOK_FIELDS.forEach(f => {
        if(!Array.isArray(parsed.besok[f.key])) parsed.besok[f.key] = [''];
      });
      return parsed;
    }catch(e){
      return defaultData();
    }
  }

  function saveData(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch(e){ console.error('Gagal menyimpan data:', e); }
  }

  let state = loadData();

  // ---------- Theme ----------
  function applyTheme(){
    document.documentElement.setAttribute('data-theme', state.theme);
    const icon = state.theme === 'dark' ? '🌙' : '☀️';
    document.getElementById('themeBtnDesktop').textContent = icon;
    document.getElementById('themeBtnMobile').textContent = icon;
  }
  function toggleTheme(){
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    saveData();
  }
  document.getElementById('themeBtnDesktop').addEventListener('click', toggleTheme);
  document.getElementById('themeBtnMobile').addEventListener('click', toggleTheme);
  applyTheme();

  // ---------- Clock ----------
  function updateClock(){
    const now = new Date();
    document.getElementById('clockDate').textContent = `${HARI[now.getDay()]}, ${now.getDate()} ${BULAN[now.getMonth()]} ${now.getFullYear()}`;
    const hh = String(now.getHours()).padStart(2,'0');
    const mm = String(now.getMinutes()).padStart(2,'0');
    document.getElementById('clockTime').textContent = `${hh}.${mm}`;

    const tmr = new Date(now.getTime() + 86400000);
    document.getElementById('besokDate').textContent = `${HARI[tmr.getDay()]}, ${tmr.getDate()} ${BULAN[tmr.getMonth()]} ${tmr.getFullYear()}`;
  }
  updateClock();
  setInterval(updateClock, 15000);

  // ---------- Toast ----------
  let toastTimer;
  function showToast(msg){
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=> t.classList.remove('show'), 1500);
  }

  async function copyText(text, btn){
    try{
      await navigator.clipboard.writeText(text);
    }catch(e){
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try{ document.execCommand('copy'); }catch(err){ console.error('Copy fallback gagal', err); }
      document.body.removeChild(ta);
    }
    showToast('Tersalin ke clipboard!');
    if(btn){
      btn.classList.add('copied');
      setTimeout(()=>btn.classList.remove('copied'), 900);
    }
  }

  function buildCategoryText(cat){
    const now = new Date();
    const tanggal = `${HARI[now.getDay()]}, ${now.getDate()} ${BULAN[now.getMonth()]} ${now.getFullYear()}`;
    const names = cat.names.filter(n => n.trim() !== '');
    let text = `📌 ${cat.title.toUpperCase()}\n${tanggal}\n\n`;
    if(names.length){
      names.forEach((n,i)=>{ text += `${i+1}. ${n}\n`; });
    }else{
      text += '(belum ada nama)\n';
    }
    if(cat.note.trim()){
      text += `\n${cat.note.trim()}`;
    }
    return text;
  }

  const copySvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>`;

  function render(){
    const grid = document.getElementById('cardsGrid');
    const navList = document.getElementById('navList');
    grid.innerHTML = '';
    navList.innerHTML = '';

    state.categories.forEach((cat, ci) => {
      const navBtn = document.createElement('button');
      navBtn.className = 'nav-item';
      navBtn.innerHTML = `<span>${escapeHtml(cat.title) || 'Tanpa Judul'}</span><span class="del" data-idx="${ci}">✕</span>`;
      navBtn.addEventListener('click', (e)=>{
        if(e.target.classList.contains('del')){
          if(confirm(`Hapus kategori "${cat.title}"?`)){
            state.categories.splice(ci,1);
            saveData(); render();
          }
          return;
        }
        document.getElementById('card-'+cat.id)?.scrollIntoView({behavior:'smooth', block:'center'});
      });
      navList.appendChild(navBtn);

      const card = document.createElement('div');
      card.className = 'card';
      card.id = 'card-'+cat.id;

      const head = document.createElement('div');
      head.className = 'card-head';
      const titleInput = document.createElement('input');
      titleInput.className = 'card-title';
      titleInput.value = cat.title;
      titleInput.addEventListener('input', ()=>{ cat.title = titleInput.value; saveData(); refreshNavLabel(ci, titleInput.value); });
      head.appendChild(titleInput);
      head.appendChild(document.createTextNode(''));
      card.appendChild(head);

      const ul = document.createElement('ul');
      ul.className = 'names-list';
      cat.names.forEach((name, ni) => {
        const li = document.createElement('li');
        const inp = document.createElement('input');
        inp.className = 'name-input';
        inp.placeholder = 'Nama...';
        inp.value = name;
        inp.addEventListener('input', ()=>{ cat.names[ni] = inp.value; saveData(); });
        const del = document.createElement('button');
        del.className = 'name-del';
        del.textContent = '✕';
        del.addEventListener('click', ()=>{ cat.names.splice(ni,1); saveData(); render(); });
        li.appendChild(inp);
        li.appendChild(del);
        ul.appendChild(li);
      });
      card.appendChild(ul);

      const addName = document.createElement('button');
      addName.className = 'add-name';
      addName.textContent = '+ Tambah nama';
      addName.addEventListener('click', ()=>{ cat.names.push(''); saveData(); render(); });
      card.appendChild(addName);

      const noteArea = document.createElement('textarea');
      noteArea.className = 'note-input';
      noteArea.placeholder = 'Catatan / instruksi piket...';
      noteArea.value = cat.note;
      noteArea.addEventListener('input', ()=>{ cat.note = noteArea.value; saveData(); });
      card.appendChild(noteArea);

      const foot = document.createElement('div');
      foot.className = 'card-foot';
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.title = 'Salin teks reminder';
      copyBtn.innerHTML = copySvg;
      copyBtn.addEventListener('click', ()=> copyText(buildCategoryText(cat), copyBtn));
      foot.appendChild(copyBtn);
      card.appendChild(foot);

      grid.appendChild(card);
    });

    renderBesok();
  }

  function renderBesok(){
    const wrap = document.getElementById('besokSections');
    wrap.innerHTML = '';
    BESOK_FIELDS.forEach(f => {
      const field = document.createElement('div');
      field.className = 'besok-field';

      const label = document.createElement('p');
      label.className = 'besok-field-label';
      label.textContent = f.label;
      field.appendChild(label);

      const ul = document.createElement('ul');
      ul.className = 'besok-list';
      state.besok[f.key].forEach((val, idx) => {
        const li = document.createElement('li');
        const inp = document.createElement('input');
        inp.className = 'besok-item-input';
        inp.placeholder = 'Isi...';
        inp.value = val;
        inp.addEventListener('input', ()=>{ state.besok[f.key][idx] = inp.value; saveData(); });
        const del = document.createElement('button');
        del.className = 'besok-item-del';
        del.textContent = '✕';
        del.addEventListener('click', ()=>{ state.besok[f.key].splice(idx,1); saveData(); renderBesok(); });
        li.appendChild(inp);
        li.appendChild(del);
        ul.appendChild(li);
      });
      field.appendChild(ul);

      const addBtn = document.createElement('button');
      addBtn.className = 'add-besok-item';
      addBtn.textContent = '+ Tambah';
      addBtn.addEventListener('click', ()=>{ state.besok[f.key].push(''); saveData(); renderBesok(); });
      field.appendChild(addBtn);

      wrap.appendChild(field);
    });
  }

  function buildBesokText(){
    const tmr = new Date(Date.now() + 86400000);
    const tanggal = `${HARI[tmr.getDay()]}, ${tmr.getDate()} ${BULAN[tmr.getMonth()]} ${tmr.getFullYear()}`;
    const b = state.besok;
    const seragam = b.seragam.filter(x=>x.trim());
    const jadwal = b.jadwal.filter(x=>x.trim());
    const tugas = b.tugas.filter(x=>x.trim());
    const bawaan = b.bawaan.filter(x=>x.trim());
    const catatan = b.catatan.filter(x=>x.trim());

    let text = `📢 _REMINDER UNTUK BESOK_ 📢\n\n`;
    text += `Assalamu'alaikum/Hi teman-teman! Jangan lupa ya, besok:\n\n`;
    text += `📅 Hari: ${tanggal}\n\n`;
    text += `👕 Seragam:\n`;
    seragam.forEach(x => text += `• ${x}\n`);
    text += `\n📚 Jadwal Pelajaran:\n\n`;
    jadwal.forEach((x,i) => text += `${i+1}. ${x}\n`);
    text += `\n📝 PR/Tugas yang dikumpulkan: \n`;
    tugas.forEach(x => text += ` ● ${x}\n`);
    text += `\n🎒 Yang harus dibawa:\n`;
    bawaan.forEach(x => text += `• ${x}\n`);
    text += `\n📌 _CATATAN_\n`;
    catatan.forEach(x => text += ` ●  ${x}\n`);
    text += `\nterimakasih, _*TOLONG SELALU DI BACA*_ informasinya dengan lengkap bukan cuman di lihat..`;
    return text;
  }

  function refreshNavLabel(idx, val){
    const items = document.querySelectorAll('.nav-item span:first-child');
    if(items[idx]) items[idx].textContent = val || 'Tanpa Judul';
  }

  function escapeHtml(str){
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function addCategory(){
    const id = 'cat-' + Date.now();
    state.categories.push({ id, title: 'Kategori Baru', names: [''], note: '' });
    saveData();
    render();
    setTimeout(()=> document.getElementById('card-'+id)?.scrollIntoView({behavior:'smooth', block:'center'}), 50);
  }
  document.getElementById('addCatBtnSide').addEventListener('click', addCategory);
  document.getElementById('addCatBtnMobile').addEventListener('click', addCategory);

  document.getElementById('besokCopyBtn').addEventListener('click', (e)=>{
    copyText(buildBesokText(), e.currentTarget);
  });

  render();
})();
