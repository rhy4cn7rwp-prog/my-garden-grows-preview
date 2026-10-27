"""Build the immutable scene catalog from reviewed object geometry and source art.
Coordinates are manually reviewed normalized bounds, not inferred icon hotspots.
"""
import argparse,json,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[1];base=root/'assets/job-pictures';p=argparse.ArgumentParser();p.add_argument('--partial',action='store_true');args=p.parse_args()
scenes=base/'scenes.json'
if not scenes.exists():
 data=json.loads(subprocess.check_output(['node','-p',"JSON.stringify(require('./src/job-gallery-data'))"],cwd=root,text=True))
 for row in data['hidden']:row.pop('objects',None)
 scenes.write_text(json.dumps(data,indent=2)+'\n')
data=json.loads(scenes.read_text());bounds=json.loads((base/'hidden-objects.json').read_text());names={'key':'Brass key','can':'Watering can','glove':'Gardening glove','rake':'Garden rake','carrot':'Carrot','horseshoe':'Horseshoe','nest':'Bird nest','seeds':'Seed packet','strawberry':'Strawberry','butterfly':'Butterfly','ladybug':'Ladybug','shovel':'Small shovel'}
for row in data['hidden']:
 mapped=bounds.get(row['id'],{});row['objects']=[]
 if not args.partial:assert all(key in mapped for key in names),row['id']
 for key,name in names.items():
  if key not in mapped:continue
  x,y,w,h=mapped[key][:4];assert 0<x<1 and 0<y<1 and 0<w<1 and 0<h<1,(row['id'],key)
  obj={'id':mapped.get('_ids',{}).get(key,key),'name':mapped.get('_names',{}).get(key,name),'x':x,'y':y,'w':w,'h':h}
  if len(mapped[key])>4:obj['regions']=mapped[key][4]
  row['objects'].append(obj)
for kind,rows in data.items():
 assert len(rows)>=30 and len({r['id'] for r in rows})==len(rows)
 if not args.partial:
  for row in rows:assert (root/row['file']).exists(),row['file']
source="/* Generated from reviewed source metadata. Append scene IDs; never reorder them. */\n(function(root){'use strict';const data="+json.dumps(data,indent=2)+";if(typeof module!=='undefined')module.exports=data;root.JobGallery=data;})(typeof globalThis!=='undefined'?globalThis:this);\n"
(root/'src/job-gallery-data.js').write_text(source);print('Reviewed hidden scenes:',sum(len(r['objects'])>=12 for r in data['hidden']),'/',len(data['hidden']))
