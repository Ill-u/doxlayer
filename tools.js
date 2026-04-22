
/* =============================================
   AIO Tools — Modular JavaScript Library
   Host on GitHub → serve via jsDelivr CDN
   ============================================= */
(function(w){
  'use strict';
  var AIO=w.AIO=w.AIO||{};

  /* ==========================================
     PRIVACY TOOLS
     ========================================== */

  // 1. EXIF Ghost Scrubber (requires piexif.js loaded on page)
  AIO.exifScrubber=function(el){
    var C=document.getElementById(el); if(!C) return;
    C.innerHTML=
      '<div class="tool-sec"><label>Upload Image</label>'+
      '<div class="file-zone" id="exifZone"><i class="fas fa-cloud-upload-alt"></i>'+
      '<p>Click or drag an image here</p><p class="sm">JPG, PNG, WebP — processed locally</p>'+
      '<input type="file" id="exifFile" accept="image/*"/></div></div>'+
      '<div id="exifInfo" class="tool-sec" style="display:none">'+
      '<label>Original Metadata</label><pre id="exifMeta" class="tool-inp" style="min-height:100px;white-space:pre-wrap;font-family:var(--font-mono);font-size:.85rem"></pre></div>'+
      '<button class="tool-btn" id="exifClean" style="display:none"><i class="fas fa-eraser"></i> Strip All Metadata</button>'+
      '<div id="exifRes" class="tool-res"><p style="color:var(--green);font-weight:600;margin-bottom:12px"><i class="fas fa-check-circle"></i> Metadata removed!</p>'+
      '<canvas id="exifCnv" style="display:none"></canvas>'+
      '<a class="tool-btn" id="exifDl" download="clean-image.png"><i class="fas fa-download"></i> Download Clean Image</a></div>';
    var fInput=C.querySelector('#exifFile'),
        zone=C.querySelector('#exifZone'),
        info=C.querySelector('#exifInfo'),
        meta=C.querySelector('#exifMeta'),
        btn=C.querySelector('#exifClean'),
        res=C.querySelector('#exifRes'),
        cnv=C.querySelector('#exifCnv'),
        dl=C.querySelector('#exifDl'),
        origData=null,origImg=null;
    zone.addEventListener('click',function(){fInput.click();});
    zone.addEventListener('dragover',function(e){e.preventDefault();zone.style.borderColor='var(--accent)';});
    zone.addEventListener('dragleave',function(){zone.style.borderColor='var(--border)';});
    zone.addEventListener('drop',function(e){e.preventDefault();zone.style.borderColor='var(--border)';if(e.dataTransfer.files.length)handleFile(e.dataTransfer.files[0]);});
    fInput.addEventListener('change',function(){if(fInput.files.length)handleFile(fInput.files[0]);});
    function handleFile(file){
      var reader=new FileReader();
      reader.onload=function(e){
        origData=e.target.result;
        try{
          if(typeof piexif!=='undefined'){
            var exif=piexif.load(origData),pretty={};
            for(var ifd in exif){if(ifd==='thumbnail')continue;pretty[ifd]={};for(var tag in exif[ifd]){var t=piexif.TAGS[ifd]&&piexif.TAGS[ifd][tag];pretty[ifd][t?t.name:tag]=exif[ifd][tag];}}
            meta.textContent=JSON.stringify(pretty,null,2);
          }else{meta.textContent='(piexif.js not loaded — will strip on re-encode)';}
        }catch(err){meta.textContent='No EXIF data found or error reading metadata.';}
        info.style.display='block';btn.style.display='inline-flex';
        origImg=new Image();origImg.src=origData;
      };
      reader.readAsDataURL(file);
    }
    btn.addEventListener('click',function(){
      if(!origImg)return;
      origImg.onload=function(){
        cnv.width=origImg.naturalWidth;cnv.height=origImg.naturalHeight;
        var ctx=cnv.getContext('2d');ctx.drawImage(origImg,0,0);
        var clean;
        try{
          if(typeof piexif!=='undefined'){clean=piexif.remove(origData);}
          else{clean=cnv.toDataURL('image/png');}
        }catch(e){clean=cnv.toDataURL('image/png');}
        dl.href=clean;res.classList.add('show');
      };
      if(origImg.complete&&origImg.naturalWidth)origImg.onload();
    });
  };

  // 2. Deepfake Noise Overlay
  AIO.noiseOverlay=function(el){
    var C=document.getElementById(el); if(!C) return;
    C.innerHTML=
      '<div class="tool-sec"><label>Upload Image</label>'+
      '<div class="file-zone" id="noiseZone"><i class="fas fa-shield-halved"></i>'+
      '<p>Upload image to protect</p><p class="sm">Adds subtle noise to defeat deepfake models</p>'+
      '<input type="file" id="noiseFile" accept="image/*"/></div></div>'+
      '<div class="tool-sec"><label>Noise Intensity: <span id="noiseVal">1</span>%</label>'+
      '<input type="range" id="noiseRange" min="0.5" max="5" step="0.5" value="1" style="width:100%;accent-color:var(--accent)"/></div>'+
      '<div class="tool-sec" id="noisePrev" style="display:none"><label>Preview</label>'+
      '<canvas id="noiseCnv" style="max-width:100%;border-radius:var(--radius-sm);border:1px solid var(--border)"></canvas></div>'+
      '<button class="tool-btn" id="noiseApply" style="display:none"><i class="fas fa-wand-magic-sparkles"></i> Apply Noise</button>'+
      '<div id="noiseRes" class="tool-res"><a class="tool-btn" id="noiseDl" download="protected-image.png"><i class="fas fa-download"></i> Download</a></div>';
    var fInput=C.querySelector('#noiseFile'),
        zone=C.querySelector('#noiseZone'),
        rng=C.querySelector('#noiseRange'),
        val=C.querySelector('#noiseVal'),
        prev=C.querySelector('#noisePrev'),
        cnv=C.querySelector('#noiseCnv'),
        apply=C.querySelector('#noiseApply'),
        res=C.querySelector('#noiseRes'),
        dl=C.querySelector('#noiseDl'),
        img=null;
    zone.addEventListener('click',function(){fInput.click();});
    fInput.addEventListener('change',function(e){if(e.target.files.length)loadImg(e.target.files[0]);});
    rng.addEventListener('input',function(){val.textContent=this.value;});
    function loadImg(file){
      var r=new FileReader();
      r.onload=function(e){
        img=new Image();img.onload=function(){
          cnv.width=img.naturalWidth;cnv.height=img.naturalHeight;
          cnv.getContext('2d').drawImage(img,0,0);
          prev.style.display='block';apply.style.display='inline-flex';
        };img.src=e.target.result;
      };r.readAsDataURL(file);
    }
    apply.addEventListener('click',function(){
      if(!img)return;
      var ctx=cnv.getContext('2d'),w=cnv.width,h=cnv.height;
      ctx.drawImage(img,0,0);
      var d=ctx.getImageData(0,0,w,h),p=d.data,
          amt=parseFloat(rng.value)/100;
      for(var i=0;i<p.length;i+=4){
        var n=(Math.random()-.5)*255*amt;
        p[i]=Math.min(255,Math.max(0,p[i]+n));
        p[i+1]=Math.min(255,Math.max(0,p[i+1]+n));
        p[i+2]=Math.min(255,Math.max(0,p[i+2]+n));
      }
      ctx.putImageData(d,0,0);
      dl.href=cnv.toDataURL('image/png');
      res.classList.add('show');
    });
  };

  // 3. Pwned Password Tester (k-Anonymity — no password leaves browser)
  AIO.pwnedCheck=function(el){
    var C=document.getElementById(el); if(!C) return;
    C.innerHTML=
      '<div class="tool-sec"><label>Enter Password (checked locally via k-Anonymity)</label>'+
      '<div style="position:relative">'+
      '<input type="password" class="tool-inp" id="pwnPw" placeholder="Your password is never sent in full" style="padding-right:48px"/>'+
      '<button id="pwnEye" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:1.1rem"><i class="fas fa-eye"></i></button>'+
      '</div></div>'+
      '<button class="tool-btn" id="pwnBtn"><i class="fas fa-search"></i> Check Breach Database</button>'+
      '<div id="pwnRes" class="tool-res"></div>';
    var pw=C.querySelector('#pwnPw'),
        eye=C.querySelector('#pwnEye'),
        btn=C.querySelector('#pwnBtn'),
        res=C.querySelector('#pwnRes');
    eye.addEventListener('click',function(){
      var show=pw.type==='password';pw.type=show?'text':'password';
      eye.innerHTML=show?'<i class="fas fa-eye-slash"></i>':'<i class="fas fa-eye"></i>';
    });
    btn.addEventListener('click',async function(){
      var val=pw.value;
      if(!val){res.innerHTML='<p style="color:var(--red)">Please enter a password.</p>';res.classList.add('show');return;}
      res.innerHTML='<p><i class="fas fa-spinner fa-spin"></i> Checking securely…</p>';res.classList.add('show');
      try{
        var enc=new TextEncoder(),hash=await crypto.subtle.digest('SHA-1',enc.encode(val)),
            hex=Array.from(new Uint8Array(hash)).map(function(b){return b.toString(16).padStart(2,'0');}).join('').toUpperCase(),
            pre=hex.slice(0,5),suf=hex.slice(5);
        var resp=await fetch('https://api.pwnedpasswords.com/range/'+pre,{headers:{'Add-Padding':'true'}});
        if(!resp.ok)throw new Error('API '+resp.status);
        var text=await resp.resp.text(),found=false,count=0;
        text.split('\n').forEach(function(line){
          var parts=line.trim().split(':');
          if(parts[0]===suf){found=true;count=parseInt(parts[1],10);}
        });
        if(found){
          res.innerHTML='<div style="text-align:center"><span class="badge badge-r"><i class="fas fa-exclamation-triangle"></i> COMPROMISED</span>'+
            '<p style="margin-top:12px">This password has appeared in <strong style="color:var(--red)">'+count.toLocaleString()+'</strong> data breaches.</p>'+
            '<p style="color:var(--text-muted);font-size:.85rem;margin-top:4px">Never use this password anywhere. Use a password manager to generate unique passwords.</p></div>';
        }else{
          res.innerHTML='<div style="text-align:center"><span class="badge badge-g"><i class="fas fa-check-circle"></i> NOT FOUND</span>'+
            '<p style="margin-top:12px;color:var(--text-secondary)">This password was not found in any known breach. Still consider using 12+ characters with mixed types.</p></div>';
        }
      }catch(e){
        res.innerHTML='<p style="color:var(--red)"><i class="fas fa-exclamation-circle"></i> Error: '+e.message+'. Try again.</p>';
      }
    });
  };

  /* ==========================================
     CAREER TOOLS
     ========================================== */

  // 4. ATS Keyword Matcher
  AIO.atsMatcher=function(el){
    var C=document.getElementById(el); if(!C) return;
    C.innerHTML=
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px" class="atsGrid">'+
      '<div class="tool-sec"><label><i class="fas fa-file-alt"></i> Your Resume Text</label>'+
      '<textarea class="tool-inp" id="atsR" placeholder="Paste resume text…"></textarea></div>'+
      '<div class="tool-sec"><label><i class="fas fa-briefcase"></i> Job Description</label>'+
      '<textarea class="tool-inp" id="atsJ" placeholder="Paste job description…"></textarea></div></div>'+
      '<style>@media(max-width:700px){.atsGrid{grid-template-columns:1fr!important}}</style>'+
      '<button class="tool-btn" id="atsBtn"><i class="fas fa-magnifying-glass"></i> Match Keywords</button>'+
      '<div id="atsRes" class="tool-res"></div>';
    document.getElementById('atsBtn').addEventListener('click',function(){
      var rTxt=document.getElementById('atsR').value.toLowerCase(),
          jTxt=document.getElementById('atsJ').value.toLowerCase(),
          res=document.getElementById('atsRes');
      if(!rTxt||!jTxt){res.innerHTML='<p style="color:var(--red)">Please fill both fields.</p>';res.classList.add('show');return;}
      var stop='a,an,the,and,or,but,in,on,at,to,for,of,with,by,from,is,are,was,were,be,been,being,have,has,had,do,does,did,will,would,shall,should,may,might,can,could,i,you,he,she,it,we,they,me,him,her,us,them,my,your,his,its,our,their,this,that,these,those,what,which,who,whom,when,where,why,how,all,each,every,both,few,more,most,other,some,such,no,nor,not,only,own,same,so,than,too,very,just,because,as,until,while,about,against,between,during,before,after,above,below,up,down,out,off,over,under,again,further,then,once,here,there,any'.split(',');
      var wJ=jTxt.match(/[a-z]{3,}/g)||[],
          wR=rTxt.match(/[a-z]{3,}/g)||[],
          kw={};
      wJ.forEach(function(w){if(stop.indexOf(w)===-1)kw[w]=(kw[w]||0)+1;});
      var sorted=Object.keys(kw).sort(function(a,b){return kw[b]-kw[a];}).slice(0,40),
          rSet={};wR.forEach(function(w){rSet[w]=true;});
      var m=sorted.filter(function(w){return rSet[w];}),
          miss=sorted.filter(function(w){return !rSet[w];}),
          pct=sorted.length?Math.round(m.length/sorted.length*100):0;
      var h='<div style="text-align:center;margin-bottom:16px"><span class="badge '+(pct>=70?'badge-g':pct>=40?'badge-y':'badge-r')+'">'+pct+'% Match</span></div>';
      h+='<h3 style="color:var(--green);margin-bottom:8px"><i class="fas fa-check"></i> Found ('+m.length+')</h3><div style="margin-bottom:16px">';
      m.forEach(function(w){h+='<span class="chip">'+w+'</span>';});
      h+='</div><h3 style="color:var(--red);margin-bottom:8px"><i class="fas fa-times"></i> Missing ('+miss.length+')</h3><div>';
      miss.forEach(function(w){h+='<span class="chip" style="background:rgba(239,68,68,.1);color:var(--red)">'+w+'</span>';});
      h+='</div>';
      if(miss.length) h+='<p style="margin-top:16px;color:var(--text-muted);font-size:.85rem"><i class="fas fa-lightbulb"></i> Tip: Naturally incorporate missing keywords into your resume where they genuinely apply.</p>';
      res.innerHTML=h;res.classList.add('show');
    });
  };

  // 5. Professional Tone Shifter
  AIO.toneShifter=function(el){
    var C=document.getElementById(el); if(!C) return;
    var M=[
      [/\bhey\b/gi,'Dear Hiring Manager'],
      [/\bhi\b/gi,'Greetings'],
      [/\byeah\b/gi,'Indeed'],
      [/\bnope\b/gi,'Unfortunately not'],
      [/\bgonna\b/gi,'going to'],
      [/\bwanna\b/gi,'wish to'],
      [/\bgotta\b/gi,'must'],
      [/\bkinda\b/gi,'somewhat'],
      [/\bdunno\b/gi,'am uncertain about'],
      [/\bawesome\b/gi,'exceptional'],
      [/\bcool\b/gi,'noteworthy'],
      [/\bstuff\b/gi,'materials'],
      [/\bthings\b/gi,'items'],
      [/\bguys\b/gi,'team'],
      [/\bboss\b/gi,'supervisor'],
      [/\bjob\b/gi,'position'],
      [/\bget\b/gi,'obtain'],
      [/\bgot\b/gi,'received'],
      [/\bfix\b/gi,'resolve'],
      [/\bhelp\b/gi,'assist'],
      [/\btell\b/gi,'inform'],
      [/\bask\b/gi,'inquire'],
      [/\bstart\b/gi,'commence'],
      [/\bend\b/gi,'conclude'],
      [/\bshow\b/gi,'demonstrate'],
      [/\buse\b/gi,'utilize'],
      [/\bmake\b/gi,'facilitate'],
      [/\bthink\b/gi,'believe'],
      [/\bneed\b/gi,'require'],
      [/\bwant\b/gi,'seek'],
      [/\blike\b/gi,'appreciate'],
      [/\bsorry\b/gi,'I apologize'],
      [/\bthanks\b/gi,'I appreciate your consideration'],
      [/\bthank you\b/gi,'I extend my gratitude'],
      [/\basap\b/gi,'at your earliest convenience'],
      [/\bby the way\b/gi,'additionally'],
      [/\bjust wanted to\b/gi,'I am writing to'],
      [/\bi feel like\b/gi,'it is my assessment that'],
      [/\bno problem\b/gi,'it is my pleasure'],
      [/\btotally\b/gi,'entirely'],
      [/\breally\b/gi,'particularly'],
      [/\bvery\b/gi,'remarkably'],
      [/\bbig\b/gi,'significant'],
      [/\bsmall\b/gi,'minimal'],
      [/\bgood\b/gi,'favorable'],
      [/\bbad\b/gi,'unfavorable'],
      [/\bhard\b/gi,'challenging'],
      [/\beasy\b/gi,'straightforward']
    ];
    C.innerHTML=
      '<div class="tool-sec"><label><i class="fas fa-comment-dots"></i> Informal Text</label>'+
      '<textarea class="tool-inp" id="toneIn" placeholder="Paste casual text here…" rows="6"></textarea></div>'+
      '<button class="tool-btn" id="toneBtn"><i class="fas fa-wand-magic-sparkles"></i> Shift to Professional</button>'+
      '<div id="toneRes" class="tool-res"><div class="tool-sec"><label><i class="fas fa-building"></i> Professional Output</label>'+
      '<textarea class="tool-inp" id="toneOut" rows="6" readonly></textarea></div>'+
      '<button class="tool-btn sec" id="toneCp"><i class="fas fa-copy"></i> Copy</button></div>';
    document.getElementById('toneBtn').addEventListener('click',function(){
      var t=document.getElementById('toneIn').value,out=t;
      M.forEach(function(r){out=out.replace(r[0],r[1]);});
      document.getElementById('toneOut').value=out;
      document.getElementById('toneRes').classList.add('show');
    });
    document.getElementById('toneCp').addEventListener('click',function(){
      var ta=document.getElementById('toneOut');ta.select();document.execCommand('copy');
      this.innerHTML='<i class="fas fa-check"></i> Copied!';
      var btn=this;setTimeout(function(){btn.innerHTML='<i class="fas fa-copy"></i> Copy';},2000);
    });
  };

  // 6. Social Profile Preview (LinkedIn-style)
  AIO.profilePreview=function(el){
    var C=document.getElementById(el); if(!C) return;
    C.innerHTML=
      '<div class="tool-sec"><label>Profile Text</label>'+
      '<textarea class="tool-inp" id="ppText" placeholder="Write your professional summary…" rows="6"></textarea>'+
      '<p style="color:var(--text-muted);font-size:.85rem;margin-top:4px">Characters: <span id="ppCount">0</span> / 220 (mobile cutoff)</p></div>'+
      '<div class="tool-sec"><label>Preview</label>'+
      '<div id="ppCard" style="background:var(--bg-tertiary);border-radius:var(--radius-md);padding:20px;max-width:400px">'+
      '<div style="display:flex;gap:12px;align-items:flex-start">'+
      '<div style="width:56px;height:56px;border-radius:50%;background:var(--accent);flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:1.2rem">U</div>'+
      '<div style="flex:1;min-width:0"><p style="font-weight:600;margin-bottom:2px">Your Name</p>'+
      '<p style="color:var(--text-muted);font-size:.8rem;margin-bottom:8px">Professional Title</p>'+
      '<p id="ppPreview" style="font-size:.9rem;color:var(--text-secondary);line-height:1.5"></p>'+
      '<span id="ppMore" style="color:var(--accent);font-weight:600;cursor:pointer;font-size:.9rem;display:none">…see more</span>'+
      '</div></div></div></div>';
    var ta=document.getElementById('ppText'),
        cnt=document.getElementById('ppCount'),
        prev=document.getElementById('ppPreview'),
        more=document.getElementById('ppMore');
    ta.addEventListener('input',function(){
      var t=ta.value,len=t.length;cnt.textContent=len;
      if(len>220){prev.textContent=t.slice(0,220);more.style.display='inline';}
      else{prev.textContent=t;more.style.display='none';}
      cnt.style.color=len>300?'var(--red)':len>220?'var(--amber)':'var(--text-muted)';
    });
  };

  /* ==========================================
     CREATOR TOOLS
     ========================================== */

  // 7. Social Safe-Zone Overlay
  AIO.safeZone=function(el){
    var C=document.getElementById(el); if(!C) return;
    C.innerHTML=
      '<div class="tool-sec"><label>Platform</label><select class="tool-inp" id="szPlat">'+
      '<option value="ig">Photo Grid (4:5 crop)</option>'+
      '<option value="tw">Microblog Header</option>'+
      '<option value="fb">Social Cover</option></select></div>'+
      '<div class="tool-sec"><label>Upload Image</label>'+
      '<div class="file-zone" id="szZone"><i class="fas fa-crop-simple"></i><p>Upload image to check safe zones</p>'+
      '<input type="file" id="szFile" accept="image/*"/></div></div>'+
      '<div class="tool-sec" id="szPrev" style="display:none"><label>Click to add text markers</label>'+
      '<canvas id="szCnv" style="max-width:100%;border-radius:var(--radius-sm);border:1px solid var(--border);cursor:crosshair"></canvas></div>'+
      '<div id="szRes" class="tool-res"><a class="tool-btn" id="szDl" download="safezone-overlay.png"><i class="fas fa-download"></i> Download</a></div>';
    var fInput=C.querySelector('#szFile'),zone=C.querySelector('#szZone'),
        plat=C.querySelector('#szPlat'),prev=C.querySelector('#szPrev'),
        cnv=C.querySelector('#szCnv'),res=C.querySelector('#szRes'),
        dl=C.querySelector('#szDl'),img=null,markers=[];
    zone.addEventListener('click',function(){fInput.click();});
    fInput.addEventListener('change',function(e){if(e.target.files.length)load(e.target.files[0]);});
    plat.addEventListener('change',function(){if(img)draw();});
    cnv.addEventListener('click',function(e){
      if(!img)return;var r=cnv.getBoundingClientRect(),
          x=(e.clientX-r.left)*(cnv.width/r.width),
          y=(e.clientY-r.top)*(cnv.height/r.height);
      markers.push({x:x,y:y});draw();
    });
    function load(file){
      var r=new FileReader();r.onload=function(e){
        img=new Image();img.onload=function(){prev.style.display='block';markers=[];draw();};img.src=e.target.result;
      };r.readAsDataURL(file);
    }
    function draw(){
      var w=img.naturalWidth,h=img.naturalHeight;cnv.width=w;cnv.height=h;
      var ctx=cnv.getContext('2d');ctx.drawImage(img,0,0);
      var zones={ig:{top:h*.1,bot:h*.18,left:w*.08,right:w*.08},tw:{top:h*.25,bot:h*.35,left:w*.05,right:w*.05},fb:{top:h*.15,bot:h*.25,left:w*.1,right:w*.1}};
      var z=zones[plat.value]||zones.ig;
      ctx.fillStyle='rgba(0,0,0,0.45)';ctx.fillRect(0,0,w,z.top);ctx.fillRect(0,h-z.bot,w,z.bot);
      ctx.fillRect(0,z.top,z.left,h-z.top-z.bot);ctx.fillRect(w-z.right,z.top,z.right,h-z.top-z.bot);
      ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.setLineDash([8,4]);
      ctx.strokeRect(z.left,z.top,w-z.left-z.right,h-z.top-z.bot);ctx.setLineDash([]);
      ctx.fillStyle='rgba(255,255,255,0.9)';ctx.font='bold '+Math.max(14,w*.018)+'px Inter,sans-serif';
      ctx.textAlign='center';ctx.fillText('SAFE ZONE',w/2,z.top+28);
      if(plat.value==='ig'){ctx.fillText('• SEE MORE •',w/2,h-z.bot-14);}
      markers.forEach(function(m){ctx.beginPath();ctx.arc(m.x,m.y,6,0,Math.PI*2);ctx.fillStyle='rgba(239,68,68,0.7)';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();});
      dl.href=cnv.toDataURL('image/png');res.classList.add('show');
    }
  };

  // 8. Script Breath-Mark Tool
  AIO.breathMark=function(el){
    var C=document.getElementById(el); if(!C) return;
    C.innerHTML=
      '<div class="tool-sec"><label>Words Per Breath</label>'+
      '<input type="number" class="tool-inp" id="bmWpb" value="40" min="10" max="100" style="max-width:120px"/></div>'+
      '<div class="tool-sec"><label>Script Text</label>'+
      '<textarea class="tool-inp" id="bmText" placeholder="Paste your script…" rows="10"></textarea></div>'+
      '<button class="tool-btn" id="bmBtn"><i class="fas fa-lungs"></i> Insert Breath Marks</button>'+
      '<div id="bmRes" class="tool-res"><div class="tool-sec"><label>Result</label>'+
      '<div id="bmOut" style="line-height:2.2;font-size:1rem;padding:16px;background:var(--bg-tertiary);border-radius:var(--radius-sm)"></div></div>'+
      '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:8px">'+
      '<span id="bmWc" class="chip"></span><span id="bmRt" class="chip"></span><span id="bmBc" class="chip"></span></div>'+
      '<button class="tool-btn sec" id="bmCp" style="margin-top:12px"><i class="fas fa-copy"></i> Copy</button></div>';
    document.getElementById('bmBtn').addEventListener('click',function(){
      var txt=document.getElementById('bmText').value,wpb=parseInt(document.getElementById('bmWpb').value)||40,
          words=txt.split(/\s+/).filter(function(w){return w.length>0;}),
          wc=words.length,rt=Math.ceil(wc/150),bc=Math.floor(wc/wpb),out='';
      words.forEach(function(w,i){out+=w+' ';if((i+1)%wpb===0&&i<words.length-1)out+='<span style="color:var(--accent);font-size:1.3em;font-weight:700">•</span> ';});
      document.getElementById('bmOut').innerHTML=out.trim();
      document.getElementById('bmWc').textContent=wc+' words';
      document.getElementById('bmRt').textContent='~'+rt+' min read';
      document.getElementById('bmBc').textContent=bc+' breath marks';
      document.getElementById('bmRes').classList.add('show');
    });
    document.getElementById('bmCp')&&document.getElementById('bmCp').addEventListener('click',function(){
      var t=document.getElementById('bmOut').textContent;
      navigator.clipboard.writeText(t);this.innerHTML='<i class="fas fa-check"></i> Copied!';
      var b=this;setTimeout(function(){b.innerHTML='<i class="fas fa-copy"></i> Copy';},2000);
    });
  };

  // 9. Handle Availability Checker
  AIO.handleCheck=function(el){
    var C=document.getElementById(el); if(!C) return;
    var P=[
      {name:'Instagram',icon:'fab fa-instagram',color:'#E4405F',url:'https://www.instagram.com/'},
      {name:'X (Twitter)',icon:'fab fa-x-twitter',color:'#000',url:'https://x.com/'},
      {name:'TikTok',icon:'fab fa-tiktok',color:'#010101',url:'https://www.tiktok.com/@'},
      {name:'GitHub',icon:'fab fa-github',color:'#333',url:'https://github.com/'},
      {name:'Reddit',icon:'fab fa-reddit-alien',color:'#FF4500',url:'https://www.reddit.com/user/'},
      {name:'Medium',icon:'fab fa-medium',color:'#000',url:'https://medium.com/@'},
      {name:'Pinterest',icon:'fab fa-pinterest',color:'#BD081C',url:'https://www.pinterest.com/'},
      {name:'Dev.to',icon:'fab fa-dev',color:'#0A0A0A',url:'https://dev.to/'},
      {name:'CodePen',icon:'fab fa-codepen',color:'#1E1F26',url:'https://codepen.io/'},
      {name:'Telegram',icon:'fab fa-telegram',color:'#26A5E4',url:'https://t.me/'}
    ];
    C.innerHTML=
      '<div class="tool-sec"><label>Username to Check</label>'+
      '<input class="tool-inp" id="hcUser" placeholder="e.g. janedoe" style="max-width:320px"/></div>'+
      '<button class="tool-btn" id="hcBtn"><i class="fas fa-search"></i> Check All Platforms</button>'+
      '<div id="hcRes" class="tool-res"><div id="hcList"></div></div>';
    document.getElementById('hcBtn').addEventListener('click',function(){
      var u=document.getElementById('hcUser').value.trim().toLowerCase().replace(/[^a-z0-9._-]/g,''),
          res=document.getElementById('hcRes'),list=document.getElementById('hcList');
      if(!u){list.innerHTML='<p style="color:var(--red)">Enter a username.</p>';res.classList.add('show');return;}
      var h='';
      P.forEach(function(p){
        h+='<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border)">'+
            '<div style="display:flex;align-items:center;gap:10px"><i class="'+p.icon+'" style="font-size:1.2rem;color:'+p.color+';width:24px;text-align:center"></i>'+
            '<span style="font-weight:500">'+p.name+'</span></div>'+
            '<div id="hc-'+p.name.replace(/[^a-z]/gi,'')+'" style="display:flex;align-items:center;gap:8px">'+
            '<i class="fas fa-spinner fa-spin" style="color:var(--text-muted)"></i>'+
            '<a href="'+p.url+u+'" target="_blank" rel="noopener" style="font-size:.8rem;color:var(--text-muted)"><i class="fas fa-external-link-alt"></i></a></div></div>';
      });
      list.innerHTML=h;res.classList.add('show');
      P.forEach(function(p){
        var id='hc-'+p.name.replace(/[^a-z]/gi,''),cell=document.getElementById(id);
        var img=new Image();
        img.onload=function(){cell.innerHTML='<span class="badge badge-r">Taken</span>'+(cell.querySelector('a')?cell.querySelector('a').outerHTML:'');};
        img.onerror=function(){cell.innerHTML='<span class="badge badge-g">Available?</span>'+(cell.querySelector('a')?cell.querySelector('a').outerHTML:'');};
        if(p.name==='GitHub'){img.src='https://github.com/'+u+'.png?size=64';}
        else if(p.name==='Reddit'){img.src='https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png';cell.innerHTML='<span class="badge badge-y">Check</span><a href="'+p.url+u+'" target="_blank" rel="noopener" style="font-size:.8rem;color:var(--text-muted)"><i class="fas fa-external-link-alt"></i></a>';}
        else{cell.innerHTML='<span class="badge badge-y">Check</span><a href="'+p.url+u+'" target="_blank" rel="noopener" style="font-size:.8rem"><i class="fas fa-external-link-alt"></i></a>';}
      });
    });
  };

  /* ==========================================
     DESIGN TOOLS
     ========================================== */

  // 10. SVG Blob Generator
  AIO.blobGen=function(el){
    var C=document.getElementById(el); if(!C) return;
    C.innerHTML=
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px" class="blobGrid">'+
      '<style>@media(max-width:700px){.blobGrid{grid-template-columns:1fr!important}}</style>'+
      '<div><div class="tool-sec"><label>Color 1</label><input type="color" id="blC1" value="#6366f1" class="tool-inp" style="height:48px;padding:4px"/></div>'+
      '<div class="tool-sec"><label>Color 2</label><input type="color" id="blC2" value="#ec4899" class="tool-inp" style="height:48px;padding:4px"/></div>'+
      '<div class="tool-sec"><label>Complexity: <span id="blCv">4</span></label>'+
      '<input type="range" id="blCx" min="3" max="8" value="4" style="width:100%;accent-color:var(--accent)"/></div>'+
      '<div class="tool-sec"><label>Size: <span id="blSv">300</span>px</label>'+
      '<input type="range" id="blSz" min="100" max="600" value="300" step="10" style="width:100%;accent-color:var(--accent)"/></div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
      '<button class="tool-btn" id="blGen"><i class="fas fa-rotate"></i> Generate</button>'+
      '<button class="tool-btn sec" id="blCp"><i class="fas fa-code"></i> Copy SVG</button>'+
      '<button class="tool-btn sec" id="blDl"><i class="fas fa-download"></i> Download</button></div></div>'+
      '<div style="display:flex;align-items:center;justify-content:center;background:var(--bg-tertiary);border-radius:var(--radius-md);padding:20px;min-height:300px">'+
      '<div id="blOut"></div></div></div>';
    function gen(){
      var c1=document.getElementById('blC1').value,c2=document.getElementById('blC2').value,
          n=parseInt(document.getElementById('blCx').value),s=parseInt(document.getElementById('blSz').value),
          el=document.getElementById('blOut'),pts=[],step=2*Math.PI/n;
      for(var i=0;i<n;i++){var a=step*i+(Math.random()-.5)*.8,r=s/2*(.65+Math.random()*.35);
        pts.push({x:s/2+r*Math.cos(a),y:s/2+r*Math.sin(a)});}
      var d='M '+pts[0].x.toFixed(1)+' '+pts[0].y.toFixed(1)+' ';
      for(var i=0;i<pts.length;i++){
        var p0=pts[(i-1+pts.length)%pts.length],p1=pts[i],p2=pts[(i+1)%pts.length],p3=pts[(i+2)%pts.length];
        var cp1x=p1.x+(p2.x-p0.x)/5,cp1y=p1.y+(p2.y-p0.y)/5,
            cp2x=p2.x-(p3.x-p1.x)/5,cp2y=p2.y-(p3.y-p1.y)/5;
        d+='C '+cp1x.toFixed(1)+' '+cp1y.toFixed(1)+','+cp2x.toFixed(1)+' '+cp2y.toFixed(1)+','+p2.x.toFixed(1)+' '+p2.y.toFixed(1)+' ';
      }
      d+='Z';
      var id='b'+Date.now();
      el.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="'+s+'" height="'+s+'" viewBox="0 0 '+s+' '+s+'" id="'+id+'"><defs><linearGradient id="g'+id+'" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="'+c1+'"/><stop offset="100%" stop-color="'+c2+'"/></linearGradient></defs><path d="'+d+'" fill="url(#g'+id+')"/></svg>';
    }
    document.getElementById('blCx').addEventListener('input',function(){document.getElementById('blCv').textContent=this.value;});
    document.getElementById('blSz').addEventListener('input',function(){document.getElementById('blSv').textContent=this.value;});
    document.getElementById('blGen').addEventListener('click',gen);
    document.getElementById('blCp').addEventListener('click',function(){
      var s=document.querySelector('#blOut svg');if(!s)return;
      navigator.clipboard.writeText(s.outerHTML);this.innerHTML='<i class="fas fa-check"></i> Copied!';
      var b=this;setTimeout(function(){b.innerHTML='<i class="fas fa-code"></i> Copy SVG';},2000);
    });
    document.getElementById('blDl').addEventListener('click',function(){
      var s=document.querySelector('#blOut svg');if(!s)return;
      var b=new Blob([s.outerHTML],{type:'image/svg+xml'}),u=URL.createObjectURL(b),
          a=document.createElement('a');a.href=u;a.download='blob.svg';a.click();URL.revokeObjectURL(u);
    });
    gen();
  };

  // 11. Color Palette Extractor (requires ColorThief CDN)
  AIO.palette=function(el){
    var C=document.getElementById(el); if(!C) return;
    C.innerHTML=
      '<div class="tool-sec"><label>Upload Image</label>'+
      '<div class="file-zone" id="cpZone"><i class="fas fa-palette"></i><p>Drop an image to extract colors</p>'+
      '<input type="file" id="cpFile" accept="image/*"/></div></div>'+
      '<div class="tool-sec" id="cpImgWrap" style="display:none"><label>Source</label>'+
      '<img id="cpImg" style="max-width:100%;border-radius:var(--radius-sm);border:1px solid var(--border)"/></div>'+
      '<div id="cpRes" class="tool-res"><label>Extracted Palette</label><div id="cpSwatches" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:12px;margin-top:12px"></div></div>';
    var fInput=C.querySelector('#cpFile'),zone=C.querySelector('#cpZone'),
        imgEl=C.querySelector('#cpImg'),wrap=C.querySelector('#cpImgWrap'),
        res=C.querySelector('#cpRes'),sw=C.querySelector('#cpSwatches');
    zone.addEventListener('click',function(){fInput.click();});
    fInput.addEventListener('change',function(e){if(e.target.files.length)load(e.target.files[0]);});
    function load(file){
      var r=new FileReader();r.onload=function(e){
        imgEl.onload=function(){wrap.style.display='block';extract();};
        imgEl.src=e.target.result;
      };r.readAsDataURL(file);
    }
    function extract(){
      if(typeof ColorThief==='undefined'){sw.innerHTML='<p style="color:var(--red)">ColorThief library not loaded. Add the CDN script to your page.</p>';res.classList.add('show');return;}
      try{
        var ct=new ColorThief(),colors=ct.getPalette(imgEl,8),h='';
        colors.forEach(function(c){
          var hex='#'+c.map(function(v){return v.toString(16).padStart(2,'0');}).join('');
          var lum=(.299*c[0]+.587*c[1]+.114*c[2])/255;
          h+='<div style="background:'+hex+';border-radius:var(--radius-sm);padding:16px 12px;text-align:center;cursor:pointer;transition:transform .2s" class="swatch" data-hex="'+hex+'">'+
              '<span style="font-family:var(--font-mono);font-weight:600;font-size:.85rem;color:'+(lum>.5?'#000':'#fff')+'">'+hex.toUpperCase()+'</span></div>';
        });
        sw.innerHTML=h;res.classList.add('show');
        sw.querySelectorAll('.swatch').forEach(function(s){
          s.addEventListener('click',function(){
            navigator.clipboard.writeText(this.dataset.hex);
            var sp=this.querySelector('span');sp.textContent='Copied!';
            var h=sp.parentElement.style.background,b=this;
            setTimeout(function(){sp.textContent=b.dataset.hex.toUpperCase();},1500);
          });
        });
      }catch(e){sw.innerHTML='<p style="color:var(--red)">Could not extract. Try a different image.</p>';res.classList.add('show');}
    }
  };

  // 12. Glassmorphism Builder
  AIO.glassBuild=function(el){
    var C=document.getElementById(el); if(!C) return;
    C.innerHTML=
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px" class="glassGrid">'+
      '<style>@media(max-width:700px){.glassGrid{grid-template-columns:1fr!important}}</style>'+
      '<div>'+
      '<div class="tool-sec"><label>Blur: <span id="glBv">12</span>px</label>'+
      '<input type="range" id="glBl" min="0" max="40" value="12" style="width:100%;accent-color:var(--accent)"/></div>'+
      '<div class="tool-sec"><label>Opacity: <span id="glOv">0.15</span></label>'+
      '<input type="range" id="glOp" min="0" max="1" step="0.05" value="0.15" style="width:100%;accent-color:var(--accent)"/></div>'+
      '<div class="tool-sec"><label>Border Opacity: <span id="glBov">0.18</span></label>'+
      '<input type="range" id="glBo" min="0" max="1" step="0.05" value="0.18" style="width:100%;accent-color:var(--accent)"/></div>'+
      '<div class="tool-sec"><label>Border Radius: <span id="glRv">16</span>px</label>'+
      '<input type="range" id="glRd" min="0" max="50" value="16" style="width:100%;accent-color:var(--accent)"/></div>'+
      '<div class="tool-sec"><label>Background</label><select class="tool-inp" id="glBg">'+
      '<option value="gradient">Gradient Mesh</option><option value="photo">Photo</option><option value="solid">Solid</option></select></div>'+
      '</div><div>'+
      '<div style="border-radius:var(--radius-md);overflow:hidden;height:350px;display:flex;align-items:center;justify-content:center;padding:20px" id="glPreview">'+
      '<div id="glCard" style="width:260px;height:180px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:1.1rem;text-shadow:0 1px 3px rgba(0,0,0,.3)">Glass Card</div></div>'+
      '<div class="tool-sec" style="margin-top:16px"><label>Generated CSS</label>'+
      '<pre id="glCss" class="tool-inp" style="min-height:120px;font-family:var(--font-mono);font-size:.8rem;white-space:pre-wrap;cursor:pointer" title="Click to copy"></pre></div></div></div>';
    var bl=document.getElementById('glBl'),op=document.getElementById('glOp'),
        bo=document.getElementById('glBo'),rd=document.getElementById('glRd'),
        bg=document.getElementById('glBg'),card=document.getElementById('glCard'),
        prev=document.getElementById('glPreview'),css=document.getElementById('glCss');
    function update(){
      var b=bl.value,o=op.value,bO=bo.value,r=rd.value;
      document.getElementById('glBv').textContent=b;
      document.getElementById('glOv').textContent=o;
      document.getElementById('glBov').textContent=bO;
      document.getElementById('glRv').textContent=r;
      var bgs={gradient:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',photo:'url(https://images.unsplash.com/photo-1557683316-973673baf926?w=600) center/cover',solid:'#1a1a2e'};
      prev.style.background=bgs[bg.value]||bgs.gradient;
      var rgba='rgba(255,255,255,'+o+')',brgba='rgba(255,255,255,'+bO+')';
      card.style.background=rgba;
      card.style.backdropFilter='blur('+b+'px)';card.style.webkitBackdropFilter='blur('+b+'px)';
      card.style.border='1px solid '+brgba;card.style.borderRadius=r+'px';
      card.style.boxShadow='0 8px 32px 0 rgba(31,38,135,0.37)';
      css.textContent='.glass {\n  background: '+rgba+';\n  backdrop-filter: blur('+b+'px);\n  -webkit-backdrop-filter: blur('+b+'px);\n  border: 1px solid '+brgba+';\n  border-radius: '+r+'px;\n  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);\n}';
    }
    [bl,op,bo,rd,bg].forEach(function(e){e.addEventListener('input',update);});
    css.addEventListener('click',function(){navigator.clipboard.writeText(this.textContent);this.style.borderColor='var(--green)';var t=this;setTimeout(function(){t.style.borderColor='var(--border)';},1500);});
    update();
  };

  /* ==========================================
     SEO TOOLS
     ========================================== */

  // 13. LSI Keyword Clusterer
  AIO.lsiCluster=function(el){
    var C=document.getElementById(el); if(!C) return;
    C.innerHTML=
      '<div class="tool-sec"><label>Keywords (one per line)</label>'+
      '<textarea class="tool-inp" id="lsiIn" placeholder="digital marketing tips\nmarketing strategy 2026\nbest marketing tools\nseo tips for beginners\nadvanced seo strategy\nsocial media marketing\ncontent marketing guide" rows="8"></textarea></div>'+
      '<button class="tool-btn" id="lsiBtn"><i class="fas fa-diagram-project"></i> Cluster Keywords</button>'+
      '<div id="lsiRes" class="tool-res"></div>';
    document.getElementById('lsiBtn').addEventListener('click',function(){
      var raw=document.getElementById('lsiIn').value.trim().split('\n').map(function(s){return s.trim().toLowerCase();}).filter(function(s){return s.length>2;}),
          res=document.getElementById('lsiRes'),clusters={},used={};
      raw.forEach(function(kw,i){
        if(used[i])return;clusters[kw]=[kw];used[i]=true;
        var w1=kw.split(/\s+/);
        raw.forEach(function(other,j){
          if(used[j]||i===j)return;
          var w2=other.split(/\s+/),shared=0;
          w1.forEach(function(w){if(w2.indexOf(w)!==-1&&w.length>2)shared++;});
          if(shared>=Math.min(2,Math.min(w1.length,w2.length))){
            clusters[kw].push(other);used[j]=true;
          }
        });
      });
      var h='<h3 style="margin-bottom:16px">Keyword Clusters</h3>';
      Object.keys(clusters).forEach(function(root,idx){
        h+='<div style="background:var(--bg-tertiary);border-radius:var(--radius-sm);padding:16px;margin-bottom:12px;border-left:3px solid var(--accent)">'+
            '<p style="font-weight:600;margin-bottom:8px"><i class="fas fa-folder" style="color:var(--accent);margin-right:6px"></i>Cluster '+(idx+1)+' — <span style="color:var(--accent)">'+root+'</span></p><div>';
        clusters[root].forEach(function(kw){h+='<span class="chip">'+kw+'</span>';});
        h+='</div></div>';
      });
      res.innerHTML=h;res.classList.add('show');
    });
  };

  // 14. Stop-Word URL Cleaner
  AIO.urlClean=function(el){
    var C=document.getElementById(el); if(!C) return;
    var SW='a,an,the,and,or,but,is,in,on,at,to,for,of,with,by,from,up,about,into,over,after,under,beneath,between,through,during,before,above,below,can,could,will,would,shall,should,may,might,must,has,have,had,do,does,did,be,been,being,am,is,are,was,were,i,you,he,she,it,we,they,me,him,her,us,them,my,your,his,its,our,their,this,that,these,those,what,which,who,whom,when,where,why,how,not,no,nor,so,if,then,than,too,very,just,also,as,only,own,same,both,few,more,most,other,some,such,any,all,each,every'.split(',');
    C.innerHTML=
      '<div class="tool-sec"><label>Page Title or URL</label>'+
      '<textarea class="tool-inp" id="ucIn" placeholder="How to Build the Best Website for Your Business in 2026" rows="3"></textarea></div>'+
      '<div class="tool-sec"><label>Separator</label><select class="tool-inp" id="ucSep" style="max-width:200px">'+
      '<option value="-">Hyphen (-)</option><option value="_">Underscore (_)</option></select></div>'+
      '<button class="tool-btn" id="ucBtn"><i class="fas fa-link-slash"></i> Clean URL</button>'+
      '<div id="ucRes" class="tool-res"><div class="tool-sec"><label>Clean Slug</label>'+
      '<div style="display:flex;gap:8px;align-items:center"><input class="tool-inp" id="ucOut" readonly style="font-family:var(--font-mono)"/>'+
      '<button class="tool-btn sec" id="ucCp"><i class="fas fa-copy"></i></button></div></div>'+
      '<div class="tool-sec"><label>Removed Words</label><div id="ucRem"></div></div>'+
      '<p style="color:var(--text-muted);font-size:.85rem;margin-top:8px">Characters: <span id="ucLen"></span></p></div>';
    document.getElementById('ucBtn').addEventListener('click',function(){
      var t=document.getElementById('ucIn').value,s=document.getElementById('ucSep').value,
          words=t.toLowerCase().replace(/[^a-z0-9\s-]/g,'').split(/\s+/).filter(function(w){return w.length>0;}),
          clean=[],removed=[];
      words.forEach(function(w){if(SW.indexOf(w)===-1&&w.length>1)clean.push(w);else removed.push(w);});
      var slug=clean.join(s);
      document.getElementById('ucOut').value=slug;
      document.getElementById('ucRem').innerHTML=removed.length?removed.map(function(w){return '<span class="chip" style="background:rgba(239,68,68,.1);color:var(--red)">'+w+'</span>';}).join(' '):'<span style="color:var(--green)">No stop words found!</span>';
      document.getElementById('ucLen').textContent=slug.length+' characters';
      document.getElementById('ucRes').classList.add('show');
    });
    document.getElementById('ucCp')&&document.getElementById('ucCp').addEventListener('click',function(){
      var o=document.getElementById('ucOut');o.select();document.execCommand('copy');
      this.innerHTML='<i class="fas fa-check"></i>';var b=this;setTimeout(function(){b.innerHTML='<i class="fas fa-copy"></i>';},1500);
    });
  };

  // 15. Readability Score Calculator
  AIO.readability=function(el){
    var C=document.getElementById(el); if(!C) return;
    C.innerHTML=
      '<div class="tool-sec"><label>Paste Text to Analyze</label>'+
      '<textarea class="tool-inp" id="rdIn" placeholder="Paste your article, blog post, or any text…" rows="10"></textarea></div>'+
      '<button class="tool-btn" id="rdBtn"><i class="fas fa-book-open"></i> Calculate Readability</button>'+
      '<div id="rdRes" class="tool-res"></div>';
    document.getElementById('rdBtn').addEventListener('click',function(){
      var txt=document.getElementById('rdIn').value,res=document.getElementById('rdRes');
      if(!txt.trim()){res.innerHTML='<p style="color:var(--red)">Please enter text.</p>';res.classList.add('show');return;}
      var sents=txt.split(/[.!?]+/).filter(function(s){return s.trim().split(/\s+/).length>2;}),
          words=txt.trim().split(/\s+/).filter(function(w){return w.length>0;}),
          syllables=0;
      words.forEach(function(w){
        w=w.toLowerCase().replace(/[^a-z]/g,'');if(!w)return;
        var s=0,prev=false;('aeiouy').split('').forEach(function(){});
        for(var i=0;i<w.length;i++){
          var v='aeiouy'.indexOf(w[i])!==-1;
          if(v&&!prev)s++;prev=v;
        }
        if(w.length>3&&w.slice(-2)==='ed')s=Math.max(1,s-1);
        if(w.length>4&&w.slice(-2)==='es')s=Math.max(1,s-1);
        syllables+=Math.max(1,s);
      });
      var wc=words.length,sc=sents.length||1,
          flesch=206.835-1.015*(wc/sc)-84.6*(syllables/wc),
          fkgl=0.39*(wc/sc)+11.8*(syllables/wc)-15.59,
          complex=words.filter(function(w){var c=0;for(var i=0;i<w.length;i++){if('aeiouy'.indexOf(w[i])!==-1&&(i===0||'aeiouy'.indexOf(w[i-1])===-1))c++;}return c>=3;}).length,
          fog=.4*((wc/sc)+100*(complex/wc)),
          level=flesch>=80?'Easy':flesch>=60?'Standard':flesch>=40?'Moderate':flesch>=20?'Difficult':'Very Difficult',
          col=flesch>=60?'var(--green)':flesch>=40?'var(--amber)':'var(--red)';
      res.innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px;margin-bottom:20px">'+
        '<div style="text-align:center;padding:16px;background:var(--bg-tertiary);border-radius:var(--radius-sm)"><p style="font-size:2rem;font-weight:800;color:'+col+'">'+flesch.toFixed(1)+'</p><p style="font-size:.8rem;color:var(--text-muted)">Flesch Reading Ease</p></div>'+
        '<div style="text-align:center;padding:16px;background:var(--bg-tertiary);border-radius:var(--radius-sm)"><p style="font-size:2rem;font-weight:800;color:var(--accent)">'+fkgl.toFixed(1)+'</p><p style="font-size:.8rem;color:var(--text-muted)">Grade Level</p></div>'+
        '<div style="text-align:center;padding:16px;background:var(--bg-tertiary);border-radius:var(--radius-sm)"><p style="font-size:2rem;font-weight:800;color:var(--accent)">'+fog.toFixed(1)+'</p><p style="font-size:.8rem;color:var(--text-muted)">Gunning Fog Index</p></div>'+
        '</div><div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px">'+
        '<span class="chip">'+wc+' words</span><span class="chip">'+sc+' sentences</span><span class="chip">'+syllables+' syllables</span>'+
        '<span class="chip" style="background:rgba(99,102,241,.1);color:var(--accent)">'+level+'</span></div>'+
        '<p style="color:var(--text-muted);font-size:.85rem">Aim for 60–70 on the Flesch scale for general web audiences. Grade level 7–9 is ideal for broad readability.</p>';
      res.classList.add('show');
    });
  };

})(window);
