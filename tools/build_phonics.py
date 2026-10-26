"""Optional build dependency: espeakng-loader 0.2.4. Ships audio, not its engine.
Render isolated eSpeak phonemes, not letter names, for short regular words.
"""
import ctypes as C,wave,sys,array
from pathlib import Path
import espeakng_loader as loader
lib=loader.load_library();lib.espeak_Initialize.argtypes=[C.c_int,C.c_int,C.c_char_p,C.c_int]
rate=lib.espeak_Initialize(2,0,str(Path(loader.get_data_path()).parent).encode(),0)
lib.espeak_SetVoiceByName(b'en-us');lib.espeak_SetParameter(1,125,0)
CALLBACK=C.CFUNCTYPE(C.c_int,C.POINTER(C.c_short),C.c_int,C.c_void_p)
chunks=[]
@CALLBACK
def callback(samples,n,events):
 if samples and n:chunks.append(C.string_at(samples,n*2))
 return 0
lib.espeak_SetSynthCallback(callback)
lib.espeak_Synth.argtypes=[C.c_void_p,C.c_size_t,C.c_uint,C.c_int,C.c_uint,C.c_uint,C.c_void_p,C.c_void_p]
out=Path(__file__).resolve().parents[1]/'assets/neighborhood/phonics'
for name,phoneme in {'s':'s','u':'V','n':'nnnnn','p':'p','o':'0','t':'t','m':'mmm','d':'d@-','i':'I','g':'g'}.items():
 chunks.clear();text=('[[%s]]'%phoneme).encode()+b'\0';lib.espeak_Synth(text,len(text),0,1,0,0x101,None,None);lib.espeak_Synchronize()
 samples=array.array('h',b''.join(chunks))
 # A voiced stop needs a tiny release context; trim the following weak vowel
 # rather than teaching a letter name or an elongated 'duh'.
 if name=='d':samples=samples[:int(rate*.105)]
 peak=max(map(abs,samples),default=0)
 if peak<100:raise RuntimeError('Silent phoneme '+name)
 gain=15000/peak
 samples=array.array('h',(int(v*gain) for v in samples))
 fade=min(int(rate*.005),len(samples)//4)
 for i in range(fade):samples[i]=int(samples[i]*i/fade);samples[-1-i]=int(samples[-1-i]*i/fade)
 samples.extend([0]*int(rate*.04));audio=samples.tobytes()
 if len(audio)<100:raise RuntimeError('Empty phoneme '+name)
 with wave.open(str(out/(name+'.wav')),'wb') as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(rate);f.writeframes(audio)
 print(name,len(audio))
