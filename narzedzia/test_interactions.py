#!/usr/bin/env python3
"""Tests mobile menu, animation tabs and contact form without submitting any message."""
import subprocess,time,os,signal,json,websocket,requests,threading,functools,http.server
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
PORT=8967
CHROME_PORT=9477
class QuietServer(http.server.SimpleHTTPRequestHandler):
    def log_message(self,fmt,*args):pass
handler=functools.partial(QuietServer,directory=str(ROOT))
server=http.server.ThreadingHTTPServer(('127.0.0.1',PORT),handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
chrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
proc=subprocess.Popen([chrome,'--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--no-sandbox',
    f'--remote-debugging-port={CHROME_PORT}','--remote-allow-origins=*',
    '--user-data-dir=/tmp/as-interactions-9477','--window-size=1000,900',
    f'http://127.0.0.1:{PORT}/'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,start_new_session=True)
ws=None
try:
    for _ in range(80):
        try:
            entries=requests.get(f'http://127.0.0.1:{CHROME_PORT}/json/list',timeout=1).json()
            target=next(v for v in entries if v.get('type')=='page' and str(PORT) in v.get('url',''))
            ws=websocket.create_connection(target['webSocketDebuggerUrl'],timeout=7)
            break
        except Exception:time.sleep(.13)
    if not ws:raise RuntimeError('Chrome debugger failed')
    n=0
    def cmd(method,params=None):
        nonlocal_dummy=None
        global n
        n+=1;cid=n
        ws.send(json.dumps({'id':cid,'method':method,'params':params or {}}))
        limit=time.time()+9
        while time.time()<limit:
            packet=json.loads(ws.recv())
            if packet.get('id')==cid:
                if 'error' in packet:raise RuntimeError(packet['error'])
                return packet.get('result',{})
        raise TimeoutError(method)
    def js(expr):
        result=cmd('Runtime.evaluate',{'expression':expr,'returnByValue':True})
        obj=result['result']
        if obj.get('subtype')=='error':raise RuntimeError(obj.get('description'))
        return obj.get('value')
    def load(page,width):
        cmd('Emulation.setDeviceMetricsOverride',{'width':width,'height':900,'deviceScaleFactor':1,'mobile':width<850})
        cmd('Page.navigate',{'url':f'http://127.0.0.1:{PORT}{page}'})
        for _ in range(50):
            time.sleep(.12)
            if js('document.readyState')=='complete':break
        else:raise RuntimeError('Navigation not completed')
    cmd('Page.enable');cmd('Runtime.enable')
    load('/',390)
    info=json.loads(js('JSON.stringify({width:innerWidth,scroll:document.documentElement.scrollWidth,title:document.title})'))
    assert info['scroll']<=390,info
    menu=json.loads(js('(()=>{let b=document.querySelector(".menu-toggle");b.click();return JSON.stringify({expanded:b.getAttribute("aria-expanded"),body:document.body.classList.contains("menu-open")})})()'))
    assert menu['expanded']=='true' and menu['body'] is True,menu
    closed=json.loads(js('(()=>{document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}));let b=document.querySelector(".menu-toggle");return JSON.stringify({expanded:b.getAttribute("aria-expanded"),body:document.body.classList.contains("menu-open")})})()'))
    assert closed['expanded']=='false' and closed['body'] is False,closed
    print('MOBILE_MENU_ESCAPE_PASS')
    stocks=json.loads(js('(()=>{document.querySelector("[data-scenario=stock]").click();return JSON.stringify({left:document.getElementById("as-flow-left").textContent,selected:document.querySelector("[data-scenario=stock]").getAttribute("aria-selected")})})()'))
    assert stocks['left']=='Hurtownia' and stocks['selected']=='true',stocks
    docs=json.loads(js('(()=>{document.querySelector("[data-scenario=documents]").click();return JSON.stringify({bottom:document.getElementById("as-flow-bottom").textContent,selected:document.querySelector("[data-scenario=documents]").getAttribute("aria-selected")})})()'))
    assert 'KSeF' in docs['bottom'] and docs['selected']=='true',docs
    print('THREE_SCENARIO_TABS_PASS')
    load('/opisz-projekt.html',390)
    form=json.loads(js('JSON.stringify({width:innerWidth,scroll:document.documentElement.scrollWidth,hasForm:!!document.getElementById("as-contact-form"),fields:["imie","email","firma","telefon","typ","budzet","narzedzia","dzis","problem","zgoda","website"].map(k=>!!document.querySelector("[name="+k+"]")),button:document.querySelector("#as-contact-form button[type=submit]").disabled,valid:document.getElementById("as-contact-form").checkValidity()})'))
    assert form['scroll']<=390 and form['hasForm'] and all(form['fields']) and not form['button'] and not form['valid'],form
    print('MOBILE_FORM_FIELDS_AND_VALIDATION_PASS_NO_EMAIL_SENT')
    load('/uslugi-automatyzacji.html',1440)
    hub=json.loads(js('JSON.stringify({width:innerWidth,scroll:document.documentElement.scrollWidth,items:document.querySelectorAll(".as-hub-card").length})'))
    assert hub['scroll']<=1440 and hub['items']==8,hub
    print('DESKTOP_SERVICE_DIRECTORY_PASS')
    print('INTERACTION_QA_ALL_PASSED')
finally:
    if ws:
        try:ws.close()
        except:pass
    try:os.killpg(proc.pid,signal.SIGTERM)
    except:pass
    server.shutdown()
