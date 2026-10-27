"""Import original image-generator PNGs, preserve sources, encode WebP delivery copies.
No cropping, recoloring or layout changes; distinct originals remain distinct assets.
"""
import argparse,json,shutil,subprocess,hashlib,struct
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
root=Path(__file__).resolve().parents[1];base=root/'assets/job-pictures'
p=argparse.ArgumentParser();p.add_argument('--import-map');p.add_argument('--kind',choices=['hidden','sliding']);args=p.parse_args()
if args.import_map:
 for item in json.loads(Path(args.import_map).read_text()):
  assert all(c in 'abcdefghijklmnopqrstuvwxyz0123456789-' for c in item['id'])
  dest=base/'source'/args.kind/(item['id']+'.png');dest.parent.mkdir(parents=True,exist_ok=True)
  if not dest.exists():shutil.copy2(item['path'],dest)
def encode(source):
 kind=source.parent.name;dest=base/kind/(source.stem+'.webp');dest.parent.mkdir(parents=True,exist_ok=True)
 if not dest.exists():subprocess.run(['ffmpeg','-nostdin','-loglevel','error','-i',str(source),'-c:v','libwebp','-quality','90','-compression_level','6','-y',str(dest)],check=True)
 data=source.read_bytes();width,height=struct.unpack('>II',data[16:24]);assert width==height and width>=1000,(source,width,height)
 return {'kind':kind,'id':source.stem,'source':str(source.relative_to(base)),'file':str(dest.relative_to(root)),'width':width,'height':height,'sourceSha256':hashlib.sha256(data).hexdigest(),'deliverySha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'bytes':dest.stat().st_size,'origin':'original image generation'}
with ThreadPoolExecutor(max_workers=4) as pool:records=list(pool.map(encode,sorted((base/'source').glob('*/*.png'))))
(base/'provenance.json').write_text(json.dumps(records,indent=2)+'\n');print('Originals preserved and optimized:',len(records),'; delivery bytes:',sum(x['bytes'] for x in records))
