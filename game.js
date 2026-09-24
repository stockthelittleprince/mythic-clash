const app = document.getElementById("app");

/* =========================================================
   MYTHIC CLASH V8 — GAMEPLAY + CARD FEEL REBUILD
   - 真正的牌庫 / 抽牌 / 棄牌循環
   - 每回合實際抽 1 張牌
   - 抽牌動畫與牌庫計數
   - 50 張牌各自不同視覺
   - 更多功能牌真正生效
   - 攻擊 / 治療 / 護盾 / 控制 / 詛咒 / 神力特效
   ========================================================= */

const ART = {
  nezha:"assets/characters/nezha.jpg", wukong:"assets/characters/wukong.jpg",
  chang_e:"assets/characters/chang_e.jpg", erlang:"assets/characters/erlang.jpg",
  amaterasu:"assets/characters/amaterasu.jpg", susanoo:"assets/characters/susanoo.jpg",
  zeus:"assets/characters/zeus.jpg", athena:"assets/characters/athena.jpg"
};

const CARD_ART = {
  shield:"assets/cards/shield.jpg", strike:"assets/cards/sunburst.jpg",
  fire:"assets/cards/sunburst.jpg", light:"assets/cards/shield.jpg",
  spring:"assets/cards/heal.jpg", gift:"assets/cards/heal.jpg",
  poison:"assets/cards/curse.jpg", curse:"assets/cards/curse.jpg",
  thunder:"assets/cards/thunder.jpg", crush:"assets/cards/slash.jpg",
  pierce:"assets/cards/slash.jpg"
};

const TYPE_ICON = {
  攻擊:"⚔", 防禦:"◈", 恢復:"✚", 控制:"◐", 手牌:"✦",
  詛咒:"☠", 神力:"ϟ", 特殊:"✧", 傳說:"♛"
};

const CARD_GLYPH = {
  strike:"⚡", fire:"🔥", pierce:"🗡", double:"⚔", crush:"💥",
  soul:"☯", thunder:"⛈", backstab:"🩸",
  shield:"🛡", light:"☀", mirror:"🪞", dodge:"🌪", lastwall:"🏰",
  spring:"💧", gift:"✨", rebirth:"🔥", moonbless:"🌙",
  seal:"🔒", silence:"🤫", chaos:"🌀", timestop:"⏳", rewind:"↶",
  steal:"🖐", peek:"👁", swap:"⇄", sacrifice:"🩸", dice:"🎲",
  curse:"☠", poison:"☣", burn:"🔥", soulbind:"⛓", weaken:"⬇",
  infuse:"ϟ", pact:"✦", wrath:"⚡",
  decoy:"🪞", rollback:"↺", stealfate:"🌀", mirrorcard:"◇", forbidden:"☄",
  ragnarok:"☄", rewrite:"✒", judgment:"⚖", chaosfall:"🌌",
  counterstrike:"⚔", deathrefuse:"☠", allone:"✦", coin:"◉", domain:"◈", endbell:"🔔"
};

const CARD_HUE = {
  strike:5, fire:20, pierce:345, double:330, crush:10, soul:275, thunder:215, backstab:350,
  shield:205, light:45, mirror:190, dodge:170, lastwall:215,
  spring:165, gift:55, rebirth:8, moonbless:235,
  seal:275, silence:250, chaos:290, timestop:225, rewind:185,
  steal:330, peek:270, swap:45, sacrifice:350, dice:40,
  curse:315, poison:125, burn:18, soulbind:280, weaken:210,
  infuse:190, pact:50, wrath:12,
  decoy:180, rollback:200, stealfate:290, mirrorcard:265, forbidden:8,
  ragnarok:355, rewrite:270, judgment:45, chaosfall:285,
  counterstrike:350, deathrefuse:320, allone:55, coin:40, domain:225, endbell:310
};

function esc(s){
  return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}
function shuffle(a){
  a=[...a];
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
function log(t){
  S.log.unshift(t);
  S.log=S.log.slice(0,24);
}
function getChar(id){return CHARACTERS.find(c=>c.id===id)}
function card(id){return CARDS.find(c=>c.id===id)}
function artFor(c){return ART[c.id]||""}
function portraitHTML(c,cls="portrait"){
  const src=artFor(c);
  return src
    ? `<img class="${cls}" src="${src}" alt="${esc(c.name)}" loading="eager">`
    : `<div class="${cls} portrait-fallback"><span>${esc(c.name.slice(0,1))}</span><small>${esc(c.tag)}</small></div>`;
}

const S={
  screen:"home", player:null, enemy:null,
  turn:1, phase:"player", mana:3, enemyMana:3,
  hand:[], enemyHand:[], discard:[], deck:[], enemyDeck:[],
  log:[], lastPlayerCard:null, lastEnemyCard:null,
  shield:0, enemyShield:0, usedThisTurn:false,
  skillCooldown:0, enemySkillCooldown:0,
  playerUsedSkill:false, enemyUsedSkill:false,
  drawLock:0, limit:99,
  turnStartHp:0, forbiddenNext:false,
  pendingDraw:null, damageHistory:0
};

function starterDeck(){
  return shuffle(
    CARDS.flatMap(c=>Array(c.rarity==="傳說"?1:c.rarity==="史詩"?1:2).fill(c.id))
  ).slice(0,30);
}

function render(){
  if(S.screen==="home") return home();
  if(S.screen==="select") return select();
  if(S.screen==="draw") return drawScreen();
  return battle();
}

/* ========================= HOME ========================= */

function home(){
  app.innerHTML=`
  <main class="screen home v7-home">
    <div class="v7-home-art"></div><div class="v7-shade"></div>
    <div class="home-content">
      <div class="brand">
        <h1>神話爭鋒</h1>
        <small>MYTHIC CLASH · MYTHIC CARD BATTLE</small>
      </div>
      <p class="subtitle">三十位神話角色，跨越東西神話，決戰於命運之牌。</p>
      <button class="cta cta-large" onclick="goSelect()">開始遊戲</button>
      <div class="home-chips">
        <span>30 位神話角色</span><span>50 張功能牌</span><span>⚡ 神力戰鬥</span>
      </div>
    </div>
  </main>`;
}

function goSelect(){
  S.screen="draw";
  drawScreen();
}

/* ========================= FATE DRAW ========================= */

let drawnId=null, rerolls=0;

function drawScreen(){
  app.innerHTML=`
  <main class="screen draw-screen v7-draw">
    <div class="v7-draw-art"></div><div class="v7-shade"></div>
    <div class="draw-content">
      <div class="brand"><h1>命運召喚</h1><small>THE FATE AWAKENS</small></div>
      <p class="subtitle">三十位神話角色，等待命運揭示。</p>
      <div class="fate-stage">
        <div class="fate-card" id="fateCard">
          <div class="fate-sigil">✦</div><span>MYTHIC CLASH</span>
          <small style="margin-top:12px;color:#b8b3a5">抽取一位神話角色</small>
        </div>
      </div>
      <button class="cta" id="drawButton" onclick="revealFate()">抽取命運</button>
      <p class="small">每場可免費重抽一次；所有角色均可抽到。</p>
    </div>
  </main>`;
}

function revealFate(){
  const btn=document.getElementById("drawButton");
  if(btn) btn.disabled=true;

  const pool=CHARACTERS.filter(c=>c.id!==drawnId);
  drawnId=shuffle(pool)[0].id;
  const c=getChar(drawnId);
  const el=document.getElementById("fateCard");

  showFullScreenEffect("✦","命運翻牌","正在揭示你的神話角色","draw-reveal");

  el.classList.add("flipping");
  setTimeout(()=>{
    el.classList.remove("flipping");
    el.classList.add("revealed");
    const art=artFor(c);
    el.innerHTML=`
      <div class="fate-portrait-wrap">
        ${art?`<img class="fate-portrait-img" src="${art}" alt="${esc(c.name)}">`
        :`<div class="fate-sigil big">${esc(c.emoji||"✦")}</div>`}
      </div>
      <strong>${esc(c.name)}</strong>
      <small>${esc(c.tag)} · HP ${c.hp}</small>
      <div class="fate-skill">✦ ${esc(c.skill)}<br><span style="font-size:12px">${esc(c.desc)}</span></div>`;
    const b=document.getElementById("drawButton");
    if(b){
      b.outerHTML=`
      <div class="draw-buttons">
        <button class="cta" onclick="startGame('${c.id}')">以此角色出戰</button>
        ${rerolls<1?'<button class="ghost" onclick="rerollFate()">命運重抽（1次）</button>':""}
      </div>`;
    }
  },700);
}

function rerollFate(){
  rerolls++;
  drawScreen();
  setTimeout(revealFate,80);
}

/* ========================= GAME START ========================= */

function startGame(id){
  const pc=getChar(id);
  S.player={...pc,curHp:pc.hp,shield:0,usedSkill:false,stacks:0,trial:0};
  const choices=shuffle(CHARACTERS.filter(c=>c.id!==id));
  const ec=choices[0];
  S.enemy={...ec,curHp:ec.hp,shield:0,usedSkill:false,stacks:0,trial:0};

  S.deck=starterDeck();
  S.enemyDeck=starterDeck();
  S.hand=[]; S.enemyHand=[]; S.discard=[];
  S.turn=1; S.phase="player"; S.mana=3; S.enemyMana=3;
  S.skillCooldown=0; S.enemySkillCooldown=0;
  S.usedThisTurn=false; S.playerUsedSkill=false; S.enemyUsedSkill=false;
  S.lastPlayerCard=null; S.lastEnemyCard=null; S.log=[];
  S.turnStartHp=S.player.curHp;
  S.forbiddenNext=false; S.drawLock=0; S.limit=99; S.damageHistory=0;

  log(`戰鬥開始：${S.player.name} VS ${S.enemy.name}`);

  // 真正抽初始五張牌：逐張加入牌庫循環
  for(let i=0;i<5;i++){drawPlayer(true);drawEnemy(true)}

  S.screen="battle";
  render();
  setTimeout(()=>showInitialDraw(),250);
}

function drawPlayer(silent=false){
  if(!S.deck.length){
    if(S.discard.length){
      S.deck=shuffle(S.discard.splice(0));
      log("牌庫耗盡，棄牌堆重新洗回牌庫。");
      if(!silent) showFullScreenEffect("♻","重新洗牌","棄牌堆回到牌庫","reshuffle");
    }else{
      fatigue(S.player);
      return null;
    }
  }
  if(S.hand.length>=9) return null;
  const id=S.deck.pop();
  S.hand.push(id);
  S.pendingDraw=id;
  if(!silent) log(`你抽到了【${card(id).name}】。`);
  return id;
}

function drawEnemy(silent=false){
  if(!S.enemyDeck.length){
    if(S.discard.length) S.enemyDeck=shuffle([...S.discard]);
    else {fatigue(S.enemy);return null;}
  }
  if(S.enemyHand.length>=9)return null;
  return S.enemyHand.push(S.enemyDeck.pop());
}

function fatigue(p){
  p.curHp-=2;
  log(`${p.name} 受到2點疲勞傷害。`);
  showDamageNumber(2,"疲勞");
}

/* ========================= DRAW UX ========================= */

function showInitialDraw(){
  const ids=S.hand.slice(-5);
  let i=0;
  const next=()=>{
    if(i>=ids.length)return;
    const c=card(ids[i]);
    showDrawToast(c,i+1,5);
    i++;
    setTimeout(next,430);
  };
  next();
}

function showDrawToast(c,index,total){
  const layer=document.getElementById("fxLayer");
  if(!layer)return;
  layer.innerHTML=`
    <div class="draw-toast">
      <div class="draw-deck-symbol">✦</div>
      <div class="draw-card-mini">
        <div class="draw-card-glyph">${CARD_GLYPH[c.id]||"✦"}</div>
        <b>${esc(c.name)}</b>
        <small>${esc(c.type)} · ${c.cost} 神力</small>
      </div>
      <strong>抽牌 ${index}/${total}</strong>
    </div>`;
  layer.classList.add("active");
  setTimeout(()=>{
    layer.classList.remove("active");
    layer.innerHTML="";
  },360);
}

function showTurnDraw(c){
  if(!c)return;
  const layer=document.getElementById("fxLayer");
  if(!layer)return;
  layer.innerHTML=`
    <div class="draw-toast turn-draw">
      <div class="draw-deck-symbol">牌庫</div>
      <div class="draw-card-mini">
        <div class="draw-card-glyph">${CARD_GLYPH[c.id]||"✦"}</div>
        <b>${esc(c.name)}</b>
        <small>+1 抽牌</small>
      </div>
    </div>`;
  layer.classList.add("active");
  setTimeout(()=>{
    layer.classList.remove("active");
    layer.innerHTML="";
  },850);
}

/* ========================= DAMAGE / STATUS ========================= */

function damage(target,n,source="",options={}){
  let p=target;
  n=Math.max(0,Math.round(n));

  if(p.nextTaken){
    n+=p.nextTaken;
    p.nextTaken=0;
  }

  if(p.weakenDamage){
    n=Math.max(0,n-p.weakenDamage);
    p.weakenDamage=0;
  }

  if(p.domain){
    n=Math.max(0,n-2);
  }

  if(p.lastwall){
    n=Math.min(n,3);
  }

  let shield=p.shield||0;
  let blocked=options.ignoreShield?0:Math.min(shield,n);
  if(!options.ignoreShield)p.shield-=blocked;
  n-=blocked;

  if(n>0)p.curHp-=n;

  if(p===S.player && n>0){
    S.damageHistory++;
    if(p.id==="jingwei")p.stacks=(p.stacks||0)+1;
    if(p.id==="heracles" && source)p.trial=(p.trial||0)+1;
  }

  if(source){
    log(`${source} 對 ${p.name} 造成 ${n+blocked} 點傷害${blocked?`（護盾抵消${blocked}）`:""}。`);
  }

  if(p===S.player && p.reflect && n>0){
    const reflected=Math.min(3,n);
    p.reflect=0;
    damage(S.enemy,reflected,p.name+" 的反彈");
  }

  if(p.curHp<=0 && p.decoy){
    p.curHp=1;
    p.decoy=false;
    log(`${p.name} 以替身避開致命一擊！`);
    showFullScreenEffect("🪞","替身","致命傷害被替身承受","ward");
  }

  if(p.curHp<=0){
    endGame(target===S.player?S.enemy:S.player);
  }

  return n+blocked;
}

function heal(p,n){
  if(p.healBlocked){
    log(`${p.name} 的恢復效果被阻止。`);
    return 0;
  }
  const before=p.curHp;
  p.curHp=Math.min(p.hp,p.curHp+n);
  const gained=p.curHp-before;
  if(gained)log(`${p.name} 恢復 ${gained} HP。`);
  return gained;
}

function removeNegative(p){
  ["weakenDamage","nextTaken","poison","burn","reflect","healBlocked","skillBlocked","lastwall"].forEach(k=>delete p[k]);
}

/* ========================= CARD LOGIC ========================= */

function canUseCard(c){
  if(S.phase!=="player")return false;
  if(S.limit<=0)return false;
  if(S.mana<c.cost && !S.forbiddenNext)return false;
  if(S.player.attackLocked && c.type==="攻擊")return false;
  if(c.id==="counterstrike" && S.player.curHp>=S.enemy.curHp)return false;
  return true;
}

function useCard(i){
  if(S.phase!=="player")return;
  const id=S.hand[i];
  const c=card(id);
  if(!c || !canUseCard(c))return;

  const before={
    php:S.player.curHp, ehp:S.enemy.curHp,
    ps:S.player.shield||0, es:S.enemy.shield||0,
    mana:S.mana
  };

  S.hand.splice(i,1);
  const free=S.forbiddenNext;
  if(free)S.forbiddenNext=false;
  else S.mana-=c.cost;

  S.usedThisTurn=true;
  S.lastPlayerCard=c.id;
  S.discard.push(c.id);
  S.limit--;

  log(`你使用【${c.name}】。`);
  resolve(c,S.player,S.enemy,true);

  render();
  showCast(c);

  const effect=visualResult(c,before);
  setTimeout(()=>playEffect(c.type,c.name,effect),160);

  if(S.enemy.curHp<=0)return;
}

/* 核心牌效果 */
function resolve(c,me,op,isPlayer){
  const atk=(n,opt={})=>{
    let bonus=me.nextAtk||0;
    me.nextAtk=0;
    damage(op,n+bonus,me.name,opt);
  };

  if(c.type==="攻擊"){
    if(c.id==="strike")atk(4);
    else if(c.id==="fire"){atk(3);op.burn=1;}
    else if(c.id==="pierce")atk(4,{ignoreShield:true});
    else if(c.id==="double"){damage(op,2,me.name);damage(op,2,me.name);}
    else if(c.id==="crush"){atk(6);damage(me,1,me.name+" 反噬");}
    else if(c.id==="soul"){atk(4);op.healBlocked=true;}
    else if(c.id==="thunder"){
      if(S.lastPlayerCard==="thunder"){log("雷霆貫穿：連續攻擊不能使用。");return;}
      atk(7);
    }
    else if(c.id==="backstab")atk(S.enemyUsedSkill||S.enemyHand.length<9?5:2);
    if(me.id==="thor")me.stacks=Math.min(3,(me.stacks||0)+1);
  }

  else if(c.type==="防禦"){
    if(c.id==="shield")me.shield+=4;
    else if(c.id==="light")me.shield+=6;
    else if(c.id==="mirror"){me.shield+=3;me.reflect=3;}
    else if(c.id==="dodge")me.dodge=1;
    else if(c.id==="lastwall")me.lastwall=1;
  }

  else if(c.type==="恢復"){
    if(c.id==="gift")heal(me,6);
    else if(c.id==="rebirth")heal(me,me.curHp<=8?7:3);
    else if(c.id==="moonbless"){heal(me,2);drawPlayer()}
    else heal(me,4);
  }

  else if(c.type==="控制"){
    if(c.id==="seal")op.skillBlocked=1;
    else if(c.id==="silence"){
      if(op.hand.length){
        const ix=Math.floor(Math.random()*op.hand.length);
        op.silencedCard=op.hand[ix];
        log(`【${card(op.silencedCard).name}】被沉默。`);
      }
    }
    else if(c.id==="chaos")op.chaos=1;
    else if(c.id==="timestop")S.limit=1;
    else if(c.id==="rewind"){
      const last=S.lastEnemyCard;
      if(last)log(`命運逆轉：取消上一張【${card(last).name}】的後續效果。`);
    }
  }

  else if(c.type==="手牌"){
    if(c.id==="steal" && S.enemyHand.length){
      const ix=Math.floor(Math.random()*S.enemyHand.length);
      S.hand.push(S.enemyHand.splice(ix,1)[0]);
    }
    else if(c.id==="peek"){
      const shown=shuffle(S.enemyHand).slice(0,3).map(id=>card(id).name).join("、");
      log(`窺視：對手手牌 ${shown||"空"}。`);
    }
    else if(c.id==="swap" && S.enemyHand.length){
      const a=S.hand.length?S.hand[S.hand.length-1]:null;
      const b=S.enemyHand[Math.floor(Math.random()*S.enemyHand.length)];
      if(a){
        S.hand[S.hand.length-1]=b;
        S.enemyHand[S.enemyHand.indexOf(b)]=a;
      }
    }
    else if(c.id==="sacrifice"){
      if(S.hand.length){
        const lost=S.hand.pop();
        S.discard.push(lost);
        drawPlayer();drawPlayer();
      }
    }
    else if(c.id==="dice"){
      const r=Math.floor(Math.random()*4);
      if(r===0){drawPlayer();drawPlayer();}
      else if(r===1)heal(me,4);
      else if(r===2)damage(op,4,me.name);
      else S.mana=Math.min(6,S.mana+3);
    }
  }

  else if(c.type==="詛咒"){
    if(c.id==="curse")op.nextTaken=(op.nextTaken||0)+2;
    else if(c.id==="poison")op.poison=3;
    else if(c.id==="burn")op.burn=3;
    else if(c.id==="soulbind")op.soulbind=1;
    else if(c.id==="weaken")op.weakenDamage=3;
  }

  else if(c.type==="神力"){
    if(c.id==="infuse")S.mana=Math.min(6,S.mana+2);
    else if(c.id==="pact"){S.mana=Math.min(6,S.mana+4);me.pact=1;}
    else if(c.id==="wrath")me.nextAtk=(me.nextAtk||0)+4;
  }

  else if(c.type==="特殊"){
    if(c.id==="decoy")me.decoy=true;
    else if(c.id==="rollback")me.curHp=Math.min(me.hp,S.turnStartHp);
    else if(c.id==="stealfate" && S.lastEnemyCard){
      const copied=card(S.lastEnemyCard);
      log(`命運竊取：模仿【${copied.name}】。`);
      resolve(copied,me,op,isPlayer);
    }
    else if(c.id==="mirrorcard" && S.lastPlayerCard && S.lastPlayerCard!==c.id){
      const copied=card(S.lastPlayerCard);
      log(`鏡像：再次施放【${copied.name}】。`);
      resolve(copied,me,op,isPlayer);
    }
    else if(c.id==="forbidden")me.forbiddenNext=true;
  }

  else if(c.type==="傳說"){
    if(c.id==="ragnarok"){
      damage(me,5,"諸神黃昏",{ignoreShield:true});
      damage(op,5,"諸神黃昏",{ignoreShield:true});
    }
    else if(c.id==="rewrite"){
      const mid=Math.min(me.curHp,op.curHp);
      me.curHp=Math.max(1,Math.min(me.hp,mid+2));
      op.curHp=Math.max(1,Math.min(op.hp,mid-3));
    }
    else if(c.id==="judgment"){atk(10);me.skillBlocked=1;}
    else if(c.id==="chaosfall"){
      for(let k=0;k<2;k++){
        if(S.hand.length){const x=S.hand.pop();S.discard.push(x);}
        if(S.enemyHand.length)S.enemyHand.pop();
      }
      drawPlayer();drawPlayer();
      drawEnemy();drawEnemy();
    }
    else if(c.id==="counterstrike")atk(Math.min(7,Math.max(1,Math.floor((op.curHp-me.curHp)/2))));
    else if(c.id==="deathrefuse")me.decoy=true;
    else if(c.id==="allone"){removeNegative(me);heal(me,5);}
    else if(c.id==="coin"){
      if(Math.random()<.5)atk(8);
      else damage(me,4,me.name+" 命運硬幣");
    }
    else if(c.id==="domain"){me.domain=1;op.domain=1;}
    else if(c.id==="endbell")S.limit=1;
  }
}

/* ========================= SKILLS ========================= */

function useSkill(){
  if(S.phase!=="player"||S.mana<S.player.skillCost||S.skillCooldown>0||S.player.skillBlocked)return;

  const before={php:S.player.curHp,ehp:S.enemy.curHp,ps:S.player.shield||0,es:S.enemy.shield||0};
  S.mana-=S.player.skillCost;
  S.skillCooldown=2;
  S.playerUsedSkill=true;
  S.player.usedSkill=true;

  const id=S.player.id;

  if(id==="nuwa")heal(S.player,5);
  else if(id==="amaterasu"){heal(S.player,4);S.player.nextTaken=(S.player.nextTaken||0)-0;}
  else if(id==="izanagi")heal(S.player,3);
  else if(id==="houyi"){damage(S.enemy,8,S.player.name);S.player.attackLocked=1;}
  else if(id==="anubis")damage(S.enemy,S.enemy.curHp<=8?8:4,S.player.name);
  else if(id==="medusa")S.limit=1;
  else if(id==="loki")S.enemy.reflect=1;
  else if(id==="freya")S.enemy.weakenDamage=4;
  else if(id==="morrigan")S.enemy.nextTaken=(S.enemy.nextTaken||0)+3;
  else if(id==="shiva"){damage(S.enemy,6+(S.player.stacks||0),S.player.name);S.player.stacks=0;}
  else if(id==="thor"){damage(S.enemy,5+(S.player.stacks||0),S.player.name);S.player.stacks=0;}
  else if(id==="hades"){damage(S.enemy,(S.player.stacks||0)*2,S.player.name);S.player.stacks=0;}
  else if(id==="gilgamesh")damage(S.enemy,5+(S.enemyUsedSkill?3:0),S.player.name);
  else if(id==="susanoo")damage(S.enemy,S.player.curHp<=12?10:8,S.player.name);
  else if(id==="nezha")damage(S.enemy,5+(S.usedThisTurn?2:0),S.player.name);
  else if(id==="wukong")damage(S.enemy,S.enemy.shield>0?4:6,S.player.name);
  else if(id==="erlang")damage(S.enemy,5+(S.lastEnemyCard&&card(S.lastEnemyCard).type==="攻擊"?2:0),S.player.name);
  else if(id==="chang_e"){if(S.enemyHand.length)S.enemyHand.splice(Math.floor(Math.random()*S.enemyHand.length),1);}
  else if(id==="jingwei"){damage(S.enemy,S.player.stacks||0,S.player.name);S.player.stacks=0;}
  else if(id==="zhongkui"){damage(S.enemy,4,S.player.name);removeNegative(S.player);}
  else if(id==="tsukuyomi"){if(S.enemyHand.length>3)S.enemyHand.splice(Math.floor(Math.random()*S.enemyHand.length),1);else damage(S.enemy,3,S.player.name);}
  else if(id==="hanuman")S.player.shield+=4;
  else if(id==="garuda"){damage(S.enemy,5,S.player.name);S.enemy.shield=0;}
  else if(id==="zeus")damage(S.enemy,7,S.player.name);
  else if(id==="athena"){S.player.shield+=3;S.player.reflect=3;}
  else if(id==="heracles")damage(S.enemy,4+(S.player.trial||0),S.player.name);
  else if(id==="loki")S.enemy.reflect=1;
  else if(id==="odin"){if(S.hand.length){S.discard.push(S.hand.pop());drawPlayer();drawPlayer();}}
  else if(id==="ra"){damage(S.enemy,6,S.player.name);S.enemy.burn=2;}
  else if(id==="osiris"){const pick=S.discard.find(x=>card(x).cost<=2);if(pick){S.discard.splice(S.discard.indexOf(pick),1);S.hand.push(pick);}}
  else if(id==="morrigan")S.enemy.nextTaken=(S.enemy.nextTaken||0)+3;
  else if(id==="cernunnos"){damage(S.enemy,4,S.player.name);heal(S.player,4);}

  log(`你發動【${S.player.skill}】。`);
  render();
  playEffect("技能",S.player.skill,visualResult({type:"技能",name:S.player.skill},before));
}

function skillUI(p){
  return `<div class="skill">
    <b>✦ ${esc(p.skill)}</b>
    <span class="small">${esc(p.desc)}</span>
    <button onclick="useSkill()" ${S.phase!=="player"||S.mana<p.skillCost||S.skillCooldown>0||p.skillBlocked?"disabled":""}>
      消耗 ${p.skillCost} ⚡ ${S.skillCooldown?`CD ${S.skillCooldown}`:"發動"}
    </button>
  </div>`;
}

/* ========================= ENEMY ========================= */

function endTurn(){
  if(S.phase!=="player")return;
  S.phase="enemy";
  log(`第${S.turn}回合結束。`);
  enemyTurn();
}

function enemyTurn(){
  if(S.enemy.curHp<=0)return;

  S.enemyMana=Math.min(6,S.enemyMana+3);
  S.enemySkillCooldown=Math.max(0,S.enemySkillCooldown-1);

  if(S.enemy.burn){damage(S.enemy,S.enemy.burn,"灼熱");S.enemy.burn=0;}
  if(S.enemy.poison){damage(S.enemy,1,"中毒");S.enemy.poison--;}
  if(S.enemy.pact){S.enemyMana=Math.max(0,S.enemyMana-2);S.enemy.pact=0;}

  let played=0;
  const use=(ix)=>{if(ix<0)return false;enemyUse(ix);played++;return true;};

  if(S.enemy.curHp<=8){
    let ix=S.enemyHand.findIndex(id=>["spring","gift","rebirth","allone"].includes(id)&&card(id).cost<=S.enemyMana);
    if(use(ix)){}
  }
  if(!played){
    let ix=S.enemyHand.findIndex(id=>card(id).type==="攻擊"&&card(id).cost<=S.enemyMana);
    use(ix);
  }
  if(!played){
    let ix=S.enemyHand.findIndex(id=>card(id).type==="防禦"&&card(id).cost<=S.enemyMana);
    use(ix);
  }
  if(!played && S.enemyMana>=S.enemy.skillCost && S.enemySkillCooldown===0 && !S.enemy.skillBlocked){
    enemySkill();played++;
  }
  if(!played){
    const ix=S.enemyHand.findIndex(id=>card(id).cost<=S.enemyMana);
    use(ix);
  }

  startPlayerTurn();
}

function enemyUse(ix){
  const id=S.enemyHand[ix];
  const c=card(id);
  if(S.enemy.silencedCard===id){
    log(`對手的【${c.name}】仍在沉默中。`);
    return;
  }

  S.enemyHand.splice(ix,1);
  S.enemyMana=Math.max(0,S.enemyMana-c.cost);
  S.enemyUsedSkill=false;
  S.lastEnemyCard=c.id;
  S.discard.push(c.id);

  log(`對手使用【${c.name}】。`);
  resolveEnemy(c);
}

function resolveEnemy(c){
  if(c.type==="攻擊"){
    const n={strike:4,fire:3,pierce:4,double:4,crush:6,soul:4,thunder:7,backstab:3}[c.id]||3;
    damagePlayer(n);
    if(c.id==="fire")S.player.burn=1;
  }
  else if(c.type==="防禦"){
    S.enemy.shield+=c.id==="light"?6:c.id==="shield"?4:3;
  }
  else if(c.type==="恢復")heal(S.enemy,c.id==="gift"?6:c.id==="rebirth"?(S.enemy.curHp<=8?7:3):4);
  else if(c.type==="神力")S.enemyMana=Math.min(6,S.enemyMana+(c.id==="infuse"?2:c.id==="pact"?4:0));
  else if(c.type==="詛咒"){
    if(c.id==="curse")S.player.nextTaken=(S.player.nextTaken||0)+2;
    if(c.id==="poison")S.player.poison=3;
    if(c.id==="burn")S.player.burn=3;
    if(c.id==="weaken")S.player.weakenDamage=3;
  }
}

function damagePlayer(n){
  if(S.player.dodge){
    S.player.dodge=0;
    if(Math.random()<.5){
      log("閃避成功！");
      showFullScreenEffect("🌪","閃避","攻擊完全落空","dodge");
      return;
    }
  }

  if(S.player.weakenDamage){
    n=Math.max(0,n-S.player.weakenDamage);
    S.player.weakenDamage=0;
  }

  damage(S.player,n,S.enemy.name);
}

function enemySkill(){
  S.enemyMana-=S.enemy.skillCost;
  S.enemySkillCooldown=2;
  S.enemyUsedSkill=true;

  const id=S.enemy.id;
  if(["nuwa","amaterasu","cernunnos"].includes(id))heal(S.enemy,5);
  else if(id==="houyi")damage(S.player,8,S.enemy.name);
  else if(id==="susanoo")damage(S.player,S.enemy.curHp<=12?10:8,S.enemy.name);
  else if(id==="zeus")damage(S.player,7,S.enemy.name);
  else if(id==="thor")damage(S.player,5,S.enemy.name);
  else if(id==="anubis")damage(S.player,S.player.curHp<=8?8:4,S.enemy.name);
  else damage(S.player,5,S.enemy.name);

  log(`對手發動【${S.enemy.skill}】。`);
  showFullScreenEffect("✦","敵方技能",S.enemy.skill,"enemy-skill");
}

function startPlayerTurn(){
  if(S.player.curHp<=0)return;

  S.turn++;
  S.phase="player";
  S.mana=Math.min(6,S.mana+3);
  S.skillCooldown=Math.max(0,S.skillCooldown-1);
  S.usedThisTurn=false;
  S.turnStartHp=S.player.curHp;
  S.limit=99;
  S.player.attackLocked=false;

  if(S.player.poison){damage(S.player,1,"中毒");S.player.poison--;}
  if(S.player.burn){damage(S.player,S.player.burn,"灼熱");S.player.burn=0;}
  if(S.player.pact){S.mana=Math.max(0,S.mana-2);S.player.pact=0;}

  const drawn=drawPlayer();
  render();
  if(drawn)setTimeout(()=>showTurnDraw(card(drawn)),180);
}

/* ========================= VISUALS ========================= */

function cardVisual(c){
  const h=CARD_HUE[c.id]??210;
  const glyph=CARD_GLYPH[c.id]||TYPE_ICON[c.type]||"✦";
  const src=CARD_ART[c.id];
  const art=src?`,url('${src}')`:"";
  return {
    glyph,
    style:`background-image:radial-gradient(circle at 50% 30%,hsla(${h},95%,72%,.50),transparent 27%),linear-gradient(145deg,hsla(${h},72%,22%,.96),hsla(${(h+45)%360},70%,8%,.98))${art}`
  };
}

function cardUI(c,i){
  const v=cardVisual(c);
  const disabled=!canUseCard(c);
  return `<article class="card ${disabled?"disabled":""}" onclick="useCard(${i})" style="--card-h:${CARD_HUE[c.id]??210}">
    <span class="rarity">${c.rarity}</span>
    <span class="cost">${c.cost}</span>
    <div class="type">${c.type}</div>
    <div class="card-illustration ${c.type}" style="${v.style}">
      <div class="card-art-glyph">${v.glyph}</div>
      <div class="card-shine"></div>
    </div>
    <h3>${esc(c.name)}</h3>
    <p>${esc(c.desc)}</p>
  </article>`;
}

function showCast(c){
  const layer=document.getElementById("fxLayer");
  if(!layer)return;
  const icon=TYPE_ICON[c.type]||"✦";
  layer.innerHTML=`<div class="cast-card"><span>${icon}</span><b>${esc(c.name)}</b><small>施放</small></div>`;
  layer.classList.add("active");
  setTimeout(()=>layer.classList.remove("active"),430);
  setTimeout(()=>layer.innerHTML="",520);
}

function showFullScreenEffect(icon,title,sub,cls=""){
  const layer=document.getElementById("fxLayer");
  if(!layer)return;
  layer.innerHTML=`<div class="full-effect ${cls}">
    <div class="full-effect-icon">${icon}</div>
    <strong>${esc(title)}</strong>
    <small>${esc(sub)}</small>
  </div>`;
  layer.classList.add("active");
  setTimeout(()=>{
    layer.classList.remove("active");
    layer.innerHTML="";
  },850);
}

function showDamageNumber(n,label){
  const layer=document.getElementById("fxLayer");
  if(!layer)return;
  layer.innerHTML=`<div class="damage-pop"><b>-${n}</b><small>${esc(label)}</small></div>`;
  layer.classList.add("active");
  setTimeout(()=>{layer.classList.remove("active");layer.innerHTML=""},650);
}

function visualResult(c,before){
  return {
    damage:Math.max(0,before.ehp-S.enemy.curHp),
    heal:Math.max(0,S.player.curHp-before.php),
    shield:Math.max(0,(S.player.shield||0)-before.ps),
    kind:c.type
  };
}

function playEffect(type,name,info={}){
  const layer=document.getElementById("fxLayer");
  if(!layer)return;

  const cls=({
    攻擊:"slash",防禦:"ward",恢復:"heal",詛咒:"curse",
    控制:"curse",神力:"mana",技能:"ultimate",傳說:"ultimate"
  })[type]||"spark";

  const icon={slash:"⚔",ward:"🛡",heal:"✚",curse:"☠",mana:"⚡",ultimate:"✦",spark:"✧"}[cls]||"✦";
  let value="";
  if(info.damage)value=`<strong class="fx-number damage">-${info.damage}</strong>`;
  else if(info.heal)value=`<strong class="fx-number heal-num">+${info.heal}</strong>`;
  else if(info.shield)value=`<strong class="fx-number shield-num">+${info.shield}</strong>`;

  layer.innerHTML=`<div class="fx-burst ${cls}">
    <div class="fx-ring"></div><span>${icon}</span>${value}
    <b>${esc(info.damage?"命中":info.heal?"恢復":info.shield?"護盾展開":name)}</b>
    <em>${esc(name)}</em>
  </div>`;
  layer.classList.add("active");

  const board=document.querySelector(".board");
  if(board){
    board.classList.remove("impact-shake","heal-pulse","ward-pulse","skill-pulse");
    void board.offsetWidth;
    board.classList.add(info.damage?"impact-shake":info.heal?"heal-pulse":info.shield?"ward-pulse":"skill-pulse");
    setTimeout(()=>board.classList.remove("impact-shake","heal-pulse","ward-pulse","skill-pulse"),720);
  }

  setTimeout(()=>{
    layer.classList.remove("active");
    layer.innerHTML="";
  },1050);
}

/* ========================= BATTLE UI ========================= */

function battle(){
  const p=S.player,e=S.enemy;
  app.innerHTML=`
  <main class="battle v7-battle">
    <div class="battle-backdrop"></div><div class="battle-veil"></div>

    <div class="toolbar">
      <div>
        <div class="brand" style="text-align:left;font-size:24px">神話爭鋒</div>
        <div class="small">第 ${S.turn} 回合 · ${S.phase==="player"?"你的回合":"對手回合"}</div>
      </div>
      <button class="ghost" onclick="S.screen='select';render()">退出戰鬥</button>
    </div>

    <div class="battle-top">
      ${fighter(p,false)}
      <div class="vs">VS</div>
      ${fighter(e,true)}
    </div>

    <section class="board">
      <div id="fxLayer" class="fx-layer" aria-live="polite"></div>

      <div class="battle-resources">
        <span>🃏 牌庫 <b>${S.deck.length}</b></span>
        <span>✋ 手牌 <b>${S.hand.length}/9</b></span>
        <span>♻ 棄牌 <b>${S.discard.length}</b></span>
        <span class="mana">⚡ 神力 ${S.mana}/6</span>
        <button class="endturn" onclick="endTurn()" ${S.phase!=="player"?"disabled":""}>結束回合</button>
      </div>

      <div class="log">${S.log.map(x=>`<div>› ${esc(x)}</div>`).join("")}</div>
      ${skillUI(p)}

      <div class="hand-title">
        <span>你的手牌</span>
        <small>點擊出牌 · 滑過卡牌查看</small>
      </div>

      <div class="hand">${S.hand.map((id,i)=>cardUI(card(id),i)).join("")}</div>
    </section>
  </main>`;
}

function fighter(c,enemy){
  return `<div class="fighter ${enemy?"enemy":""}" style="--c1:${c.c1};--c2:${c.c2}">
    <div class="fighter-art">${portraitHTML(c,"fighter-portrait")}</div>
    <div class="fighter-overlay">
      <div class="fighter-head">
        <div>
          <b>${esc(c.name)}</b>
          <div class="small">${esc(c.origin)} · ${esc(c.tag)}</div>
          <div class="mana">⚡ ${enemy?S.enemyMana:S.mana}/6</div>
        </div>
        <span class="role-chip">${enemy?"敵方":"我方"}</span>
      </div>
      <div class="hpbar"><div class="hpfill" style="width:${Math.max(0,c.curHp/c.hp*100)}%"></div></div>
      <div class="status">HP ${Math.max(0,c.curHp)} / ${c.hp}　護盾 ${c.shield||0}</div>
    </div>
  </div>`;
}

/* ========================= GAME END ========================= */

function endGame(winner){
  S.phase="over";
  const win=winner===S.player;
  setTimeout(()=>{
    app.innerHTML=`<div class="modal"><div class="modal-box">
      <div class="brand" style="font-size:34px">${win?"勝利":"敗北"}</div>
      <p>${win?`你以 ${S.player.curHp} HP 擊敗了 ${esc(S.enemy.name)}。`:`${esc(S.enemy.name)} 擊敗了你。`}</p>
      <p class="small">戰鬥回合：${S.turn}　剩餘牌庫：${S.deck.length}</p>
      <button class="cta" onclick="S.screen='draw';drawnId=null;rerolls=0;drawScreen()">再戰一場</button>
    </div></div>`;
  },500);
}

render();
