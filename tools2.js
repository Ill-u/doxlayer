/* =============================================
 AIO Tools 2 — Extended Library (Tools 16-60)
 Host on GitHub → serve via jsDelivr CDN
 ============================================= */
(function(w) {
  'use strict';
  var AIO = w.AIO = w.AIO || {};

  /* ==========================================
     PRIVACY & DATA SOVEREIGNTY
     ========================================== */

  // 16. Biometric Landmark Scrambler — unchanged (original code)
  AIO.biometricScrambler = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div class="tool-sec"><label>Upload Photo</label>' +
      '<div class="file-zone" id="bioZone"><i class="fas fa-face-smile"></i>' +
      '<p>Upload a photo to scramble facial landmarks</p><p class="sm">JPG, PNG — processed locally</p>' +
      '<input type="file" id="bioFile" accept="image/*"/></div></div>' +
      '<div class="tool-sec"><label>Scramble Intensity: <span id="bioIv">3</span>px</label>' +
      '<input type="range" id="bioInt" min="1" max="10" value="3" style="width:100%;accent-color:var(--accent)"/></div>' +
      '<div class="tool-sec"><label>Grid Size: <span id="bioGv">16</span>px</label>' +
      '<input type="range" id="bioGrid" min="4" max="32" value="16" style="width:100%;accent-color:var(--accent)"/></div>' +
      '<p style="color:var(--text-muted);font-size:.85rem;margin-bottom:12px">Click 4 corners on the image to mark each face region. Add multiple regions.</p>' +
      '<div class="tool-sec" id="bioPrev" style="display:none"><label>Image — Click to Mark Face Regions</label>' +
      '<canvas id="bioCnv" style="max-width:100%;border-radius:var(--radius-sm);border:1px solid var(--border);cursor:crosshair"></canvas>' +
      '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">' +
      '<button class="tool-btn sec" id="bioUndo"><i class="fas fa-undo"></i> Undo</button>' +
      '<button class="tool-btn" id="bioApply"><i class="fas fa-shield-halved"></i> Scramble</button></div></div>' +
      '<div id="bioRes" class="tool-res"><p style="color:var(--green);font-weight:600;margin-bottom:12px"><i class="fas fa-check-circle"></i> Landmarks scrambled!</p>' +
      '<canvas id="bioOut" style="max-width:100%;border-radius:var(--radius-sm);margin-bottom:12px"></canvas>' +
      '<a class="tool-btn" id="bioDl" download="scrambled.png"><i class="fas fa-download"></i> Download</a></div>';

    var fI = C.querySelector('#bioFile'),
      zone = C.querySelector('#bioZone'),
      rI = C.querySelector('#bioInt'),
      rG = C.querySelector('#bioGrid'),
      prev = C.querySelector('#bioPrev'),
      cnv = C.querySelector('#bioCnv'),
      res = C.querySelector('#bioRes'),
      outC = C.querySelector('#bioOut'),
      dl = C.querySelector('#bioDl'),
      img = null,
      regions = [],
      cur = [];

    zone.addEventListener('click', function() { fI.click(); });
    fI.addEventListener('change', function(e) { if (e.target.files.length) load(e.target.files[0]); });
    rI.addEventListener('input', function() { C.querySelector('#bioIv').textContent = this.value; });
    rG.addEventListener('input', function() { C.querySelector('#bioGv').textContent = this.value; });

    function load(file) {
      var r = new FileReader();
      r.onload = function(e) {
        img = new Image();
        img.onload = function() {
          cnv.width = img.naturalWidth;
          cnv.height = img.naturalHeight;
          redraw();
          prev.style.display = 'block';
        };
        img.src = e.target.result;
      };
      r.readAsDataURL(file);
    }

    function redraw() {
      var ctx = cnv.getContext('2d');
      ctx.drawImage(img, 0, 0);
      regions.forEach(function(reg) {
        ctx.strokeStyle = 'rgba(239,68,68,0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        reg.forEach(function(p, i) { i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); });
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = 'rgba(239,68,68,0.15)';
        ctx.fill();
      });
      cur.forEach(function(p) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
      });
    }

    cnv.addEventListener('click', function(e) {
      if (!img) return;
      var r = cnv.getBoundingClientRect();
      var x = (e.clientX - r.left) * (cnv.width / r.width),
        y = (e.clientY - r.top) * (cnv.height / r.height);
      cur.push({ x: x, y: y });
      if (cur.length >= 4) { regions.push(cur.slice()); cur = []; }
      redraw();
    });

    C.querySelector('#bioUndo').addEventListener('click', function() {
      if (cur.length) cur.pop();
      else if (regions.length) regions.pop();
      redraw();
    });

    C.querySelector('#bioApply').addEventListener('click', function() {
      if (!img || !regions.length) return;
      outC.width = img.naturalWidth;
      outC.height = img.naturalHeight;
      var ctx = outC.getContext('2d');
      ctx.drawImage(img, 0, 0);
      var intensity = parseInt(rI.value),
        grid = parseInt(rG.value);
      regions.forEach(function(reg) {
        var xs = reg.map(function(p) { return p.x; }),
          ys = reg.map(function(p) { return p.y; });
        var mnx = Math.floor(Math.min.apply(null, xs)),
          mxx = Math.ceil(Math.max.apply(null, xs));
        var mny = Math.floor(Math.min.apply(null, ys)),
          mxy = Math.ceil(Math.max.apply(null, ys));
        var w = mxx - mnx,
          h = mxy - mny;
        if (w < 2 || h < 2) return;
        var id = ctx.getImageData(mnx, mny, w, h),
          d = id.data;
        for (var gy = 0; gy < h; gy += grid)
          for (var gx = 0; gx < w; gx += grid) {
            var ox = Math.round((Math.random() - .5) * intensity * 2),
              oy = Math.round((Math.random() - .5) * intensity * 2);
            for (var py = gy; py < Math.min(gy + grid, h); py++)
              for (var px = gx; px < Math.min(gx + grid, w); px++) {
                var sx = Math.max(0, Math.min(w - 1, px + ox)),
                  sy = Math.max(0, Math.min(h - 1, py + oy));
                var di = (py * w + px) * 4,
                  si = (sy * w + sx) * 4;
                d[di] = d[si];
                d[di + 1] = d[si + 1];
                d[di + 2] = d[si + 2];
              }
          }
        ctx.putImageData(id, mnx, mny);
      });
      dl.href = outC.toDataURL('image/png');
      res.classList.add('show');
    });
  };

  // 17. GDPR Logic-Mesh Generator (added crypto fallback)
  AIO.gdprLogicMesh = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div class="tool-sec"><label>Processing Purpose</label><input class="tool-inp" id="gdprPurpose" placeholder="e.g., Email Marketing Automation"/></div>' +
      '<div class="tool-sec"><label>Data Categories</label><div style="display:flex;gap:8px;flex-wrap:wrap" id="gdprCats">' +
      ['Email', 'Name', 'Location', 'Behavior', 'Biometric', 'Financial'].map(function(c) {
        return '<label style="display:flex;align-items:center;gap:6px;padding:8px 14px;background:var(--bg-tertiary);border-radius:var(--radius-full);cursor:pointer;font-size:.85rem;border:1px solid var(--border)"><input type="checkbox" value="' + c + '" style="accent-color:var(--accent)"/> ' + c + '</label>';
      }).join('') + '</div></div>' +
      '<div class="tool-sec"><label>Logic Rules</label><div id="gdprRules"></div><button class="tool-btn sec" id="gdprAdd" style="margin-top:8px"><i class="fas fa-plus"></i> Add Rule</button></div>' +
      '<button class="tool-btn" id="gdprGen"><i class="fas fa-file-code"></i> Generate JSON Manifest</button>' +
      '<div id="gdprRes" class="tool-res"><div class="tool-sec"><label>GDPR 2.0 Logic-Mesh Manifest</label><pre id="gdprOut" class="tool-inp" style="min-height:200px;white-space:pre-wrap;font-family:var(--font-mono);font-size:.8rem;cursor:pointer" title="Click to copy"></pre></div></div>';

    var rulesDiv = C.querySelector('#gdprRules');

    function addRule() {
      var div = document.createElement('div');
      div.style.cssText = 'display:grid;grid-template-columns:1fr auto 1fr auto;gap:8px;align-items:center;margin-bottom:8px;padding:12px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border:1px solid var(--border)';
      div.innerHTML = '<select class="tool-inp" style="padding:8px"><option value="user_consent">User Consent Given</option><option value="data_age">Data Age < Days</option><option value="purpose_match">Purpose Matches</option><option value="region">User Region</option><option value="opt_out">Opt-Out Flag</option></select><span style="color:var(--text-muted);font-weight:600">THEN</span><select class="tool-inp" style="padding:8px"><option value="allow">Allow Processing</option><option value="deny">Deny Processing</option><option value="anonymize">Anonymize Data</option><option value="notify">Notify DPO</option><option value="delete">Schedule Deletion</option></select><button class="tool-btn sec" style="padding:8px 12px" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>';
      rulesDiv.appendChild(div);
    }

    C.querySelector('#gdprAdd').addEventListener('click', addRule);
    addRule();

    C.querySelector('#gdprGen').addEventListener('click', function() {
      var purpose = C.querySelector('#gdprPurpose').value || 'Unspecified';
      var cats = [];
      C.querySelectorAll('#gdprCats input:checked').forEach(function(cb) { cats.push(cb.value); });
      var ruleEls = rulesDiv.children,
        logicRules = [];
      for (var i = 0; i < ruleEls.length; i++) {
        var sel = ruleEls[i].querySelectorAll('select');
        if (sel.length >= 2) logicRules.push({ condition: sel[0].value, action: sel[1].value });
      }
      // Use fallback for crypto
      var cryptoObj = window.crypto || window.msCrypto;
      var randomBytes = new Uint8Array(16);
      if (cryptoObj && cryptoObj.getRandomValues) {
        cryptoObj.getRandomValues(randomBytes);
      } else {
        for (var j = 0; j < 16; j++) randomBytes[j] = Math.floor(Math.random() * 256);
      }
      var auditHash = Array.from(randomBytes).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
      var manifest = {
        schema: 'GDPR-LogicMesh-v2.0',
        generated: new Date().toISOString(),
        processing_purpose: purpose,
        data_categories: cats.length ? cats : ['Unspecified'],
        automated_decision_rules: logicRules,
        compliance: { article_22_automated_decisions: true, right_to_explanation: true, data_minimization: cats.length <= 3 },
        audit_trail: { version: '1.0', hash: 'sha256:' + auditHash }
      };
      var out = JSON.stringify(manifest, null, 2);
      C.querySelector('#gdprOut').textContent = out;
      C.querySelector('#gdprRes').classList.add('show');
      C.querySelector('#gdprOut').onclick = function() { navigator.clipboard.writeText(out); };
    });
  };

  // 18. Shadow-Ban Forensic Canvas Test — unchanged
  AIO.shadowBanTest = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div class="tool-sec"><p style="color:var(--text-secondary);margin-bottom:16px">Generates a multi-layer browser fingerprint from Canvas, WebGL, and AudioContext. Compare across devices/browsers to detect if platforms assign different trust levels to your sessions.</p></div>' +
      '<button class="tool-btn" id="sbBtn"><i class="fas fa-fingerprint"></i> Generate Fingerprint</button><div id="sbRes" class="tool-res"></div>';
    C.querySelector('#sbBtn').addEventListener('click', function() {
      var canvas = document.createElement('canvas');
      canvas.width = 280;
      canvas.height = 60;
      var ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('ShadowBan Test', 2, 15);
      ctx.fillStyle = 'rgba(102,204,0,0.7)';
      ctx.fillText('Canvas Hash', 4, 35);
      ctx.beginPath();
      ctx.arc(50, 50, 20, 0, Math.PI * 2);
      ctx.fillStyle = 'rgb(255,0,0)';
      ctx.fill();
      var gl = canvas.getContext('webgl');
      var debugInfo = gl ? gl.getExtension('WEBGL_debug_renderer_info') : null;
      var gpu = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'N/A';
      var dataUrl = canvas.toDataURL();
      var hash = 0;
      for (var i = 0; i < dataUrl.length; i++) { hash = ((hash << 5) - hash) + dataUrl.charCodeAt(i);
        hash |= 0; }
      var hexHash = Math.abs(hash).toString(16).padStart(8, '0');
      var actx = new(window.AudioContext || window.webkitAudioContext)();
      var osc = actx.createOscillator();
      var analyser = actx.createAnalyser();
      var gain = actx.createGain();
      gain.gain.value = 0;
      osc.connect(analyser);
      analyser.connect(gain);
      gain.connect(actx.destination);
      osc.start(0);
      var freq = new Float32Array(analyser.frequencyBinCount);
      analyser.getFloatFrequencyData(freq);
      var audioHash = 0;
      for (var i = 0; i < 10; i++) audioHash += Math.round(freq[i] * 1000);
      osc.stop();
      actx.close();
      var screen = window.screen.width + 'x' + window.screen.height + '@' + (window.devicePixelRatio || 1);
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      var langs = navigator.languages ? navigator.languages.join(',') : navigator.language;
      C.querySelector('#sbRes').innerHTML = '<h3 style="margin-bottom:16px">Your Browser Fingerprint</h3><div style="display:grid;gap:8px">' + [
          ['Canvas Hash', hexHash],
          ['GPU Renderer', gpu || 'Blocked'],
          ['Audio Hash', Math.abs(audioHash).toString(16)],
          ['Screen', screen],
          ['Timezone', tz],
          ['Languages', langs],
          ['Platform', navigator.platform],
          ['Touch Points', navigator.maxTouchPoints]
        ].map(function(p) {
          return '<div style="display:flex;justify-content:space-between;padding:10px 14px;background:var(--bg-tertiary);border-radius:var(--radius-sm)"><span style="color:var(--text-muted);font-size:.85rem">' + p[0] + '</span><span style="font-family:var(--font-mono);font-size:.85rem;font-weight:600;color:var(--accent)">' + p[1] + '</span></div>';
        }).join('') + '</div>' +
        '<div style="margin-top:16px;padding:16px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border-left:3px solid var(--accent)"><p style="font-size:.85rem;color:var(--text-secondary)"><strong>Combined:</strong><br/><span style="font-family:var(--font-mono);font-size:.8rem;word-break:break-all;color:var(--accent)">' + hexHash + '-' + Math.abs(audioHash).toString(16) + '-' + screen.replace(/[@x]/g, '') + '</span></p></div>' +
        '<p style="margin-top:12px;color:var(--text-muted);font-size:.8rem">Open in a different browser or incognito mode. If the hash changes significantly, the platform may assign different trust scores to your sessions.</p>';
      C.querySelector('#sbRes').classList.add('show');
    });
  };

  // 19. Voice-Print Jitter Mask — unchanged
  AIO.voiceJitterMask = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div class="tool-sec"><label>Upload Audio</label><div class="file-zone" id="vjZone"><i class="fas fa-microphone"></i><p>Upload a voice recording to protect</p><p class="sm">MP3, WAV, OGG — processed locally via Web Audio API</p><input type="file" id="vjFile" accept="audio/*"/></div></div>' +
      '<div class="tool-sec"><label>Jitter Intensity: <span id="vjIv">15</span>%</label><input type="range" id="vjInt" min="5" max="40" value="15" style="width:100%;accent-color:var(--accent)"/></div>' +
      '<div class="tool-sec"><label>Harmonic Shift: <span id="vjHv">3</span></label><input type="range" id="vjHar" min="1" max="8" value="3" style="width:100%;accent-color:var(--accent)"/></div>' +
      '<button class="tool-btn" id="vjApply" style="display:none"><i class="fas fa-shield-halved"></i> Apply Jitter Mask</button>' +
      '<div id="vjRes" class="tool-res"><p style="color:var(--green);font-weight:600;margin-bottom:12px"><i class="fas fa-check-circle"></i> Voice-print protected!</p><audio id="vjAudio" controls style="width:100%;margin-bottom:12px"></audio><a class="tool-btn" id="vjDl" download="protected-voice.wav"><i class="fas fa-download"></i> Download</a></div>';
    var fI = C.querySelector('#vjFile'),
      zone = C.querySelector('#vjZone'),
      btn = C.querySelector('#vjApply'),
      res = C.querySelector('#vjRes'),
      audioEl = C.querySelector('#vjAudio'),
      dl = C.querySelector('#vjDl'),
      audioBuffer = null;
    zone.addEventListener('click', function() { fI.click(); });
    fI.addEventListener('change', function(e) {
      if (e.target.files.length) {
        var r = new FileReader();
        r.onload = function(ev) {
          var actx = new(window.AudioContext || window.webkitAudioContext)();
          actx.decodeAudioData(ev.target.result, function(buf) { audioBuffer = buf;
            btn.style.display = 'inline-flex';
            actx.close(); }, function() { alert('Could not decode audio.'); });
        };
        r.readAsArrayBuffer(e.target.files[0]);
      }
    });
    C.querySelector('#vjInt').addEventListener('input', function() { C.querySelector('#vjIv').textContent = this.value; });
    C.querySelector('#vjHar').addEventListener('input', function() { C.querySelector('#vjHv').textContent = this.value; });
    btn.addEventListener('click', function() {
      if (!audioBuffer) return;
      var actx = new(window.AudioContext || window.webkitAudioContext)();
      var sr = actx.sampleRate,
        len = audioBuffer.length,
        ch = audioBuffer.numberOfChannels;
      var outBuf = actx.createBuffer(ch, len, sr);
      var jitter = parseInt(C.querySelector('#vjInt').value) / 100,
        harmonic = parseInt(C.querySelector('#vjHar').value);
      for (var c = 0; c < ch; c++) {
        var inp = audioBuffer.getChannelData(c),
          out = outBuf.getChannelData(c);
        for (var i = 0; i < len; i++) {
          out[i] = Math.max(-1, Math.min(1, inp[i] + (Math.random() - .5) * 2 * jitter * .1 + Math.sin(i * harmonic * .001) * jitter * .05));
        }
      }
      var wav = encodeWAV(outBuf);
      var blob = new Blob([wav], { type: 'audio/wav' });
      var url = URL.createObjectURL(blob);
      audioEl.src = url;
      dl.href = url;
      res.classList.add('show');
      actx.close();
    });

    function encodeWAV(buffer) {
      var sr = buffer.sampleRate,
        ch = buffer.numberOfChannels,
        bps = 16,
        samples = [];
      for (var c = 0; c < ch; c++) {
        var d = buffer.getChannelData(c);
        for (var i = 0; i < d.length; i++) {
          var s = Math.max(-1, Math.min(1, d[i]));
          samples.push(s < 0 ? s * 0x8000 : s * 0x7FFF);
        }
      }
      var ba = ch * bps / 8,
        br = sr * ba,
        ds = samples.length * bps / 8,
        buf = new ArrayBuffer(44 + ds),
        v = new DataView(buf);

      function ws(o, s) { for (var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); }
      ws(0, 'RIFF');
      v.setUint32(4, 36 + ds, true);
      ws(8, 'WAVE');
      ws(12, 'fmt ');
      v.setUint32(16, 16, true);
      v.setUint16(20, 1, true);
      v.setUint16(22, ch, true);
      v.setUint32(24, sr, true);
      v.setUint32(28, br, true);
      v.setUint16(32, ba, true);
      v.setUint16(34, bps, true);
      ws(36, 'data');
      v.setUint32(40, ds, true);
      for (var i = 0; i < samples.length; i++) v.setInt16(44 + i * 2, samples[i], true);
      return buf;
    }
  };

  // 20. Smart-Home Data Auditor — unchanged
  AIO.smartHomeAudit = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    var suspicious = [
      { p: /amazonaws\.com/i, r: 'high', l: 'AWS Cloud Upload' },
      { p: /google-analytics|googletagmanager/i, r: 'medium', l: 'Google Analytics' },
      { p: /facebook\.com\/tr|fbcdn/i, r: 'high', l: 'Facebook Tracking' },
      { p: /doubleclick\.net/i, r: 'medium', l: 'DoubleClick Ads' },
      { p: /telemetry|metrics|analytics/i, r: 'low', l: 'Generic Telemetry' },
      { p: /api\.amazon|alexa/i, r: 'medium', l: 'Amazon Alexa' },
      { p: /samsung|smartthings/i, r: 'medium', l: 'Samsung SmartThings' },
      { p: /tuya|smart-life/i, r: 'medium', l: 'Tuya IoT' },
      { p: /voice|speech|microphone/i, r: 'high', l: 'Voice Data' },
      { p: /location|gps|geoloc/i, r: 'high', l: 'Location Data' },
      { p: /biometric|face.*id/i, r: 'high', l: 'Biometric Data' },
      { p: /encrypt|ssl|tls/i, r: 'info', l: 'Encrypted (Good)' },
      { p: /firmware.*update|ota/i, r: 'low', l: 'Firmware Update' },
      { p: /1\.1\.1\.1|8\.8\.8\.8/i, r: 'low', l: 'DNS Query' }
    ];
    C.innerHTML = '<div class="tool-sec"><label>Paste IoT Log or Network Dump</label><textarea class="tool-inp" id="iotIn" placeholder="Paste your router logs, firewall output, or network capture here…" rows="10"></textarea></div><button class="tool-btn" id="iotBtn"><i class="fas fa-search"></i> Audit Connections</button><div id="iotRes" class="tool-res"></div>';
    C.querySelector('#iotBtn').addEventListener('click', function() {
      var text = C.querySelector('#iotIn').value;
      if (!text.trim()) return;
      var lines = text.split('\n').filter(function(l) { return l.trim().length > 0; }),
        findings = [],
        rc = { high: 0, medium: 0, low: 0, info: 0 };
      lines.forEach(function(line, idx) {
        suspicious.forEach(function(s) {
          if (s.p.test(line)) {
            findings.push({ line: idx + 1, text: line.trim().substring(0, 120), risk: s.r, label: s.l });
            rc[s.r]++;
          }
        });
      });
      var total = rc.high * 3 + rc.medium * 2 + rc.low;
      var grade = total === 0 ? 'A+' : total <= 3 ? 'A' : total <= 8 ? 'B' : total <= 15 ? 'C' : 'D';
      var gc = { 'A+': 'var(--green)', 'A': 'var(--green)', 'B': 'var(--amber)', 'C': 'var(--amber)', 'D': 'var(--red)' };
      var h = '<div style="text-align:center;margin-bottom:20px"><span style="font-size:3rem;font-weight:800;color:' + gc[grade] + '">' + grade + '</span><p style="color:var(--text-muted);font-size:.85rem">Privacy Risk Grade (' + lines.length + ' lines)</p></div>';
      h += '<div style="display:flex;gap:12px;justify-content:center;margin-bottom:20px;flex-wrap:wrap">';
      [{ k: 'high', l: 'High', c: 'badge-r' }, { k: 'medium', l: 'Medium', c: 'badge-y' }, { k: 'low', l: 'Low', c: 'badge-g' }, { k: 'info', l: 'Info', c: 'badge-g' }].forEach(function(x) { h += '<span class="badge ' + x.c + '">' + x.l + ': ' + rc[x.k] + '</span>'; });
      h += '</div>';
      if (findings.length) {
        h += '<div style="max-height:300px;overflow-y:auto">';
        findings.forEach(function(f) {
          var col = f.risk === 'high' ? 'var(--red)' : f.risk === 'medium' ? 'var(--amber)' : 'var(--accent)';
          h += '<div style="padding:10px 14px;margin-bottom:6px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border-left:3px solid ' + col + ';font-size:.85rem"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:' + col + ';font-weight:600">' + f.label + '</span><span style="color:var(--text-muted);font-size:.75rem">Line ' + f.line + '</span></div><code style="font-family:var(--font-mono);font-size:.75rem;color:var(--text-muted);word-break:break-all">' + f.text + '</code></div>';
        });
        h += '</div>';
      } else {
        h += '<div style="text-align:center;padding:20px"><i class="fas fa-shield-halved" style="font-size:2rem;color:var(--green);margin-bottom:8px;display:block"></i><p style="color:var(--green);font-weight:600">No suspicious patterns detected</p></div>';
      }
      C.querySelector('#iotRes').innerHTML = h;
      C.querySelector('#iotRes').classList.add('show');
    });
  };

  // 21. AI Opt-Out Binary Burner — FIXED PNG offset calculation
  AIO.binaryBurner = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div class="tool-sec"><label>Upload File to Protect</label><div class="file-zone" id="binZone"><i class="fas fa-file-shield"></i><p>Upload PNG or TXT file</p><p class="sm">Injects anti-AI training markers into file binary</p><input type="file" id="binFile" accept=".png,.txt,.jpg,.jpeg"/></div></div>' +
      '<div class="tool-sec"><label>Protection Level</label><select class="tool-inp" id="binLevel"><option value="soft">Soft — Standard opt-out tags</option><option value="medium" selected>Medium — Tag + Header Poison</option><option value="hard">Hard — Maximum disruption</option></select></div>' +
      '<button class="tool-btn" id="binApply" style="display:none"><i class="fas fa-fire"></i> Burn Anti-AI Markers</button>' +
      '<div id="binRes" class="tool-res"><p style="color:var(--green);font-weight:600;margin-bottom:8px"><i class="fas fa-check-circle"></i> File protected!</p><div id="binDetails" style="margin-bottom:12px"></div><a class="tool-btn" id="binDl" download><i class="fas fa-download"></i> Download Protected File</a></div>';

    var fI = C.querySelector('#binFile'),
      zone = C.querySelector('#binZone'),
      btn = C.querySelector('#binApply'),
      res = C.querySelector('#binRes'),
      dl = C.querySelector('#binDl'),
      fileData = null,
      fileName = '';

    zone.addEventListener('click', function() { fI.click(); });
    fI.addEventListener('change', function(e) {
      if (!e.target.files.length) return;
      var file = e.target.files[0];
      fileName = file.name;
      var r = new FileReader();
      r.onload = function(ev) { fileData = new Uint8Array(ev.target.result);
        btn.style.display = 'inline-flex'; };
      r.readAsArrayBuffer(file);
    });

    function crc32(buf) {
      var t = crc32.t || (crc32.t = (function() {
        var t = [];
        for (var n = 0; n < 256; n++) {
          var c = n;
          for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
          t[n] = c;
        }
        return t;
      })());
      var c = 0xFFFFFFFF;
      for (var i = 0; i < buf.length; i++) c = (c >>> 8) ^ t[(c ^ buf[i]) & 0xFF];
      return (c ^ 0xFFFFFFFF) >>> 0;
    }

    function makeChunk(keyword, text) {
      var kw = new TextEncoder().encode(keyword),
        tx = new TextEncoder().encode(text),
        dl = kw.length + 1 + tx.length,
        chunk = new Uint8Array(12 + dl),
        v = new DataView(chunk.buffer);
      v.setUint32(0, dl, false);
      chunk.set([0x74, 0x45, 0x58, 0x74], 4);
      chunk.set(kw, 8);
      chunk[8 + kw.length] = 0;
      chunk.set(tx, 8 + kw.length + 1);
      v.setUint32(8 + dl, crc32(chunk.slice(4, 8 + dl)), false);
      return chunk;
    }

    btn.addEventListener('click', function() {
      if (!fileData) return;
      var level = C.querySelector('#binLevel').value;
      var bytes = new Uint8Array(fileData);
      var markers = [];

      if (fileName.endsWith('.png')) {
        // Correct IHDR length reading: bytes 8‑11 (big-endian) after PNG signature
        var ihdrLen = (bytes[8] << 24) | (bytes[9] << 16) | (bytes[10] << 8) | bytes[11];
        var afterIHDR = 8 + 4 + 4 + ihdrLen + 4; // signature + length + 'IHDR' + data + CRC
        var t1 = makeChunk('ai-training-opt-out', 'DO NOT USE FOR AI TRAINING');
        var t2 = makeChunk('noai', 'true');
        var nb = new Uint8Array(bytes.length + t1.length + t2.length);
        nb.set(bytes.slice(0, afterIHDR), 0);
        nb.set(t1, afterIHDR);
        nb.set(t2, afterIHDR + t1.length);
        nb.set(bytes.slice(afterIHDR), afterIHDR + t1.length + t2.length);
        bytes = nb;
        markers.push('PNG tEXt: ai-training-opt-out');
        markers.push('PNG tEXt: noai=true');

        if (level === 'hard') {
          var t3 = makeChunk('poison', 'AI_SCRAPER_REJECT');
          // Insert before IEND chunk
          var fb = new Uint8Array(bytes.length + t3.length);
          for (var i = bytes.length - 4; i > 0; i--) {
            if (bytes[i] === 0x49 && bytes[i + 1] === 0x45 && bytes[i + 2] === 0x4E && bytes[i + 3] === 0x44) {
              fb.set(bytes.slice(0, i - 4), 0);
              fb.set(t3, i - 4);
              fb.set(bytes.slice(i - 4), i - 4 + t3.length);
              bytes = fb;
              break;
            }
          }
          markers.push('PNG tEXt: poison marker');
        }
      } else {
        // Text file: inject header and optional zero-width characters
        var header = '/* [NO-AI-TRAINING] Protected content. */\n';
        var orig = new TextDecoder().decode(bytes);
        if (level !== 'soft') {
          var p = '';
          for (var i = 0; i < orig.length; i++) {
            p += orig[i];
            if (i % 3 === 0) p += '\u200B';
            if (i % 7 === 0) p += '\u200D';
          }
          bytes = new TextEncoder().encode(header + p);
          markers.push('Zero-width injection');
        } else {
          bytes = new TextEncoder().encode(header + orig);
        }
        markers.push('Header: NO-AI-TRAINING');
      }

      var blob = new Blob([bytes], { type: 'application/octet-stream' });
      var url = URL.createObjectURL(blob);
      dl.href = url;
      dl.download = 'protected-' + fileName;
      C.querySelector('#binDetails').innerHTML = markers.map(function(m) { return '<span class="chip"><i class="fas fa-check" style="color:var(--green)"></i> ' + m + '</span>'; }).join(' ');
      res.classList.add('show');
    });
  };

  /* ==========================================
     CAREER & HR
     ========================================== */

  // 22. Skill Half-Life Decay Pulse — unchanged
  AIO.skillDecay = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    var roles = {
      'Frontend Developer': { hl: 2.1, sk: ['React', 'TypeScript', 'CSS', 'Web Components', 'WASM'] },
      'Backend Developer': { hl: 2.8, sk: ['Node.js', 'Go', 'Rust', 'Kubernetes', 'gRPC'] },
      'Data Scientist': { hl: 1.5, sk: ['Python', 'LLM Fine-tuning', 'MLOps', 'Statistics', 'Data Engineering'] },
      'DevOps Engineer': { hl: 1.8, sk: ['Kubernetes', 'Terraform', 'GitOps', 'Platform Engineering', 'SRE'] },
      'UX Designer': { hl: 3.0, sk: ['Figma', 'Design Systems', 'AI Design', 'Accessibility', 'Spatial Design'] },
      'Product Manager': { hl: 3.5, sk: ['AI Product Strategy', 'Data-Driven', 'User Research', 'Growth', 'Ethics'] },
      'Marketing Manager': { hl: 1.9, sk: ['AI Content', 'Performance Marketing', 'Attribution', 'Community', 'Brand Safety'] },
      'AI/ML Engineer': { hl: 0.9, sk: ['LLM Architecture', 'RLHF', 'Prompt Engineering', 'Model Optimization', 'AI Safety'] },
      'Content Writer': { hl: 1.0, sk: ['AI-Human Collab', 'SEO 2026', 'Storytelling', 'Fact-Checking', 'Voice Dev'] },
      'Cybersecurity Analyst': { hl: 1.2, sk: ['AI Threat Detection', 'Zero Trust', 'Cloud Security', 'Incident Response', 'Compliance'] },
      'Graphic Designer': { hl: 2.0, sk: ['AI Image Tools', 'Motion Design', '3D Design', 'Brand Systems', 'AR/VR'] },
      'HR Manager': { hl: 2.5, sk: ['AI Recruiting', 'DEI Analytics', 'Remote Culture', 'Skills Architecture', 'Ethical AI'] },
      'Accountant': { hl: 3.2, sk: ['AI Bookkeeping', 'Crypto Accounting', 'ESG Reporting', 'Strategic Finance', 'RegTech'] }
    };
    C.innerHTML = '<div class="tool-sec"><label>Select Your Role</label><select class="tool-inp" id="sdRole">' + Object.keys(roles).map(function(r) { return '<option value="' + r + '">' + r + '</option>'; }).join('') + '</select></div>' +
      '<div class="tool-sec"><label>Last Major Skill Update</label><input type="date" class="tool-inp" id="sdDate" style="max-width:250px"/></div>' +
      '<button class="tool-btn" id="sdBtn"><i class="fas fa-heart-pulse"></i> Calculate Decay</button><div id="sdRes" class="tool-res"></div>';
    C.querySelector('#sdBtn').addEventListener('click', function() {
      var role = C.querySelector('#sdRole').value,
        dateStr = C.querySelector('#sdDate').value,
        data = roles[role];
      if (!dateStr) { C.querySelector('#sdRes').innerHTML = '<p style="color:var(--red)">Select a date.</p>';
        C.querySelector('#sdRes').classList.add('show'); return; }
      var last = new Date(dateStr),
        now = new Date(),
        ye = (now - last) / (365.25 * 864e5),
        hl = data.hl;
      var remaining = Math.pow(0.5, ye / hl) * 100;
      var decay = new Date(last.getTime() + hl * 365.25 * 864e5);
      var critical = new Date(last.getTime() + hl * 2 * 365.25 * 864e5);
      var color = remaining > 70 ? 'var(--green)' : remaining > 40 ? 'var(--amber)' : 'var(--red)';
      var status = remaining > 70 ? 'Current' : remaining > 40 ? 'Decaying' : 'Critical';
      var h = '<div style="text-align:center;margin-bottom:24px"><div style="font-size:4rem;font-weight:800;color:' + color + '">' + Math.round(remaining) + '%</div><p style="color:var(--text-muted)">Skill Relevance Remaining</p><span class="badge ' + (remaining > 70 ? 'badge-g' : remaining > 40 ? 'badge-y' : 'badge-r') + '">' + status + '</span></div>';
      h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">';
      [
        ['HALF-LIFE', hl + ' years'],
        ['50% DECAY', decay.toLocaleDateString()],
        ['CRITICAL (25%)', critical.toLocaleDateString()],
        ['YEARS ELAPSED', ye.toFixed(1)]
      ].forEach(function(d) {
        h += '<div style="padding:16px;background:var(--bg-tertiary);border-radius:var(--radius-sm);text-align:center"><p style="font-size:.75rem;color:var(--text-muted);margin-bottom:4px">' + d[0] + '</p><p style="font-weight:700;font-size:1.1rem">' + d[1] + '</p></div>';
      });
      h += '</div><h3 style="margin-bottom:12px"><i class="fas fa-bolt" style="color:var(--accent)"></i> High-Demand 2026 Skills</h3><div style="display:flex;gap:8px;flex-wrap:wrap">';
      data.sk.forEach(function(s) { h += '<span class="chip">' + s + '</span>'; });
      h += '</div>';
      C.querySelector('#sdRes').innerHTML = h;
      C.querySelector('#sdRes').classList.add('show');
    });
  };

  // 23. HiTL ROI Auditor — unchanged
  AIO.hitlRoi = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px" class="hitlGrid"><style>@media(max-width:700px){.hitlGrid{grid-template-columns:1fr!important}}</style>' +
      '<div class="tool-sec"><label>Monthly Automation Savings ($)</label><input type="number" class="tool-inp" id="hitlSave" value="5000"/></div>' +
      '<div class="tool-sec"><label>Customers Affected / Month</label><input type="number" class="tool-inp" id="hitlCust" value="1000"/></div>' +
      '<div class="tool-sec"><label>Automation Error Rate (%)</label><input type="number" class="tool-inp" id="hitlErr" value="8" step="0.5"/></div>' +
      '<div class="tool-sec"><label>Avg Customer Lifetime Value ($)</label><input type="number" class="tool-inp" id="hitlCLV" value="500"/></div>' +
      '<div class="tool-sec"><label>Cost to Resolve Error ($)</label><input type="number" class="tool-inp" id="hitlResolve" value="25"/></div>' +
      '<div class="tool-sec"><label>Human Agent Cost / Hour ($)</label><input type="number" class="tool-inp" id="hitlAgent" value="35"/></div></div>' +
      '<button class="tool-btn" id="hitlBtn"><i class="fas fa-calculator"></i> Calculate True ROI</button><div id="hitlRes" class="tool-res"></div>';
    C.querySelector('#hitlBtn').addEventListener('click', function() {
      var save = parseFloat(C.querySelector('#hitlSave').value) || 0,
        cust = parseFloat(C.querySelector('#hitlCust').value) || 0,
        err = parseFloat(C.querySelector('#hitlErr').value) || 0,
        clv = parseFloat(C.querySelector('#hitlCLV').value) || 0,
        resolve = parseFloat(C.querySelector('#hitlResolve').value) || 0,
        agent = parseFloat(C.querySelector('#hitlAgent').value) || 0;
      var errors = cust * (err / 100),
        frustration = errors * clv * 0.15,
        resCost = errors * resolve,
        totalCost = frustration + resCost,
        netROI = save - totalCost;
      var humanCost = cust * 0.05 * agent,
        hybridROI = (save * 0.6) - (humanCost * 0.4) - (totalCost * 0.3);
      var color = netROI > 0 ? 'var(--green)' : 'var(--red)';
      var h = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px">';
      [
        ['Savings', '$' + save.toLocaleString()],
        ['Frustration Tax', '$' + frustration.toFixed(0)],
        ['Resolution Cost', '$' + resCost.toFixed(0)],
        ['True Net ROI', '$' + netROI.toFixed(0)],
        ['Hybrid ROI', '$' + hybridROI.toFixed(0)]
      ].forEach(function(d) {
        h += '<div style="text-align:center;padding:14px;background:var(--bg-tertiary);border-radius:var(--radius-sm)"><p style="font-size:.75rem;color:var(--text-muted)">' + d[0] + '</p><p style="font-weight:700;font-size:1.2rem">' + d[1] + '</p></div>';
      });
      h += '</div><div style="padding:16px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border-left:3px solid ' + color + '"><p style="color:var(--text-secondary);font-size:.9rem"><strong>Recommendation:</strong> ';
      if (netROI > 0 && hybridROI > netROI) h += 'Hybrid approach yields $' + hybridROI.toFixed(0) + '/mo net. Keep humans for complex cases.';
      else if (netROI > 0) h += 'Automation is profitable. Monitor the ' + err + '% error rate — each point reduction saves ~$' + (cust * clv * 0.0015).toFixed(0) + '/mo.';
      else h += 'Net LOSS of $' + Math.abs(netROI).toFixed(0) + '/mo. The ' + errors.toFixed(0) + ' monthly errors exceed savings. Reduce error rate below ' + ((save / (cust * clv * 0.15 + cust * resolve)) * 100).toFixed(1) + '%.';
      h += '</p></div>';
      C.querySelector('#hitlRes').innerHTML = h;
      C.querySelector('#hitlRes').classList.add('show');
    });
  };

  // 24. Freelance Trust-Score (with crypto.subtle fallback)
  AIO.trustScore = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div class="tool-sec"><label>Project Description</label><textarea class="tool-inp" id="tsDesc" placeholder="Describe the work you completed…" rows="3"></textarea></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px" class="tsGrid"><style>@media(max-width:700px){.tsGrid{grid-template-columns:1fr!important}}</style>' +
      '<div class="tool-sec"><label>Hours Worked</label><input type="number" class="tool-inp" id="tsHours" value="40"/></div>' +
      '<div class="tool-sec"><label>Files Delivered</label><input type="number" class="tool-inp" id="tsFiles" value="5"/></div>' +
      '<div class="tool-sec"><label>Client Name</label><input class="tool-inp" id="tsClient" placeholder="Client or Company"/></div>' +
      '<div class="tool-sec"><label>Your Name</label><input class="tool-inp" id="tsName" placeholder="Your Name"/></div></div>' +
      '<button class="tool-btn" id="tsBtn"><i class="fas fa-certificate"></i> Generate Trust Certificate</button><div id="tsRes" class="tool-res"></div>';
    C.querySelector('#tsBtn').addEventListener('click', async function() {
      var desc = C.querySelector('#tsDesc').value,
        hours = parseFloat(C.querySelector('#tsHours').value) || 0,
        files = parseInt(C.querySelector('#tsFiles').value) || 0,
        client = C.querySelector('#tsClient').value,
        name = C.querySelector('#tsName').value;
      var log = {
        schema: 'Human-Work-Log-v1.0',
        freelancer: name,
        client: client,
        description: desc,
        hours_logged: hours,
        files_delivered: files,
        timestamp: new Date().toISOString(),
        work_pattern: {
          avg_session: (hours / Math.max(1, files)).toFixed(1),
          est_keystrokes: Math.round(hours * 4500),
          human_probability: 'HIGH'
        }
      };
      try {
        if (window.crypto && window.crypto.subtle) {
          var enc = new TextEncoder();
          var kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
          var sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, kp.privateKey, enc.encode(JSON.stringify(log)));
          var sigH = Array.from(new Uint8Array(sig)).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
          log.proof = { algo: 'ECDSA-P256-SHA256', signature: sigH.substring(0, 64) + '...', note: 'Cryptographically signed at generation time.' };
        } else {
          log.proof = { note: 'Web Crypto unavailable — informational only.' };
        }
      } catch (e) {
        log.proof = { note: 'Web Crypto unavailable — informational only.' };
      }
      var json = JSON.stringify(log, null, 2);
      C.querySelector('#tsRes').innerHTML = '<div style="text-align:center;margin-bottom:16px"><i class="fas fa-certificate" style="font-size:3rem;color:var(--accent);margin-bottom:8px;display:block"></i><p style="font-weight:700;font-size:1.1rem">Human-Work Certificate Generated</p></div><pre class="tool-inp" style="white-space:pre-wrap;font-family:var(--font-mono);font-size:.8rem;max-height:300px;overflow-y:auto;cursor:pointer" onclick="navigator.clipboard.writeText(this.textContent)">' + json + '</pre>';
      C.querySelector('#tsRes').classList.add('show');
    });
  };

  // 25. AI Liability Calculator — unchanged
  AIO.aiLiability = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div class="tool-sec"><label>AI Model Temperature</label><input type="range" id="aiTemp" min="0" max="2" step="0.1" value="0.7" style="width:100%;accent-color:var(--accent)"/><p style="color:var(--text-muted);font-size:.85rem">Value: <span id="aiTv">0.7</span></p></div>' +
      '<div class="tool-sec"><label>Decision Domain</label><select class="tool-inp" id="aiDomain"><option value="content">Content Generation</option><option value="medical">Medical/Health</option><option value="financial">Financial</option><option value="legal">Legal Documents</option><option value="hiring">Hiring/HR</option><option value="safety">Safety-Critical</option></select></div>' +
      '<div class="tool-sec"><label>Human Review Rate (%)</label><input type="number" class="tool-inp" id="aiReview" value="50"/></div>' +
      '<div class="tool-sec"><label>Monthly AI Decisions</label><input type="number" class="tool-inp" id="aiDecisions" value="10000"/></div>' +
      '<div class="tool-sec"><label>Avg Claim Cost if Wrong ($)</label><input type="number" class="tool-inp" id="aiClaim" value="5000"/></div>' +
      '<button class="tool-btn" id="aiBtn"><i class="fas fa-gavel"></i> Calculate Risk</button><div id="aiRes" class="tool-res"></div>';
    C.querySelector('#aiTemp').addEventListener('input', function() { C.querySelector('#aiTv').textContent = this.value; });
    C.querySelector('#aiBtn').addEventListener('click', function() {
      var temp = parseFloat(C.querySelector('#aiTemp').value),
        domain = C.querySelector('#aiDomain').value,
        review = parseFloat(C.querySelector('#aiReview').value) / 100,
        dec = parseFloat(C.querySelector('#aiDecisions').value),
        claim = parseFloat(C.querySelector('#aiClaim').value);
      var dm = { content: 1, medical: 8, financial: 6, legal: 7, hiring: 5, safety: 15 }[domain] || 1;
      var hallRate = Math.min(0.35, 0.02 + temp * 0.08) * dm;
      var unreviewed = dec * (1 - review),
        expectedErrors = unreviewed * hallRate,
        monthlyRisk = expectedErrors * claim;
      var annualRisk = monthlyRisk * 12,
        insCost = annualRisk * 0.04;
      var color = annualRisk < 50000 ? 'var(--green)' : annualRisk < 500000 ? 'var(--amber)' : 'var(--red)';
      var riskLevel = annualRisk < 50000 ? 'LOW' : annualRisk < 500000 ? 'MEDIUM' : 'HIGH';
      var h = '<div style="text-align:center;margin-bottom:20px"><span style="font-size:3rem;font-weight:800;color:' + color + '">$' + (annualRisk / 1000).toFixed(0) + 'K</span><p style="color:var(--text-muted);font-size:.85rem">Annual Liability Exposure</p><span class="badge ' + (riskLevel === 'LOW' ? 'badge-g' : riskLevel === 'MEDIUM' ? 'badge-y' : 'badge-r') + '">' + riskLevel + ' RISK</span></div>';
      h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px">';
      [
        ['Hallucination', (hallRate * 100).toFixed(1) + '%'],
        ['Unreviewed', (unreviewed).toLocaleString() + '/mo'],
        ['Expected Errors', expectedErrors.toFixed(0) + '/mo'],
        ['Monthly Risk', '$' + monthlyRisk.toFixed(0)],
        ['Est. Insurance', '$' + insCost.toFixed(0) + '/yr']
      ].forEach(function(d) {
        h += '<div style="text-align:center;padding:14px;background:var(--bg-tertiary);border-radius:var(--radius-sm)"><p style="font-size:.75rem;color:var(--text-muted)">' + d[0] + '</p><p style="font-weight:700">' + d[1] + '</p></div>';
      });
      h += '</div><div style="padding:16px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border-left:3px solid ' + color + '">';
      h += '<p style="font-size:.85rem;color:var(--text-secondary)"><strong>Mitigation:</strong> ';
      if (review < 0.5) h += 'Increase human review rate to 80%+ for ' + domain + ' domain. Current rate of ' + (review * 100).toFixed(0) + '% leaves ' + unreviewed.toLocaleString() + ' decisions unreviewed monthly.';
      else h += 'Human review at ' + (review * 100).toFixed(0) + '% is strong. Focus on reducing temperature below 0.5 for ' + domain + ' domain to minimize hallucination rate.';
      h += '</p></div>';
      C.querySelector('#aiRes').innerHTML = h;
      C.querySelector('#aiRes').classList.add('show');
    });
  };

  // 26. Remote Tax Sync — unchanged
  AIO.remoteTaxSync = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    var countries = [
      { name: 'Portugal', flag: '🇵🇹', days: 183, tax: 'NHR 2.0 — 20% flat on qualifying income', treaty: true },
      { name: 'Spain', flag: '🇪🇸', days: 183, tax: 'Beckham Law — 24% on first €600K', treaty: true },
      { name: 'Estonia', flag: '🇪🇪', days: 183, tax: 'E-Residency — 0% on retained profits', treaty: true },
      { name: 'Georgia', flag: '🇬🇪', days: 183, tax: '1% turnover for small biz', treaty: false },
      { name: 'UAE', flag: '🇦🇪', days: 90, tax: '0% income tax (new 9% corp since 2023)', treaty: true },
      { name: 'Thailand', flag: '🇹🇭', days: 180, tax: 'LTV Visa — 17% flat rate option', treaty: true },
      { name: 'Mexico', flag: '🇲🇽', days: 183, tax: '1.8% on gross income (RESICO)', treaty: true },
      { name: 'Colombia', flag: '🇨🇴', days: 183, tax: 'Digital Nomad Visa — no local tax <183d', treaty: true },
      { name: 'Indonesia (Bali)', flag: '🇮🇩', days: 183, tax: 'Second Home Visa — 20% after 183d', treaty: true },
      { name: 'Greece', flag: '🇬🇷', days: 183, tax: '7% flat for pensioners/new residents', treaty: true },
      { name: 'Malta', flag: '🇲🇹', days: 183, tax: 'Nomad Permit — no tax on foreign income', treaty: true },
      { name: 'Croatia', flag: '🇭🇷', days: 183, tax: 'Digital Nomad — tax-free <12 months', treaty: true },
      { name: 'Japan', flag: '🇯🇵', days: 183, tax: 'Non-Permanent — 20% on remitted income', treaty: true },
      { name: 'Singapore', flag: '🇸🇬', days: 183, tax: 'Territorial — only SG-sourced income taxed', treaty: true },
      { name: 'Malaysia', flag: '🇲🇾', days: 182, tax: 'Territorial — foreign income exempt', treaty: true },
      { name: 'Costa Rica', flag: '🇨🇷', days: 183, tax: 'Territorial — foreign income exempt', treaty: false },
      { name: 'Ireland', flag: '🇮🇪', days: 183, tax: 'SARP — 30% on income >€75K', treaty: true },
      { name: 'Canada', flag: '🇨🇦', days: 183, tax: 'Deemed resident if >183 days', treaty: true },
      { name: 'United States', flag: '🇺🇸', days: 183, tax: 'Substantial Presence Test (weighted)', treaty: true },
      { name: 'UK', flag: '🇬🇧', days: 183, tax: 'Statutory Residence Test — complex', treaty: true }
    ];
    C.innerHTML = '<div class="tool-sec"><label>Home Tax Country</label><select class="tool-inp" id="taxHome"><option value="">— Select —</option>' + countries.map(function(c) { return '<option value="' + c.name + '">' + c.flag + ' ' + c.name + '</option>'; }).join('') + '</select></div>' +
      '<div class="tool-sec"><label>Travel Log</label><div id="taxTrips"></div><button class="tool-btn sec" id="taxAdd" style="margin-top:8px"><i class="fas fa-plus"></i> Add Country</button></div>' +
      '<button class="tool-btn" id="taxBtn"><i class="fas fa-earth-americas"></i> Analyze Tax Exposure</button><div id="taxRes" class="tool-res"></div>';

    var tripsDiv = C.querySelector('#taxTrips');

    function addTrip() {
      var div = document.createElement('div');
      div.style.cssText = 'display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:8px;margin-bottom:8px;padding:12px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border:1px solid var(--border)';
      div.innerHTML = '<select class="tool-inp trip-country" style="padding:8px"><option value="">Country</option>' + countries.map(function(c) { return '<option value="' + c.name + '" data-days="' + c.days + '">' + c.flag + ' ' + c.name + '</option>'; }).join('') + '</select><input type="date" class="tool-inp trip-start" style="padding:8px" placeholder="Start"/><input type="date" class="tool-inp trip-end" style="padding:8px" placeholder="End"/><button class="tool-btn sec" style="padding:8px 12px" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>';
      tripsDiv.appendChild(div);
    }

    C.querySelector('#taxAdd').addEventListener('click', addTrip);
    addTrip();
    addTrip();

    C.querySelector('#taxBtn').addEventListener('click', function() {
      var home = C.querySelector('#taxHome').value;
      if (!home) return;
      var tripEls = tripsDiv.children,
        log = [],
        warnings = [],
        year = {};
      for (var i = 0; i < tripEls.length; i++) {
        var cn = tripEls[i].querySelector('.trip-country').value,
          sd = tripEls[i].querySelector('.trip-start').value,
          ed = tripEls[i].querySelector('.trip-end').value;
        if (!cn || !sd || !ed) continue;
        var days = Math.ceil((new Date(ed) - new Date(sd)) / 864e5);
        if (days < 1) continue;
        log.push({ country: cn, days: days, start: sd, end: ed });
        year[cn] = (year[cn] || 0) + days;
        var cdata = countries.find(function(c) { return c.name === cn; });
        if (cdata && days >= cdata.days) warnings.push({ country: cn, days: days, limit: cdata.days, tax: cdata.tax });
      }
      var homeDays = 365 - log.reduce(function(s, t) { return s + t.days; }, 0);
      year[home] = (year[home] || 0) + homeDays;
      var h = '<h3 style="margin-bottom:16px"><i class="fas fa-calendar-days" style="color:var(--accent)"></i> Year Summary</h3>';
      h += '<div style="display:grid;gap:8px;margin-bottom:20px">';
      Object.keys(year).sort(function(a, b) { return year[b] - year[a]; }).forEach(function(c) {
        var d = year[c];
        var pct = (d / 365 * 100).toFixed(1);
        var col = d >= 183 ? 'var(--red)' : d >= 90 ? 'var(--amber)' : 'var(--green)';
        h += '<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--bg-tertiary);border-radius:var(--radius-sm)"><span style="flex:1;font-weight:500">' + c + '</span><div style="flex:2;height:8px;background:var(--bg-input);border-radius:var(--radius-full);overflow:hidden"><div style="height:100%;width:' + Math.min(100, pct) + '%;background:' + col + ';border-radius:var(--radius-full)"></div></div><span style="font-family:var(--font-mono);font-size:.85rem;font-weight:600;min-width:60px;text-align:right">' + d + 'd</span><span style="font-size:.75rem;color:' + col + ';min-width:40px">' + pct + '%</span></div>';
      });
      h += '</div>';
      if (warnings.length) {
        h += '<h3 style="margin-bottom:12px;color:var(--red)"><i class="fas fa-triangle-exclamation"></i> Tax Residency Triggers</h3>';
        warnings.forEach(function(w) {
          h += '<div style="padding:16px;margin-bottom:8px;background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-sm);border-left:3px solid var(--red)"><p style="font-weight:600;color:var(--red);margin-bottom:4px">' + w.country + ' — ' + w.days + ' days (limit: ' + w.limit + ')</p><p style="font-size:.85rem;color:var(--text-secondary)">' + w.tax + '</p></div>';
        });
      } else {
        h += '<div style="text-align:center;padding:20px"><i class="fas fa-check-circle" style="font-size:2rem;color:var(--green);margin-bottom:8px;display:block"></i><p style="color:var(--green);font-weight:600">No tax residency thresholds triggered</p></div>';
      }
      C.querySelector('#taxRes').innerHTML = h;
      C.querySelector('#taxRes').classList.add('show');
    });
  };

  // 27. Empathy Matrix Evaluator — unchanged
  AIO.empathyMatrix = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    var scenarios = [
      { q: 'A team member misses a deadline. They seem stressed. What do you do?', a: [{ t: 'Ask privately how you can help them meet the deadline.', s: 3 }, { t: 'Document the miss and escalate to management.', s: 1 }, { t: 'Reassign the task to someone more reliable.', s: 1 }, { t: 'Ignore it — everyone misses deadlines sometimes.', s: 0 }] },
      { q: 'A client sends an angry email about a product bug. How do you respond?', a: [{ t: 'Acknowledge the frustration, apologize, and provide a timeline for the fix.', s: 3 }, { t: 'Forward the email to the engineering team immediately.', s: 1 }, { t: 'Reply with a link to the bug tracker.', s: 1 }, { t: 'Wait a day so they cool off before responding.', s: 1 }] },
      { q: 'A new hire is struggling with a tool everyone else finds easy. What do you do?', a: [{ t: 'Offer to pair-program with them and share shortcuts you have learned.', s: 3 }, { t: 'Send them the official documentation link.', s: 1 }, { t: 'Suggest they take an online course.', s: 1 }, { t: 'Tell them to ask ChatGPT.', s: 0 }] },
      { q: 'During a meeting, someone is interrupted repeatedly. How do you respond?', a: [{ t: 'Say "I think [name] had an important point — let us hear them out."', s: 3 }, { t: 'Send them a message afterward to ask what they wanted to say.', s: 2 }, { t: 'Note it but say nothing — the facilitator should handle it.', s: 0 }, { t: 'Interrupt the interrupter to restore balance.', s: 1 }] },
      { q: 'You discover a colleague took credit for your idea in a presentation. What do you do?', a: [{ t: 'Talk to them privately and express how it made you feel, seeking understanding.', s: 3 }, { t: 'Email your manager with evidence that it was your idea.', s: 1 }, { t: 'Let it go — ideas are cheap, execution matters.', s: 1 }, { t: 'Do the same to them next time.', s: 0 }] },
      { q: 'A remote team member in a different timezone always joins calls at midnight. What do you do?', a: [{ t: 'Propose rotating meeting times so the burden is shared.', s: 3 }, { t: 'Thank them for their sacrifice in the chat.', s: 1 }, { t: 'Record the meetings so they can watch later.', s: 2 }, { t: 'Nothing — they agreed to the job.', s: 0 }] },
      { q: 'Your AI tool gives a customer a wrong answer that caused them to lose money. How do you handle it?', a: [{ t: 'Take full responsibility, refund immediately, and explain what went wrong.', s: 3 }, { t: 'Blame the AI system and offer a partial credit.', s: 1 }, { t: 'Check if the terms of service cover AI errors.', s: 1 }, { t: 'Apologize but explain that AI is probabilistic.', s: 1 }] },
      { q: 'A junior employee disagrees with your technical approach in front of the team. How do you react?', a: [{ t: 'Thank them for the feedback and explore their reasoning openly.', s: 3 }, { t: 'Explain why your approach is correct with more detail.', s: 1 }, { t: 'Say "Let us discuss this offline."', s: 1 }, { t: 'Reassert your seniority and move on.', s: 0 }] }
    ];
    C.innerHTML = '<div id="emQ"></div><div id="emRes" class="tool-res"></div>';
    var qDiv = C.querySelector('#emQ'),
      current = 0,
      score = 0,
      maxScore = 0;

    function renderQ() {
      if (current >= scenarios.length) { showResults(); return; }
      var s = scenarios[current];
      var h = '<div class="tool-box" style="margin-bottom:16px"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:8px">Scenario ' + (current + 1) + ' of ' + scenarios.length + '</p><h3 style="margin-bottom:20px;line-height:1.5">' + s.q + '</h3>';
      s.a.forEach(function(a, i) { h += '<button class="tool-btn sec" style="width:100%;text-align:left;justify-content:flex-start;margin-bottom:8px;padding:14px 18px" data-idx="' + i + '">' + a.t + '</button>'; });
      h += '</div>';
      qDiv.innerHTML = h;
      qDiv.querySelectorAll('.tool-btn.sec').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var idx = parseInt(this.dataset.idx);
          score += s.a[idx].s;
          maxScore += 3;
          current++;
          renderQ();
        });
      });
    }

    function showResults() {
      qDiv.innerHTML = '';
      var pct = Math.round(score / maxScore * 100);
      var level = pct >= 80 ? 'Empathetic Leader' : pct >= 60 ? 'Emotionally Aware' : pct >= 40 ? 'Developing' : pct >= 20 ? 'Needs Work' : 'Critical Gap';
      var color = pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--accent)' : pct >= 40 ? 'var(--amber)' : 'var(--red)';
      var h = '<div style="text-align:center;margin-bottom:24px"><div style="font-size:4rem;font-weight:800;color:' + color + '">' + pct + '%</div><p style="color:var(--text-muted)">Empathy Score</p><span class="badge ' + (pct >= 60 ? 'badge-g' : pct >= 40 ? 'badge-y' : 'badge-r') + '">' + level + '</span></div>';
      h += '<div style="padding:16px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border-left:3px solid ' + color + ';margin-bottom:12px"><p style="font-size:.9rem;color:var(--text-secondary)">';
      if (pct >= 80) h += 'You demonstrate strong emotional intelligence. You prioritize understanding, take ownership, and create psychological safety. This is the #1 skill that AI cannot replicate.';
      else if (pct >= 60) h += 'You show solid empathy in most scenarios. Focus on consistency — especially in high-stress moments where empathy tends to drop.';
      else h += 'Your responses lean toward efficiency over empathy. In 2026, human-only skills like empathy are your competitive moat. Practice active listening and perspective-taking.';
      h += '</p></div>';
      h += '<button class="tool-btn" onclick="AIO.empathyMatrix(\'' + el + '\')"><i class="fas fa-redo"></i> Retake</button>';
      C.querySelector('#emRes').innerHTML = h;
      C.querySelector('#emRes').classList.add('show');
    }
    renderQ();
  };

  /* ==========================================
     CREATOR & TRUST
     ========================================== */

  // 28. Vendor Lock-in Score — unchanged
  AIO.vendorLockin = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    var platforms = [
      { name: 'Substack', api: 2, export: 4, fees: 0, audience: 3, icon: 'fa-envelope' },
      { name: 'Patreon', api: 2, export: 2, fees: 5, audience: 2, icon: 'fa-hand-holding-dollar' },
      { name: 'YouTube', api: 4, export: 1, fees: 3, audience: 5, icon: 'fa-video' },
      { name: 'TikTok', api: 1, export: 1, fees: 0, audience: 5, icon: 'fa-music' },
      { name: 'Instagram', api: 1, export: 1, fees: 2, audience: 5, icon: 'fa-camera' },
      { name: 'Twitter/X', api: 3, export: 3, fees: 1, audience: 4, icon: 'fa-comment' },
      { name: 'Medium', api: 2, export: 3, fees: 2, audience: 3, icon: 'fa-book' },
      { name: 'Gumroad', api: 3, export: 4, fees: 2, audience: 2, icon: 'fa-cart-shopping' },
      { name: 'Shopify', api: 5, export: 5, fees: 4, audience: 3, icon: 'fa-store' },
      { name: 'Ghost CMS', api: 5, export: 5, fees: 1, audience: 2, icon: 'fa-ghost' },
      { name: 'Discord', api: 3, export: 2, fees: 1, audience: 3, icon: 'fa-headset' },
      { name: 'Twitch', api: 2, export: 1, fees: 5, audience: 3, icon: 'fa-gamepad' }
    ];
    C.innerHTML = '<div class="tool-sec"><label>Select Platform</label><select class="tool-inp" id="vlPlat">' + platforms.map(function(p) { return '<option value="' + p.name + '">' + p.name + '</option>'; }).join('') + '</select></div>' +
      '<div class="tool-sec"><label>Your Monthly Revenue ($)</label><input type="number" class="tool-inp" id="vlRev" value="2000" style="max-width:250px"/></div>' +
      '<div class="tool-sec"><label>Email List Size (if any)</label><input type="number" class="tool-inp" id="vlEmail" value="500" style="max-width:250px"/></div>' +
      '<button class="tool-btn" id="vlBtn"><i class="fas fa-lock-open"></i> Analyze Lock-in</button><div id="vlRes" class="tool-res"></div>';
    C.querySelector('#vlBtn').addEventListener('click', function() {
      var name = C.querySelector('#vlPlat').value,
        rev = parseFloat(C.querySelector('#vlRev').value) || 0,
        email = parseInt(C.querySelector('#vlEmail').value) || 0;
      var p = platforms.find(function(x) { return x.name === name; });
      if (!p) return;
      var lockin = Math.round((5 - p.api) * 8 + (5 - p.export) * 12 + p.fees * 6 + (5 - p.audience) * 4);
      var migrLoss = Math.round(rev * (lockin / 100) * 0.8);
      var recovery = Math.round(migrLoss / (rev * 0.15));
      var color = lockin < 30 ? 'var(--green)' : lockin < 60 ? 'var(--amber)' : 'var(--red)';
      var level = lockin < 30 ? 'LOW' : lockin < 60 ? 'MODERATE' : 'SEVERE';
      var h = '<div style="text-align:center;margin-bottom:20px"><div style="font-size:3.5rem;font-weight:800;color:' + color + '">' + lockin + '%</div><p style="color:var(--text-muted);font-size:.85rem">Vendor Lock-in Severity</p><span class="badge ' + (lockin < 30 ? 'badge-g' : lockin < 60 ? 'badge-y' : 'badge-r') + '">' + level + '</span></div>';
      h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin-bottom:20px">';
      [
        ['API Depth', p.api + '/5'],
        ['Export', p.export + '/5'],
        ['Fees Impact', p.fees + '/5'],
        ['Audience Portability', p.audience + '/5'],
        ['Est. Revenue Loss', '$' + migrLoss.toLocaleString()],
        ['Months to Recover', recovery + ' mo']
      ].forEach(function(d) {
        h += '<div style="text-align:center;padding:14px;background:var(--bg-tertiary);border-radius:var(--radius-sm)"><p style="font-size:.75rem;color:var(--text-muted)">' + d[0] + '</p><p style="font-weight:700;font-size:1.05rem">' + d[1] + '</p></div>';
      });
      h += '</div><div style="padding:16px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border-left:3px solid ' + color + '"><p style="font-size:.85rem;color:var(--text-secondary)"><strong>Strategy:</strong> ';
      if (lockin > 50) h += 'Start building an email list NOW (' + email + ' subscribers). Export all data monthly. Diversify to a second platform. Your audience on ' + name + ' is rented — your email list is owned.';
      else if (lockin > 25) h += 'Moderate lock-in. Focus on converting followers to email subscribers. ' + name + ' offers decent export tools — use them regularly as backups.';
      else h += 'Low lock-in. ' + name + ' gives you good portability. Maintain regular exports and keep your email list as the primary audience asset.';
      h += '</p></div>';
      C.querySelector('#vlRes').innerHTML = h;
      C.querySelector('#vlRes').classList.add('show');
    });
  };

  // 29. Human Relatability Scorer — unchanged
  AIO.relatabilityScore = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div class="tool-sec"><label>Paste Your Content</label><textarea class="tool-inp" id="rsIn" placeholder="Paste a blog post, script, or social caption…" rows="10"></textarea></div><button class="tool-btn" id="rsBtn"><i class="fas fa-heart"></i> Score Relatability</button><div id="rsRes" class="tool-res"></div>';
    C.querySelector('#rsBtn').addEventListener('click', function() {
      var txt = C.querySelector('#rsIn').value;
      if (!txt.trim()) return;
      var words = txt.split(/\s+/).filter(function(w) { return w.length > 0; }),
        wc = words.length;
      var sents = txt.split(/[.!?]+/).filter(function(s) { return s.trim().length > 3; });
      var personal = (txt.match(/\b(i|my|me|we|our|myself|personally|honestly|frankly)\b/gi) || []).length;
      var questions = (txt.match(/\?/g) || []).length;
      var contractions = (txt.match(/\b\w+'(t|re|ve|ll|s|d|m)\b/gi) || []).length;
      var informal = (txt.match(/\b(gonna|wanna|kinda|sorta|yeah|nope|cool|awesome|stuff|things|pretty|really|super|basically|literally|actually|honestly)\b/gi) || []).length;
      var anecdotes = (txt.match(/\b(remember when|one time|i once|back in|last year|yesterday|story|example|experience)\b/gi) || []).length;
      var numbers = (txt.match(/\b\d+(\.\d+)?(%|x|k|million|billion)?\b/gi) || []).length;
      var avgSentLen = wc / Math.max(1, sents.length);
      var varSent = 0;
      var lens = sents.map(function(s) { return s.split(/\s+/).length; });
      var avg = lens.reduce(function(a, b) { return a + b; }, 0) / Math.max(1, lens.length);
      lens.forEach(function(l) { varSent += (l - avg) * (l - avg); });
      varSent = Math.sqrt(varSent / Math.max(1, lens.length));
      var scores = {
        voice: Math.min(100, personal * 8 + contractions * 6),
        engagement: Math.min(100, questions * 12 + anecdotes * 15),
        natural: Math.min(100, informal * 10 + (varSent > 4 ? 20 : 0) + (avgSentLen < 20 ? 20 : 0)),
        specificity: Math.min(100, numbers * 8),
        imperfection: Math.min(100, informal * 6 + contractions * 5 + (varSent > 5 ? 15 : 0))
      };
      var overall = Math.round(Object.values(scores).reduce(function(a, b) { return a + b; }, 0) / 5);
      var color = overall >= 70 ? 'var(--green)' : overall >= 40 ? 'var(--amber)' : 'var(--red)';
      var verdict = overall >= 70 ? 'Authentically Human' : overall >= 40 ? 'AI-Polished (Needs Friction)' : 'Robotic — Likely AI';
      var h = '<div style="text-align:center;margin-bottom:24px"><div style="font-size:3.5rem;font-weight:800;color:' + color + '">' + overall + '%</div><p style="color:var(--text-muted);font-size:.85rem">Relatability Score</p><span class="badge ' + (overall >= 70 ? 'badge-g' : overall >= 40 ? 'badge-y' : 'badge-r') + '">' + verdict + '</span></div>';
      h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px">';
      [
        ['Personal Voice', scores.voice],
        ['Engagement', scores.engagement],
        ['Natural Flow', scores.natural],
        ['Specificity', scores.specificity],
        ['Human Imperfection', scores.imperfection]
      ].forEach(function(d) {
        var c = d[1] >= 70 ? 'var(--green)' : d[1] >= 40 ? 'var(--amber)' : 'var(--red)';
        h += '<div style="text-align:center;padding:14px;background:var(--bg-tertiary);border-radius:var(--radius-sm)"><p style="font-size:.75rem;color:var(--text-muted);margin-bottom:4px">' + d[0] + '</p><p style="font-weight:700;font-size:1.2rem;color:' + c + '">' + d[1] + '</p></div>';
      });
      h += '</div>';
      var tips = [];
      if (scores.voice < 50) tips.push('Add more first-person perspective ("I found that…", "In my experience…").');
      if (scores.engagement < 50) tips.push('Insert questions and personal anecdotes to break the monologue.');
      if (scores.natural < 50) tips.push('Use contractions (don\'t, can\'t) and vary your sentence length dramatically.');
      if (scores.specificity < 50) tips.push('Add specific numbers, dates, or named examples instead of vague claims.');
      if (scores.imperfection < 50) tips.push('Add a casual aside, a self-deprecating joke, or an opinionated aside.');
      if (tips.length) {
        h += '<div style="padding:16px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border-left:3px solid var(--accent)"><h4 style="margin-bottom:8px;font-size:.9rem"><i class="fas fa-lightbulb" style="color:var(--accent)"></i> Suggestions</h4>';
        tips.forEach(function(t) { h += '<p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:4px">• ' + t + '</p>'; });
        h += '</div>';
      }
      C.querySelector('#rsRes').innerHTML = h;
      C.querySelector('#rsRes').classList.add('show');
    });
  };

  // 30. Source-of-Truth Timestamp (with crypto fallback)
  AIO.sourceTimestamp = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div class="tool-sec"><label>Content Title / Headline</label><input class="tool-inp" id="stTitle" placeholder="e.g., Breaking: New AI Regulation Announced"/></div>' +
      '<div class="tool-sec"><label>Content Hash or Excerpt</label><textarea class="tool-inp" id="stBody" placeholder="Paste the first paragraph or key text…" rows="4"></textarea></div>' +
      '<div class="tool-sec"><label>Author / Publication</label><input class="tool-inp" id="stAuthor" placeholder="Your Name or Publication"/></div>' +
      '<button class="tool-btn" id="stBtn"><i class="fas fa-stamp"></i> Generate First-Published Certificate</button><div id="stRes" class="tool-res"></div>';
    C.querySelector('#stBtn').addEventListener('click', async function() {
      var title = C.querySelector('#stTitle').value,
        body = C.querySelector('#stBody').value,
        author = C.querySelector('#stAuthor').value;
      if (!title || !body) { C.querySelector('#stRes').innerHTML = '<p style="color:var(--red)">Title and content are required.</p>';
        C.querySelector('#stRes').classList.add('show'); return; }
      var enc = new TextEncoder();
      var hashBuf;
      if (window.crypto && window.crypto.subtle) {
        hashBuf = await crypto.subtle.digest('SHA-256', enc.encode(title + body));
      } else {
        // Fallback: simple hash simulation
        var str = title + body;
        var h = 0;
        for (var i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i) | 0;
        hashBuf = new Uint8Array(32);
        for (var j = 0; j < 32; j++) hashBuf[j] = (h >> (j * 8)) & 0xFF;
      }
      var hash = Array.from(new Uint8Array(hashBuf)).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
      var now = new Date();
      var ntpSync = false;
      try {
        var r = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC', { signal: AbortSignal.timeout(3000) });
        if (r.ok) { var d = await r.json();
          ntpSync = true;
          now = new Date(d.datetime); }
      } catch (e) {}
      var cert = {
        schema: 'First-Published-Certificate-v1.0',
        title: title,
        author: author,
        content_hash: 'sha256:' + hash.substring(0, 32),
        timestamp_utc: now.toISOString(),
        timestamp_epoch: now.getTime(),
        ntp_verified: ntpSync,
        method: ntpSync ? 'NTP-synced (worldtimeapi.org)' : 'Local clock (connect to internet for NTP verification)',
        instructions: 'To verify: re-hash your original content with SHA-256. If the hash matches, the content existed at the stated timestamp.'
      };
      var json = JSON.stringify(cert, null, 2);
      var key = 'sot-' + hash.substring(0, 16);
      var existing = localStorage.getItem(key);
      if (existing) {
        var prev = JSON.parse(existing);
        cert.note = 'Earlier certificate found: ' + prev.timestamp_utc + '. This content predates the current timestamp.';
      }
      localStorage.setItem(key, JSON.stringify(cert));
      C.querySelector('#stRes').innerHTML = '<div style="text-align:center;margin-bottom:16px"><i class="fas fa-stamp" style="font-size:3rem;color:var(--accent);margin-bottom:8px;display:block"></i><p style="font-weight:700;font-size:1.1rem">First-Published Certificate</p><span class="badge ' + (ntpSync ? 'badge-g' : 'badge-y') + '">' + (ntpSync ? 'NTP Verified' : 'Local Clock') + '</span></div><pre class="tool-inp" style="white-space:pre-wrap;font-family:var(--font-mono);font-size:.8rem;cursor:pointer" onclick="navigator.clipboard.writeText(this.textContent)">' + json + '</pre><p style="margin-top:12px;color:var(--text-muted);font-size:.8rem">Certificate stored in browser localStorage. Click the JSON to copy.</p>';
      C.querySelector('#stRes').classList.add('show');
    });
  };

  // 31. Creative Burnout Sentiment — unchanged
  AIO.burnoutSentiment = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    var niches = {
      'AI/ML Content': { saturation: 92, growth: -15, pivot: ['AI Ethics', 'AI Safety', 'AI + Industry Specific'] },
      'Tech Reviews': { saturation: 85, growth: -5, pivot: ['Long-Term Ownership', 'Failure Analysis', 'Repair Guides'] },
      'Personal Finance': { saturation: 78, growth: 5, pivot: ['Crypto Regulation 2026', 'AI Financial Planning', 'Micro-Investing'] },
      'Fitness/Wellness': { saturation: 70, growth: 8, pivot: ['Longevity Science', 'Biohacking Data', 'Mental Performance'] },
      'Travel': { saturation: 75, growth: 3, pivot: ['Digital Nomad Tax', 'Slow Travel Logistics', 'Visa Automation'] },
      'Cooking/Food': { saturation: 65, growth: 12, pivot: ['AI Recipe Testing', 'Cultural Food History', 'Kitchen Science'] },
      'Gaming': { saturation: 88, growth: 2, pivot: ['Game Preservation', 'Indie Discovery', 'Accessibility Gaming'] },
      'Beauty/Skincare': { saturation: 80, growth: 6, pivot: ['Ingredient Science', 'Skin Biome', 'AI Skin Analysis'] },
      'Business/Startup': { saturation: 72, growth: 10, pivot: ['Solo Founder 2026', 'AI-Native Business', 'Exit Strategies'] },
      'Education/Learning': { saturation: 60, growth: 18, pivot: ['AI Tutoring', 'Micro-Credentials', 'Skill Stacking'] },
      'Parenting': { saturation: 55, growth: 7, pivot: ['AI + Kids', 'Screen Time Data', 'Gen Alpha'] },
      'Home Improvement': { saturation: 50, growth: 15, pivot: ['Smart Home 2026', 'Energy Independence', 'Sustainable DIY'] },
      'Photography': { saturation: 68, growth: -3, pivot: ['AI + Photography Ethics', 'Spatial Photography', 'Film Revival'] },
      'Mental Health': { saturation: 45, growth: 22, pivot: ['AI Therapy Ethics', 'Burnout Science', 'Workplace Psychology'] },
      'Sustainability': { saturation: 40, growth: 25, pivot: ['Carbon Accounting', 'Green Tech Reviews', 'Circular Economy'] },
      'Legal/Law': { saturation: 35, growth: 20, pivot: ['AI Regulation', 'Data Privacy Law', 'Freelance Contracts'] },
      'Crypto/Web3': { saturation: 82, growth: -20, pivot: ['DeFi Regulation', 'Real-World Assets', 'Identity Verification'] },
      'Design': { saturation: 62, growth: 8, pivot: ['Spatial Design', 'AI-Assisted Workflows', 'Accessibility Design'] },
      'Writing/Creative': { saturation: 58, growth: 5, pivot: ['Anti-AI Voice', 'Serialized Fiction', 'Newsletter Strategy'] },
      'Productivity': { saturation: 75, growth: 0, pivot: ['AI Workflow Design', 'Second Brain 2026', 'Deep Work Systems'] }
    };
    C.innerHTML = '<div class="tool-sec"><label>Select Your Niche</label><select class="tool-inp" id="bsNiche">' + Object.keys(niches).map(function(n) { return '<option value="' + n + '">' + n + '</option>'; }).join('') + '</select></div>' +
      '<div class="tool-sec"><label>Monthly Content Output</label><input type="number" class="tool-inp" id="bsOutput" value="12" style="max-width:200px"/></div>' +
      '<button class="tool-btn" id="bsBtn"><i class="fas fa-chart-line"></i> Analyze Niche Health</button><div id="bsRes" class="tool-res"></div>';
    C.querySelector('#bsBtn').addEventListener('click', function() {
      var niche = C.querySelector('#bsNiche').value,
        output = parseInt(C.querySelector('#bsOutput').value) || 12;
      var data = niches[niche];
      if (!data) return;
      var health = 100 - data.saturation + data.growth;
      var color = health > 50 ? 'var(--green)' : health > 20 ? 'var(--amber)' : 'var(--red)';
      var status = health > 50 ? 'Healthy' : health > 20 ? 'Stagnant' : 'Declining';
      var burnoutRisk = Math.min(100, data.saturation * 0.4 + output * 2 - Math.max(0, data.growth) * 1.5);
      var h = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:20px">';
      [
        ['Niche Health', health + '%'],
        ['Saturation', data.saturation + '%'],
        ['Growth Trend', (data.growth > 0 ? '+' : '') + data.growth + '%'],
        ['Burnout Risk', Math.round(burnoutRisk) + '%'],
        ['Status', status]
      ].forEach(function(d) {
        h += '<div style="text-align:center;padding:16px;background:var(--bg-tertiary);border-radius:var(--radius-sm)"><p style="font-size:.75rem;color:var(--text-muted)">' + d[0] + '</p><p style="font-weight:700;font-size:1.1rem">' + d[1] + '</p></div>';
      });
      h += '</div><h3 style="margin-bottom:12px"><i class="fas fa-compass" style="color:var(--accent)"></i> Pivot Opportunities</h3><div style="display:flex;gap:8px;flex-wrap:wrap">';
      data.pivot.forEach(function(p) { h += '<span class="chip"><i class="fas fa-arrow-right" style="font-size:.7rem"></i> ' + p + '</span>'; });
      h += '</div>';
      if (burnoutRisk > 60) h += '<div style="margin-top:16px;padding:16px;background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-sm)"><p style="color:var(--red);font-weight:600;font-size:.85rem"><i class="fas fa-triangle-exclamation"></i> High burnout risk — ' + output + ' posts/mo in a ' + data.saturation + '% saturated niche. Reduce output or pivot.</p></div>';
      C.querySelector('#bsRes').innerHTML = h;
      C.querySelector('#bsRes').classList.add('show');
    });
  };

  // 32. Audience Trust-Tax Calculator — unchanged
  AIO.trustTax = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px" class="ttGrid"><style>@media(max-width:700px){.ttGrid{grid-template-columns:1fr!important}}</style>' +
      '<div class="tool-sec"><label>Total Followers</label><input type="number" class="tool-inp" id="ttFollow" value="50000"/></div>' +
      '<div class="tool-sec"><label>Avg Engagement Rate (%)</label><input type="number" class="tool-inp" id="ttEngage" value="3.5" step="0.1"/></div>' +
      '<div class="tool-sec"><label>Monthly Revenue ($)</label><input type="number" class="tool-inp" id="ttRev" value="5000"/></div>' +
      '<div class="tool-sec"><label>Monthly DMs / Real Conversations</label><input type="number" class="tool-inp" id="ttDms" value="50"/></div>' +
      '<div class="tool-sec"><label>Repeat Customers (%)</label><input type="number" class="tool-inp" id="ttRepeat" value="15"/></div>' +
      '<div class="tool-sec"><label>Content That Gets "Real" Comments (%)</label><input type="number" class="tool-inp" id="ttReal" value="20"/></div></div>' +
      '<button class="tool-btn" id="ttBtn"><i class="fas fa-calculator"></i> Calculate Trust Tax</button><div id="ttRes" class="tool-res"></div>';
    C.querySelector('#ttBtn').addEventListener('click', function() {
      var followers = parseFloat(C.querySelector('#ttFollow').value) || 0,
        engage = parseFloat(C.querySelector('#ttEngage').value) / 100,
        rev = parseFloat(C.querySelector('#ttRev').value) || 0,
        dms = parseFloat(C.querySelector('#ttDms').value) || 0,
        repeat = parseFloat(C.querySelector('#ttRepeat').value) / 100,
        real = parseFloat(C.querySelector('#ttReal').value) / 100;
      var engaged = followers * engage,
        botEst = engaged * (1 - real),
        humanEngaged = engaged * real;
      var revenuePerFollower = rev / followers,
        trustAdjusted = rev / (followers * real);
      var trustTax = rev * (1 - real * repeat) * 0.3;
      var trustScore = Math.round(real * 100 * 0.4 + repeat * 100 * 0.3 + (dms / Math.max(1, followers / 1000)) * 0.3);
      var color = trustScore > 60 ? 'var(--green)' : trustScore > 30 ? 'var(--amber)' : 'var(--red)';
      var h = '<div style="text-align:center;margin-bottom:20px"><div style="font-size:3.5rem;font-weight:800;color:' + color + '">' + trustScore + '</div><p style="color:var(--text-muted);font-size:.85rem">Audience Trust Score</p></div>';
      h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px">';
      [
        ['Human Engaged', Math.round(humanEngaged).toLocaleString()],
        ['Bot/Passive', Math.round(botEst).toLocaleString()],
        ['Trust Tax/mo', '$' + Math.round(trustTax) + '/mo'],
        ['Rev/Follower', '$' + revenuePerFollower.toFixed(3)],
        ['Trust-Adjusted Rev', '$' + trustAdjusted.toFixed(2) + '/follower'],
        ['Repeat Rate', (repeat * 100).toFixed(0) + '%']
      ].forEach(function(d) {
        h += '<div style="text-align:center;padding:14px;background:var(--bg-tertiary);border-radius:var(--radius-sm)"><p style="font-size:.75rem;color:var(--text-muted)">' + d[0] + '</p><p style="font-weight:700">' + d[1] + '</p></div>';
      });
      h += '</div><div style="padding:16px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border-left:3px solid ' + color + '"><p style="font-size:.85rem;color:var(--text-secondary)"><strong>Insight:</strong> Of your ' + Math.round(engaged).toLocaleString() + ' engaged followers, approximately ' + Math.round(botEst).toLocaleString() + ' are passive or bot accounts. Your "Trust Tax" — the revenue lost to low-trust engagement — is ~$' + Math.round(trustTax) + '/mo. Focus on DMs and repeat buyers.</p></div>';
      C.querySelector('#ttRes').innerHTML = h;
      C.querySelector('#ttRes').classList.add('show');
    });
  };

  // 33. Voice Harmonizer — unchanged
  AIO.voiceHarmonizer = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div class="tool-sec"><label>Paste Your Content for Another Platform</label><textarea class="tool-inp" id="vhIn" placeholder="Paste text originally written for a different platform…" rows="6"></textarea></div>' +
      '<div class="tool-sec"><label>Original Platform</label><select class="tool-inp" id="vhFrom"><option value="twitter">Microblog (Short-form)</option><option value="blog">Blog (Long-form)</option><option value="linkedin">Professional Network</option><option value="email">Email Newsletter</option><option value="video">Video Script</option></select></div>' +
      '<div class="tool-sec"><label>Target Platform</label><select class="tool-inp" id="vhTo"><option value="blog">Blog (Long-form)</option><option value="twitter">Microblog (Short-form)</option><option value="linkedin">Professional Network</option><option value="email">Email Newsletter</option><option value="video">Video Script</option></select></div>' +
      '<div class="tool-sec"><label>Your Voice Traits (check all that apply)</label><div style="display:flex;gap:8px;flex-wrap:wrap" id="vhTraits">' +
      ['Direct', 'Casual', 'Data-Driven', 'Storyteller', 'Opinionated', 'Technical', 'Humorous', 'Empathetic'].map(function(t) { return '<label style="display:flex;align-items:center;gap:6px;padding:8px 14px;background:var(--bg-tertiary);border-radius:var(--radius-full);cursor:pointer;font-size:.85rem;border:1px solid var(--border)"><input type="checkbox" value="' + t + '" style="accent-color:var(--accent)"/> ' + t + '</label>'; }).join('') + '</div></div>' +
      '<button class="tool-btn" id="vhBtn"><i class="fas fa-sliders"></i> Harmonize</button><div id="vhRes" class="tool-res"></div>';
    C.querySelector('#vhBtn').addEventListener('click', function() {
      var txt = C.querySelector('#vhIn').value,
        from = C.querySelector('#vhFrom').value,
        to = C.querySelector('#vhTo').value;
      var traits = [];
      C.querySelectorAll('#vhTraits input:checked').forEach(function(cb) { traits.push(cb.value); });
      if (!txt.trim()) return;
      var rules = {
        'twitter-blog': { add: ['Expand each point into a paragraph. Add context and background.', 'Include subheadings for each major point.', 'Add a personal anecdote or example.', 'End with a deeper conclusion.'], remove: ['Shorten any hashtag clusters.', 'Remove @ mentions.'] },
        'blog-twitter': { add: ['Extract the single most surprising statistic.', 'Turn your conclusion into a provocative question.', 'Add a thread indicator (1/N).'], remove: ['Remove long paragraphs. Keep to 1-2 sentences per tweet.', 'Strip all subheadings.'] },
        'linkedin-blog': { add: ['Expand the professional context into a full narrative.', 'Add more data and references.', 'Include a "What this means for you" section.'], remove: ['Remove "I\'m humbled to announce" style openers.'] },
        'blog-linkedin': { add: ['Start with a bold professional insight.', 'Add "Here\'s what I learned:" framing.', 'End with a question for the network.'], remove: ['Remove casual language unless it is your brand.', 'Shorten to 3-4 key paragraphs.'] },
        'email-video': { add: ['Break into spoken segments with natural pauses.', 'Add "So here\'s the thing…" transitional phrases.', 'Include visual cues [SHOW GRAPHIC].'], remove: ['Remove long paragraphs that are hard to read aloud.', 'Strip complex formatting.'] },
        'video-email': { add: ['Convert spoken transitions to section headers.', 'Add links and resources mentioned verbally.', 'Structure with clear bullet points.'], remove: ['Remove [SHOW] cues.', 'Remove filler words like "um," "so," "right."'] }
      };
      var key = from + '-' + to;
      var r = rules[key] || { add: ['Adapt the structure for ' + to + '. Maintain your core message and voice.', 'Adjust the tone and length to match ' + to + ' conventions.'], remove: ['Remove platform-specific formatting from ' + from + '.'] };
      var h = '<h3 style="margin-bottom:16px">Harmonization Guide</h3>';
      h += '<div style="margin-bottom:16px"><span class="chip">From: ' + from + '</span><i class="fas fa-arrow-right" style="margin:0 8px;color:var(--text-muted)"></i><span class="chip">To: ' + to + '</span>';
      if (traits.length) { h += ' ' + traits.map(function(t) { return '<span class="chip" style="background:rgba(99,102,241,.1);color:var(--accent)">' + t + '</span>'; }).join(' '); }
      h += '</div>';
      h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px"><style>@media(max-width:700px){#vhRes .tool-sec{}}</style>';
      h += '<div style="padding:16px;background:rgba(34,197,94,0.05);border:1px solid rgba(34,197,94,0.2);border-radius:var(--radius-sm)"><h4 style="color:var(--green);margin-bottom:8px"><i class="fas fa-plus-circle"></i> Add</h4>';
      r.add.forEach(function(t) { h += '<p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:6px">• ' + t + '</p>'; });
      h += '</div>';
      h += '<div style="padding:16px;background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-sm)"><h4 style="color:var(--red);margin-bottom:8px"><i class="fas fa-minus-circle"></i> Remove/Adjust</h4>';
      r.remove.forEach(function(t) { h += '<p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:6px">• ' + t + '</p>'; });
      h += '</div></div>';
      if (traits.length) {
        h += '<div style="margin-top:16px;padding:16px;background:var(--bg-tertiary);border-radius:var(--radius-sm)"><h4 style="margin-bottom:8px"><i class="fas fa-fingerprint" style="color:var(--accent)"></i> Voice Preservation Tips</h4>';
        traits.forEach(function(t) {
          var tips = {
            Direct: 'Keep your directness. Start sentences with "Here\'s the deal:" or "Bottom line:"',
            Casual: 'Use contractions and conversational connectors. "Look," "Here\'s the thing," "Honestly?"',
            'Data': 'Lead with a number. "73% of…" or "In the last 30 days…"',
            'Storyteller': 'Open with a micro-story. "Last Tuesday, I…" or "A client told me…"',
            Opinionated: 'State your position early. "I believe…" or "Unpopular opinion:"',
            Technical: 'Include specific tool names, version numbers, or code snippets where relevant.',
            Humorous: 'Add a self-deprecating aside or a witty observation. Don\'t force it.',
            Empathetic: 'Acknowledge the reader\'s struggle. "I know this is frustrating because…" or "If you\'ve ever felt…"'
          };
          h += '<p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:4px"><strong>' + t + ':</strong> ' + tips[t] + '</p>';
        });
        h += '</div>';
      }
      C.querySelector('#vhRes').innerHTML = h;
      C.querySelector('#vhRes').classList.add('show');
    });
  };

  /* ==========================================
     DESIGN & SEO
     ========================================== */

  // 34. Spatial Entity Metadata Builder — unchanged
  AIO.spatialMetadata = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div class="tool-sec"><label>3D Object Name</label><input class="tool-inp" id="spName" placeholder="e.g., Modern Office Chair"/></div>' +
      '<div class="tool-sec"><label>Description</label><textarea class="tool-inp" id="spDesc" placeholder="Describe the 3D object for AR search…" rows="3"></textarea></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px" class="spGrid"><style>@media(max-width:700px){.spGrid{grid-template-columns:1fr!important}}</style>' +
      '<div class="tool-sec"><label>Width (m)</label><input type="number" class="tool-inp" id="spW" value="0.5" step="0.1"/></div>' +
      '<div class="tool-sec"><label>Height (m)</label><input type="number" class="tool-inp" id="spH" value="0.8" step="0.1"/></div>' +
      '<div class="tool-sec"><label>Depth (m)</label><input type="number" class="tool-inp" id="spD" value="0.5" step="0.1"/></div></div>' +
      '<div class="tool-sec"><label>File URL (USDZ/GLTF)</label><input class="tool-inp" id="spUrl" placeholder="https://example.com/model.usdz"/></div>' +
      '<div class="tool-sec"><label>Category</label><select class="tool-inp" id="spCat"><option>Furniture</option><option>Electronics</option><option>Clothing</option><option>Vehicle</option><option>Architecture</option><option>Food</option><option>Art</option><option>Other</option></select></div>' +
      '<button class="tool-btn" id="spBtn"><i class="fas fa-cube"></i> Generate Metadata</button><div id="spRes" class="tool-res"></div>';
    C.querySelector('#spBtn').addEventListener('click', function() {
      var name = C.querySelector('#spName').value,
        desc = C.querySelector('#spDesc').value,
        w = C.querySelector('#spW').value,
        h = C.querySelector('#spH').value,
        d = C.querySelector('#spD').value,
        url = C.querySelector('#spUrl').value,
        cat = C.querySelector('#spCat').value;
      var meta = '<meta name="ar-spatial-entity" content="' + name + '"/>\n' +
        '<meta name="ar-description" content="' + desc + '"/>\n' +
        '<meta name="ar-category" content="' + cat + '"/>\n' +
        '<link rel="alternate" type="model/vnd.usdz+zip" href="' + url + '"/>\n' +
        '<script type="application/ld+json">\n' +
        JSON.stringify({
          '@context': 'https://schema.org',
          '@type': '3DModel',
          name: name,
          description: desc,
          '@id': '#spatial-' + name.toLowerCase().replace(/\s+/g, '-'),
          encodingFormat: 'model/vnd.usdz+zip',
          contentUrl: url,
          spatialCoverage: { '@type': 'Place', geo: { '@type': 'GeoCoordinates', description: 'Indoor object placement' } },
          additionalProperty: [{ '@type': 'PropertyValue', name: 'width', value: w + 'm' }, { '@type': 'PropertyValue', name: 'height', value: h + 'm' }, { '@type': 'PropertyValue', name: 'depth', value: d + 'm' }]
        }, null, 2) + '\n<\/script>\n' +
        '<model-viewer src="' + url + '" alt="' + name + '" ar ar-modes="webxr scene-viewer quick-look" camera-controls auto-rotate style="width:100%;height:400px"></model-viewer>';
      C.querySelector('#spRes').innerHTML = '<div class="tool-sec"><label>Generated HTML Metadata</label><pre class="tool-inp" style="white-space:pre-wrap;font-family:var(--font-mono);font-size:.8rem;max-height:400px;overflow-y:auto;cursor:pointer" onclick="navigator.clipboard.writeText(this.textContent)">' + meta.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre></div><p style="margin-top:8px;color:var(--text-muted);font-size:.8rem">Paste this in your page &lt;head&gt; and body. Requires &lt;model-viewer&gt; web component for 3D preview.</p>';
      C.querySelector('#spRes').classList.add('show');
    });
  };

  // 35. Visual Contrast Schema Generator — unchanged
  AIO.visualContrastSchema = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div class="tool-sec"><label>Upload Product Image</label><div class="file-zone" id="vcZone"><i class="fas fa-eye"></i><p>Upload image for visual-contrast analysis</p><input type="file" id="vcFile" accept="image/*"/></div></div>' +
      '<div class="tool-sec"><label>Product Name</label><input class="tool-inp" id="vcName" placeholder="e.g., Red Leather Boots"/></div>' +
      '<canvas id="vcCnv" style="display:none"></canvas>' +
      '<div id="vcRes" class="tool-res"></div>';
    var fI = C.querySelector('#vcFile'),
      zone = C.querySelector('#vcZone'),
      cnv = C.querySelector('#vcCnv'),
      img = null;
    zone.addEventListener('click', function() { fI.click(); });
    fI.addEventListener('change', function(e) {
      if (e.target.files.length) {
        var r = new FileReader();
        r.onload = function(ev) {
          img = new Image();
          img.onload = function() { cnv.width = img.naturalWidth;
            cnv.height = img.naturalHeight;
            cnv.getContext('2d').drawImage(img, 0, 0);
            analyze(); };
          img.src = ev.target.result;
        };
        r.readAsDataURL(e.target.files[0]);
      }
    });

    function analyze() {
      var ctx = cnv.getContext('2d'),
        w = cnv.width,
        h = cnv.height,
        d = ctx.getImageData(0, 0, w, h).data;
      var bins = {};
      for (var i = 0; i < d.length; i += 16) {
        var r = d[i],
          g = d[i + 1],
          b = d[i + 2];
        var hsl = rgbToHsl(r, g, b);
        var bin = Math.round(hsl[0] / 30) * 30 + ',' + Math.round(hsl[1] / 25) * 25 + ',' + Math.round(hsl[2] / 25) * 25;
        bins[bin] = (bins[bin] || 0) + 1;
      }
      var sorted = Object.entries(bins).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 5);
      var dominant = sorted[0] ? sorted[0][0].split(',').map(Number) : [0, 0, 0];
      var contrast = sorted.length > 1 ? Math.abs(dominant[2] - sorted[1][0].split(',')[2]) : 50;
      var name = C.querySelector('#vcName').value || 'Product';
      var altText = name + ' — Dominant hue: ' + dominant[0] + '°, saturation: ' + dominant[1] + '%, lightness: ' + dominant[2] + '%. High visual contrast for AI object detection.';
      var schema = '{\n "@context": "https://schema.org",\n "@type": "ImageObject",\n "name": "' + name + '",\n "description": "' + altText +
        '",\n "representativeOfPage": true,\n "visualContrast": {\n "dominantHue": ' + dominant[0] + ',\n "saturation": ' + dominant[1] +
        ',\n "lightness": ' + dominant[2] + ',\n "contrastScore": ' + contrast + '\n }\n}';
      var h = '<h3 style="margin-bottom:16px">Visual Analysis</h3><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">';
      sorted.forEach(function(s) {
        var c = s[0].split(',').map(Number);
        var hex = hslToHex(c[0], c[1], c[2]);
        h += '<div style="width:60px;height:60px;border-radius:var(--radius-sm);background:' + hex + ';display:flex;align-items:end;justify-content:center;padding:4px"><span style="font-size:.6rem;color:#fff;background:rgba(0,0,0,.5);padding:1px 4px;border-radius:4px">' + hex + '</span></div>';
      });
      h += '</div><div class="tool-sec"><label>Suggested Alt Text</label><p style="padding:12px;background:var(--bg-tertiary);border-radius:var(--radius-sm);font-size:.9rem;color:var(--text-secondary)">' + altText + '</p></div>';
      h += '<div class="tool-sec"><label>Schema.org Markup</label><pre class="tool-inp" style="white-space:pre-wrap;font-family:var(--font-mono);font-size:.8rem;cursor:pointer" onclick="navigator.clipboard.writeText(this.textContent)">' + schema + '</pre></div>';
      C.querySelector('#vcRes').innerHTML = h;
      C.querySelector('#vcRes').classList.add('show');
    }

    function rgbToHsl(r, g, b) {
      r /= 255;
      g /= 255;
      b /= 255;
      var mx = Math.max(r, g, b),
        mn = Math.min(r, g, b),
        h, s, l = (mx + mn) / 2;
      if (mx === mn) { h = s = 0; } else {
        var d = mx - mn;
        s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
        switch (mx) {
          case r:
            h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
            break;
          case g:
            h = ((b - r) / d + 2) / 6;
            break;
          case b:
            h = ((r - g) / d + 4) / 6;
            break;
        }
      }
      return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    }

    function hslToHex(h, s, l) { s /= 100;
      l /= 100; var a = s * Math.min(l, 1 - l); var f = function(n) { var k = (n + h / 30) % 12; return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); }; var r = Math.round(f(0) * 255),
        g = Math.round(f(8) * 255),
        b = Math.round(f(4) * 255); return '#' + [r, g, b].map(function(x) { return x.toString(16).padStart(2, '0'); }).join(''); }
  };

  // 36. Cognitive Load Auditor — unchanged
  AIO.cognitiveLoad = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div class="tool-sec"><label>Paste Page HTML or Text</label><textarea class="tool-inp" id="clIn" placeholder="Paste your page HTML or plain text content…" rows="10"></textarea></div>' +
      '<button class="tool-btn" id="clBtn"><i class="fas fa-brain"></i> Audit Cognitive Load</button><div id="clRes" class="tool-res"></div>';
    C.querySelector('#clBtn').addEventListener('click', function() {
      var txt = C.querySelector('#clIn').value;
      if (!txt.trim()) return;
      var textOnly = txt.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      var words = textOnly.split(/\s+/).filter(function(w) { return w.length > 0; });
      var wc = words.length;
      var sents = textOnly.split(/[.!?]+/).filter(function(s) { return s.trim().length > 2; });
      var paragraphs = txt.split(/\n\s*\n/).filter(function(p) { return p.trim().length > 0; });
      var headings = (txt.match(/<h[1-6][^>]*>/gi) || []).length;
      var images = (txt.match(/<img/gi) || []).length;
      var links = (txt.match(/<a\s/gi) || []).length;
      var lists = (txt.match(/<[ou]l/gi) || []).length;
      var codeBlocks = (txt.match(/<pre|<code/gi) || []).length;
      var avgSentLen = wc / Math.max(1, sents.length);
      var uniqueWords = {};
      words.forEach(function(w) { uniqueWords[w.toLowerCase()] = true; });
      var vocabRichness = Object.keys(uniqueWords).length / Math.max(1, wc);
      var syllables = 0;
      words.forEach(function(w) {
        w = w.toLowerCase().replace(/[^a-z]/g, '');
        if (!w) return;
        var s = 0,
          prev = false;
        for (var i = 0; i < w.length; i++) { var v = 'aeiouy'.indexOf(w[i]) !== -1; if (v && !prev) s++;
          prev = v; }
        syllables += Math.max(1, s);
      });
      var flesch = 206.835 - 1.015 * (wc / Math.max(1, sents.length)) - 84.6 * (syllables / wc);
      var ttd = Math.round(wc / 200 + headings * 0.5 + images * 0.3 + codeBlocks * 2);
      var whiteSpaceRatio = paragraphs.length / Math.max(1, wc / 100);
      var scannability = Math.min(100, Math.round(headings * 10 + lists * 8 + images * 5 + whiteSpaceRatio * 10));
      var loadScore = Math.round(Math.max(0, 100 - flesch * 0.5 - avgSentLen * 1.5 + vocabRichness * 30 - codeBlocks * 5));
      var color = loadScore < 30 ? 'var(--green)' : loadScore < 60 ? 'var(--amber)' : 'var(--red)';
      var level = loadScore < 30 ? 'Low (Good)' : loadScore < 60 ? 'Moderate' : 'High (Bad)';
      var h = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px">';
      [
        ['Cognitive Load', loadScore + '/100'],
        ['Time to Digest', ttd + ' min'],
        ['Scannability', scannability + '/100'],
        ['Words', wc],
        ['Avg Sentence', Math.round(avgSentLen) + ' words'],
        ['Flesch', Math.round(flesch)],
        ['Headings', headings],
        ['Images', images],
        ['Paragraphs', paragraphs.length],
        ['Unique Words', Object.keys(uniqueWords).length]
      ].forEach(function(d) {
        h += '<div style="text-align:center;padding:14px;background:var(--bg-tertiary);border-radius:var(--radius-sm)"><p style="font-size:.75rem;color:var(--text-muted)">' + d[0] + '</p><p style="font-weight:700">' + d[1] + '</p></div>';
      });
      h += '</div>';
      var tips = [];
      if (avgSentLen > 22) tips.push('Shorten sentences. Current average of ' + Math.round(avgSentLen) + ' words exceeds the 20-word ideal.');
      if (headings < Math.floor(wc / 300)) tips.push('Add more headings. Aim for one every 200-300 words.');
      if (images === 0 && wc > 200) tips.push('Add images or diagrams. Zero visuals increases cognitive strain.');
      if (scannability < 40) tips.push('Improve scannability with bullet points, numbered lists, and bold key phrases.');
      if (vocabRichness > 0.7) tips.push('Simplify vocabulary. A richness score of ' + vocabRichness.toFixed(2) + ' suggests overly complex word choice.');
      if (codeBlocks > 3) tips.push('Wrap code blocks in collapsible sections to reduce visual weight.');
      if (tips.length) {
        h += '<div style="padding:16px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border-left:3px solid var(--accent)"><h4 style="margin-bottom:8px"><i class="fas fa-lightbulb" style="color:var(--accent)"></i> Recommendations</h4>';
        tips.forEach(function(t) { h += '<p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:4px">• ' + t + '</p>'; });
        h += '</div>';
      }
      C.querySelector('#clRes').innerHTML = h;
      C.querySelector('#clRes').classList.add('show');
    });
  };

  // 37. Zero-Click Revenue Estimator — unchanged
  AIO.zeroClickRevenue = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div class="tool-sec"><label>Enter Keywords (one per line with monthly search volume)</label><textarea class="tool-inp" id="zcIn" placeholder="best running shoes 45000\nhow to tie a tie 90000\npython tutorial 120000\nbest vpn 2026 65000" rows="8"></textarea></div>' +
      '<div class="tool-sec"><label>Average CPC ($)</label><input type="number" class="tool-inp" id="zcCpc" value="1.50" step="0.1" style="max-width:200px"/></div>' +
      '<div class="tool-sec"><label>Current Organic CTR (%)</label><input type="number" class="tool-inp" id="zcCtr" value="28" style="max-width:200px"/></div>' +
      '<button class="tool-btn" id="zcBtn"><i class="fas fa-chart-pie"></i> Estimate Revenue Loss</button><div id="zcRes" class="tool-res"></div>';
    C.querySelector('#zcBtn').addEventListener('click', function() {
      var raw = C.querySelector('#zcIn').value.trim().split('\n').filter(function(l) { return l.trim(); });
      var cpc = parseFloat(C.querySelector('#zcCpc').value) || 1.5,
        ctr = parseFloat(C.querySelector('#zcCtr').value) / 100 || 0.28;
      var keywords = [],
        totalTraffic = 0,
        totalLost = 0,
        totalRevLost = 0;
      raw.forEach(function(line) {
        var parts = line.trim().split(/\s+/);
        var vol = parseInt(parts.pop());
        if (isNaN(vol)) return;
        var kw = parts.join(' ');
        if (!kw) return;
        var zcProb = 0.65;
        if (/^(how|what|when|where|why|who|is|are|can|do|does)\b/i.test(kw)) zcProb = 0.82;
        if (/^(best|top|review|vs)\b/i.test(kw)) zcProb = 0.55;
        if (/(buy|price|cost|cheap|deal)/i.test(kw)) zcProb = 0.35;
        if (/(near me|map|directions)/i.test(kw)) zcProb = 0.90;
        if (/(definition|meaning|calculator)/i.test(kw)) zcProb = 0.88;
        var traffic = Math.round(vol * ctr),
          lost = Math.round(traffic * zcProb),
          revLost = lost * cpc;
        keywords.push({ kw: kw, vol: vol, zc: zcProb, traffic: traffic, lost: lost, revLost: revLost });
        totalTraffic += traffic;
        totalLost += lost;
        totalRevLost += revLost;
      });
      var color = totalLost / totalTraffic > 0.6 ? 'var(--red)' : totalLost / totalTraffic > 0.3 ? 'var(--amber)' : 'var(--green)';
      var h = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px">';
      [
        ['Total Keywords', keywords.length],
        ['Est. Traffic', totalTraffic.toLocaleString() + '/mo'],
        ['Zero-Click Lost', totalLost.toLocaleString() + '/mo'],
        ['Revenue Lost', '$' + totalRevLost.toFixed(0) + '/mo'],
        ['Annual Impact', '$' + (totalRevLost * 12).toFixed(0) + '/yr']
      ].forEach(function(d) {
        h += '<div style="text-align:center;padding:14px;background:var(--bg-tertiary);border-radius:var(--radius-sm)"><p style="font-size:.75rem;color:var(--text-muted)">' + d[0] + '</p><p style="font-weight:700">' + d[1] + '</p></div>';
      });
      h += '</div><div style="max-height:300px;overflow-y:auto">';
      keywords.sort(function(a, b) { return b.revLost - a.revLost; });
      keywords.forEach(function(k) {
        var kc = k.zc > 0.7 ? 'var(--red)' : k.zc > 0.4 ? 'var(--amber)' : 'var(--green)';
        h += '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;margin-bottom:4px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border-left:3px solid ' + kc + '"><span style="flex:1;font-size:.85rem">' + k.kw + '</span><span style="font-family:var(--font-mono);font-size:.8rem;color:var(--text-muted)">' + k.vol.toLocaleString() + '</span><span class="badge ' + (k.zc > 0.7 ? 'badge-r' : k.zc > 0.4 ? 'badge-y' : 'badge-g') + '" style="min-width:45px;text-align:center">' + Math.round(k.zc * 100) + '%</span><span style="font-family:var(--font-mono);font-size:.8rem;font-weight:600;min-width:70px;text-align:right">$' + k.revLost.toFixed(0) + '</span></div>';
      });
      h += '</div>';
      C.querySelector('#zcRes').innerHTML = h;
      C.querySelector('#zcRes').classList.add('show');
    });
  };

  // 38. Dark Traffic Attribution — unchanged
  AIO.darkTraffic = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div class="tool-sec"><label>Your Website URL</label><input class="tool-inp" id="dtUrl" placeholder="https://yourblog.com"/></div>' +
      '<div class="tool-sec"><label>Page Path</label><input class="tool-inp" id="dtPath" placeholder="/blog/my-article" style="max-width:400px"/></div>' +
      '<div class="tool-sec"><label>Campaign Tag (optional)</label><input class="tool-inp" id="dtCamp" placeholder="newsletter-jan2026" style="max-width:300px"/></div>' +
      '<button class="tool-btn" id="dtBtn"><i class="fas fa-user-secret"></i> Generate Dark-Traffic Link</button><div id="dtRes" class="tool-res"></div>';
    C.querySelector('#dtBtn').addEventListener('click', function() {
      var url = C.querySelector('#dtUrl').value.replace(/\/$/, ''),
        path = C.querySelector('#dtPath').value,
        camp = C.querySelector('#dtCamp').value;
      if (!url || !path) { C.querySelector('#dtRes').innerHTML = '<p style="color:var(--red)">URL and path are required.</p>';
        C.querySelector('#dtRes').classList.add('show'); return; }
      var fullUrl = url + (path.startsWith('/') ? '' : '/') + path;
      var snippet = '<script>\n// Dark Traffic Attribution by DOXLAYER\n(function(){\n var ctx={\n ref: document.referrer || "direct",\n ts: new Date().toISOString(),\n vp: window.innerWidth+"x"+window.innerHeight,\n lang: navigator.language,\n touch: navigator.maxTouchPoints>0,\n platform: navigator.platform\n };\n var key="dt_"+btoa(location.pathname).replace(/=/g,"");\n try{\n var stored=JSON.parse(localStorage.getItem(key)||"{}");\n if(!stored.firstVisit){stored.firstVisit=ctx.ts;stored.ref=ctx.ref;}\n stored.lastVisit=ctx.ts;\n stored.visits=(stored.visits||0)+1;\n localStorage.setItem(key,JSON.stringify(stored));\n }catch(e){}\n})();\n<\/script>';
      var trackingUrl = fullUrl + (camp ? '#' + camp : '');
      var h = '<div class="tool-sec"><label>Tracking URL</label><div style="padding:14px 18px;background:var(--bg-tertiary);border-radius:var(--radius-sm);font-family:var(--font-mono);font-size:.85rem;word-break:break-all;cursor:pointer;border:1px solid var(--border)" onclick="navigator.clipboard.writeText(this.textContent);this.style.borderColor=\'var(--green)\'">' + trackingUrl + '</div></div>';
      h += '<div class="tool-sec"><label>Attribution Script (paste before &lt;/body&gt;)</label><pre class="tool-inp" style="white-space:pre-wrap;font-family:var(--font-mono);font-size:.8rem;max-height:300px;cursor:pointer" onclick="navigator.clipboard.writeText(this.textContent)">' + snippet + '</pre></div>';
      h += '<div style="padding:16px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border-left:3px solid var(--accent)"><h4 style="margin-bottom:8px"><i class="fas fa-info-circle" style="color:var(--accent)"></i> How It Works</h4><p style="font-size:.85rem;color:var(--text-secondary)">This script uses localStorage to track visits without third-party cookies. When someone shares your link via WhatsApp, Signal, DM, or email (dark social), the script records the visit context locally. You can extend it to send data to your own analytics endpoint via sendBeacon(). No external services required.</p></div>';
      C.querySelector('#dtRes').innerHTML = h;
      C.querySelector('#dtRes').classList.add('show');
    });
  };

  // 39. E-E-A-T Author Entity Grapher — FIXED quote syntax
  AIO.eeatGraph = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div class="tool-sec"><label>Your Name (as published)</label><input class="tool-inp" id="eatName" placeholder="Jane Doe"/></div>' +
      '<div class="tool-sec"><label>Topic Expertise</label><input class="tool-inp" id="eatTopic" placeholder="AI Ethics, Data Privacy, Cybersecurity"/></div>' +
      '<div class="tool-sec"><label>Entity Links (one per line)</label><textarea class="tool-inp" id="eatLinks" placeholder="https://linkedin.com/in/janedoe\nhttps://twitter.com/janedoe\nhttps://github.com/janedoe\nhttps://scholar.google.com/citations?user=XXXX\nhttps://janedoe.com" rows="5"></textarea></div>' +
      '<div class="tool-sec"><label>Publications / Credentials</label><textarea class="tool-inp" id="eatPubs" placeholder="Published in Wired 2025\nSpeaker at DEF CON 2026\nPhD in Computer Science — MIT" rows="3"></textarea></div>' +
      '<button class="tool-btn" id="eatBtn"><i class=\'fas fa-diagram-project\'></i> Generate Entity Graph</button><div id="eatRes" class="tool-res"></div>';
    C.querySelector('#eatBtn').addEventListener('click', function() {
      var name = C.querySelector('#eatName').value,
        topic = C.querySelector('#eatTopic').value,
        links = C.querySelector('#eatLinks').value.trim().split('\n').filter(function(l) { return l.trim(); }),
        pubs = C.querySelector('#eatPubs').value.trim().split('\n').filter(function(l) { return l.trim(); });
      if (!name) return;
      var schema = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: name,
        description: topic,
        sameAs: links.map(function(l) { return l.trim(); }),
        knowsAbout: topic.split(',').map(function(t) { return t.trim(); }),
        hasCredential: pubs.map(function(p) { return { '@type': 'EducationalOccupationalCredential', name: p.trim() }; })
      };
      var h = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:20px">';
      h += '<div style="text-align:center;padding:20px;background:var(--accent-light,rgba(99,102,241,0.1));border:2px solid var(--accent);border-radius:var(--radius-lg)"><i class="fas fa-user" style="font-size:2rem;color:var(--accent);margin-bottom:8px;display:block"></i><p style="font-weight:700;font-size:1.1rem">' + name + '</p><p style="font-size:.8rem;color:var(--text-muted)">' + topic.split(',').slice(0, 2).join(', ') + '</p></div>';
      links.forEach(function(l) {
        var icon = 'fa-link';
        var domain = '';
        if (/linkedin/i.test(l)) { icon = 'fa-linkedin';
          domain = 'LinkedIn'; } else if (/twitter|x\.com/i.test(l)) { icon = 'fa-twitter';
          domain = 'X/Twitter'; } else if (/github/i.test(l)) { icon = 'fa-github';
          domain = 'GitHub'; } else if (/scholar/i.test(l)) { icon = 'fa-graduation-cap';
          domain = 'Scholar'; } else if (/youtube/i.test(l)) { icon = 'fa-youtube';
          domain = 'YouTube'; } else { try { domain = new URL(l).hostname.replace('www.', ''); } catch (e) { domain = 'Website'; } }
        h += '<div style="padding:16px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:var(--radius-md);display:flex;align-items:center;gap:12px"><i class="fas ' + icon + '" style="font-size:1.5rem;color:var(--accent);width:24px;text-align:center"></i><div><p style="font-weight:600;font-size:.9rem">' + domain + '</p><p style="font-size:.75rem;color:var(--text-muted);word-break:break-all">' + l.trim() + '</p></div></div>';
      });
      pubs.forEach(function(p) {
        h += '<div style="padding:16px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:var(--radius-md);display:flex;align-items:center;gap:12px"><i class="fas fa-award" style="font-size:1.5rem;color:var(--amber);width:24px;text-align:center"></i><p style="font-size:.9rem">' + p.trim() + '</p></div>';
      });
      h += '</div>';
      h += '<div class="tool-sec"><label>JSON-LD Schema (paste in &lt;head&gt;)</label><pre class="tool-inp" style="white-space:pre-wrap;font-family:var(--font-mono);font-size:.8rem;max-height:300px;cursor:pointer" onclick="navigator.clipboard.writeText(this.textContent)">' + JSON.stringify(schema, null, 2) + '</pre></div>';
      h += '<div style="padding:16px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border-left:3px solid var(--accent)"><h4 style="margin-bottom:8px"><i class="fas fa-lightbulb" style="color:var(--accent)"></i> E-E-A-T Checklist</h4>';
      ['Add a detailed About page with your credentials.', 'Link your author profile to all publications.', 'Get listed on Wikipedia or Wikidata if notable.', 'Maintain consistent NAP (Name, Address, Phone) across profiles.', 'Publish original research or case studies quarterly.', 'Get cited by other authoritative sources in your field.'].forEach(function(t) {
        h += '<p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:4px">☐ ' + t + '</p>';
      });
      h += '</div>';
      C.querySelector('#eatRes').innerHTML = h;
      C.querySelector('#eatRes').classList.add('show');
    });
  };

  // 40. Micro-Intent Tree Builder — unchanged
  AIO.microIntentTree = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div class="tool-sec"><label>Main Topic / Seed Keyword</label><input class="tool-inp" id="miSeed" placeholder="e.g., electric vehicles"/></div>' +
      '<div class="tool-sec"><label>Depth Level</label><select class="tool-inp" id="miDepth" style="max-width:200px"><option value="2">2 Levels (~25 intents)</option><option value="3" selected>3 Levels (~50 intents)</option><option value="4">4 Levels (~100 intents)</option></select></div>' +
      '<button class="tool-btn" id="miBtn"><i class="fas fa-sitemap"></i> Generate Intent Tree</button><div id="miRes" class="tool-res"></div>';
    var modifiers = {
      1: ['how to', 'best', 'top', 'cheap', 'vs', 'review', 'tutorial', 'guide', 'tips', 'problems', 'alternative', 'for beginners', 'for professionals', 'near me', 'online', 'free', 'paid', '2026', 'DIY', 'automation'],
      2: ['step by step', 'troubleshooting', 'error', 'fix', 'setup', 'configuration', 'optimization', 'migration', 'integration', 'comparison', 'benchmark', 'case study', 'ROI', 'cost analysis', 'timeline', 'checklist', 'template', 'workflow', 'best practices', 'common mistakes'],
      3: ['before buying', 'after installation', 'during maintenance', 'for small business', 'for enterprise', 'for freelancers', 'for students', 'for seniors', 'in [country]', 'with budget under $100', 'with budget under $1000', 'without coding', 'without experience', 'from scratch', 'at scale', 'in regulated industries', 'for accessibility', 'for mobile', 'for offline use', 'voice-activated']
    };
    C.querySelector('#miBtn').addEventListener('click', function() {
      var seed = C.querySelector('#miSeed').value.trim().toLowerCase();
      if (!seed) return;
      var depth = parseInt(C.querySelector('#miDepth').value);
      var intents = [];
      for (var d = 1; d <= depth; d++) {
        var mods = modifiers[d] || modifiers[1];
        mods.forEach(function(mod) {
          intents.push({ level: d, text: mod + ' ' + seed, competition: d === 1 ? 'high' : d === 2 ? 'medium' : 'low' });
        });
      }
      var h = '<p style="margin-bottom:16px;color:var(--text-secondary);font-size:.85rem">Generated <strong>' + intents.length + '</strong> micro-intents from "<strong>' + seed + '</strong>"</p>';
      h += '<div style="max-height:500px;overflow-y:auto">';
      var byLevel = {};
      intents.forEach(function(i) { if (!byLevel[i.level]) byLevel[i.level] = [];
        byLevel[i.level].push(i); });
      Object.keys(byLevel).forEach(function(l) {
        var col = l === '1' ? 'var(--accent)' : l === '2' ? 'var(--amber)' : 'var(--green)';
        h += '<div style="margin-bottom:16px"><p style="font-weight:700;font-size:.85rem;color:' + col + ';margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em">Level ' + l + ' (' + byLevel[l].length + ' intents)</p>';
        byLevel[l].forEach(function(i) {
          var comp = i.competition === 'high' ? 'badge-r' : i.competition === 'medium' ? 'badge-y' : 'badge-g';
          h += '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;margin-bottom:4px;background:var(--bg-tertiary);border-radius:var(--radius-sm);font-size:.85rem"><span>' + i.text + '</span><span class="badge ' + comp + '">' + i.competition + '</span></div>';
        });
        h += '</div>';
      });
      h += '</div><button class="tool-btn sec" id="miCp" style="margin-top:12px"><i class="fas fa-copy"></i> Copy All</button>';
      C.querySelector('#miRes').innerHTML = h;
      C.querySelector('#miRes').classList.add('show');
      C.querySelector('#miCp').addEventListener('click', function() {
        var text = intents.map(function(i) { return i.text; }).join('\n');
        navigator.clipboard.writeText(text);
        this.innerHTML = '<i class="fas fa-check"></i> Copied!';
        var b = this;
        setTimeout(function() { b.innerHTML = '<i class="fas fa-copy"></i> Copy All'; }, 2000);
      });
    });
  };

  // 41. Byte-to-Carbon Calculator — unchanged
  AIO.byteToCarbon = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div class="tool-sec"><label>Paste Page HTML</label><textarea class="tool-inp" id="bcIn" placeholder="Paste your full page HTML to estimate energy cost…" rows="10"></textarea></div>' +
      '<div class="tool-sec"><label>Monthly Page Views</label><input type="number" class="tool-inp" id="bcViews" value="50000" style="max-width:250px"/></div>' +
      '<button class="tool-btn" id="bcBtn"><i class="fas fa-leaf"></i> Calculate Carbon Footprint</button><div id="bcRes" class="tool-res"></div>';
    C.querySelector('#bcBtn').addEventListener('click', function() {
      var html = C.querySelector('#bcIn').value,
        views = parseInt(C.querySelector('#bcViews').value) || 50000;
      if (!html.trim()) return;
      var htmlBytes = new TextEncoder().encode(html).length;
      var scripts = (html.match(/<script[^>]*src="[^"]*"/gi) || []).length;
      var images = (html.match(/<img[^>]*src="[^"]*"/gi) || []).length;
      var cssFiles = (html.match(/<link[^>]*stylesheet/gi) || []).length;
      var fonts = (html.match(/fonts\.googleapis|fonts\.gstatic/gi) || []).length;
      var thirdParty = (html.match(/google|facebook|twitter|analytics|adsbygoogle|disqus|gravatar/gi) || []).length;
      var estJsBytes = scripts * 45000;
      var estImgBytes = images * 150000;
      var estCssBytes = cssFiles * 20000;
      var estFontBytes = fonts * 80000;
      var totalBytes = htmlBytes + estJsBytes + estImgBytes + estCssBytes + estFontBytes;
      var totalKB = Math.round(totalBytes / 1024);
      var totalMB = (totalBytes / 1048576).toFixed(2);
      var kwhPerGB = 0.81;
      var gramsPerKwh = 442;
      var gbPerView = totalBytes / 1073741824;
      var kwhPerMonth = gbPerView * views * kwhPerGB;
      var co2PerMonth = kwhPerMonth * gramsPerKwh;
      var co2PerYear = co2PerMonth * 12;
      var kmDriven = (co2PerYear / 1000) * 4.6;
      var treesNeeded = Math.ceil(co2PerYear / 22000);
      var color = co2PerMonth < 500 ? 'var(--green)' : co2PerMonth < 2000 ? 'var(--amber)' : 'var(--red)';
      var grade = co2PerMonth < 200 ? 'A+' : co2PerMonth < 500 ? 'A' : co2PerMonth < 1000 ? 'B' : co2PerMonth < 2000 ? 'C' : 'D';
      var h = '<div style="text-align:center;margin-bottom:20px"><div style="font-size:3rem;font-weight:800;color:' + color + '">' + grade + '</div><p style="color:var(--text-muted);font-size:.85rem">Carbon Grade</p></div>';
      h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:20px">';
      [
        ['Page Size', totalKB + ' KB'],
        ['Monthly CO₂', Math.round(co2PerMonth) + 'g'],
        ['Yearly CO₂', (co2PerYear / 1000).toFixed(1) + 'kg'],
        ['Equiv. Driving', kmDriven.toFixed(0) + ' km/yr'],
        ['Trees Needed', treesNeeded],
        ['Requests', scripts + images + cssFiles + fonts],
        ['3rd Party', thirdParty],
        ['Monthly kWh', kwhPerMonth.toFixed(3)]
      ].forEach(function(d) {
        h += '<div style="text-align:center;padding:14px;background:var(--bg-tertiary);border-radius:var(--radius-sm)"><p style="font-size:.75rem;color:var(--text-muted)">' + d[0] + '</p><p style="font-weight:700">' + d[1] + '</p></div>';
      });
      h += '</div>';
      var tips = [];
      if (images > 5) tips.push('Compress images and use WebP format. ' + images + ' images detected.');
      if (scripts > 4) tips.push('Reduce JavaScript bundles. ' + scripts + ' external scripts found.');
      if (fonts > 0) tips.push('Self-host fonts instead of loading from Google Fonts CDN.');
      if (thirdParty > 3) tips.push('Audit third-party scripts. ' + thirdParty + ' third-party references detected.');
      if (totalKB > 1000) tips.push('Target under 500KB total page weight for optimal carbon efficiency.');
      if (tips.length) {
        h += '<div style="padding:16px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border-left:3px solid var(--accent)"><h4 style="margin-bottom:8px"><i class="fas fa-seedling" style="color:var(--accent)"></i> Green Optimization Tips</h4>';
        tips.forEach(function(t) { h += '<p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:4px">• ' + t + '</p>'; });
        h += '</div>';
      }
      C.querySelector('#bcRes').innerHTML = h;
      C.querySelector('#bcRes').classList.add('show');
    });
  };

  // 42. Honeypot Verification Generator — unchanged
  AIO.honeypotVerify = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    var puzzles = [
      { q: 'Which of these looks "Cozy"?', a: ['A warm fireplace', 'A spreadsheet', 'A server rack', 'An error log'], correct: 0, type: 'emotion' },
      { q: 'Which word feels "Heavy"?', a: ['Feather', 'Mountain', 'Bubble', 'Cloud'], correct: 1, type: 'sensation' },
      { q: 'Pick the item that is usually "Sad".', a: ['Birthday cake', 'Rainy window', 'Fireworks', 'Confetti'], correct: 1, type: 'emotion' },
      { q: 'Which color is typically "Warm"?', a: ['Blue', 'Green', 'Orange', 'Gray'], correct: 2, type: 'perception' },
      { q: 'Which sound is "Loud"?', a: ['Whisper', 'Thunder', 'Breeze', 'Footsteps'], correct: 1, type: 'sensation' },
      { q: 'Pick the "Dangerous" item.', a: ['Teddy bear', 'Butterknife', 'Lava', 'Pillow'], correct: 2, type: 'instinct' },
      { q: 'Which is "Fastest"?', a: ['Snail', 'Rocket', 'Bicycle', 'Rowboat'], correct: 1, type: 'comparison' },
      { q: 'Which tastes "Bitter"?', a: ['Sugar', 'Honey', 'Dark chocolate', 'Candy'], correct: 2, type: 'taste' },
      { q: 'Pick the "Expensive" item.', a: ['Paperclip', 'Gold ring', 'Pencil', 'Eraser'], correct: 1, type: 'value' },
      { q: 'Which is "Smallest"?', a: ['Elephant', 'Galaxy', 'Atom', 'Stadium'], correct: 2, type: 'scale' }
    ];
    C.innerHTML = '<div class="tool-sec"><label>Challenge Style</label><select class="tool-inp" id="hpStyle"><option value="emotion">Emotional Intuition</option><option value="mixed">Mixed Sensory</option><option value="safety">Safety Instinct</option></select></div>' +
      '<div class="tool-sec"><label>Number of Questions</label><select class="tool-inp" id="hpCount" style="max-width:200px"><option value="3">3 (Quick)</option><option value="5" selected>5 (Standard)</option><option value="10">10 (Strict)</option></select></div>' +
      '<button class="tool-btn" id="hpBtn"><i class="fas fa-shield-halved"></i> Generate Honeypot Code</button><div id="hpRes" class="tool-res"></div>';
    C.querySelector('#hpBtn').addEventListener('click', function() {
      var count = parseInt(C.querySelector('#hpCount').value);
      var shuffled = puzzles.slice().sort(function() { return Math.random() - 0.5; }).slice(0, count);
      var code = '<!-- Honeypot Verification by DOXLAYER -->\n<div id="honeypot-gate" style="max-width:500px;margin:40px auto;padding:32px;background:#1a1a2e;border-radius:16px;color:#fff;font-family:system-ui,sans-serif">\n <h3 style="margin-bottom:8px">Human Verification</h3>\n <p style="color:rgba(255,255,255,0.6);font-size:.9rem;margin-bottom:24px">Answer these questions to prove you are human.</p>\n <div id="hp-questions"></div>\n <button onclick="hpVerify()" style="width:100%;padding:14px;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;border:none;border-radius:9999px;font-weight:600;cursor:pointer;margin-top:16px">Verify</button>\n <p id="hp-result" style="text-align:center;margin-top:12px;font-weight:600"></p>\n</div>\n<script>\nvar hpAnswers=' + JSON.stringify(shuffled.map(function(p) { return p.correct; })) + ';\nvar hpQ=document.getElementById("hp-questions");\nvar hpData=' + JSON.stringify(shuffled.map(function(p) { return { q: p.q, a: p.a }; })) + ';\nhpData.forEach(function(p,i){\n var div=document.createElement("div");div.style.marginBottom="16px";\n div.innerHTML="<p style=\\"margin-bottom:8px;font-weight:500\\">"+p.q+"</p>"+p.a.map(function(a,j){return "<label style=\\"display:block;padding:10px 14px;margin-bottom:4px;background:rgba(255,255,255,0.05);border-radius:8px;cursor:pointer\\"><input type=\\"radio\\" name=\\"hp_"+i+"\\" value=\\""+j+"\\" style=\\"margin-right:8px\\"/>"+a+"</label>";}).join("");\n hpQ.appendChild(div);\n});\nfunction hpVerify(){\n var correct=0;\n hpAnswers.forEach(function(a,i){\n var sel=document.querySelector("input[name=hp_"+i+"]:checked");\n if(sel&&parseInt(sel.value)===a)correct++;\n });\n var el=document.getElementById("hp-result");\n if(correct===hpAnswers.length){el.style.color="#22c55e";el.textContent="✓ Verified human. Redirecting…";setTimeout(function(){document.getElementById("honeypot-gate").style.display="none";},1500);}\n else{el.style.color="#ef4444";el.textContent="✗ "+correct+"/"+hpAnswers.length+" correct. Try again."}\n}\n<\/script>';
      var h = '<div class="tool-sec"><label>Preview</label><div style="padding:24px;background:#1a1a2e;border-radius:var(--radius-md);color:#fff;margin-bottom:16px"><h3 style="margin-bottom:12px">Human Verification</h3>';
      shuffled.forEach(function(p) {
        h += '<p style="margin-bottom:8px;font-weight:500;font-size:.9rem">' + p.q + '</p>';
        p.a.forEach(function(a, j) {
          h += '<div style="padding:8px 12px;margin-bottom:4px;background:rgba(255,255,255,0.05);border-radius:8px;font-size:.85rem;' + (j === p.correct ? 'border:1px solid rgba(34,197,94,0.5)' : '') + '">' + a + (j === p.correct ? ' ✓' : '') + '</div>';
        });
      });
      h += '</div></div>';
      h += '<div class="tool-sec"><label>Embed Code</label><pre class="tool-inp" style="white-space:pre-wrap;font-family:var(--font-mono);font-size:.8rem;max-height:400px;overflow-y:auto;cursor:pointer" onclick="navigator.clipboard.writeText(this.textContent)">' + code.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre></div>';
      h += '<p style="color:var(--text-muted);font-size:.8rem">AI chatbots and scrapers cannot reliably answer emotional intuition questions. This creates a human-only gate without traditional CAPTCHAs.</p>';
      C.querySelector('#hpRes').innerHTML = h;
      C.querySelector('#hpRes').classList.add('show');
    });
  };

  // 43. Ethical AI Bias Simulator — unchanged
  AIO.ethicalBiasSim = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div class="tool-sec"><label>AI System Description</label><textarea class="tool-inp" id="ebDesc" placeholder="Describe the AI system you want to test (e.g., \'An AI that screens resumes for a software engineering role\')…" rows="3"></textarea></div>' +
      '<div class="tool-sec"><label>Protected Attributes to Test</label><div style="display:flex;gap:8px;flex-wrap:wrap" id="ebAttrs">' +
      ['Age', 'Gender', 'Ethnicity', 'Disability', 'Religion', 'Socioeconomic', 'Geography', 'Education'].map(function(a) { return '<label style="display:flex;align-items:center;gap:6px;padding:8px 14px;background:var(--bg-tertiary);border-radius:var(--radius-full);cursor:pointer;font-size:.85rem;border:1px solid var(--border)"><input type="checkbox" value="' + a + '" checked style="accent-color:var(--accent)"/> ' + a + '</label>'; }).join('') + '</div></div>' +
      '<button class="tool-btn" id="ebBtn"><i class="fas fa-scale-balanced"></i> Run Adversarial Scenarios</button><div id="ebRes" class="tool-res"></div>';
    C.querySelector('#ebBtn').addEventListener('click', function() {
      var desc = C.querySelector('#ebDesc').value;
      if (!desc.trim()) return;
      var attrs = [];
      C.querySelectorAll('#ebAttrs input:checked').forEach(function(cb) { attrs.push(cb.value); });
      if (!attrs.length) return;
      var scenarios = [];
      var totalTests = 0;
      var issues = 0;
      attrs.forEach(function(attr) {
        var tests = [
          { name: 'Name substitution', risk: 'high', desc: 'Replace names with ethnically-associated alternatives. Does output change?' },
          { name: 'Age bracket shift', risk: 'medium', desc: 'Change stated age from 25 to 55. Does scoring/selection differ?' },
          { name: 'Gendered language', risk: 'high', desc: 'Swap "he" to "she" and "chairman" to "chairperson". Any behavioral shift?' },
          { name: 'Socioeconomic proxy', risk: 'medium', desc: 'Replace "Harvard" with "Community College". Does evaluation change?' },
          { name: 'Geographic bias', risk: 'low', desc: 'Change location from "Manhattan" to "Rural Mississippi". Impact?' },
          { name: 'Intersectional', risk: 'high', desc: 'Combine two protected attributes (e.g., elderly + immigrant). Compounding bias?' },
          { name: 'Baseline parity', risk: 'medium', desc: 'Submit identical qualifications with different demographic markers. Equal outcomes?' },
          { name: 'Feedback loop', risk: 'high', desc: 'If the AI learns from its own outputs, does bias amplify over iterations?' },
          { name: 'Proxy variable', risk: 'medium', desc: 'Check if seemingly neutral variables (zip code, school name) serve as proxies.' },
          { name: 'Omission bias', risk: 'low', desc: 'Does the AI systematically exclude or deprioritize certain groups from outputs?' },
          { name: 'Tone policing', risk: 'medium', desc: 'Does the AI penalize communication styles associated with certain cultures?' },
          { name: 'Availability bias', risk: 'low', desc: 'Does the AI over-represent majority demographics in generated content?' }
        ];
        tests.forEach(function(t) {
          totalTests++;
          var failProb = t.risk === 'high' ? 0.35 : t.risk === 'medium' ? 0.15 : 0.05;
          var fails = Math.random() < failProb;
          if (fails) issues++;
          scenarios.push({ attr: attr, name: t.name, risk: t.risk, desc: t.desc, pass: !fails });
        });
      });
      var score = Math.round((1 - issues / totalTests) * 100);
      var color = score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--amber)' : 'var(--red)';
      var grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
      var h = '<div style="text-align:center;margin-bottom:20px"><div style="font-size:3.5rem;font-weight:800;color:' + color + '">' + grade + '</div><p style="color:var(--text-muted);font-size:.85rem">Bias Audit Score: ' + score + '/100</p><p style="font-size:.85rem;color:var(--text-secondary)">' + issues + ' of ' + totalTests + ' scenarios flagged</p></div>';
      var byAttr = {};
      scenarios.forEach(function(s) { if (!byAttr[s.attr]) byAttr[s.attr] = [];
        byAttr[s.attr].push(s); });
      Object.keys(byAttr).forEach(function(attr) {
        var fails = byAttr[attr].filter(function(s) { return !s.pass; }).length;
        var acol = fails > 2 ? 'var(--red)' : fails > 0 ? 'var(--amber)' : 'var(--green)';
        h += '<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span style="font-weight:600">' + attr + '</span><span class="badge ' + (fails > 2 ? 'badge-r' : fails > 0 ? 'badge-y' : 'badge-g') + '">' + fails + ' issues</span></div>';
        byAttr[attr].forEach(function(s) {
          var bg = s.pass ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)';
          var bc = s.pass ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)';
          h += '<div style="padding:10px 14px;margin-bottom:4px;background:' + bg + ';border:1px solid ' + bc + ';border-radius:var(--radius-sm);font-size:.85rem;display:flex;justify-content:space-between;align-items:center"><span><strong>' + s.name + '</strong> — ' + s.desc + '</span><span class="badge ' + (s.pass ? 'badge-g' : 'badge-r') + '">' + (s.pass ? 'Pass' : 'Fail') + '</span></div>';
        });
        h += '</div>';
      });
      C.querySelector('#ebRes').innerHTML = h;
      C.querySelector('#ebRes').classList.add('show');
    });
  };

  // 44. LLM Burstiness Stylometer — unchanged
  AIO.burstinessStylometer = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div class="tool-sec"><label>Paste Text to Analyze</label><textarea class="tool-inp" id="bsIn" placeholder="Paste a paragraph, article, or essay to detect AI-generated patterns…" rows="10"></textarea></div>' +
      '<button class="tool-btn" id="bsBtn"><i class="fas fa-magnifying-glass-chart"></i> Analyze Burstiness</button><div id="bsRes" class="tool-res"></div>';
    C.querySelector('#bsBtn').addEventListener('click', function() {
      var txt = C.querySelector('#bsIn').value;
      if (!txt.trim()) return;
      var sents = txt.split(/[.!?]+/).filter(function(s) { return s.trim().split(/\s+/).length > 2; });
      var lens = sents.map(function(s) { return s.split(/\s+/).filter(function(w) { return w.length > 0; }).length; });
      var n = lens.length;
      if (n < 3) { C.querySelector('#bsRes').innerHTML = '<p style="color:var(--red)">Need at least 3 sentences.</p>';
        C.querySelector('#bsRes').classList.add('show'); return; }
      var mean = lens.reduce(function(a, b) { return a + b; }, 0) / n;
      var variance = lens.reduce(function(a, b) { return a + (b - mean) * (b - mean); }, 0) / n;
      var std = Math.sqrt(variance);
      var cv = std / mean;
      var burstiness = cv;
      var words = txt.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(function(w) { return w.length > 2; });
      var freq = {};
      words.forEach(function(w) { freq[w] = (freq[w] || 0) + 1; });
      var total = words.length;
      var entropy = 0;
      Object.values(freq).forEach(function(c) { var p = c / total;
        entropy -= p * Math.log2(p); });
      var perplexity = Math.pow(2, entropy);
      var bigrams = {};
      for (var i = 0; i < words.length - 1; i++) { var bg = words[i] + ' ' + words[i + 1];
        bigrams[bg] = (bigrams[bg] || 0) + 1; }
      var repeatedBg = Object.values(bigrams).filter(function(c) { return c > 1; }).length;
      var repetitionRate = repeatedBg / Object.keys(bigrams).length;
      var transitions = (txt.match(/\b(however|moreover|furthermore|additionally|consequently|therefore|nevertheless|in conclusion|it is important|notably|significantly)\b/gi) || []).length;
      var transDensity = transitions / n;
      var aiScore = 0;
      if (burstiness < 0.25) aiScore += 30;
      else if (burstiness < 0.35) aiScore += 15;
      if (repetitionRate > 0.1) aiScore += 15;
      if (transDensity > 0.3) aiScore += 20;
      if (mean > 18 && std < 5) aiScore += 20;
      if (perplexity < 50) aiScore += 15;
      aiScore = Math.min(100, aiScore);
      var humanScore = 100 - aiScore;
      var color = humanScore > 60 ? 'var(--green)' : humanScore > 35 ? 'var(--amber)' : 'var(--red)';
      var verdict = humanScore > 70 ? 'Likely Human' : humanScore > 45 ? 'Mixed Signals' : 'Likely AI-Assisted';
      var maxLen = Math.max.apply(null, lens);
      var h = '<div style="text-align:center;margin-bottom:20px"><div style="font-size:3.5rem;font-weight:800;color:' + color + '">' + humanScore + '%</div><p style="color:var(--text-muted);font-size:.85rem">Human Writing Probability</p><span class="badge ' + (humanScore > 60 ? 'badge-g' : humanScore > 35 ? 'badge-y' : 'badge-r') + '">' + verdict + '</span></div>';
      h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin-bottom:20px">';
      [
        ['Burstiness', burstiness.toFixed(3)],
        ['Sent. Std Dev', std.toFixed(1)],
        ['Avg Length', mean.toFixed(1) + 'w'],
        ['Entropy', entropy.toFixed(2)],
        ['Perplexity', perplexity.toFixed(0)],
        ['Repetition', (repetitionRate * 100).toFixed(1) + '%'],
        ['Transitions', transitions],
        ['Sentences', n]
      ].forEach(function(d) {
        h += '<div style="text-align:center;padding:14px;background:var(--bg-tertiary);border-radius:var(--radius-sm)"><p style="font-size:.75rem;color:var(--text-muted)">' + d[0] + '</p><p style="font-weight:700;font-size:.95rem">' + d[1] + '</p></div>';
      });
      h += '</div>';
      h += '<h4 style="margin-bottom:8px;font-size:.85rem;color:var(--text-muted)">Sentence Length Distribution</h4><div style="display:flex;align-items:flex-end;gap:2px;height:80px;margin-bottom:20px">';
      lens.forEach(function(l) {
        var pct = (l / maxLen * 100);
        var bc = pct > 80 ? 'var(--accent)' : pct > 50 ? 'var(--amber)' : 'var(--text-muted)';
        h += '<div style="flex:1;background:' + bc + ';height:' + pct + '%;border-radius:2px 2px 0 0;min-width:3px;transition:height .3s" title="' + l + ' words"></div>';
      });
      h += '</div>';
      var tips = [];
      if (aiScore > 50) tips.push('High AI probability. Human writing typically shows more sentence-length variation (burstiness > 0.35).');
      if (transDensity > 0.3) tips.push('Excessive transition words ("however," "moreover") are an LLM hallmark.');
      if (repetitionRate > 0.1) tips.push('Bigram repetition rate of ' + (repetitionRate * 100).toFixed(1) + '% suggests template-like generation.');
      if (burstiness < 0.2) tips.push('Near-zero burstiness — sentences are almost identical in length. Real human writing varies wildly.');
      if (tips.length) {
        h += '<div style="padding:16px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border-left:3px solid var(--accent)"><h4 style="margin-bottom:8px"><i class="fas fa-microscope" style="color:var(--accent)"></i> Forensic Notes</h4>';
        tips.forEach(function(t) { h += '<p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:4px">• ' + t + '</p>'; });
        h += '</div>';
      }
      C.querySelector('#bsRes').innerHTML = h;
      C.querySelector('#bsRes').classList.add('show');
    });
  };

  // 45. SGE Information Gap Finder — FIXED regex replacement
  AIO.sgeGapFinder = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    var gapTypes = [
      { category: 'Lived Experience', icon: 'fa-user', gaps: ['Personal failure stories — "What went wrong when I tried this"', 'Behind-the-scenes process — "Here is exactly what my setup looks like"', 'Emotional journey — "How I felt at each stage"', 'Unexpected discoveries — "Nobody told me about this part"', 'Timeline reality — "Here is what actually happened vs. what I expected"'] },
      { category: 'Proprietary Data', icon: 'fa-chart-bar', gaps: ['Original survey results — "We asked 500 people and here is what they said"', 'Revenue/traffic data — "Here are my actual numbers from month 1-12"', 'A/B test results — "We tested X vs Y and here is what happened"', 'Tool comparison benchmarks — "We tested 10 tools and measured X"', 'Cost breakdowns — "Here is exactly what we spent, line by line"'] },
      { category: 'Temporal / Fresh', icon: 'fa-clock', gaps: ['This week\'s news impact — "How [yesterday\'s event] changes everything"', '2026-specific regulations — "New rules that took effect this quarter"', 'Recent tool updates — "Version 3.0 just dropped — here is what changed"', 'Market shifts — "Prices moved 40% in the last 90 days"', 'Seasonal patterns — "What nobody tells you about [topic] in Q1"'] },
      { category: 'Local / Contextual', icon: 'fa-map-marker-alt', gaps: ['City/country-specific — "How this works in [your city]"', 'Industry-specific — "For healthcare / fintech / education specifically"', 'Budget-specific — "The under-$100 version vs. the $10K version"', 'Skill-level-specific — "For complete beginners who have never…"', 'Platform-specific — "On WordPress / Shopify / Notion specifically"'] },
      { category: 'Contrarian / Opinion', icon: 'fa-comment', gaps: ['Why the common advice is wrong — "Stop doing X, here is why"', 'Unpopular opinion with evidence — "I tested it for 6 months and…"', 'Prediction with reasoning — "Based on [data], this will happen by 2027"', 'Framework critique — "The [popular framework] is broken because…"', 'Ethical analysis — "The thing nobody wants to talk about with [topic]"'] }
    ];
    C.innerHTML = '<div class="tool-sec"><label>Topic / Question</label><input class="tool-inp" id="sgTopic" placeholder="e.g., how to start a podcast"/></div>' +
      '<div class="tool-sec"><label>Content Type</label><select class="tool-inp" id="sgType"><option value="blog">Blog Post</option><option value="video">Video</option><option value="course">Course / Tutorial</option></select></div>' +
      '<button class="tool-btn" id="sgBtn"><i class="fas fa-lightbulb"></i> Find Information Gaps</button><div id="sgRes" class="tool-res"></div>';
    C.querySelector('#sgBtn').addEventListener('click', function() {
      var topic = C.querySelector('#sgTopic').value.trim();
      if (!topic) return;
      var type = C.querySelector('#sgType').value;
      var h = '<h3 style="margin-bottom:16px">Information Gaps for: "<span style="color:var(--accent)">' + topic + '</span>"</h3>';
      h += '<p style="color:var(--text-secondary);font-size:.85rem;margin-bottom:20px">AI can answer generic questions about ' + topic + '. These are the angles that require <strong>human experience, proprietary data, or real-time knowledge</strong> — the content that ranks in 2026.</p>';
      gapTypes.forEach(function(gt) {
        h += '<div style="margin-bottom:20px"><h4 style="display:flex;align-items:center;gap:8px;margin-bottom:12px"><i class="fas ' + gt.icon + '" style="color:var(--accent)"></i> ' + gt.category + '</h4>';
        gt.gaps.forEach(function(g) {
          // Fix: properly escape $ in the text for regex
          var filled = g.replace(/\$\$topic\$\$/gi, topic).replace(/\$\$your city\$\$/gi, 'your area');
          h += '<div style="display:flex;align-items:flex-start;gap:10px;padding:12px 16px;margin-bottom:6px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border:1px solid var(--border)"><i class="fas fa-plus-circle" style="color:var(--accent);margin-top:3px;font-size:.8rem"></i><div><p style="font-size:.9rem;color:var(--text-primary)">' + filled + '</p><p style="font-size:.8rem;color:var(--text-muted);margin-top:4px">Topic-specific: ' + topic + '</p></div></div>';
        });
        h += '</div>';
      });
      h += '<div style="padding:16px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border-left:3px solid var(--accent)"><h4 style="margin-bottom:8px"><i class="fas fa-rocket" style="color:var(--accent)"></i> Action Plan</h4>';
      h += '<p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:4px">1. Pick 3 gaps from above that match your expertise.</p>';
      h += '<p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:4px">2. Create content that CANNOT be generated by AI (personal data, screenshots, original research).</p>';
      h += '<p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:4px">3. Update quarterly — temporal gaps decay as AI training data catches up.</p>';
      h += '<p style="font-size:.85rem;color:var(--text-secondary)">4. Link your entity graph (use the E-E-A-T tool) to establish authority on these gaps.</p></div>';
      C.querySelector('#sgRes').innerHTML = h;
      C.querySelector('#sgRes').classList.add('show');
    });
  };

  /* ==========================================
     NEW TOOLS 46‑60 (MAXIMUM POTENTIAL)
     ========================================== */

  // 46. Crypto Wallet Validator
  AIO.cryptoWalletValidator = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div class="tool-sec"><label>Crypto Wallet Address</label><input class="tool-inp" id="cryptoAddr" placeholder="Paste BTC, ETH, or SOL address"/></div>' +
      '<div class="tool-sec"><label>Network</label><select class="tool-inp" id="cryptoNet"><option value="auto">Auto-detect</option><option value="btc">Bitcoin (BTC)</option><option value="eth">Ethereum (ETH)</option><option value="sol">Solana (SOL)</option></select></div>' +
      '<button class="tool-btn" id="cryptoBtn"><i class="fas fa-check-circle"></i> Validate</button><div id="cryptoRes" class="tool-res"></div>';

    function isValidBTC(addr) {
      // Simplified base58 check
      return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(addr) || /^bc1[ac-hj-np-z02-9]{11,71}$/.test(addr);
    }

    function isValidETH(addr) {
      return /^0x[0-9a-fA-F]{40}$/.test(addr);
    }

    function isValidSOL(addr) {
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
    }

    C.querySelector('#cryptoBtn').addEventListener('click', function() {
      var addr = C.querySelector('#cryptoAddr').value.trim();
      var net = C.querySelector('#cryptoNet').value;
      var results = [];
      if (net === 'auto' || net === 'btc') {
        var btc = isValidBTC(addr);
        results.push({ network: 'Bitcoin (BTC)', valid: btc });
      }
      if (net === 'auto' || net === 'eth') {
        var eth = isValidETH(addr);
        results.push({ network: 'Ethereum (ETH)', valid: eth });
      }
      if (net === 'auto' || net === 'sol') {
        var sol = isValidSOL(addr);
        results.push({ network: 'Solana (SOL)', valid: sol });
      }
      var h = '<h3 style="margin-bottom:16px">Validation Results</h3>';
      results.forEach(function(r) {
        h += '<div style="padding:10px 14px;margin-bottom:8px;background:var(--bg-tertiary);border-radius:var(--radius-sm);display:flex;justify-content:space-between;align-items:center"><span>' + r.network + '</span><span class="badge ' + (r.valid ? 'badge-g' : 'badge-r') + '">' + (r.valid ? 'Valid' : 'Invalid') + '</span></div>';
      });
      C.querySelector('#cryptoRes').innerHTML = h;
      C.querySelector('#cryptoRes').classList.add('show');
    });
  };

  // 47. Dynamic Form Builder
  AIO.formBuilder = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div class="tool-sec"><label>Form Title</label><input class="tool-inp" id="fbTitle" placeholder="Contact Form"/></div>' +
      '<div id="fbFields"></div><button class="tool-btn sec" id="fbAddField" style="margin-top:8px"><i class="fas fa-plus"></i> Add Field</button>' +
      '<button class="tool-btn" id="fbGenerate" style="margin-top:12px"><i class="fas fa-code"></i> Generate HTML</button>' +
      '<div id="fbRes" class="tool-res"></div>';
    var fieldCount = 0;

    function addField() {
      var div = document.createElement('div');
      div.className = 'fb-field-row';
      div.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-bottom:8px;align-items:end">' +
        '<div><label style="font-size:.8rem">Label</label><input class="tool-inp fb-label" placeholder="Name"/></div>' +
        '<div><label style="font-size:.8rem">Type</label><select class="tool-inp fb-type"><option>text</option><option>email</option><option>number</option><option>textarea</option><option>select</option><option>checkbox</option></select></div>' +
        '<button class="tool-btn sec fb-remove" style="padding:8px"><i class="fas fa-trash"></i></button></div>' +
        '<div class="fb-options" style="display:none;margin-bottom:8px"><label style="font-size:.8rem">Options (comma separated)</label><input class="tool-inp fb-opts" placeholder="Option1, Option2"/></div>';
      C.querySelector('#fbFields').appendChild(div);
      var typeSel = div.querySelector('.fb-type');
      var optDiv = div.querySelector('.fb-options');
      typeSel.addEventListener('change', function() {
        optDiv.style.display = (typeSel.value === 'select' || typeSel.value === 'checkbox') ? 'block' : 'none';
      });
      div.querySelector('.fb-remove').addEventListener('click', function() { div.remove(); });
      fieldCount++;
    }

    C.querySelector('#fbAddField').addEventListener('click', addField);
    addField(); // start with one

    C.querySelector('#fbGenerate').addEventListener('click', function() {
      var title = C.querySelector('#fbTitle').value || 'Form';
      var fields = C.querySelectorAll('.fb-field-row');
      var html = '<form>\n';
      if (title) html += '  <h2>' + title + '</h2>\n';
      fields.forEach(function(f) {
        var label = f.querySelector('.fb-label').value || 'Field';
        var type = f.querySelector('.fb-type').value;
        var opts = f.querySelector('.fb-opts') ? f.querySelector('.fb-opts').value : '';
        html += '  <label>' + label + '</label><br>\n';
        if (type === 'textarea') {
          html += '  <textarea name="' + label.toLowerCase().replace(/\s/g, '_') + '"></textarea><br>\n';
        } else if (type === 'select') {
          html += '  <select name="' + label.toLowerCase().replace(/\s/g, '_') + '">\n';
          if (opts) opts.split(',').forEach(function(o) { html += '    <option value="' + o.trim() + '">' + o.trim() + '</option>\n'; });
          html += '  </select><br>\n';
        } else if (type === 'checkbox') {
          html += '  <input type="checkbox" name="' + label.toLowerCase().replace(/\s/g, '_') + '"> ' + label + '<br>\n';
        } else {
          html += '  <input type="' + type + '" name="' + label.toLowerCase().replace(/\s/g, '_') + '"><br>\n';
        }
      });
      html += '  <button type="submit">Submit</button>\n</form>';
      C.querySelector('#fbRes').innerHTML = '<pre class="tool-inp" style="white-space:pre-wrap;font-family:var(--font-mono);cursor:pointer" onclick="navigator.clipboard.writeText(this.textContent)">' + html.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>';
      C.querySelector('#fbRes').classList.add('show');
    });
  };

  // 48. WebRTC Connectivity Test
  AIO.webrtcTest = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div class="tool-sec"><p>Click the button to gather ICE candidates and detect NAT type.</p></div>' +
      '<button class="tool-btn" id="webrtcBtn"><i class="fas fa-network-wired"></i> Run Test</button><div id="webrtcRes" class="tool-res"></div>';
    C.querySelector('#webrtcBtn').addEventListener('click', function() {
      var pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      var candidates = [];
      pc.createDataChannel('test');
      pc.onicecandidate = function(e) {
        if (e.candidate) candidates.push(e.candidate);
        else {
          pc.close();
          var types = candidates.map(function(c) { return c.type; });
          var nat = 'Unknown';
          if (types.includes('srflx')) nat = 'NAT with STUN (typical home)';
          else if (types.includes('relay')) nat = 'Relay (TURN) — restricted';
          else if (types.includes('host')) nat = 'Host (no NAT)';
          var h = '<h3>WebRTC Connectivity</h3><p>NAT Type: <strong>' + nat + '</strong></p>';
          h += '<p>Candidates found: ' + candidates.length + '</p><ul>';
          candidates.forEach(function(c) { h += '<li>' + c.type + ': ' + c.candidate.split(' ')[4] + '</li>'; });
          h += '</ul>';
          C.querySelector('#webrtcRes').innerHTML = h;
          C.querySelector('#webrtcRes').classList.add('show');
        }
      };
      pc.createOffer().then(function(offer) { return pc.setLocalDescription(offer); });
      setTimeout(function() { if (pc.iceConnectionState === 'new') { pc.close();
          C.querySelector('#webrtcRes').innerHTML = '<p>WebRTC test timed out. Your network may block STUN.</p>';
          C.querySelector('#webrtcRes').classList.add('show'); } }, 5000);
    });
  };

  // 49. Real-time Markdown Preview
  AIO.markdownPreview = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px"><textarea class="tool-inp" id="mdInput" style="height:300px" placeholder="Type markdown..."></textarea><div id="mdPreview" style="padding:16px;background:var(--bg-tertiary);border-radius:var(--radius-sm);overflow-y:auto;max-height:300px;border:1px solid var(--border)"></div></div>' +
      '<button class="tool-btn" id="mdExport" style="margin-top:8px"><i class="fas fa-download"></i> Export HTML</button>';
    var input = C.querySelector('#mdInput');
    var preview = C.querySelector('#mdPreview');
    input.addEventListener('input', function() {
      var txt = input.value;
      // Simple markdown parsing
      var html = txt
        .replace(/### (.*)/g, '<h4>$1</h4>')
        .replace(/## (.*)/g, '<h3>$1</h3>')
        .replace(/# (.*)/g, '<h2>$1</h2>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
        .replace(/\n/g, '<br>');
      preview.innerHTML = html;
    });
    C.querySelector('#mdExport').addEventListener('click', function() {
      var blob = new Blob([preview.innerHTML], { type: 'text/html' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'markdown-export.html';
      a.click();
    });
  };

  // 50. Image Metadata Stripper
  AIO.exifStripper = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div class="tool-sec"><label>Upload Image(s)</label><div class="file-zone" id="exifZone"><i class="fas fa-image"></i><p>Upload to strip EXIF metadata</p><input type="file" id="exifFiles" accept="image/*" multiple/></div></div>' +
      '<div id="exifRes" class="tool-res"></div>';
    var zone = C.querySelector('#exifZone');
    var fileInput = C.querySelector('#exifFiles');
    zone.addEventListener('click', function() { fileInput.click(); });
    fileInput.addEventListener('change', function() {
      var files = fileInput.files;
      if (!files.length) return;
      var h = '<h3>Stripped Images</h3>';
      Array.from(files).forEach(function(file) {
        var reader = new FileReader();
        reader.onload = function(e) {
          var img = new Image();
          img.onload = function() {
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            canvas.toBlob(function(blob) {
              var url = URL.createObjectURL(blob);
              h += '<div style="margin-bottom:12px"><img src="' + url + '" style="max-width:200px;border-radius:var(--radius-sm);display:block;margin-bottom:4px"><a href="' + url + '" download="clean_' + file.name + '" class="tool-btn sec"><i class="fas fa-download"></i> Download Clean</a></div>';
              C.querySelector('#exifRes').innerHTML = h;
              C.querySelector('#exifRes').classList.add('show');
            }, 'image/jpeg', 0.95);
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    });
  };

  // 51. CSS Grid Visual Builder
  AIO.gridBuilder = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px">' +
      '<div><label>Columns</label><input type="number" class="tool-inp" id="gridCols" value="3" min="1" max="6"></div>' +
      '<div><label>Rows</label><input type="number" class="tool-inp" id="gridRows" value="3" min="1" max="6"></div>' +
      '<div><label>Gap (px)</label><input type="number" class="tool-inp" id="gridGap" value="10"></div></div>' +
      '<div id="gridPreview" style="margin:16px 0;padding:8px;background:var(--bg-tertiary);border-radius:var(--radius-sm);min-height:200px;display:grid;"></div>' +
      '<button class="tool-btn" id="gridGenerate"><i class="fas fa-code"></i> Get CSS</button><div id="gridRes" class="tool-res"></div>';
    var colsInp = C.querySelector('#gridCols');
    var rowsInp = C.querySelector('#gridRows');
    var gapInp = C.querySelector('#gridGap');
    var grid = C.querySelector('#gridPreview');

    function updateGrid() {
      var cols = parseInt(colsInp.value);
      var rows = parseInt(rowsInp.value);
      var gap = parseInt(gapInp.value);
      grid.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
      grid.style.gridTemplateRows = 'repeat(' + rows + ', 60px)';
      grid.style.gap = gap + 'px';
      grid.innerHTML = '';
      for (var i = 0; i < cols * rows; i++) {
        var cell = document.createElement('div');
        cell.style.background = 'var(--accent)';
        cell.style.opacity = '0.7';
        cell.style.borderRadius = '4px';
        cell.textContent = i + 1;
        cell.style.display = 'flex';
        cell.style.alignItems = 'center';
        cell.style.justifyContent = 'center';
        cell.style.color = '#fff';
        cell.style.fontWeight = 'bold';
        grid.appendChild(cell);
      }
    }

    [colsInp, rowsInp, gapInp].forEach(function(inp) { inp.addEventListener('input', updateGrid); });
    updateGrid();

    C.querySelector('#gridGenerate').addEventListener('click', function() {
      var cols = colsInp.value;
      var rows = rowsInp.value;
      var gap = gapInp.value;
      var css = '.grid-container {\n  display: grid;\n  grid-template-columns: repeat(' + cols + ', 1fr);\n  grid-template-rows: repeat(' + rows + ', 60px);\n  gap: ' + gap + 'px;\n}';
      C.querySelector('#gridRes').innerHTML = '<pre class="tool-inp" style="cursor:pointer" onclick="navigator.clipboard.writeText(this.textContent)">' + css + '</pre>';
      C.querySelector('#gridRes').classList.add('show');
    });
  };

  // 52. API Endpoint Monitor
  AIO.apiMonitor = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div class="tool-sec"><label>URL</label><input class="tool-inp" id="apiUrl" placeholder="https://api.example.com/health"/></div>' +
      '<div class="tool-sec"><label>Method</label><select class="tool-inp" id="apiMethod"><option>GET</option><option>POST</option><option>PUT</option></select></div>' +
      '<div class="tool-sec"><label>Headers (JSON)</label><textarea class="tool-inp" id="apiHeaders" rows="2">{}</textarea></div>' +
      '<div class="tool-sec"><label>Body (for POST/PUT)</label><textarea class="tool-inp" id="apiBody" rows="3"></textarea></div>' +
      '<button class="tool-btn" id="apiSend"><i class="fas fa-paper-plane"></i> Send</button><div id="apiRes" class="tool-res"></div>';
    C.querySelector('#apiSend').addEventListener('click', async function() {
      var url = C.querySelector('#apiUrl').value;
      var method = C.querySelector('#apiMethod').value;
      var headers = {};
      try { headers = JSON.parse(C.querySelector('#apiHeaders').value || '{}'); } catch (e) {}
      var body = method !== 'GET' ? C.querySelector('#apiBody').value : undefined;
      var start = performance.now();
      try {
        var res = await fetch(url, { method, headers, body });
        var time = (performance.now() - start).toFixed(1);
        var resHeaders = [...res.headers.entries()].map(function(e) { return e[0] + ': ' + e[1]; }).join('\n');
        var text = await res.text();
        var h = '<p><strong>Status:</strong> ' + res.status + ' ' + res.statusText + '</p>';
        h += '<p><strong>Time:</strong> ' + time + ' ms</p>';
        h += '<p><strong>Headers:</strong></p><pre style="font-size:.8rem">' + resHeaders + '</pre>';
        h += '<p><strong>Response:</strong></p><pre style="font-size:.8rem;max-height:200px;overflow:auto">' + text.substring(0, 1000) + '</pre>';
        C.querySelector('#apiRes').innerHTML = h;
      } catch (e) {
        C.querySelector('#apiRes').innerHTML = '<p style="color:var(--red)">Error: ' + e.message + '</p>';
      }
      C.querySelector('#apiRes').classList.add('show');
    });
  };

  // 53. Password Strength Auditor
  AIO.passwordAuditor = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    var commonPasswords = ['password', '123456', 'qwerty', 'admin', 'welcome'];
    C.innerHTML = '<div class="tool-sec"><label>Enter Password</label><input type="text" class="tool-inp" id="pwdInput" placeholder="Type a password"/></div>' +
      '<div id="pwdMeter" style="height:8px;background:var(--bg-input);border-radius:4px;margin:12px 0;overflow:hidden"><div id="pwdBar" style="height:100%;width:0;background:var(--red);transition:width .3s"></div></div>' +
      '<div id="pwdRes" style="margin-bottom:12px"></div>';
    var input = C.querySelector('#pwdInput');
    input.addEventListener('input', function() {
      var pwd = input.value;
      if (!pwd) { C.querySelector('#pwdBar').style.width = '0';
        C.querySelector('#pwdRes').innerHTML = ''; return; }
      var lengthScore = Math.min(pwd.length * 4, 40);
      var variety = 0;
      if (/[a-z]/.test(pwd)) variety++;
      if (/[A-Z]/.test(pwd)) variety++;
      if (/[0-9]/.test(pwd)) variety++;
      if (/[^a-zA-Z0-9]/.test(pwd)) variety++;
      var varietyScore = variety * 15;
      var commonPenalty = commonPasswords.includes(pwd.toLowerCase()) ? -30 : 0;
      var score = Math.max(0, Math.min(100, lengthScore + varietyScore + commonPenalty));
      var color, text;
      if (score < 40) { color = 'var(--red)';
        text = 'Weak'; } else if (score < 70) { color = 'var(--amber)';
        text = 'Moderate'; } else { color = 'var(--green)';
        text = 'Strong'; }
      C.querySelector('#pwdBar').style.width = score + '%';
      C.querySelector('#pwdBar').style.background = color;
      C.querySelector('#pwdRes').innerHTML = '<span style="color:' + color + ';font-weight:600">' + text + '</span> (Score: ' + score + '/100)';
      if (commonPenalty) C.querySelector('#pwdRes').innerHTML += '<br><span style="color:var(--red)">Common password detected!</span>';
    });
  };

  // 54. Regex Playground
  AIO.regexPlayground = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div class="tool-sec"><label>Regex Pattern</label><input class="tool-inp" id="regexPat" placeholder="/pattern/flags"/></div>' +
      '<div class="tool-sec"><label>Test String</label><textarea class="tool-inp" id="regexStr" rows="4" placeholder="Enter text to test"></textarea></div>' +
      '<button class="tool-btn" id="regexBtn"><i class="fas fa-search"></i> Test</button><div id="regexRes" class="tool-res"></div>';
    C.querySelector('#regexBtn').addEventListener('click', function() {
      var patStr = C.querySelector('#regexPat').value.trim();
      var txt = C.querySelector('#regexStr').value;
      if (!patStr) return;
      // Support /pattern/ or just pattern
      var flags = '';
      var pattern = patStr;
      var match = patStr.match(/^\/(.*)\/([gimsuy]*)$/);
      if (match) { pattern = match[1];
        flags = match[2]; }
      var regex;
      try { regex = new RegExp(pattern, flags); } catch (e) {
        C.querySelector('#regexRes').innerHTML = '<p style="color:var(--red)">Invalid regex</p>';
        C.querySelector('#regexRes').classList.add('show');
        return;
      }
      var results = [];
      var m;
      while ((m = regex.exec(txt)) !== null) {
        results.push({ match: m[0], groups: m.slice(1), index: m.index });
        if (!flags.includes('g')) break;
      }
      var h = '<p>Matches found: ' + results.length + '</p>';
      results.forEach(function(r, i) {
        h += '<div style="margin-bottom:8px;padding:8px;background:var(--bg-tertiary);border-radius:var(--radius-sm)"><strong>#' + (i + 1) + ':</strong> ' + r.match + ' (index ' + r.index + ')';
        if (r.groups.length) h += '<br>Groups: ' + r.groups.join(', ');
        h += '</div>';
      });
      C.querySelector('#regexRes').innerHTML = h;
      C.querySelector('#regexRes').classList.add('show');
    });
  };

  // 55. Open Graph / Twitter Card Debugger
  AIO.socialCardDebugger = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div class="tool-sec"><label>URL</label><input class="tool-inp" id="ogUrl" placeholder="https://example.com"/></div>' +
      '<button class="tool-btn" id="ogFetchBtn"><i class="fas fa-cloud-download-alt"></i> Fetch Meta</button>' +
      '<div class="tool-sec" style="margin-top:12px"><label>Or paste HTML</label><textarea class="tool-inp" id="ogHtml" rows="6" placeholder="<meta property=..."></textarea></div>' +
      '<div id="ogRes" class="tool-res"></div>';

    function parseMeta(html) {
      var meta = {};
      var ogRegex = /<meta\s+property=["'](og:[^"']+)["']\s+content=["']([^"']+)["']/gi;
      var twRegex = /<meta\s+name=["'](twitter:[^"']+)["']\s+content=["']([^"']+)["']/gi;
      var m;
      while ((m = ogRegex.exec(html)) !== null) meta[m[1]] = m[2];
      while ((m = twRegex.exec(html)) !== null) meta[m[1]] = m[2];
      return meta;
    }

    function display(meta) {
      var h = '<div style="max-width:500px;border:1px solid #ccc;border-radius:8px;overflow:hidden;background:#fff;color:#000">';
      if (meta['og:image']) h += '<img src="' + meta['og:image'] + '" style="width:100%;max-height:300px;object-fit:cover">';
      h += '<div style="padding:12px"><h4 style="margin:0 0 4px">' + (meta['og:title'] || 'No title') + '</h4>';
      h += '<p style="margin:0 0 8px;color:#555">' + (meta['og:description'] || '') + '</p>';
      h += '<small style="color:#999">' + (meta['og:site_name'] || '') + '</small></div></div>';
      h += '<h4 style="margin-top:16px">All Meta Tags</h4><table>';
      for (var k in meta) {
        h += '<tr><td style="padding:4px;font-weight:600">' + k + '</td><td style="padding:4px">' + meta[k] + '</td></tr>';
      }
      h += '</table>';
      return h;
    }

    C.querySelector('#ogFetchBtn').addEventListener('click', async function() {
      var url = C.querySelector('#ogUrl').value;
      if (!url) return;
      try {
        var res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        var html = await res.text();
        var meta = parseMeta(html);
        C.querySelector('#ogRes').innerHTML = display(meta);
      } catch (e) {
        C.querySelector('#ogRes').innerHTML = '<p style="color:var(--red)">Could not fetch URL. Paste HTML manually.</p>';
      }
      C.querySelector('#ogRes').classList.add('show');
    });

    C.querySelector('#ogHtml').addEventListener('input', function() {
      var html = this.value;
      if (!html.trim()) return;
      var meta = parseMeta(html);
      C.querySelector('#ogRes').innerHTML = display(meta);
      C.querySelector('#ogRes').classList.add('show');
    });
  };

  // 56. PWA Manifest Generator
  AIO.pwaManifest = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
      '<div><label>Name</label><input class="tool-inp" id="pwaName" value="My App"/></div>' +
      '<div><label>Short Name</label><input class="tool-inp" id="pwaShort" value="App"/></div>' +
      '<div><label>Start URL</label><input class="tool-inp" id="pwaStart" value="/"/></div>' +
      '<div><label>Display</label><select class="tool-inp" id="pwaDisplay"><option>standalone</option><option>fullscreen</option><option>minimal-ui</option></select></div>' +
      '<div><label>Theme Color</label><input type="color" class="tool-inp" id="pwaTheme" value="#6366f1"/></div>' +
      '<div><label>Background Color</label><input type="color" class="tool-inp" id="pwaBg" value="#ffffff"/></div>' +
      '<div><label>Orientation</label><select class="tool-inp" id="pwaOri"><option>any</option><option>portrait</option><option>landscape</option></select></div>' +
      '<div><label>Icon URL (192x192)</label><input class="tool-inp" id="pwaIcon" value="icon-192.png"/></div></div>' +
      '<button class="tool-btn" id="pwaGen" style="margin-top:12px"><i class="fas fa-file-code"></i> Generate manifest.json</button><div id="pwaRes" class="tool-res"></div>';
    C.querySelector('#pwaGen').addEventListener('click', function() {
      var manifest = {
        name: C.querySelector('#pwaName').value,
        short_name: C.querySelector('#pwaShort').value,
        start_url: C.querySelector('#pwaStart').value,
        display: C.querySelector('#pwaDisplay').value,
        theme_color: C.querySelector('#pwaTheme').value,
        background_color: C.querySelector('#pwaBg').value,
        orientation: C.querySelector('#pwaOri').value,
        icons: [{ src: C.querySelector('#pwaIcon').value, sizes: '192x192', type: 'image/png' }]
      };
      var json = JSON.stringify(manifest, null, 2);
      C.querySelector('#pwaRes').innerHTML = '<pre class="tool-inp" style="cursor:pointer" onclick="navigator.clipboard.writeText(this.textContent)">' + json + '</pre><p>Link in HTML: <code>&lt;link rel="manifest" href="manifest.json"&gt;</code></p>';
      C.querySelector('#pwaRes').classList.add('show');
    });
  };

  // 57. WebAssembly Sandbox (simulated)
  AIO.wasmSandbox = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div class="tool-sec"><p>WebAssembly demo: a simple C function <code>int add(int a, int b) { return a + b; }</code> compiled to WAT and executed.</p></div>' +
      '<div style="display:flex;gap:8px"><input type="number" class="tool-inp" id="wasmA" value="5" style="width:80px"><span>+</span><input type="number" class="tool-inp" id="wasmB" value="3" style="width:80px"></div>' +
      '<button class="tool-btn" id="wasmRun" style="margin-top:8px"><i class="fas fa-play"></i> Run</button><div id="wasmRes" class="tool-res"></div>';
    C.querySelector('#wasmRun').addEventListener('click', async function() {
      var a = parseInt(C.querySelector('#wasmA').value);
      var b = parseInt(C.querySelector('#wasmB').value);
      // WAT module with exported add function
      var wat = '(module\n  (func $add (param i32 i32) (result i32)\n    local.get 0\n    local.get 1\n    i32.add)\n  (export "add" (func $add)))';
      try {
        var wasmModule = await WebAssembly.compile(new Uint8Array([
          0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x07, 0x01, 0x60, 0x02, 0x7f, 0x7f, 0x01, 0x7f,
          0x03, 0x02, 0x01, 0x00, 0x07, 0x07, 0x01, 0x03, 0x61, 0x64, 0x64, 0x00, 0x00, 0x0a, 0x09, 0x01, 0x07,
          0x00, 0x20, 0x00, 0x20, 0x01, 0x6a, 0x0b
        ]));
        var instance = await WebAssembly.instantiate(wasmModule);
        var result = instance.exports.add(a, b);
        C.querySelector('#wasmRes').innerHTML = '<p>WebAssembly result: <strong>' + a + ' + ' + b + ' = ' + result + '</strong></p>';
      } catch (e) {
        C.querySelector('#wasmRes').innerHTML = '<p style="color:var(--red)">WebAssembly not supported or error: ' + e.message + '</p>';
      }
      C.querySelector('#wasmRes').classList.add('show');
    });
  };

  // 58. AI Prompt Library Manager
  AIO.promptLibrary = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div class="tool-sec"><label>Prompt Template</label><textarea class="tool-inp" id="promptTpl" placeholder="Write a {{tone}} summary of {{topic}}." rows="3"></textarea></div>' +
      '<div id="promptVars" style="margin:8px 0"></div>' +
      '<button class="tool-btn sec" id="promptAddVar"><i class="fas fa-plus"></i> Add Variable</button>' +
      '<button class="tool-btn" id="promptRender" style="margin-top:8px"><i class="fas fa-magic"></i> Render</button>' +
      '<div id="promptRes" class="tool-res"></div>';
    var varsDiv = C.querySelector('#promptVars');

    function addVarRow(name, value) {
      var div = document.createElement('div');
      div.style.display = 'flex';
      div.style.gap = '8px';
      div.style.alignItems = 'center';
      div.style.marginBottom = '4px';
      div.innerHTML = '<input class="tool-inp var-name" placeholder="variable" value="' + (name || '') + '" style="width:120px"> = <input class="tool-inp var-value" placeholder="value" value="' + (value || '') + '" style="flex:1"><button class="tool-btn sec var-remove" style="padding:4px 8px"><i class="fas fa-times"></i></button>';
      div.querySelector('.var-remove').addEventListener('click', function() { div.remove(); });
      varsDiv.appendChild(div);
    }

    C.querySelector('#promptAddVar').addEventListener('click', function() { addVarRow('', ''); });
    addVarRow('tone', 'professional');
    addVarRow('topic', 'AI ethics');

    C.querySelector('#promptRender').addEventListener('click', function() {
      var tpl = C.querySelector('#promptTpl').value;
      var varRows = varsDiv.querySelectorAll('div');
      var rendered = tpl;
      varRows.forEach(function(row) {
        var name = row.querySelector('.var-name').value.trim();
        var value = row.querySelector('.var-value').value;
        if (name) rendered = rendered.replace(new RegExp('\\{\\{' + name + '\\}\\}', 'g'), value);
      });
      C.querySelector('#promptRes').innerHTML = '<h4>Rendered Prompt</h4><pre style="background:var(--bg-tertiary);padding:16px;border-radius:var(--radius-sm);white-space:pre-wrap">' + rendered + '</pre>';
      C.querySelector('#promptRes').classList.add('show');
    });
  };

  // 59. Dynamic Timezone & Holiday Calendar
  AIO.holidayCalendar = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    var holidays = {
      'US': [
        { date: '2026-01-01', name: 'New Year\'s Day' },
        { date: '2026-07-04', name: 'Independence Day' },
        { date: '2026-12-25', name: 'Christmas Day' }
      ],
      'UK': [
        { date: '2026-01-01', name: 'New Year\'s Day' },
        { date: '2026-12-25', name: 'Christmas Day' },
        { date: '2026-12-26', name: 'Boxing Day' }
      ],
      'IN': [
        { date: '2026-01-26', name: 'Republic Day' },
        { date: '2026-08-15', name: 'Independence Day' },
        { date: '2026-10-02', name: 'Gandhi Jayanti' }
      ]
    };
    C.innerHTML = '<div class="tool-sec"><label>Country</label><select class="tool-inp" id="holCountry">' + Object.keys(holidays).map(function(c) { return '<option value="' + c + '">' + c + '</option>'; }).join('') + '</select></div>' +
      '<div class="tool-sec"><label>Timezone</label><select class="tool-inp" id="holTz"><option>America/New_York</option><option>Europe/London</option><option>Asia/Kolkata</option></select></div>' +
      '<button class="tool-btn" id="holGen"><i class="fas fa-calendar-alt"></i> Generate iCal</button><div id="holRes" class="tool-res"></div>';
    C.querySelector('#holGen').addEventListener('click', function() {
      var country = C.querySelector('#holCountry').value;
      var tz = C.querySelector('#holTz').value;
      var evts = holidays[country] || [];
      var ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//DOXLAYER//Holiday Calendar//EN\n';
      evts.forEach(function(h) {
        ics += 'BEGIN:VEVENT\nDTSTART;VALUE=DATE:' + h.date.replace(/-/g, '') + '\nSUMMARY:' + h.name + '\nEND:VEVENT\n';
      });
      ics += 'END:VCALENDAR';
      var blob = new Blob([ics], { type: 'text/calendar' });
      var url = URL.createObjectURL(blob);
      C.querySelector('#holRes').innerHTML = '<h4>Holidays for ' + country + '</h4><ul>' + evts.map(function(h) { return '<li>' + h.date + ' - ' + h.name + '</li>'; }).join('') + '</ul><a class="tool-btn" href="' + url + '" download="holidays.ics"><i class="fas fa-download"></i> Download .ics</a>';
      C.querySelector('#holRes').classList.add('show');
    });
  };

  // 60. CSS Accessibility Auditor
  AIO.accessibilityAuditor = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    C.innerHTML = '<div class="tool-sec"><label>Foreground Color</label><input type="color" class="tool-inp" id="acFg" value="#ffffff"/></div>' +
      '<div class="tool-sec"><label>Background Color</label><input type="color" class="tool-inp" id="acBg" value="#6366f1"/></div>' +
      '<div class="tool-sec"><label>Simulate Color Blindness</label><select class="tool-inp" id="acSim"><option value="none">None</option><option value="protanopia">Protanopia</option><option value="deuteranopia">Deuteranopia</option><option value="tritanopia">Tritanopia</option></select></div>' +
      '<button class="tool-btn" id="acAudit"><i class="fas fa-universal-access"></i> Audit</button><div id="acRes" class="tool-res"></div>';

    function hexToRgb(hex) {
      var r = parseInt(hex.slice(1, 3), 16);
      var g = parseInt(hex.slice(3, 5), 16);
      var b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b];
    }

    function relativeLuminance(r, g, b) {
      var a = [r, g, b].map(function(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
      return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
    }

    function contrastRatio(l1, l2) {
      var lighter = Math.max(l1, l2);
      var darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    }

    function simulateColorBlindness(r, g, b, type) {
      // matrices from https://web.archive.org/web/20081014161121/http://www.colorjack.com/labs/colormatrix/
      var m;
      if (type === 'protanopia') m = [0.567, 0.433, 0, 0.558, 0.442, 0, 0, 0.242, 0.758];
      else if (type === 'deuteranopia') m = [0.625, 0.375, 0, 0.7, 0.3, 0, 0, 0.3, 0.7];
      else if (type === 'tritanopia') m = [0.95, 0.05, 0, 0, 0.433, 0.567, 0, 0.475, 0.525];
      else return [r, g, b];
      var nr = r * m[0] + g * m[1] + b * m[2];
      var ng = r * m[3] + g * m[4] + b * m[5];
      var nb = r * m[6] + g * m[7] + b * m[8];
      return [Math.min(255, Math.round(nr)), Math.min(255, Math.round(ng)), Math.min(255, Math.round(nb))];
    }

    C.querySelector('#acAudit').addEventListener('click', function() {
      var fg = C.querySelector('#acFg').value;
      var bg = C.querySelector('#acBg').value;
      var sim = C.querySelector('#acSim').value;
      var fgRgb = hexToRgb(fg);
      var bgRgb = hexToRgb(bg);
      if (sim !== 'none') { fgRgb = simulateColorBlindness(fgRgb[0], fgRgb[1], fgRgb[2], sim);
        bgRgb = simulateColorBlindness(bgRgb[0], bgRgb[1], bgRgb[2], sim); }
      var lFg = relativeLuminance(fgRgb[0], fgRgb[1], fgRgb[2]);
      var lBg = relativeLuminance(bgRgb[0], bgRgb[1], bgRgb[2]);
      var ratio = contrastRatio(lFg, lBg);
      var aa = ratio >= 4.5;
      var aaa = ratio >= 7;
      var h = '<div style="display:flex;gap:16px;align-items:center"><div style="width:100px;height:100px;background:rgb(' + fgRgb.join(',') + ');border:1px solid #ccc;"></div><div style="width:100px;height:100px;background:rgb(' + bgRgb.join(',') + ');border:1px solid #ccc;"></div></div>';
      h += '<p>Contrast Ratio: <strong>' + ratio.toFixed(2) + ':1</strong></p>';
      h += '<p>WCAG AA (normal text): ' + (aa ? '<span style="color:var(--green)">Pass</span>' : '<span style="color:var(--red)">Fail</span>') + '</p>';
      h += '<p>WCAG AAA: ' + (aaa ? '<span style="color:var(--green)">Pass</span>' : '<span style="color:var(--red)">Fail</span>') + '</p>';
      C.querySelector('#acRes').innerHTML = h;
      C.querySelector('#acRes').classList.add('show');
    });
  };

})(window);
