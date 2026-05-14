// ================================================================
//  修仙地牢 · 炼道斩妖录  |  完整版 v3  game.js
//  精细 UI：左侧面板 + 顶部血条 + 扇形升级卡片 + 像素风图标
// ================================================================

const C   = document.getElementById('c');
const ctx = C.getContext('2d');
const W   = C.width;    // 900
const H   = C.height;   // 540
const TAU = Math.PI * 2;

// ── 工具 ─────────────────────────────────────────────────────────
const rnd    = (a,b)        => a + Math.random()*(b-a);
const clamp  = (v,a,b)      => v<a?a:v>b?b:v;
const dist   = (ax,ay,bx,by)=> Math.hypot(bx-ax,by-ay);
const lerp   = (a,b,t)      => a+(b-a)*t;
const TAU2   = Math.PI;

// ── 配色常量 ─────────────────────────────────────────────────────
const C_JADE  = { hi:'#6affca', md:'#22d890', lo:'#0b7050', gl:'#1aff88' };
const C_GOLD  = { hi:'#ffe070', md:'#ffaa18', lo:'#8a5c08', gl:'#ffd030' };
const C_CRIM  = { hi:'#ff7878', md:'#dd2030', lo:'#7a000e', gl:'#ff2828' };
const C_AZUR  = { hi:'#94e8ff', md:'#30b8ff', lo:'#0e60c0', gl:'#50d8ff' };
const C_PURP  = { hi:'#cc9aff', md:'#8840e0', lo:'#3a0878', gl:'#a060ff' };
const C_PANEL = 'rgba(4,8,14,.88)';
const C_DARK  = 'rgba(2,4,10,.94)';

// ── 房间边界 ─────────────────────────────────────────────────────
// 左侧 HUD 面板宽度
const HUDW  = 142;
const WALL  = 42;
const GX1   = HUDW;
const GX2   = W - WALL;
const GY1   = WALL;
const GY2   = H - WALL;
const GCX   = (GX1+GX2)/2;
const GCY   = (GY1+GY2)/2;
const DOOR_W= 72;
const DX1   = GCX-DOOR_W/2;
const DX2   = GCX+DOOR_W/2;

// ── 输入 ─────────────────────────────────────────────────────────
const keys = {};
window.addEventListener('keydown', e=>{
  keys[e.key]=true;
  if([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
  if(['title','gameover','victory'].includes(gameState)) startGame();
});
window.addEventListener('keyup', e=>{ keys[e.key]=false; });
let mx=0,my=0;
C.addEventListener('mousemove', e=>{ const r=C.getBoundingClientRect(); mx=e.clientX-r.left; my=e.clientY-r.top; });
C.addEventListener('click', handleClick);

// ── Camera shake ─────────────────────────────────────────────────
const SK = { mag:0, dur:0, ox:0, oy:0 };
function doShake(m,d){ if(m>SK.mag){SK.mag=m;SK.dur=d;} }

// ── 状态 ─────────────────────────────────────────────────────────
let gameState='title', roomIdx=0, fadeAlpha=1, pendingRoom=0;
let elapsed=0, titleTime=0, lastTS=0, killCount=0, totalKills=0;

// ── 房间配置 ─────────────────────────────────────────────────────
const ROOMS = [
  { type:'combat',  label:'第一间 · 迷途妖林',    wave:[['normal',4]] },
  { type:'combat',  label:'第二间 · 邪煞幽境',    wave:[['normal',3],['fast',2]] },
  { type:'reward',  label:'第三间 · 灵台清净处',   wave:[] },
  { type:'combat',  label:'第四间 · 铁甲煞地',    wave:[['normal',3],['heavy',1],['fast',2]] },
  { type:'combat',  label:'第五间 · 煞气深渊',    wave:[['fast',4],['heavy',2]] },
  { type:'boss',    label:'终局 · 魔头现世',      wave:[['boss',1],['normal',3]] },
];

// ── 敌人原型 ─────────────────────────────────────────────────────
const EDEF = {
  normal:{ r:13, hp:45,  spd:52,  dmg:8,  symCol:C_CRIM.md, bodyA:'#3a0010', bodyB:'#c02838', glCol:C_CRIM.gl, sym:'妖' },
  fast:  { r:10, hp:24,  spd:98,  dmg:5,  symCol:C_JADE.hi,  bodyA:'#003018', bodyB:'#18a060', glCol:C_JADE.gl, sym:'煞' },
  heavy: { r:22, hp:140, spd:26,  dmg:20, symCol:C_AZUR.hi,  bodyA:'#081040', bodyB:'#2060c0', glCol:C_AZUR.gl, sym:'甲' },
  boss:  { r:36, hp:500, spd:36,  dmg:24, symCol:C_GOLD.hi,  bodyA:'#200800', bodyB:'#904010', glCol:C_GOLD.gl, sym:'魔' },
};
let enemies=[], _eid=0;
function mkEnemy(type,x,y){ const d=EDEF[type]; return {...d,id:++_eid,type,x,y,hp:d.hp,maxHp:d.hp,kx:0,ky:0,dead:false,flash:0}; }

// ── 升级池 ────────────────────────────────────────────────────────
const POOL = [
  { id:'moreSwords',     name:'飞剑  +1',    rare:2, col:C_JADE, icon:'sword',   desc:'增加一把环绕飞剑\n轮流自动攻击敌人' },
  { id:'attackSpeed',    name:'攻速  +20%',  rare:1, col:C_GOLD, icon:'speed',   desc:'飞剑出剑频率大幅\n提升，清场更快' },
  { id:'moveSpeed',      name:'移速  +15%',  rare:1, col:C_AZUR, icon:'wind',    desc:'御风而行步法轻盈\n躲避更游刃有余' },
  { id:'damage',         name:'剑气  +18%',  rare:2, col:C_CRIM, icon:'flame',   desc:'剑意凝实，全武器\n伤害大幅增加' },
  { id:'maxHp',          name:'筑基  +30',   rare:1, col:C_CRIM, icon:'heart',   desc:'气血根基深厚\n立即恢复30点气血' },
  { id:'unlockThunder',  name:'解锁 · 雷法', rare:3, col:C_AZUR, icon:'thunder', desc:'天雷降世，周期性\n重击敌人并震慑' },
  { id:'unlockTalisman', name:'解锁 · 符咒', rare:3, col:C_GOLD, icon:'talisman',desc:'灵符爆裂，圆形范围\n造成重伤' },
  { id:'pierce',         name:'穿透  +1',    rare:2, col:C_PURP, icon:'pierce',  desc:'飞剑穿透额外一名\n敌人再返回' },
  { id:'healOnRoom',     name:'回气术',       rare:1, col:C_JADE, icon:'herb',    desc:'每清空房间\n回复20点气血' },
];

// ── 像素图标定义 ──────────────────────────────────────────────────
// 每个图标：10×10 像素矩阵，0=透明，其他=颜色索引
const PIX = {
  sword: {
    pal:['','#e8e0c0','#ffdd60','#999'],
    px:[
      [0,0,0,0,2,0,0,0,0,0],
      [0,0,0,2,2,2,0,0,0,0],
      [0,0,0,0,2,0,0,0,0,0],
      [0,0,0,0,2,0,0,0,0,0],
      [0,0,0,0,2,0,0,0,0,0],
      [0,0,0,0,2,0,0,0,0,0],
      [0,0,0,0,2,0,0,0,0,0],
      [0,0,0,1,2,1,0,0,0,0],
      [0,0,1,1,3,1,1,0,0,0],
      [0,0,0,1,1,1,0,0,0,0],
    ]
  },
  speed: {
    pal:['','#60e8ff','#80ffee','#fff'],
    px:[
      [0,0,0,2,2,0,0,0,0,0],
      [0,0,2,2,2,2,0,0,0,0],
      [0,2,2,1,1,2,2,0,0,0],
      [2,2,0,0,0,0,2,2,0,0],
      [2,1,0,0,0,0,1,2,0,0],
      [0,2,2,0,0,2,2,0,0,0],
      [0,0,2,2,2,2,0,0,0,0],
      [0,0,0,2,2,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,3,3,3,3,3,3,0,0,0],
    ]
  },
  wind: {
    pal:['','#60ffcc','#a0ffe0','#fff'],
    px:[
      [0,0,0,0,0,0,0,0,0,0],
      [0,1,1,1,1,1,0,0,0,0],
      [0,1,0,0,0,1,1,0,0,0],
      [0,1,1,1,1,2,1,0,0,0],
      [0,0,0,0,0,2,1,0,0,0],
      [0,2,2,2,2,2,1,0,0,0],
      [0,2,0,0,0,2,0,0,0,0],
      [0,2,2,2,2,1,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,3,3,3,3,3,0,0,0],
    ]
  },
  flame: {
    pal:['','#ff4020','#ff8040','#ffcc20'],
    px:[
      [0,0,0,0,3,0,0,0,0,0],
      [0,0,0,3,3,3,0,0,0,0],
      [0,0,3,3,2,3,3,0,0,0],
      [0,0,3,2,2,2,3,0,0,0],
      [0,3,2,2,1,2,2,3,0,0],
      [0,3,2,1,1,1,2,3,0,0],
      [0,3,1,1,1,1,1,3,0,0],
      [0,0,2,1,1,1,2,0,0,0],
      [0,0,0,2,2,2,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
    ]
  },
  heart: {
    pal:['','#dd2030','#ff5060','#ff9898'],
    px:[
      [0,0,0,0,0,0,0,0,0,0],
      [0,1,1,0,0,0,1,1,0,0],
      [1,2,2,1,0,1,2,2,1,0],
      [1,2,3,2,1,2,3,2,1,0],
      [1,2,2,2,2,2,2,2,1,0],
      [0,1,2,2,2,2,2,1,0,0],
      [0,0,1,2,2,2,1,0,0,0],
      [0,0,0,1,2,1,0,0,0,0],
      [0,0,0,0,1,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
    ]
  },
  thunder: {
    pal:['','#2060e0','#60a0ff','#c0e8ff'],
    px:[
      [0,0,0,2,2,2,2,0,0,0],
      [0,0,2,2,1,1,2,2,0,0],
      [0,2,2,1,0,0,1,2,2,0],
      [0,2,1,0,0,0,0,1,2,0],
      [0,0,0,0,3,3,0,0,0,0],
      [0,0,0,3,3,3,3,0,0,0],
      [0,0,0,3,2,0,0,0,0,0],
      [0,0,2,3,0,0,0,0,0,0],
      [0,2,2,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
    ]
  },
  talisman: {
    pal:['','#c89020','#ffe080','#8b4010'],
    px:[
      [0,1,1,1,1,1,1,1,1,0],
      [0,1,2,2,2,2,2,2,1,0],
      [0,1,2,3,3,3,3,2,1,0],
      [0,1,2,3,0,3,0,2,1,0],
      [0,1,2,3,3,3,3,2,1,0],
      [0,1,2,3,0,0,3,2,1,0],
      [0,1,2,3,3,3,3,2,1,0],
      [0,1,2,2,2,2,2,2,1,0],
      [0,1,1,1,1,1,1,1,1,0],
      [0,0,0,0,0,0,0,0,0,0],
    ]
  },
  pierce: {
    pal:['','#a050ff','#d090ff','#602090'],
    px:[
      [0,0,0,0,0,0,0,2,0,0],
      [0,0,0,0,0,0,2,2,2,0],
      [0,0,0,0,0,2,2,0,2,0],
      [0,0,0,0,2,2,0,0,0,0],
      [0,0,0,2,1,0,0,0,0,0],
      [0,0,2,1,2,0,0,0,0,0],
      [0,2,1,2,0,0,0,0,0,0],
      [0,1,2,0,0,0,0,0,0,0],
      [3,3,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
    ]
  },
  herb: {
    pal:['','#18b050','#60ff90','#a0ffb8'],
    px:[
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,2,0,0,0,0,0,0],
      [0,0,2,2,2,0,0,2,0,0],
      [0,0,2,1,2,2,2,2,0,0],
      [0,0,0,1,0,0,1,0,0,0],
      [0,0,0,2,0,2,0,0,0,0],
      [0,0,0,2,2,0,0,0,0,0],
      [0,0,0,1,0,0,0,0,0,0],
      [0,0,3,1,3,0,0,0,0,0],
      [0,3,3,3,3,3,0,0,0,0],
    ]
  },
};

function drawPixIcon(px,py,sz,icon){
  const def=PIX[icon]; if(!def)return;
  for(let r=0;r<def.px.length;r++){
    for(let c=0;c<def.px[r].length;c++){
      const ci=def.px[r][c];
      if(ci===0)continue;
      ctx.fillStyle=def.pal[ci];
      ctx.fillRect(px+c*sz, py+r*sz, sz, sz);
    }
  }
}

// ── 玩家 ─────────────────────────────────────────────────────────
let p;
function mkPlayer(){ return { x:GCX, y:GCY+80, r:12, hp:120, maxHp:120, spd:188, dmg:12, atSpd:1.0, swords:2, pierce:0, hasThunder:false, tdCd:4.0, tdT:2.0, hasTalisman:false, taCd:5.5, taT:3.0, healOnRoom:false, vx:0, vy:0, flash:0, ang:-Math.PI/2, aura:0 }; }

// ── 飞剑 ─────────────────────────────────────────────────────────
let swords=[], orbitAng=0;
function mkSword(i,n){ return { i,n,mode:'orbit',x:p.x,y:p.y,fx:0,fy:0,fSpd:390,hits:1,ftimer:(1.4/p.atSpd)*(i/Math.max(1,n)),ang:0,trail:[] }; }
function refreshSwords(){ swords=[]; for(let i=0;i<p.swords;i++) swords.push(mkSword(i,p.swords)); }

// ── 特效 ─────────────────────────────────────────────────────────
let thWarn=[], thFX=[], talismans=[], expl=[], parts=[], dmgNums=[], announce=null;

function spawnParts(x,y,n,col,sp,lr=[.2,.55]){
  for(let i=0;i<n;i++){ const a=rnd(0,TAU),v=rnd(.3,1)*sp; parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rnd(lr[0],lr[1]),r:rnd(1.4,3),col}); }
}
function spawnDmg(x,y,val,crit){ dmgNums.push({x:x+rnd(-10,10),y:y-14,val:Math.ceil(val),life:.9,max:.9,crit}); }
function showAnn(text){ announce={text,life:2.4,max:2.4}; }

// ── 升级卡片 ──────────────────────────────────────────────────────
let upCards=[];
function buildCards(){
  const pool=POOL.filter(u=>!(u.id==='unlockThunder'&&p.hasThunder)&&!(u.id==='unlockTalisman'&&p.hasTalisman));
  for(let i=pool.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
  const ch=pool.slice(0,3);
  // Fan layout: center card straight, left/right tilted
  const CW=170, CH=250, GAP=18;
  const total=ch.length*CW+(ch.length-1)*GAP;
  const sx=(W-total)/2;
  const angles=[-0.12, 0, 0.12];
  upCards=ch.map((u,i)=>({ u, cx:sx+i*(CW+GAP)+CW/2, cy:H*0.68, w:CW, h:CH, ang:angles[i], hover:false }));
}
function applyUpgrade(u){
  switch(u.id){
    case 'moreSwords':     p.swords++; refreshSwords(); break;
    case 'attackSpeed':    p.atSpd*=1.20; break;
    case 'moveSpeed':      p.spd*=1.15; break;
    case 'damage':         p.dmg*=1.18; break;
    case 'maxHp':          p.maxHp+=30; p.hp=Math.min(p.hp+30,p.maxHp); break;
    case 'unlockThunder':  p.hasThunder=true; break;
    case 'unlockTalisman': p.hasTalisman=true; break;
    case 'pierce':         p.pierce++; break;
    case 'healOnRoom':     p.healOnRoom=true; break;
  }
}

// ── 房间状态 ──────────────────────────────────────────────────────
let doorOpen=false, spawnDone=false, roomCleared=false, spawnDelay=0;

// ── 初始化 ────────────────────────────────────────────────────────
function startGame(){
  p=mkPlayer(); killCount=0; totalKills=0;
  enemies=[]; parts=[]; thWarn=[]; thFX=[]; talismans=[]; expl=[]; dmgNums=[]; announce=null;
  roomIdx=0; elapsed=0; gameState='fadein'; fadeAlpha=1;
  setupRoom(0); refreshSwords(); lastTS=0;
}
function setupRoom(idx){
  enemies=[]; parts=[]; thWarn=[]; thFX=[]; talismans=[]; expl=[]; dmgNums=[]; announce=null;
  doorOpen=false; spawnDone=false; roomCleared=false;
  spawnDelay=ROOMS[idx].type==='reward'?.2:.7;
  p.x=GCX; p.y=GCY+80; p.vx=0; p.vy=0;
}
function doSpawn(idx){
  const cfg=ROOMS[idx];
  if(cfg.type==='reward'){ buildCards(); gameState='upgrading'; return; }
  for(const [type,cnt] of cfg.wave) for(let i=0;i<cnt;i++) enemies.push(mkEnemy(type,...randPos()));
  showAnn(cfg.label);
}
function randPos(){ const m=30,s=Math.floor(Math.random()*4);
  if(s===0) return [rnd(GX1+m,GX2-m), rnd(GY1+m,GY1+90)];
  if(s===1) return [rnd(GX1+m,GX2-m), rnd(GY2-90,GY2-m)];
  if(s===2) return [rnd(GX1+m,GX1+90), rnd(GY1+m,GY2-m)];
            return [rnd(GX2-90,GX2-m), rnd(GY1+m,GY2-m)];
}

// ── 点击 ─────────────────────────────────────────────────────────
function handleClick(e){
  const rc=C.getBoundingClientRect(), cx=e.clientX-rc.left, cy=e.clientY-rc.top;
  if(['title','gameover','victory'].includes(gameState)){ startGame(); return; }
  if(gameState==='upgrading'){
    for(const card of upCards){
      // hit-test in card's local rotated space
      const dx=cx-card.cx, dy=cy-card.cy;
      const lx=dx*Math.cos(-card.ang)-dy*Math.sin(-card.ang);
      const ly=dx*Math.sin(-card.ang)+dy*Math.cos(-card.ang);
      if(lx>=-card.w/2&&lx<=card.w/2&&ly>=-card.h/2&&ly<=card.h/2){
        applyUpgrade(card.u); upCards=[]; doorOpen=true; gameState='playing'; break;
      }
    }
  }
}

// ================================================================
//  UPDATE
// ================================================================
function update(ts){
  const dt=lastTS?Math.min((ts-lastTS)/1000,.05):0;
  lastTS=ts; elapsed+=dt; titleTime+=dt;

  if(SK.dur>0){ SK.dur-=dt; SK.ox=rnd(-1,1)*SK.mag*SK.dur; SK.oy=rnd(-1,1)*SK.mag*SK.dur; }
  else{ SK.ox=0; SK.oy=0; }

  switch(gameState){
    case 'fadein':  fadeAlpha=Math.max(0,fadeAlpha-dt*2.5); if(fadeAlpha<=0)gameState='playing'; updateGame(dt); break;
    case 'playing': updateGame(dt); break;
    case 'upgrading':
      for(const c of upCards){
        const dx=mx-c.cx, dy=my-c.cy;
        const lx=dx*Math.cos(-c.ang)-dy*Math.sin(-c.ang);
        const ly=dx*Math.sin(-c.ang)+dy*Math.cos(-c.ang);
        c.hover=lx>=-c.w/2&&lx<=c.w/2&&ly>=-c.h/2&&ly<=c.h/2;
      }
      updateParts(dt); break;
    case 'fadeout': fadeAlpha=Math.min(1,fadeAlpha+dt*2.5); if(fadeAlpha>=1){ roomIdx=pendingRoom; setupRoom(roomIdx); refreshSwords(); gameState='fadein'; fadeAlpha=1; } break;
  }
  draw();
  requestAnimationFrame(update);
}

function updateGame(dt){
  updatePlayer(dt);
  updateSwords(dt);
  if(p.hasThunder)  updateThunder(dt);
  if(p.hasTalisman) updateTalisman(dt);
  updateEnemies(dt);
  updateFX(dt);
  updateParts(dt);
  updateDmg(dt);
  if(announce){ announce.life-=dt; if(announce.life<=0)announce=null; }
  if(!spawnDone){ spawnDelay-=dt; if(spawnDelay<=0){spawnDone=true; doSpawn(roomIdx);} }
  if(spawnDone&&!roomCleared&&ROOMS[roomIdx].type!=='reward'&&enemies.length===0){
    roomCleared=true; doorOpen=true; doShake(.14,.3);
    if(p.healOnRoom) p.hp=Math.min(p.maxHp,p.hp+20);
    buildCards(); gameState='upgrading';
  }
  if(doorOpen&&p.y<=GY1+14&&p.x>=DX1-4&&p.x<=DX2+4) goNext();
}

// ── 玩家移动 ─────────────────────────────────────────────────────
function updatePlayer(dt){
  let ix=0,iy=0;
  if(keys['w']||keys['ArrowUp'])   iy-=1;
  if(keys['s']||keys['ArrowDown']) iy+=1;
  if(keys['a']||keys['ArrowLeft']) ix-=1;
  if(keys['d']||keys['ArrowRight'])ix+=1;
  if(ix||iy){ const l=Math.hypot(ix,iy); p.ang=Math.atan2(iy,ix); p.vx=lerp(p.vx,(ix/l)*p.spd,dt*14); p.vy=lerp(p.vy,(iy/l)*p.spd,dt*14); }
  else { p.vx=lerp(p.vx,0,dt*16); p.vy=lerp(p.vy,0,dt*16); }
  p.x+=p.vx*dt; p.y+=p.vy*dt;
  const thru=doorOpen&&p.x>=DX1-p.r&&p.x<=DX2+p.r;
  p.x=clamp(p.x,GX1+p.r,GX2-p.r); p.y=clamp(p.y,thru?GY1-p.r*3:GY1+p.r,GY2-p.r);
  p.flash=Math.max(0,p.flash-dt); p.aura+=dt*2.4;
}

// ── 飞剑 ─────────────────────────────────────────────────────────
function updateSwords(dt){
  orbitAng+=178*dt; if(orbitAng>=360)orbitAng-=360;
  for(let si=0;si<swords.length;si++){
    const sw=swords[si];
    if(sw.mode==='orbit'){
      const ang=(orbitAng+(360/swords.length)*si)*(Math.PI/180);
      sw.x=lerp(sw.x,p.x+Math.cos(ang)*58,dt*22); sw.y=lerp(sw.y,p.y+Math.sin(ang)*58,dt*22); sw.ang=ang;
      sw.trail.push({x:sw.x,y:sw.y}); if(sw.trail.length>5)sw.trail.shift();
      sw.ftimer-=dt;
      if(sw.ftimer<=0&&enemies.length>0){
        const ne=nearest(p.x,p.y);
        if(ne){ sw.mode='fly'; const dx=ne.x-sw.x,dy=ne.y-sw.y,l=Math.hypot(dx,dy)||1; sw.fx=dx/l; sw.fy=dy/l; sw.hits=1+p.pierce; sw.trail=[]; }
        sw.ftimer=Math.max(.22,1.4/p.atSpd);
      }
    } else if(sw.mode==='fly'){
      sw.trail.push({x:sw.x,y:sw.y}); if(sw.trail.length>14)sw.trail.shift();
      sw.x+=sw.fx*sw.fSpd*dt; sw.y+=sw.fy*sw.fSpd*dt;
      for(let ei=enemies.length-1;ei>=0;ei--){
        const e=enemies[ei]; if(e.dead)continue;
        if(dist(sw.x,sw.y,e.x,e.y)<e.r+7){ const dmg=p.dmg*(e.type==='boss'?.8:1); spawnDmg(e.x,e.y,dmg,false); hitEnemy(e,dmg,sw.fx,sw.fy,75); sw.hits--; if(sw.hits<=0){sw.mode='ret';sw.trail=[];break;} }
      }
      if(sw.x<GX1-60||sw.x>W+60||sw.y<-60||sw.y>H+60||dist(sw.x,sw.y,p.x,p.y)>700){sw.mode='ret';sw.trail=[];}
    } else {
      sw.trail.push({x:sw.x,y:sw.y}); if(sw.trail.length>8)sw.trail.shift();
      const dx=p.x-sw.x,dy=p.y-sw.y,l=Math.hypot(dx,dy)||1;
      sw.x+=(dx/l)*340*dt; sw.y+=(dy/l)*340*dt; if(l<18){sw.mode='orbit';sw.trail=[];}
    }
  }
}
function nearest(x,y){ let b=null,bd=Infinity; for(const e of enemies){if(e.dead)continue;const d=dist(x,y,e.x,e.y);if(d<bd){bd=d;b=e;}} return b; }

// ── 雷法 / 符咒 ───────────────────────────────────────────────────
function updateThunder(dt){
  p.tdT-=dt;
  if(p.tdT<=0){ p.tdT=p.tdCd; const ne=nearest(p.x,p.y)||{x:p.x+rnd(-80,80),y:p.y+rnd(-60,60)}; const tx=ne.x,ty=ne.y; thWarn.push({x:tx,y:ty,r:68,life:.32,max:.32}); setTimeout(()=>{ if(!['playing','fadein'].includes(gameState))return; strikeThunder(tx,ty); },320); }
}
function strikeThunder(tx,ty){ const rad=68; for(const e of enemies){if(e.dead)continue;if(dist(e.x,e.y,tx,ty)<rad+e.r){const dmg=p.dmg*2.6;spawnDmg(e.x,e.y,dmg,true);hitEnemy(e,dmg,(e.x-tx)/60,(e.y-ty)/60,90);}} doShake(.22,.28); thFX.push({segs:mkLightning(tx,GY1-10,tx,ty,9),x:tx,y:ty,rad,life:.3,max:.3}); spawnParts(tx,ty,18,C_AZUR.hi,90,[.2,.6]); spawnParts(tx,ty,5,'#fff',50,[.1,.3]); expl.push({x:tx,y:ty,r:0,mR:rad*1.8,life:.4,max:.4,col:C_AZUR.md}); }
function mkLightning(x1,y1,x2,y2,n){ const pts=[{x:x1,y:y1}]; for(let i=1;i<n;i++) pts.push({x:lerp(x1,x2,i/n)+rnd(-22,22),y:lerp(y1,y2,i/n)+rnd(-8,8)}); pts.push({x:x2,y:y2}); return pts; }

function updateTalisman(dt){
  p.taT-=dt;
  if(p.taT<=0){ p.taT=p.taCd; const ne=nearest(p.x,p.y); const tx=ne?ne.x+rnd(-18,18):p.x+rnd(-100,100),ty=ne?ne.y+rnd(-18,18):p.y+rnd(-100,100); talismans.push({sx:p.x,sy:p.y,tx,ty,x:p.x,y:p.y,life:.5,max:.5,rot:0,done:false}); }
}

function updateFX(dt){
  for(let i=thWarn.length-1;i>=0;i--){thWarn[i].life-=dt;if(thWarn[i].life<=0)thWarn.splice(i,1);}
  for(let i=thFX.length-1;i>=0;i--){thFX[i].life-=dt;if(thFX[i].life<=0)thFX.splice(i,1);}
  for(let i=talismans.length-1;i>=0;i--){
    const t=talismans[i]; t.life-=dt; t.rot+=680*dt; const pct=1-t.life/t.max;
    t.x=lerp(t.sx,t.tx,Math.min(1,pct*1.6)); t.y=lerp(t.sy,t.ty,Math.min(1,pct*1.6))-Math.sin(pct*Math.PI)*55;
    if(t.life<=0&&!t.done){ t.done=true; const rad=85; for(const e of enemies){if(e.dead)continue;if(dist(e.x,e.y,t.tx,t.ty)<rad+e.r){const dmg=p.dmg*3.4;spawnDmg(e.x,e.y,dmg,true);hitEnemy(e,dmg,(e.x-t.tx)/60,(e.y-t.ty)/60,100);}} doShake(.2,.22); spawnParts(t.tx,t.ty,22,C_GOLD.hi,110,[.2,.65]); spawnParts(t.tx,t.ty,6,'#fffaaa',55,[.1,.35]); expl.push({x:t.tx,y:t.ty,r:0,mR:rad*2,life:.45,max:.45,col:C_GOLD.md}); talismans.splice(i,1); }
  }
  for(let i=expl.length-1;i>=0;i--){const e=expl[i];e.life-=dt;e.r=e.mR*(1-e.life/e.max);if(e.life<=0)expl.splice(i,1);}
}

// ── 敌人 AI ───────────────────────────────────────────────────────
function updateEnemies(dt){
  for(const e of enemies){
    if(e.dead)continue;
    const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;
    e.kx*=Math.pow(.04,dt); e.ky*=Math.pow(.04,dt);
    e.x+=(dx/d*e.spd+e.kx)*dt; e.y+=(dy/d*e.spd+e.ky)*dt;
    e.x=clamp(e.x,GX1+e.r,GX2-e.r); e.y=clamp(e.y,GY1+e.r,GY2-e.r);
    e.flash=Math.max(0,e.flash-dt);
    if(dist(e.x,e.y,p.x,p.y)<e.r+p.r){ p.hp-=e.dmg*dt; p.flash=.22; doShake(.12,.16); if(p.hp<=0){p.hp=0;gameState='gameover';} }
  }
  enemies=enemies.filter(e=>!e.dead);
}
function hitEnemy(e,dmg,kxD,kyD,kbF){
  if(e.dead)return; e.hp-=dmg; e.kx+=kxD*kbF; e.ky+=kyD*kbF; e.flash=.14;
  spawnParts(e.x,e.y,5,e.bodyB,55,[.15,.4]);
  if(e.hp<=0){ e.dead=true; killCount++; totalKills++; spawnParts(e.x,e.y,14,e.glCol,85,[.25,.7]); doShake(.08,.1); }
}
function updateParts(dt){ for(let i=parts.length-1;i>=0;i--){const p2=parts[i];p2.x+=p2.vx*dt;p2.y+=p2.vy*dt;p2.life-=dt;if(p2.life<=0)parts.splice(i,1);} }
function updateDmg(dt){ for(let i=dmgNums.length-1;i>=0;i--){const d=dmgNums[i];d.y-=35*dt;d.life-=dt;if(d.life<=0)dmgNums.splice(i,1);} }

function goNext(){ if(roomIdx+1>=ROOMS.length){gameState='victory';return;} pendingRoom=roomIdx+1; gameState='fadeout'; fadeAlpha=0; }

// ================================================================
//  DRAW
// ================================================================
function draw(){
  ctx.save(); ctx.translate(SK.ox,SK.oy);
  ctx.fillStyle='#030108'; ctx.fillRect(-10,-10,W+20,H+20);

  if(gameState==='title')   { drawTitle();  ctx.restore(); return; }
  if(gameState==='gameover'){ drawOver();   ctx.restore(); return; }
  if(gameState==='victory') { drawWin();    ctx.restore(); return; }

  drawBG();
  drawExpl(); drawThWarn(); drawParts(); drawThFX(); drawTalismans();
  drawEnemies(); drawSwords(); drawPlayer();
  drawDmgNums(); drawAnnounce();
  drawHUD();
  if(gameState==='upgrading') drawUpgradePanel();

  if(fadeAlpha>0){ ctx.fillStyle=`rgba(3,1,8,${fadeAlpha})`; ctx.fillRect(0,0,W,H); }
  ctx.restore();
}

// ── 背景 ─────────────────────────────────────────────────────────
function drawBG(){
  // 地板石砖
  const ts=36;
  for(let tx=GX1;tx<GX2;tx+=ts) for(let ty=GY1;ty<GY2;ty+=ts){
    const even=((tx-GX1)/ts+(ty-GY1)/ts)%2===0;
    ctx.fillStyle=even?'#07050e':'#060410';
    ctx.fillRect(tx,ty,ts,ts);
    ctx.strokeStyle='rgba(20,10,40,.25)'; ctx.lineWidth=.5;
    ctx.strokeRect(tx,ty,ts,ts);
  }

  // 地板玄纹（八方格）
  ctx.strokeStyle='rgba(30,12,60,.1)'; ctx.lineWidth=1;
  for(let gx=GX1;gx<GX2;gx+=108){ctx.beginPath();ctx.moveTo(gx,GY1);ctx.lineTo(gx,GY2);ctx.stroke();}
  for(let gy=GY1;gy<GY2;gy+=108){ctx.beginPath();ctx.moveTo(GX1,gy);ctx.lineTo(GX2,gy);ctx.stroke();}

  // 顶墙
  ctx.fillStyle='#0e0b1c'; ctx.fillRect(GX1,0,GX2-GX1,GY1);
  // 底墙
  ctx.fillStyle='#0e0b1c'; ctx.fillRect(GX1,GY2,GX2-GX1,H-GY2);
  // 右墙
  ctx.fillStyle='#0e0b1c'; ctx.fillRect(GX2,0,W-GX2,H);

  // 玉色内边框
  ctx.strokeStyle='rgba(20,160,90,.28)'; ctx.lineWidth=2;
  ctx.shadowBlur=10; ctx.shadowColor=C_JADE.lo;
  ctx.strokeRect(GX1,GY1,GX2-GX1,GY2-GY1); ctx.shadowBlur=0;

  // 四角金色装饰
  [[GX1,GY1,1,1],[GX2,GY1,-1,1],[GX1,GY2,1,-1],[GX2,GY2,-1,-1]].forEach(([x,y,fx,fy])=>{
    ctx.strokeStyle=C_GOLD.md; ctx.lineWidth=2; ctx.shadowBlur=6; ctx.shadowColor=C_GOLD.gl;
    ctx.beginPath(); ctx.moveTo(x+fx*20,y); ctx.lineTo(x,y); ctx.lineTo(x,y+fy*20); ctx.stroke();
    ctx.fillStyle=C_GOLD.hi; ctx.beginPath(); ctx.arc(x,y,3,0,TAU); ctx.fill(); ctx.shadowBlur=0;
  });

  // 背景柱（氛围）
  for(let i=0;i<3;i++){
    const px=GX1+80+i*(GX2-GX1-160)/2.5;
    const g=ctx.createLinearGradient(px-6,GY1,px+6,GY1);
    g.addColorStop(0,'rgba(10,6,28,.0)'); g.addColorStop(.5,'rgba(20,14,50,.35)'); g.addColorStop(1,'rgba(10,6,28,.0)');
    ctx.fillStyle=g; ctx.fillRect(px-8,GY1,16,GY2-GY1);
    ctx.strokeStyle='rgba(80,60,140,.18)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(px-8,GY1); ctx.lineTo(px-8,GY2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px+8,GY1); ctx.lineTo(px+8,GY2); ctx.stroke();
  }

  // 门
  drawDoor();
}

function drawDoor(){
  if(!doorOpen){
    ctx.fillStyle='#110408'; ctx.fillRect(DX1,0,DOOR_W,GY1+2);
    ctx.strokeStyle=C_CRIM.md; ctx.lineWidth=2; ctx.shadowBlur=8; ctx.shadowColor=C_CRIM.gl;
    ctx.strokeRect(DX1,0,DOOR_W,GY1);
    ctx.fillStyle='rgba(220,40,50,.85)'; ctx.font='bold 14px serif';
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('封',GCX,GY1/2+2);
    ctx.shadowBlur=0;
  } else {
    const g=ctx.createLinearGradient(GCX,0,GCX,GY1+40);
    g.addColorStop(0,'rgba(20,200,120,.0)'); g.addColorStop(1,'rgba(20,200,120,.55)');
    ctx.fillStyle=g; ctx.fillRect(DX1,0,DOOR_W,GY1+40);
    ctx.shadowBlur=22; ctx.shadowColor=C_JADE.gl;
    ctx.strokeStyle=C_JADE.hi; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.moveTo(DX1,0); ctx.lineTo(DX1,GY1); ctx.moveTo(DX2,0); ctx.lineTo(DX2,GY1); ctx.stroke();
    ctx.shadowBlur=0;
    ctx.fillStyle=C_JADE.hi; ctx.font='bold 12px Microsoft YaHei'; ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.fillText('前进 ↑',GCX,GY1-5);
  }
}

// ── 玩家 ─────────────────────────────────────────────────────────
function drawPlayer(){
  const {x,y,r,flash,aura}=p; const fl=flash>0;
  const aR=r+9+Math.sin(aura)*3;
  const ag=ctx.createRadialGradient(x,y,r,x,y,aR+12);
  ag.addColorStop(0,fl?'rgba(255,80,80,.5)':'rgba(30,220,130,.42)'); ag.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=ag; ctx.beginPath(); ctx.arc(x,y,aR+12,0,TAU); ctx.fill();
  ctx.shadowBlur=fl?24:20; ctx.shadowColor=fl?C_CRIM.gl:C_JADE.gl;
  const bg=ctx.createRadialGradient(x-r*.3,y-r*.3,0,x,y,r);
  bg.addColorStop(0,fl?'#ffc0c0':C_JADE.hi); bg.addColorStop(.6,fl?C_CRIM.md:'#14a068'); bg.addColorStop(1,fl?C_CRIM.lo:'#063830');
  ctx.fillStyle=bg; ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fill();
  ctx.shadowBlur=0; ctx.fillStyle=fl?'#fff':'rgba(180,255,220,.92)'; ctx.font=`bold ${r-1}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('仙',x,y+1);
  ctx.strokeStyle=fl?'rgba(255,120,120,.7)':'rgba(60,240,155,.55)'; ctx.lineWidth=2; ctx.shadowBlur=8; ctx.shadowColor=fl?C_CRIM.gl:C_JADE.gl;
  ctx.beginPath(); ctx.arc(x,y,r+5,p.ang-.5,p.ang+.5); ctx.stroke(); ctx.shadowBlur=0; ctx.textBaseline='alphabetic';
}

// ── 飞剑 ─────────────────────────────────────────────────────────
function drawSwords(){
  for(const sw of swords){
    const fly=sw.mode==='fly';
    for(let i=0;i<sw.trail.length;i++){
      const tp=i/sw.trail.length; ctx.globalAlpha=tp*(fly?.5:.18);
      ctx.fillStyle=fly?C_GOLD.md:C_JADE.md; ctx.shadowBlur=fly?8:3; ctx.shadowColor=fly?C_GOLD.gl:C_JADE.gl;
      ctx.beginPath(); ctx.arc(sw.trail[i].x,sw.trail[i].y,3*tp,0,TAU); ctx.fill(); ctx.shadowBlur=0;
    }
    ctx.globalAlpha=1; ctx.save(); ctx.translate(sw.x,sw.y); ctx.rotate(sw.ang+Math.PI/2);
    ctx.shadowBlur=fly?18:10; ctx.shadowColor=fly?C_GOLD.gl:C_JADE.gl;
    const sg=ctx.createLinearGradient(0,-13,0,13);
    sg.addColorStop(0,fly?'#fff8d0':C_JADE.hi); sg.addColorStop(.45,fly?C_GOLD.hi:C_JADE.md); sg.addColorStop(1,fly?C_GOLD.lo:C_JADE.lo);
    ctx.fillStyle=sg; ctx.beginPath(); ctx.moveTo(0,-13); ctx.lineTo(4,0); ctx.lineTo(0,13); ctx.lineTo(-4,0); ctx.closePath(); ctx.fill(); ctx.shadowBlur=0; ctx.restore();
  }
}

// ── 敌人 ─────────────────────────────────────────────────────────
function drawEnemies(){
  for(const e of enemies){
    if(e.dead)continue; const fl=e.flash>0; const boss=e.type==='boss';
    if(boss){ ctx.strokeStyle=`rgba(255,170,20,${.3+.2*Math.sin(titleTime*4)})`; ctx.lineWidth=3.5; ctx.beginPath(); ctx.arc(e.x,e.y,e.r+9,0,TAU); ctx.stroke(); }
    ctx.shadowBlur=fl?0:14; ctx.shadowColor=e.glCol;
    const g=ctx.createRadialGradient(e.x-e.r*.3,e.y-e.r*.3,0,e.x,e.y,e.r);
    g.addColorStop(0,fl?'#ffffff':e.bodyB); g.addColorStop(1,fl?'#dddddd':e.bodyA);
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,TAU); ctx.fill(); ctx.shadowBlur=0;
    ctx.fillStyle=fl?'rgba(40,40,40,.9)':'rgba(255,255,255,.80)'; ctx.font=`bold ${Math.max(10,e.r-4+(boss?4:0))}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(e.sym,e.x,e.y+1);
    // HP bar
    const bw=e.r*2+8,bh=boss?6:3.5,bx=e.x-bw/2,by=e.y-e.r-9;
    ctx.fillStyle='#0a0206'; ctx.fillRect(bx,by,bw,bh);
    const pct=e.hp/e.maxHp; ctx.fillStyle=boss?C_GOLD.md:pct>.5?C_CRIM.md:pct>.25?'#e05008':'#ff1010';
    ctx.shadowBlur=boss?8:0; ctx.shadowColor=C_GOLD.gl; ctx.fillRect(bx,by,bw*pct,bh); ctx.shadowBlur=0;
    ctx.strokeStyle='rgba(80,40,0,.4)'; ctx.lineWidth=.5; ctx.strokeRect(bx,by,bw,bh);
    ctx.textBaseline='alphabetic';
  }
}

// ── 粒子 / 特效 ───────────────────────────────────────────────────
function drawParts(){
  for(const pt of parts){ ctx.globalAlpha=Math.max(0,pt.life*2.2); ctx.fillStyle=pt.col; ctx.shadowBlur=7; ctx.shadowColor=pt.col; ctx.beginPath(); ctx.arc(pt.x,pt.y,pt.r,0,TAU); ctx.fill(); ctx.shadowBlur=0; } ctx.globalAlpha=1;
}
function drawThWarn(){
  for(const w of thWarn){ ctx.globalAlpha=w.life/w.max*.65; ctx.strokeStyle=C_AZUR.hi; ctx.lineWidth=2; ctx.shadowBlur=10; ctx.shadowColor=C_AZUR.gl; ctx.setLineDash([6,4]); ctx.beginPath(); ctx.arc(w.x,w.y,w.r,0,TAU); ctx.stroke(); ctx.setLineDash([]); ctx.shadowBlur=0; } ctx.globalAlpha=1;
}
function drawThFX(){
  for(const tf of thFX){ const a=tf.life/tf.max; ctx.globalAlpha=a; ctx.shadowBlur=16; ctx.shadowColor=C_AZUR.gl; ctx.strokeStyle=C_AZUR.hi; ctx.lineWidth=3*a; ctx.lineJoin='round'; ctx.beginPath(); ctx.moveTo(tf.segs[0].x,tf.segs[0].y); for(let i=1;i<tf.segs.length;i++)ctx.lineTo(tf.segs[i].x,tf.segs[i].y); ctx.stroke(); ctx.strokeStyle='rgba(255,255,255,.8)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(tf.segs[0].x,tf.segs[0].y); for(let i=1;i<tf.segs.length;i++)ctx.lineTo(tf.segs[i].x,tf.segs[i].y); ctx.stroke(); ctx.shadowBlur=0; ctx.globalAlpha=1; }
}
function drawTalismans(){
  for(const t of talismans){ ctx.save(); ctx.translate(t.x,t.y); ctx.rotate(t.rot*Math.PI/180); ctx.shadowBlur=14; ctx.shadowColor=C_GOLD.gl; ctx.fillStyle=C_GOLD.md; ctx.fillRect(-7,-10,14,20); ctx.strokeStyle=C_GOLD.lo; ctx.lineWidth=1; ctx.strokeRect(-7,-10,14,20); ctx.strokeStyle='rgba(60,30,0,.7)'; ctx.lineWidth=.8; for(const ly of [-6,-2,2,6]){ctx.beginPath();ctx.moveTo(-4,ly);ctx.lineTo(4,ly);ctx.stroke();} ctx.shadowBlur=0; ctx.restore(); }
}
function drawExpl(){
  for(const e of expl){ const a=e.life/e.max; ctx.globalAlpha=a*.6; ctx.strokeStyle=e.col; ctx.lineWidth=3*a+1; ctx.shadowBlur=18; ctx.shadowColor=e.col; ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,TAU); ctx.stroke(); ctx.shadowBlur=0; ctx.globalAlpha=1; }
}
function drawDmgNums(){
  ctx.textAlign='center'; ctx.textBaseline='middle';
  for(const d of dmgNums){ const a=d.life/d.max; ctx.globalAlpha=a; const col=d.crit?C_GOLD.hi:C_JADE.hi; ctx.fillStyle=col; ctx.shadowBlur=d.crit?14:6; ctx.shadowColor=col; ctx.font=d.crit?`bold 17px Microsoft YaHei`:`bold 13px Microsoft YaHei`; ctx.fillText(d.crit?`⚡${d.val}`:`${d.val}`,d.x,d.y); ctx.shadowBlur=0; }
  ctx.globalAlpha=1; ctx.textBaseline='alphabetic';
}
function drawAnnounce(){
  if(!announce)return;
  const a=Math.min(1,announce.life/announce.max*3)*Math.min(1,announce.life/.5);
  ctx.globalAlpha=a; ctx.textAlign='center'; ctx.textBaseline='middle';
  const col=ROOMS[roomIdx]&&ROOMS[roomIdx].type==='boss'?C_GOLD.hi:C_JADE.hi;
  ctx.fillStyle=col; ctx.font='bold 19px Microsoft YaHei'; ctx.shadowBlur=22; ctx.shadowColor=col;
  ctx.fillText(announce.text,GCX,GY1+28); ctx.shadowBlur=0; ctx.globalAlpha=1; ctx.textBaseline='alphabetic';
}

// ── HUD ───────────────────────────────────────────────────────────
function drawHUD(){
  drawLeftPanel();
  drawTopBar();
}

// ── 左侧面板 ─────────────────────────────────────────────────────
function drawLeftPanel(){
  // 面板背景
  ctx.fillStyle=C_DARK; ctx.fillRect(0,0,HUDW,H);
  // 右边线（翡翠细线）
  ctx.strokeStyle='rgba(20,160,80,.35)'; ctx.lineWidth=1.5;
  ctx.shadowBlur=8; ctx.shadowColor=C_JADE.lo;
  ctx.beginPath(); ctx.moveTo(HUDW,0); ctx.lineTo(HUDW,H); ctx.stroke(); ctx.shadowBlur=0;
  // 顶部标题条
  const th=28;
  ctx.fillStyle='rgba(16,8,32,.95)'; ctx.fillRect(0,0,HUDW,th);
  ctx.strokeStyle='rgba(180,130,20,.4)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(0,th); ctx.lineTo(HUDW,th); ctx.stroke();
  ctx.fillStyle=C_GOLD.hi; ctx.font='bold 12px Microsoft YaHei'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.shadowBlur=8; ctx.shadowColor=C_GOLD.gl; ctx.fillText('修仙地牢',HUDW/2,th/2); ctx.shadowBlur=0;

  let y=th+8;

  // ── 头像框 ─────────────────────────────────────────────────
  const cx2=HUDW/2, cy2=y+38, pr=30;
  // 外环（HP弧）
  const hpArc=p.hp/p.maxHp*TAU;
  ctx.strokeStyle='rgba(30,30,50,.8)'; ctx.lineWidth=5;
  ctx.beginPath(); ctx.arc(cx2,cy2,pr+5,0,TAU); ctx.stroke();
  ctx.strokeStyle=p.hp/p.maxHp>.4?C_JADE.md:C_CRIM.md; ctx.lineWidth=5;
  ctx.shadowBlur=10; ctx.shadowColor=p.hp/p.maxHp>.4?C_JADE.gl:C_CRIM.gl;
  ctx.beginPath(); ctx.arc(cx2,cy2,pr+5,-Math.PI/2,-Math.PI/2+hpArc); ctx.stroke(); ctx.shadowBlur=0;
  // 金色外框圆
  ctx.strokeStyle=C_GOLD.md; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(cx2,cy2,pr+8,0,TAU); ctx.stroke();
  // 头像圆填充
  const pcg=ctx.createRadialGradient(cx2-8,cy2-8,0,cx2,cy2,pr);
  pcg.addColorStop(0,'#2a1060'); pcg.addColorStop(1,'#0d0620');
  ctx.fillStyle=pcg; ctx.beginPath(); ctx.arc(cx2,cy2,pr,0,TAU); ctx.fill();
  // 仙字大号
  ctx.fillStyle=C_JADE.hi; ctx.font='bold 22px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.shadowBlur=12; ctx.shadowColor=C_JADE.gl; ctx.fillText('仙',cx2,cy2+1); ctx.shadowBlur=0;
  // HP数字
  ctx.fillStyle='rgba(200,240,210,.85)'; ctx.font='bold 10px Microsoft YaHei'; ctx.textBaseline='alphabetic';
  ctx.fillText(`${Math.ceil(p.hp)}/${p.maxHp}`,cx2,cy2+pr+20);
  y+=pr*2+28;

  // ── 技能栏 ─────────────────────────────────────────────────
  ctx.fillStyle='rgba(255,255,255,.12)'; ctx.font='10px Microsoft YaHei';
  ctx.textAlign='left'; ctx.fillText('装备',6,y+12); y+=14;

  const slotSz=30, slotGap=5;
  const slots=[
    { icon:'sword',  label:`×${p.swords}`, col:C_JADE, active:true,   cdPct:0 },
    { icon:'thunder', label:'雷法', col:C_AZUR, active:p.hasThunder,  cdPct:p.hasThunder?p.tdT/p.tdCd:0 },
    { icon:'talisman',label:'符咒', col:C_GOLD, active:p.hasTalisman, cdPct:p.hasTalisman?p.taT/p.taCd:0 },
  ];
  let sx2=6;
  for(const sl of slots){
    const sy2=y; const sz=slotSz;
    ctx.fillStyle=sl.active?'rgba(12,24,18,.95)':'rgba(6,6,12,.9)'; rRect(sx2,sy2,sz,sz,5); ctx.fill();
    ctx.strokeStyle=sl.active?sl.col.md:'rgba(40,30,60,.6)'; ctx.lineWidth=1.5;
    ctx.shadowBlur=sl.active?8:0; ctx.shadowColor=sl.col.gl; rRect(sx2,sy2,sz,sz,5); ctx.stroke(); ctx.shadowBlur=0;
    if(!sl.active){ ctx.fillStyle='rgba(0,0,0,.55)'; rRect(sx2,sy2,sz,sz,5); ctx.fill(); }
    // 像素图标
    ctx.globalAlpha=sl.active?.9:.3;
    drawPixIcon(sx2+5,sy2+5,2,sl.icon);
    ctx.globalAlpha=1;
    // 冷却
    if(sl.active&&sl.cdPct>0){ ctx.fillStyle='rgba(0,0,0,.5)'; ctx.beginPath(); ctx.moveTo(sx2+sz/2,sy2); ctx.arc(sx2+sz/2,sy2+sz/2,sz/2,-Math.PI/2,-Math.PI/2+sl.cdPct*TAU); ctx.lineTo(sx2+sz/2,sy2+sz/2); ctx.closePath(); ctx.fill(); }
    // label
    ctx.fillStyle=sl.active?sl.col.hi:'rgba(80,70,100,.5)'; ctx.font='9px Microsoft YaHei'; ctx.textAlign='center'; ctx.textBaseline='alphabetic';
    ctx.fillText(sl.label, sx2+sz/2, sy2+sz+11);
    sx2+=sz+slotGap;
  }
  y+=slotSz+16;

  // ── 数值栏 ─────────────────────────────────────────────────
  ctx.strokeStyle='rgba(40,180,100,.22)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(6,y); ctx.lineTo(HUDW-6,y); ctx.stroke(); y+=10;
  const stats=[
    ['攻击', Math.floor(p.dmg)],
    ['攻速', `×${p.atSpd.toFixed(2)}`],
    ['移速', Math.floor(p.spd)],
    ['穿透', p.pierce],
  ];
  ctx.textAlign='left'; ctx.textBaseline='alphabetic';
  for(const [name,val] of stats){
    ctx.fillStyle='rgba(140,120,170,.7)'; ctx.font='10px Microsoft YaHei'; ctx.fillText(name,6,y);
    ctx.fillStyle=C_JADE.hi; ctx.font='bold 10px Microsoft YaHei'; ctx.textAlign='right'; ctx.fillText(val,HUDW-6,y);
    ctx.textAlign='left'; y+=16;
  }

  y+=6;
  ctx.strokeStyle='rgba(40,180,100,.22)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(6,y); ctx.lineTo(HUDW-6,y); ctx.stroke(); y+=10;

  // ── 击杀 ──────────────────────────────────────────────────
  ctx.fillStyle='rgba(140,120,170,.6)'; ctx.font='10px Microsoft YaHei'; ctx.fillText('斩妖',6,y);
  ctx.fillStyle=C_CRIM.hi; ctx.font='bold 12px Microsoft YaHei'; ctx.textAlign='right'; ctx.fillText(`${totalKills}`,HUDW-6,y); ctx.textAlign='left';
  y+=22;

  // ── 房间进度 ──────────────────────────────────────────────
  ctx.fillStyle='rgba(140,120,170,.6)'; ctx.font='10px Microsoft YaHei'; ctx.fillText('地牢进度',6,y); y+=14;
  const ds=14, dg=4, dn=ROOMS.length;
  const dtotal=dn*ds+(dn-1)*dg, dsx=(HUDW-dtotal)/2;
  for(let i=0;i<dn;i++){
    const dx2=dsx+i*(ds+dg), dy2=y;
    const done=i<roomIdx, cur=i===roomIdx, boss=ROOMS[i].type==='boss', reward=ROOMS[i].type==='reward';
    ctx.save(); ctx.translate(dx2+ds/2,dy2+ds/2); ctx.rotate(Math.PI/4);
    if(done){ ctx.fillStyle=C_GOLD.lo; ctx.fillRect(-ds/2,-ds/2,ds,ds); ctx.fillStyle=C_GOLD.md; ctx.fillRect(-ds/2+2,-ds/2+2,ds-4,ds-4); }
    else if(cur){ const pulse=.85+.15*Math.sin(titleTime*5); ctx.shadowBlur=10*pulse; ctx.shadowColor=boss?C_GOLD.gl:C_JADE.gl; ctx.fillStyle=boss?C_GOLD.md:C_JADE.md; ctx.fillRect(-ds/2,-ds/2,ds,ds); ctx.shadowBlur=0; }
    else{ ctx.strokeStyle=reward?C_GOLD.lo:'rgba(80,60,120,.5)'; ctx.lineWidth=1.5; ctx.strokeRect(-ds/2,-ds/2,ds,ds); }
    ctx.restore();
  }
}

// ── 顶部状态条 ────────────────────────────────────────────────────
function drawTopBar(){
  const bx=GX1+4, by=GY1+6, bw=GX2-GX1-8, bh=12;
  ctx.fillStyle='rgba(0,0,0,.7)'; rRect(bx-2,by-2,bw+4,bh+4,5); ctx.fill();
  ctx.fillStyle='#040b06'; rRect(bx,by,bw,bh,4); ctx.fill();
  const pct=p.hp/p.maxHp;
  if(pct>0){
    const fg=ctx.createLinearGradient(bx,by,bx,by+bh);
    fg.addColorStop(0,pct>.4?C_JADE.hi:'#ff6050'); fg.addColorStop(.5,pct>.4?C_JADE.md:C_CRIM.md); fg.addColorStop(1,pct>.4?C_JADE.lo:C_CRIM.lo);
    ctx.fillStyle=fg; ctx.shadowBlur=8; ctx.shadowColor=pct>.4?C_JADE.gl:C_CRIM.gl; rRect(bx,by,bw*pct,bh,4); ctx.fill(); ctx.shadowBlur=0;
    ctx.fillStyle='rgba(255,255,255,.1)'; rRect(bx+1,by+1,bw*pct-2,bh*.4,2); ctx.fill();
  }
  ctx.strokeStyle=C_GOLD.md; ctx.lineWidth=1.5; ctx.shadowBlur=5; ctx.shadowColor=C_GOLD.gl; rRect(bx,by,bw,bh,4); ctx.stroke(); ctx.shadowBlur=0;
  // 金角
  [[bx,by,1,1],[bx+bw,by,-1,1]].forEach(([x,y2,fx,fy])=>{ctx.fillStyle=C_GOLD.md;ctx.beginPath();ctx.moveTo(x+fx*7,y2);ctx.lineTo(x,y2);ctx.lineTo(x,y2+fy*5);ctx.fill();});
  // 文字
  ctx.fillStyle='rgba(200,235,210,.8)'; ctx.font='bold 9px Microsoft YaHei'; ctx.textAlign='left'; ctx.textBaseline='middle';
  ctx.fillText(`气血  ${Math.ceil(p.hp)} / ${p.maxHp}`,bx+5,by+hh(bh));
  ctx.textBaseline='alphabetic';
}
function hh(h){ return h/2; }

// ── 升级面板 ──────────────────────────────────────────────────────
function drawUpgradePanel(){
  // 幽暗背景
  ctx.fillStyle='rgba(2,4,12,.80)'; ctx.fillRect(0,0,W,H);

  // 顶部标题区
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.shadowBlur=30; ctx.shadowColor=C_JADE.gl;
  ctx.fillStyle=C_JADE.hi; ctx.font='bold 22px Microsoft YaHei';
  ctx.fillText('境界突破 · 选择强化',W/2,H*.22);
  ctx.shadowBlur=0;
  ctx.fillStyle='rgba(100,180,140,.5)'; ctx.font='13px Microsoft YaHei';
  ctx.fillText('选择一项，继续修行之路',W/2,H*.22+28);

  // 卡片（扇形布局）
  // 先画非 hover 的，再画 hover 的（避免遮挡）
  const sorted=[...upCards].sort((a,b)=>a.hover-b.hover);
  for(const card of sorted) drawCard(card);
  ctx.textBaseline='alphabetic';
}

function drawCard(card){
  const {cx,cy,w,h,ang,u,hover}=card;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(ang);
  // hover 上移
  const liftY = hover ? -22 : 0;
  ctx.translate(0, liftY);

  const x2=-w/2, y2=-h/2;

  // 外阴影光晕
  if(hover){ ctx.shadowBlur=30; ctx.shadowColor=u.col.gl; }

  // 卡片背景
  ctx.fillStyle=hover?'rgba(10,20,28,.98)':'rgba(7,12,20,.94)';
  rRect(x2,y2,w,h,8); ctx.fill(); ctx.shadowBlur=0;

  // 顶部色带（渐变）
  const tg=ctx.createLinearGradient(x2,y2,x2,y2+40);
  tg.addColorStop(0,u.col.lo+'ee'); tg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=tg; rRect(x2,y2,w,40,{tl:8,tr:8,bl:0,br:0}); ctx.fill();

  // 边框
  ctx.strokeStyle=hover?u.col.hi:u.col.lo; ctx.lineWidth=hover?2:1.5;
  ctx.shadowBlur=hover?16:4; ctx.shadowColor=hover?u.col.gl:u.col.lo;
  rRect(x2,y2,w,h,8); ctx.stroke(); ctx.shadowBlur=0;

  // 稀有度圆标（左上角）
  const rarX=x2+12, rarY=y2+12, rarR=9;
  ctx.fillStyle=u.col.lo; ctx.beginPath(); ctx.arc(rarX,rarY,rarR,0,TAU); ctx.fill();
  ctx.strokeStyle=u.col.hi; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(rarX,rarY,rarR,0,TAU); ctx.stroke();
  ctx.fillStyle='#fff'; ctx.font='bold 9px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(u.rare,rarX,rarY+.5);

  // 像素图标区域（中上）
  const iBoxSz=64, iBoxX=x2+w/2-iBoxSz/2, iBoxY=y2+22;
  ctx.fillStyle='rgba(0,0,0,.5)'; rRect(iBoxX,iBoxY,iBoxSz,iBoxSz,6); ctx.fill();
  ctx.strokeStyle=u.col.lo+'88'; ctx.lineWidth=1; rRect(iBoxX,iBoxY,iBoxSz,iBoxSz,6); ctx.stroke();
  // 图标背景光
  const ibg=ctx.createRadialGradient(iBoxX+iBoxSz/2,iBoxY+iBoxSz/2,0,iBoxX+iBoxSz/2,iBoxY+iBoxSz/2,iBoxSz*.6);
  ibg.addColorStop(0,u.col.lo+'40'); ibg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=ibg; ctx.beginPath(); ctx.arc(iBoxX+iBoxSz/2,iBoxY+iBoxSz/2,iBoxSz*.6,0,TAU); ctx.fill();
  // 像素图标（5px/pixel → 10×10 grid = 50px，居中）
  const ps=5, poff=(iBoxSz-10*ps)/2;
  ctx.shadowBlur=hover?14:8; ctx.shadowColor=u.col.gl;
  drawPixIcon(iBoxX+poff, iBoxY+poff, ps, u.icon);
  ctx.shadowBlur=0;

  // 卡片名称
  ctx.fillStyle=hover?'#ffffff':u.col.hi; ctx.font=`bold ${hover?15:14}px Microsoft YaHei`;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.shadowBlur=hover?10:0; ctx.shadowColor=u.col.gl;
  ctx.fillText(u.name, 0, y2+108);
  ctx.shadowBlur=0;

  // 分隔线
  const lineG=ctx.createLinearGradient(x2+12,0,x2+w-12,0);
  lineG.addColorStop(0,'rgba(0,0,0,0)'); lineG.addColorStop(.5,u.col.md+'55'); lineG.addColorStop(1,'rgba(0,0,0,0)');
  ctx.strokeStyle=lineG; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(x2+14,y2+122); ctx.lineTo(x2+w-14,y2+122); ctx.stroke();

  // 描述
  ctx.fillStyle='rgba(160,145,185,.78)'; ctx.font='11px Microsoft YaHei';
  u.desc.split('\n').forEach((ln,li)=>ctx.fillText(ln,0,y2+144+li*18));

  // hover 金角
  if(hover){
    ctx.strokeStyle=C_GOLD.md+'88'; ctx.lineWidth=1.5;
    [[x2,y2,1,1],[x2+w,y2,-1,1],[x2,y2+h,1,-1],[x2+w,y2+h,-1,-1]].forEach(([bx2,by2,fx,fy])=>{
      ctx.beginPath(); ctx.moveTo(bx2+fx*14,by2); ctx.lineTo(bx2,by2); ctx.lineTo(bx2,by2+fy*14); ctx.stroke();
    });
  }
  ctx.restore();
}

// ── 标题 ─────────────────────────────────────────────────────────
function drawTitle(){
  ctx.fillStyle='#04020c'; ctx.fillRect(0,0,W,H);
  const bg=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,420);
  bg.addColorStop(0,'rgba(16,70,40,.22)'); bg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  ctx.save(); ctx.translate(W/2,H/2+20); ctx.rotate(titleTime*.06);
  for(let i=0;i<8;i++){ ctx.strokeStyle=`rgba(18,160,75,${.04+i*.01})`; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(0,0,55+i*30,i*Math.PI/8,i*Math.PI/8+Math.PI*1.5); ctx.stroke(); }
  for(let i=0;i<8;i++){ const a=i*TAU/8; ctx.fillStyle='rgba(40,150,75,.18)'; ctx.font='15px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(['☰','☷','☳','☴','☵','☲','☶','☱'][i],Math.cos(a)*185,Math.sin(a)*185); }
  ctx.restore();
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.shadowBlur=44; ctx.shadowColor=C_JADE.gl; ctx.fillStyle=C_JADE.hi; ctx.font='bold 58px Microsoft YaHei'; ctx.fillText('修仙地牢',W/2,H/2-42);
  ctx.shadowBlur=14; ctx.shadowColor=C_GOLD.gl; ctx.fillStyle=C_GOLD.hi; ctx.font='22px Microsoft YaHei'; ctx.fillText('炼道斩妖录',W/2,H/2+8); ctx.shadowBlur=0;
  ctx.fillStyle='rgba(90,190,130,.55)'; ctx.font='13px Microsoft YaHei'; ctx.fillText('WASD 移动 · 自动攻击 · 清空房间获得强化',W/2,H/2+78);
  ctx.fillStyle='rgba(60,140,90,.4)'; ctx.font='12px Microsoft YaHei'; ctx.fillText('飞剑 · 雷法 · 符咒  |  6间地牢  |  Boss终战',W/2,H/2+98);
  const ba=.5+.5*Math.sin(titleTime*3); ctx.fillStyle=`rgba(70,220,140,${ba})`; ctx.font='15px Microsoft YaHei'; ctx.fillText('按任意键 / 点击开始',W/2,H/2+132);
  ctx.textBaseline='alphabetic';
}

function drawOver(){
  ctx.fillStyle='#07010a'; ctx.fillRect(0,0,W,H);
  const rg=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,320); rg.addColorStop(0,'rgba(90,0,8,.32)'); rg.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.shadowBlur=38; ctx.shadowColor=C_CRIM.gl; ctx.fillStyle=C_CRIM.hi; ctx.font='bold 52px Microsoft YaHei'; ctx.fillText('道消形灭',W/2,H/2-48); ctx.shadowBlur=0;
  ctx.fillStyle='rgba(200,120,120,.8)'; ctx.font='17px Microsoft YaHei'; ctx.fillText(`突破至第 ${roomIdx+1} 间地牢 · 斩妖 ${totalKills} 只`,W/2,H/2+10);
  ctx.fillStyle='rgba(150,80,80,.55)'; ctx.font='13px Microsoft YaHei'; ctx.fillText('此番修行未竟，下一世再图大道',W/2,H/2+40);
  const ba=.4+.4*Math.sin(titleTime*3); ctx.fillStyle=`rgba(200,100,100,${ba})`; ctx.font='13px Microsoft YaHei'; ctx.fillText('按任意键重新开始',W/2,H/2+80);
  ctx.textBaseline='alphabetic';
}

function drawWin(){
  ctx.fillStyle='#040308'; ctx.fillRect(0,0,W,H);
  const vg=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,360); vg.addColorStop(0,'rgba(110,85,8,.32)'); vg.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
  ctx.save(); ctx.translate(W/2,H/2);
  for(let i=0;i<12;i++){ ctx.save(); ctx.rotate(titleTime*.4+i*TAU/12); const rg2=ctx.createLinearGradient(0,-40,0,-180); rg2.addColorStop(0,'rgba(170,130,18,.18)'); rg2.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=rg2; ctx.beginPath(); ctx.moveTo(-7,-40); ctx.lineTo(7,-40); ctx.lineTo(0,-180); ctx.closePath(); ctx.fill(); ctx.restore(); }
  ctx.restore();
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.shadowBlur=44; ctx.shadowColor=C_GOLD.gl; ctx.fillStyle=C_GOLD.hi; ctx.font='bold 52px Microsoft YaHei'; ctx.fillText('大道已成',W/2,H/2-48); ctx.shadowBlur=0;
  ctx.fillStyle='rgba(220,175,60,.85)'; ctx.font='17px Microsoft YaHei'; ctx.fillText(`六间地牢悉数平定 · 斩妖 ${totalKills} 只`,W/2,H/2+10);
  ctx.fillStyle='rgba(180,140,50,.6)'; ctx.font='13px Microsoft YaHei'; ctx.fillText('天道酬勤，修为大进，仙道可期',W/2,H/2+40);
  const ba=.4+.4*Math.sin(titleTime*3); ctx.fillStyle=`rgba(220,180,60,${ba})`; ctx.font='13px Microsoft YaHei'; ctx.fillText('按任意键再来一局',W/2,H/2+80);
  ctx.textBaseline='alphabetic';
}

// ── 工具：圆角矩形 ────────────────────────────────────────────────
function rRect(x,y,w,h,r){
  const rs=typeof r==='number'?{tl:r,tr:r,bl:r,br:r}:r;
  ctx.beginPath();
  ctx.moveTo(x+rs.tl,y); ctx.lineTo(x+w-rs.tr,y); ctx.arcTo(x+w,y,x+w,y+rs.tr,rs.tr);
  ctx.lineTo(x+w,y+h-rs.br); ctx.arcTo(x+w,y+h,x+w-rs.br,y+h,rs.br);
  ctx.lineTo(x+rs.bl,y+h); ctx.arcTo(x,y+h,x,y+h-rs.bl,rs.bl);
  ctx.lineTo(x,y+rs.tl); ctx.arcTo(x,y,x+rs.tl,y,rs.tl); ctx.closePath();
}

// ================================================================
//  启动
// ================================================================
requestAnimationFrame(update);
