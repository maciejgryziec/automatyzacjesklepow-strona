(function(){
  var spokoj = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";

  // kartony: rysowane izometrycznie na regale
  document.querySelectorAll("svg.kartony").forEach(function(svg){
    function wielokat(pkt, kolor, klasa){
      var p = document.createElementNS(NS,"polygon");
      p.setAttribute("points", pkt.map(function(q){return q.join(",")}).join(" "));
      p.setAttribute("fill", kolor); if (klasa) p.setAttribute("class", klasa); return p;
    }
    function karton(cx, cy, s, h, napis, zero, par, o){
      var g = document.createElementNS(NS,"g"); g.setAttribute("class","karton");
      g.style.setProperty("--s", par + "px"); g.style.setProperty("--o", o);
      var w = s, d = s*0.5;
      g.appendChild(wielokat([[cx,cy-h],[cx+w,cy-h-d],[cx,cy-h-2*d],[cx-w,cy-h-d]],"#eacf9d"));
      g.appendChild(wielokat([[cx-w,cy-d],[cx,cy],[cx,cy-h],[cx-w,cy-h-d]],"#c9a36c"));
      g.appendChild(wielokat([[cx,cy],[cx+w,cy-d],[cx+w,cy-h-d],[cx,cy-h]],"#a97f4a"));
      g.appendChild(wielokat([[cx-w*0.15,cy-h-d*0.85],[cx+w*0.85,cy-h-d*1.35],[cx+w*0.85,cy-h-d*1.15],[cx-w*0.15,cy-h-d*0.65]],"#d9b57a"));
      // naklejka z kodem na przedniej scianie
      var nk = wielokat([[cx-w*0.8,cy-d*0.8-h*0.55],[cx-w*0.25,cy-d*0.25-h*0.55],[cx-w*0.25,cy-d*0.25-h*0.25],[cx-w*0.8,cy-d*0.8-h*0.25]],"#fff");
      g.appendChild(nk);
      for (var i=0;i<6;i++){ var kr = wielokat([[cx-w*0.75+i*w*0.07,cy-d*0.75+i*d*0.07-h*0.5],[cx-w*0.73+i*w*0.07,cy-d*0.73+i*d*0.07-h*0.5],[cx-w*0.73+i*w*0.07,cy-d*0.73+i*d*0.07-h*0.3],[cx-w*0.75+i*w*0.07,cy-d*0.75+i*d*0.07-h*0.3]],"#3b2a12"); g.appendChild(kr); }
      var txt = document.createElementNS(NS,"text");
      txt.setAttribute("x", cx+w*0.5); txt.setAttribute("y", cy-h*0.4-d*0.5+6); txt.setAttribute("text-anchor","middle");
      if (zero) txt.setAttribute("class","zero");
      txt.textContent = napis; g.appendChild(txt);
      svg.appendChild(g);
    }
    var regal = document.createElementNS(NS,"g"); regal.setAttribute("class","regal");
    regal.appendChild(wielokat([[120,470],[420,320],[700,460],[400,610]],"#e2d2b3"));
    regal.appendChild(wielokat([[120,470],[120,486],[400,626],[400,610]],"#cbb78f"));
    regal.appendChild(wielokat([[400,610],[400,626],[700,476],[700,460]],"#b9a377"));
    svg.appendChild(regal);
    karton(300,470,80,80,"14",false,40,.05);
    karton(380,430,80,80,"27",false,50,.15);
    karton(460,390,80,80,"3",false,60,.25);
    karton(540,470,80,80,"0 → 8",true,70,.35);
    karton(300,470,64,64,"",false,30,.0); // wypelniacz z tylu (bez napisu) - usuniety ponizej
    svg.removeChild(svg.lastChild);
    karton(380,330,64,64,"9",false,90,.45);
    karton(460,290,64,64,"41",false,110,.55);
    karton(540,390,64,64,"6",false,100,.5);
  });

  // ksiega realizacji: przewracanie kart
  document.querySelectorAll(".ksiega").forEach(function(ks){
    var karty = [].slice.call(ks.querySelectorAll(".karta")), kropy = [].slice.call(ks.querySelectorAll(".kropy button"));
    var i = 0, zajety = false, n = karty.length, timer;
    function ustaw(){
      karty.forEach(function(k, j){ k.classList.toggle("aktywna", j === i); k.classList.toggle("pod-spodem", j === (i+1)%n); });
      kropy.forEach(function(d, j){ d.classList.toggle("tu", j === i); });
    }
    function idz(kier){
      if (zajety) return; zajety = true;
      var stara = karty[i], nowy = (i + kier + n) % n, nowa = karty[nowy];
      if (spokoj){ i = nowy; ustaw(); zajety = false; return; }
      if (kier > 0){
        nowa.classList.add("pod-spodem"); karty.forEach(function(k){ if (k!==stara && k!==nowa) k.classList.remove("pod-spodem"); });
        stara.classList.add("odchodzi");
        setTimeout(function(){ stara.classList.remove("odchodzi"); i = nowy; ustaw(); zajety = false; }, 900);
      } else {
        nowa.classList.add("wraca");
        setTimeout(function(){ nowa.classList.remove("wraca"); i = nowy; ustaw(); zajety = false; }, 900);
      }
      odlicz();
    }
    function odlicz(){ clearTimeout(timer); timer = setTimeout(function(){ idz(1); }, 5500); }
    ks.querySelector(".strzalka.prawa").addEventListener("click", function(){ idz(1); });
    ks.querySelector(".strzalka.lewa").addEventListener("click", function(){ idz(-1); });
    kropy.forEach(function(d, j){ d.addEventListener("click", function(){ if (j !== i) idz(j > i ? 1 : -1); }); });
    var x0 = null;
    ks.addEventListener("pointerdown", function(e){ x0 = e.clientX; });
    ks.addEventListener("pointerup", function(e){ if (x0 === null) return; var dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 40) idz(dx < 0 ? 1 : -1); });
    ks.addEventListener("mouseenter", function(){ clearTimeout(timer); });
    ks.addEventListener("mouseleave", odlicz);
    document.addEventListener("keydown", function(e){ var r = ks.getBoundingClientRect(); if (r.top > innerHeight || r.bottom < 0) return; if (e.key === "ArrowRight") idz(1); if (e.key === "ArrowLeft") idz(-1); });
    var widoczna = new IntersectionObserver(function(ws){ ws.forEach(function(w){ if (w.isIntersecting) odlicz(); else clearTimeout(timer); }); }, {threshold:.4});
    widoczna.observe(ks); ustaw();
  });

  // kod na dokumencie ksef
  document.querySelectorAll(".qr").forEach(function(qr){
    var z = 7; for (var i=0;i<81;i++){ z = (z*48271)%2147483647; var b=document.createElement("b"); if (z%3===0) b.className="p"; qr.appendChild(b);}
  });

  // dlugosci linii, ktore maja sie rysowac
  document.querySelectorAll(".schody .tor, .droga .trasa.jazda, .mapa .lin").forEach(function(l){
    if (l.getTotalLength) l.style.setProperty("--dl", (l.getTotalLength()+2).toFixed(0) + "px");
  });

  // wjazd tekstu
  var wj = document.querySelectorAll(".wjazd");
  if (spokoj || !("IntersectionObserver" in window)) { wj.forEach(function(e){e.classList.add("widac")}); }
  else {
    var ob = new IntersectionObserver(function(ws){ ws.forEach(function(w){ if(!w.isIntersecting) return; w.target.classList.add("widac"); ob.unobserve(w.target); }); },{rootMargin:"0px 0px -10% 0px"});
    wj.forEach(function(e){ob.observe(e)});
    setTimeout(function(){ wj.forEach(function(e){e.classList.add("widac")}); }, 1500);
  }

  // ciemny naglowek nad ciemnymi rozdzialami
  var ciemne = [].slice.call(document.querySelectorAll("[data-ciemna]"));
  function naglowek(){
    var y = 30, c = false;
    ciemne.forEach(function(s){ var r = s.getBoundingClientRect(); if (r.top <= y && r.bottom >= y) c = true; });
    document.body.classList.toggle("ciemna", c);
  }

  // ruch: kazdy rozdzial dostaje --t (polozenie wzgledem srodka ekranu) i --w (ile wjechal). Reszte robi CSS.
  var rozdzialy = [].slice.call(document.querySelectorAll(".rozdzial")).map(function(s){ return {el:s, t:0, w:0, ct:0, cw:0}; });
  function gladko(x){ return x*x*(3-2*x); }
  function zmierz(){
    var H = innerHeight, waski = innerWidth < 821;
    rozdzialy.forEach(function(r){
      var b = r.el.getBoundingClientRect();
      if (b.bottom < -H || b.top > 2*H) return;
      var t = (b.top + b.height/2 - H/2) / H;
      r.ct = waski ? 0 : Math.max(-1.5, Math.min(1.5, t));
      var w = (H - b.top) / (H * 0.85);
      if (r.el.classList.contains("czolo")) w = (performance.now() - start) / 1400;   // czolo sklada sie samo po wejsciu
      r.cw = gladko(Math.max(0, Math.min(1, w)));
    });
  }
  var start = performance.now(), ruch = false;
  function krok(){
    var zostalo = false;
    zmierz();
    rozdzialy.forEach(function(r){
      if (spokoj) { r.t = 0; r.w = 1; }
      else { r.t += (r.ct - r.t) * 0.16; r.w += (r.cw - r.w) * 0.16; }
      if (Math.abs(r.ct - r.t) > 0.0005 || Math.abs(r.cw - r.w) > 0.0005) zostalo = true;
      r.el.style.setProperty("--t", r.t.toFixed(4));
      r.el.style.setProperty("--w", r.w.toFixed(4));
    });
    naglowek();
    if (zostalo || performance.now() - start < 1600) requestAnimationFrame(krok); else ruch = false;
  }
  function zaplanuj(){ if (!ruch){ ruch = true; requestAnimationFrame(krok); } }
  addEventListener("scroll", zaplanuj, {passive:true});
  addEventListener("resize", zaplanuj);
  zaplanuj();
})();
