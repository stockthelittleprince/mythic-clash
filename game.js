const app=document.getElementById("app");
const S={screen:"home",player:null,enemy:null,turn:1,phase:"player",mana:3,enemyMana:3,hand:[],enemyHand:[],discard:[],deck:[],enemyDeck:[],log:[],lastPlayerCard:null,shield:0,enemyShield:0,usedThisTurn:false,skillCooldown:0,enemySkillCooldown:0,playerUsedSkill:false,enemyUsedSkill:false,drawLock:0,limit:99};

function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function log(t){S.log.unshift(t);S.log=S.log.slice(0,30)}
function getChar(id){return CHARACTERS.find(c=>c.id===id)}
function card(id){return CARDS.find(c=>c.id===id)}
function starterDeck(){return shuffle(CARDS.flatMap(c=>Array(c.rarity==="傳說"?1: c.rarity==="史詩"?1:2).fill(c.id))).slice(0,30)}
function render(){
  if(S.screen==="home") return home();
  if(S.screen==="select") return select();
  if(S.screen==="reveal") return reveal();
  return battle();
}
function home(){app.innerHTML=`<main class="screen home">
  <div class="brand"><h1>神話爭鋒</h1><small>MYTHIC CLASH · CARD BATTLE</small></div>
  <p class="subtitle">諸神、英雄、妖魔與命運，在一場牌局中決定勝負。</p>
  <button class="cta" onclick="randomStart()">隨機抽取角色</button><button class="ghost" onclick="goSelect()">瀏覽全部30名角色</button>
  <div class="panel" style="padding:18px;text-align:center;max-width:680px">
    <b>目前原型規則</b><p class="small">30名角色・50張功能牌・神力資源・AI對手・疲勞機制。角色立繪可在 assets/characters/ 替換，牌框與UI會保留目前的東方神話華麗風格。</p>
  </div>
</main>`}
function goSelect(){S.screen="select";render()}
function randomStart(){startGame(shuffle(CHARACTERS)[0].id)}
function reveal(){let c=S.player;app.innerHTML=`<main class="screen home"><div class="brand" style="font-size:25px">✦ 命運揭示 ✦</div><div class="flip-card" style="--c1:${c.c1};--c2:${c.c2}"><span class="reveal-icon">${c.emoji}</span><b>${c.name}</b><span>❤️ ${c.hp}　⚡ ${c.skillCost}</span><p>${c.desc}</p></div><p>你的對手：${S.enemy.name}</p><button class="cta" onclick="S.screen='battle';render()">進入戰場</button></main>`}
function showFx(kind,label){const layer=document.createElement("div");layer.className="fx-layer";layer.innerHTML=`<div class="fx-burst ${kind}">${esc(label)}</div>`;document.body.appendChild(layer);if(kind==="attack"||kind==="skill"){document.querySelector(".board")?.classList.add("screen-shake");setTimeout(()=>document.querySelector(".board")?.classList.remove("screen-shake"),380)}setTimeout(()=>layer.remove(),950)}
function select(){app.innerHTML=`<main class="screen"><div class="toolbar" style="width:min(1180px,100%)"><div><div class="brand" style="text-align:left;font-size:24px">選擇你的神話角色</div><div class="small">角色決定你的被動與主動技能，功能牌決定你的戰術。</div></div><button onclick="S.screen='home';render()">返回</button></div>
<div class="panel roster">${CHARACTERS.map(c=>`<article class="char-card" onclick="startGame('${c.id}')" style="--c1:${c.c1};--c2:${c.c2}">
<div class="char-art">${c.emoji}</div><div class="char-info"><b>${c.name}</b><span>HP ${c.hp}</span><div class="tag">${c.origin} · ${c.tag}</div><p class="small">${c.desc}</p></div></article>`).join("")}</div></main>`}
function startGame(id){
  S.player={...getChar(id),curHp:getChar(id).hp,shield:0,usedSkill:false,stacks:0};
  let choices=shuffle(CHARACTERS.filter(c=>c.id!==id));
  S.enemy={...choices[0],curHp:choices[0].hp,shield:0,usedSkill:false,stacks:0};
  S.deck=starterDeck(); S.enemyDeck=starterDeck(); S.hand=[];S.enemyHand=[];S.discard=[];
  for(let i=0;i<5;i++){drawPlayer();drawEnemy()}
  S.turn=1;S.phase="player";S.mana=3;S.enemyMana=3;S.skillCooldown=0;S.enemySkillCooldown=0;S.usedThisTurn=false;S.playerUsedSkill=false;S.enemyUsedSkill=false;S.log=[];
  log(`戰鬥開始：${S.player.name} VS ${S.enemy.name}`);
  S.screen="reveal";render();
}
function drawPlayer(){if(S.deck.length){if(S.hand.length<9)S.hand.push(S.deck.pop())}else fatigue(S.player)}
function drawEnemy(){if(S.enemyDeck.length){if(S.enemyHand.length<9)S.enemyHand.push(S.enemyDeck.pop())}else fatigue(S.enemy)}
function fatigue(p){p.curHp-=2;log(`${p.name} 受到2點疲勞傷害。`)}
function damage(target,n,source=""){let p=target;let shield=p.shield||0;let blocked=Math.min(shield,n);p.shield-=blocked;n-=blocked;
 if(n>0)p.curHp-=n; if(source)log(`${source} 對 ${p.name} 造成 ${n+blocked} 點傷害${blocked?`（護盾抵消${blocked}）`:""}。`);
 if(p.curHp<=0) endGame(target===S.player?S.enemy:S.player);
}
function heal(p,n){let before=p.curHp;p.curHp=Math.min(p.hp,p.curHp+n);log(`${p.name} 恢復 ${p.curHp-before} HP。`)}
function useCard(i){
 if(S.phase!=="player")return;
 const id=S.hand[i],c=card(id);if(!c||S.mana<c.cost)return;
 S.hand.splice(i,1);S.mana-=c.cost;S.usedThisTurn=true;S.lastPlayerCard=c.id;S.discard.push(c.id);log(`你使用【${c.name}】。`);
 resolve(c,S.player,S.enemy,true);render();showFx(c.type==="攻擊"?"attack":c.type==="恢復"?"heal":c.type==="防禦"?"defend":c.type==="詛咒"?"curse":"skill",c.type==="攻擊"?"⚔ "+c.name:c.name);if(S.enemy.curHp<=0)return;
}
function resolve(c,me,op,isPlayer){
 const atk=(n)=>damage(op,n,me.name);
 if(c.type==="攻擊"){
   let n= c.id==="strike"?4:c.id==="fire"?3:c.id==="pierce"?4:c.id==="double"?4:c.id==="crush"?6:c.id==="soul"?4:c.id==="thunder"?7:c.id==="backstab"?(S.enemyUsedSkill||S.enemyHand.length<9?5:2):4;
   if(c.id==="crush")damage(me,1,`${me.name} 的反噬`);
   if(c.id==="double"){damage(op,2,me.name);damage(op,2,me.name)} else atk(n);
 } else if(c.type==="防禦"){
   if(c.id==="shield")me.shield+=4; else if(c.id==="light")me.shield+=6; else if(c.id==="lastwall")me.shield+=3; else if(c.id==="dodge")me.shield+=999;
   else if(c.id==="mirror")me.shield+=3;
   log(`${me.name} 獲得防禦效果。`);
 } else if(c.type==="恢復"){heal(me,c.id==="gift"?6:c.id==="rebirth"?(me.curHp<=8?7:3):c.id==="moonbless"?2:4);if(c.id==="moonbless")drawPlayer()}
 else if(c.type==="神力"){if(c.id==="infuse")S.mana+=2;else if(c.id==="pact")S.mana+=4;else if(c.id==="wrath")me.nextAtk=(me.nextAtk||0)+4}
 else if(c.type==="控制"){if(c.id==="timestop")S.limit=1;else if(c.id==="seal")S.enemySkillCooldown=2;else if(c.id==="rewind")log("（原型版）命運逆轉保留為規則鉤子。")}
 else if(c.type==="手牌"){if(c.id==="steal"&&S.enemyHand.length)S.hand.push(S.enemyHand.splice(Math.floor(Math.random()*S.enemyHand.length),1)[0]);else if(c.id==="sacrifice"){if(S.hand.length)S.discard.push(S.hand.pop());drawPlayer();drawPlayer()}else if(c.id==="dice"){let r=Math.floor(Math.random()*4);if(r===0){drawPlayer();drawPlayer()}else if(r===1)heal(me,4);else if(r===2)damage(op,4,me.name);else S.mana+=3}}
 else if(c.type==="詛咒"){if(c.id==="curse")op.nextTaken=(op.nextTaken||0)+2;else if(c.id==="weaken")op.weaken=(op.weaken||0)+3;else if(c.id==="poison")op.poison=3;else if(c.id==="burn")op.burn=3}
 else if(c.type==="特殊"){if(c.id==="decoy")me.decoy=true;else if(c.id==="forbidden")me.freeNext=true}
 else if(c.type==="傳說"){if(c.id==="ragnarok"){damage(me,5,"諸神黃昏");damage(op,5,"諸神黃昏")}else if(c.id==="judgment"){atk(10);me.skillBlocked=1}else if(c.id==="counterstrike"&&me.curHp<op.curHp){atk(Math.min(7,Math.floor((op.curHp-me.curHp)/2)))}else if(c.id==="deathrefuse")me.decoy=true;else if(c.id==="allone"){me.poison=0;me.burn=0;me.nextTaken=0;heal(me,5)}}
}
function useSkill(){
 if(S.phase!=="player"||S.mana<S.player.skillCost||S.skillCooldown>0||S.player.skillBlocked)return;
 S.mana-=S.player.skillCost;S.skillCooldown=2;S.playerUsedSkill=true;S.player.usedSkill=true;
 const id=S.player.id;
 if(id==="nuwa"||id==="amaterasu"||id==="cernunnos"){heal(S.player,id==="nuwa"?5:id==="amaterasu"?4:4);if(id==="cernunnos")damage(S.enemy,4,S.player.name)}
 else if(id==="izanagi"){heal(S.player,3)}
 else if(id==="houyi")damage(S.enemy,8,S.player.name)
 else if(id==="anubis")damage(S.enemy,S.enemy.curHp<=8?8:4,S.player.name)
 else if(id==="medusa"){S.limit=1;log("美杜莎石化：對手下回合只能使用1張功能牌。")}
 else if(id==="loki"){S.enemy.reflect=1;log("洛基幻象：對手下一次攻擊有機率反噬。")}
 else if(id==="freya"){S.enemy.weaken=(S.enemy.weaken||0)+4}
 else if(id==="morrigan"){S.enemy.nextTaken=(S.enemy.nextTaken||0)+3}
 else if(id==="shiva"){damage(S.enemy,6+(S.player.stacks||0),S.player.name);S.player.stacks=0}
 else if(id==="thor"){damage(S.enemy,5+(S.player.stacks||0),S.player.name);S.player.stacks=0}
 else if(id==="hades"){damage(S.enemy,Math.max(0,(S.player.stacks||0)*2),S.player.name);S.player.stacks=0}
 else if(id==="gilgamesh")damage(S.enemy,5+(S.enemyUsedSkill?3:0),S.player.name)
 else if(id==="susanoo")damage(S.enemy,S.player.curHp<=12?10:8,S.player.name)
 else if(id==="nezha")damage(S.enemy,5+(S.usedThisTurn?2:0),S.player.name)
 else if(id==="wukong")damage(S.enemy,S.enemy.shield>0?4:6,S.player.name)
 else if(id==="erlang")damage(S.enemy,5+(S.lastPlayerCard==="attack"?2:0),S.player.name)
 else if(id==="chang_e"){S.enemyHand.length&&S.enemyHand.splice(Math.floor(Math.random()*S.enemyHand.length),1);log("嫦娥封鎖了一張對手手牌。")}
 else if(id==="jingwei"){damage(S.enemy,S.player.stacks||0,S.player.name);S.player.stacks=0}
 else if(id==="zhongkui")damage(S.enemy,4,S.player.name)
 else if(id==="tsukuyomi"){if(S.enemyHand.length>3)S.enemyHand.splice(Math.floor(Math.random()*S.enemyHand.length),1);else damage(S.enemy,3,S.player.name)}
 else if(id==="hanuman")S.player.shield+=4
 else if(id==="garuda"){damage(S.enemy,5,S.player.name);S.enemy.shield=0}
 else if(id==="zeus")damage(S.enemy,7,S.player.name)
 else if(id==="athena"){S.player.shield+=3;S.enemy.reflect=3}
 else if(id==="heracles")damage(S.enemy,4+(S.player.stacks||0),S.player.name)
 else if(id==="odin"){if(S.hand.length){S.discard.push(S.hand.pop());drawPlayer();drawPlayer()}}
 else if(id==="ra"){damage(S.enemy,6,S.player.name);S.enemy.burn=2}
 else if(id==="osiris"){let pick=S.discard.find(x=>card(x).cost<=2);if(pick)S.hand.push(pick)}
 if(S.player.id==="thor"||S.player.id==="heracles"||S.player.id==="shiva")S.player.stacks=Math.min(3,(S.player.stacks||0)+1);
 render();showFx("skill","✦ "+S.player.skill);
}
function endTurn(){
 if(S.phase!=="player")return;
 S.phase="enemy";log(`第${S.turn}回合結束。`);
 enemyTurn();
}
function enemyTurn(){
 if(S.enemy.curHp<=0)return;
 S.enemyMana=Math.min(6,S.enemyMana+3);S.enemySkillCooldown=Math.max(0,S.enemySkillCooldown-1);
 if(S.enemy.burn){damage(S.enemy,S.enemy.burn,"灼熱");S.enemy.burn=0}
 if(S.enemy.poison){damage(S.enemy,1,"中毒");S.enemy.poison--}
 // Simple AI: heal if low, defend against low HP, otherwise attack.
 let played=0;
 if(S.enemy.curHp<=8){
   let ix=S.enemyHand.findIndex(id=>["spring","gift","rebirth","allone"].includes(id));
   if(ix>=0){enemyUse(ix);played++}
 }
 if(!played){
   let ix=S.enemyHand.findIndex(id=>card(id).type==="攻擊"&&card(id).cost<=S.enemyMana);
   if(ix>=0){enemyUse(ix);played++}
 }
 if(!played){
   let ix=S.enemyHand.findIndex(id=>card(id).type==="防禦"&&card(id).cost<=S.enemyMana);
   if(ix>=0){enemyUse(ix);played++}
 }
 if(!played && S.enemyMana>=S.enemy.skillCost && S.enemySkillCooldown===0){enemySkill();played++}
 if(!played && S.enemyHand.length){let ix=S.enemyHand.findIndex(id=>card(id).cost<=S.enemyMana);if(ix>=0)enemyUse(ix)}
 startPlayerTurn();
}
function enemyUse(ix){let c=card(S.enemyHand[ix]);S.enemyHand.splice(ix,1);S.enemyMana-=c.cost;S.enemyUsedSkill=false;S.discard.push(c.id);log(`對手使用【${c.name}】。`);resolveEnemy(c)}
function resolveEnemy(c){
 if(c.type==="攻擊"){let n={strike:4,fire:3,pierce:4,double:4,crush:6,soul:4,thunder:7,backstab:3}[c.id]||3;damagePlayer(n)}
 else if(c.type==="防禦"){S.enemy.shield+=(c.id==="light"?6:c.id==="shield"?4:3)}
 else if(c.type==="恢復")heal(S.enemy,c.id==="gift"?6:c.id==="rebirth"?(S.enemy.curHp<=8?7:3):4)
 else if(c.type==="神力")S.enemyMana+=c.id==="infuse"?2:c.id==="pact"?4:0;
}
function damagePlayer(n){n=Math.max(0,n-(S.player.weaken||0));S.player.weaken=0;if(S.player.reflect){if(Math.random()<.5){damage(S.enemy,n,S.player.name);S.player.reflect=0;return}S.player.reflect=0}damage(S.player,n,S.enemy.name)}
function enemySkill(){
 S.enemyMana-=S.enemy.skillCost;S.enemySkillCooldown=2;S.enemyUsedSkill=true;
 const id=S.enemy.id;
 if(["nuwa","amaterasu","cernunnos"].includes(id))heal(S.enemy,5);
 else if(id==="houyi")damage(S.player,8,S.enemy.name);else if(id==="susanoo")damage(S.player,S.enemy.curHp<=12?10:8,S.enemy.name);
 else if(id==="zeus")damage(S.player,7,S.enemy.name);else if(id==="thor")damage(S.player,5,S.enemy.name);else if(id==="anubis")damage(S.player,S.player.curHp<=8?8:4,S.enemy.name);
 else damage(S.player,5,S.enemy.name);
 log(`對手發動【${S.enemy.skill}】。`);
}
function startPlayerTurn(){
 if(S.player.curHp<=0)return;
 S.turn++;S.phase="player";S.mana=Math.min(6,S.mana+3);S.skillCooldown=Math.max(0,S.skillCooldown-1);S.usedThisTurn=false;S.limit=99;
 drawPlayer();render();
}
function endGame(winner){
 S.phase="over";let win=winner===S.player;
 setTimeout(()=>{app.innerHTML=`<div class="modal"><div class="modal-box"><div class="brand" style="font-size:34px">${win?"勝利":"敗北"}</div><p>${win?`你以 ${S.player.curHp} HP 擊敗了 ${S.enemy.name}。`:`${S.enemy.name} 擊敗了你。`}</p><button class="cta" onclick="S.screen='select';render()">再戰一場</button></div></div>`},80);
}
function battle(){
 const p=S.player,e=S.enemy;
 app.innerHTML=`<main class="battle"><div class="toolbar"><div><div class="brand" style="text-align:left;font-size:24px">神話爭鋒</div><div class="small">第 ${S.turn} 回合 · ${S.phase==="player"?"你的回合":"對手回合"}</div></div><button class="ghost" onclick="S.screen='select';render()">退出戰鬥</button></div>
 <div class="battle-top">${fighter(e,true)}<div class="vs">VS</div>${fighter(p,false)}</div>
 <section class="board"><div class="log">${S.log.map(x=>`<div>› ${esc(x)}</div>`).join("")}</div>
 <div class="center-actions"><span class="mana">⚡ 神力 ${S.mana}/6</span><button class="endturn" onclick="endTurn()" ${S.phase!=="player"?"disabled":""}>結束回合</button></div>
 ${skillUI(p)}
 <div class="hand">${S.hand.map((id,i)=>cardUI(card(id),i)).join("")}</div></section></main>`
}
function fighter(c,enemy){return `<div class="fighter ${enemy?"enemy":""}" style="--c1:${c.c1};--c2:${c.c2}"><div class="fighter-head"><div class="avatar">${c.emoji}</div><div><b>${c.name}</b><div class="small">${c.origin} · ${c.tag}</div><div class="mana">⚡ ${enemy?S.enemyMana:S.mana}/6</div></div></div><div class="hpbar"><div class="hpfill" style="width:${Math.max(0,c.curHp/c.hp*100)}%"></div></div><div class="status">HP ${Math.max(0,c.curHp)} / ${c.hp}　護盾 ${c.shield||0}</div></div>`}
function skillUI(p){return `<div class="skill"><b>✦ ${p.skill}</b><span class="small">　${p.desc}</span><button onclick="useSkill()" ${S.phase!=="player"||S.mana<p.skillCost||S.skillCooldown>0||p.skillBlocked?"disabled":""}>消耗 ${p.skillCost} ⚡ ${S.skillCooldown?`CD ${S.skillCooldown}`:"發動"}</button></div>`}
function cardUI(c,i){return `<article data-type="${c.type}" class="card ${S.phase!=="player"||S.mana<c.cost?"disabled":""}" onclick="useCard(${i})"><span class="rarity">${c.rarity}</span><span class="cost">${c.cost}</span><div class="type">${c.type}</div><h3>${c.name}</h3><p>${c.desc}</p></article>`}
render();
