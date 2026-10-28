"""Read-only alpha-channel checks; visual object-only review is also required."""
from PIL import Image
from pathlib import Path
import json
base=Path(__file__).resolve().parents[1]/'assets/job-clues'
for row in json.loads((base/'provenance.json').read_text()):
 for file in [row['source'],row['file']]:
  im=Image.open(base/file).convert('RGBA');alpha=im.getchannel('A');assert alpha.getextrema()==(0,255),(file,alpha.getextrema());assert all(alpha.getpixel(p)<8 for p in [(0,0),(im.width-1,0),(0,im.height-1),(im.width-1,im.height-1)]),file
 print('PASS isolated transparent clue',row['id'])
