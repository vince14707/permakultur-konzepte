/* ===== PARALLAX ===== */
window.addEventListener('scroll', function(){
  var hero = document.querySelector('.hero-s');
  if(!hero) return;
  var scrolled = window.pageYOffset;
  var rate = scrolled * 0.4;
  hero.style.setProperty('--parallax-y', rate + 'px');
}, {passive:true});

/* ===== MOBILE NAV ===== */
function toggleNav(){
  var menu = document.getElementById('mobileMenu');
  menu.classList.toggle('open');
}
function closeNav(){
  var menu = document.getElementById('mobileMenu');
  if(menu) menu.classList.remove('open');
}

/* ===== NAVIGATION ===== */
function initCookieBanner(){
  try {
    var consent = localStorage.getItem('cookie_consent');
    if(!consent){
      setTimeout(function(){
        var b = document.getElementById('cookie-banner');
        if(b) b.classList.add('visible');
      }, 800);
    }
  } catch(e){}
}
function acceptCookies(){
  try { localStorage.setItem('cookie_consent','accepted'); } catch(e){}
  var b = document.getElementById('cookie-banner');
  if(b) b.classList.remove('visible');
}
function declineCookies(){
  try { localStorage.setItem('cookie_consent','declined'); } catch(e){}
  var b = document.getElementById('cookie-banner');
  if(b) b.classList.remove('visible');
}

function updateFaqBtnPosition(){
  var banner=document.getElementById('cookie-banner');
  var btn=document.getElementById('faq-bot-btn');
  var win=document.getElementById('faq-bot-window');
  if(!banner||!btn)return;
  if(banner.classList.contains('visible')){
    var h=banner.offsetHeight;
    btn.style.bottom=(h+16)+'px';
    if(win)win.style.bottom=(h+74)+'px';
  }else{
    btn.style.bottom='24px';
    if(win)win.style.bottom='82px';
  }
}
var cookieObserver=new MutationObserver(updateFaqBtnPosition);
document.addEventListener('DOMContentLoaded',function(){
  var banner=document.getElementById('cookie-banner');
  if(banner){
    cookieObserver.observe(banner,{attributes:true,attributeFilter:['class']});
    updateFaqBtnPosition();
  }
});

/* ===== NAVIGATION ===== */
// Jede Seite hat eine eigene URL. show('leistungen') usw. bleibt als Kurzform
// für die Buttons erhalten und öffnet die passende Unterseite.
var PAGE_URLS = {
  home:'/', leistungen:'/leistungen/', kurse:'/kurse/', ueber:'/ueber-mich/',
  analyse:'/kontakt/', impressum:'/impressum/', datenschutz:'/datenschutz/'
};
function show(p, preselect){
  var url = PAGE_URLS[p];
  if(!url) return;
  if(location.pathname === url){
    window.scrollTo(0,0);
    if(preselect) preselectAnliegen(preselect);
    return;
  }
  location.href = preselect ? url + '?anliegen=' + encodeURIComponent(preselect) : url;
}
// Anliegen im Kontaktformular vorauswählen (z. B. /kontakt/?anliegen=planung)
function preselectAnliegen(v){
  var sel = document.getElementById('kf-anliegen');
  if(sel && sel.querySelector('option[value="' + v + '"]')){
    sel.value = v;
    updateFormFields();
  }
}

/* ===== GALERIE & LIGHTBOX ===== */
function openGallery(tab){
  document.getElementById('galleryModal').style.display='block';
  document.body.style.overflow='hidden';
  switchGalleryTab(tab||'alle');
}
function switchGalleryTab(tab){
  // Alle Sektionen ausblenden
  document.querySelectorAll('.gsec').forEach(function(s){s.style.display='none';});
  // Alle Tabs zurücksetzen
  ['alle','planung','umsetzung'].forEach(function(t){
    var btn=document.getElementById('gtab-'+t);
    if(btn){btn.style.color='rgba(255,255,255,0.5)';btn.style.borderBottom='2px solid transparent';}
  });
  // Aktiven Tab setzen
  var activeBtn=document.getElementById('gtab-'+tab);
  if(activeBtn){activeBtn.style.color='white';activeBtn.style.borderBottom='2px solid var(--amber-light)';}
  // Sektionen anzeigen
  if(tab==='alle'){
    document.getElementById('gsec-planung').style.display='block';
    document.getElementById('gsec-umsetzung').style.display='block';
  } else {
    var sec=document.getElementById('gsec-'+tab);
    if(sec) sec.style.display='block';
  }
}
function closeGallery(){
  document.getElementById('galleryModal').style.display='none';
  document.body.style.overflow='';
}
function openLightbox(src,caption){
  var lb=document.getElementById('lightbox');
  document.getElementById('lightboxImg').src=src;
  document.getElementById('lightboxCaption').textContent=caption;
  lb.style.display='flex';
  document.body.style.overflow='hidden';
}
function closeLightbox(){
  document.getElementById('lightbox').style.display='none';
  document.body.style.overflow='';
}
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){closeGallery();closeLightbox();}
});

/* ===== LOCALSTORAGE: Felder automatisch speichern & laden ===== */
var LS_KEY = 'pk_anfrage_v1';
var kfFields = ['kf-anliegen','kf-name','kf-email','kf-tel','kf-ort','kf-groesse',
                'kf-wuensche','kf-ressourcen','kf-grenzen','kf-besonderheiten',
                'kf-dateien','kf-freitext'];

/* ===== DYNAMISCHE FORMULARFELDER ===== */
function updateFormFields(){
  var anl = document.getElementById('kf-anliegen');
  if(!anl) return; // nur auf der Kontaktseite vorhanden
  var v = anl.value;

  // Alle optionalen Blöcke
  var flaeche      = document.getElementById('kf-block-flaeche');
  var groesse      = document.getElementById('kf-block-groesse');
  var projekt      = document.getElementById('kf-block-projekt');
  var ressourcen   = document.getElementById('kf-block-ressourcen');
  var grenzen      = document.getElementById('kf-block-grenzen');
  var besonderh    = document.getElementById('kf-block-besonderheiten');
  var dateien      = document.getElementById('kf-block-dateien');

  // Standard: alles ausblenden
  flaeche.style.display    = 'none';
  groesse.style.display    = 'none';
  projekt.style.display    = 'none';
  ressourcen.style.display = 'none';
  grenzen.style.display    = 'none';
  besonderh.style.display  = 'none';
  dateien.style.display    = 'none';

  if(v === 'planung' || v === 'umsetzung'){
    flaeche.style.display    = 'block';
    groesse.style.display    = 'block';
    projekt.style.display    = 'block';
    ressourcen.style.display = 'block';
    grenzen.style.display    = 'block';
    besonderh.style.display  = 'block';
    dateien.style.display    = 'block';
  } else if(v === 'beratung'){
    flaeche.style.display    = 'block';
    projekt.style.display    = 'block';
    // keine Ressourcen/Grenzen/Besonderheiten
  } else if(v === 'schnitt' || v === 'pflege'){
    flaeche.style.display    = 'block';
    // nur Ort, kein Größe, kein Projektblock
  } else if(v === 'kurs' || v === 'sonstiges'){
    // nur Freitext reicht
  }
  saveForm();
}

function saveForm(){
  var data = {};
  kfFields.forEach(function(id){
    var el = document.getElementById(id);
    if(el) data[id] = el.value;
  });
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch(e){}
}

function loadForm(){
  try {
    var raw = localStorage.getItem(LS_KEY);
    if(!raw) return;
    var data = JSON.parse(raw);
    kfFields.forEach(function(id){
      var el = document.getElementById(id);
      if(el && data[id]) el.value = data[id];
    });
    updateFormFields();
  } catch(e){}
}

// Auto-save bei jeder Eingabe
document.addEventListener('DOMContentLoaded', function(){
  initCookieBanner();
  // Optionale Blöcke initial ausblenden
  ['kf-block-flaeche','kf-block-groesse','kf-block-projekt',
   'kf-block-ressourcen','kf-block-grenzen','kf-block-besonderheiten','kf-block-dateien']
  .forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.style.display = 'none';
  });
  loadForm();
  kfFields.forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.addEventListener('input', saveForm);
  });
  // select braucht 'change' statt 'input'
  var sel = document.getElementById('kf-anliegen');
  if(sel) sel.addEventListener('change', saveForm);
});

/* ===== FORMULAR ABSENDEN ===== */
function sendKForm(e){
  e.preventDefault();
  var form = document.getElementById('kForm');
  var msg  = document.getElementById('kfMsg');
  var data = new FormData(form);
  msg.style.display = 'none';

  fetch('https://formspree.io/f/xbdpzkye', {
    method:'POST', body:data, headers:{'Accept':'application/json'}
  })
  .then(function(r){
    msg.style.display = 'block';
    if(r.ok){
      msg.style.background='rgba(28,74,42,0.08)';
      msg.style.color='#1c4a2a';
      msg.style.padding='1rem';
      msg.style.borderRadius='6px';
      msg.textContent='Gesendet! Ich melde mich bald bei dir.';
      try { localStorage.removeItem(LS_KEY); } catch(e){}
      form.reset();
    } else {
      msg.style.background='rgba(220,50,50,0.08)';
      msg.style.color='#991b1b';
      msg.style.padding='1rem';
      msg.style.borderRadius='6px';
      msg.textContent='Fehler beim Senden. Schreib direkt an vincent@permakultur-konzepte.de';
    }
  })
  .catch(function(){
    msg.style.display='block';
    msg.style.background='rgba(220,50,50,0.08)';
    msg.style.color='#991b1b';
    msg.style.padding='1rem';
    msg.style.borderRadius='6px';
    msg.textContent='Fehler beim Senden. Schreib direkt an vincent@permakultur-konzepte.de';
  });
}

/* ===== PDF DOWNLOAD ===== */
function downloadPDF(){
  var get = function(id){ var el=document.getElementById(id); return el?el.value.trim():''; };

  var lines = [
    'PERMAKULTUR-KONZEPTE.DE – Projektanfrage',
    '==========================================',
    '',
    'KONTAKT',
    'Name:     ' + (get('kf-name') || '–'),
    'E-Mail:   ' + (get('kf-email') || '–'),
    'Telefon:  ' + (get('kf-tel') || '–'),
    '',
    'DIE FLÄCHE',
    'Ort:      ' + (get('kf-ort') || '–'),
    'Größe:    ' + (get('kf-groesse') || '–'),
    '',
    'WÜNSCHE & ZIELE',
    get('kf-wuensche') || '–',
    '',
    'RESSOURCEN (Arbeitskraft, Material, Budget)',
    get('kf-ressourcen') || '–',
    '',
    'BEGRENZUNGEN & RAHMENBEDINGUNGEN',
    get('kf-grenzen') || '–',
    '',
    'BESONDERHEITEN DER FLÄCHE',
    get('kf-besonderheiten') || '–',
    '',
    'LINK ZU UNTERLAGEN',
    get('kf-dateien') || '–',
    '',
    'SONSTIGES',
    get('kf-freitext') || '–',
    '',
    '==========================================',
    'permakultur-konzepte.de · vincent@permakultur-konzepte.de'
  ];

  var text = lines.join('\n');
  var blob = new Blob([text], {type:'text/plain;charset=utf-8'});
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href = url;
  a.download = 'Permakultur-Anfrage.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Überleitungssatz beim Scrollen einblenden
(function(){
  var el=document.querySelector('.bridge');
  if(!el||!('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('js');
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:0.6});
  io.observe(el);
})();

// Vorauswahl aus der URL (/kontakt/?anliegen=planung) und Sprung zum Ablauf (/#ablauf)
document.addEventListener('DOMContentLoaded', function(){
  var m = location.search.match(/[?&]anliegen=([a-z]+)/);
  if(m) preselectAnliegen(m[1]);
  if(location.hash === '#ablauf'){
    var a = document.getElementById('ablauf');
    if(a) a.scrollIntoView({block:'center'});
  }
});

/* ===== FAQ-BOT ===== */
  const FAQ_WORKER_URL = "https://faq-bot.vincent-hahn.workers.dev";
  let faqHistory = [];
  const SYSTEM_PROMPT = "You are a helpful Permaculture Gardening Chatbot for Permakultur-Konzepte.de.";

  function faqBotToggle() {
    const win = document.getElementById("faq-bot-window");
    win.classList.toggle("open");
  }

  function faqBotAddMsg(text, role) {
    const box = document.getElementById("faq-bot-messages");
    const div = document.createElement("div");
    div.className = "faq-msg " + role;
    div.textContent = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
    return div;
  }

  async function faqBotSend() {
    const input = document.getElementById("faq-bot-input");
    const btn = document.getElementById("faq-bot-send");
    const text = input.value.trim();
    if (!text) return;

    input.value = "";
    btn.disabled = true;
    faqBotAddMsg(text, "user");
    faqHistory.push({ role: "user", content: text });

    const typing = faqBotAddMsg("…", "bot typing");

    try {
      const res = await fetch(FAQ_WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: SYSTEM_PROMPT, model: "gpt-3.5-turbo", messages: faqHistory }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Entschuldigung, da ist etwas schiefgelaufen.";
      typing.textContent = reply;
      typing.classList.remove("typing");
      faqHistory.push({ role: "assistant", content: reply });
    } catch (e) {
      typing.textContent = "Verbindungsfehler. Bitte versuchen Sie es später erneut.";
      typing.classList.remove("typing");
    }

    btn.disabled = false;
      input.focus();
    }

function faqBotTrackCTA() {
  if (faqHistory.length > 0) {
    fetch(FAQ_WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: faqHistory, ctaClicked: true }),
    keepalive: true, // Meldung geht auch raus, wenn direkt danach die Seite wechselt
    });
  }
  return true;
}
