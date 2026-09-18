const app = document.querySelector('#app');
document.head.insertAdjacentHTML('beforeend', `<style>.key-card{border:1px solid #f7c66a55;background:linear-gradient(145deg,#6e4a17,#321607)}.key-card.key-unlocked{opacity:1;border-color:#ffd56b;background:linear-gradient(145deg,#96671b,#4b260a);animation:keyGlow 1.6s ease-in-out infinite alternate}.progress-card{display:grid;gap:10px;text-align:left;padding:18px;margin:22px 0;border:1px solid #ffffff22;border-radius:18px;background:#ffffff0d}.progress-card span{color:var(--muted);font-size:14px}.unlock-sparkle{animation:unlock 1s cubic-bezier(.2,1.5,.45,1) both;text-shadow:0 0 28px #ffdc72}.key-reveal .eyebrow{color:#ffd56b}@keyframes keyGlow{from{box-shadow:0 10px 24px #10020777}to{box-shadow:0 0 24px #ffd05a99,0 12px 28px #10020799;filter:brightness(1.13)}}@keyframes unlock{0%{opacity:0;transform:scale(.45) rotate(-18deg)}65%{transform:scale(1.22) rotate(8deg)}100%{opacity:1;transform:scale(1) rotate(0)}}</style>`);
const KEY = 'preTeba-v3';
let cloud = null;
const cloudReady = new Promise(resolve => {
  const config = document.createElement('script');
  config.src = 'supabase-config.js';
  config.onload = () => {
    const settings = window.SUPABASE_CONFIG;
    if (!settings?.url || !settings?.publishableKey) return resolve(null);
    const sdk = document.createElement('script');
    sdk.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    sdk.onload = () => {
      try { cloud = window.supabase.createClient(settings.url, settings.publishableKey); } catch (_) { cloud = null; }
      resolve(cloud);
    };
    sdk.onerror = () => resolve(null);
    document.head.append(sdk);
  };
  config.onerror = () => resolve(null);
  document.head.append(config);
});
const defaults = { name:'', completed:{}, quiz:{answers:[],score:null}, either:[], game:{best:0,combo:0,games:0,lastPlayed:null}, mystery:[], gift:false, music:{volume:.75,muted:false} };
let data = {...structuredClone(defaults), ...JSON.parse(localStorage.getItem(KEY) || 'null')};
data.completed = {...(data.completed || {})}; data.quiz = {...defaults.quiz, ...(data.quiz || {})};
data.game = {...defaults.game, ...(data.game || {})}; data.music = {...defaults.music, ...(data.music || {})};
const save = () => localStorage.setItem(KEY, JSON.stringify(data));
const esc = s => String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

const otherGames = ['random','either','mystery'];
function keyProgress(){
  const quiz = Number(data.quiz.score) >= 9;
  const game = Number(data.game.best) >= 15;
  const others = otherGames.filter(k => data.completed[k]).length;
  return { quiz, game, others, unlocked: quiz && game && others === otherGames.length };
}
function syncKey(){ data.gift=keyProgress().unlocked; save(); }
function sendToAdmin(activity){
  cloudReady.then(client => {
    if (!client || !data.name) return;
    client.from('game_submissions').insert({
      player_name: data.name,
      activity,
      payload: { quiz:data.quiz, minihra:data.game, random:!!data.completed.random, either:data.either, mystery:data.mystery, keyUnlocked:keyProgress().unlocked }
    }).then(({error}) => { if (error) console.warn('Odpovede sa nepodarilo uložiť online.', error.message); });
  });
}

class MusicManager {
  constructor(){ this.audio = new Audio('assets/music/background.mp3'); this.audio.loop = true; this.audio.preload = 'auto'; this.audio.volume = data.music.muted ? 0 : data.music.volume; this.available = true; this.audio.addEventListener('error', () => { this.available=false; console.info('Background music file not found: assets/music/background.mp3'); }); }
  async start(){ if(data.music.muted || !this.available) return; this.audio.volume=data.music.volume; try { await this.audio.play(); } catch(_) { /* browser waits for the next user gesture */ } }
  setVolume(v){ data.music.volume=Math.max(0,Math.min(1,+v)); data.music.muted=data.music.volume===0; this.audio.volume=data.music.muted?0:data.music.volume; save(); if(!data.music.muted)this.start(); }
  toggle(){ data.music.muted=!data.music.muted; this.audio.volume=data.music.muted?0:data.music.volume; save(); if(!data.music.muted)this.start(); }
}
const music = new MusicManager();

function shell(content, back=true){
  if(gameState?.active || gameState?.countdown) clearGame();
  app.innerHTML=`<div class="screen"><header class="top">${back?'<button class="icon-btn back" aria-label="Späť">←</button>':'<span class="top-spacer"></span>'}<span class="brand">PRE TEBA</span><button class="icon-btn sound" aria-label="Nastavenie hudby">${data.music.muted?'🔇':'🎵'}</button></header>${content}</div>`;
  document.querySelector('.sound').onclick = e => { e.stopPropagation(); music.start(); toggleMusicPanel(); };
  document.querySelector('.back')?.addEventListener('click', menu);
}
function toggleMusicPanel(){
  let panel=document.querySelector('.music-panel'); if(panel){panel.remove();return;}
  panel=document.createElement('aside'); panel.className='music-panel';
  panel.innerHTML=`<b>🎵 HUDBA</b><label>Hlasitosť <output>${Math.round(data.music.volume*100)} %</output></label><input aria-label="Hlasitosť hudby" type="range" min="0" max="100" value="${Math.round(data.music.volume*100)}"><button class="music-mute">${data.music.muted?'ZAPNÚŤ HUDBU':'VYPNÚŤ HUDBU'}</button>`;
  document.querySelector('.screen').append(panel);
  panel.querySelector('input').oninput=e=>{music.setVolume(e.target.value/100);panel.querySelector('output').textContent=e.target.value+' %';document.querySelector('.sound').textContent=data.music.muted?'🔇':'🎵';};
  panel.querySelector('.music-mute').onclick=()=>{music.toggle();toggleMusicPanel();document.querySelector('.sound').textContent=data.music.muted?'🔇':'🎵';};
  setTimeout(()=>document.addEventListener('click', function close(e){if(!panel.contains(e.target)&&!e.target.classList.contains('sound')){panel.remove();document.removeEventListener('click',close);}}),0);
}

function welcome(){ shell(`<section class="hero"><h1>👋 Ahoj!</h1><p class="lead">Ako ťa môžem volať?</p><input class="input" id="name" maxlength="24" placeholder="Napíš svoju prezývku" autofocus><button class="primary" id="continue">POKRAČOVAŤ →</button></section>`,false); document.querySelector('#continue').onclick=()=>{let n=document.querySelector('#name').value.trim();if(n){data.name=n;save();music.start();menu();}}; }
const cards=[['🧩','KVÍZ','Ako dobre ma poznáš?','quiz'],['🎮','MINIHRA','Otestuj svoj postreh','game'],['🎲','RANDOM','Priprav sa na najhoršie vtipy.','random'],['⚖️','THIS OR THAT','Vyber si.','either'],['🚪','MYSTERY','Dokážeš zistiť, prečo si tu?','mystery']];
function menu(){music.start();const p=keyProgress(),key=[p.unlocked?'🔑':'🔒',p.unlocked?'KĽÚČ ODOMKNUTÝ':'KĽÚČ',p.unlocked?'Odomknuté! Môžeš pokračovať.':'Dokonči všetky hry a zisti, čo sa skrýva za zámkom…','gift'];shell(`<section class="section-head"><h1>Ahoj, ${esc(data.name)}! 👋</h1><p>Čo si dnes vyberieš?</p></section><div class="menu-grid">${[...cards,key].map(c=>`<button class="menu-card ${c[3]==='gift'?'key-card '+(p.unlocked?'key-unlocked':'locked'):''}" data-go="${c[3]}"><span class="card-icon">${c[0]}</span><strong>${c[1]}</strong><small>${c[2]}</small></button>`).join('')}</div>`,false);document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>({quiz,game,random,either,mystery,giftLock})[b.dataset.go]());}

const qs=[['Aký šport mám najradšej?',['Futbal','Volejbal','Hokej','Basketbal'],[1]],['Ktoré by som si vybral?',['PS5','PC','Mobil','Všetko naraz'],[2]],['Čo by som si pravdepodobnejšie pozrel?',['Komédia','Horor','Akčný film','Dokument'],[0,2]],['Čo by som si vybral na celý deň?',['Zostať doma','Byť s kamarátmi','Športovať','Niečo náhodné'],[1,2]],['Čo by som robil o polnoci?',['Spal','Hral hry','Scrolloval','Premýšľal'],[1,2,3]],['Obľúbená farba?',['Červená','Modrá','Fialová','Čierna'],[0]],['Kedy mám narodeniny?',['25. január','14. február','8. máj','30. november'],[0]],['Obľúbený alkoholický nápoj?',['Pivo','Víno','Miešaný drink','Nepijem'],[3]],['Na čo by som hral?',['Gitara','Klavír','Bicie','Saxofón'],[1]],['Koho mám najradšej?',['Otilia','Katka','Tamara','Lucia'],[1]]];
let qi=0, qa=[]; function quiz(){qi=0;qa=[];quizQ();} function quizQ(){let q=qs[qi];shell(`<div class="eyebrow">🧩 KVÍZ · ${qi+1}/10</div><div class="progress"><i style="width:${qi*10}%"></i></div><h2 class="question">${q[0]}</h2><div class="choices">${q[1].map((a,i)=>`<button class="choice" data-i="${i}">${'ABCD'[i]}) ${a}</button>`).join('')}</div><div id="feedback"></div>`);document.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{let ok=q[2].includes(+b.dataset.i);qa.push(+b.dataset.i);document.querySelectorAll('.choice').forEach(x=>x.disabled=true);b.classList.add('selected');document.querySelector('#feedback').innerHTML=`<div class="feedback ${ok?'good':'bad'}">${ok?'✅ Správne!':'❌ Tentokrát nie.'}</div>`;setTimeout(()=>{++qi===10?quizEnd():quizQ();},600);});} function quizEnd(){let score=qa.reduce((n,a,i)=>n+qs[i][2].includes(a),0);data.quiz={answers:qa,score};complete('quiz');shell(`<div class="center"><div class="score-big">${score}/10</div><h2>Tvoje skóre</h2><p>${score>=9?'✅ Kvíz splnený! Poznáš ma až podozrivo dobre. ✨':'❌ Na kľúč potrebuješ aspoň 9/10. Skús to ešte raz!'}</p><button class="primary" id="home">SPÄŤ DO MENU</button></div>`);document.querySelector('#home').onclick=menu;}

let gameState=null;
function game(){shell(`<section class="game-intro"><div class="court-art"><i></i><i></i></div><div class="section-head"><div class="eyebrow">MINIHRA</div><h1>POSTREH</h1><p>Ako rýchly máš postreh?</p><small>Klikni na volejbalovú loptu vždy, keď sa objaví.</small></div><button class="primary game-start" id="start">ZAČAŤ HRAŤ</button></section>`);document.querySelector('#start').onclick=startGame;}
function clearGame(){if(gameState){clearTimeout(gameState.spawnTimer);clearTimeout(gameState.objectTimer);clearInterval(gameState.clock);gameState=null;}}
function startGame(){clearGame();shell(`<div class="game-shell"><div class="hud"><div><small>⭐ SKÓRE</small><b id="score">0</b></div><div><small>🔥 COMBO</small><b id="combo">×0</b></div><div><small>⏱️ ČAS</small><b id="time">20.0 s</b></div></div><div id="board" class="game-board"><div id="countdown" class="countdown">3</div></div></div>`);let board=document.querySelector('#board'), n=3;gameState={countdown:true,spawnTimer:0,objectTimer:0,clock:0};let cd=setInterval(()=>{n--;let c=document.querySelector('#countdown');if(!c)return clearInterval(cd);c.textContent=n? n:'GO!';c.classList.remove('pop');void c.offsetWidth;c.classList.add('pop');if(n<0){clearInterval(cd);gameState.clock=0;c.remove();runGame(board);}},700);gameState.clock=cd;}
function runGame(board){let g=gameState={score:0,combo:0,best:0,end:performance.now()+20000,board,spawnTimer:0,objectTimer:0,clock:0,active:true,last:null};g.clock=setInterval(()=>{let remain=Math.max(0,(g.end-performance.now())/1000);let t=document.querySelector('#time');if(t)t.textContent=remain.toFixed(1)+' s';if(remain<=0)endGame();},50);spawnObject();}
function positionFor(g){let rect=g.board.getBoundingClientRect(), x,y;do{x=60+Math.random()*(rect.width-120);y=105+Math.random()*(rect.height-175);}while(g.last&&Math.hypot(x-g.last.x,y-g.last.y)<85);g.last={x,y};return g.last;}
function spawnObject(){let g=gameState;if(!g||!g.active)return;let left=(g.end-performance.now())/1000;if(left<=0)return endGame();let trap=Math.random()<(left<9?.26:.16), p=positionFor(g), el=document.createElement('button');el.className=trap?'target trap':'target ball';el.style.left=p.x+'px';el.style.top=p.y+'px';el.setAttribute('aria-label',trap?'Neklikaj na X':'Volejbalová lopta');if(!trap)el.innerHTML='<img src="assets/images/volleyball.svg" alt="">';else el.innerHTML='<span>×</span>';g.board.append(el);let remove=(clicked=false)=>{if(!el.isConnected)return;el.classList.add('vanish');setTimeout(()=>el.remove(),120);clearTimeout(g.objectTimer);if(clicked){if(trap){g.score=Math.max(0,g.score-2);g.combo=0;flash(g,'-2 body',p);flash(g,'COMBO RESET',p,true);}else{g.score++;g.combo++;g.best=Math.max(g.best,g.combo);flash(g,'+1',p);if(g.combo===5||g.combo===10)flash(g,'🔥 COMBO ×'+g.combo,p,true);}}updateHud(g);let delay=trap?180:Math.max(110,310-(20-left)*8);g.spawnTimer=setTimeout(spawnObject,delay);};el.onclick=()=>remove(true);let life=trap?500:Math.max(500,1350-(20-left)*38);g.objectTimer=setTimeout(()=>remove(false),life);}
function updateHud(g){document.querySelector('#score').textContent=g.score+'/15';document.querySelector('#combo').textContent='×'+g.combo;if(g.score>=15)setTimeout(endGame,0);}
function flash(g,text,p,wide=false){let f=document.createElement('b');f.className='hit '+(wide?'wide':'');f.textContent=text;f.style.left=p.x+'px';f.style.top=p.y+'px';g.board.append(f);setTimeout(()=>f.remove(),760);}
function endGame(){let g=gameState;if(!g||!g.active)return;g.active=false;clearGame();data.game.games++;data.game.lastPlayed=new Date().toISOString();let record=g.score>data.game.best;data.game.best=Math.max(data.game.best,g.score);data.game.combo=Math.max(data.game.combo,g.best);save();complete('game');let won=g.score>=15;let msg=won?'✅ Minihra splnená — 15/15!':g.score<=5?'🐢 Trochu pomalé…':g.score<=10?'😐 Celkom dobré.':'⚡ Rýchle!';shell(`<div class="center game-result"><div class="trophy">${won?'🔑':'🏆'}</div><div class="eyebrow">KONIEC!</div>${record?'<div class="record">🎉 NOVÝ REKORD!</div>':''}<p>Tvoje skóre:</p><div class="score-big">${g.score}/15</div><p>Najlepšie combo: <b>×${g.best}</b></p><h2>${msg}</h2>${won?'':'<p>Na odomknutie kľúča potrebuješ 15/15.</p>'}<button class="primary" id="again">🔄 HRAŤ ZNOVA</button><button class="secondary" id="home">🏠 SPÄŤ</button></div>`);document.querySelector('#again').onclick=startGame;document.querySelector('#home').onclick=menu;}

const jokes=['Prečo išiel počítač k doktorovi?\nLebo mal vírus. 💻','Čo povie stena druhej stene?\nStretneme sa na rohu. 🧱','Čo povie Wi‑Fi, keď sa rozíde?\nNecítim medzi nami spojenie. 📶','Prečo nemôže kostra klamať?\nLebo ju každý prekukne. 💀','Prečo som si dal budík na 7:00?\nAby som ho mohol o 7:00 vypnúť. 😎'];let ji=0;function random(){ji=0;randomCard();}function randomCard(){let end=ji>=jokes.length;shell(`<div class="section-head"><div class="eyebrow">🎲 RANDOM</div><h1>Vitaj v sekcii Random!</h1></div><div class="joke-card">${end?'🗑️ Gratulujem. Práve si venovala čas týmto vtipom.':' '+jokes[ji]}</div><button class="primary" id="next">${end?'SPÄŤ DO MENU':'🎲 ĎALŠÍ'}</button>`);document.querySelector('#next').onclick=()=>end?(complete('random'),menu()):(ji++,randomCard());}
const eitherQs=[['More 🌊','Hory 🏔️'],['Hrať hry 🎮','Pozerať film 🎬'],['Pizza 🍕','Burger 🍔'],['Zostať doma 🏠','Celý deň vonku 🌳'],['Veľa peňazí 💰','Veľa voľného času ⏳'],['Čítať myšlienky 🧠','Vidieť budúcnosť 🔮'],['Bez mobilu mesiac 📵','Bez hier mesiac 🎮'],['Smiať sa nevhodne 😂','Nevedieť sa zasmiať 😐'],['Perfektne spievať 🎤','Perfektne hrať na nástroj 🎸'],['Jedna superschopnosť 🦸','1 000 000 € 💰']];let ei=0,ea=[];function either(){ei=0;ea=[];eitherQ();}function eitherQ(){if(ei===eitherQs.length){data.either=ea;complete('either');shell(`<div class="center"><div class="eyebrow">⚖️ HOTOVO</div><h1>Tvoje voľby</h1><p>${ea.map((x,i)=>`${i+1}. ${x}`).join('<br>')}</p><button class="primary" id="home">SPÄŤ DO MENU</button></div>`);document.querySelector('#home').onclick=menu;return;}let q=eitherQs[ei];shell(`<div class="eyebrow">⚖️ THIS OR THAT · ${ei+1}/${eitherQs.length}</div><div class="progress"><i style="width:${ei/eitherQs.length*100}%"></i></div><h1 class="question">Vyber si.</h1><div class="either"><button>${q[0]}</button><button>${q[1]}</button></div>`);document.querySelectorAll('.either button').forEach((b,i)=>b.onclick=()=>{ea.push(q[i]);b.classList.add('chosen');setTimeout(()=>{ei++;eitherQ();},300);});}

const mysteryScenes=[
 {place:'Tajomná chodba',text:'Otvorila si oči. Chodba za tebou sa bez zvuku stratila. Pred tebou dýchajú troje dvere.',choices:['Za prvými dverami ležal kľúč, teplý ako dlaň.','Druhé dvere otvorili vôňu dažďa a tiché zvonenie.','Tretie dvere pustili dnu záblesk svetla.']},
 {place:'Dom, ktorý si nepamätáš',text:'Priestor sa zmenil, no kľúč zostal vo vrecku. Na stene sa objavil nápis: „Pokračuj.“',choices:['V starom rádiu sa ozval hlas, ktorý poznal tvoje meno.','Stôl sa posunul a odkryl schránku s tvojou fotkou.','Zrkadlo sa usmialo o zlomok sekundy neskôr než ty.']},
 {place:'Absurdné poschodie',text:'Kroky znejú ako potlesk. Všetko je zvláštnejšie, ale cesta sa konečne začína črtať.',choices:['Na strope plávali ryby a ukazovali smer.','Výťah zastal medzi dvoma neexistujúcimi poschodiami.','Kreslo ti poďakovalo, že si si doň nesadla.']},
 {place:'Krásny chaos',text:'Hodiny bežia dozadu, lampy šepkajú a každý tieň je o kúsok príliš dlhý.',choices:['Papierový vták ti položil na dlaň posledný odkaz.','Za hodinami čakal pokojný pohľad tvojej budúcej verzie.','Dážď padal zdola nahor a odniesol všetok strach.']},
 {place:'Tiché finále',text:'Chaos sa utíšil. Ostala len chodba, mäkké svetlo a posledná možnosť rozhodnúť sa sama.',choices:['Zvolila si spomienku a našla v nej odvahu pokračovať.','Zvolila si prekvapenie a rozosmiala si aj prázdnu miestnosť.','Zvolila si koniec — ktorý bol v skutočnosti začiatok.']}
];let ms=0, story=[];
function mystery(){ms=0;story=[];mysteryDoors();}
function mysteryDoors(){let s=mysteryScenes[ms];shell(`<section class="mystery-scene scene-${ms+1}"><div class="mystery-sky"></div><div class="mystery-label">MYSTERY · ${ms+1}/5<br><b>${s.place}</b></div><div class="door-row">${[1,2,3].map(n=>`<button class="story-door d${n}" data-door="${n}" aria-label="Dvere ${n}"><span class="frame"><i></i></span><em>${n}</em></button>`).join('')}</div><div class="story-card"><p>${s.text}</p><small>Vyber dvere a vstúp do ďalšej časti príbehu.</small></div></section>`);document.querySelectorAll('.story-door').forEach(b=>b.onclick=()=>chooseDoor(+b.dataset.door));}
function chooseDoor(n){let scene=document.querySelector('.mystery-scene'), doors=document.querySelectorAll('.story-door');doors.forEach(d=>d.disabled=true);scene.classList.add('door-picked');document.querySelector(`.d${n}`).classList.add('chosen-door');setTimeout(()=>{scene.classList.add('door-open');setTimeout(()=>revealStory(n),650);},340);}
function revealStory(n){let s=mysteryScenes[ms], line=s.choices[n-1];story.push(line);shell(`<section class="mystery-reveal scene-${ms+1}"><div class="reveal-light"></div><div class="place-art">✦</div><div class="story-card reveal-card"><div class="eyebrow">PREŠLA SI DVERAMI ${n}</div><p>${line}</p><button class="primary" id="next-scene">${ms===4?'POZRIEŤ TVOJ PRÍBEH':'POKRAČOVAŤ →'}</button></div></section>`);document.querySelector('#next-scene').onclick=()=>{if(ms===4)mysteryFinalIntro();else{ms++;mysteryDoors();}};}
function mysteryFinalIntro(){shell(`<div class="final-fade center"><p>A tým sa tvoj príbeh končí…</p><p class="later">Ale ktorý príbeh to vlastne bol?</p></div>`);setTimeout(mysteryFinal,1800);}
function mysteryFinal(){data.mystery=story;complete('mystery');shell(`<section class="book-wrap"><article class="paper story-book"><div class="eyebrow">📖 TVOJ PRÍBEH</div><h1>Chodba piatich dverí</h1>${story.map((x,i)=>`<p><b>${i+1}.</b> ${x}</p>`).join('')}<footer>Tvoj výber: ${story.map(x=>mysteryScenes[story.indexOf(x)]?.choices.indexOf(x)+1).join(' → ')}</footer></article><button class="primary" id="again">🚪 ZAHRAŤ ZNOVA</button><button class="secondary" id="home">🏠 SPÄŤ DO MENU</button></section>`);document.querySelector('#again').onclick=mystery;document.querySelector('#home').onclick=menu;}

function complete(k){data.completed[k]=new Date().toISOString();syncKey();sendToAdmin(k);}
function giftLock(){const p=keyProgress();if(!p.unlocked){shell(`<div class="center key-status"><div class="giftbox">🔒</div><h1>Kľúč je stále zamknutý</h1><p>Dokonči všetky hry a zisti, čo sa skrýva za zámkom…</p><div class="progress-card"><b>Tvoj postup</b><span>🧠 Kvíz — ${data.quiz.score ?? '—'}/10 ${p.quiz?'✅':'❌'}</span><span>🎮 Minihra — ${Number(data.game.best)||0}/15 ${p.game?'✅':'❌'}</span><span>🎯 Ostatné hry — ${p.others}/${otherGames.length} ${p.others===otherGames.length?'✅':'❌'}</span></div><button class="secondary" id="home">SPÄŤ DO MENU</button></div>`);document.querySelector('#home').onclick=menu;return;}shell(`<div class="center key-reveal"><div class="giftbox unlock-sparkle">🔑</div><div class="eyebrow">ODOMKNUTÉ! 🔑</div><h1>Kľúč je tvoj</h1><p>Splnila si všetky výzvy. Teraz môžeš pokračovať ďalej.</p><button class="secondary" id="home">SPÄŤ DO MENU</button></div>`);document.querySelector('#home').onclick=menu;}
function adminPanel(){
  shell(`<section class="admin-panel center"><div class="eyebrow">SÚKROMNÝ PRÍSTUP</div><h1>Admin panel</h1><p id="admin-message">Načítavam bezpečné prihlásenie…</p></section>`, false);
  cloudReady.then(async client => {
    if (!client) { document.querySelector('#admin-message').textContent='Admin panel ešte nie je pripojený k databáze.'; return; }
    const { data: sessionData } = await client.auth.getSession();
    if (sessionData.session) return loadSubmissions(client);
    document.querySelector('.admin-panel').innerHTML=`<div class="eyebrow">SÚKROMNÝ PRÍSTUP</div><h1>Admin panel</h1><p>Prihlás sa účtom správcu.</p><input class="input" id="admin-email" type="email" placeholder="E-mail" autocomplete="email"><input class="input" id="admin-password" type="password" placeholder="Heslo" autocomplete="current-password"><button class="primary" id="admin-login">PRIHLÁSIŤ SA</button><p id="admin-message"></p>`;
    document.querySelector('#admin-login').onclick=async()=>{const email=document.querySelector('#admin-email').value.trim(),password=document.querySelector('#admin-password').value;const {error}=await client.auth.signInWithPassword({email,password});if(error){document.querySelector('#admin-message').textContent='Prihlásenie zlyhalo: '+error.message;return;}loadSubmissions(client);};
  });
}
async function loadSubmissions(client){
  const { data: rows, error } = await client.from('game_submissions').select('player_name,activity,payload,submitted_at').order('submitted_at',{ascending:false});
  if(error){shell(`<div class="center"><h1>Prístup zamietnutý</h1><p>Tento účet nemá oprávnenie čítať odpovede.</p><button class="secondary" id="logout">ODHLÁSIŤ SA</button></div>`,false);document.querySelector('#logout').onclick=async()=>{await client.auth.signOut();adminPanel();};return;}
  shell(`<section class="admin-panel"><div class="eyebrow">ADMIN PANEL</div><h1>Odpovede hráčok</h1><p>${rows.length} uložených záznamov</p><div class="admin-list">${rows.map(row=>`<article class="story-card"><b>${esc(row.player_name)}</b><small>${esc(row.activity)} · ${new Date(row.submitted_at).toLocaleString('sk-SK')}</small><pre>${esc(JSON.stringify(row.payload,null,2))}</pre></article>`).join('')||'<p>Zatiaľ neprišli žiadne odpovede.</p>'}</div><button class="secondary" id="logout">ODHLÁSIŤ SA</button></section>`,false);document.querySelector('#logout').onclick=async()=>{await client.auth.signOut();adminPanel();};
}
window.addEventListener('pagehide',clearGame); app.addEventListener('pointerdown',()=>music.start(),{once:true}); location.hash==='#admin'?adminPanel():(data.name?menu():welcome());
