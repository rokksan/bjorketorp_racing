// Export exactly the same pixel primitives as the runtime into reusable SVG assets.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const sandbox={window:{FarmRace:require('../js/core.js')}};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/art.js'),'utf8'),sandbox);
const art=sandbox.window.FarmArt;
function svg(width,height,draw){
  const pieces=[],stack=[];let transform={x:0,y:0,sx:1,sy:1};
  const ctx={fillStyle:'#000',save(){stack.push({...transform});},restore(){transform=stack.pop();},translate(x,y){transform.x+=x*transform.sx;transform.y+=y*transform.sy;},scale(x,y){transform.sx*=x;transform.sy*=y;},fillRect(x,y,w,h){const {sx,sy}=transform;const px=transform.x+x*sx,py=transform.y+y*sy;pieces.push(`<rect x="${Math.min(px,px+w*sx)}" y="${Math.min(py,py+h*sy)}" width="${Math.abs(w*sx)}" height="${Math.abs(h*sy)}" fill="${this.fillStyle}"/>`);}};
  draw(ctx);return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">${pieces.join('')}</svg>\n`;
}
const exportFile=(file,w,h,draw)=>fs.writeFileSync(path.join(__dirname,'../assets',file),svg(w,h,draw));
for(const [folder,name,color] of [['chicken','player-chicken','cream'],['opponents','opponent-chicken','rust']]){
 exportFile(`${folder}/${name}.svg`,24,26,ctx=>art.chicken(ctx,12,21,color));
 exportFile(`${folder}/${name}-sheet.svg`,96,26,ctx=>{for(let i=0;i<4;i++)art.chicken(ctx,12+i*24,21,color,i);});
}
for(const [key,c] of Object.entries(sandbox.window.FarmRace.CHARACTERS))exportFile(`chicken/${key}-equipped.svg`,128,34,ctx=>{for(let i=0;i<4;i++)art.chicken(ctx,16+i*32,27,c.color,i);});
exportFile('obstacles/hay-bale.svg',18,14,ctx=>art.hay(ctx,8,8));
exportFile('obstacles/mud-puddle.svg',20,12,ctx=>art.mud(ctx,10,6));
exportFile('pickups/boost-egg.svg',12,16,ctx=>art.egg(ctx,6,9,'boost'));
exportFile('pickups/mud-bomb.svg',12,16,ctx=>art.egg(ctx,6,9,'mud'));
exportFile('pickups/shield-egg.svg',12,16,ctx=>art.egg(ctx,6,9,'shield'));
exportFile('pickups/corn.svg',10,12,ctx=>art.corn(ctx,5,6));
exportFile('environment/tree.svg',34,34,ctx=>art.tree(ctx,0,0));
exportFile('environment/apple-tree.svg',34,34,ctx=>art.tree(ctx,0,0,'apple','autumn'));
exportFile('environment/coop.svg',74,50,ctx=>art.coop(ctx,0,0,7));
for(const [type,w,h] of [['tractor',36,28],['barn',66,50],['pumpkins',26,16],['barrels',25,20],['lantern',12,25],['volvo240',70,34],['volvo740',70,34],['volvo850',70,34],['caravan',47,32],['wreckhouse',44,42],['bottles',29,23],['bushnap',32,28]])exportFile(`environment/${type}.svg`,w,h,ctx=>art.prop(ctx,type,1,4));
exportFile('environment/angry-farmer.svg',36,46,ctx=>art.farmer(ctx,{x:16,y:34,id:0,color:'#a84b3e',windup:0,mood:'argue'},0,true,true));
fs.writeFileSync(path.join(__dirname,'../assets/asset-manifest.json'),JSON.stringify({version:2,style:{name:'bjorketorp-16-bit-farm',perspective:'top-down-three-quarter',baseResolution:{width:480,height:300},pixelGrid:1,palette:art.P},sourceOfTruth:'js/art.js',exportCommand:'node tools/export-assets.cjs',characters:Object.fromEntries(Object.entries(sandbox.window.FarmRace.CHARACTERS).map(([id,c])=>[id,{name:c.name,source:`assets/chicken/${id}-equipped.svg`,frameWidth:32,frameHeight:34,anchor:{x:16,y:27}}])),sprites:{playerChicken:{source:'assets/chicken/player-chicken-sheet.svg',frameWidth:24,frameHeight:26,anchor:{x:12,y:21},animations:{idle:{frames:[0],fps:1},run:{frames:[0,1,2,3],fps:12},boost:{frames:[0,1,2,3],fps:18}}}},environment:['assets/environment/tree.svg','assets/environment/apple-tree.svg','assets/environment/coop.svg',...['tractor','barn','pumpkins','barrels','lantern','angry-farmer','volvo240','volvo740','volvo850','caravan','wreckhouse','bottles','bushnap'].map(type=>`assets/environment/${type}.svg`)],pickups:['assets/pickups/boost-egg.svg','assets/pickups/mud-bomb.svg','assets/pickups/shield-egg.svg','assets/pickups/corn.svg'],renderingRules:{nearestNeighbor:true,sortActorsByY:true,decorationClearance:'Full visual bounds must be outside track.width + 5; see core.rectangleClear.'},audio:{"source": "js/audio.js", "recordings": [{"title": "Hillbilly Swing", "source": "assets/audio/hillbilly-swing.mp3", "artist": "Kevin MacLeod", "license": "CC BY 4.0"}, {"title": "River Valley Breakdown", "source": "assets/audio/river-valley-breakdown.mp3", "artist": "Kevin MacLeod", "license": "CC BY 4.0"}, {"title": "Corncob", "source": "assets/audio/corncob.mp3", "artist": "Kevin MacLeod", "license": "CC BY 4.0"}, {"title": "Still Pickin", "source": "assets/audio/still-pickin.mp3", "artist": "Kevin MacLeod", "license": "CC BY 4.0"}], "attribution": "assets/audio/ATTRIBUTION.md", "channels": ["music", "ambience", "sfx"]}},null,2)+'\n');
console.log('Exported 30 original pixel-art SVGs and manifest.');
