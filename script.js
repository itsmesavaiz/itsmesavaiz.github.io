(function(){
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* nav border on scroll */
  var nav=document.getElementById('nav');
  addEventListener('scroll',function(){nav.classList.toggle('scrolled',scrollY>10)},{passive:true});

  /* stat counters (final values are in the HTML; this only replays them) */
  if(!reduce){document.querySelectorAll('[data-count]').forEach(function(el){
    var end=+el.dataset.count,suf=el.dataset.suffix||'',t0=null;
    function f(t){if(!t0)t0=t;var p=Math.min((t-t0)/1400,1);p=1-Math.pow(1-p,3);el.textContent=Math.round(end*p)+suf;if(p<1)requestAnimationFrame(f)}
    requestAnimationFrame(f);
  })}

  /* gentle slide-up for sections below the fold (always visible, only moves) */
  if(!reduce && 'IntersectionObserver' in window){
    var els=[].slice.call(document.querySelectorAll('.reveal'));
    els.forEach(function(el){if(el.getBoundingClientRect().top>innerHeight)el.classList.add('below')});
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.remove('below');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
    els.forEach(function(el){io.observe(el)});
  }

  /* flow chart lanes */
  var lanes=document.querySelectorAll('#lanes .lane'),btns=document.querySelectorAll('.lane-btns button'),cur=1,timers=[];
  function play(i){
    cur=i;timers.forEach(clearTimeout);timers=[];
    document.querySelectorAll('#lanes .node').forEach(function(n){n.classList.remove('on')});
    btns.forEach(function(b){b.setAttribute('aria-pressed',b.dataset.lane==i?'true':'false')});
    lanes[i].querySelectorAll('.node').forEach(function(n,k){timers.push(setTimeout(function(){n.classList.add('on')},reduce?0:k*450))});
  }
  btns.forEach(function(b){b.addEventListener('click',function(){auto=false;play(+b.dataset.lane)})});
  var auto=true;play(1);
  if(!reduce)setInterval(function(){if(auto)play((cur+1)%3)},4200);

  /* copy email */
  document.getElementById('copy').addEventListener('click',function(){
    var out=document.getElementById('copied');
    try{navigator.clipboard.writeText('savaizwajid@gmail.com').then(function(){out.textContent='Copied'},function(){out.textContent='Select the address to copy'})}
    catch(e){out.textContent='Select the address to copy'}
  });

  /* ---------- hand landmark animation (21 points, MediaPipe order) ---------- */
  var cv=document.getElementById('hand'),ctx=cv.getContext('2d'),W=cv.width,H=cv.height,letterEl=document.getElementById('letter');
  var MCP={i:[.40,.53],m:[.50,.50],r:[.60,.52],p:[.69,.58]};
  var LEN={i:[.13,.085,.07],m:[.145,.09,.072],r:[.13,.085,.068],p:[.10,.068,.06]};
  function ext(k,a){var o=[MCP[k]],x=MCP[k][0],y=MCP[k][1];LEN[k].forEach(function(l){x+=Math.sin(a)*l;y-=Math.cos(a)*l;o.push([x,y])});return o}
  function curl(k){var m=MCP[k];return[m,[m[0]-.005,m[1]-.075],[m[0]+.005,m[1]-.015],[m[0]+.01,m[1]+.04]]}
  var TH={
    side:[[.40,.84],[.31,.73],[.29,.62],[.30,.53]],
    across:[[.40,.84],[.35,.74],[.45,.71],[.54,.69]],
    out:[[.40,.84],[.29,.77],[.19,.74],[.09,.72]]
  };
  function pose(th,f){var p=[[.52,.93]];TH[th].forEach(function(q){p.push(q)});['i','m','r','p'].forEach(function(k){p=p.concat(f[k])});return p}
  var C=curl;
  var POSES=[
    {l:'L',p:pose('out',{i:ext('i',0),m:C('m'),r:C('r'),p:C('p')})},
    {l:'V',p:pose('across',{i:ext('i',-.22),m:ext('m',.16),r:C('r'),p:C('p')})},
    {l:'W',p:pose('across',{i:ext('i',-.26),m:ext('m',0),r:ext('r',.24),p:C('p')})},
    {l:'Y',p:pose('out',{i:C('i'),m:C('m'),r:C('r'),p:ext('p',.42)})},
    {l:'B',p:pose('across',{i:ext('i',-.05),m:ext('m',0),r:ext('r',.05),p:ext('p',.11)})},
    {l:'A',p:pose('side',{i:C('i'),m:C('m'),r:C('r'),p:C('p')})}
  ];
  var BONES=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[0,17],[17,18],[18,19],[19,20]];
  var TIPS={4:1,8:1,12:1,16:1,20:1};
  var idx=0,from=POSES[0].p,to=POSES[0].p,t0=0,HOLD=1700,MOVE=650;
  function ease(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2}
  function draw(pts,time){
    ctx.clearRect(0,0,W,H);
    /* scan line */
    var sy=((time/18)%(H+40))-20;
    var g=ctx.createLinearGradient(0,sy-30,0,sy);g.addColorStop(0,'rgba(95,196,184,0)');g.addColorStop(1,'rgba(95,196,184,.18)');
    ctx.fillStyle=g;ctx.fillRect(0,sy-30,W,30);
    /* bounding box */
    var xs=pts.map(function(p){return p[0]*W}),ys=pts.map(function(p){return p[1]*H});
    var x0=Math.min.apply(0,xs)-14,x1=Math.max.apply(0,xs)+14,y0=Math.min.apply(0,ys)-14,y1=Math.max.apply(0,ys)+14,c=14;
    ctx.strokeStyle='rgba(95,196,184,.7)';ctx.lineWidth=2;ctx.beginPath();
    [[x0,y0,1,1],[x1,y0,-1,1],[x0,y1,1,-1],[x1,y1,-1,-1]].forEach(function(q){ctx.moveTo(q[0],q[1]+c*q[3]);ctx.lineTo(q[0],q[1]);ctx.lineTo(q[0]+c*q[2],q[1])});
    ctx.stroke();
    /* bones */
    ctx.lineCap='round';ctx.lineWidth=4;ctx.strokeStyle='rgba(240,164,70,.9)';
    BONES.forEach(function(b){ctx.beginPath();ctx.moveTo(pts[b[0]][0]*W,pts[b[0]][1]*H);ctx.lineTo(pts[b[1]][0]*W,pts[b[1]][1]*H);ctx.stroke()});
    /* joints */
    pts.forEach(function(p,i){
      var x=p[0]*W,y=p[1]*H;
      if(TIPS[i]){ctx.fillStyle='rgba(95,196,184,.22)';ctx.beginPath();ctx.arc(x,y,12,0,7);ctx.fill()}
      ctx.fillStyle=TIPS[i]?'#5fc4b8':'#ece6da';ctx.beginPath();ctx.arc(x,y,TIPS[i]?6:4.5,0,7);ctx.fill();
    });
  }
  function frame(time){
    if(!t0)t0=time;var el=time-t0,pts;
    if(el<MOVE){var k=ease(el/MOVE);pts=from.map(function(p,i){return[p[0]+(to[i][0]-p[0])*k,p[1]+(to[i][1]-p[1])*k]})}
    else pts=to;
    if(el>MOVE+HOLD){from=to;idx=(idx+1)%POSES.length;to=POSES[idx].p;t0=time;letterEl.textContent=POSES[idx].l}
    draw(pts,time);
    requestAnimationFrame(frame);
  }
  if(reduce){draw(POSES[0].p,0)}else requestAnimationFrame(frame);
})();
