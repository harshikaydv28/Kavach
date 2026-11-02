(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s);};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
function h(tag,props){
  var e=document.createElement(tag);
  if(props){for(var k in props){var v=props[k];
    if(k==='class')e.className=v;
    else if(k==='text')e.textContent=v;
    else if(k.indexOf('on')===0)e.addEventListener(k.slice(2),v);
    else if(v!==false&&v!=null)e.setAttribute(k,v);}}
  for(var i=2;i<arguments.length;i++){var c=arguments[i];
    if(c==null||c===false)continue;
    e.append(c.nodeType?c:document.createTextNode(c));}
  return e;
}

/* ---------- storage ---------- */
var KEY='kavach.v1';
var S={profile:{name:'',blood:'',notes:''},contacts:[],where:'',walk:null};
try{
  var raw=localStorage.getItem(KEY);
  if(raw){var o=JSON.parse(raw);
    if(o&&typeof o==='object'){
      if(o.profile&&typeof o.profile==='object'){S.profile.name=String(o.profile.name||'');S.profile.blood=String(o.profile.blood||'');S.profile.notes=String(o.profile.notes||'');}
      if(Array.isArray(o.contacts))S.contacts=o.contacts.filter(function(c){return c&&c.name&&c.phone;}).slice(0,5);
      if(typeof o.where==='string')S.where=o.where;
      if(o.walk&&typeof o.walk==='object'&&o.walk.end&&o.walk.start)S.walk=o.walk;
    }}
}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}

/* ---------- helpers ---------- */
function mmss(ms){var t=Math.max(0,Math.ceil(ms/1000));var m=Math.floor(t/60),s=t%60;return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');}
function fmtTime(d){try{return d.toLocaleString('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit',hour12:true});}catch(e){return d.toString();}}
function cleanPhone(v){
  var t=String(v).trim();var plus=t.charAt(0)==='+';var d=t.replace(/\D/g,'');
  if(d.length<7)return '';
  if(plus)return '+'+d;
  if(d.length===10)return '+91'+d;
  if(d.length===11&&d.charAt(0)==='0')return '+91'+d.slice(1);
  return d;
}
var toastT;
function toast(msg){var t=$('#toast');t.textContent=msg;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(function(){t.hidden=true;},2600);}
function copy(text,okMsg){
  function fallback(){
    var ta=h('textarea',{'aria-hidden':'true',style:'position:fixed;left:-9999px;top:0'});
    ta.value=text;document.body.append(ta);ta.select();
    var ok=false;try{ok=document.execCommand('copy');}catch(e){}
    ta.remove();
    toast(ok?(okMsg||'Copied'):'Copy was blocked. Select the text and copy it by hand.');
  }
  try{navigator.clipboard.writeText(text).then(function(){toast(okMsg||'Copied');},fallback);}catch(e){fallback();}
}
function vibrate(p){try{if(navigator.vibrate)navigator.vibrate(p);}catch(e){}}

/* ---------- audio ---------- */
var actx=null;
function ctx(){
  try{
    if(!actx){var C=window.AudioContext||window.webkitAudioContext;if(!C)return null;actx=new C();}
    if(actx.state==='suspended')actx.resume();
    return actx;
  }catch(e){return null;}
}
function tone(freq,at,dur,vol){
  var c=ctx();if(!c)return;
  var o=c.createOscillator(),g=c.createGain();
  o.type='sine';o.frequency.value=freq;
  var t=c.currentTime+at;
  g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(vol||0.2,t+0.02);
  g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g);g.connect(c.destination);
  o.start(t);o.stop(t+dur+0.05);
}
var siren=null;
function startSiren(){
  stopSiren();
  var c=ctx();if(!c)return false;
  try{
    var o=c.createOscillator(),g=c.createGain();
    o.type='sawtooth';g.gain.value=0.22;
    o.connect(g);g.connect(c.destination);o.start();
    var t0=c.currentTime;
    var id=setInterval(function(){
      var t=c.currentTime-t0;
      var f=950+330*Math.sin(t*2*Math.PI*1.2);
      try{o.frequency.setTargetAtTime(f,c.currentTime,0.02);}catch(e){}
    },40);
    siren={o:o,g:g,id:id};
    return true;
  }catch(e){return false;}
}
function stopSiren(){
  if(!siren)return;
  clearInterval(siren.id);
  try{siren.o.stop();}catch(e){}
  try{siren.o.disconnect();siren.g.disconnect();}catch(e){}
  siren=null;
}
var ringId=null;
function startRing(){
  stopRing();
  function pat(){tone(523,0,.22,.25);tone(659,.26,.22,.25);tone(523,.9,.22,.25);tone(659,1.16,.22,.25);}
  pat();ringId=setInterval(pat,2600);
}
function stopRing(){if(ringId){clearInterval(ringId);ringId=null;}}
var beepId=null;
function startBeeps(){
  stopBeeps();
  function b(){tone(880,0,.2,.3);tone(880,.3,.2,.3);vibrate([200,100,200]);}
  b();beepId=setInterval(b,1200);
}
function stopBeeps(){if(beepId){clearInterval(beepId);beepId=null;}}
var wl=null;
function lockScreen(){try{if('wakeLock' in navigator){navigator.wakeLock.request('screen').then(function(l){wl=l;},function(){});}}catch(e){}}
function unlockScreen(){try{if(wl)wl.release();}catch(e){}wl=null;}

/* ---------- message ---------- */
function buildMessage(reason){
  var p=S.profile,L=[];
  L.push('EMERGENCY. I need help.');
  L.push((p.name?'This is '+p.name+'. ':'')+reason);
  L.push('Time: '+fmtTime(new Date()));
  L.push('Where I am: '+(S.where.trim()||'not set, please call me now'));
  var med=[];
  if(p.blood)med.push('blood group '+p.blood);
  if(p.notes.trim())med.push(p.notes.trim());
  if(med.length)L.push('Medical: '+med.join('. '));
  L.push('Please call me. If you cannot reach me, call 112 for me.');
  return L.join('\n');
}

/* ---------- routing ---------- */
var VIEWS=['alert','walk','call','plan'];
function route(){
  var n=location.hash.replace('#','');
  if(VIEWS.indexOf(n)<0)n='alert';
  VIEWS.forEach(function(v){
    $('#v-'+v).hidden=v!==n;
    $('#t-'+v).setAttribute('aria-current',v===n?'page':'false');
  });
  try{window.scrollTo(0,0);}catch(e){}
}

/* ---------- alarm ---------- */
var alarm=null;
function tickAlarm(){if(alarm)$('#al-elapsed').textContent=mmss(Date.now()-alarm.t0).replace(/^/,'')+' since the alarm started';}
function setSirenLabel(){
  var on=!!siren;
  $('#al-siren').textContent=on?'Siren on. Tap to mute':'Siren off. Tap to turn on';
}
function renderAlarmContacts(msg){
  var box=$('#al-contacts');box.replaceChildren();
  if(!S.contacts.length){box.append(h('p',{class:'ov-note',text:'No trusted contacts saved. Call 112 first, then ask someone nearby for help.'}));return;}
  S.contacts.forEach(function(c){
    box.append(h('div',{class:'ov-row'},
      h('div',{class:'cinfo'},h('b',{text:c.name}),h('span',{class:'mono',text:c.phone})),
      h('a',{class:'ov-link',href:'tel:'+c.phone},'Call'),
      h('a',{class:'ov-link',href:'sms:'+c.phone+'?body='+encodeURIComponent(msg)},'Text')));
  });
}
function raiseAlarm(reason){
  if(alarm)return;
  cancelHold();stopBeeps();
  var msg=buildMessage(reason);
  alarm={reason:reason,t0:Date.now(),timer:null};
  $('#al-reason').textContent=reason;
  $('#al-msg').value=msg;
  renderAlarmContacts(msg);
  $('#alarm').hidden=false;
  document.body.style.overflow='hidden';
  var ok=startSiren();
  $('#al-sirennote').hidden=ok;
  setSirenLabel();
  tickAlarm();
  alarm.timer=setInterval(tickAlarm,500);
  vibrate([500,200,500,200,500]);
  lockScreen();
  try{$('#al-h').focus();}catch(e){}
  updateStatus();
}
function endAlarm(){
  if(!alarm)return;
  clearInterval(alarm.timer);alarm=null;
  stopSiren();unlockScreen();
  $('#alarm').hidden=true;
  document.body.style.overflow='';
  updateStatus();toast('Alarm ended');
}

/* ---------- hold to trigger ---------- */
var HOLD=1500,CIRC=678.58,holdStart=0,holdRaf=0;
function setRing(p){$('#sos-ring').setAttribute('stroke-dashoffset',String(CIRC*(1-p)));}
function holdTick(now){
  var p=Math.min(1,(now-holdStart)/HOLD);setRing(p);
  if(p>=1){cancelHold();raiseAlarm('I pressed the SOS button on my safety app.');return;}
  holdRaf=requestAnimationFrame(holdTick);
}
function startHold(){
  if(alarm||holdStart)return;
  ctx();
  holdStart=performance.now();
  $('#sos').classList.add('holding');
  holdRaf=requestAnimationFrame(holdTick);
}
function cancelHold(){
  cancelAnimationFrame(holdRaf);holdStart=0;setRing(0);
  $('#sos').classList.remove('holding');
}

/* ---------- safe walk ---------- */
var GRACE=60000;
function walkMode(){return !S.walk?'none':(S.walk.grace?'grace':'run');}
function applyWalk(){
  var m=walkMode();
  $('#w-setup').hidden=m!=='none';
  $('#w-run').hidden=m!=='run';
  $('#w-grace').hidden=m!=='grace';
  if(S.walk)$('#w-dest').textContent=S.walk.dest?'Walking to '+S.walk.dest:'Walk in progress';
}
function startWalk(){
  var mins=parseInt($('#walk-min').value,10);
  if(!mins||mins<1)mins=20;if(mins>240)mins=240;
  var now=Date.now();
  S.walk={dest:$('#walk-dest').value.trim(),minutes:mins,start:now,end:now+mins*60000,grace:null};
  save();ctx();applyWalk();tick();
  toast('Safe walk started for '+mins+' min');
}
function endWalk(msg){
  S.walk=null;save();stopBeeps();applyWalk();updateStatus();
  toast(msg);
}
function extendWalk(){
  if(!S.walk)return;
  S.walk.end=Math.max(S.walk.end,Date.now())+10*60000;
  S.walk.grace=null;save();stopBeeps();applyWalk();tick();
  toast('Added 10 minutes');
}
function syncChips(){
  var v=parseInt($('#walk-min').value,10);
  $$('#walk-chips button').forEach(function(b){b.setAttribute('aria-pressed',String(parseInt(b.dataset.m,10)===v));});
}

/* ---------- fake call ---------- */
var fc={name:'Mom',at:0,wait:null,callTimer:null,callStart:0};
function resetFcUI(){
  $('#fc-form').hidden=false;$('#fc-wait').hidden=true;
}
function showIncoming(){
  clearInterval(fc.wait);fc.wait=null;
  $('#cu-name').textContent=fc.name;
  $('#cu-av').textContent=(fc.name.trim().charAt(0)||'?').toUpperCase();
  $('#cu-st').textContent='Incoming call';
  $('#cu-acts').hidden=false;$('#cu-end').hidden=true;
  $('#callui').hidden=false;
  startRing();vibrate([600,300,600,300,600,300,600]);
  resetFcUI();
}
function scheduleCall(){
  fc.name=$('#fc-name').value.trim()||'Mom';
  var d=parseInt($('#fc-delay').value,10)||0;
  ctx();
  if(d===0){showIncoming();return;}
  fc.at=Date.now()+d*1000;
  $('#fc-form').hidden=true;$('#fc-wait').hidden=false;
  function upd(){
    var rem=fc.at-Date.now();
    if(rem<=0){showIncoming();return;}
    $('#fc-wait-t').textContent='Rings in '+(rem>=60000?mmss(rem):Math.ceil(rem/1000)+' s');
  }
  upd();clearInterval(fc.wait);fc.wait=setInterval(upd,250);
}
function cancelWait(){clearInterval(fc.wait);fc.wait=null;resetFcUI();}
function acceptCall(){
  stopRing();
  $('#cu-acts').hidden=true;$('#cu-end').hidden=false;
  fc.callStart=Date.now();
  function upd(){$('#cu-st').textContent=mmss(Date.now()-fc.callStart).replace(/^0/,'');}
  upd();clearInterval(fc.callTimer);fc.callTimer=setInterval(upd,500);
}
function endCall(){
  stopRing();clearInterval(fc.callTimer);fc.callTimer=null;
  $('#callui').hidden=true;
}

/* ---------- render ---------- */
function renderNums(){
  var box=$('#nums');box.replaceChildren();
  [['112','All emergencies',true],['100','Police'],['108','Ambulance'],['101','Fire'],['1091','Women helpline'],['1098','Childline']].forEach(function(n){
    box.append(h('a',{class:'num'+(n[2]?' first':''),href:'tel:'+n[0]},h('b',{text:n[0]}),h('span',{text:n[1]})));
  });
}
function renderAlertTo(){
  var b=$('#alert-to');b.replaceChildren();
  if(!S.contacts.length){
    b.append(h('h3',{text:'Trusted contacts'}),
      h('p',{class:'muted'},'None yet. When the alarm goes off you will see only the 112 button and the message. '),
      h('a',{class:'btn',href:'#plan'},'Add contacts'));
  }else{
    b.append(h('h3',{text:'Trusted contacts'}),
      h('p',{class:'muted'},'When the alarm goes off you get call and text buttons for '+S.contacts.map(function(c){return c.name;}).join(', ')+'.'));
  }
}
function renderContacts(){
  var ul=$('#contact-list');ul.replaceChildren();
  if(!S.contacts.length)ul.append(h('li',{class:'crow empty',text:'No trusted contacts yet. Add up to five people who should hear first.'}));
  S.contacts.forEach(function(c,i){
    ul.append(h('li',{class:'crow'},
      h('div',{class:'cinfo'},h('b',{text:c.name}),h('span',{class:'mono',text:c.phone})),
      h('button',{type:'button',class:'btn sm','aria-label':'Remove '+c.name,onclick:function(){S.contacts.splice(i,1);save();renderAll();}},'Remove')));
  });
  $('#add-contact').disabled=S.contacts.length>=5;
}
function renderPreview(){$('#preview').textContent=buildMessage('I pressed the SOS button on my safety app.');}
function renderAll(){renderAlertTo();renderContacts();renderPreview();}

/* ---------- status and tick ---------- */
function updateStatus(){
  var c=$('#status'),s='idle',t='Standing by';
  if(alarm){s='alarm';t='Alarm on';}
  else if(S.walk&&S.walk.grace){s='warn';t='Check in now';}
  else if(S.walk){s='walk';t='Walk '+mmss(S.walk.end-Date.now());}
  c.dataset.s=s;$('#status-t').textContent=t;
  var a=$('#a-status');
  if(alarm)a.textContent='The alarm is on. Use the buttons on the red screen.';
  else if(S.walk)a.textContent='A safe walk is running. Hold the red button any time to sound the alarm.';
  else a.textContent='Hold the red button for a second and a half. A quick tap does nothing, so it will not go off in your bag.';
}
function tick(){
  var now=Date.now(),w=S.walk;
  if(w){
    if(!w.grace){
      var rem=w.end-now;
      if(rem>0){
        $('#w-count').textContent=mmss(rem);
        $('#w-bar').style.width=Math.min(100,100*(1-rem/(w.end-w.start)))+'%';
      }else{
        w.grace=now+GRACE;save();startBeeps();applyWalk();
        $('#g-count').textContent=mmss(GRACE);
        if(!alarm&&location.hash!=='#walk')location.hash='#walk';
      }
    }else{
      var gl=w.grace-now;
      if(gl>0){$('#g-count').textContent=mmss(gl);}
      else{
        var d=w.dest;S.walk=null;save();stopBeeps();applyWalk();
        raiseAlarm('My safe-walk timer ran out'+(d?' while I was going to '+d:'')+' and I did not check in.');
      }
    }
  }
  updateStatus();
}

/* ---------- wire up ---------- */
var sos=$('#sos');
sos.addEventListener('pointerdown',function(e){e.preventDefault();startHold();});
['pointerup','pointercancel','pointerleave'].forEach(function(ev){sos.addEventListener(ev,cancelHold);});
sos.addEventListener('contextmenu',function(e){e.preventDefault();});
sos.addEventListener('keydown',function(e){if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();startHold();}});
sos.addEventListener('keyup',function(e){if(e.key===' '||e.key==='Enter')cancelHold();});
sos.addEventListener('blur',cancelHold);

$('#al-end').addEventListener('click',endAlarm);
$('#al-copy').addEventListener('click',function(){copy($('#al-msg').value,'Message copied');});
$('#al-siren').addEventListener('click',function(){
  if(siren){stopSiren();}else{var ok=startSiren();$('#al-sirennote').hidden=ok;}
  setSirenLabel();
});

$('#where').value=S.where;
$('#where').addEventListener('input',function(e){S.where=e.target.value;save();renderPreview();});

var chips=$('#walk-chips');
[10,20,30,45,60].forEach(function(m){
  chips.append(h('button',{type:'button','data-m':m,'aria-pressed':'false',onclick:function(){$('#walk-min').value=m;syncChips();}},m+' min'));
});
$('#walk-min').addEventListener('input',syncChips);
syncChips();
$('#walk-start').addEventListener('click',startWalk);
$('#w-arrived').addEventListener('click',function(){endWalk('Walk ended. Glad you arrived.');});
$('#g-safe').addEventListener('click',function(){endWalk('Checked in. Glad you are safe.');});
$('#w-extend').addEventListener('click',extendWalk);
$('#g-extend').addEventListener('click',extendWalk);

$('#fc-start').addEventListener('click',scheduleCall);
$('#fc-cancel').addEventListener('click',cancelWait);
$('#cu-accept').addEventListener('click',acceptCall);
$('#cu-decline').addEventListener('click',endCall);
$('#cu-endbtn').addEventListener('click',endCall);

$('#p-name').value=S.profile.name;
$('#p-blood').value=S.profile.blood;
$('#p-notes').value=S.profile.notes;
$('#p-name').addEventListener('input',function(e){S.profile.name=e.target.value;save();renderPreview();});
$('#p-blood').addEventListener('change',function(e){S.profile.blood=e.target.value;save();renderPreview();});
$('#p-notes').addEventListener('input',function(e){S.profile.notes=e.target.value;save();renderPreview();});

$('#contact-form').addEventListener('submit',function(e){
  e.preventDefault();
  var err=$('#contact-err');err.hidden=true;
  var name=$('#c-name').value.trim(),phone=cleanPhone($('#c-phone').value);
  if(!name){err.textContent='Enter a name for this contact.';err.hidden=false;return;}
  if(!phone){err.textContent='Enter a phone number with at least 7 digits.';err.hidden=false;return;}
  if(S.contacts.length>=5){err.textContent='You can save up to five contacts. Remove one first.';err.hidden=false;return;}
  S.contacts.push({name:name,phone:phone});save();
  $('#c-name').value='';$('#c-phone').value='';
  renderAll();toast('Contact added');
});
$('#copy-preview').addEventListener('click',function(){copy(buildMessage('I pressed the SOS button on my safety app.'),'Message copied');});
$('#test-siren').addEventListener('click',function(){
  if(alarm||siren)return;
  var ok=startSiren();
  if(!ok){toast('This device would not start the siren.');return;}
  setTimeout(function(){if(!alarm)stopSiren();},2000);
});
var eraseT=null;
$('#erase').addEventListener('click',function(){
  var b=$('#erase');
  if(!eraseT){
    b.textContent='Tap again to erase everything';
    eraseT=setTimeout(function(){eraseT=null;b.textContent='Erase my saved data';},4000);
    return;
  }
  clearTimeout(eraseT);eraseT=null;b.textContent='Erase my saved data';
  S={profile:{name:'',blood:'',notes:''},contacts:[],where:'',walk:null};
  try{localStorage.removeItem(KEY);}catch(e){}
  stopBeeps();
  $('#where').value='';$('#p-name').value='';$('#p-blood').value='';$('#p-notes').value='';
  applyWalk();renderAll();updateStatus();toast('Saved data erased');
});

window.addEventListener('hashchange',route);
renderNums();renderAll();applyWalk();route();
setInterval(tick,250);tick();
})();
