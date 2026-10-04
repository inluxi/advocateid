(function(){
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var mem={};var store={get:function(k){try{return localStorage.getItem(k)}catch(e){return mem[k]||null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){mem[k]=v}}};
function toast(m){var t=$('.toast');if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t)}t.textContent=m;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(function(){t.classList.remove('show')},2400)}
window.toast=toast;
// mobile nav
var nt=$('.nav-toggle');if(nt)nt.addEventListener('click',function(){$('.mobile-nav').classList.toggle('open')});
// annotations toggle
var nn=$('#toggleNotes');if(nn){if(store.get('proto_notes')==='off'){document.body.classList.add('no-notes');nn.checked=false}nn.addEventListener('change',function(){document.body.classList.toggle('no-notes',!nn.checked);store.set('proto_notes',nn.checked?'on':'off')})}
// tabs
$$('[data-tabs]').forEach(function(w){var tabs=$$('[role=tab]',w),panels=$$('.tab-panel',w.parentNode);
 function show(id){tabs.forEach(function(t){t.setAttribute('aria-selected',t.dataset.tab===id)});$$('.tab-panel',document).forEach(function(p){if(p.dataset.tabgroup===w.dataset.tabs)p.hidden=p.id!==id})}
 tabs.forEach(function(t){t.addEventListener('click',function(){show(t.dataset.tab)})});
 var h=location.hash.slice(1);if(h&&tabs.some(function(t){return t.dataset.tab===h}))show(h);});
// bookmarks
function getB(){try{return JSON.parse(store.get('bm')||'[]')}catch(e){return[]}}
function setB(a){store.set('bm',JSON.stringify(a));renderB()}
function renderB(){var a=getB();$$('[data-bookmark]').forEach(function(b){var on=a.indexOf(b.dataset.bookmark)>-1;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});var c=$('#bmCount');if(c){c.textContent=a.length;c.style.display=a.length?'inline-block':'none'}}
document.addEventListener('click',function(e){var b=e.target.closest('[data-bookmark]');if(!b)return;e.preventDefault();var a=getB(),s=b.dataset.bookmark,i=a.indexOf(s);if(i>-1){a.splice(i,1);toast('Removed from bookmarks')}else{a.push(s);toast('Saved to bookmarks')}setB(a);if(b.dataset.removeRow){var r=b.closest(b.dataset.removeRow);if(r&&i>-1)r.remove()}});
renderB();
// compare
var NAMES={'anitha-menon':'Anitha Menon','jyothis-gupta':'Jyothis Gupta','rahul-nair':'Rahul Nair','fathima-rahman':'Fathima Rahman','suresh-pillai':'Suresh Pillai','meera-krishnan':'Meera Krishnan','menon-associates':'Menon and Associates'};
function getC(){try{return JSON.parse(store.get('cmp')||'[]')}catch(e){return[]}}
function renderC(){var a=getC();$$('[data-compare]').forEach(function(c){var on=a.indexOf(c.dataset.compare)>-1;c.checked=on;c.closest('.cmp-check').classList.toggle('on',on)});
 var t=$('.compare-tray');if(!t)return;t.hidden=a.length===0;$('.compare-tray .names',t).textContent=a.map(function(s){return NAMES[s]||s}).join(', ');$('.compare-tray .cnt',t).textContent=a.length+' of 3';
 $('.compare-tray a.btn',t).href='compare.html?a='+a.join(',');}
document.addEventListener('change',function(e){var c=e.target.closest('[data-compare]');if(!c)return;var a=getC(),s=c.dataset.compare,i=a.indexOf(s);if(c.checked){if(a.length>=3){c.checked=false;toast('You can compare up to 3 advocates');return}a.push(s)}else if(i>-1)a.splice(i,1);store.set('cmp',JSON.stringify(a));renderC()});
var cc=$('.compare-tray .clear');if(cc)cc.addEventListener('click',function(){store.set('cmp','[]');renderC()});renderC();
// compare page selectors
var cs=$('#cmpSelectors');if(cs){var q=(location.search.match(/a=([^&]*)/)||[])[1];var sel=q?decodeURIComponent(q).split(',').filter(Boolean):getC();
 if(sel.length<2)sel=['anitha-menon','jyothis-gupta','rahul-nair'];window.__cmpSel=sel.slice(0,3);
 var cols=$$('[data-cmp-col]');cols.forEach(function(el){el.style.display=window.__cmpSel.indexOf(el.dataset.cmpCol)>-1?'':'none'});
 var tbl=$('.cmp-table');var all=$$('.cmp-opt');all.forEach(function(o){o.checked=window.__cmpSel.indexOf(o.value)>-1;o.addEventListener('change',function(){var v=all.filter(function(x){return x.checked}).map(function(x){return x.value});if(v.length>3){o.checked=false;toast('Up to 3 advocates');return}window.__cmpSel=v;cols.forEach(function(el){el.style.display=v.indexOf(el.dataset.cmpCol)>-1?'':'none'})})})}
// colour picker (premium)
$$('.swatch').forEach(function(s){s.addEventListener('click',function(){var c=s.dataset.c,on=s.dataset.on||'#ffffff';document.documentElement.style.setProperty('--brand',c);document.documentElement.style.setProperty('--on-brand',on);$$('.swatch').forEach(function(x){x.classList.remove('on')});s.classList.add('on');var r=$('#contrast');if(r){var ratio=contrast(c,on);r.textContent='Contrast '+ratio.toFixed(1)+':1 '+(ratio>=4.5?'(passes)':'(too low, text would be hard to read)');r.className=ratio>=4.5?'ok-text':'warn-text'}})});
function lum(h){var n=parseInt(h.slice(1),16),r=(n>>16)&255,g=(n>>8)&255,b=n&255;return [r,g,b].map(function(v){v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)}).reduce(function(a,v,i){return a+v*[.2126,.7152,.0722][i]},0)}
function contrast(a,b){var x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
// generic
document.addEventListener('click',function(e){
 var t=e.target.closest('[data-toast]');if(t){if(t.tagName==='A'&&(!t.getAttribute('href')||t.getAttribute('href')==='#'))e.preventDefault();toast(t.dataset.toast)}
 var om=e.target.closest('[data-open-modal]');if(om){e.preventDefault();$('#'+om.dataset.openModal).classList.add('open')}
 var cm=e.target.closest('[data-close-modal]');if(cm){var m=cm.closest('.modal');if(m)m.classList.remove('open')}
 var tg=e.target.closest('[data-toggle]');if(tg){tg.classList.toggle('on');tg.classList.toggle('sel')}
 var sg=e.target.closest('[data-seg]');if(sg){var g=sg.parentNode;$$('button',g).forEach(function(b){b.classList.remove('on')});sg.classList.add('on');var m=sg.dataset.seg;$$('[data-price]').forEach(function(p){p.textContent=p.dataset[m]});$$('[data-per]').forEach(function(p){p.textContent=m==='monthly'?'/ month':'/ year'});$$('[data-save]').forEach(function(p){p.style.visibility=m==='annual'?'visible':'hidden'})}
 var cp=e.target.closest('[data-copy]');if(cp){try{navigator.clipboard.writeText(cp.dataset.copy)}catch(x){}toast('Copied')}
});
// editor
var body=document.body;
var eb=$('#editToggle');if(eb){eb.addEventListener('click',function(){var on=body.classList.toggle('editing');eb.textContent=on?'Switch to preview':'Switch to editing';eb.setAttribute('aria-pressed',on)})}
function openDrawer(id){$$('.panel').forEach(function(p){p.hidden=p.id!=='panel-'+id});var t=$('#panel-'+id);if(!t)return;$('#drawerTitle').textContent=t.dataset.title||'Edit';$('.drawer').classList.add('open');$('.backdrop').classList.add('open');$('.drawer .body').scrollTop=0}
function closeDrawer(){$('.drawer').classList.remove('open');$('.backdrop').classList.remove('open')}
document.addEventListener('click',function(e){var ed=e.target.closest('[data-edit]');if(ed&&(body.classList.contains('editing')||ed.classList.contains('secbtn'))){if(ed.tagName==='A')e.preventDefault();if(!body.classList.contains('editing')&&eb){eb.click()}openDrawer(ed.dataset.edit);e.stopPropagation()}
 if(e.target.closest('[data-drawer-close]')||e.target.classList.contains('backdrop'))closeDrawer();
 var sv=e.target.closest('[data-drawer-save]');if(sv){closeDrawer();toast('Saved. Changes are live on your page.')}
},true);
document.addEventListener('keydown',function(e){if(e.key==='Escape'){closeDrawer();$$('.modal.open').forEach(function(m){m.classList.remove('open')})}});
// reorder lists
function relimit(ul){var lim=parseInt(ul.dataset.limit||'999',10);$$('li',ul).forEach(function(li,i){li.classList.toggle('beyond',i>=lim);var b=$('.beyond-tag',li);if(b)b.style.display=i>=lim?'inline-flex':'none'});var c=ul.parentNode.querySelector('[data-count]');if(c){var n=$$('li',ul).length;c.textContent=n+' of '+lim;var m=ul.parentNode.querySelector('.meter i');if(m)m.style.width=Math.min(100,n/lim*100)+'%'}}
$$('.reorder').forEach(relimit);
document.addEventListener('click',function(e){var b=e.target.closest('.up,.down,.rm');if(!b)return;var li=b.closest('li'),ul=li.parentNode;if(b.classList.contains('up')&&li.previousElementSibling)ul.insertBefore(li,li.previousElementSibling);else if(b.classList.contains('down')&&li.nextElementSibling)ul.insertBefore(li.nextElementSibling,li);else if(b.classList.contains('rm'))li.remove();relimit(ul)});
$$('[data-add]').forEach(function(b){b.addEventListener('click',function(){var ul=$('#'+b.dataset.add),inp=$('#'+b.dataset.add+'-in');if(!inp||!inp.value.trim())return;var li=document.createElement('li');li.innerHTML='<span class="grip">&#8942;&#8942;</span><span class="t"></span><span class="beyond-tag chip chip-seal xs" style="display:none">Hidden on this plan</span><button class="icon-btn up" type="button" aria-label="Move up">&#8593;</button><button class="icon-btn down" type="button" aria-label="Move down">&#8595;</button><button class="icon-btn rm" type="button" aria-label="Remove">&#215;</button>';li.querySelector('.t').textContent=inp.value.trim();ul.appendChild(li);inp.value='';relimit(ul)})});
// wording checker
var BAD=['best','top ','no.1','no. 1','number one','won ','win ','winning','guarantee','guaranteed','expert in','#1','leading','famous','cheap','discount'];
$$('[data-wording]').forEach(function(t){t.addEventListener('input',function(){var v=' '+t.value.toLowerCase()+' ',hit=BAD.filter(function(w){return v.indexOf(w)>-1});var o=$('#'+t.dataset.wording);if(hit.length){o.className='warn-text';o.textContent='Please rephrase factually. Words like "'+hit.join('", "').trim()+'" can read as promotion under Bar Council rules.'}else{o.className='ok-text';o.textContent=t.value?'Wording looks factual.':''}})});
// slug check
var sl=$('#slugInput');if(sl){sl.addEventListener('input',function(){var v=sl.value.toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-');sl.value=v;$('#slugPrev').textContent=v||'your-name';var o=$('#slugMsg'),res=['admin','login','api','c','l','i','u','jobs','pricing','anitha-menon','rahul-nair'];if(v.length<3){o.className='warn-text';o.textContent='Use at least 3 characters.'}else if(res.indexOf(v)>-1){o.className='warn-text';o.textContent='This address is taken or reserved. Try adding your city, for example '+v+'-kochi.'}else{o.className='ok-text';o.textContent='Available.'}})}
// OTP flow
var of=$('#otpFlow');if(of){var s1=$('#step1'),s2=$('#step2'),s3=$('#step3');$('#sendOtp').addEventListener('click',function(){var m=$('#mobile').value.replace(/\D/g,'');if(m.length!==10){$('#mobErr').textContent='Enter a 10-digit mobile number.';return}$('#mobErr').textContent='';$('#shownMob').textContent='+91 '+m;s1.hidden=true;s2.hidden=false;$('.otp input').focus()});
 var boxes=$$('.otp input');boxes.forEach(function(b,i){b.addEventListener('input',function(){b.value=b.value.replace(/\D/g,'').slice(0,1);if(b.value&&boxes[i+1])boxes[i+1].focus()});b.addEventListener('keydown',function(e){if(e.key==='Backspace'&&!b.value&&boxes[i-1])boxes[i-1].focus()})});
 $('#verifyOtp').addEventListener('click',function(){s2.hidden=true;s3.hidden=false});}
// domain status demo
var ds=$('#checkDomain');if(ds){ds.addEventListener('click',function(){var el=$('#domStatus');el.className='pill wait';el.textContent='Checking DNS';setTimeout(function(){el.className='pill wait';el.textContent='DNS found, issuing certificate'},900);setTimeout(function(){el.className='pill ok';el.textContent='Active';toast('Domain is live with HTTPS')},2000)})}
// job apply
var ja=$('#applyForm');if(ja){ja.addEventListener('submit',function(e){e.preventDefault();ja.hidden=true;$('#applyDone').hidden=false;window.scrollTo(0,0)})}
// geolocation demo
var gb=$('#geoBtn');if(gb){gb.addEventListener('click',function(){$('#geoState').textContent='Using your location (sample: Kakkanad, Kochi)';toast('Location found')})}

// counters for data-max fields
$$('[data-max]').forEach(function(el){var c=document.createElement('div');c.className='counter';el.parentNode.insertBefore(c,el.nextSibling);function u(){c.textContent=el.value.length+' / '+el.dataset.max;c.style.color=el.value.length>+el.dataset.max?'var(--seal)':''}el.setAttribute('maxlength',el.dataset.max);el.addEventListener('input',u);u()});
$$('[data-linkicon]').forEach(function(el){var o=document.getElementById(el.dataset.linkicon);el.addEventListener('input',function(){var v=el.value.toLowerCase(),t='Icon will be fetched from the site';['linkedin','facebook','instagram','youtube','twitter','x.com','t.me'].forEach(function(k){if(v.indexOf(k)>-1)t='Recognised: '+k.replace('x.com','X').replace('t.me','Telegram')});o.textContent=v?t:''})});
$$('[data-otp-send]').forEach(function(b){b.addEventListener('click',function(){var r=document.getElementById(b.dataset.otpSend);r.classList.add('open');toast('OTP sent (any code works)')})});
$$('[data-otp-ok]').forEach(function(b){b.addEventListener('click',function(){var r=b.closest('.otp-row');r.classList.remove('open');var s=document.getElementById(b.dataset.otpOk);if(s){s.className='pill ok';s.textContent='Verified'}toast('Number verified')})});
document.addEventListener('click',function(e){var r=e.target.closest('[data-cmp-remove]');if(!r)return;var s=r.dataset.cmpRemove;$$('.cmp-opt').forEach(function(o){if(o.value===s)o.checked=false});$$('[data-cmp-col="'+s+'"]').forEach(function(el){el.style.display='none'});window.__cmpSel=(window.__cmpSel||[]).filter(function(x){return x!==s});toast('Removed from comparison')});
$$('details[data-desktop-open]').forEach(function(d){if(window.innerWidth>=960)d.open=true});
var mo=document.getElementById('memberToggle');if(mo){mo.addEventListener('change',function(){var t=document.getElementById('memberOf');if(t)t.hidden=!mo.checked})}
})();
