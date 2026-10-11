/* Automatyzacje Sklepów 2026 - accessible microinteractions and real brief submit */
(function(){
'use strict';
var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var scenarios={
  orders:{title:"Zamówienia bez przepisywania",sub:"Przykładowy obieg zamówienia",left:"Sklep / Allegro",mid:"BaseLinker",right:"Magazyn",bottom:"Faktura / KSeF",label:"zamówienie → realizacja",detail:"Dane zamówienia przechodzą przez systemy zgodnie z ustalonymi regułami."},
  stock:{title:"Stany i ceny pod kontrolą",sub:"Przykładowa synchronizacja produktów",left:"Hurtownia",mid:"Reguły synchronizacji",right:"Sklep online",bottom:"Marketplace",label:"stan / cena → kanały",detail:"Zmiany produktów, stanów i cen są sprawdzane przed aktualizacją kanałów."},
  documents:{title:"Dokumenty powstają z danych",sub:"Przykładowy obieg dokumentów",left:"Zamówienie",mid:"Reguły dokumentów",right:"Fakturownia",bottom:"KSeF / księgowość",label:"zamówienie → dokument",detail:"Dane nie wymagają ponownego wpisywania, a błędy trafiają do weryfikacji."}
};
function text(id,val){var e=document.getElementById(id);if(e)e.textContent=val;}
var tabs=[].slice.call(document.querySelectorAll('[data-scenario]'));
function activate(name,focus){
  var item=scenarios[name];if(!item)return;
  tabs.forEach(function(b){var on=b.dataset.scenario===name;b.setAttribute('aria-selected',on?'true':'false');b.tabIndex=on?0:-1;if(on&&focus)b.focus();});
  text('as-flow-title',item.title);text('as-flow-sub',item.sub);
  text('as-flow-left',item.left);text('as-flow-mid',item.mid);
  text('as-flow-right',item.right);text('as-flow-bottom',item.bottom);
  text('as-flow-label',item.label);text('as-flow-detail',item.detail);
}
tabs.forEach(function(el,i){
  el.addEventListener('click',function(){activate(el.dataset.scenario);});
  el.addEventListener('keydown',function(ev){
    if(ev.key!=='ArrowRight'&&ev.key!=='ArrowLeft'&&ev.key!=='Home'&&ev.key!=='End')return;
    ev.preventDefault();
    var next=ev.key==='Home'?0:ev.key==='End'?tabs.length-1:(i+(ev.key==='ArrowRight'?1:tabs.length-1))%tabs.length;
    activate(tabs[next].dataset.scenario,true);
  });
});
if(tabs.length)activate('orders');
if('IntersectionObserver' in window&&!reduce){
  var io=new IntersectionObserver(function(items){
    items.forEach(function(item){if(item.isIntersecting){item.target.classList.add('is-visible');io.unobserve(item.target);}});
  },{threshold:.09,rootMargin:'0px 0px -20px 0px'});
  document.querySelectorAll('.fh-reveal').forEach(function(e){io.observe(e);});
}else{document.querySelectorAll('.fh-reveal').forEach(function(e){e.classList.add('is-visible');});}
/* Structured e-commerce inquiry with true delivery; submit only after token bootstrap */
var form=document.getElementById('as-contact-form');
if(!form)return;
var message=document.getElementById('as-contact-status');
var sendButton=form.querySelector('button[type=submit]');
if(sendButton){sendButton.disabled=false;status('Gotowe do wypełnienia. Wyślij opis, a sprawdzę problem.',true);}
var token=null,requestId=null,blocked=false;
var storeKey='as-contact-draft-v1';
var maxSource=950;
function status(t,ok){if(message){message.textContent=t;message.style.color=ok?'#267452':'#a04138';}}
function clean(str,n){return String(str||'').trim().slice(0,n);}
function buildSource(){
 var p=new URLSearchParams(location.search),fields=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','zrodlo'],arr=[];
 fields.forEach(function(k){var v=p.get(k);if(v)arr.push(k+'='+clean(v,100));});
 try{
  var saved=sessionStorage.getItem('as-first-touch');
  if(saved)arr.unshift(saved);
 }catch(e){}
 arr.push('path='+location.pathname);
 return clean(arr.join(' | '),maxSource);
}
try{
 if(!sessionStorage.getItem('as-first-touch')){
  var p=new URLSearchParams(location.search),pairs=[];
  ['utm_source','utm_medium','utm_campaign','zrodlo'].forEach(function(k){
   if(p.get(k))pairs.push(k+'='+clean(p.get(k),100));
  });
  if(document.referrer){try{var ref=new URL(document.referrer);if(ref.hostname!==location.hostname)pairs.push('ref='+ref.hostname);}catch(e){}}
  if(pairs.length)sessionStorage.setItem('as-first-touch',clean(pairs.join(' | '),400));
 }
}catch(e){}
try{
 var old=JSON.parse(sessionStorage.getItem(storeKey)||'{}');
 Object.keys(old).forEach(function(k){var el=form.elements.namedItem(k);if(el&&k!=='zgoda'&&k!=='website'&&typeof old[k]==='string')el.value=old[k];});
}catch(e){}
function snapshot(){
 try{
  var fd=new FormData(form),o={};
  ['imie','email','firma','telefon','typ','dzis','problem','narzedzia','budzet'].forEach(function(k){o[k]=fd.get(k)||'';});
  sessionStorage.setItem(storeKey,JSON.stringify(o));
 }catch(e){}
}
form.addEventListener('input',snapshot);
function uuid(){
 if(window.crypto&&crypto.randomUUID)return crypto.randomUUID();
 var bytes=new Uint8Array(16);
 if(window.crypto&&crypto.getRandomValues){crypto.getRandomValues(bytes);bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;}
 else return null;
 var h=Array.from(bytes).map(function(b){return b.toString(16).padStart(2,'0');}).join('');
 return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
}
async function session(){
 var response=await fetch('/api/contact/session',{method:'GET',credentials:'same-origin',cache:'no-store',headers:{'Accept':'application/json'}});
 var result=await response.json();
 if(!response.ok||!result.ready||!result.token)throw new Error('Formularz jest chwilowo niedostępny. Napisz na kontakt@maciejgryziec.pl.');
 return result.token;
}
var queryType=new URLSearchParams(location.search).get('typ');
if(queryType){var sel=form.elements.namedItem('typ');if(sel){[].slice.call(sel.options).some(function(o){if(o.value===queryType||o.text===queryType){sel.value=o.value;return true;}return false;});}}
form.addEventListener('submit',async function(ev){
 ev.preventDefault();
 if(blocked||!form.reportValidity())return;
 if(!form.elements.namedItem('zgoda').checked){status('Potwierdź, że zgadzasz się na kontakt w sprawie zapytania.',false);return;}
 blocked=true;sendButton.disabled=true;sendButton.textContent='Wysyłanie...';
 var fd=new FormData(form);
 var data={
 imie:clean(fd.get('imie'),120),email:clean(fd.get('email'),180),
 firma:clean(fd.get('firma'),180),telefon:clean(fd.get('telefon'),50),
 typ:clean(fd.get('typ'),200),dzis:clean(fd.get('dzis'),2500),
 problem:clean(fd.get('problem'),1500),narzedzia:clean(fd.get('narzedzia'),500),
 uzytkownicy:'',budzet:clean(fd.get('budzet'),100),efekt:'',
 zrodlo:buildSource(),website:clean(fd.get('website'),100),request_id:uuid()
 };
 if(!data.request_id){status('Ta przeglądarka nie obsługuje bezpiecznego wysyłania. Napisz bezpośrednio na kontakt@maciejgryziec.pl.',false);blocked=false;sendButton.disabled=false;sendButton.textContent='Wyślij zapytanie →';return;}
 try{
  var t=await session();
  data.token=t;
  // Server rejects tokens younger than 2 seconds as bot protection.
  await new Promise(function(resolve){setTimeout(resolve,2200);});
  var r=await fetch('/api/contact',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','Accept':'application/json','X-Contact-Form':'1'},body:JSON.stringify(data)});
  var result=await r.json();
  if(!r.ok||!result.ok){throw new Error(result.message||'Nie udało się wysłać wiadomości. Zachowaj tekst i spróbuj skontaktować się mailowo.');}
  status('Wiadomość została wysłana. Odezwę się na podany adres.',true);
  if(window.umami&&typeof window.umami.track==='function'){window.umami.track('as-brief-sent',{category:data.typ});}
  try{sessionStorage.removeItem(storeKey);}catch(e){}
  form.reset();sendButton.textContent='Wysłano';sendButton.disabled=true;
  return;
 }catch(e){
  status(e.message||'Nie udało się potwierdzić wysyłki. Napisz bezpośrednio na kontakt@maciejgryziec.pl.',false);
  if(window.umami&&typeof window.umami.track==='function'){window.umami.track('as-brief-error');}
  sendButton.disabled=false;sendButton.textContent='Spróbuj wysłać ponownie';
  blocked=false;
 }
});
})();
