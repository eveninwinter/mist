(()=>{
    const root=document.getElementById('mist-living-water'),screen=root.querySelector('.alw-screen'),canvas=root.querySelector('canvas'),photo=root.querySelector('img');
    const enter=root.querySelector('.alw-enter');
    const postNative=action=>{window.webkit?.messageHandlers?.mistSplash?.postMessage(action)};
    const viewport=screen.getBoundingClientRect();
    const W=390,H=Math.round(W*viewport.height/viewport.width),S=Math.min(2,window.devicePixelRatio||2),NX=130,NY=Math.round(NX*H/W),COUNT=NX*NY;
    const aspect=H/W;
    let backdrop;
    function preparePhoto(){
      const src=photoSource||photo;
      const pw=src.naturalWidth||src.width,ph=src.naturalHeight||src.height;
      if(!pw||!ph)throw Error('photo not decoded');
      backdrop=make(W*S,H*S);const b=backdrop.getContext('2d'),ratio=(W/H)/(pw/ph);
      const warp=(p,scale)=>p+(scale-1)*Math.sin(p*Math.PI*2)/(Math.PI*2);
      if(ratio<1){for(let x=0;x<backdrop.width;x++){const a=warp(x/backdrop.width,ratio),z=warp((x+1)/backdrop.width,ratio);b.drawImage(src,a*pw,0,(z-a)*pw,ph,x,0,1,backdrop.height)}}
      else{for(let y=0;y<backdrop.height;y++){const a=warp(y/backdrop.height,1/ratio),z=warp((y+1)/backdrop.height,1/ratio);b.drawImage(src,0,a*ph,pw,(z-a)*ph,0,y,backdrop.width,1)}}
      if(b.getImageData(backdrop.width>>1,backdrop.height>>1,1,1).data[3]===0)
        throw Error('photo drew nothing');
      const edge=b.createRadialGradient(backdrop.width*.52,backdrop.height*.45,backdrop.width*.12,backdrop.width*.5,backdrop.height*.5,backdrop.height*.63);
      edge.addColorStop(0,'rgba(7,38,87,0)');edge.addColorStop(.55,'rgba(7,38,87,.025)');edge.addColorStop(1,'rgba(7,38,87,.24)');b.fillStyle=edge;b.fillRect(0,0,backdrop.width,backdrop.height);
      const sides=b.createLinearGradient(0,0,backdrop.width,0);sides.addColorStop(0,'rgba(5,33,83,.20)');sides.addColorStop(.22,'rgba(5,33,83,0)');sides.addColorStop(.78,'rgba(5,33,83,0)');sides.addColorStop(1,'rgba(5,33,83,.24)');b.fillStyle=sides;b.fillRect(0,0,backdrop.width,backdrop.height);
    }
    function drawPhoto(ctx){ctx.drawImage(backdrop,0,0,W,H)}
    canvas.width=W*S;canvas.height=H*S;
    const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const make=(w,h)=>{const a=document.createElement('canvas');a.width=w;a.height=h;return a};
    const textCanvas=make(W*S,H*S),tctx=textCanvas.getContext('2d');tctx.scale(S,S);
    const quotes=window.MistSplashQuotes;
    let textDirty=true;
    function wrapText(text,width){
      const result=[];
      for(const paragraph of text.split('\n')){
        const paragraphStart=result.length;let line='';
        const tokens=paragraph.match(/[A-Za-z0-9][A-Za-z0-9'’.,!?;:-]*\s*|\s+|[\s\S]/g)||[];
        for(const token of tokens){if(line&&tctx.measureText(line+token).width>width){result.push(line.trimEnd());line=''}line+=token}
        if(line)result.push(line.trimEnd());
        if(!/[A-Za-z]/.test(paragraph)&&result.length-paragraphStart>1){const last=result.length-1;if(result[last].length<4){const joined=result[last-1]+result[last],cut=Math.ceil(joined.length/2);result[last-1]=joined.slice(0,cut);result[last]=joined.slice(cut)}}
      }return result;
    }
    function paintText(){
      tctx.clearRect(0,0,W,H);tctx.fillStyle='#fff';tctx.textBaseline='top';tctx.textAlign='left';tctx.font='300 11px "Mist Serif",serif';tctx.shadowColor='rgba(13,48,87,.25)';tctx.shadowBlur=1.4;
      const stage=screen.getBoundingClientRect(),intro=root.querySelector('.alw-intro').getBoundingClientRect(),entry=enter.getBoundingClientRect(),ratio=W/stage.width;
      const top=(intro.bottom-stage.top)*ratio+30,bottom=(entry.top-stage.top)*ratio-20;
      const settings=[{x:36,w:238},{x:146,w:212},{x:42,w:265},{x:147,w:210},{x:47,w:286},{x:203,w:152},{x:43,w:264}];
      const blocks=quotes.map((q,i)=>{const slot=settings[i%settings.length];return{...slot,lines:wrapText(q,slot.w)}});
      const lineHeight=17.5,logoHeight=39,total=blocks.reduce((n,b)=>n+b.lines.length*lineHeight,0)+logoHeight;
      const gap=Math.max(3,(bottom-top-total)/Math.max(1,blocks.length));let y=top;
      const compact=bottom-top<total+21;
      const bounds=[];
      if(compact){
        const split=Math.max(1,(W-62)/2),columns=[top,top];
        blocks.forEach((b,i)=>{const col=i%2,x=24+col*(split+14),ls=wrapText(quotes[i],split-5);ls.forEach((line,j)=>tctx.fillText(line,x,columns[col]+j*15));bounds.push({x,y:columns[col],width:split,height:ls.length*15});columns[col]+=ls.length*15+7});
      }else blocks.forEach((b,i)=>{
        b.lines.forEach((line,j)=>tctx.fillText(line,b.x,y+j*lineHeight));bounds.push({x:b.x,y,width:b.w,height:b.lines.length*lineHeight});y+=b.lines.length*lineHeight+gap;
        if(i===2){tctx.textAlign='center';tctx.font='400 35px "Mist Script",cursive';tctx.fillText('Mist',W*.51,y);tctx.textAlign='left';tctx.font='300 11px "Mist Serif",serif';y+=logoHeight+gap}
      });
      tctx.shadowBlur=0;textDirty=true;root.dataset.quoteLayout=JSON.stringify(bounds);root.dataset.quoteCount=String(quotes.length);root.querySelector('.alw-access').textContent=quotes.join('\n\n');
    }
    const mask=make(W,H),mc=mask.getContext('2d'),mi=mc.createImageData(W,H),amount=new Float32Array(W*H),times=new Float64Array(W*H);
    for(let i=0;i<W*H;i++){mi.data[i*4]=255;mi.data[i*4+1]=255;mi.data[i*4+2]=255}
    const water=make(NX,NY),wc=water.getContext('2d'),wi=wc.createImageData(NX,NY);
    let height=new Float32Array(COUNT),prior=new Float32Array(COUNT),next=new Float32Array(COUNT);
    const gradientX=new Float32Array(COUNT),gradientY=new Float32Array(COUNT);
    let active=null,last=null,prevPoint=null,lastMove=0,radius=15,pathLength=0,entered=false,previous=0,render=null,clock=0,nextRain=0,nativeActive=true,stopped=false,raf=0,releaseRenderer=()=>{};
    let photoSource=null,revealed=false;
    const reveal=()=>{if(revealed)return;revealed=true;root.style.opacity='1'};
    setTimeout(reveal,4000);   // 保险：万一一帧都没画出来，也别让整页永远隐身
    let rain=[];
    const rainUniform=new Float32Array(8);
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    function remaining(i,now){const p=clamp((now-times[i]-3200)/10500,0,1);return amount[i]*(1-p*p*(3-2*p))}
    function dab(p,r,angle,now,power){const ca=Math.cos(angle),sa=Math.sin(angle),rr=r*(.96+.04*Math.sin(p.x*.07+p.y*.019));for(let y=Math.max(0,Math.floor(p.y-rr));y<Math.min(H,p.y+rr);y++)for(let x=Math.max(0,Math.floor(p.x-rr));x<Math.min(W,p.x+rr);x++){
      const dx=x-p.x,dy=y-p.y,cross=-dx*sa+dy*ca,along=dx*ca+dy*sa,d=Math.sqrt((along*along*.9+cross*cross)/(rr*rr));if(d>=1)continue;
      const feather=clamp((1-d)/.21,0,1),variation=.72+.15*Math.sin(x*.073+y*.031)+.1*Math.sin(x*.041-y*.063),deposit=feather*variation*power,i=y*W+x;
      const old=remaining(i,now);amount[i]=1-(1-old)*(1-deposit);times[i]=now;
    }}
    function disturb(x,y,power=1){if(reduce)return;const cx=x/W*NX,cy=y/H*NY,rr=3.2;for(let j=Math.max(1,Math.floor(cy-rr*2));j<Math.min(NY-1,cy+rr*2);j++)for(let i=Math.max(1,Math.floor(cx-rr*2));i<Math.min(NX-1,cx+rr*2);i++){const dx=i-cx,dy=j-cy,d=(dx*dx+dy*dy)/(rr*rr);if(d>4)continue;const impulse=Math.exp(-d*1.8)*power;const k=j*NX+i;height[k]=clamp(height[k]+impulse,-4,4);prior[k]=clamp(prior[k]+impulse*.65,-4,4)}}
    function drag(a,b,now){const distance=Math.hypot(b.x-a.x,b.y-a.y),dt=Math.max(8,now-lastMove),speed=distance/dt*1000,target=clamp(35-speed*.026,14,35),oldRadius=radius;radius+=(target-radius)*.35;const angle=Math.atan2(b.y-a.y,b.x-a.x),n=Math.max(1,Math.ceil(distance/3));
      for(let i=1;i<=n;i++){const t=i/n,p={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t},r=(oldRadius+(radius-oldRadius)*t)*clamp((pathLength+distance*t)/24,.38,1);dab(p,r,angle,now,.10);if(i%2===0||i===n)disturb(p.x,p.y,.22+clamp(speed/1500,0,.22))}pathLength+=distance;lastMove=now;
    }
    const point=e=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}};
    canvas.addEventListener('pointerdown',e=>{if(active!==null||entered)return;active=e.pointerId;last=point(e);prevPoint=last;lastMove=performance.now();pathLength=0;radius=16;try{canvas.setPointerCapture(e.pointerId)}catch(_){}dab(last,9,0,lastMove,.16);disturb(last.x,last.y,.65)});
    canvas.addEventListener('pointermove',e=>{if(active!==e.pointerId||!last||entered)return;const now=performance.now(),p=point(e);prevPoint=last;drag(last,p,now);last=p;root.dataset.swipes=String((Number(root.dataset.swipes)||0)+1)});
    const finish=e=>{if(active!==e.pointerId)return;if(last&&prevPoint){const dx=last.x-prevPoint.x,dy=last.y-prevPoint.y,d=Math.hypot(dx,dy);if(d>1){const a=Math.atan2(dy,dx),now=performance.now();for(let i=1;i<=4;i++)dab({x:last.x+dx/d*i,y:last.y+dy/d*i},radius*(1-i/6),a,now,.075)}}active=null;last=null};
    ['pointerup','pointercancel','lostpointercapture'].forEach(k=>canvas.addEventListener(k,finish));
    enter.addEventListener('click',()=>{if(entered)return;entered=true;active=null;last=null;root.dataset.enterRequested='true';postNative('enter');window.dispatchEvent(new CustomEvent('mist:enter'))});
    function updateWater(){if(!reduce){for(let step=0;step<2;step++){
      for(let y=1;y<NY-1;y++)for(let x=1;x<NX-1;x++){const i=y*NX+x,h=height[i],lap=height[i-1]+height[i+1]+height[i-NX]+height[i+NX]-4*h;next[i]=clamp((2*h-prior[i]+.23*lap)*.985,-4,4)}const tmp=prior;prior=height;height=next;next=tmp;
    }}
      for(let y=0;y<NY;y++)for(let x=0;x<NX;x++){const i=y*NX+x,gx=(height[y*NX+Math.min(NX-1,x+1)]-height[y*NX+Math.max(0,x-1)])*.7,gy=(height[Math.min(NY-1,y+1)*NX+x]-height[Math.max(0,y-1)*NX+x])*.7;gradientX[i]=gx;gradientY[i]=gy;wi.data[i*4]=clamp(128+gx*100,0,255);wi.data[i*4+1]=clamp(128+gy*100,0,255);wi.data[i*4+2]=128;wi.data[i*4+3]=255}wc.putImageData(wi,0,0)
    }
    function updateRain(now){rain=rain.filter(q=>now-q.born<6.8);if(!reduce&&now>=nextRain&&rain.length<2){const count=rain.length===0&&Math.random()<.43?2:1;for(let k=0;k<count;k++)rain.push({x:.035+Math.random()*.93,y:.035+Math.random()*.93,born:now-k*.12,power:.8+Math.random()*.3});nextRain=now+3.4+Math.random()*3.1}rainUniform.fill(0);rain.forEach((q,i)=>{rainUniform.set([q.x,q.y,now-q.born,q.power],i*4)});root.dataset.rainCount=String(rain.length)}
    const vertex='attribute vec2 a;varying vec2 uv;void main(){uv=vec2((a.x+1.)*.5,(1.-a.y)*.5);gl_Position=vec4(a,0.,1.);}';
    const fragment=`precision highp float;varying vec2 uv;uniform sampler2D photograph;uniform sampler2D lettering;uniform sampler2D cleared;uniform sampler2D water;uniform vec4 rain[2];uniform float time;uniform float motion;uniform float aspect;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}vec3 photoAt(vec2 p){return texture2D(photograph,clamp(p,.002,.998)).rgb;}
    void main(){vec2 p=uv;vec2 slope=(texture2D(water,p).rg-vec2(128./255.))*2.55;vec2 dis=slope*vec2(.035,.035/aspect)*motion;float light=dot(slope,vec2(-.42,-.78))*.30*motion;
      for(int i=0;i<2;i++){vec4 q=rain[i];if(q.w>0.){vec2 delta=(p-q.xy)*vec2(1.,aspect);float dist=length(delta),ang=atan(delta.y,delta.x),phase=dist-q.z*.075+.003*sin(ang*3.);float env=exp(-pow(phase/.049,2.))*exp(-q.z*.37)*smoothstep(0.,.25,q.z)*(1.-smoothstep(5.8,6.8,q.z));float wave=sin(phase*195.)*env*q.w;vec2 normal=delta/max(dist,.003);dis+=normal*vec2(.018,.018/aspect)*wave*motion;light+=dot(normal,vec2(-.447,-.894))*wave*.15*motion;}}
      vec2 p2=clamp(p+dis,.002,.998);float a=texture2D(cleared,p2).a;float gx=texture2D(cleared,p2+vec2(.003,0.)).a-texture2D(cleared,p2-vec2(.003,0.)).a;float gy=texture2D(cleared,p2+vec2(0.,.002)).a-texture2D(cleared,p2-vec2(0.,.002)).a;
      vec2 q=p2+vec2(gx,gy)*.003;vec3 original=photoAt(q),blur=(photoAt(q+vec2(.015,0.))+photoAt(q-vec2(.015,0.))+photoAt(q+vec2(0.,.012))+photoAt(q-vec2(0.,.012))+original*2.)/6.;
      float n=noise(p*vec2(5.,7.)+vec2(time*.006*motion,0.))*.6+noise(p*vec2(12.,17.))*.4;vec3 fog=mix(mix(original,blur,.18),vec3(.72,.84,.96),.03+n*.06);float ink=.32+.36*a;vec3 clean=mix(blur,vec3(.035,.130,.380),ink);vec4 text=texture2D(lettering,p2);clean=mix(clean,text.rgb,text.a);vec3 color=mix(fog,clean,a)+light+(gx+gy)*.026;gl_FragColor=vec4(color,1.);
    }`;
    function setup(){preparePhoto();let gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});if(gl){try{
      const shader=(kind,code)=>{const s=gl.createShader(kind);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s},program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
      const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const attr=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);
      const textures=[],sources=[backdrop,textCanvas,mask,water],names=['photograph','lettering','cleared','water'];sources.forEach((src,i)=>{const t=gl.createTexture();textures.push(t);gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);gl.uniform1i(gl.getUniformLocation(program,names[i]),i)});
      const timeLoc=gl.getUniformLocation(program,'time'),rainLoc=gl.getUniformLocation(program,'rain[0]');gl.uniform1f(gl.getUniformLocation(program,'motion'),reduce?0:1);gl.uniform1f(gl.getUniformLocation(program,'aspect'),aspect);gl.viewport(0,0,canvas.width,canvas.height);
      releaseRenderer=()=>{textures.forEach(t=>gl.deleteTexture(t));gl.deleteBuffer(buffer);gl.deleteProgram(program)};
      render=()=>{for(let i=textDirty?1:2;i<=3;i++){gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,textures[i]);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,sources[i])}textDirty=false;gl.uniform1f(timeLoc,clock);gl.uniform4fv(rainLoc,rainUniform);gl.drawArrays(gl.TRIANGLES,0,6)};root.dataset.renderer='webgl';
    }catch(error){gl=null;root.dataset.renderer='fallback';root.dataset.glError=String(error&&error.message||error)}}
      if(!gl){const fallback=make(W,H);fallback.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1';fallback.className='alw-canvas';canvas.after(fallback);const ctx=fallback.getContext('2d'),under=make(W,H),u=under.getContext('2d'),comp=make(W,H),cc=comp.getContext('2d');const paintUnder=()=>{u.filter='blur(4px)';drawPhoto(u);u.filter='none';u.fillStyle='rgba(9,33,97,.36)';u.fillRect(0,0,W,H);u.drawImage(textCanvas,0,0,W,H);textDirty=false};paintUnder();
        render=()=>{if(textDirty)paintUnder();drawPhoto(ctx);ctx.fillStyle='rgba(184,215,244,.05)';ctx.fillRect(0,0,W,H);cc.globalCompositeOperation='source-over';cc.clearRect(0,0,W,H);cc.drawImage(under,0,0);cc.globalCompositeOperation='destination-in';cc.drawImage(mask,0,0);ctx.drawImage(comp,0,0);if(reduce)return;const raw=ctx.getImageData(0,0,W,H),src=raw.data.slice(),dst=raw.data;
          for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=Math.min(NY-1,Math.floor(y/H*NY))*NX+Math.min(NX-1,Math.floor(x/W*NX)),gx=gradientX[k],gy=gradientY[k];if(Math.abs(gx)+Math.abs(gy)<.003)continue;const sx=clamp(Math.round(x+gx*14),0,W-1),sy=clamp(Math.round(y+gy*14),0,H-1),si=(sy*W+sx)*4,di=(y*W+x)*4,light=(-gx*.42-gy*.78)*77;for(let ch=0;ch<3;ch++)dst[di+ch]=clamp(src[si+ch]+light,0,255)}
          for(const q of rain){const age=clock-q.born,cx=q.x*W,cy=q.y*H,r=age*.075*W,fade=1-clamp((age-5.8),0,1);for(let y=Math.max(0,Math.floor(cy-r-25));y<Math.min(H,cy+r+25);y++)for(let x=Math.max(0,Math.floor(cx-r-25));x<Math.min(W,cx+r+25);x++){const dx=x-cx,dy=y-cy,dist=Math.hypot(dx,dy);if(dist<1||Math.abs(dist-r)>26)continue;const phase=(dist-r)/W+.003*Math.sin(Math.atan2(dy,dx)*3),env=Math.exp(-Math.pow(phase/.049,2))*Math.exp(-age*.37)*Math.min(1,age/.25)*fade,wave=Math.sin(phase*195)*env*q.power,sx=clamp(Math.round(x+dx/dist*wave*7),0,W-1),sy=clamp(Math.round(y+dy/dist*wave*7),0,H-1),si=(sy*W+sx)*4,di=(y*W+x)*4,light=(-.447*dx-.894*dy)/dist*wave*38;for(let ch=0;ch<3;ch++)dst[di+ch]=clamp(dst[di+ch]+src[si+ch]-src[di+ch]+light,0,255)}}ctx.putImageData(raw,0,0)
        };if(root.dataset.renderer!=='fallback')root.dataset.renderer='canvas';
      }raf=requestAnimationFrame(frame)
    }
    function frame(now){try{if(stopped||!root.isConnected)return;if(entered||!nativeActive||document.hidden){previous=now;raf=requestAnimationFrame(frame);return}if(now-previous<32){raf=requestAnimationFrame(frame);return}const dt=previous?Math.min(.06,(now-previous)/1000):.033;previous=now;clock+=dt;updateRain(clock);updateWater();let clearedPixels=0;for(let i=0;i<amount.length;i++){const a=remaining(i,now);mi.data[i*4+3]=Math.round(a*255);if(a>.2)clearedPixels++;if(a<.0001)amount[i]=0}mc.putImageData(mi,0,0);root.dataset.clearedPixels=String(clearedPixels);if(render)render();root.dataset.frame=String((Number(root.dataset.frame)||0)+1);reveal();raf=requestAnimationFrame(frame)}catch(error){root.dataset.frameError=String(error&&error.message||error);stopped=true}}
    window.mistSplashEnvironment=config=>{
      nativeActive=config.active!==false;root.dataset.active=String(nativeActive);
      for(const edge of ['top','bottom','left','right'])document.documentElement.style.setProperty('--safe-'+edge,Math.max(0,Number(config[edge])||0)+'px');
      if(render)paintText();
    };
    window.mistSplashStop=()=>{stopped=true;cancelAnimationFrame(raf);releaseRenderer()};
    let resizeTimer;
    window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{const r=screen.getBoundingClientRect();if(!entered&&(Math.abs(r.width-viewport.width)>1||Math.abs(r.height-viewport.height)>1))location.reload()},150)});
    const failed=()=>postNative('failed');
    let attempts=0;
    const tryStart=()=>{
      attempts++;
      const run=()=>{
        try{paintText();updateWater();setup()}
        catch(error){
          console.error('Mist splash failed',error);
          root.dataset.startError=String(error&&error.message||error);
          if(attempts<3){photoSource=null;setTimeout(tryStart,300)}else failed();
        }
      };
      if(photoSource){run();return}
      const useImg=()=>{photoSource=photo;run()};
      if(window.createImageBitmap){
        createImageBitmap(photo).then(bm=>{photoSource=bm;run()},useImg);
      }else if(photo.decode){photo.decode().then(useImg,useImg)}
      else useImg();
    };
    const ready=()=>{
      const go=()=>tryStart();
      if(document.fonts)Promise.all([document.fonts.load('300 11px "Mist Serif"'),document.fonts.load('400 35px "Mist Script"')]).then(go).catch(go);else go()
    };
    photo.addEventListener('error',failed,{once:true});
    if(photo.complete&&photo.naturalWidth)ready();else photo.addEventListener('load',ready,{once:true});
  })();
