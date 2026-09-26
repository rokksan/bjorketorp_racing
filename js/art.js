/* Original, grid-aligned pixel art. Every sprite shares this palette and a 1 px grid. */
(function(root) {
  'use strict';
  const C=root.FarmRace;
  const P= {
    ink:'#393b40',deep:'#304b42',grass:'#89ad65',grassLight:'#a0bc73',grassDark:'#76985d',leaf:'#527b4a',leafLight:'#7b9c51',leafShade:'#365d45',cream:'#fff0ce',white:'#fff7e1',gold:'#e8b45f',ochre:'#c38a4c',road:'#e5c58b',roadLight:'#efd59b',roadShadow:'#b99566',brown:'#885e49',wood:'#b78056',rust:'#b85f4e',red:'#d87557',blue:'#71969b',water:'#77a5aa',lilac:'#a08aaf'
  };
  const bird=[
  '........................',
  '..............rr........',
  '............rrrrr.......',
  '............irrrri......',
  '...........iwwwwwwi.....',
  '...........iwwwwwwwi....',
  '...........iwwwwiwwi....',
  '...ii......iwwwwiwoo....',
  '..iwwi.....iwwwwwoooo...',
  '..iwwwi..iiiwwwwwooo....',
  '...iwwwiiwwwwwwwwri.....',
  '....iwwwwwwwwwwwrri.....',
  '....iwwwwwwwwwwwwwi.....',
  '...iwwwwwwwwwwwwwwi.....',
  '...iwwwwssssswwwwwi.....',
  '...iwwwssssssswwwsi.....',
  '....iwwsssssswwwssi.....',
  '.....isssssssssssi......',
  '......iiiiiiiiiii.......',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................'];
  function rect(ctx,x,y,w,h,color) {
    ctx.fillStyle=color;
    ctx.fillRect(Math.round(x),Math.round(y),w,h);
  }
  function pattern(ctx,rows,x,y,palette,scale=1) {
    for(let r=0;r<rows.length;r++)for(let c=0;c<rows[r].length;c++) {
      const col=palette[rows[r][c]];
      if(col)rect(ctx,x+c*scale,y+r*scale,scale,scale,col);
    }
  }
  function chicken(ctx,x,y,color='cream',frame=0,face=1,skin='classic',scale=1) {
    const colors= {
      cream:[P.white,'#e0c995'],rust:['#d28b65','#a96950'],sage:['#c5ceab','#83977c'],lilac:['#d1bfd5','#a08aaf'],brown:['#b79b7b','#8b735c']
    };
    const [w,s]=colors[color]||colors.cream;
    ctx.save();
    ctx.translate(Math.round(x),Math.round(y));
    ctx.scale(face*scale,scale);
    rect(ctx,-8,1,17,3,'#45644566');
    rect(ctx,-6,0,13,5,'#45644555');
    const bounce=frame%4===1||frame%4===3?-1:0;
    pattern(ctx,bird,-12,-20+bounce, {
      i:P.ink,w,s,r:P.red,o:P.gold
    });
    // Real alternating feet and wing frames, not a translated static sprite.
    const leg=frame%4;
    rect(ctx,-4,-1,2,leg===1?1:3,P.gold);
    rect(ctx,2,-1,2,leg===3?1:3,P.gold);
    rect(ctx,leg===1?-6:-5,leg===1?0:2,4,1,P.ochre);
    rect(ctx,leg===3?3:2,leg===3?0:2,4,1,P.ochre);
    if(leg===1||leg===3) {
      rect(ctx,-4,-7+bounce,6,2,w);
      rect(ctx,-5,-6+bounce,2,2,w);
    }
    if(skin!=='classic') {
      rect(ctx,3,-8+bounce,5,2,skin==='gold'?P.gold:P.blue);
      rect(ctx,1,-6+bounce,3,2,skin==='gold'?P.ochre:'#4e717e');
    }
    ctx.restore();
  }
  function tree(ctx,x,y,kind='tree',theme='spring') {
    const autumn=theme==='autumn',light=autumn?'#d4a35f':P.leafLight,mid=autumn?'#b78751':P.leaf,shade=autumn?'#86674d':P.leafShade;
    rect(ctx,x+4,y+28,23,4,'#45644566');
    rect(ctx,x+13,y+17,6,15,P.brown);
    rect(ctx,x+14,y+19,2,11,P.wood);
    rect(ctx,x+4,y+6,25,18,shade);
    rect(ctx,x+8,y+2,16,27,shade);
    rect(ctx,x+2,y+10,29,11,shade);
    rect(ctx,x+5,y+5,22,16,mid);
    rect(ctx,x+9,y+1,14,23,mid);
    rect(ctx,x+3,y+9,26,10,mid);
    rect(ctx,x+8,y+5,8,4,light);
    rect(ctx,x+6,y+9,5,5,light);
    rect(ctx,x+16,y+3,5,3,light);
    rect(ctx,x+17,y+15,7,3,light);
    rect(ctx,x+11,y+24,5,2,shade);
    rect(ctx,x+24,y+10,3,2,shade);
    if(kind==='apple')for(const [dx,dy] of [[9,12],[22,10],[17,21]]) {
      rect(ctx,x+dx,y+dy,3,3,P.rust);
      rect(ctx,x+dx,y+dy,2,1,P.red);
    }
  }
  function pine(ctx,x,y) {
    rect(ctx,x+12,y+29,4,8,P.brown);
    for(let i=0;i<5;i++) {
      const w=6+i*5;
      rect(ctx,x+14-w/2,y+2+i*5,w,7,i%2?P.leafShade:P.leaf);
      rect(ctx,x+14-w/2+2,y+2+i*5,Math.max(2,w/2),2,P.leafLight);
    }
  }
  function coop(ctx,x,y,level=0) {
    rect(ctx,x+4,y+41,66,5,'#45644566');
    rect(ctx,x+6,y+20,57,24,'#d6b784');
    rect(ctx,x+6,y+40,57,4,P.wood);
    for(let i=0;i<4;i++)rect(ctx,x+7,y+22+i*5,54,1,'#b79768');
    rect(ctx,x+3,y+18,64,5,P.ink);
    rect(ctx,x+8,y+12,54,6,P.rust);
    rect(ctx,x+14,y+6,42,6,P.rust);
    rect(ctx,x+21,y+1,28,5,P.red);
    for(let row=0;row<3;row++)for(let col=0;col<6-row;col++)rect(ctx,x+9+row*6+col*8,y+15-row*5,6,1,'#e39b6c');
    rect(ctx,x+28,y+25,14,19,P.brown);
    rect(ctx,x+30,y+27,10,17,P.deep);
    rect(ctx,x+32,y+30,5,6,P.gold);
    for(const wx of [13,48]) {
      rect(ctx,x+wx,y+26,9,9,P.cream);
      rect(ctx,x+wx+1,y+27,7,7,P.blue);
      rect(ctx,x+wx+4,y+27,1,7,P.cream);
      rect(ctx,x+wx+1,y+30,7,1,P.cream);
    }
    rect(ctx,x+25,y+43,21,3,P.roadShadow);
    rect(ctx,x+22,y+46,27,2,P.roadLight);
    if(level>0) {
      rect(ctx,x+59,y+7,3,12,P.brown);
      rect(ctx,x+62,y+7,10,6,level>5?P.gold:P.blue);
    }
  }
  function stall(ctx,x,y) {
    rect(ctx,x+3,y+10,2,20,P.brown);
    rect(ctx,x+28,y+10,2,20,P.brown);
    rect(ctx,x,y+3,33,10,P.cream);
    for(let i=0;i<4;i++)rect(ctx,x+i*8,y+3,4,10,P.rust);
    rect(ctx,x+2,y+21,29,9,P.wood);
    rect(ctx,x+4,y+23,25,2,P.gold);
    for(let i=0;i<4;i++) {
      rect(ctx,x+5+i*6,y+17,4,4,i%2?P.leafLight:P.red);
    }
  }
  function flowers(ctx,x,y,theme) {
    for(let i=0;i<4;i++) {
      rect(ctx,x+i*4,y+(i%2)*3+2,1,4,P.leaf);
      rect(ctx,x+i*4-1,y+(i%2)*3,3,2,theme==='autumn'?P.gold:i%2?P.cream:'#dba0a0');
    }
  }
  function hay(ctx,x,y) {
    rect(ctx,x-7,y-4,15,9,P.ochre);
    rect(ctx,x-6,y-6,13,8,P.gold);
    rect(ctx,x-4,y-5,9,1,P.cream);
    rect(ctx,x-3,y-5,2,9,'#ac814a');
    rect(ctx,x+3,y-5,2,9,'#ac814a');
    rect(ctx,x-7,y+3,15,2,P.brown);
  }
  function mud(ctx,x,y) {
    rect(ctx,x-9,y-3,18,6,'#8a765e');
    rect(ctx,x-6,y-5,12,10,'#8a765e');
    rect(ctx,x-7,y-2,13,4,'#a19173');
    rect(ctx,x-4,y-3,5,1,'#c4b18b');
  }
  function egg(ctx,x,y,type) {
    const col= {
      boost:P.gold,shield:'#89bccc',mud:'#bb8970'
    }
    [type];
    rect(ctx,x-4,y-5,8,10,P.ink);
    rect(ctx,x-3,y-7,6,13,P.ink);
    rect(ctx,x-2,y-6,4,11,col);
    rect(ctx,x-3,y-4,6,8,col);
    rect(ctx,x-2,y-4,2,3,P.white);
    rect(ctx,x-2,y+2,4,2,type==='boost'?'#ad773e':type==='shield'?'#517b93':'#855d50');
  }
  function corn(ctx,x,y) {
    rect(ctx,x-2,y-3,4,6,P.ochre);
    rect(ctx,x-1,y-4,3,7,P.gold);
    rect(ctx,x,y-3,1,5,P.cream);
    rect(ctx,x-3,y+1,2,3,P.leaf);
  }
  function fence(ctx,x,y,w) {
    rect(ctx,x,y+3,w,2,P.brown);
    rect(ctx,x,y+7,w,2,P.wood);
    for(let i=0;i<w;i+=10) {
      rect(ctx,x+i,y,3,12,P.brown);
      rect(ctx,x+i,y,2,9,P.cream);
    }
  }
  function seeded(seed) {
    let n=seed;
    return()=> {
      n=(n*1664525+1013904223)>>>0;
      return n/4294967296;
    };
  }
  function prop(ctx,type,x,y) {
    if(type==='tractor') {
      rect(ctx,x+2,y+18,31,4,'#29394388');
      rect(ctx,x+3,y+11,10,11,P.ink);rect(ctx,x+25,y+14,8,8,P.ink);
      rect(ctx,x+5,y+14,6,5,'#a4a1a0');rect(ctx,x+27,y+16,4,4,P.ochre);
      rect(ctx,x+6,y+7,24,9,'#9c4c42');rect(ctx,x+18,y+9,12,4,'#bd7054');
      rect(ctx,x+7,y,10,10,'#314953');rect(ctx,x+8,y+1,7,6,'#87a6aa');
      rect(ctx,x+5,y-2,15,3,P.rust);rect(ctx,x+25,y+1,2,8,P.ink);
      rect(ctx,x+27,y+10,4,2,P.cream);
    } else if(type==='pumpkins') {
      for(let i=0;i<3;i++) {rect(ctx,x+i*8,y+(i%2)*3,8,6,'#ae633f');rect(ctx,x+i*8+2,y-1+(i%2)*3,4,8,'#e0a154');rect(ctx,x+i*8+3,y-3+(i%2)*3,2,3,'#63735a');}
    } else if(type==='barrels') {
      for(let i=0;i<2;i++){rect(ctx,x+i*12,y,10,14,'#886047');rect(ctx,x+i*12,y+3,10,2,'#413c47');rect(ctx,x+i*12,y+10,10,2,'#413c47');rect(ctx,x+3+i*12,y-4,3,5,'#497f69');}
    } else if(type==='lantern') {
      rect(ctx,x+3,y,2,22,'#595165');rect(ctx,x,y,9,2,P.ink);
      rect(ctx,x,y+3,9,9,'#a87854');rect(ctx,x+2,y+4,5,7,'#ffe4a0');rect(ctx,x+3,y+5,2,4,'#fff7ce');
    } else if(type==='barn') {
      rect(ctx,x+3,y+16,57,30,'#773f42');
      for(let i=0;i<9;i++)rect(ctx,x+5+i*6,y+17,1,28,'#a76155');
      rect(ctx,x,y+13,64,5,'#343746');rect(ctx,x+8,y+7,48,7,'#58515a');rect(ctx,x+17,y,30,8,'#665c64');
      rect(ctx,x+22,y+24,22,22,'#302e39');rect(ctx,x+23,y+24,2,21,'#cdab79');rect(ctx,x+41,y+24,2,21,'#cdab79');
      rect(ctx,x+11,y+23,6,7,'#efc76f');rect(ctx,x+49,y+23,6,7,'#efc76f');
    }
  }
  function makeScene(track,level=0) {
    const reserved=C.makeCrowd(track),items=[],rand=seeded(track.id==='market'?27:track.id==='meadow'?93:168);
    const place=(type,x,y,w,h)=> {
      if(reserved.some(p=>x<p.x+16&&x+w>p.x-16&&y<p.y+9&&y+h>p.y-34)||x<2||y<2||x+w>478||y+h>298||!C.rectangleClear(track,x,y,w,h,4)||items.some(o=>x<o.x+o.w+2&&x+w+2>o.x&&y<o.y+o.h+2&&y+h+2>o.y))return false;
      items.push( {
        type,x,y,w,h
      });
      return true;
    };
    // Theme landmarks are placed before foliage, always outside the full road corridor.
    const scatter=(type,w,h,count)=> {
      let placed=0;
      for(let i=0;i<550&&placed<count;i++)if(place(type,Math.floor(rand()*(474-w))+3,Math.floor(rand()*(292-h))+4,w,h))placed++;
    };
    scatter(track.theme==='spring'?'coop':track.theme==='rain'?'shed':'barn',track.theme==='rain'?48:74,track.theme==='rain'?34:49,1);
    if(track.theme==='rain') {
      scatter('tractor',36,26,3);scatter('ditch',32,13,4);scatter('crops',42,25,8);scatter('barrels',24,18,3);
    } else if(track.theme==='night') {
      scatter('barrels',24,18,5);scatter('pumpkins',26,15,10);scatter('lantern',10,24,9);scatter('stall',33,31,2);
    } else {scatter('stall',33,31,3);scatter('crops',42,25,3);scatter('barrels',24,18,3);}
    scatter(track.theme==='night'?'apple':track.theme==='rain'?'pine':'tree',33,38,track.theme==='spring'?18:7);
    scatter('flowers',17,10,track.theme==='spring'?20:5);
    for(const [x,y,w] of [[178,208,66],[200,126,50],[330,285,70],[5,13,70]])place('fence',x,y,w,12);
    return items.sort((a,b)=>(a.y+a.h)-(b.y+b.h));
  }
  function paintSceneItem(ctx,item,theme,level) {
    const {
      x,y
    }
    =item;
    switch(item.type) {
      case'shed':ctx.save();ctx.translate(x,y);ctx.scale(.68,.68);prop(ctx,'barn',0,0);ctx.restore();break;
      case'ditch':rect(ctx,x,y,32,12,'#535f59');rect(ctx,x+1,y+3,30,6,'#71939a');rect(ctx,x+4,y+4,15,1,'#a5bbbc');break;
      case'tractor':case'pumpkins':case'barrels':case'lantern':case'barn':prop(ctx,item.type,x,y+3);break;
      case'pond':
      rect(ctx,x+4,y,40,28,'#cfba80');
      rect(ctx,x,y+5,48,18,'#cfba80');
      rect(ctx,x+5,y+3,38,22,P.water);
      rect(ctx,x+2,y+7,44,14,P.water);
      for(let i=0;i<4;i++)rect(ctx,x+8+i*8,y+7+(i%2)*8,6,1,'#bdd2bb');
      rect(ctx,x+7,y+24,2,5,P.leaf);
      rect(ctx,x+35,y+1,2,6,P.leaf);
      break;
      case'crops':
      for(let r=0;r<3;r++)for(let c=0;c<5;c++) {
        rect(ctx,x+c*8,y+r*8,7,6,'#a78b63');
        rect(ctx,x+c*8+2,y+r*8+1,3,3,P.leaf);
        rect(ctx,x+c*8+1,y+r*8+2,5,1,theme==='autumn'?P.gold:P.leafLight);
      }
      break;
      case'coop':coop(ctx,x,y,level);
      break;
      case'stall':stall(ctx,x,y);
      break;
      case'pine':pine(ctx,x,y);
      break;
      case'flowers':flowers(ctx,x,y,theme);
      break;
      case'fence':fence(ctx,x,y,item.w);
      break;
      default:tree(ctx,x,y,item.type,theme);
    }
  }
  function makeBackground(track,level=0) {
    const canvas=document.createElement('canvas');
    canvas.width=480;
    canvas.height=300;
    const ctx=canvas.getContext('2d');
    ctx.imageSmoothingEnabled=false;
    const night=track.theme==='night',rain=track.theme==='rain';
    const grass=night?'#343d54':rain?'#718573':P.grass;
    rect(ctx,0,0,480,300,grass);
    const rand=seeded(714);
    for(let i=0;i<1700;i++) {
      const x=Math.floor(rand()*480),y=Math.floor(rand()*300);
      rect(ctx,x,y,rand()>.8?2:1,1,night?(rand()>.5?'#414c63':'#2d354b'):rain?(rand()>.5?'#809181':'#617868'):rand()>.5?'#adc27d':'#7c9b60');
    }
    // Path rendered into a low-resolution buffer. Nearest-neighbour upscaling preserves the grid.
    function path(width,color) {
      ctx.beginPath();
      track.segments.forEach((s,i)=>i?ctx.lineTo(Math.round(s.a.x),Math.round(s.a.y)):ctx.moveTo(Math.round(s.a.x),Math.round(s.a.y)));
      ctx.closePath();
      ctx.strokeStyle=color;
      ctx.lineWidth=width;
      ctx.lineJoin='round';
      ctx.lineCap='round';
      ctx.stroke();
    }
    path(track.width*2+10,night?'#242c42':rain?'#4b655f':'#68834f');
    path(track.width*2+6,night?'#6b6078':rain?'#6b695b':'#b79863');
    path(track.width*2+2,night?'#bb9b83':rain?'#bdb89a':'#f0dba0');
    path(track.width*2-2,night?'#9c8590':rain?'#aaa48a':P.road);
    path(track.width*2-12,night?'#b29b9b':rain?'#b9b59b':'#e9cb91');
    for(let i=0;i<1200;i++) {
      const x=Math.floor(rand()*480),y=Math.floor(rand()*300),d=C.project(track,x,y).distance;
      if(d<track.width-2)rect(ctx,x,y,rand()>.5?2:1,1,night?(rand()>.6?'#917e89':'#bfaaa2'):rain?(rand()>.6?'#858576':'#c8c3a9'):rand()>.6?'#d4b67e':'#efd59e');
    }
    // White chevrons and low roadside posts have one consistent visual language.
    for(let d=55;d<track.length;d+=95) {
      const p=C.pointAt(track,d);
      ctx.save();
      ctx.translate(Math.round(p.x),Math.round(p.y));
      ctx.rotate(p.angle);
      ctx.fillStyle='#fff1c3';
      ctx.beginPath();
      ctx.moveTo(-4,-4);
      ctx.lineTo(2,0);
      ctx.lineTo(-4,4);
      ctx.lineTo(-1,0);
      ctx.fill();
      ctx.restore();
    }
    for(let d=20;d<track.length;d+=32)for(const side of [-1,1]) {
      const p=C.pointAt(track,d,(track.width+5)*side);
      rect(ctx,p.x-1,p.y-3,2,5,P.brown);
      rect(ctx,p.x-1,p.y-3,2,2,P.cream);
    }
    if(track.bridge) {
      for(let d=track.length*track.bridge[0];d<track.length*track.bridge[1];d+=4) {
        const p=C.pointAt(track,d);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);
        rect(ctx,-2,-track.width,4,track.width*2,'#365b72');
        rect(ctx,-1,-12,3,24,'#c09770');rect(ctx,-2,-14,4,2,'#eee0b1');rect(ctx,-2,12,4,2,'#eee0b1');ctx.restore();
      }
    }
    if(track.hall) {
      // Open-sided dance barn: posts outside the road, transparent passage for racers.
      const p=C.pointAt(track,track.length*track.hall);
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);
      for(let i=-25;i<26;i+=5)rect(ctx,i,-track.width,4,track.width*2,'#af866e');
      for(const side of [-1,1]) {rect(ctx,-27,side*(track.width+3),57,3,'#79464e');for(let i=-25;i<=25;i+=25){rect(ctx,i,side*(track.width+4),3,5,P.cream);rect(ctx,i,side*(track.width+4),2,2,P.gold);}}
      ctx.restore();
    }
    const p=C.pointAt(track,0);
    ctx.save();
    ctx.translate(Math.round(p.x),Math.round(p.y));
    ctx.rotate(p.angle);
    for(let a=0;a<2;a++)for(let b=-5;b<6;b++)rect(ctx,a*3-3,b*4,3,4,(a+b)%2?P.cream:P.deep);
    ctx.restore();
    const scene=makeScene(track,level);
    scene.forEach(item=>paintSceneItem(ctx,item,track.theme,level));
    if(night) {
      ctx.fillStyle='#171c4938';ctx.fillRect(0,0,480,300);
      for(const item of scene.filter(p=>p.type==='lantern')) {
        rect(ctx,item.x-4,item.y,18,20,'#ffd48012');prop(ctx,'lantern',item.x,item.y+3);
      }
      for(let d=40;d<track.length;d+=100) {
        const p=C.pointAt(track,d,track.width+7);rect(ctx,p.x-2,p.y-5,5,5,'#f4ce82');rect(ctx,p.x-1,p.y-4,3,3,'#fff3bd');
      }
    }
    return {
      canvas,scene
    };
  }
  function farmer(ctx,p,time,speaking,reduced=false,rain=false) {
    const sway=reduced?0:Math.round(Math.sin(time*2+p.id)*2),x=Math.round(p.x)+sway,y=Math.round(p.y),arm=p.windup>0||p.mood==='argue'?-18:-10;
    rect(ctx,x-9,y+2,19,3,'#28333b77');
    rect(ctx,x-6,y-5,5,8,'#443c36');rect(ctx,x+3,y-5,5,8,'#443c36');
    rect(ctx,x-8,y-14,17,10,rain?'#bd9858':p.color);
    // Plaid shirt, dungarees, patches, red nose, stubble and a battered cap.
    for(let i=-6;i<8;i+=5)rect(ctx,x+i,y-14,1,9,'#e4c293');
    rect(ctx,x-8,y-11,17,1,'#402e3688');rect(ctx,x-6,y-8,13,6,'#536879');
    rect(ctx,x-5,y-14,2,8,'#536879');rect(ctx,x+4,y-14,2,8,'#536879');rect(ctx,x+3,y-4,3,2,P.ochre);
    rect(ctx,x-5,y-24,11,11,'#d6a27a');rect(ctx,x-6,y-19,13,4,'#cb866c');
    rect(ctx,x-4,y-16,9,4,'#78614f');rect(ctx,x-1,y-20,4,3,'#b65b51');
    rect(ctx,x-7,y-26,14,3,'#8f794f');rect(ctx,x-3,y-30,9,5,'#a18a58');rect(ctx,x+5,y-26,5,2,'#67543e');
    rect(ctx,x-4,y-22,3,1,P.ink);rect(ctx,x+3,y-23,3,1,P.ink);
    rect(ctx,x-1,y-15,4,speaking?3:1,P.ink);if(speaking)rect(ctx,x,y-15,1,1,P.cream);
    rect(ctx,x-10,y+arm,3,7,p.color);rect(ctx,x+9,y+arm,3,7,p.color);
    rect(ctx,x+11,y+arm-4,4,7,'#355d4b');rect(ctx,x+12,y+arm-7,2,4,'#547a58');rect(ctx,x+11,y+arm-1,4,2,P.cream);
    // Discarded beer crate and bottle are part of each reserved crowd pocket.
    rect(ctx,x-11,y+5,9,4,'#926747');rect(ctx,x-8,y+1,2,5,'#487358');
    if(speaking||p.windup>0||p.mood==='argue') {rect(ctx,x+12,y-31,2,6,P.cream);rect(ctx,x+12,y-23,2,2,P.red);}
  }
  function crowdAtmosphere(ctx,r,time,reduced) {
    for(const p of r.crowd)if(p.partner>p.id&&p.mood==='brawl') {
      const other=r.crowd[p.partner],x=(p.x+other.x)/2,y=p.y-8;
      for(let i=0;i<7;i++) {
        const a=i*2.4+(reduced?0:time*8);
        rect(ctx,x+Math.cos(a)*10-5,y+Math.sin(a)*6-4,10,8,i%2?'#d1c5ab':'#a5998c');
      }
      rect(ctx,x-3,y-2,7,2,P.cream);rect(ctx,x,y-5,2,8,P.gold);
      rect(ctx,x+11,y-15,5,3,P.brown); // flying hat, safely within the crowd clearing
    }
    if(r.track.theme==='rain'&&!reduced) {
      for(let i=0;i<65;i++) {const x=(i*83-time*30)%480,y=(i*47+time*135)%300;rect(ctx,(x+480)%480,y,1,4,'#c3d6da55');}
    }
    if(r.track.theme==='night')for(let i=0;i<12;i++) {
      const x=30+i*37,y=22+(i*53)%260;
      if(C.project(r.track,x,y).distance>r.track.width+8)rect(ctx,x,y,1,2,reduced||Math.sin(time*2+i)>.2?'#f9d985':'#79836e');
    }
  }
  function crowdShots(ctx,r) {
    for(const p of r.projectiles) {
      const f=Math.min(1,p.age/p.duration);
      if(f<1) {
        ctx.strokeStyle='#a33f35';ctx.lineWidth=1;
        ctx.beginPath();ctx.ellipse(p.x,p.y,11,6,0,0,Math.PI*2);ctx.stroke();
        rect(ctx,p.x-3,p.y,7,1,'#fff0b8');rect(ctx,p.x,p.y-3,1,7,'#fff0b8');
        const x=p.sx+(p.x-p.sx)*f,y=p.sy+(p.y-p.sy)*f-Math.sin(f*Math.PI)*30;
        if(p.kind==='bottle') {rect(ctx,x-2,y-5,4,7,'#497f69');rect(ctx,x-1,y-8,2,4,'#315649');rect(ctx,x-2,y-2,4,2,P.cream);}
        else if(p.kind==='apple'){rect(ctx,x-3,y-4,6,6,P.red);rect(ctx,x,y-6,2,2,P.leaf);}
        else {rect(ctx,x-2,y-6,4,7,P.brown);rect(ctx,x,y-1,5,3,P.brown);}
      } else for(let i=0;i<5;i++) {
        const a=i*Math.PI*2/5,d=4+(p.age-p.duration)*18;
        rect(ctx,p.x+Math.cos(a)*d,p.y+Math.sin(a)*d*.6,2,2,p.kind==='bottle'?'#497f69':P.ochre);
      }
    }
  }
  function render(canvas,r,bg,time=0,reduced=false) {
    const ctx=canvas.getContext('2d');
    ctx.imageSmoothingEnabled=false;
    ctx.clearRect(0,0,480,300);
    ctx.drawImage(bg.canvas,0,0);
    r.obstacles.forEach(o=>o.kind==='hay'?hay(ctx,o.x,o.y):mud(ctx,o.x,o.y));
    r.puddles.forEach(o=>mud(ctx,o.x,o.y));
    for(const c of r.cornPoints)if(c.collectedLap<r.actors[0].lap)corn(ctx,c.x,c.y+(reduced?0:Math.round(Math.sin(time*3+c.x)*1)));
    if(r.options.mode!=='trial')for(const p of r.pickups)if(p.collectedLap<r.actors[0].lap) {
      rect(ctx,p.x-5,p.y+4,11,2,'#9c895a88');
      egg(ctx,p.x,p.y+(reduced?0:Math.round(Math.sin(time*4+p.x)*2)),p.kind);
    }
    for(const p of r.particles)rect(ctx,p.x,p.y,2,2,p.color);
    const ghost=C.ghostAt(r,r.time);
    if(ghost) {
      ctx.save();
      ctx.globalAlpha=.38;
      chicken(ctx,ghost.x,ghost.y,'lilac',Math.floor(time*12)%4,Math.cos(ghost.angle)<-.1?-1:1,'blue');
      ctx.globalAlpha=.7;
      rect(ctx,ghost.x-7,ghost.y+4,14,1,'#8fcad1');
      ctx.restore();
    }
    for(const p of r.crowd)farmer(ctx,p,time,r.crowdSpeechTime>0&&p.id===r.crowdSpeaker,reduced,r.track.theme==='rain');
    const order=r.actors.slice().sort((a,b)=>a.y-b.y);
    for(const a of order) {
      if(a.id===0) {
        rect(ctx,a.x-9,a.y+3,18,2,'#fff2bd');
        rect(ctx,a.x-10,a.y+1,2,3,'#fff2bd');
        rect(ctx,a.x+8,a.y+1,2,3,'#fff2bd');
      }
      if(a.shield>0) {
        ctx.strokeStyle='#b6e7e9';
        ctx.lineWidth=1;
        ctx.strokeRect(Math.round(a.x)-12,Math.round(a.y)-21,24,26);
      }
      if((a.boost>0||a.sprinting)&&!reduced) {
        for(let i=0;i<3;i++)rect(ctx,a.x-Math.cos(a.angle)*(12+i*4),a.y-Math.sin(a.angle)*(12+i*4)-6,3,2,i%2?P.red:P.gold);
      }
      chicken(ctx,a.x,a.y,a.color,a.speed>5?Math.floor(time*(a.boost>0?18:12))%4:0,Math.cos(a.angle)<-.1?-1:1,a.id===0?r.skin||'classic':'classic');
      if(a.id===0) {
        rect(ctx,a.x-3,a.y-27,7,2,P.cream);
        rect(ctx,a.x-2,a.y-25,5,2,P.gold);
        rect(ctx,a.x-1,a.y-23,3,1,P.gold);
      }
      if(a.slow>0) {
        rect(ctx,a.x+8,a.y-20,3,1,P.gold);
        rect(ctx,a.x-10,a.y-16,1,3,P.gold);
      }
    }
    crowdShots(ctx,r);
    crowdAtmosphere(ctx,r,time,reduced);
  }
  function drawPortrait(canvas,color,skin='classic') {
    const ctx=canvas.getContext('2d');
    ctx.imageSmoothingEnabled=false;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    chicken(ctx,canvas.width/2,canvas.height*.76,color,0,1,skin,2);
  }
  function drawUpgrade(canvas,type) {
    const ctx=canvas.getContext('2d');
    ctx.imageSmoothingEnabled=false;
    ctx.clearRect(0,0,32,32);
    if(type==='feed') {
      rect(ctx,10,4,12,3,P.brown);
      rect(ctx,8,7,16,20,P.ochre);
      rect(ctx,6,11,20,14,P.ochre);
      rect(ctx,8,9,14,15,P.gold);
      rect(ctx,11,7,3,17,'#f1d28c');
      rect(ctx,13,13,6,8,P.cream);
      rect(ctx,15,14,2,6,P.leaf);
      rect(ctx,13,16,6,2,P.leaf);
    }
    else if(type==='boots') {
      rect(ctx,6,6,7,14,P.brown);
      rect(ctx,6,17,12,7,P.brown);
      rect(ctx,7,7,5,12,P.red);
      rect(ctx,7,19,9,3,P.red);
      rect(ctx,5,24,14,2,P.ink);
      rect(ctx,18,10,7,14,P.brown);
      rect(ctx,18,21,12,7,P.brown);
      rect(ctx,19,11,5,12,P.gold);
      rect(ctx,19,23,9,3,P.gold);
      rect(ctx,17,28,14,2,P.ink);
    }
    else {
      rect(ctx,4,17,24,9,P.brown);
      rect(ctx,7,25,18,3,P.brown);
      rect(ctx,3,17,26,3,P.gold);
      rect(ctx,6,21,20,2,P.ochre);
      egg(ctx,12,14,'boost');
      egg(ctx,21,15,'shield');
      rect(ctx,4,20,24,2,P.gold);
    }
  }
  function drawFarm(canvas,save,time=0) {
    const ctx=canvas.getContext('2d');
    ctx.imageSmoothingEnabled=false;
    rect(ctx,0,0,480,180,'#a6c3b2');
    rect(ctx,0,70,480,110,'#8eac68');
    // Pixel clouds, a layered treeline and vegetable beds frame the growing coop.
    for(const [x,y] of [[31,23],[146,16],[352,26]]) {
      rect(ctx,x,y,39,8,'#e6e5c8');
      rect(ctx,x+8,y-5,21,6,'#e6e5c8');
    }
    for(let i=0;i<16;i++)tree(ctx,i*33-10,45+(i%3)*4,'tree','spring');
    rect(ctx,192,113,98,67,P.road);
    rect(ctx,210,96,60,54,P.road);
    rect(ctx,0,153,480,19,P.road);
    const level=Object.values(save.upgrades).reduce((a,b)=>a+b,0);
    coop(ctx,204,81,level);
    fence(ctx,53,111,106);
    fence(ctx,320,111,100);
    for(let row=0;row<3;row++)for(let col=0;col<8;col++) {
      rect(ctx,55+col*12,129+row*8,10,6,'#9d8056');
      rect(ctx,58+col*12,128+row*8,3,3,P.leaf);
      rect(ctx,57+col*12,129+row*8,5,1,P.leafLight);
    }
    if(level>=3) {
      stall(ctx,330,119);
      flowers(ctx,317,158,'spring');
    }
    if(level>=6) {
      fence(ctx,165,117,25);
      fence(ctx,280,117,25);
      for(let i=0;i<3;i++)egg(ctx,344+i*10,155,'boost');
    }
    for(const [x,y,c] of [[183,142,'cream'],[297,146,'rust'],[395,147,'sage']])chicken(ctx,x,y,c,Math.floor(time*3)%4,1,save.skin);
    for(const [x,y] of [[10,122],[435,123],[21,174],[311,169]])flowers(ctx,x,y,'spring');
    if(save.races>=3) {
      rect(ctx,286,91,2,34,P.brown);
      rect(ctx,288,91,15,9,P.blue);
    }
  }
  root.FarmArt= {
    P,bird,rect,prop,farmer,chicken,tree,coop,egg,corn,hay,mud,makeScene,makeBackground,render,drawPortrait,drawUpgrade,drawFarm
  };
})(window);
