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
  function chicken(ctx,x,y,color='cream',frame=0,face=1,skin='classic',scale=1,outfit=null) {
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
    // Scrap-built equipment gives each chicken a distinct silhouette, even without color.
    if(color==='cream') {
      rect(ctx,1,-16,10,4,'#343743');rect(ctx,2,-15,3,2,'#70eee0');rect(ctx,7,-15,3,2,'#70eee0');
      rect(ctx,-8,-11,3,8,'#ad794b');rect(ctx,-9,-5,8,3,'#795747');rect(ctx,-7,-7,2,5,'#8de9cf');
    } else if(color==='rust') {
      for(const x of [-12,-7]) {
        rect(ctx,x,-17,4,13,'#44454b');rect(ctx,x+1,-16,2,10,'#bcb5a2');rect(ctx,x,-12,4,2,'#d37652');
        rect(ctx,x+1,-19,2,3,'#d37652');
        if(frame>0){rect(ctx,x,-4,4,3+frame,'#e78552');rect(ctx,x+1,-4,2,2+frame,'#fff2a8');}
      }
      rect(ctx,2,-19,8,3,'#553e52');rect(ctx,4,-18,6,1,'#f391d1');
    } else if(color==='sage') {
      rect(ctx,-9,-12,14,10,'#434b55');rect(ctx,-8,-11,12,7,'#919994');
      rect(ctx,-6,-10,7,2,'#555e69');rect(ctx,-7,-6,3,2,'#b1f2d4');rect(ctx,2,-9,1,5,'#e3d7b6');
      rect(ctx,1,-23,10,6,'#606d71');rect(ctx,0,-18,12,2,'#394149');rect(ctx,3,-18,7,1,'#9be9d8');
    } else if(color==='lilac') {
      rect(ctx,-11,-14,8,12,'#3b354f');rect(ctx,-10,-12,6,6,'#81e4c1');rect(ctx,-9,-11,3,1,'#294a48');
      rect(ctx,-8,-19,1,6,'#b8adb5');rect(ctx,-9,-21,3,2,'#ee8dc9');
      rect(ctx,2,-16,10,3,'#3d354e');rect(ctx,3,-15,8,1,'#f494df');rect(ctx,-9,-4,4,1,'#f494df');
    }
    if(outfit==='outlaw'){rect(ctx,-6,-12,12,11,'#e5b94c');rect(ctx,-4,-10,3,3,'#a53635');rect(ctx,1,-5,3,3,'#a53635');rect(ctx,-1,-8,3,3,'#a53635');}
    if(outfit==='arsenal'){rect(ctx,0,-22,12,3,'#b6423b');rect(ctx,10,-20,5,3,'#b6423b');for(let i=0;i<5;i++){rect(ctx,-6+i*2,-12+i*2,4,4,'#503d32');rect(ctx,-5+i*2,-12+i*2,2,3,'#e3bd64');}}
    if(outfit==='beard'){rect(ctx,4,-12,8,7,'#dad5bc');rect(ctx,6,-5,4,3,'#b6ad98');}
    if(outfit==='vest'){rect(ctx,-6,-11,11,9,'#d8ed54');rect(ctx,-6,-7,11,2,'#fff5d6');rect(ctx,-1,-11,2,9,'#fff5d6');}
    if(outfit==='flame'){rect(ctx,0,-23,12,12,'#303440');rect(ctx,2,-20,8,3,'#8aeed4');rect(ctx,1,-15,3,4,'#ef9b39');rect(ctx,7,-14,3,3,'#ee6948');}
    if(outfit==='neon'){rect(ctx,-10,4,22,2,'#f289cf');rect(ctx,-7,6,15,1,'#71eddf');rect(ctx,-9,-9,3,6,'#f289cf');}
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
  function coop(ctx,x,y,level=0,showFlag=true) {
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
    rect(ctx,x+8,y+18,15,2,'#6be7c4');rect(ctx,x+48,y+18,12,2,'#ef88c6');
    rect(ctx,x+55,y-5,1,12,P.ink);rect(ctx,x+52,y-5,7,1,'#8ce6d5');
    rect(ctx,x+25,y+43,21,3,P.roadShadow);
    rect(ctx,x+22,y+46,27,2,P.roadLight);
    if(level>0&&showFlag) {
      rect(ctx,x+59,y+7,3,12,P.brown);
      swedishFlag(ctx,x+62,y+7,10,6);
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
    // Dark silhouette and a pale halo stay legible on dirt, grass and night tracks.
    rect(ctx,x-7,y-5,14,10,'#fff1af55');
    rect(ctx,x-5,y-7,10,14,'#fff1af55');
    rect(ctx,x-5,y-4,10,9,'#493921');
    rect(ctx,x-3,y-6,6,13,'#493921');
    rect(ctx,x-4,y-3,8,7,'#e6a52f');
    rect(ctx,x-2,y-5,4,11,'#ffd65a');
    rect(ctx,x-3,y-3,2,6,'#fff3ba');
    rect(ctx,x+1,y-2,2,5,'#bc7925');
    rect(ctx,x+7,y-8,1,5,'#fff6ce');
    rect(ctx,x+5,y-6,5,1,'#fff6ce');
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
  function swedishFlag(ctx,x,y,w=16,h=10) {
    rect(ctx,x,y,w,h,'#28649a');rect(ctx,x+w*.31,y,Math.max(2,w*.13),h,'#f2c44e');rect(ctx,x,y+h*.4,w,Math.max(2,h*.2),'#f2c44e');
  }
  function scrapCar(ctx,x,y,model='240') {
    const estate=model==='850',col=model==='240'?'#b59258':model==='740'?'#99554b':'#627d80';
    rect(ctx,x+2,y+23,62,4,'#303c3b77');
    for(const wx of [10,49]){rect(ctx,x+wx,y+19,10,9,P.ink);rect(ctx,x+wx+3,y+22,4,3,'#8a8d86');}
    rect(ctx,x+2,y+12,61,11,col);rect(ctx,x+17,y+3,estate?39:27,12,col);
    rect(ctx,x+20,y+5,13,8,'#3f5661');rect(ctx,x+35,y+5,estate?18:10,8,'#3f5661');
    rect(ctx,x+22,y+6,3,5,'#8eadae');rect(ctx,x+35,y+5,1,14,'#c6b8a0');
    rect(ctx,x,y+20,7,3,'#59585b');rect(ctx,x+59,y+20,7,3,'#59585b');
    rect(ctx,x+3,y+13,model==='240'?4:7,3,'#eee0a8');rect(ctx,x+59,y+14,3,4,'#a53939');
    rect(ctx,x+27,y+16,5,1,P.ink);rect(ctx,x+8,y+18,7,3,'#75563d');rect(ctx,x+42,y+20,9,2,'#75563d');
    rect(ctx,x+53,y+10,8,2,P.ink);rect(ctx,x+23,y+8,1,5,'#ddd4bb');rect(ctx,x+24,y+11,4,1,'#ddd4bb');
    // Sagging bumpers, cracked glass and model-specific sedan/estate silhouettes.
    if(model==='740')rect(ctx,x+17,y+2,28,2,'#373e46');
  }
  function prop(ctx,type,x,y) {
    if(type.startsWith('volvo')) {scrapCar(ctx,x,y,type.slice(5));
    } else if(type==='caravan') {
      rect(ctx,x+3,y+21,36,3,'#333a4288');
      rect(ctx,x+5,y+17,6,7,P.ink);rect(ctx,x+30,y+17,6,7,P.ink);
      rect(ctx,x+1,y+3,38,17,'#c9c6a6');rect(ctx,x+4,y,32,5,'#ddd5b7');
      rect(ctx,x+1,y+13,38,3,'#aa7854');rect(ctx,x+5,y+5,12,7,'#526e78');
      rect(ctx,x+7,y+6,3,5,'#b4cebd');rect(ctx,x+22,y+4,10,16,'#7b7565');
      rect(ctx,x+24,y+6,6,5,'#526e78');rect(ctx,x+23,y+14,2,1,P.cream);
      rect(ctx,x+34,y+5,3,7,'#ae845f');rect(ctx,x+3,y+17,4,2,'#9a6d4e');
      rect(ctx,x+39,y+17,5,2,P.ink);rect(ctx,x+16,y-3,1,6,P.ink);rect(ctx,x+12,y-3,9,1,P.ink);
      rect(ctx,x+18,y+21,7,2,'#a27652');
    } else if(type==='wreckhouse') {
      rect(ctx,x+3,y+13,35,22,'#856654');
      for(let i=0;i<6;i++)rect(ctx,x+5+i*6,y+14,1,19,'#b09773');
      rect(ctx,x,y+10,40,4,'#414653');rect(ctx,x+5,y+5,29,6,'#625058');rect(ctx,x+11,y,17,6,'#795453');
      rect(ctx,x+23,y+3,7,7,'#313743');rect(ctx,x+27,y+8,8,2,'#a17e59');
      rect(ctx,x+7,y+17,9,8,'#303d44');rect(ctx,x+6,y+20,12,2,'#b1966a');
      rect(ctx,x+23,y+19,10,16,'#333a3d');rect(ctx,x+21,y+26,14,2,'#b1966a');
      rect(ctx,x+4,y+33,7,3,'#677657');rect(ctx,x+34,y+28,7,7,'#677657');
    } else if(type==='bottles') {
      rect(ctx,x,y+8,17,7,'#90694e');rect(ctx,x,y+11,17,2,'#513f36');
      for(let i=0;i<3;i++){rect(ctx,x+2+i*5,y+4,3,6,'#376747');rect(ctx,x+3+i*5,y+1,1,4,'#648756');rect(ctx,x+2+i*5,y+7,3,2,'#e3ce91');}
      rect(ctx,x+18,y+12,6,3,'#456d53');rect(ctx,x+23,y+13,3,1,'#456d53');
    } else if(type==='bushnap') {
      rect(ctx,x+2,y+8,25,12,'#466a49');rect(ctx,x+5,y+4,20,13,'#64854f');
      rect(ctx,x+3,y+12,13,5,'#ac7259');rect(ctx,x+15,y+12,9,5,'#60718a');
      rect(ctx,x+23,y+14,5,4,'#493f37');rect(ctx,x+6,y+9,6,5,'#ddac80');
      rect(ctx,x+4,y+8,10,2,'#a58c54');rect(ctx,x+8,y+11,2,1,'#493f37');
      rect(ctx,x+1,y+17,3,5,'#38654d');rect(ctx,x+1,y+18,3,1,P.cream);
      // Pixel Zs make the pose unmistakably a comic nap, not an injured spectator.
      for(const [dx,dy] of [[15,3],[22,0]]){rect(ctx,x+dx,y+dy,4,1,P.cream);rect(ctx,x+dx+2,y+dy+1,1,1,P.cream);rect(ctx,x+dx+1,y+dy+2,1,1,P.cream);rect(ctx,x+dx,y+dy+3,4,1,P.cream);}
    } else if(type==='tractor') {
      rect(ctx,x+2,y+18,31,4,'#29394388');
      rect(ctx,x+3,y+11,10,11,P.ink);rect(ctx,x+25,y+14,8,8,P.ink);
      rect(ctx,x+5,y+14,6,5,'#a4a1a0');rect(ctx,x+27,y+16,4,4,P.ochre);
      rect(ctx,x+6,y+7,24,9,'#9c4c42');rect(ctx,x+18,y+9,12,4,'#bd7054');
      rect(ctx,x+7,y,10,10,'#314953');rect(ctx,x+8,y+1,7,6,'#87a6aa');
      rect(ctx,x+5,y-2,15,3,P.rust);rect(ctx,x+25,y+1,2,8,P.ink);
      rect(ctx,x+27,y+10,4,2,'#82f0d3');rect(ctx,x+13,y+17,12,1,'#e98bcb');
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
      rect(ctx,x+12,y+17,39,2,'#85e7d3');rect(ctx,x+11,y+23,6,7,'#efc76f');rect(ctx,x+49,y+23,6,7,'#efc76f');
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
    scatter('volvo'+(track.theme==='spring'?'240':track.theme==='rain'?'740':'850'),68,33,1);
    if(track.theme==='rain')scatter('tractor',36,26,1);
    scatter('caravan',46,29,1);scatter('wreckhouse',43,40,1);scatter('bushnap',30,24,2);scatter('bottles',28,20,2);
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
      case'volvo240':case'volvo740':case'volvo850':prop(ctx,item.type,x,y);break;
      case'bushnap':prop(ctx,item.type,x,y);break;
      case'caravan':case'wreckhouse':case'bottles':
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
  function courseProp(ctx,type,x,y){
    const r=(a,b,w,h,c)=>rect(ctx,x+a,y+b,w,h,c);
    if(type==='carstack'){
      r(-3,31,73,7,'#302f2b66');
      for(let i=0;i<3;i++){scrapCar(ctx,x+i%2*5,y+22-i*15,i===1?'240':'740');r(8+i%2*5,24-i*15,45,3,['#985a41','#6d8272','#a58b55'][i]);}
    }else if(type==='tires'){
      for(let i=0;i<9;i++){const a=i%3*13,b=Math.floor(i/3)*8;r(a,b,12,7,'#303536');r(a+3,b+2,6,2,'#6c716a');r(a,b+5,12,2,'#171f23');}
    }else if(type==='container'){
      r(0,0,67,35,'#854d38');r(-2,-4,71,6,'#b37b51');for(let a=5;a<65;a+=7)r(a,3,2,29,'#613d30');r(7,11,45,12,'#dbd0ac');ctx.fillStyle='#4e4136';ctx.font='6px monospace';ctx.fillText('SKROT 49',x+10,y+19);
    }else if(type==='kennel'){
      r(6,7,35,27,'#8c5840');r(13,14,17,20,'#292c2b');r(0,2,47,7,'#544838');r(6,-4,35,7,'#6d5840');r(44,28,11,4,'#b6bfc0');r(46,29,7,1,'#759db1');
    }else if(type==='toilet'){
      r(5,-4,28,42,'#608c86');r(2,-7,34,6,'#cfceab');r(10,1,18,32,'#3f6766');r(14,5,10,10,'#e4dcc4');r(24,20,2,3,'#d7bb72');
    }else if(type==='table'){
      r(8,16,4,18,'#654a37');r(42,16,4,18,'#654a37');r(0,8,54,12,'#b99464');r(2,26,51,5,'#88613f');r(9,2,5,7,'#eee5c6');r(28,3,5,6,'#557647');r(40,4,7,4,'#d8b26c');
    }else if(type==='tent'){
      r(0,6,69,4,'#594c3b');r(4,9,3,29,'#806345');r(62,9,3,29,'#806345');
      for(let a=0;a<7;a++)r(a*10,-8+Math.abs(a-3)*3,10,16,a%2?'#d7caa7':'#ab5944');r(5,29,58,8,'#956944');
    }else if(type==='logs'){
      for(let i=0;i<6;i++){const a=i%3*16,b=Math.floor(i/3)*11;r(a,b,15,12,'#664b37');r(a+2,b+2,11,8,'#c79f63');r(a+6,b+4,3,4,'#876039');}
    }else if(type==='tower'){
      r(8,13,4,36,'#79593d');r(35,13,4,36,'#79593d');r(3,-8,43,24,'#8a6947');r(9,-3,30,9,'#303e36');r(0,-13,49,6,'#484b3d');r(23,16,3,36,'#b39861');for(let b=20;b<50;b+=6)r(20,b,9,2,'#c9ad73');
    }else if(type==='still'){
      prop(ctx,'wreckhouse',x,y);r(43,9,20,29,'#a1a896');r(48,2,10,8,'#767c6d');r(54,-8,5,11,'#93693c');r(58,-8,20,4,'#b38c53');r(76,-8,4,35,'#93693c');r(72,28,13,12,'#d0ceb0');r(44,39,18,4,'#ba7045');
    }else if(type==='reeds'){
      for(let i=0;i<14;i++){const a=i*4,b=i%3*5;r(a,b,2,25,'#9e9d59');r(a-1,b-5,4,8,'#6d513b');}
    }else if(type==='stage'){
      r(0,3,82,44,'#553f51');r(0,-6,82,8,'#be7a66');r(3,4,5,40,'#aa5b61');r(73,4,5,40,'#aa5b61');r(9,10,63,24,'#263844');r(0,42,82,8,'#bd9a68');
      r(16,24,10,18,'#171f28');r(57,24,10,18,'#171f28');r(36,24,12,13,'#ac8063');r(40,19,3,5,'#e8d7b2');for(let a=8;a<78;a+=12)r(a,1,4,4,a%3?'#f6ce75':'#ce83b8');
    }else if(type==='dancefloor'){
      for(let a=0;a<72;a+=9)for(let b=0;b<40;b+=8)r(a,b,8,7,((a/9+b/8)%2)?'#ba966d':'#9b7858');
    }else if(type==='stringlights'){
      r(0,0,2,35,'#866e50');r(68,0,2,35,'#866e50');for(let a=2;a<68;a+=2)r(a,Math.round(Math.sin(a/68*Math.PI)*7),2,1,'#343e41');for(let a=8;a<65;a+=12)r(a,Math.round(Math.sin(a/68*Math.PI)*7),3,4,a%3?'#eed27f':'#d48daa');
    }else return false;
    return true;
  }
  function combatBackground(track) {
    const canvas=document.createElement('canvas');canvas.width=track.worldWidth;canvas.height=track.worldHeight;
    const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
    const palettes={fair:['#b1a77f','#cbc09b','#9b916d','#ebe0ad'],scrapyard:['#756c5b','#8c8170','#514e44','#b8a78c'],peat:['#4e6258','#69746a','#354c48','#a19977'],airstrip:['#4b6345','#678051','#354c36','#bba581'],park:['#303e49','#45515b','#25313d','#aaa393']};
    const [ground,light,dark,road]=palettes[track.id]||palettes.fair;
    rect(ctx,0,0,canvas.width,canvas.height,ground);const rand=seeded(49);
    for(let i=0;i<4500;i++){const x=rand()*960,y=rand()*600;rect(ctx,x,y,track.id==='fair'?6:track.id==='scrapyard'?3:2,track.id==='fair'?3:1,i%2?light:dark);}
    // Large material patches make each location readable before individual props resolve.
    for(let i=0;i<28;i++){
      const x=rand()*880,y=rand()*530,w=30+rand()*85,h=14+rand()*35;
      ctx.fillStyle=i%2?dark:light;
      if(track.id==='fair'||track.id==='scrapyard'||track.id==='park'){ctx.globalAlpha=.3;ctx.fillRect(x,y,w,h);ctx.globalAlpha=1;}
      else {ctx.beginPath();ctx.ellipse(x,y,w/2,h/2,0,0,Math.PI*2);ctx.fill();if(track.id==='peat'){rect(ctx,x-w/3,y,w/2,1,'#819a8c');}}
    }
    for(const [w,color] of [[track.width*2+8,dark],[track.width*2,light],[track.width*2-8,road]]){
      ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineJoin=ctx.lineCap='round';ctx.beginPath();track.segments.forEach((s,i)=>i?ctx.lineTo(s.a.x,s.a.y):ctx.moveTo(s.a.x,s.a.y));ctx.closePath();ctx.stroke();
    }
    if(track.id==='scrapyard'){
      for(let x=10;x<960;x+=12){rect(ctx,x,12,1,20,'#b1aaa0');rect(ctx,x,568,1,20,'#b1aaa0');}rect(ctx,10,17,938,1,'#b1aaa0');rect(ctx,10,577,938,1,'#b1aaa0');
      for(let d=0;d<track.length;d+=12){const p=C.pointAt(track,d,12),q=C.pointAt(track,d,-12);rect(ctx,p.x,p.y,4,1,'#7c746466');rect(ctx,q.x,q.y,4,1,'#7c746466');}
    }
    for(let d=25;d<track.length;d+=65){const p=C.pointAt(track,d);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);rect(ctx,-4,-1,8,2,'#f7e7b8');ctx.restore();}
    const sign=track.id==='fair'?{x:190,y:290}:{x:300,y:300};
    const scene=[{type:'sign-clearance',x:sign.x-8,y:sign.y-20,w:270,h:45}];
    const spectators=C.makeCrowd(track);
    const landmarks={fair:[['tent',630,310],['toilet',230,205],['table',290,360]],scrapyard:[['container',215,205],['carstack',660,300],['tires',340,205]],airstrip:[['tower',240,240],['logs',510,320],['tower',690,230]],peat:[['still',260,270],['still',630,280],['reeds',440,320]],park:[['stage',610,260],['dancefloor',290,270],['stringlights',590,330]]};
    for(const [type,tx,ty] of landmarks[track.id]||[]){
      let placed=false;
      for(let radius=0;radius<=160&&!placed;radius+=20)for(let angle=0;angle<8&&!placed;angle++){
        const x=Math.round(tx+Math.cos(angle*Math.PI/4)*radius),y=Math.round(ty+Math.sin(angle*Math.PI/4)*radius);
        if(x<20||x>850||y<50||y>500||!C.rectangleClear(track,x-5,y-18,95,70,5)||spectators.some(p=>p.x>x-20&&p.x<x+100&&p.y>y-20&&p.y<y+75)||scene.some(p=>x-5<p.x+p.w+8&&x+90>p.x-8&&y-18<p.y+p.h+8&&y+52>p.y-8))continue;
        courseProp(ctx,type,x,y);scene.push({type,x:x-5,y:y-18,w:95,h:70});placed=true;
      }
    }

    for(let i=0;i<450;i++){
      const x=20+rand()*880,y=20+rand()*520;if(track.id==='scrapyard'&&x>230&&x<550&&y>255&&y<340)continue;if(track.id==='fair'&&x>150&&x<380&&y>260&&y<405)continue;if(!C.rectangleClear(track,x,y,40,40,8))continue;
      if(spectators.some(p=>p.x>x-20&&p.x<x+60&&p.y>y-15&&p.y<y+80))continue;
      const type=track.id==='fair'?['tent','table','stall','toilet','bushnap','stall'][i%6]:track.id==='scrapyard'?['carstack','tires','container','carstack','barrels','kennel'][i%6]:track.id==='airstrip'?['pine','logs','tower','pine','logs','bushnap'][i%6]:track.id==='peat'?['still','reeds','barrels','reeds','bushnap','still'][i%6]:track.id==='park'?['table','table','stringlights','dancefloor','toilet','bushnap'][i%6]:i%12===0?'caravan':i%12===1?'volvo740':i%4===2?'bottles':'tree';
      if(!C.rectangleClear(track,x-5,y-18,95,70,5)||scene.some(p=>x-5<p.x+p.w+8&&x+90>p.x-8&&y-18<p.y+p.h+8&&y+52>p.y-8))continue;
      if(type==='tree')tree(ctx,x,y);else if(type==='pine')pine(ctx,x,y);else if(type==='stall'){
        stall(ctx,x,y);ctx.fillStyle='#263e38';ctx.font='bold 5px monospace';ctx.fillText(['KORV','HONUNG','HÖNSTEMA','STRUMPOR','LOPPIS'][i%5],x+2,y+35);
      }else if(!courseProp(ctx,type,x,y))prop(ctx,type,x,y);scene.push({type,x:x-5,y:y-18,w:95,h:70});
    }
    for(let i=0;i<180;i++){
      const x=20+rand()*920,y=40+rand()*520;
      if(!C.rectangleClear(track,x-5,y-12,track.id==='airstrip'?40:26,track.id==='airstrip'?45:25,8)||spectators.some(p=>Math.hypot(p.x-x,p.y-y)<25)||scene.some(p=>x>p.x-8&&x<p.x+p.w+8&&y>p.y-8&&y<p.y+p.h+8))continue;
      const type=track.id==='scrapyard'?'tires':track.id==='airstrip'?'pine':track.id==='peat'?'reeds':'bottles';
      ctx.save();ctx.translate(x,y);ctx.scale(type==='pine'?1:.5,type==='pine'?1:.5);if(type==='pine')pine(ctx,0,0);else if(!courseProp(ctx,type,0,0))prop(ctx,type,0,0);ctx.restore();
    }
    if(track.id==='park'){
      const loge=C.pointAt(track,track.length*.5);ctx.save();ctx.translate(loge.x,loge.y);ctx.rotate(loge.angle);
      for(let x=-30;x<30;x+=5)rect(ctx,x,-track.width,4,track.width*2,'#ac8864');
      for(const side of [-1,1]){rect(ctx,-35,side*(track.width+4),70,5,'#8a4747');for(let x=-30;x<=30;x+=15){rect(ctx,x,side*(track.width+7),3,12,'#e6d1a0');rect(ctx,x,side*(track.width+7),3,3,x%2?'#e7a762':'#8dc8b3');}}ctx.restore();
      for(let f=.12;f<.98;f+=.12){const p=C.pointAt(track,track.length*f,track.width+18);prop(ctx,'lantern',p.x,p.y);}
    }
    const start=C.pointAt(track,0);ctx.save();ctx.translate(start.x,start.y);ctx.rotate(start.angle);
    for(let y=-track.width;y<track.width;y+=5)for(let x=-5;x<5;x+=5)rect(ctx,x,y,5,5,((y+track.width)/5+x/5)%2?'#eee5cb':'#414e43');ctx.restore();
    ctx.fillStyle=track.id==='fair'?'#344e43':'#ead8ab';ctx.font='bold 16px monospace';
    // The fair's concave route runs through the middle: signs belong in clearings.
    ctx.fillText(track.short.toUpperCase(),sign.x,sign.y);ctx.font='9px monospace';ctx.fillText(({fair:'KAFFE 15 KR. OMDÖME SLUT.',scrapyard:'INGA KVITTON. INGA VITTNEN.',airstrip:'TORESTORPS KÖTT OCH KRUT',peat:'KOMMUNALT VATTEN. PRIVAT SPRIT.',park:'ENTRÉ 80. VÄRDIGHET SAKNAS.'}[track.id]),sign.x,sign.y+17);
    if(track.id==='fair'){
      for(const [x,y,label] of [[225,190,'HONUNG'],[275,190,'KORV'],[325,190,'HÖNSTEMA'],[680,325,'LOPPIS'],[730,325,'KAFFE']])if(C.rectangleClear(track,x,y,36,40,5)&&!spectators.some(p=>Math.hypot(p.x-x-16,p.y-y-20)<35)){stall(ctx,x,y);ctx.fillStyle='#344e43';ctx.font='6px monospace';ctx.fillText(label,x,y+38);}
      for(let i=0;i<6;i++){const x=205+i*20;rect(ctx,x,335,1,25,'#725e43');swedishFlag(ctx,x+1,335,12,8);}
      rect(ctx,260,375,56,34,'#a56a4c');rect(ctx,256,371,64,8,'#e4d2a1');ctx.fillStyle='#fff0cd';ctx.font='7px monospace';ctx.fillText('TOMBOLA',265,393);
    }
    if(track.id==='scrapyard'){
      for(let i=0;i<3;i++)scrapCar(ctx,330+i*57,350-i*12,i%2?'240':'740');
      rect(ctx,570,270,8,100,'#b38b43');rect(ctx,540,270,75,7,'#d3ad54');rect(ctx,606,277,2,60,'#3b4544');rect(ctx,599,333,15,5,'#515a50');
    }
    return {canvas,scene};
  }
  function drawCourseHazards(ctx,r,time){
    for(const h of r.courseHazards||[]){
      const base=C.pointAt(r.track,r.track.length*h.fraction),nx=-Math.sin(base.angle),ny=Math.cos(base.angle);
      if(h.state==='warning'){
        ctx.save();ctx.strokeStyle=Math.floor(time*6)%2?'#fff0a1':'#de643e';ctx.lineWidth=3;ctx.setLineDash([5,4]);ctx.beginPath();
        if(['press','hunter','steam'].includes(h.kind))ctx.arc(h.x,h.y,h.radius+5,0,Math.PI*2);
        else{ctx.moveTo(base.x-nx*(r.track.width+12),base.y-ny*(r.track.width+12));ctx.lineTo(base.x+nx*(r.track.width+12),base.y+ny*(r.track.width+12));}
        ctx.stroke();ctx.restore();
      }
      if(h.kind==='hunter'){
        const p=C.pointAt(r.track,r.track.length*h.fraction,-r.track.width-20);
        farmer(ctx,{...p,color:'#737343',mood:'heckle',windup:0,id:0},time,false,true,false);
        ctx.save();ctx.translate(p.x,p.y-10);ctx.rotate(base.angle+Math.PI/2);rect(ctx,0,-2,22,4,'#303733');rect(ctx,0,-2,7,4,'#997142');if(h.state==='active')rect(ctx,22,-4,7,8,'#f5d585');ctx.restore();
        if(h.state==='active'){ctx.fillStyle='#d5b77a66';ctx.beginPath();ctx.arc(h.x,h.y,h.radius,0,Math.PI*2);ctx.fill();for(let i=0;i<5;i++)rect(ctx,h.x+Math.sin(i*7+time*20)*17,h.y+Math.cos(i*3)*12,2,2,'#ffdf9e');}
      }else if(h.kind==='steam'){
        const p=C.pointAt(r.track,r.track.length*h.fraction,-r.track.width-20);rect(ctx,p.x-9,p.y-22,18,22,'#a5aba0');rect(ctx,p.x-4,p.y-29,8,8,'#676f65');rect(ctx,p.x+9,p.y-15,18,4,'#b89153');
        rect(ctx,p.x-6,p.y,12,3,h.state==='idle'?'#654f35':'#ef9f4c');
        if(h.state==='active'){ctx.save();ctx.globalAlpha=.65;ctx.fillStyle='#dde3ca';for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(h.x+Math.sin(i*3+time)*13,h.y+Math.cos(i*5+time)*12-6,14,0,Math.PI*2);ctx.fill();}ctx.restore();}
      }else if(h.kind==='press'){
        rect(ctx,h.x-18,h.y-14,36,28,'#534f47');
        for(let i=0;i<6;i++)rect(ctx,h.x-18+i*6,h.y+12,3,3,'#eac866');
        rect(ctx,h.x-20,h.y-32,5,47,'#917a43');rect(ctx,h.x+15,h.y-32,5,47,'#917a43');
        const drop=h.state==='active'?20:0;rect(ctx,h.x-17,h.y-32+drop,34,9,'#a6aba0');rect(ctx,h.x-10,h.y-37,20,5,h.state==='idle'?'#79a365':'#e65d3e');
        if(h.state==='active'){rect(ctx,h.x-15,h.y-4,29,8,'#b15f40');for(let i=0;i<4;i++)rect(ctx,h.x-18+i*12,h.y+8+Math.sin(time*15+i)*4,2,2,'#ffe6a0');}
      }else if(h.kind==='dog'){
        const home=C.pointAt(r.track,r.track.length*h.fraction,-r.track.width-28);courseProp(ctx,'kennel',home.x-20,home.y-27);
        ctx.save();ctx.translate(h.x,h.y);ctx.scale(nx<0?-1:1,1);
        const stride=h.state==='active'?Math.sin(time*22)*3:0;
        rect(ctx,-12,-12,23,11,'#805236');rect(ctx,-10,-14,15,6,'#343431');rect(ctx,5,-19,13,12,'#956241');rect(ctx,13,-14,9,5,'#b38a5c');rect(ctx,7,-23,4,7,'#393631');rect(ctx,15,-17,2,2,'#ffe3a0');rect(ctx,6,-9,10,2,'#ba4033');rect(ctx,-10,-2,4,7+stride,'#523d2d');rect(ctx,7,-2,4,7-stride,'#523d2d');rect(ctx,-17,-17,7,4,'#493d31');
        if(h.state==='warning'){ctx.fillStyle='#ffe3a0';ctx.font='bold 9px monospace';ctx.fillText('GRRR!',-14,-29);}ctx.restore();
      }else if(h.kind==='rooster'){
        chicken(ctx,h.x,h.y,'rust',h.state==='active'?Math.floor(time*18)%4:0,nx<0?-1:1,'classic',1.3);
        rect(ctx,h.x-4,h.y-28,10,5,'#d83731');rect(ctx,h.x-1,h.y-33,3,6,'#f15137');
        if(h.state==='warning'){ctx.fillStyle='#ffe9a0';ctx.font='bold 14px monospace';ctx.fillText('!',h.x-3,h.y-38);}
      }else{
        rect(ctx,h.x-13,h.y-12,26,14,'#97724b');rect(ctx,h.x-11,h.y+2,6,5,'#303a34');rect(ctx,h.x+6,h.y+2,6,5,'#303a34');
        for(let i=0;i<7;i++)rect(ctx,h.x-10+i%4*6,h.y-15+Math.floor(i/4)*5,5,4,'#d4bb78');
      }
    }
  }
  function combatOverlay(ctx,r) {
    const camera=r.camera||{x:0,y:0,zoom:1},p=r.actors[0];
    // Fixed minimap, independent of camera and world rendering.
    rect(ctx,369,7,104,70,'#263b35df');ctx.save();ctx.translate(374,12);ctx.scale(94/r.track.worldWidth,60/r.track.worldHeight);
    ctx.strokeStyle='#ccb684';ctx.lineWidth=14;ctx.beginPath();r.track.segments.forEach((s,i)=>i?ctx.lineTo(s.a.x,s.a.y):ctx.moveTo(s.a.x,s.a.y));ctx.closePath();ctx.stroke();
    const start=C.pointAt(r.track,0);rect(ctx,start.x-10,start.y-10,20,20,'#fff2c9');
    for(const a of r.actors){ctx.fillStyle=a.id===0?'#ffda62':'#ee8980';ctx.beginPath();ctx.arc(a.x,a.y,a.id===0?18:12,0,Math.PI*2);ctx.fill();}
    rect(ctx,r.tractor.x-12,r.tractor.y-12,24,24,'#83dbe5');ctx.restore();
    if(r.aim&&r.countdown===0){const x=(r.aim.x-camera.x)*camera.zoom,y=(r.aim.y-camera.y)*camera.zoom;ctx.strokeStyle='#fff1b9';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.moveTo(x-9,y);ctx.lineTo(x-3,y);ctx.moveTo(x+3,y);ctx.lineTo(x+9,y);ctx.moveTo(x,y-9);ctx.lineTo(x,y-3);ctx.stroke();}
    for(const b of r.bullets){if(b.owner===0||Math.hypot(b.x-p.x,b.y-p.y)>190)continue;const x=(b.x-camera.x)*camera.zoom,y=(b.y-camera.y)*camera.zoom;if(x>=0&&x<=480&&y>=0&&y<=300)continue;rect(ctx,C.clamp(x,5,472),C.clamp(y,5,292),5,5,'#f8a16d');}
  }
  function makeBackground(track,level=0) {
    if(track.combat)return combatBackground(track);
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
      rect(ctx,x+11,y-15,5,3,P.brown);
      ctx.font='bold 7px monospace';ctx.fillStyle=P.cream;ctx.fillText(Math.floor(time)%2?'FAN!':'SATAN!',x-11,y-9); // flying hat, safely within the crowd clearing
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
        ctx.fillStyle='#bd443633';ctx.beginPath();ctx.ellipse(p.x,p.y,10,7,0,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#ffe8a1';ctx.lineWidth=1.5;
        ctx.beginPath();ctx.ellipse(p.x,p.y,10,7,0,0,Math.PI*2);ctx.stroke();
        ctx.strokeStyle='#d44836';ctx.beginPath();ctx.ellipse(p.x,p.y,10+12*(1-f),7+8*(1-f),0,0,Math.PI*2);ctx.stroke();
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
  function crossRider(ctx,x,y,angle,time,reduced=false) {
    ctx.save();ctx.translate(Math.round(x),Math.round(y));
    if(Math.cos(angle)<0)ctx.scale(-1,1);
    if(!reduced)for(let i=0;i<2;i++)rect(ctx,-20-i*3,2+Math.sin(time*9+i)*3,4,3,'#c3ab7980');
    for(const wheel of [-10,11]){rect(ctx,wheel-4,-1,8,8,'#282936');rect(ctx,wheel-2,1,4,4,'#b2bec0');}
    rect(ctx,-9,-5,20,4,'#d76d37');rect(ctx,-4,-9,12,4,'#397e9a');
    rect(ctx,10,-8,2,10,'#b5c6bd');rect(ctx,9,-10,6,2,'#252934');
    rect(ctx,-5,-15,8,8,'#425d83');rect(ctx,-2,-18,6,5,'#e4b884');
    rect(ctx,-4,-22,10,5,'#eed797');rect(ctx,2,-20,6,3,'#28384a');
    rect(ctx,0,-10,10,2,'#e4b884');rect(ctx,-4,-5,3,7,'#252934');
    ctx.restore();
    rect(ctx,x-5,y-10,12,8,'#fff0bd');ctx.fillStyle='#252934';ctx.font='bold 7px monospace';ctx.fillText('49',x-4,y-3);
  }
  function crossScene(ctx,r,time,reduced) {
    const b=r.cross;if(!b)return;
    if(b.state==='warning'||b.state==='burn') {
      ctx.strokeStyle=b.state==='warning'?'#ffe59b':'#835a35';ctx.lineWidth=2;
      ctx.beginPath();ctx.ellipse(b.x,b.y+3,13,9,0,0,Math.PI*2);ctx.stroke();
      if(b.state==='warning'){ctx.fillStyle='#fff0bd';ctx.font='bold 7px monospace';ctx.fillText('!',b.x-2,b.y-27);}
    }
    if(b.state!=='burn')for(let i=0;i<(reduced?3:9);i++) {
      const age=reduced?i/4:(time*3+i/9)%1,side=Math.cos(b.angle)<0?1:-1;
      rect(ctx,b.x+side*(11+age*17),b.y+4-Math.sin(age*Math.PI)*8+(i%3),2,2,i%2?'#785134':'#ab8050');
    }
    crossRider(ctx,b.x,b.y,b.angle,time,reduced);
    if(b.state==='burn')for(let i=0;i<(reduced?4:18);i++) {
      const age=reduced?i/5:(time*2.8+i/18)%1,side=Math.cos(b.angle)<0?1:-1;
      rect(ctx,b.x+side*(10+age*24),b.y+3-Math.sin(age*Math.PI)*15+(i%3)*2,2+i%2,2,i%2?'#785134':'#ab8050');
    }
  }
  function tractorRig(ctx,r,time,reduced) {
    if(r.options.mode==='trial')return;
    const t=r.tractor,tr=t.trailer;
    if(tr){
      ctx.strokeStyle='#5b5545';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(t.hitch?.x??t.x,t.hitch?.y??t.y);ctx.lineTo(tr.x+Math.cos(tr.angle)*10,tr.y+Math.sin(tr.angle)*10);ctx.stroke();
      // Rotate the wagon footprint in the ground plane; height stays vertical.
      // This gives continuous turning without rolling the side-view sprite flat.
      const c=Math.cos(tr.angle),s=Math.sin(tr.angle);
      const point=(u,v,z=0)=>[Math.round(tr.x+c*u-s*v),Math.round(tr.y+s*u+c*v-z)];
      const face=(vertices,color)=>{
        ctx.fillStyle=color;ctx.strokeStyle='#46513b';ctx.lineWidth=1;
        ctx.beginPath();vertices.forEach((p,i)=>{const q=point(...p);if(i)ctx.lineTo(...q);else ctx.moveTo(...q);});ctx.closePath();ctx.fill();ctx.stroke();
      };
      const wheels=[-8,8].map(v=>({v,p:point(-2,v)})).sort((a,b)=>a.p[1]-b.p[1]);
      const wheel=w=>{rect(ctx,w.p[0]-3,w.p[1]-3,6,7,P.ink);rect(ctx,w.p[0]-1,w.p[1]-1,2,3,'#aaa68c');};
      wheel(wheels[0]);
      face([[-13,-6,4],[13,-6,4],[13,-6,13],[-13,-6,13]],'#52653e');
      face([[-13,6,4],[13,6,4],[13,6,13],[-13,6,13]],'#728551');
      face([[-13,-6,4],[-13,6,4],[-13,6,13],[-13,-6,13]],'#5e7044');
      face([[13,-6,4],[13,6,4],[13,6,13],[13,-6,13]],'#81915b');
      face([[-13,-6,13],[13,-6,13],[13,6,13],[-13,6,13]],'#957442');
      for(let i=0;i<9;i++){const q=point(-10+(i%5)*5,(i%2?3:-3),14);rect(ctx,q[0]-2,q[1]-1,4,3,i%2?'#ab8d50':'#796137');}
      // Rear spreader bar follows exactly the same heading as the wagon.
      const rearA=point(-15,-7,8),rearB=point(-15,7,8);
      ctx.strokeStyle='#c0b07b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(...rearA);ctx.lineTo(...rearB);ctx.stroke();
      wheel(wheels[1]);
      if(t.state==='spread')for(let i=0;i<(reduced?3:12);i++){
        const f=reduced?i/4:(time*2+i/12)%1,d=12+f*20;
        rect(ctx,tr.x-Math.cos(tr.angle)*d-Math.sin(tr.angle)*(i%3-1)*4,tr.y-Math.sin(tr.angle)*d+Math.cos(tr.angle)*(i%3-1)*4-Math.sin(f*Math.PI)*8,3,2,i%2?'#6b4d2d':'#a28a48');
      }
    }
    // Use the same upright three-quarter sprite as the parked tractors.
    // Only mirror horizontally, like chickens and cars; never rotate the artwork flat.
    ctx.save();ctx.translate(Math.round(t.x),Math.round(t.y));ctx.scale(Math.cos(t.angle)<0?-1:1,1);
    prop(ctx,'tractor',-18,-19);ctx.restore();
    if(t.state!=='drive'){rect(ctx,t.x-3,t.y-26,6,4,'#f6c34b');if(t.state==='warning'){ctx.font='bold 7px monospace';ctx.fillStyle='#fff4ca';ctx.fillText('!',t.x-2,t.y-29);}}

  }
  function crowdBubble(ctx,r) {
    if(r.crowdSpeechTime<=0||!r.crowdSpeech)return;
    const p=r.crowd[r.crowdSpeaker];if(!p)return;
    ctx.font='bold 7px monospace';
    const words=r.crowdSpeech.split(' '),lines=[''];
    for(const word of words){const i=lines.length-1;if(ctx.measureText(lines[i]+' '+word).width>102&&lines[i])lines.push(word);else lines[i]+=(lines[i]?' ':'')+word;}
    const w=Math.min(114,Math.max(...lines.map(l=>ctx.measureText(l).width))+10),h=lines.length*9+8;
    const candidates=[[p.x-w/2,p.y-34-h],[p.x-w-17,p.y-23-h/2],[p.x+17,p.y-23-h/2]];
    const score=([x,y])=>{let n=0;for(let yy=y;yy<y+h;yy+=6)for(let xx=x;xx<x+w;xx+=8)if(C.project(r.track,xx,yy).distance<r.track.width+3)n++;const a=r.actors[0];if(a.x>x-14&&a.x<x+w+14&&a.y>y-10&&a.y<y+h+24)n+=1000;return n;};
    const [x,y]=candidates.map(([x,y])=>[C.clamp(x,3,(r.track.worldWidth||480)-3-w),C.clamp(y,3,(r.track.worldHeight||300)-3-h)]).sort((a,b)=>score(a)-score(b))[0];
    rect(ctx,x-1,y-1,w+2,h+2,'#45392e');rect(ctx,x,y,w,h,'#fff1c9');
    ctx.fillStyle='#45392e';lines.forEach((l,i)=>ctx.fillText(l,x+5,y+10+i*9));
    // A small matching marker identifies the speaker, without connector lines.
    rect(ctx,p.x-3,p.y-34,6,3,'#fff1c9');
  }
  function render(canvas,r,bg,time=0,reduced=false) {
    const ctx=canvas.getContext('2d');
    ctx.imageSmoothingEnabled=false;
    ctx.clearRect(0,0,480,300);
    ctx.save();
    if(r.combat&&r.camera){ctx.scale(r.camera.zoom,r.camera.zoom);ctx.translate(-r.camera.x,-r.camera.y);}
    ctx.drawImage(bg.canvas,0,0);
    if(r.combat)for(const c of r.cover){
      if(c.kind==='stall'){stall(ctx,c.x-16,c.y-25);continue;}
      if(c.kind==='wreck'){ctx.save();ctx.translate(c.x-17,c.y-16);ctx.scale(.8,.8);prop(ctx,'caravan',0,0);ctx.restore();continue;}
      rect(ctx,c.x-12,c.y-14,24,22,'#666c59');rect(ctx,c.x-10,c.y-12,20,5,'#a8ae86');rect(ctx,c.x-10,c.y+1,20,4,'#424d45');rect(ctx,c.x-2,c.y-10,3,12,'#b18c54');
    }
    drawCourseHazards(ctx,r,time);
    r.obstacles.forEach(o=>o.kind==='hay'?hay(ctx,o.x,o.y):mud(ctx,o.x,o.y));
    r.puddles.forEach(o=>{
      if(o.kind==='potato'){ctx.save();ctx.globalAlpha=Math.min(1,o.life);ctx.fillStyle='#cbb377';ctx.beginPath();ctx.arc(o.x,o.y,o.radius,0,Math.PI*2);ctx.fill();for(let i=0;i<9;i++)rect(ctx,o.x+Math.cos(i*2.4)*12-2,o.y+Math.sin(i*2.4)*12-2,4,3,'#e7d39a');ctx.restore();return;}
      if(o.kind==='manure'){ctx.save();ctx.globalAlpha=Math.min(1,o.life);ctx.fillStyle='#74602f';ctx.beginPath();ctx.ellipse(o.x,o.y,8,5,0,0,Math.PI*2);ctx.fill();for(let i=0;i<5;i++)rect(ctx,o.x-5+i*2,o.y-2+i%2*3,3,2,'#a18a47');ctx.restore();return;}
      if(o.kind!=='glass'){mud(ctx,o.x,o.y);return;}
      ctx.save();ctx.globalAlpha=Math.min(1,o.life);
      ctx.fillStyle='#315c4f55';ctx.beginPath();ctx.ellipse(o.x,o.y,8,5,0,0,Math.PI*2);ctx.fill();
      for(let i=0;i<7;i++){const x=o.x+Math.cos(i*2.4)*6,y=o.y+Math.sin(i*2.4)*4;rect(ctx,x,y,2,3,i%2?'#b1e2c1':'#3b8168');rect(ctx,x,y,1,1,'#fff4d5');}
      ctx.restore();
    });
    for(const c of r.cornPoints)if(c.collectedLap<r.actors[0].lap){
      const phase=time*4+c.x*.035,bounce=reduced?0:Math.round((Math.sin(phase)+1)*3);
      // Keep the ground marker at the pickup position while the coin bounces above it.
      rect(ctx,c.x-6,c.y+5,12,3,'#3b342477');
      ctx.save();ctx.translate(c.x,c.y-bounce);
      if(!reduced)ctx.scale(.55+.45*Math.abs(Math.cos(time*2.8+c.x*.035)),1);
      corn(ctx,0,0);ctx.restore();
      if(!reduced){const angle=time*2+c.x*.035,sx=Math.round(c.x+Math.cos(angle)*10),sy=Math.round(c.y-bounce+Math.sin(angle)*10);rect(ctx,sx-2,sy,5,1,'#fff7cf');rect(ctx,sx,sy-2,1,5,'#fff7cf');}
    }
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
      if(a.drifting&&!reduced)for(let i=0;i<3;i++)rect(ctx,a.x-Math.cos(a.angle)*(9+i*3),a.y-Math.sin(a.angle)*(9+i*3)+3,2,2,'#baa98b');
      if(a.boost>0||a.sprinting||a.cornerBoost>0) {
        const turbo=a.boost>0,dx=Math.cos(a.angle),dy=Math.sin(a.angle),pulse=reduced?0:Math.floor(time*24)%3;
        ctx.save();ctx.translate(a.x,a.y-5);ctx.rotate(a.angle);
        const length=reduced?9:(turbo?40:18)+pulse*3;
        rect(ctx,-12-length,-3,length,6,turbo?'#ed7545':'#eeb44d');
        rect(ctx,-10-length*.7,-2,length*.7,4,'#ffe692');
        rect(ctx,-15,-1,9,2,'#fffce0');ctx.restore();
        if(!reduced)for(let i=0;i<(turbo?12:5);i++) {
          const f=(time*2.8+i/8)%1,d=14+f*(turbo?55:28),side=(i%2?1:-1)*(5+f*5);
          const x=a.x-dx*d-dy*side,y=a.y-dy*d+dx*side-4;
          ctx.save();ctx.globalAlpha=1-f;ctx.translate(x,y);ctx.rotate(a.angle);
          rect(ctx,-4,0,turbo?9:5,1,i%2?'#fff2b8':'#d8ba81');ctx.restore();
        }
      }
      chicken(ctx,a.x,a.y,a.color,a.speed>5?Math.floor(time*(a.boost>0?24:a.sprinting?20:12))%4:0,Math.cos(a.angle)<-.1?-1:1,a.id===0?r.skin||'classic':'classic',1,a.id===0?r.outfit:null);
      if(r.combat){
        const gun=a.gun;ctx.save();ctx.translate(a.x,a.y-7);ctx.rotate(gun.aim);
        rect(ctx,2,gun.weapon==='potato'?-4:-2,gun.weapon==='pistol'?9:gun.weapon==='rifle'?22:17,gun.weapon==='potato'?8:4,gun.weapon==='potato'?'#a88a58':'#343a3d');rect(ctx,3,-1,6,3,'#976744');rect(ctx,14,-2,4,1,'#b0b9aa');
        if(gun.flash>0){rect(ctx,18,-4,8,8,'#f4bf5d');rect(ctx,19,-1,11,2,'#fff2b9');}ctx.restore();
        if(a.invulnerable>0){ctx.strokeStyle='#f9e9ba';ctx.strokeRect(a.x-10,a.y-22,20,25);}
        if(a.draft>.5&&!reduced){rect(ctx,a.x-10,a.y+7,6,1,'#9de4dc');rect(ctx,a.x+4,a.y+7,6,1,'#9de4dc');}
      }
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
    if(!reduced)for(const item of bg.scene) {
      if(item.type==='caravan') {
        const rise=(time*7+item.x)%13;
        rect(ctx,item.x+35+Math.sin(time)*2,item.y+4-rise,3,2,'#d4cec06b');
      }
      if(item.type==='bushnap'&&Math.sin(time*1.4+item.x)>.1)rect(ctx,item.x+18,item.y+2,2,1,P.cream);
    }
    tractorRig(ctx,r,time,reduced);
    crossScene(ctx,r,time,reduced);
    crowdAtmosphere(ctx,r,time,reduced);
    crowdBubble(ctx,r);
    if(r.combat)for(const b of r.bullets){if(b.weapon==='potato'){rect(ctx,b.x-4,b.y-10,8,7,'#d7b578');rect(ctx,b.x-2,b.y-9,2,2,'#88663c');continue;}ctx.strokeStyle='#ffe8a4';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(b.x,b.y-6);ctx.lineTo(b.x-b.vx*.018,b.y-b.vy*.018-6);ctx.stroke();}
    ctx.restore();
    if(r.combat)combatOverlay(ctx,r);
  }
  function drawPortrait(canvas,color,skin='classic',outfit=null) {
    const ctx=canvas.getContext('2d');
    ctx.imageSmoothingEnabled=false;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    chicken(ctx,canvas.width/2,canvas.height*.83,color,0,1,skin,1.8,outfit);
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
  function catalogDecor(ctx,key,x,y) {
    if(key==='caravan')prop(ctx,'caravan',x,y+12);
    if(key==='volvo')scrapCar(ctx,x,y+18,'740');
    if(key==='shed')prop(ctx,'wreckhouse',x,y+5);
    if(key==='statue'){
      rect(ctx,x+8,y+40,38,8,'#8c8980');ctx.save();ctx.translate(x+28,y+38);ctx.scale(1.6,1.6);
      pattern(ctx,bird,-12,-20,{i:'#8b642f',w:'#efce67',s:'#bd9142',r:'#f2df9e',o:'#efce67'});ctx.restore();
    }
    if(key==='sign49'){
      rect(ctx,x+5,y+8,52,32,'#293b3c');rect(ctx,x+7,y+10,48,28,'#594164');
      ctx.font='bold 27px monospace';ctx.fillStyle='#8bf5de';ctx.fillText('49',x+13,y+33);
      rect(ctx,x+10,y+40,3,9,'#70563f');rect(ctx,x+48,y+40,3,9,'#70563f');
    }
  }
  function drawCatalog(canvas,key) {
    const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,canvas.width,canvas.height);
    if(C.CATALOG[key].slot==='outfit')chicken(ctx,48,51,'cream',0,1,'classic',1.8,key);
    else catalogDecor(ctx,key,15,5);
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
    if(save.cup?.titles){rect(ctx,304,89,12,8,P.gold);rect(ctx,309,97,3,9,P.gold);rect(ctx,304,105,12,3,P.cream);}
    const level=Object.values(save.upgrades).reduce((a,b)=>a+b,0);
    coop(ctx,204,81,level,false);
    if(save.decor)catalogDecor(ctx,save.decor,45,67);
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
    for(const [x,y,c] of [[183,142,'cream'],[297,146,'rust'],[395,147,'sage']])chicken(ctx,x,y,c,Math.floor(time*3)%4,1,save.skin,1,save.outfit);
    // Comic fender-bender outside the farmhouse. No injured people.
    scrapCar(ctx,35,128,'240');
    ctx.save();ctx.translate(155,132);ctx.scale(-1,1);scrapCar(ctx,0,0,'740');ctx.restore();
    scrapCar(ctx,313,86,'850');
    for(let i=0;i<5;i++) {
      const h=6+((Math.floor(time*9)+i*3)%7),x=91+i*3;
      rect(ctx,x,150-h,4,h,'#c96539');rect(ctx,x+1,152-h,2,h-2,'#f2bf58');
    }
    if(time>0)for(let i=0;i<3;i++){const rise=(time*9+i*9)%25;rect(ctx,99+Math.sin(time+i)*3,137-rise,5,4,'#6b686577');}
    prop(ctx,'caravan',112,118);
    prop(ctx,'wreckhouse',370,78);
    prop(ctx,'bushnap',432,143);
    prop(ctx,'bottles',160,151);
    prop(ctx,'bottles',404,120);
    if(time>0){const rise=(time*7)%13;rect(ctx,147,119-rise,3,2,'#ddd3bf88');}
    for(const [x,y] of [[10,122],[435,123],[21,174],[311,169]])flowers(ctx,x,y,'spring');
    rect(ctx,286,91,2,34,P.brown);
    swedishFlag(ctx,288,91,15,9);
  }
  function drawWeapon(canvas,key){
    const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=false;
    rect(ctx,8,55,144,3,'#d8c9a3');
    if(key==='potato'){
      rect(ctx,20,26,104,23,'#687653');rect(ctx,25,26,94,4,'#a9b58a');rect(ctx,117,23,10,29,'#34483e');rect(ctx,38,49,12,9,'#91653e');rect(ctx,63,24,7,27,'#b9a77d');rect(ctx,90,24,7,27,'#b9a77d');rect(ctx,134,32,13,11,'#cfa96a');rect(ctx,138,34,3,2,'#886440');
    }else{
      const length=key==='pistol'?48:key==='rifle'?106:88;
      rect(ctx,20,29,length,10,'#3d484b');rect(ctx,23,29,length-4,3,'#a2aaa5');rect(ctx,28,39,12,17,'#90653d');
      if(key!=='pistol'){rect(ctx,9,35,24,14,'#90653d');rect(ctx,51,38,27,6,'#b7854b');rect(ctx,20+length,29,4,10,'#202e32');}
      if(key==='rifle'){rect(ctx,57,20,34,6,'#334546');rect(ctx,62,25,3,5,'#3d484b');rect(ctx,84,25,3,5,'#3d484b');}
      if(key==='shotgun')rect(ctx,48,40,37,4,'#27393d');
    }
  }
  root.FarmArt= {
    drawWeapon,drawCatalog,catalogDecor,crossRider,crossScene,crowdBubble,P,bird,rect,prop,scrapCar,swedishFlag,farmer,chicken,tree,coop,egg,corn,hay,mud,makeScene,makeBackground,render,drawPortrait,drawUpgrade,drawFarm
  };
})(window);
