#!/usr/bin/env python3
"""Headless Chrome responsive smoke test, no production writes or real email."""
import json,time,requests,websocket,sys
BASE="http://127.0.0.1:9393"
targets=requests.get(BASE+"/json/list",timeout=4).json()
pages=[t for t in targets if t.get("type")=="page"]
assert pages
ws=websocket.create_connection(pages[0]["webSocketDebuggerUrl"],timeout=8)
counter=0
def call(method,params=None):
 global counter
 counter+=1;n=counter
 ws.send(json.dumps({"id":n,"method":method,"params":params or {}}))
 deadline=time.time()+7
 while time.time()<deadline:
  p=json.loads(ws.recv())
  if p.get("id")==n:
   if "error" in p:raise RuntimeError((method,p["error"]))
   return p.get("result",{})
 raise TimeoutError(method)
def expression(js):
 out=call("Runtime.evaluate",{"expression":js,"returnByValue":True,"awaitPromise":True})
 d=out.get("result",{})
 if d.get("subtype")=="error":raise RuntimeError(d)
 return d.get("value")
call("Page.enable")
call("Runtime.enable")
maxfail=0
for page in ("/","/opisz-projekt.html","/uslugi-automatyzacji.html"):
 call("Page.navigate",{"url":"http://127.0.0.1:8961"+page})
 time.sleep(.4)
 for width in (320,360,390,430,768,1024,1440):
  call("Emulation.setDeviceMetricsOverride",{"width":width,"height":850,"deviceScaleFactor":1,"mobile":True,"screenWidth":width,"screenHeight":850})
  time.sleep(.17)
  js=r"""(()=>{let w=innerWidth,sw=document.documentElement.scrollWidth,bw=document.body.scrollWidth;
  const bad=[];document.querySelectorAll('body *').forEach(e=>{
    if(e.getClientRects().length===0)return;
    const r=e.getBoundingClientRect();
    if(r.width>10 && r.right>w+3 && getComputedStyle(e).position!=='absolute' &&
       !['svg','SVG','path','g','rect','text','line','circle'].includes(e.tagName)){
       bad.push({tag:e.tagName.toLowerCase(),cls:typeof e.className==='string'?e.className.slice(0,42):'',
         left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width)});
    }
  });
  return {view:w,html:sw,body:bw,bad:bad.slice(0,5),
          menu:document.querySelector('.menu-toggle')?getComputedStyle(document.querySelector('.menu-toggle')).display:'',
          content:document.querySelector('.fh-hero-copy')?.getBoundingClientRect().width||0,
          form:document.querySelector('#as-contact-form')?.getBoundingClientRect().width||0};
  })()"""
  d=expression(js)
  okay=d['html']<=width+1 and d['body']<=width+1
  if not okay:maxfail+=1
  print(f"{page:28} {width:4} {'OK' if okay else 'FAIL'}",json.dumps(d,ensure_ascii=False),flush=True)
call("Emulation.clearDeviceMetricsOverride")
ws.close()
if maxfail:raise SystemExit(f"RESPONSIVE QA: {maxfail} viewports overflow")
print("RESPONSIVE QA: ALL VIEWPORTS OK",flush=True)
