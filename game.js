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
  nezha:"assets/characters/nezha.webp", wukong:"assets/characters/wukong.webp",
  erlang:"assets/characters/erlang.webp", nuwa:"assets/characters/nuwa.webp",
  chang_e:"assets/characters/chang_e.webp", houyi:"assets/characters/houyi.webp",
  jingwei:"assets/characters/jingwei.webp", zhongkui:"assets/characters/zhongkui.webp",
  amaterasu:"assets/characters/amaterasu.webp", susanoo:"assets/characters/susanoo.webp",
  tsukuyomi:"assets/characters/tsukuyomi.webp", izanagi:"assets/characters/izanagi.webp",
  hanuman:"assets/characters/hanuman.webp", shiva:"assets/characters/shiva.webp",
  garuda:"assets/characters/garuda.webp", zeus:"assets/characters/zeus.webp",
  athena:"assets/characters/athena.webp", hades:"assets/characters/hades.webp",
  medusa:"assets/characters/medusa.webp", heracles:"assets/characters/heracles.webp",
  loki:"assets/characters/loki.webp", thor:"assets/characters/thor.webp",
  odin:"assets/characters/odin.webp", freya:"assets/characters/freya.webp",
  anubis:"assets/characters/anubis.webp", ra:"assets/characters/ra.webp",
  osiris:"assets/characters/osiris.webp", morrigan:"assets/characters/morrigan.webp",
  gilgamesh:"assets/characters/gilgamesh.webp", cernunnos:"assets/characters/cernunnos.webp"
};

const CARD_ART = Object.fromEntries(
  ["strike","fire","pierce","double","crush","soul","thunder","backstab","shield","light","mirror","dodge","lastwall","spring","gift","rebirth","moonbless","seal","silence","chaos","timestop","rewind","steal","peek","swap","sacrifice","dice","curse","poison","burn","soulbind","weaken","infuse","pact","wrath","decoy","rollback","stealfate","mirrorcard","forbidden","ragnarok","rewrite","judgment","chaosfall","counterstrike","deathrefuse","allone","coin","domain","endbell"]
  .map(id=>[id,`assets/cards/${id}.webp`])
);

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
  hand:[], enemyHand:[], discard:[], enemyDiscard:[], deck:[], enemyDeck:[],
  log:[], lastPlayerCard:null, lastEnemyCard:null,
  shield:0, enemyShield:0, usedThisTurn:false,
  skillCooldown:0, enemySkillCooldown:0,
  playerUsedSkill:false, enemyUsedSkill:false,
  drawLock:0, limit:99, playerTurnLimit:99, enemyTurnLimit:99,
  turnStartHp:0, forbiddenNext:false, lastEnemySnapshot:null, lastPlayerSnapshot:null, domainTurns:0,
  pendingDraw:null, damageHistory:0, resolving:false
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
  S.player={...pc,curHp:pc.hp,shield:0,usedSkill:false,skillUses:0,stacks:0,trial:0,forbiddenNext:false,zeusPassiveUsed:false,turnLimit:99,rebirthOnce:pc.id==='izanagi'};
  const choices=shuffle(CHARACTERS.filter(c=>c.id!==id));
  const ec=choices[0];
  S.enemy={...ec,curHp:ec.hp,shield:0,usedSkill:false,skillUses:0,stacks:0,trial:0,forbiddenNext:false,zeusPassiveUsed:false,turnLimit:99,rebirthOnce:ec.id==='izanagi'};

  S.deck=starterDeck();
  S.enemyDeck=starterDeck();
  S.hand=[]; S.enemyHand=[]; S.discard=[]; S.enemyDiscard=[];
  S.turn=1; S.phase="player"; S.mana=3; S.enemyMana=3;
  S.skillCooldown=0; S.enemySkillCooldown=0;
  S.usedThisTurn=false; S.playerUsedSkill=false; S.enemyUsedSkill=false;
  S.lastPlayerCard=null; S.lastEnemyCard=null; S.log=[];
  S.turnStartHp=S.player.curHp;
  S.forbiddenNext=false; S.drawLock=0; S.limit=99; S.playerTurnLimit=99; S.enemyTurnLimit=99; S.lastEnemySnapshot=null; S.lastPlayerSnapshot=null; S.domainTurns=0; S.damageHistory=0; S.resolving=false;

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
  if(S.enemyHand.length>=9)return null;
  if(!S.enemyDeck.length){
    if(S.enemyDiscard.length){ S.enemyDeck=shuffle(S.enemyDiscard.splice(0)); log("對手牌庫耗盡，重新洗牌。"); }
    else { fatigue(S.enemy); return null; }
  }
  const id=S.enemyDeck.pop();
  S.enemyHand.push(id);
  return id;
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
  n=Math.max(0,n);

  let shield=p.shield||0;
  const pierce=Math.max(0,options.shieldPierce||0);
  const effectiveShield=Math.max(0,shield-pierce);
  let blocked=options.ignoreShield?0:Math.min(effectiveShield,n);
  if(!options.ignoreShield)p.shield=Math.max(0,shield-blocked-pierce);
  n-=blocked;

  if(n>0)p.curHp-=n;

  if(n>0){
    if(p===S.player)S.damageHistory++;
    if(p.id==="jingwei")p.stacks=(p.stacks||0)+1;
    if(p.id==="heracles" && source)p.trial=(p.trial||0)+1;
  }

  if(source){
    log(`${source} 對 ${p.name} 造成 ${n+blocked} 點傷害${blocked?`（護盾抵消${blocked}）`:""}。`);
  }

  if(p.reflect && n>0){
    const reflected=Math.min(3,n);
    const attacker=source===S.player?.name?S.player:(source===S.enemy?.name?S.enemy:null);
    p.reflect=0;
    if(attacker)damage(attacker,reflected,p.name+" 的反彈");
  }

  if(p.curHp<=0 && p.rebirthOnce){p.curHp=1;p.rebirthOnce=false;log(`${p.name} 拒絕死亡，保留1 HP！`);showFullScreenEffect("☠","死亡拒絕","致命傷害被改寫為1 HP","ward");}

  if(p.curHp<=0 && p.decoy){
    p.curHp=1;
    p.decoy=false;
    log(`${p.name} 以替身避開致命一擊！`);
    showFullScreenEffect("🪞","替身","致命傷害被替身承受","ward");
  }

  if(p.curHp<=0 && !S.resolving){
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
  ["weakenDamage","nextTaken","poison","burn","reflect","healBlocked","skillBlocked","lastwall","chaos","soulbind","attackLocked"].forEach(k=>delete p[k]);
}

/* ========================= CARD LOGIC ========================= */

function canUseCard(c){
  if(S.phase!=="player")return false;
  if(S.playerTurnLimit<=0)return false;
  const extra=S.player.soulbind?1:0;
  if(S.mana<c.cost+extra && !S.player.forbiddenNext)return false;
  if(S.player.attackLocked && c.type==="攻擊")return false;
  if(S.player.silencedCard===c.id)return false;
  if(c.id==="counterstrike" && S.player.curHp>=S.enemy.curHp)return false;
  if(c.id==="thunder" && S.lastPlayerCard==="thunder")return false;
  return true;
}

function useCard(i){
  if(S.phase!=="player")return;
  const id=S.hand[i], c=card(id);
  if(!c||!canUseCard(c))return;
  const before={php:S.player.curHp,ehp:S.enemy.curHp,ps:S.player.shield||0,es:S.enemy.shield||0,mana:S.mana};
  const previousCard=S.lastPlayerCard;
  S.lastPlayerSnapshot=snapshotBattle();
  S.hand.splice(i,1);
  const free=S.player.forbiddenNext; S.player.forbiddenNext=false;
  const totalCost=free?0:c.cost+(S.player.soulbind?1:0);
  if(totalCost)S.mana=Math.max(0,S.mana-totalCost);
  S.usedThisTurn=true; S.lastPlayerCard=c.id; S.player.previousCard=previousCard; S.discard.push(c.id); if(S.player.id==='hades')S.player.stacks=(S.player.stacks||0)+1;
  S.playerTurnLimit=Math.max(0,S.playerTurnLimit-1); S.limit=S.playerTurnLimit;
  if(S.player.soulbind)delete S.player.soulbind;
  log(`你使用【${c.name}】。`);
  S.resolving=true; resolve(c,S.player,S.enemy,true); S.resolving=false;
  if(S.player.curHp<=0){endGame(S.enemy);return;} if(S.enemy.curHp<=0){endGame(S.player);return;}
  render(); showCast(c);
  const effect=visualResult(c,before); setTimeout(()=>playEffect(c.type,c.name,effect),160);
}

/* 核心牌效果 */
function cloneUnit(p){ return JSON.parse(JSON.stringify(p)); }
function snapshotBattle(){
  return {player:cloneUnit(S.player),enemy:cloneUnit(S.enemy),hand:[...S.hand],enemyHand:[...S.enemyHand],deck:[...S.deck],enemyDeck:[...S.enemyDeck],mana:S.mana,enemyMana:S.enemyMana,discard:[...S.discard],enemyDiscard:[...S.enemyDiscard],limit:S.playerTurnLimit,enemyLimit:S.enemyTurnLimit};
}
function restoreBattle(snap, keepEnemyCard=null){
  S.player=snap.player; S.enemy=snap.enemy; S.hand=[...snap.hand]; S.enemyHand=[...snap.enemyHand]; S.deck=[...snap.deck]; S.enemyDeck=[...snap.enemyDeck]; S.mana=snap.mana; S.enemyMana=snap.enemyMana; S.discard=[...snap.discard]; S.enemyDiscard=[...snap.enemyDiscard]; S.playerTurnLimit=snap.limit; S.enemyTurnLimit=snap.enemyLimit;
  if(keepEnemyCard){ const ix=S.enemyHand.indexOf(keepEnemyCard); if(ix>=0)S.enemyHand.splice(ix,1); S.enemyDiscard.push(keepEnemyCard); }
}
function handOf(me){return me===S.player?S.hand:S.enemyHand;}
function deckOf(me){return me===S.player?S.deck:S.enemyDeck;}
function discardOf(me){return me===S.player?S.discard:S.enemyDiscard;}
function manaOf(me){return me===S.player?S.mana:S.enemyMana;}
function setMana(me,v){if(me===S.player)S.mana=v;else S.enemyMana=v;}
function drawFor(me,count=1,silent=false){
  const out=[];
  for(let i=0;i<count;i++){
    const hand=handOf(me), discard=discardOf(me);
    if(hand.length>=9)break;
    let deck=deckOf(me);
    if(!deck.length){
      if(discard.length){
        const fresh=shuffle(discard.splice(0));
        if(me===S.player)S.deck=fresh; else S.enemyDeck=fresh;
        log(`${me.name} 的牌庫耗盡，棄牌堆重新洗回牌庫。`);
      }else{fatigue(me);break;}
      deck=deckOf(me);
    }
    if(!deck.length)break;
    const id=deck.pop(); hand.push(id); out.push(id);
    if(me===S.player && !silent){S.pendingDraw=id;log(`你抽到了【${card(id).name}】。`);}
  }
  return out;
}
function clearTurnStatuses(p){
  ['skillBlocked','silencedCard','chaos','attackLocked','turnLimit','soulbind'].forEach(k=>delete p[k]);
  delete p.lastwall;
  delete p.dodge;
  delete p.domain;
}
function applyStartOfTurn(p){
  p.turnLimit=99;
  if(p.nextSkillBlocked){p.skillBlocked=1;delete p.nextSkillBlocked;}
  if(p.nextAttackLocked){p.attackLocked=true;delete p.nextAttackLocked;}
  if(p.pact){
    const m=p===S.player?S.mana:S.enemyMana;
    setMana(p,Math.max(0,m-2));
    delete p.pact;
    log(`${p.name} 的神之契約反噬：失去2神力。`);
  }
  if(p.poison){damage(p,1,'中毒');p.poison--;}
  if(p.burn){damage(p,p.burn,'灼熱');p.burn=0;}
  if(p.domainTurns){p.domain=true;}
}
function resolve(c,me,op,isPlayer){
  const hand=handOf(me), opponentHand=handOf(op);
  const atk=(n,opt={})=>{
    let bonus=me.nextAtk||0; me.nextAtk=0;
    let amount=n+bonus;
    if(op.chaos){
      delete op.chaos;
      if(Math.random()<0.5){
        log(`混亂生效：${me.name} 的攻擊反噬自己。`);
        damage(me,amount,me.name+' 混亂反噬');
        return;
      }
    }
    if(me.id==='zeus' && c.type==='攻擊' && !me.zeusPassiveUsed && Math.random()<0.5){amount+=2;me.zeusPassiveUsed=true;log('宙斯被動：雷霆加護 +2。');}
    damage(op,amount,me.name,opt);
  };
  if(c.type==='攻擊'){
    if(c.id==='strike')atk(4);
    else if(c.id==='fire'){atk(3);op.burn=1;}
    else if(c.id==='pierce')atk(4,{shieldPierce:1});
    else if(c.id==='double'){atk(2); if(op.curHp>0)atk(2);}
    else if(c.id==='crush'){atk(6);damage(me,1,me.name+' 反噬');}
    else if(c.id==='soul'){atk(4);op.healBlocked=1;}
    else if(c.id==='thunder')atk(7);
    else if(c.id==='backstab')atk(op.usedThisTurn?5:2);
    if(me.id==='thor')me.stacks=Math.min(3,(me.stacks||0)+1);
  } else if(c.type==='防禦'){
    if(c.id==='shield')me.shield=(me.shield||0)+4;
    else if(c.id==='light')me.shield=(me.shield||0)+6;
    else if(c.id==='mirror'){me.shield=(me.shield||0)+3;me.reflect=3;}
    else if(c.id==='dodge')me.dodge=1;
    else if(c.id==='lastwall')me.lastwall=1;
  } else if(c.type==='恢復'){
    if(c.id==='gift')heal(me,6);
    else if(c.id==='rebirth')heal(me,me.curHp<=8?7:3);
    else if(c.id==='moonbless'){heal(me,2);drawFor(me,1);}
    else heal(me,4);
  } else if(c.type==='控制'){
    if(c.id==='seal')op.skillBlocked=1;
    else if(c.id==='silence'){
      if(opponentHand.length){const ix=Math.floor(Math.random()*opponentHand.length);op.silencedCard=opponentHand[ix];log(`【${card(op.silencedCard).name}】被沉默，持續至對方本回合結束。`);}
    } else if(c.id==='chaos')op.chaos=1;
    else if(c.id==='timestop')op.turnLimit=1;
    else if(c.id==='rewind'){
      const snap=isPlayer?S.lastEnemySnapshot:S.lastPlayerSnapshot;
      const id=isPlayer?S.lastEnemyCard:S.lastPlayerCard;
      if(snap && id){
        const currentMeHand=[...handOf(me)], currentMeDiscard=[...discardOf(me)], currentMeMana=manaOf(me), currentLimit=isPlayer?S.playerTurnLimit:S.enemyTurnLimit;
        restoreBattle(snap,isPlayer?id:null);
        if(isPlayer){S.hand=currentMeHand;S.discard=currentMeDiscard;S.mana=currentMeMana;S.playerTurnLimit=currentLimit;S.limit=currentLimit;S.lastEnemyCard=null;S.lastEnemySnapshot=null;}
        else {S.enemyHand=currentMeHand;S.enemyDiscard=currentMeDiscard;S.enemyMana=currentMeMana;S.enemyTurnLimit=currentLimit;S.lastPlayerCard=null;S.lastPlayerSnapshot=null;}
        log(`命運逆轉：撤銷上一張【${card(id).name}】的效果。`);
      } else log('命運逆轉沒有可撤銷的上一張牌。');
    }
  } else if(c.type==='手牌'){
    if(c.id==='steal' && opponentHand.length){const ix=Math.floor(Math.random()*opponentHand.length);hand.push(opponentHand.splice(ix,1)[0]);}
    else if(c.id==='peek'){const shown=shuffle(opponentHand).slice(0,3).map(id=>card(id).name).join('、');log(`窺視：對手手牌 ${shown||'空'}。`);}
    else if(c.id==='swap' && opponentHand.length && hand.length){const a=hand[hand.length-1];const ix=Math.floor(Math.random()*opponentHand.length);const b=opponentHand[ix];hand[hand.length-1]=b;opponentHand[ix]=a;}
    else if(c.id==='sacrifice' && hand.length){const lost=hand.pop();discardOf(me).push(lost);drawFor(me,2);}
    else if(c.id==='dice'){const r=Math.floor(Math.random()*4);if(r===0)drawFor(me,2);else if(r===1)heal(me,4);else if(r===2)damage(op,4,me.name);else setMana(me,Math.min(6,manaOf(me)+3));}
  } else if(c.type==='詛咒'){
    if(c.id==='curse')op.nextTaken=(op.nextTaken||0)+2;
    else if(c.id==='poison')op.poison=3;
    else if(c.id==='burn')op.burn=3;
    else if(c.id==='soulbind')op.soulbind=1;
    else if(c.id==='weaken')op.weakenDamage=3;
  } else if(c.type==='神力'){
    if(c.id==='infuse')setMana(me,Math.min(6,manaOf(me)+2));
    else if(c.id==='pact'){setMana(me,Math.min(6,manaOf(me)+4));me.pact=1;}
    else if(c.id==='wrath')me.nextAtk=(me.nextAtk||0)+4;
  } else if(c.type==='特殊'){
    if(c.id==='decoy')me.decoy=true;
    else if(c.id==='rollback')me.curHp=Math.min(me.hp,me.turnStartHp);
    else if(c.id==='stealfate' && (isPlayer?S.lastEnemyCard:S.lastPlayerCard)){const copied=card(isPlayer?S.lastEnemyCard:S.lastPlayerCard);log(`命運竊取：模仿【${copied.name}】。`);resolve(copied,me,op,isPlayer);}
    else if(c.id==='mirrorcard' && (isPlayer?S.lastPlayerCard:S.lastEnemyCard) && (isPlayer?S.lastPlayerCard:S.lastEnemyCard)!=='mirrorcard'){const copied=card(isPlayer?S.lastPlayerCard:S.lastEnemyCard);log(`鏡像：再次施放【${copied.name}】。`);resolve(copied,me,op,isPlayer);}
    else if(c.id==='forbidden')me.forbiddenNext=true;
  } else if(c.type==='傳說'){
    if(c.id==='ragnarok'){damage(me,5,'諸神黃昏',{ignoreShield:true});if(op.curHp>0)damage(op,5,'諸神黃昏',{ignoreShield:true});}
    else if(c.id==='rewrite'){const center=(me.curHp+op.curHp)/2;let low=Math.round(center-2.5);let high=low+5;low=Math.max(1,low);high=Math.max(1,high);me.curHp=Math.min(me.hp,high);op.curHp=Math.min(op.hp,low);}
    else if(c.id==='judgment'){atk(10);me.nextSkillBlocked=true;}
    else if(c.id==='chaosfall'){for(let k=0;k<2;k++){if(hand.length){const x=hand.pop();discardOf(me).push(x);}if(opponentHand.length){const x=opponentHand.pop();discardOf(op).push(x);}}drawFor(me,2);drawFor(op,2);}
    else if(c.id==='counterstrike')atk(Math.min(7,Math.max(1,Math.ceil((op.curHp-me.curHp)/2))));
    else if(c.id==='deathrefuse')me.rebirthOnce=true;
    else if(c.id==='allone'){removeNegative(me);heal(me,5);}
    else if(c.id==='coin'){if(Math.random()<0.5)atk(8);else damage(me,4,me.name+' 命運硬幣');}
    else if(c.id==='domain'){S.domainTurns=2;me.domain=true;op.domain=true;}
    else if(c.id==='endbell')op.turnLimit=1;
  }
}

/* ========================= SKILLS ========================= */

function useSkill(){
  const p=S.player,o=S.enemy;
  if(S.phase!=="player"||S.mana<p.skillCost||S.skillCooldown>0||p.skillBlocked)return;
  if(p.id==="nuwa" && (p.skillUses||0)>=2)return;
  const before={php:p.curHp,ehp:o.curHp,ps:p.shield||0,es:o.shield||0};
  S.mana-=p.skillCost; S.skillCooldown=2; S.playerUsedSkill=true; p.usedSkill=true; p.skillUses=(p.skillUses||0)+1;
  const id=p.id;
  if(id==="nezha")damage(o,5+(S.usedThisTurn?2:0),p.name);
  else if(id==="wukong")damage(o,o.shield>0?4:6,p.name);
  else if(id==="erlang")damage(o,5+(S.lastEnemyCard&&card(S.lastEnemyCard).type==="攻擊"?2:0),p.name);
  else if(id==="nuwa")heal(p,5);
  else if(id==="chang_e"){if(S.enemyHand.length){const ix=Math.floor(Math.random()*S.enemyHand.length);const locked=S.enemyHand[ix];o.silencedCard=locked;log(`廣寒封印：對手的【${card(locked).name}】本回合不可使用。`);}}
  else if(id==="houyi"){damage(o,8,p.name);p.nextAttackLocked=true;}
  else if(id==="jingwei"){damage(o,p.stacks||0,p.name);p.stacks=0;}
  else if(id==="zhongkui"){damage(o,4,p.name);removeNegative(p);}
  else if(id==="amaterasu"){heal(p,4);p.nextTaken=-3;}
  else if(id==="susanoo")damage(o,p.curHp<=12?10:8,p.name);
  else if(id==="tsukuyomi"){if(S.enemyHand.length>3){const x=S.enemyHand.splice(Math.floor(Math.random()*S.enemyHand.length),1)[0];S.enemyDiscard.push(x);}else damage(o,3,p.name);}
  else if(id==="izanagi"){heal(p,3);removeNegative(p);}
  else if(id==="hanuman")p.shield=(p.shield||0)+4;
  else if(id==="shiva"){damage(o,6+(p.stacks||0),p.name);p.stacks=0;}
  else if(id==="garuda"){damage(o,5,p.name);o.shield=0;}
  else if(id==="zeus")damage(o,7,p.name);
  else if(id==="athena"){p.nextTaken=-3;p.reflect=3;}
  else if(id==="hades"){const souls=p.stacks||0;if(souls)damage(o,souls*2,p.name);p.stacks=0;}
  else if(id==="medusa")o.turnLimit=1;
  else if(id==="heracles")damage(o,4+(p.trial||0),p.name);
  else if(id==="loki")o.reflect=1;
  else if(id==="thor"){damage(o,5+(p.stacks||0),p.name);p.stacks=0;}
  else if(id==="odin"){if(S.hand.length){S.discard.push(S.hand.pop());drawFor(p,2);}}
  else if(id==="freya")o.weakenDamage=4;
  else if(id==="anubis")damage(o,o.curHp<=8?8:4,p.name);
  else if(id==="ra"){damage(o,6,p.name);o.burn=2;}
  else if(id==="osiris"){const ix=S.discard.findIndex(x=>card(x).cost<=2);if(ix>=0){const x=S.discard.splice(ix,1)[0];S.hand.push(x);}}
  else if(id==="morrigan")o.nextTaken=(o.nextTaken||0)+3;
  else if(id==="gilgamesh")damage(o,5+(S.enemyUsedSkill?3:0),p.name);
  else if(id==="cernunnos"){damage(o,4,p.name);heal(p,4);}
  log(`你發動【${p.skill}】。`);
  if(p.curHp<=0){endGame(o);return;} if(o.curHp<=0){endGame(p);return;}
  render();
  playEffect("技能",p.skill,visualResult({type:"技能",name:p.skill},before));
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
  clearTurnStatuses(S.player);
  S.phase="enemy";
  log(`第${S.turn}回合結束。`);
  enemyTurn();
}

function enemyTurn(){
  if(S.enemy.curHp<=0)return;
  S.enemyMana=Math.min(6,S.enemyMana+3);
  S.enemySkillCooldown=Math.max(0,S.enemySkillCooldown-1);
  S.enemy.turnStartHp=S.enemy.curHp;
  applyStartOfTurn(S.enemy);
  S.enemyTurnLimit=S.enemy.turnLimit||99;
  S.lastEnemyCard=null;S.enemy.usedThisTurn=false;
  let acted=false;
  if(S.enemyTurnLimit>0){
    const ix=chooseEnemyCard();
    if(ix>=0) acted=enemyUse(ix);
  }
  if(!acted && S.enemyMana>=S.enemy.skillCost && S.enemySkillCooldown===0 && !S.enemy.skillBlocked){enemySkill();}
  clearTurnStatuses(S.enemy);
  if(S.domainTurns>0){S.domainTurns--;if(S.domainTurns<=0){delete S.player.domain;delete S.enemy.domain;}}
  startPlayerTurn();
}
function cardThreat(c,me,op){
  if(!c)return -999;
  const mana=manaOf(me), extra=me.soulbind?1:0;
  if(mana<c.cost+extra && !me.forbiddenNext)return -999;
  if(me.silencedCard===c.id)return -999;
  if(c.id==='counterstrike' && me.curHp>=op.curHp)return -999;
  let v=0;
  if(c.type==='攻擊'){const base={strike:4,fire:3,pierce:4,double:4,crush:6,soul:4,thunder:7,backstab:3}[c.id]||3;v+=base*2;if(op.curHp<=base+1)v+=25;if(op.shield&&c.id==='pierce')v+=7;}
  if(c.type==='恢復')v+=me.curHp<me.hp*.55?18:2;
  if(c.type==='防禦')v+=me.curHp<me.hp*.45?12:3;
  if(c.type==='控制')v+=7;
  if(c.type==='詛咒')v+=6;
  if(c.type==='特殊')v+=5;
  if(c.type==='傳說')v+=11;
  return v-c.cost*1.25+Math.random()*2;
}
function chooseEnemyCard(){
  const candidates=S.enemyHand.map((id,i)=>({i,c:card(id),v:cardThreat(card(id),S.enemy,S.player)})).filter(x=>x.v>-900);
  if(!candidates.length)return -1;
  candidates.sort((a,b)=>b.v-a.v);return candidates[0].i;
}
function enemyUse(ix){
  if(ix<0||ix>=S.enemyHand.length)return false;
  const id=S.enemyHand[ix],c=card(id);
  if(S.enemy.silencedCard===id)return false;
  const totalCost=c.cost+(S.enemy.soulbind?1:0);
  if(S.enemyMana<totalCost&&!S.enemy.forbiddenNext)return false;
  S.lastEnemySnapshot=snapshotBattle();
  S.enemyHand.splice(ix,1);
  const free=S.enemy.forbiddenNext;S.enemy.forbiddenNext=false;
  if(!free)S.enemyMana=Math.max(0,S.enemyMana-totalCost);
  S.lastEnemyCard=c.id;S.enemy.usedThisTurn=true;S.enemyDiscard.push(c.id);if(S.enemy.id==='hades')S.enemy.stacks=(S.enemy.stacks||0)+1;S.enemyTurnLimit=Math.max(0,S.enemyTurnLimit-1);S.enemy.turnLimit=S.enemyTurnLimit;
  if(S.enemy.soulbind)delete S.enemy.soulbind;
  log(`對手使用【${c.name}】。`);
  S.resolving=true; resolve(c,S.enemy,S.player,false); S.resolving=false;
  if(S.player.curHp<=0){endGame(S.enemy);return true;} if(S.enemy.curHp<=0){endGame(S.player);return true;}
  return true;
}
function enemySkill(){
  const p=S.enemy,o=S.player;
  if(p.id==='nuwa'&&(p.skillUses||0)>=2)return;
  S.enemyMana-=p.skillCost;S.enemySkillCooldown=2;S.enemyUsedSkill=true;p.skillUses=(p.skillUses||0)+1;
  const id=p.id;
  if(id==='nezha')damage(o,5+(p.usedThisTurn?2:0),p.name);
  else if(id==='wukong')damage(o,o.shield>0?4:6,p.name);
  else if(id==='erlang')damage(o,5+(S.lastPlayerCard&&card(S.lastPlayerCard).type==='攻擊'?2:0),p.name);
  else if(id==='nuwa')heal(p,5);
  else if(id==='houyi'){damage(o,8,p.name);p.nextAttackLocked=true;}
  else if(id==='jingwei'){damage(o,p.stacks||0,p.name);p.stacks=0;}
  else if(id==='zhongkui'){damage(o,4,p.name);removeNegative(p);}
  else if(id==='amaterasu'){heal(p,4);p.nextTaken=-3;}
  else if(id==='susanoo')damage(o,p.curHp<=12?10:8,p.name);
  else if(id==='tsukuyomi'){if(S.hand.length>3){const x=S.hand.splice(Math.floor(Math.random()*S.hand.length),1)[0];S.discard.push(x);}else damage(o,3,p.name);}
  else if(id==='izanagi'){heal(p,3);removeNegative(p);}
  else if(id==='hanuman')p.shield=(p.shield||0)+4;
  else if(id==='shiva'){damage(o,6+(p.stacks||0),p.name);p.stacks=0;}
  else if(id==='garuda'){damage(o,5,p.name);o.shield=0;}
  else if(id==='zeus')damage(o,7,p.name);
  else if(id==='athena'){p.nextTaken=-3;p.reflect=3;}
  else if(id==='hades'){const souls=p.stacks||0;if(souls)damage(o,souls*2,p.name);p.stacks=0;}
  else if(id==='medusa')o.turnLimit=1;
  else if(id==='heracles')damage(o,4+(p.trial||0),p.name);
  else if(id==='loki')o.reflect=1;
  else if(id==='thor'){damage(o,5+(p.stacks||0),p.name);p.stacks=0;}
  else if(id==='odin'){if(S.enemyHand.length){S.enemyDiscard.push(S.enemyHand.pop());drawFor(p,2);}}
  else if(id==='freya')o.weakenDamage=4;
  else if(id==='anubis')damage(o,o.curHp<=8?8:4,p.name);
  else if(id==='ra'){damage(o,6,p.name);o.burn=2;}
  else if(id==='osiris'){const ix=S.enemyDiscard.findIndex(x=>card(x).cost<=2);if(ix>=0){const x=S.enemyDiscard.splice(ix,1)[0];S.enemyHand.push(x);}}
  else if(id==='morrigan')o.nextTaken=(o.nextTaken||0)+3;
  else if(id==='gilgamesh')damage(o,5+(S.playerUsedSkill?3:0),p.name);
  else if(id==='cernunnos'){damage(o,4,p.name);heal(p,4);}
  log(`對手發動【${p.skill}】。`);showFullScreenEffect('✦','敵方技能',p.skill,'enemy-skill');
  if(p.curHp<=0){endGame(o);} else if(o.curHp<=0){endGame(p);}
}
function startPlayerTurn(){
  if(S.player.curHp<=0)return;
  S.turn++;S.phase='player';S.mana=Math.min(6,S.mana+3);S.skillCooldown=Math.max(0,S.skillCooldown-1);S.usedThisTurn=false;S.playerUsedSkill=false;S.player.usedThisTurn=false;
  S.player.turnStartHp=S.player.curHp;S.turnStartHp=S.player.curHp;applyStartOfTurn(S.player);S.playerTurnLimit=S.player.turnLimit||99;S.limit=S.playerTurnLimit;
  const drawn=drawPlayer();render();if(drawn)setTimeout(()=>showTurnDraw(card(drawn)),180);
}

/* ========================= VISUALS ========================= */

function cardVisual(c){
  const h=CARD_HUE[c.id]??210;
  const glyph=CARD_GLYPH[c.id]||TYPE_ICON[c.type]||"✦";
  const src=CARD_ART[c.id];
  return {
    glyph,
    style:`--card-h:${h};--card-art:${src?`url('${src}')`:'none'};background-image:linear-gradient(180deg,rgba(4,7,16,.06),rgba(4,7,16,.72)),url('${src}'),radial-gradient(circle at 50% 30%,hsla(${h},95%,72%,.50),transparent 27%),linear-gradient(145deg,hsla(${h},72%,22%,.96),hsla(${(h+45)%360},70%,8%,.98));background-size:cover;background-position:center;`
  };
}

function cardUI(c,i){
  const v=cardVisual(c);
  const disabled=!canUseCard(c);
  return `<article class="card rarity-${c.rarity} type-${c.type} ${disabled?"disabled":""}" onclick="useCard(${i})" style="--card-h:${CARD_HUE[c.id]??210}">
    <span class="rarity">${c.rarity}</span>
    <span class="cost">${c.cost}</span>
    <div class="type">${c.type}</div>
    <div class="card-illustration ${c.type}" style="${v.style};--card-art:url("assets/cards/${c.id}.webp")">
      <img class="card-art-image" src="assets/cards/${c.id}.webp" alt="${esc(c.name)}" loading="lazy" onerror="this.style.display='none'">
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

function targetImpact(target, kind="damage", value=null){
  const el=document.querySelector(target);
  if(!el)return;
  el.classList.remove("target-hit","target-heal","target-shield","target-skill");
  void el.offsetWidth;
  const cls=kind==="heal"?"target-heal":kind==="shield"?"target-shield":kind==="skill"?"target-skill":"target-hit";
  el.classList.add(cls);
  if(value!==null){
    const n=document.createElement("div");
    n.className=`combat-number ${kind}`;
    n.textContent=(kind==="damage"?"-":kind==="heal"||kind==="shield"?"+":"")+value;
    el.appendChild(n);
    setTimeout(()=>n.remove(),900);
  }
  setTimeout(()=>el.classList.remove(cls),900);
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

  if(info.damage) targetImpact(".fighter.enemy", "damage", info.damage);
  else if(info.heal) targetImpact(".fighter.player-fighter", "heal", info.heal);
  else if(info.shield) targetImpact(".fighter.player-fighter", "shield", info.shield);
  else if(type==="技能") targetImpact(".fighter.enemy", "skill", null);

  setTimeout(()=>{
    layer.classList.remove("active");
    layer.innerHTML="";
  },1050);
}

/* ========================= DYNAMIC ARENA ========================= */
function arenaFor(c){
  const id=c?.id||"";
  if(["nezha","wukong","erlang","nuwa","chang_e","houyi","jingwei","zhongkui"].includes(id)) return "assets/backgrounds/japan.webp";
  if(["amaterasu","susanoo","tsukuyomi","izanagi"].includes(id)) return "assets/backgrounds/moon.webp";
  if(["hanuman","shiva","garuda"].includes(id)) return "assets/backgrounds/fire.webp";
  if(["zeus","athena","hades","medusa","heracles"].includes(id)) return "assets/backgrounds/light.webp";
  if(["loki","thor","odin","freya"].includes(id)) return "assets/backgrounds/frost.webp";
  if(["anubis","ra","osiris"].includes(id)) return "assets/backgrounds/sun.webp";
  if(["morrigan","gilgamesh","cernunnos"].includes(id)) return "assets/backgrounds/void.webp";
  return "assets/backgrounds/main.webp";
}

/* ========================= BATTLE UI ========================= */

function battle(){
  const p=S.player,e=S.enemy;
  app.innerHTML=`
  <main class="battle v7-battle" style="--arena-url:url('${arenaFor(p)}')">
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
  const mana=enemy?S.enemyMana:S.mana;
  const hpPct=Math.max(0,Math.min(100,c.curHp/c.hp*100));
  const shield=c.shield||0;
  const statusBits=[];
  if(shield) statusBits.push(`<span class="status-pill shield-pill">護盾 ${shield}</span>`);
  if(c.poison) statusBits.push(`<span class="status-pill poison-pill">中毒 ${c.poison}</span>`);
  if(c.burn) statusBits.push(`<span class="status-pill burn-pill">灼熱</span>`);
  if(c.skillBlocked) statusBits.push(`<span class="status-pill mute-pill">封技</span>`);
  return `<div class="fighter ${enemy?"enemy":"player-fighter"}" data-fighter="${enemy?"enemy":"player"}" style="--c1:${c.c1};--c2:${c.c2}">
    <div class="fighter-art">${portraitHTML(c,"fighter-portrait")}</div>
    <div class="fighter-vignette"></div>
    <div class="fighter-overlay">
      <div class="fighter-topline">
        <span class="side-label">${enemy?"OPPONENT":"YOUR HERO"}</span>
        <span class="origin-badge">${esc(c.origin)}</span>
      </div>
      <div class="fighter-head">
        <div>
          <b>${esc(c.name)}</b>
          <div class="small">${esc(c.tag)} · ${esc(c.skill)}</div>
        </div>
        <span class="role-chip">${enemy?"敵方":"我方"}</span>
      </div>
      <div class="hp-row"><span>HP</span><strong>${Math.max(0,c.curHp)}</strong><em>/ ${c.hp}</em></div>
      <div class="hpbar"><div class="hpfill" style="width:${hpPct}%"></div></div>
      <div class="fighter-footer">
        <div class="status-pills">${statusBits.join("")||`<span class="status-pill">狀態正常</span>`}</div>
        <div class="mana-pips" aria-label="神力 ${mana} / 6">${Array.from({length:6},(_,i)=>`<i class="${i<mana?"on":""}"></i>`).join("")}</div>
      </div>
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
