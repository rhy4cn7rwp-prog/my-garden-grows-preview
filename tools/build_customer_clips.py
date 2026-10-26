# Analyze atlas alpha to describe SVG clipping geometry; never writes raster art.
from PIL import Image
from scipy import ndimage as nd
import numpy as np,json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
def simplify(points,tolerance=.85):
 if len(points)<=2:return points
 start,end=np.array(points[0]),np.array(points[-1]);direction=end-start
 delta=np.array(points)-start
 distance=np.linalg.norm(delta,axis=1) if not np.any(direction) else np.abs(direction[0]*delta[:,1]-direction[1]*delta[:,0])/np.linalg.norm(direction)
 at=int(np.argmax(distance))
 if distance[at]<=tolerance:return [points[0],points[-1]]
 return simplify(points[:at+1],tolerance)[:-1]+simplify(points[at:],tolerance)
result={}
for atlas in ['customers','customers-expanded']:
 im=np.array(Image.open(root/f'assets/farmers-market/{atlas}.webp'))
 frames=([[12,0,505,724],[522,0,575,724],[1100,0,520,724],[1630,0,542,724]] if atlas=='customers' else [[i%6*209,[0,330,642,951][i//6],209,[329,310,309,303][i//6]] for i in range(24)])
 profiles=[]
 for i,(x,y,w,h) in enumerate(frames):
  alpha=im[y:y+h,x:x+w,3].copy()
  # Three figures touch an adjacent person's pixels at the cell edge. These
  # reviewed seams follow clothing boundaries; alpha connectivity alone cannot
  # distinguish the people where their sleeves meet in the source atlas.
  seams={6:('right',[(0,209),(200,205),(215,201),(230,200),(245,199),(275,200),(309,200)]),
         8:('left',[(0,0),(230,4),(240,4),(250,8),(260,11),(275,20),(290,23),(309,25)]),
         18:('right',[(0,209),(160,190),(185,188),(200,191),(215,193),(230,194),(245,193),(260,197),(275,199),(290,192),(302,192)])}
  seam=seams.get(i) if atlas=='customers-expanded' else None
  allowed=np.ones(alpha.shape,dtype=bool)
  if seam:
   side,points=seam
   edge=np.interp(np.arange(h),*[np.array(points)[:,j] for j in [0,1]])
   allowed=np.arange(w)[None,:] >= edge[:,None] if side=='left' else np.arange(w)[None,:] < edge[:,None]
   alpha[~allowed]=0
  core=nd.binary_opening(alpha>100,iterations=2)
  labels,n=nd.label(core);counts=np.bincount(labels.ravel());counts[0]=0
  core=labels==np.argmax(counts)
  # Fill transparent holes for geometry only; original image alpha retains them.
  core=nd.binary_fill_holes(core)
  core=nd.binary_dilation(core,iterations=2) & allowed
  points=[];left=[];right=[]
  for yy in range(h):
   xs=np.flatnonzero(core[yy]);
   if len(xs):left.append((int(xs[0])+x,yy+y));right.append((int(xs[-1])+x+1,yy+y))
  # Simplify reviewed row envelopes to sub-pixel source-space tolerance.
  points=simplify(left)+simplify(right[::-1])
  profiles.append({'bounds':[x,y,w,h],'outline':points})
 result[atlas]=profiles
data=json.dumps(result,separators=(',',':'))
(root/'src/customer-portraits.js').write_text("""/* Source-space silhouette clips remove neighboring atlas fragments without
 changing original portrait pixels, character identity or transaction state.
 Regenerate with tools/build_customer_clips.py; review the browser contact sheet. */
(function(root){
 const atlases = """+data+""";
 function forProfile(profile, fallback=0) {
  const expanded=Number.isInteger(profile?.portrait), key=expanded?'customers-expanded':'customers',
   index=expanded?profile.portrait:(profile?.legacyPortrait ?? fallback),
   frame=atlases[key][index];
  return {...frame,atlas:key,index,width:expanded?1254:2172,height:expanded?1254:724,
   maskId:'market-customer-mask-'+key+'-'+index};
 }
 const api={atlases,forProfile};
 if(typeof module!=='undefined')module.exports=api;
 root.MarketPortraits=api;
})(typeof globalThis!=='undefined'?globalThis:this);
""")
