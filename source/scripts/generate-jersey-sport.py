"""Original, single-color jersey vectors shared by SVG and canvas renderers."""
import json,math,pathlib,random,hashlib,zipfile
R=pathlib.Path(__file__).resolve().parents[1];out=R/'public/simulador/grafismos/sport';out.mkdir(parents=True,exist_ok=True)
patterns=[]
def add(n,f,shapes):
 i=len(patterns)+1;patterns.append(dict(id=f'jersey-{i:02d}',name=n,group='Jersey Sport',family=f,w=1,h=1,collection='jersey-sport',shapes=shapes))
def p(points,a=1):return ['p',a,*[round(c,2) for q in points for c in q]]
def r(x,y,w,h,a=1):return ['r',a,round(x,2),round(y,2),round(w,2),round(h,2)]
def c(x,y,r,a=1):return ['c',a,round(x,2),round(y,2),round(r,2)]
def s(d,w=8,a=1):return ['s',a,w,d]
def polyline(points):return 'M'+' L'.join(','.join(str(round(v,2)) for v in q) for q in points)
rng=random.Random(271114)
# 01–05: lines and bands, deliberately distinct silhouettes.
add('Sprint diagonal','Linhas e faixas',[p([(x-280,0),(x-215,0),(x+285,1000),(x+220,1000)],.9 if i%3==0 else .45) for i,x in enumerate(range(-500,1500,135))]+[p([(40,1000),(75,1000),(575,0),(540,0)],.9)])
add('Pulso duplo','Linhas e faixas',[s(f'M-80,{y} C260,{y-210} 640,{y+170} 1080,{y-90}',26 if i%2==0 else 7,.9 if i%2==0 else .6) for i,y in enumerate(range(-80,1350,120))])
add('Chevron precisão','Linhas e faixas',[p([(0,y-165),(500,y+100),(1000,y-165),(1000,y-120),(500,y+145),(0,y-120)],1 if i%3==0 else .45) for i,y in enumerate(range(-200,1300,150))])
add('Listras escalonadas','Linhas e faixas',[r(38+i*62,-80+(i%5)*45,10 if i%3 else 24,1160-(i%5)*45,.9 if i%3==0 else .5) for i in range(16)]+[r(0,680,1000,9,.75)])
add('Ataque lateral','Linhas e faixas',[p([(1000,-40),(650,-40),(390,1000),(680,1000)],.85),p([(600,-40),(560,-40),(280,1000),(320,1000)],.5),p([(0,550),(60,500),(245,1000),(185,1000)],.7)]+[p([(x,0),(x+9,0),(x+139,330),(x+130,330)],.55) for x in range(20,300,35)])
# 06–10: faceted and geometric surfaces.
sh=[]
for y in range(-1,5):
 for x in range(-1,5):
  xx=x*240+(y%2)*80;yy=y*245;sh.extend([p([(xx,yy),(xx+240,yy+15),(xx+80,yy+245)],rng.choice([.22,.45,.85])),p([(xx+240,yy+15),(xx+320,yy+245),(xx+80,yy+245)],rng.choice([.15,.35,.65]))])
add('Facetas angulares','Geométricos',sh)
add('Losangos vazados','Geométricos',[s(polyline([(x,y-110),(x+100,y),(x,y+110),(x-100,y),(x,y-110)]),12 if (ix+y//220)%3 else 26,.7) for y in range(-110,1300,220) for ix,x in enumerate(range(-100+(y//220%2)*100,1200,200))])
sh=[]
for row,y in enumerate(range(-80,1200,145)):
 for x in range(-100+(row%2)*84,1200,168):
  pts=[(x+78*math.cos(i*math.pi/3),y+78*math.sin(i*math.pi/3)) for i in range(6)];sh.append(s(polyline(pts+[pts[0]]),8,.65));sh.append(p([(x,y),(x+67,y-39),(x+67,y+39)],.25))
add('Hexa compacto','Geométricos',sh)
sh=[]
for row,y in enumerate(range(-100,1300,210)):
 for x in range(-100+(row%2)*105,1200,210):
  sh.extend([p([(x,y),(x+90,y-52),(x+180,y),(x+90,y+52)],.75),p([(x,y),(x+90,y+52),(x+90,y+156),(x,y+104)],.3),p([(x+90,y+52),(x+180,y),(x+180,y+104),(x+90,y+156)],.5)])
add('Prismas','Geométricos',sh)
add('Mosaico angular','Geométricos',[p([(x,y),(x+165,y+25),(x+115,y+195),(x-30,y+160)],rng.choice([.25,.55,.85])) for y in range(-180,1200,220) for x in range(-100+(y//220%2)*85,1200,190)])
# 11–15: curved flow and movement.
add('Topografia','Movimento',[s(polyline([(x,y+65*math.sin(x/175+y/350)+30*math.sin(x/83)) for x in range(-60,1081,30)]),5 if i%4 else 12,.48 if i%4 else .9) for i,y in enumerate(range(-170,1200,48))])
add('Fluxo vertical','Movimento',[s(f'M{x},-100 C{x+200},200 {x-150},550 {x+80},1100',6 if i%4 else 18,.45 if i%4 else .9) for i,x in enumerate(range(-180,1200,45))])
add('Ondas de velocidade','Movimento',[s(f'M-60,{y} C180,{y+145} 330,{y-160} 580,{y-25} S900,{y+180} 1080,{y-20}'.replace(' S', ' C'),10,.5) for y in []]+[s(f'M-80,{y} C250,{y+230} 510,{y-240} 1080,{y+90}',12 if i%3 else 48,.5 if i%3 else .8) for i,y in enumerate(range(-250,1300,105))])
sh=[]
for x in range(-100,1200,65):sh.append(s(f'M{x},-80 C{x+90},250 {x-110},630 {x+65},1080',4,.6))
for y in range(-100,1200,65):sh.append(s(f'M-80,{y} C240,{y+110} 620,{y-95} 1080,{y+45}',4,.6))
add('Malha em movimento','Movimento',sh)
sh=[]
for i in range(64):
 x=rng.randint(-150,1000);y=rng.randint(-150,1000);length=rng.randint(70,280);ww=rng.choice([4,8,16,25]);sh.append(p([(x,y),(x+ww,y-ww),(x+length,y+length-ww),(x+length-ww,y+length)],rng.choice([.25,.5,.9])))
add('Fragmentos dinâmicos','Movimento',sh)
# 16–20: lighter textures; monochrome alpha keeps palette control.
add('Retícula em rampa','Texturas',[c(x+(row%2)*29,y,2+16*(row/17)**1.7,.65) for row,y in enumerate(range(0,1050,60)) for x in range(-30,1050,60)])
add('Pixels em transição','Texturas',[r(x+5,y+5,30 if (row+col)%4 else 40,30 if (row+col)%4 else 40,.35 if row<8 else .75) for row,y in enumerate(range(0,1000,50)) for col,x in enumerate(range(0,1000,50)) if rng.random()<.12+row*.038])
add('Triângulos discretos','Texturas',[p([(x,y),(x+34,y+52),(x-34,y+52)],.18 if (i+j)%3 else .48) for j,y in enumerate(range(-20,1100,88)) for i,x in enumerate(range(-40+(j%2)*44,1100,88))])
add('Micro diagonal','Texturas',[s(f'M{x},-30 L{x+650},1030',3,.3) for x in range(-650,1100,25)]+[s(f'M{x},-30 L{x+650},1030',9,.42) for x in range(-650,1100,200)])
add('Pontos orbitais','Texturas',[c(30+i*55+23*math.sin(j*.75),j*57,3+(i+j)%4,.45 if (i+j)%4 else .8) for j in range(19) for i in range(-1,20)])
# 21–25: original retro geometry, without club identities.
sh=[]
for j,y in enumerate(range(-200,1250,250)):
 for x in range(-150+(j%2)*150,1300,300):
  sh.append(p([(x,y-115),(x+135,y),(x,y+115),(x-135,y)],.28 if j%2 else .62))
for a in range(-1000,2000,250):
 for k in range(0,1100,42):sh.append(s(f'M{k},{k+a} L{k+20},{k+a+20}',3,.85));sh.append(s(f'M{k},{1000-k+a} L{k+20},{980-k+a}',3,.85))
add('Argyle esportivo','Retrô',sh)
add('Ritmo 90','Retrô',[p([(x,y),(x+90,y+20),(x+40,y+68),(x+155,y+95),(x+205,y+185),(x+80,y+154),(x+70,y+108),(x-20,y+82)],rng.choice([.35,.65,1])) for y in range(-120,1200,240) for x in range(-100+(y//240%2)*120,1200,260)])
add('Xadrez recortado','Retrô',[p([(x,y),(x+138,y),(x+104,y+140),(x-34,y+140)],.4 if j%3 else .85) for j,y in enumerate(range(-140,1200,150)) for i,x in enumerate(range(-180+(j%2)*72,1200,150)) if (i+j)%2==0])
add('Fitas vintage','Retrô',[s(f'M-100,{y} C250,{y-180} 700,{y+200} 1100,{y-80}',42 if i%3==0 else 12,.7 if i%3==0 else .35) for i,y in enumerate(range(-200,1400,98))])
add('Blocos de quadra','Retrô',[r(x,y,ww,hh,a) for x,y,ww,hh,a in [(0,0,290,600,.4),(340,0,95,1000,.85),(485,0,22,1000,.6),(555,0,445,240,.25),(555,290,445,50,.7),(555,390,445,310,.4),(0,650,290,350,.75),(555,750,445,250,.85)]])
# 26–30: technical linework and texture.
sh=[]
for j in range(14):
 y=j*80-30;x=(j%4)*120;d=f'M-30,{y} L{x+100},{y} L{x+160},{y+60} L{x+330},{y+60} L{x+410},{y-20} L1050,{y-20}';sh.append(s(d,5,.65));sh.append(c(x+330,y+60,11,.65))
add('Circuito linear','Técnicos',sh)
add('Trama hexagonal','Técnicos',[s(polyline([(x+44*math.cos(k*math.pi/3),y+44*math.sin(k*math.pi/3)) for k in range(7)]),3,.38) for j,y in enumerate(range(-30,1100,77)) for x in range(-60+(j%2)*45,1100,90)])
add('Grade em perspectiva','Técnicos',[s(f'M{x},1000 L500,-180',5,.52) for x in range(-1600,2600,145)]+[s(f'M-40,{y} Q500,{y-85} 1040,{y}',4,.4) for y in [10,80,160,255,365,490,635,800,990]])
add('Escamas direcionais','Técnicos',[s(f'M{x-85},{y} Q{x},{y+115} {x+85},{y}',8,.32 if (j+i)%3 else .7) for j,y in enumerate(range(-100,1150,115)) for i,x in enumerate(range(-80+(j%2)*90,1150,180))])
add('Pulso angular','Técnicos',[s(polyline([(0,y),(230,y),(350,y+100),(500,y-95),(650,y+65),(770,y),(1000,y)]),6 if i%3 else 18,.4 if i%3 else .85) for i,y in enumerate(range(-120,1250,96))])

def num(x):return str(round(x,2))
def svg(g):
 tags=[]
 for sh in g['shapes']:
  kind,a,*v=sh;common=f' opacity="{a}"'
  if kind=='p':tags.append('<polygon points="'+' '.join(num(v[i])+','+num(v[i+1]) for i in range(0,len(v),2))+'"'+common+'/>')
  if kind=='r':tags.append(f'<rect x="{v[0]}" y="{v[1]}" width="{v[2]}" height="{v[3]}"'+common+'/>')
  if kind=='c':tags.append(f'<circle cx="{v[0]}" cy="{v[1]}" r="{v[2]}"'+common+'/>')
  if kind=='s':tags.append(f'<path d="{v[1]}" fill="none" stroke="#000000" stroke-width="{v[0]}" stroke-linecap="round" stroke-linejoin="round"'+common+'/>')
 return '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000" fill="#000000"><title>'+g['name']+'</title>'+''.join(tags)+'</svg>'
meta=[];scenes={};audit=[]
for g in patterns:
 source=svg(g);filename=g['id']+'.svg';(out/filename).write_text(source);meta.append({k:v for k,v in g.items() if k!='shapes'});scenes[g['id']]=g['shapes'];audit.append({'id':g['id'],'name':g['name'],'family':g['family'],'shapes':len(g['shapes']),'sha256':hashlib.sha256(source.encode()).hexdigest()})
renderer=r'''
const commands=new Map();
function trace(ctx,d){let list=commands.get(d);if(!list){const tokens=d.match(/[MLCQZ]|-?(?:\d+\.?\d*|\.\d+)/g)||[],arity={M:2,L:2,C:6,Q:4,Z:0};list=[];for(let i=0;i<tokens.length;){const op=tokens[i++],n=arity[op];if(n===undefined)throw Error('Comando vetorial inválido');list.push([op,...tokens.slice(i,i+n).map(Number)]);i+=n;}commands.set(d,list);}for(const [op,...v]of list){if(op==='M')ctx.moveTo(...v);else if(op==='L')ctx.lineTo(...v);else if(op==='C')ctx.bezierCurveTo(...v);else if(op==='Q')ctx.quadraticCurveTo(...v);else ctx.closePath();}}
export function drawSportGraphic(ctx,id,w,h){const shapes=SCENES[id];if(!shapes)return false;ctx.save();ctx.translate(-w/2,-h/2);ctx.scale(w/1000,h/1000);const alpha=ctx.globalAlpha;ctx.strokeStyle=ctx.fillStyle;ctx.lineJoin='round';ctx.lineCap='round';for(const[k,a,...v]of shapes){ctx.globalAlpha=alpha*a;ctx.beginPath();if(k==='p'){ctx.moveTo(v[0],v[1]);for(let i=2;i<v.length;i+=2)ctx.lineTo(v[i],v[i+1]);ctx.closePath();ctx.fill();}else if(k==='r')ctx.fillRect(...v);else if(k==='c'){ctx.arc(v[0],v[1],v[2],0,Math.PI*2);ctx.fill();}else{ctx.lineWidth=v[0];trace(ctx,v[1]);ctx.stroke();}}ctx.restore();return true;}
'''
# Python raw strings need a single backslash in the JavaScript regular expression.
renderer=renderer.replace('\\\\d','\\d').replace('\\\\.','\\.')
(R/'public/simulador/sport-graphics.js').write_text('// Original Meinerz Jersey Sport collection. Generated by scripts/generate-jersey-sport.py.\nexport const SPORT_GRAPHICS='+json.dumps(meta,ensure_ascii=False,separators=(',',':'))+';\nconst SCENES='+json.dumps(scenes,ensure_ascii=False,separators=(',',':'))+';\n'+renderer)
(R/'scripts/jersey-sport-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
with zipfile.ZipFile(R/'public/simulador/grafismos/Meinerz-Jersey-Sport-30-SVG.zip','w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 z.writestr('LEIA-ME.txt','MEINERZ JERSEY SPORT — 30 GRAFISMOS ORIGINAIS\n\nSVGs vetoriais com fundo transparente e uma cor editável. As transparências são intencionais. Preserve a proporção 1:1 ao aplicar.\n\nColeções: Linhas e faixas, Geométricos, Movimento, Texturas, Retrô e Técnicos.\n')
 for g in patterns:z.write(out/(g['id']+'.svg'),g['family']+'/'+g['name']+'.svg')
print('Created',len(patterns),'original graphics; vector commands',sum(len(g['shapes']) for g in patterns))
# A reusable, vector contact sheet for browsing the full collection.
parts=['<svg xmlns="http://www.w3.org/2000/svg" width="1640" height="2400" viewBox="0 0 1640 2400"><rect width="1640" height="2400" fill="#f3f1eb"/><text x="60" y="80" font-family="DejaVu Sans,Arial,sans-serif" font-size="31" font-weight="bold" fill="#182c34">MEINERZ UNIFORM STUDIO</text><text x="60" y="137" font-family="DejaVu Sans,Arial,sans-serif" font-size="23" fill="#49606a">JERSEY SPORT · 30 GRAFISMOS ORIGINAIS · 6 FAMÍLIAS</text>']
for index,g in enumerate(patterns):
 row,col=divmod(index,5);xx=60+col*306;yy=240+row*350
 if col==0:parts.append(f'<text x="60" y="{yy-20}" font-family="DejaVu Sans,Arial,sans-serif" font-size="20" font-weight="bold" fill="#243d49">{g["family"].upper()}</text>')
 parts.append(f'<rect x="{xx}" y="{yy}" width="286" height="300" rx="12" fill="#ffffff" stroke="#d8d9d2"/><g transform="translate({xx+18},{yy+12}) scale(.25)"><defs><clipPath id="clip-{index}"><rect width="1000" height="1000"/></clipPath></defs><g clip-path="url(#clip-{index})" fill="#196a85">')
 body=svg(g).split('>',1)[1].rsplit('</svg>',1)[0].replace('#000000','#196a85');parts.append(body+'</g></g>');parts.append(f'<text x="{xx+15}" y="{yy+282}" font-family="DejaVu Sans,Arial,sans-serif" font-size="16" fill="#243d49">{index+1:02d} · {g["name"]}</text>')
parts.append('<text x="60" y="2370" font-family="DejaVu Sans,Arial,sans-serif" font-size="18" fill="#49606a">SVGs com fundo transparente · cor ajustável no simulador · proporção original preservada</text></svg>')
(R/'public/simulador/grafismos/Meinerz-Jersey-Sport-Catalogo.svg').write_text(''.join(parts))
