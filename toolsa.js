/* =============================================
   AIO Tools 3 
   Host on GitHub as tools3.js
   ============================================= */
(function(w){
  'use strict';
  var AIO = w.AIO = w.AIO || {};

  function loadScript(url) {
    return new Promise(function(resolve, reject) {
      var existing = document.querySelector('script[src="' + url + '"]');
      if (existing) { resolve(); return; }
      var s = document.createElement('script');
      s.src = url;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function downloadBlob(blob, filename) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(a.href); }, 3000);
  }

  function formatBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }

  /* ==========================================
     46. Smart Bulk Image Cropper
     ========================================== */
  AIO.bulkImageCropper = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    var images = [];
    var ratioMap = {'1:1': 1, '16:9': 16 / 9, '9:16': 9 / 16, '4:5': 4 / 5, '5:4': 5 / 4, '3:2': 3 / 2, '2:3': 2 / 3};

    C.innerHTML =
      '<div class="tool-sec"><label>Upload Images</label>' +
      '<div class="file-zone" id="bicZone"><i class="fas fa-images"></i>' +
      '<p>Drag & drop or click to upload images</p><p class="sm">JPG, PNG, WebP — up to 50+ files</p>' +
      '<input type="file" id="bicFile" accept="image/*" multiple/></div></div>' +
      '<div class="tool-sec" id="bicCtrl" style="display:none">' +
      '<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:12px">' +
      '<label style="font-size:.85rem;font-weight:600">Global Ratio:</label>' +
      '<select class="tool-inp" id="bicRatio" style="max-width:180px">' +
      '<option value="1:1">1:1 Square</option><option value="16:9">16:9 Wide</option>' +
      '<option value="9:16">9:16 Portrait</option><option value="4:5">4:5 Social</option>' +
      '<option value="5:4">5:4</option><option value="3:2">3:2</option><option value="2:3">2:3</option></select>' +
      '<label style="font-size:.85rem;font-weight:600">Format:</label>' +
      '<select class="tool-inp" id="bicFmt" style="max-width:140px">' +
      '<option value="image/jpeg">JPEG</option><option value="image/png">PNG</option>' +
      '<option value="image/webp">WebP</option></select>' +
      '<label style="font-size:.85rem">Quality: <span id="bicQv">90</span>%</label>' +
      '<input type="range" id="bicQ" min="10" max="100" value="90" style="width:100px;accent-color:var(--accent)"/></div>' +
      '<div style="display:flex;gap:8px;margin-bottom:12px">' +
      '<button class="tool-btn" id="bicApply"><i class="fas fa-crop-simple"></i> Apply to All</button>' +
      '<button class="tool-btn sec" id="bicClear"><i class="fas fa-trash"></i> Clear</button>' +
      '<span id="bicCount" style="align-self:center;font-size:.85rem;color:var(--text-muted)"></span></div></div>' +
      '<div id="bicGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px;margin-bottom:16px"></div>' +
      '<div id="bicProg" style="display:none;margin-bottom:12px">' +
      '<div style="height:4px;background:var(--bg-input);border-radius:var(--radius-full);overflow:hidden;margin-bottom:8px">' +
      '<div id="bicBar" style="height:100%;width:0;background:var(--accent);transition:width .2s"></div></div>' +
      '<p id="bicStat" style="font-size:.85rem;color:var(--text-muted)"></p></div>' +
      '<button class="tool-btn" id="bicExport" style="display:none"><i class="fas fa-download"></i> Download ZIP</button>';

    var fI = C.querySelector('#bicFile');
    var zone = C.querySelector('#bicZone');
    zone.addEventListener('click', function() { fI.click(); });
    zone.addEventListener('dragover', function(e) { e.preventDefault(); zone.style.borderColor = 'var(--accent)'; });
    zone.addEventListener('dragleave', function() { zone.style.borderColor = ''; });
    zone.addEventListener('drop', function(e) {
      e.preventDefault(); zone.style.borderColor = '';
      addFiles(Array.from(e.dataTransfer.files).filter(function(f) { return f.type.startsWith('image/'); }));
    });
    fI.addEventListener('change', function(e) { addFiles(Array.from(e.target.files)); });
    C.querySelector('#bicQ').addEventListener('input', function() { C.querySelector('#bicQv').textContent = this.value; });

    function addFiles(files) {
      var pending = files.length;
      if (!pending) return;
      files.forEach(function(file) {
        var reader = new FileReader();
        reader.onload = function(e) {
          var img = new Image();
          img.onload = function() {
            images.push({ file: file, img: img, name: file.name, ratioKey: C.querySelector('#bicRatio').value });
            pending--;
            if (pending === 0) { renderGrid(); C.querySelector('#bicCtrl').style.display = 'block'; updateCount(); }
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    function updateCount() {
      C.querySelector('#bicCount').textContent = images.length + ' image(s)';
      C.querySelector('#bicExport').style.display = images.length ? 'inline-flex' : 'none';
    }

    function renderGrid() {
      var grid = C.querySelector('#bicGrid');
      grid.innerHTML = '';
      images.forEach(function(item, idx) {
        var div = document.createElement('div');
        div.style.cssText = 'position:relative;background:var(--bg-tertiary);border-radius:var(--radius-sm);border:1px solid var(--border);overflow:hidden';
        var cnv = document.createElement('canvas');
        cnv.width = 170; cnv.height = 150;
        cnv.style.cssText = 'width:100%;height:140px;display:block';
        var ctx = cnv.getContext('2d');
        var ratio = ratioMap[item.ratioKey] || 1;
        var iw = item.img.naturalWidth, ih = item.img.naturalHeight;
        var cw, ch;
        if (iw / ih > ratio) { ch = ih; cw = Math.round(ih * ratio); }
        else { cw = iw; ch = Math.round(iw / ratio); }
        var cx = (iw - cw) / 2, cy = (ih - ch) / 2;
        var scale = Math.max(170 / cw, 150 / ch);
        var dw = cw * scale, dh = ch * scale;
        var dx = (170 - dw) / 2, dy = (150 - dh) / 2;
        ctx.drawImage(item.img, cx, cy, cw, ch, dx, dy, dw, dh);
        ctx.strokeStyle = 'rgba(99,102,241,0.6)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(dx, dy, dw, dh);
        div.appendChild(cnv);
        var info = document.createElement('div');
        info.style.cssText = 'padding:6px 8px';
        info.innerHTML = '<p style="font-size:.7rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + item.name + '</p>' +
          '<p style="font-size:.7rem;color:var(--accent)">' + cw + 'x' + ch + ' (' + item.ratioKey + ')</p>' +
          '<button class="tool-btn sec" data-i="' + idx + '" style="font-size:.65rem;padding:2px 6px;margin-top:2px"><i class="fas fa-times"></i></button>';
        div.appendChild(info);
        grid.appendChild(div);
      });
      grid.querySelectorAll('button[data-i]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          images.splice(parseInt(this.getAttribute('data-i')), 1);
          renderGrid(); updateCount();
          if (!images.length) C.querySelector('#bicCtrl').style.display = 'none';
        });
      });
    }

    C.querySelector('#bicApply').addEventListener('click', function() {
      var rk = C.querySelector('#bicRatio').value;
      images.forEach(function(item) { item.ratioKey = rk; });
      renderGrid();
    });

    C.querySelector('#bicClear').addEventListener('click', function() {
      images = []; C.querySelector('#bicGrid').innerHTML = '';
      C.querySelector('#bicCtrl').style.display = 'none';
      C.querySelector('#bicExport').style.display = 'none';
    });

    C.querySelector('#bicExport').addEventListener('click', function() {
      if (!images.length) return;
      loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js').then(function() {
        var zip = new JSZip();
        var fmt = C.querySelector('#bicFmt').value;
        var q = parseInt(C.querySelector('#bicQ').value) / 100;
        var ext = fmt === 'image/png' ? '.png' : fmt === 'image/webp' ? '.webp' : '.jpg';
        var prog = C.querySelector('#bicProg'), bar = C.querySelector('#bicBar'), stat = C.querySelector('#bicStat');
        prog.style.display = 'block';
        var done = 0;
        function next() {
          if (done >= images.length) {
            stat.textContent = 'Creating ZIP...';
            zip.generateAsync({ type: 'blob' }).then(function(b) {
              downloadBlob(b, 'cropped-images.zip');
              stat.textContent = 'Downloaded!';
            });
            return;
          }
          var item = images[done];
          var ratio = ratioMap[item.ratioKey] || 1;
          var iw = item.img.naturalWidth, ih = item.img.naturalHeight;
          var cw, ch;
          if (iw / ih > ratio) { ch = ih; cw = Math.round(ih * ratio); }
          else { cw = iw; ch = Math.round(iw / ratio); }
          var cx = Math.round((iw - cw) / 2), cy = Math.round((ih - ch) / 2);
          var cnv = document.createElement('canvas');
          cnv.width = cw; cnv.height = ch;
          cnv.getContext('2d').drawImage(item.img, cx, cy, cw, ch, 0, 0, cw, ch);
          cnv.toBlob(function(b) {
            zip.file(item.name.replace(/\.[^.]+$/, '') + ext, b);
            done++;
            bar.style.width = Math.round(done / images.length * 100) + '%';
            stat.textContent = 'Processing ' + done + '/' + images.length;
            setTimeout(next, 5);
          }, fmt, q);
        }
        next();
      });
    });
  };

  /* ==========================================
     47. PDF Merge / Split / Reorder / Rotate
     ========================================== */
  AIO.pdfToolkit = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    var pdfFiles = [];
    var pages = [];

    C.innerHTML =
      '<div class="tool-sec"><label>Upload PDFs</label>' +
      '<div class="file-zone" id="pdfZone"><i class="fas fa-file-pdf"></i>' +
      '<p>Drag & drop or click to upload PDF files</p><p class="sm">Merge, split, reorder, rotate — all client-side</p>' +
      '<input type="file" id="pdfFile" accept=".pdf" multiple/></div></div>' +
      '<div class="tool-sec" id="pdfCtrl" style="display:none">' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">' +
      '<button class="tool-btn" id="pdfMerge"><i class="fas fa-object-group"></i> Merge & Download</button>' +
      '<button class="tool-btn sec" id="pdfClear"><i class="fas fa-trash"></i> Clear All</button>' +
      '<span id="pdfInfo" style="font-size:.85rem;color:var(--text-muted)"></span></div>' +
      '<p style="font-size:.8rem;color:var(--text-muted);margin-top:8px">Drag pages to reorder. Click rotate icon to rotate. Click X to remove.</p></div>' +
      '<div id="pdfPages" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;margin:16px 0"></div>';

    var fI = C.querySelector('#pdfFile');
    var zone = C.querySelector('#pdfZone');
    zone.addEventListener('click', function() { fI.click(); });
    zone.addEventListener('dragover', function(e) { e.preventDefault(); zone.style.borderColor = 'var(--accent)'; });
    zone.addEventListener('dragleave', function() { zone.style.borderColor = ''; });
    zone.addEventListener('drop', function(e) {
      e.preventDefault(); zone.style.borderColor = '';
      loadPDFs(Array.from(e.dataTransfer.files).filter(function(f) { return f.type === 'application/pdf'; }));
    });
    fI.addEventListener('change', function(e) { loadPDFs(Array.from(e.target.files)); });

    function loadPDFs(files) {
      if (!files.length) return;
      loadScript('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js').then(function() {
        var proms = files.map(function(file) {
          return file.arrayBuffer().then(function(buf) {
            return PDFLib.PDFDocument.load(buf, { ignoreEncryption: true }).then(function(doc) {
              var idx = pdfFiles.length;
              pdfFiles.push({ doc: doc, name: file.name });
              var count = doc.getPageCount();
              for (var i = 0; i < count; i++) pages.push({ fi: idx, pi: i, rot: 0 });
            }).catch(function() {});
          });
        });
        Promise.all(proms).then(function() { renderPages(); updateInfo(); C.querySelector('#pdfCtrl').style.display = 'block'; });
      });
    }

    function updateInfo() {
      C.querySelector('#pdfInfo').textContent = pdfFiles.length + ' file(s), ' + pages.length + ' page(s)';
    }

    function renderPages() {
      var container = C.querySelector('#pdfPages');
      container.innerHTML = '';
      pages.forEach(function(pg, idx) {
        var name = pdfFiles[pg.fi].name;
        var div = document.createElement('div');
        div.draggable = true;
        div.setAttribute('data-idx', idx);
        div.style.cssText = 'background:var(--bg-tertiary);border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px;text-align:center;cursor:grab;user-select:none';
        div.innerHTML =
          '<div style="height:70px;display:flex;align-items:center;justify-content:center;background:var(--bg);border-radius:var(--radius-sm);margin-bottom:4px">' +
          '<i class="fas fa-file-pdf" style="font-size:1.5rem;color:var(--red)"></i></div>' +
          '<p style="font-size:.65rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + name + '</p>' +
          '<p style="font-size:.75rem;font-weight:600">P' + (pg.pi + 1) + ' <span style="color:var(--text-muted);font-size:.7rem">' + pg.rot + '°</span></p>' +
          '<div style="display:flex;gap:3px;justify-content:center;margin-top:3px">' +
          '<button class="tool-btn sec rot-btn" data-i="' + idx + '" style="font-size:.6rem;padding:2px 5px"><i class="fas fa-rotate-right"></i></button>' +
          '<button class="tool-btn sec del-btn" data-i="' + idx + '" style="font-size:.6rem;padding:2px 5px;color:var(--red)"><i class="fas fa-times"></i></button></div>';
        div.addEventListener('dragstart', function(e) { e.dataTransfer.setData('text/plain', '' + idx); this.style.opacity = '0.4'; });
        div.addEventListener('dragend', function() { this.style.opacity = '1'; });
        div.addEventListener('dragover', function(e) { e.preventDefault(); this.style.borderColor = 'var(--accent)'; });
        div.addEventListener('dragleave', function() { this.style.borderColor = ''; });
        div.addEventListener('drop', function(e) {
          e.preventDefault(); this.style.borderColor = '';
          var from = parseInt(e.dataTransfer.getData('text/plain'));
          var to = parseInt(this.getAttribute('data-idx'));
          if (from !== to && !isNaN(from)) {
            var item = pages.splice(from, 1)[0];
            pages.splice(to, 0, item);
            renderPages();
          }
        });
        container.appendChild(div);
      });
      container.querySelectorAll('.rot-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          var i = parseInt(this.getAttribute('data-i'));
          pages[i].rot = (pages[i].rot + 90) % 360;
          renderPages();
        });
      });
      container.querySelectorAll('.del-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          pages.splice(parseInt(this.getAttribute('data-i')), 1);
          renderPages(); updateInfo();
        });
      });
    }

    C.querySelector('#pdfMerge').addEventListener('click', function() {
      if (!pages.length) return;
      PDFLib.PDFDocument.create().then(function(out) {
        var chain = Promise.resolve();
        pages.forEach(function(pg) {
          chain = chain.then(function() {
            return out.copyPages(pdfFiles[pg.fi].doc, [pg.pi]).then(function(ps) {
              if (pg.rot) ps[0].setRotation(PDFLib.degrees(pg.rot));
              out.addPage(ps[0]);
            });
          });
        });
        chain.then(function() { return out.save(); }).then(function(bytes) {
          downloadBlob(new Blob([bytes], { type: 'application/pdf' }), 'merged.pdf');
        });
      });
    });

    C.querySelector('#pdfClear').addEventListener('click', function() {
      pdfFiles = []; pages = [];
      C.querySelector('#pdfPages').innerHTML = '';
      C.querySelector('#pdfCtrl').style.display = 'none';
    });
  };

  /* ==========================================
     48. Bulk EXIF Stripper & Privacy Sanitizer
     ========================================== */
  AIO.exifStripper = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    var files = [];

    C.innerHTML =
      '<div class="tool-sec"><label>Upload Images</label>' +
      '<div class="file-zone" id="exZone"><i class="fas fa-user-shield"></i>' +
      '<p>Upload images to strip metadata</p><p class="sm">Removes EXIF, GPS, camera info, thumbnails</p>' +
      '<input type="file" id="exFile" accept="image/*" multiple/></div></div>' +
      '<div class="tool-sec" id="exCtrl" style="display:none">' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">' +
      '<button class="tool-btn" id="exAnalyze"><i class="fas fa-search"></i> Analyze</button>' +
      '<button class="tool-btn" id="exStrip"><i class="fas fa-shield-halved"></i> Strip & Download ZIP</button>' +
      '<button class="tool-btn sec" id="exClear"><i class="fas fa-trash"></i> Clear</button>' +
      '<span id="exCount" style="font-size:.85rem;color:var(--text-muted)"></span></div></div>' +
      '<div id="exReport" style="margin:16px 0"></div>' +
      '<div id="exProg" style="display:none;margin-bottom:12px">' +
      '<div style="height:4px;background:var(--bg-input);border-radius:var(--radius-full);overflow:hidden;margin-bottom:8px">' +
      '<div id="exBar" style="height:100%;width:0;background:var(--accent);transition:width .2s"></div></div>' +
      '<p id="exStat" style="font-size:.85rem;color:var(--text-muted)"></p></div>';

    var fI = C.querySelector('#exFile');
    var zone = C.querySelector('#exZone');
    zone.addEventListener('click', function() { fI.click(); });
    zone.addEventListener('dragover', function(e) { e.preventDefault(); zone.style.borderColor = 'var(--accent)'; });
    zone.addEventListener('dragleave', function() { zone.style.borderColor = ''; });
    zone.addEventListener('drop', function(e) {
      e.preventDefault(); zone.style.borderColor = '';
      files = Array.from(e.dataTransfer.files).filter(function(f) { return f.type.startsWith('image/'); });
      C.querySelector('#exCtrl').style.display = files.length ? 'block' : 'none';
      C.querySelector('#exCount').textContent = files.length + ' image(s)';
    });
    fI.addEventListener('change', function(e) {
      files = Array.from(e.target.files);
      C.querySelector('#exCtrl').style.display = files.length ? 'block' : 'none';
      C.querySelector('#exCount').textContent = files.length + ' image(s)';
    });

    function readEXIF(buf) {
      var v = new DataView(buf);
      var info = { hasEXIF: false, hasGPS: false, hasCamera: false, hasDate: false, exifBytes: 0 };
      if (v.byteLength < 4 || v.getUint8(0) !== 0xFF || v.getUint8(1) !== 0xD8) return info;
      var off = 2;
      while (off < v.byteLength - 4) {
        if (v.getUint8(off) !== 0xFF) break;
        var mk = v.getUint8(off + 1);
        if (mk === 0xE1) {
          var len = v.getUint16(off + 2);
          info.hasEXIF = true;
          info.exifBytes = len + 2;
          var raw = '';
          for (var i = off + 4; i < Math.min(off + 4 + len, off + 4 + 800); i++) {
            raw += String.fromCharCode(v.getUint8(i));
          }
          if (/GPS|latitude|longitude/i.test(raw)) info.hasGPS = true;
          if (/Make|Model|Canon|Nikon|Sony|iPhone|Samsung/i.test(raw)) info.hasCamera = true;
          if (/DateTime|date/i.test(raw)) info.hasDate = true;
          break;
        } else if (mk === 0xDA) {
          break;
        } else {
          off += 2 + v.getUint16(off + 2);
        }
      }
      return info;
    }

    C.querySelector('#exAnalyze').addEventListener('click', function() {
      if (!files.length) return;
      var report = C.querySelector('#exReport');
      report.innerHTML = '<p style="color:var(--text-muted);font-size:.85rem">Analyzing...</p>';
      var results = [], done = 0;
      files.forEach(function(file, idx) {
        var reader = new FileReader();
        reader.onload = function(e) {
          var info = readEXIF(e.target.result);
          info.name = file.name; info.size = file.size;
          results[idx] = info;
          done++;
          if (done >= files.length) showReport(results);
        };
        reader.readAsArrayBuffer(file);
      });
    });

    function showReport(results) {
      var gps = 0, cam = 0, totalExif = 0;
      var h = '<h3 style="margin-bottom:12px">Metadata Report</h3>';
      results.forEach(function(r) {
        if (r.hasGPS) gps++;
        if (r.hasCamera) cam++;
        if (r.hasEXIF) totalExif++;
        var badges = [];
        if (r.hasEXIF) badges.push('<span class="badge badge-y">EXIF</span>');
        if (r.hasGPS) badges.push('<span class="badge badge-r">GPS</span>');
        if (r.hasCamera) badges.push('<span class="badge badge-y">Camera</span>');
        if (r.hasDate) badges.push('<span class="badge badge-y">Date</span>');
        if (!r.hasEXIF) badges.push('<span class="badge badge-g">Clean</span>');
        h += '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;margin-bottom:4px;background:var(--bg-tertiary);border-radius:var(--radius-sm)">' +
          '<span style="flex:1;font-size:.85rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + r.name + ' <span style="color:var(--text-muted);font-size:.75rem">(' + formatBytes(r.size) + ')</span></span>' +
          '<div style="display:flex;gap:4px">' + badges.join('') + '</div></div>';
      });
      h += '<div style="display:flex;gap:12px;margin-top:12px;flex-wrap:wrap">';
      h += '<span class="chip"><i class="fas fa-images"></i> ' + results.length + ' files</span>';
      h += '<span class="chip ' + (totalExif ? 'badge-y' : 'badge-g') + '"><i class="fas fa-database"></i> ' + totalExif + ' EXIF</span>';
      h += '<span class="chip ' + (gps ? 'badge-r' : 'badge-g') + '"><i class="fas fa-location-dot"></i> ' + gps + ' GPS</span>';
      h += '<span class="chip ' + (cam ? 'badge-y' : 'badge-g') + '"><i class="fas fa-camera"></i> ' + cam + ' Camera</span>';
      h += '</div>';
      if (gps > 0) {
        h += '<div style="margin-top:12px;padding:12px;background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-sm)">' +
          '<p style="color:var(--red);font-weight:600;font-size:.85rem"><i class="fas fa-triangle-exclamation"></i> ' + gps + ' image(s) contain GPS coordinates — your exact location is embedded.</p></div>';
      }
      C.querySelector('#exReport').innerHTML = h;
    }

    C.querySelector('#exStrip').addEventListener('click', function() {
      if (!files.length) return;
      loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js').then(function() {
        var zip = new JSZip();
        var prog = C.querySelector('#exProg'), bar = C.querySelector('#exBar'), stat = C.querySelector('#exStat');
        prog.style.display = 'block';
        var done = 0;
        function next() {
          if (done >= files.length) {
            stat.textContent = 'Creating ZIP...';
            zip.generateAsync({ type: 'blob' }).then(function(b) { downloadBlob(b, 'sanitized-images.zip'); stat.textContent = 'Done!'; });
            return;
          }
          var file = files[done];
          var reader = new FileReader();
          reader.onload = function(e) {
            var img = new Image();
            img.onload = function() {
              var cnv = document.createElement('canvas');
              cnv.width = img.naturalWidth; cnv.height = img.naturalHeight;
              cnv.getContext('2d').drawImage(img, 0, 0);
              cnv.toBlob(function(b) {
                zip.file(file.name, b);
                done++; bar.style.width = Math.round(done / files.length * 100) + '%';
                stat.textContent = 'Stripping ' + done + '/' + files.length;
                setTimeout(next, 5);
              }, file.type || 'image/jpeg', 0.95);
            };
            img.src = e.target.result;
          };
          reader.readAsDataURL(file);
        }
        next();
      });
    });

    C.querySelector('#exClear').addEventListener('click', function() {
      files = []; C.querySelector('#exReport').innerHTML = '';
      C.querySelector('#exCtrl').style.display = 'none';
    });
  };

  /* ==========================================
     49. Folder Tree Diff & Sync Reporter
     ========================================== */
  AIO.folderDiff = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    var setA = [], setB = [];

    C.innerHTML =
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px" class="fdG">' +
      '<style>@media(max-width:700px){.fdG{grid-template-columns:1fr!important}}</style>' +
      '<div class="tool-sec"><label>Folder A (Original)</label>' +
      '<div class="file-zone" id="fdZA"><i class="fas fa-folder"></i><p>Drop or select Folder A</p>' +
      '<input type="file" id="fdFA" webkitdirectory multiple/></div>' +
      '<p id="fdCA" style="font-size:.8rem;color:var(--text-muted);margin-top:6px"></p></div>' +
      '<div class="tool-sec"><label>Folder B (Updated)</label>' +
      '<div class="file-zone" id="fdZB"><i class="fas fa-folder-tree"></i><p>Drop or select Folder B</p>' +
      '<input type="file" id="fdFB" webkitdirectory multiple/></div>' +
      '<p id="fdCB" style="font-size:.8rem;color:var(--text-muted);margin-top:6px"></p></div></div>' +
      '<button class="tool-btn" id="fdBtn" style="margin-top:16px"><i class="fas fa-code-compare"></i> Compare</button>' +
      '<div id="fdRes" class="tool-res"></div>';

    function setup(zoneId, fileId, arr, countId) {
      var z = C.querySelector('#' + zoneId), f = C.querySelector('#' + fileId);
      z.addEventListener('click', function() { f.click(); });
      z.addEventListener('dragover', function(e) { e.preventDefault(); z.style.borderColor = 'var(--accent)'; });
      z.addEventListener('dragleave', function() { z.style.borderColor = ''; });
      z.addEventListener('drop', function(e) {
        e.preventDefault(); z.style.borderColor = '';
        var items = e.dataTransfer.items;
        if (items) {
          for (var i = 0; i < items.length; i++) {
            var entry = items[i].webkitGetAsEntry && items[i].webkitGetAsEntry();
            if (entry && entry.isDirectory) walkDir(entry, arr, function() { C.querySelector('#' + countId).textContent = arr.length + ' files'; });
          }
        }
      });
      f.addEventListener('change', function(e) {
        arr.length = 0;
        Array.from(e.target.files).forEach(function(file) {
          arr.push({ path: file.webkitRelativePath || file.name, name: file.name, size: file.size, mod: file.lastModified });
        });
        C.querySelector('#' + countId).textContent = arr.length + ' files';
      });
    }

    function walkDir(entry, arr, cb) {
      var reader = entry.createReader();
      reader.readEntries(function(entries) {
        entries.forEach(function(e) {
          if (e.isFile) {
            e.file(function(f) {
              arr.push({ path: e.fullPath.substring(1), name: f.name, size: f.size, mod: f.lastModified });
              if (cb) cb();
            });
          } else if (e.isDirectory) { walkDir(e, arr, cb); }
        });
      });
    }

    setup('fdZA', 'fdFA', setA, 'fdCA');
    setup('fdZB', 'fdFB', setB, 'fdCB');

    C.querySelector('#fdBtn').addEventListener('click', function() {
      if (!setA.length && !setB.length) return;
      var mA = {}, mB = {};
      setA.forEach(function(f) { mA[f.path] = f; });
      setB.forEach(function(f) { mB[f.path] = f; });
      var all = {};
      Object.keys(mA).forEach(function(p) { all[p] = true; });
      Object.keys(mB).forEach(function(p) { all[p] = true; });
      var missing = [], extra = [], modified = [], same = [];
      Object.keys(all).forEach(function(p) {
        var a = mA[p], b = mB[p];
        if (a && !b) missing.push(p);
        else if (!a && b) extra.push(p);
        else if (a.size !== b.size || Math.abs(a.mod - b.mod) > 2000) modified.push(p);
        else same.push(p);
      });
      var h = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin-bottom:20px">';
      [['Total', Object.keys(all).length, 'var(--text-primary)'], ['Missing', missing.length, 'var(--red)'], ['Added', extra.length, 'var(--green)'], ['Modified', modified.length, 'var(--accent)'], ['Unchanged', same.length, 'var(--text-muted)']].forEach(function(d) {
        h += '<div style="text-align:center;padding:14px;background:var(--bg-tertiary);border-radius:var(--radius-sm)">' +
          '<p style="font-size:.75rem;color:var(--text-muted)">' + d[0] + '</p>' +
          '<p style="font-weight:700;font-size:1.2rem;color:' + d[2] + '">' + d[1] + '</p></div>';
      });
      h += '</div>';
      function list(title, items, color, icon) {
        if (!items.length) return '';
        var r = '<div style="margin-bottom:16px"><h4 style="color:' + color + ';margin-bottom:8px"><i class="fas ' + icon + '"></i> ' + title + ' (' + items.length + ')</h4>';
        items.forEach(function(p) {
          r += '<div style="padding:6px 12px;margin-bottom:3px;background:var(--bg-tertiary);border-radius:var(--radius-sm);font-size:.8rem;font-family:var(--font-mono);border-left:3px solid ' + color + '">' + p + '</div>';
        });
        return r + '</div>';
      }
      h += list('Missing (in A, not in B)', missing, 'var(--red)', 'fa-minus-circle');
      h += list('Added (in B, not in A)', extra, 'var(--green)', 'fa-plus-circle');
      h += list('Modified', modified, 'var(--accent)', 'fa-pen');
      if (same.length) h += '<p style="color:var(--text-muted);font-size:.8rem">' + same.length + ' unchanged file(s)</p>';
      C.querySelector('#fdRes').innerHTML = h;
      C.querySelector('#fdRes').classList.add('show');
    });
  };

  /* ==========================================
     50. Regex Bulk File Renamer
     ========================================== */
  AIO.regexRenamer = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    var files = [];

    C.innerHTML =
      '<div class="tool-sec"><label>Upload Files</label>' +
      '<div class="file-zone" id="rrZone"><i class="fas fa-file-pen"></i>' +
      '<p>Upload files to rename</p><p class="sm">Any file type — processed locally</p>' +
      '<input type="file" id="rrFile" multiple/></div></div>' +
      '<div class="tool-sec" id="rrCtrl" style="display:none">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px" class="rrG">' +
      '<style>@media(max-width:700px){.rrG{grid-template-columns:1fr!important}}</style>' +
      '<div><label>Find (Regex)</label><input class="tool-inp" id="rrFind" placeholder="e.g. IMG_(\\d+)" style="font-family:var(--font-mono)"/></div>' +
      '<div><label>Replace With</label><input class="tool-inp" id="rrRepl" placeholder="e.g. Photo_$1" style="font-family:var(--font-mono)"/></div></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:center">' +
      '<label style="font-size:.85rem"><input type="checkbox" id="rrCI" style="accent-color:var(--accent)"/> Case insensitive</label>' +
      '<label style="font-size:.85rem"><input type="checkbox" id="rrExt" style="accent-color:var(--accent)"/> Include extension</label>' +
      '<label style="font-size:.85rem">Prefix: <input class="tool-inp" id="rrPrefix" placeholder="" style="width:100px;padding:4px 8px;font-size:.85rem"/></label>' +
      '<label style="font-size:.85rem">Suffix: <input class="tool-inp" id="rrSuffix" placeholder="" style="width:100px;padding:4px 8px;font-size:.85rem"/></label>' +
      '<button class="tool-btn sec" id="rrLower" style="font-size:.8rem">lowercase</button>' +
      '<button class="tool-btn sec" id="rrUpper" style="font-size:.8rem">UPPERCASE</button>' +
      '<button class="tool-btn sec" id="rrClear"><i class="fas fa-trash"></i> Clear</button></div></div>' +
      '<div id="rrPreview" style="max-height:400px;overflow-y:auto;margin-bottom:16px"></div>' +
      '<div id="rrActions" style="display:none;display:flex;gap:8px">' +
      '<button class="tool-btn" id="rrDl"><i class="fas fa-download"></i> Download Renamed ZIP</button>' +
      '<button class="tool-btn sec" id="rrCp"><i class="fas fa-copy"></i> Copy List</button></div>';

    var fI = C.querySelector('#rrFile');
    var zone = C.querySelector('#rrZone');
    zone.addEventListener('click', function() { fI.click(); });
    zone.addEventListener('dragover', function(e) { e.preventDefault(); zone.style.borderColor = 'var(--accent)'; });
    zone.addEventListener('dragleave', function() { zone.style.borderColor = ''; });
    zone.addEventListener('drop', function(e) {
      e.preventDefault(); zone.style.borderColor = '';
      files = Array.from(e.dataTransfer.files);
      C.querySelector('#rrCtrl').style.display = 'block';
      C.querySelector('#rrActions').style.display = 'flex';
      preview();
    });
    fI.addEventListener('change', function(e) {
      files = Array.from(e.target.files);
      C.querySelector('#rrCtrl').style.display = 'block';
      C.querySelector('#rrActions').style.display = 'flex';
      preview();
    });

    var lowerOn = false, upperOn = false;
    C.querySelector('#rrLower').addEventListener('click', function() { lowerOn = !lowerOn; upperOn = false; this.style.background = lowerOn ? 'var(--accent)' : ''; preview(); });
    C.querySelector('#rrUpper').addEventListener('click', function() { upperOn = !upperOn; lowerOn = false; this.style.background = upperOn ? 'var(--accent)' : ''; preview(); });
    ['rrFind', 'rrRepl', 'rrPrefix', 'rrSuffix'].forEach(function(id) { C.querySelector('#' + id).addEventListener('input', preview); });
    ['rrCI', 'rrExt'].forEach(function(id) { C.querySelector('#' + id).addEventListener('change', preview); });

    function getNames() {
      var findStr = C.querySelector('#rrFind').value;
      var replStr = C.querySelector('#rrRepl').value;
      var ci = C.querySelector('#rrCI').checked;
      var incExt = C.querySelector('#rrExt').checked;
      var prefix = C.querySelector('#rrPrefix').value;
      var suffix = C.querySelector('#rrSuffix').value;
      var regex = null;
      if (findStr) { try { regex = new RegExp(findStr, ci ? 'gi' : 'g'); } catch (e) {} }
      var counter = 0;
      return files.map(function(f) {
        counter++;
        var name = f.name, base = name, ext = '';
        var dot = name.lastIndexOf('.');
        if (dot > 0) { base = name.substring(0, dot); ext = name.substring(dot); }
        var target = incExt ? name : base;
        if (regex) target = target.replace(regex, replStr);
        if (lowerOn) target = target.toLowerCase();
        if (upperOn) target = target.toUpperCase();
        var num = String(counter).padStart(3, '0');
        var newName = prefix.replace(/#/g, num) + target + suffix.replace(/#/g, num) + (incExt ? '' : ext);
        return { orig: f.name, name: newName, ok: newName.length > 0 && newName.length < 255 };
      });
    }

    function preview() {
      var names = getNames();
      var conflicts = {};
      names.forEach(function(n) { conflicts[n.name] = (conflicts[n.name] || 0) + 1; });
      var h = '<table style="width:100%;border-collapse:collapse;font-size:.85rem">';
      h += '<thead><tr style="border-bottom:2px solid var(--border)">' +
        '<th style="padding:6px 8px;text-align:left;color:var(--text-muted)">#</th>' +
        '<th style="padding:6px 8px;text-align:left;color:var(--text-muted)">Original</th>' +
        '<th style="padding:6px 8px;text-align:center"><i class="fas fa-arrow-right" style="color:var(--text-muted)"></i></th>' +
        '<th style="padding:6px 8px;text-align:left;color:var(--text-muted)">New Name</th></tr></thead><tbody>';
      names.forEach(function(n, i) {
        var changed = n.orig !== n.name;
        var conflict = conflicts[n.name] > 1;
        var bg = conflict ? 'rgba(239,68,68,0.05)' : changed ? 'rgba(99,102,241,0.05)' : '';
        h += '<tr style="border-bottom:1px solid var(--border);background:' + bg + '">' +
          '<td style="padding:5px 8px;color:var(--text-muted)">' + (i + 1) + '</td>' +
          '<td style="padding:5px 8px;font-family:var(--font-mono);font-size:.78rem">' + n.orig + '</td>' +
          '<td style="padding:5px 8px;text-align:center;color:' + (changed ? 'var(--accent)' : 'var(--text-muted)') + '">' + (changed ? '→' : '=') + '</td>' +
          '<td style="padding:5px 8px;font-family:var(--font-mono);font-size:.78rem;color:' + (conflict ? 'var(--red)' : changed ? 'var(--accent)' : '') + '">' + n.name + (conflict ? ' <span style="color:var(--red);font-size:.7rem">⚠</span>' : '') + '</td></tr>';
      });
      h += '</tbody></table>';
      C.querySelector('#rrPreview').innerHTML = h;
    }

    C.querySelector('#rrDl').addEventListener('click', function() {
      if (!files.length) return;
      loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js').then(function() {
        var zip = new JSZip();
        var names = getNames();
        var done = 0;
        function next() {
          if (done >= files.length) {
            zip.generateAsync({ type: 'blob' }).then(function(b) { downloadBlob(b, 'renamed-files.zip'); });
            return;
          }
          var reader = new FileReader();
          reader.onload = function(e) { zip.file(names[done].name, e.target.result); done++; setTimeout(next, 5); };
          reader.readAsArrayBuffer(files[done]);
        }
        next();
      });
    });

    C.querySelector('#rrCp').addEventListener('click', function() {
      var text = getNames().map(function(n) { return n.orig + ' → ' + n.name; }).join('\n');
      navigator.clipboard.writeText(text);
      this.innerHTML = '<i class="fas fa-check"></i> Copied';
      var btn = this;
      setTimeout(function() { btn.innerHTML = '<i class="fas fa-copy"></i> Copy List'; }, 2000);
    });

    C.querySelector('#rrClear').addEventListener('click', function() {
      files = [];
      C.querySelector('#rrPreview').innerHTML = '';
      C.querySelector('#rrCtrl').style.display = 'none';
      C.querySelector('#rrActions').style.display = 'none';
    });
  };

  /* ==========================================
     51. Browser-Based Audio Metadata Editor
     ========================================== */
  AIO.audioMetadata = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    var audioFiles = [];

    C.innerHTML =
      '<div class="tool-sec"><label>Upload Audio Files</label>' +
      '<div class="file-zone" id="amZone"><i class="fas fa-music"></i>' +
      '<p>Upload WAV or MP3 files</p><p class="sm">Read and edit metadata — processed locally</p>' +
      '<input type="file" id="amFile" accept="audio/*" multiple/></div></div>' +
      '<div id="amResults" style="margin-top:16px"></div>';

    var fI = C.querySelector('#amFile');
    var zone = C.querySelector('#amZone');
    zone.addEventListener('click', function() { fI.click(); });
    zone.addEventListener('dragover', function(e) { e.preventDefault(); zone.style.borderColor = 'var(--accent)'; });
    zone.addEventListener('dragleave', function() { zone.style.borderColor = ''; });
    zone.addEventListener('drop', function(e) {
      e.preventDefault(); zone.style.borderColor = '';
      audioFiles = Array.from(e.dataTransfer.files).filter(function(f) { return /\.(wav|mp3|ogg|flac|m4a|aac)$/i.test(f.name); });
      analyze();
    });
    fI.addEventListener('change', function(e) {
      audioFiles = Array.from(e.target.files);
      analyze();
    });

    function readWAV(buf) {
      var v = new DataView(buf);
      if (v.byteLength < 44) return null;
      var riff = '';
      for (var i = 0; i < 4; i++) riff += String.fromCharCode(v.getUint8(i));
      if (riff !== 'RIFF') return null;
      var wave = '';
      for (var j = 8; j < 12; j++) wave += String.fromCharCode(v.getUint8(j));
      if (wave !== 'WAVE') return null;
      return {
        format: 'WAV',
        channels: v.getUint16(22, true),
        sampleRate: v.getUint32(24, true),
        byteRate: v.getUint32(28, true),
        bitsPerSample: v.getUint16(34, true),
        dataSize: v.getUint32(40, true),
        duration: v.getUint32(40, true) / Math.max(1, v.getUint32(28, true))
      };
    }

    function readID3v1(buf) {
      var v = new DataView(buf);
      if (v.byteLength < 128) return null;
      var off = v.byteLength - 128;
      var tag = '';
      for (var i = 0; i < 3; i++) tag += String.fromCharCode(v.getUint8(off + i));
      if (tag !== 'TAG') return null;
      function readStr(start, len) {
        var s = '';
        for (var i = 0; i < len; i++) {
          var c = v.getUint8(off + start + i);
          if (c === 0) break;
          s += String.fromCharCode(c);
        }
        return s.trim();
      }
      return {
        format: 'MP3 (ID3v1)',
        title: readStr(3, 30),
        artist: readStr(33, 30),
        album: readStr(63, 30),
        year: readStr(93, 4),
        comment: readStr(97, 28),
        genre: v.getUint8(off + 127)
      };
    }

    function analyze() {
      var container = C.querySelector('#amResults');
      if (!audioFiles.length) { container.innerHTML = ''; return; }
      container.innerHTML = '<p style="color:var(--text-muted);font-size:.85rem">Analyzing ' + audioFiles.length + ' file(s)...</p>';

      var results = [];
      var done = 0;
      audioFiles.forEach(function(file, idx) {
        var reader = new FileReader();
        reader.onload = function(e) {
          var buf = e.target.result;
          var meta = readWAV(buf) || readID3v1(buf) || { format: file.type || 'Unknown' };
          meta.name = file.name;
          meta.size = file.size;
          meta.fileIdx = idx;
          results[idx] = meta;
          done++;
          if (done >= audioFiles.length) renderResults(results);
        };
        reader.readAsArrayBuffer(file);
      });
    }

    function renderResults(results) {
      var container = C.querySelector('#amResults');
      var h = '<h3 style="margin-bottom:12px">Audio Metadata Report</h3>';
      results.forEach(function(r, idx) {
        h += '<div style="padding:16px;margin-bottom:12px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border:1px solid var(--border)">';
        h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
          '<span style="font-weight:600"><i class="fas fa-music" style="color:var(--accent);margin-right:6px"></i>' + r.name + '</span>' +
          '<span style="font-size:.8rem;color:var(--text-muted)">' + formatBytes(r.size) + '</span></div>';
        h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px">';
        if (r.format) h += '<div><p style="font-size:.7rem;color:var(--text-muted)">Format</p><p style="font-size:.85rem;font-weight:500">' + r.format + '</p></div>';
        if (r.sampleRate) h += '<div><p style="font-size:.7rem;color:var(--text-muted)">Sample Rate</p><p style="font-size:.85rem;font-weight:500">' + r.sampleRate + ' Hz</p></div>';
        if (r.channels) h += '<div><p style="font-size:.7rem;color:var(--text-muted)">Channels</p><p style="font-size:.85rem;font-weight:500">' + r.channels + '</p></div>';
        if (r.bitsPerSample) h += '<div><p style="font-size:.7rem;color:var(--text-muted)">Bit Depth</p><p style="font-size:.85rem;font-weight:500">' + r.bitsPerSample + ' bit</p></div>';
        if (r.duration) h += '<div><p style="font-size:.7rem;color:var(--text-muted)">Duration</p><p style="font-size:.85rem;font-weight:500">' + Math.round(r.duration) + 's</p></div>';
        if (r.title) h += '<div><p style="font-size:.7rem;color:var(--text-muted)">Title</p><p style="font-size:.85rem;font-weight:500">' + r.title + '</p></div>';
        if (r.artist) h += '<div><p style="font-size:.7rem;color:var(--text-muted)">Artist</p><p style="font-size:.85rem;font-weight:500">' + r.artist + '</p></div>';
        if (r.album) h += '<div><p style="font-size:.7rem;color:var(--text-muted)">Album</p><p style="font-size:.85rem;font-weight:500">' + r.album + '</p></div>';
        if (r.year) h += '<div><p style="font-size:.7rem;color:var(--text-muted)">Year</p><p style="font-size:.85rem;font-weight:500">' + r.year + '</p></div>';
        h += '</div>';
        h += '</div>';
      });

      // Batch rename section
      h += '<div class="tool-sec" style="margin-top:12px"><label>Batch Rename by Pattern</label>' +
        '<p style="font-size:.8rem;color:var(--text-muted);margin-bottom:8px">Use: {title}, {artist}, {album}, {year}, {index}</p>' +
        '<input class="tool-inp" id="amPattern" value="{artist} - {title}" placeholder="{artist} - {title}"/>' +
        '<button class="tool-btn" id="amRename" style="margin-top:8px"><i class="fas fa-download"></i> Download Renamed ZIP</button></div>';

      container.innerHTML = h;

      C.querySelector('#amRename').addEventListener('click', function() {
        loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js').then(function() {
          var zip = new JSZip();
          var pattern = C.querySelector('#amPattern').value;
          var done = 0;
          function next() {
            if (done >= audioFiles.length) {
              zip.generateAsync({ type: 'blob' }).then(function(b) { downloadBlob(b, 'tagged-audio.zip'); });
              return;
            }
            var r = results[done];
            var name = pattern
              .replace(/\{title\}/g, r.title || 'Unknown')
              .replace(/\{artist\}/g, r.artist || 'Unknown')
              .replace(/\{album\}/g, r.album || 'Unknown')
              .replace(/\{year\}/g, r.year || '')
              .replace(/\{index\}/g, String(done + 1).padStart(3, '0'));
            var ext = audioFiles[done].name.substring(audioFiles[done].name.lastIndexOf('.'));
            var reader = new FileReader();
            reader.onload = function(e) { zip.file(name + ext, e.target.result); done++; setTimeout(next, 5); };
            reader.readAsArrayBuffer(audioFiles[done]);
          }
          next();
        });
      });
    }
  };

  /* ==========================================
     52. Bulk Image Converter & Compressor
     ========================================== */
  AIO.imageConverter = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    var images = [];

    C.innerHTML =
      '<div class="tool-sec"><label>Upload Images</label>' +
      '<div class="file-zone" id="icZone"><i class="fas fa-file-image"></i>' +
      '<p>Upload PNG, JPG, WebP, GIF, BMP images</p><p class="sm">Convert format, compress, resize — all client-side</p>' +
      '<input type="file" id="icFile" accept="image/*" multiple/></div></div>' +
      '<div class="tool-sec" id="icCtrl" style="display:none">' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:12px">' +
      '<div><label>Output Format</label>' +
      '<select class="tool-inp" id="icFmt"><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select></div>' +
      '<div><label>Quality: <span id="icQv">85</span>%</label>' +
      '<input type="range" id="icQ" min="5" max="100" value="85" style="width:100%;accent-color:var(--accent)"/></div>' +
      '<div><label>Max Width (px)</label>' +
      '<input type="number" class="tool-inp" id="icW" placeholder="Original" style="max-width:150px"/></div>' +
      '<div><label>Max Height (px)</label>' +
      '<input type="number" class="tool-inp" id="icH" placeholder="Original" style="max-width:150px"/></div></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      '<button class="tool-btn" id="icConvert"><i class="fas fa-sync-alt"></i> Convert & Download ZIP</button>' +
      '<button class="tool-btn sec" id="icClear"><i class="fas fa-trash"></i> Clear</button>' +
      '<span id="icCount" style="font-size:.85rem;color:var(--text-muted);align-self:center"></span></div></div>' +
      '<div id="icPreview" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:12px"></div>' +
      '<div id="icProg" style="display:none;margin-top:12px">' +
      '<div style="height:4px;background:var(--bg-input);border-radius:var(--radius-full);overflow:hidden;margin-bottom:8px">' +
      '<div id="icBar" style="height:100%;width:0;background:var(--accent);transition:width .2s"></div></div>' +
      '<p id="icStat" style="font-size:.85rem;color:var(--text-muted)"></p></div>';

    var fI = C.querySelector('#icFile');
    var zone = C.querySelector('#icZone');
    zone.addEventListener('click', function() { fI.click(); });
    zone.addEventListener('dragover', function(e) { e.preventDefault(); zone.style.borderColor = 'var(--accent)'; });
    zone.addEventListener('dragleave', function() { zone.style.borderColor = ''; });
    zone.addEventListener('drop', function(e) {
      e.preventDefault(); zone.style.borderColor = '';
      addImages(Array.from(e.dataTransfer.files).filter(function(f) { return f.type.startsWith('image/'); }));
    });
    fI.addEventListener('change', function(e) { addImages(Array.from(e.target.files)); });
    C.querySelector('#icQ').addEventListener('input', function() { C.querySelector('#icQv').textContent = this.value; });

    function addImages(files) {
      var pending = files.length;
      if (!pending) return;
      files.forEach(function(file) {
        var reader = new FileReader();
        reader.onload = function(e) {
          var img = new Image();
          img.onload = function() {
            images.push({ file: file, img: img, name: file.name, origSize: file.size });
            pending--;
            if (pending === 0) { showPreview(); C.querySelector('#icCtrl').style.display = 'block'; }
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    function showPreview() {
      var grid = C.querySelector('#icPreview');
      grid.innerHTML = '';
      C.querySelector('#icCount').textContent = images.length + ' image(s) — ' + formatBytes(images.reduce(function(s, i) { return s + i.origSize; }, 0)) + ' total';
      images.forEach(function(item) {
        var div = document.createElement('div');
        div.style.cssText = 'background:var(--bg-tertiary);border-radius:var(--radius-sm);border:1px solid var(--border);overflow:hidden;text-align:center';
        var cnv = document.createElement('canvas');
        cnv.width = 150; cnv.height = 100;
        cnv.style.cssText = 'width:100%;height:80px;display:block';
        var ctx = cnv.getContext('2d');
        var scale = Math.min(150 / item.img.naturalWidth, 100 / item.img.naturalHeight);
        var w = item.img.naturalWidth * scale, h = item.img.naturalHeight * scale;
        ctx.drawImage(item.img, (150 - w) / 2, (100 - h) / 2, w, h);
        div.appendChild(cnv);
        var info = document.createElement('div');
        info.style.cssText = 'padding:6px';
        info.innerHTML = '<p style="font-size:.7rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + item.name + '</p>' +
          '<p style="font-size:.7rem">' + item.img.naturalWidth + 'x' + item.img.naturalHeight + ' <span style="color:var(--text-muted)">' + formatBytes(item.origSize) + '</span></p>';
        div.appendChild(info);
        grid.appendChild(div);
      });
    }

    C.querySelector('#icConvert').addEventListener('click', function() {
      if (!images.length) return;
      loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js').then(function() {
        var zip = new JSZip();
        var fmt = C.querySelector('#icFmt').value;
        var q = parseInt(C.querySelector('#icQ').value) / 100;
        var maxW = parseInt(C.querySelector('#icW').value) || 0;
        var maxH = parseInt(C.querySelector('#icH').value) || 0;
        var ext = fmt === 'image/png' ? '.png' : fmt === 'image/webp' ? '.webp' : '.jpg';
        var prog = C.querySelector('#icProg'), bar = C.querySelector('#icBar'), stat = C.querySelector('#icStat');
        prog.style.display = 'block';
        var done = 0;
        function next() {
          if (done >= images.length) {
            stat.textContent = 'Creating ZIP...';
            zip.generateAsync({ type: 'blob' }).then(function(b) { downloadBlob(b, 'converted-images.zip'); stat.textContent = 'Done!'; });
            return;
          }
          var item = images[done];
          var w = item.img.naturalWidth, h = item.img.naturalHeight;
          if (maxW && w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
          if (maxH && h > maxH) { w = Math.round(w * maxH / h); h = maxH; }
          var cnv = document.createElement('canvas');
          cnv.width = w; cnv.height = h;
          cnv.getContext('2d').drawImage(item.img, 0, 0, w, h);
          cnv.toBlob(function(b) {
            zip.file(item.name.replace(/\.[^.]+$/, '') + ext, b);
            done++; bar.style.width = Math.round(done / images.length * 100) + '%';
            stat.textContent = 'Converting ' + done + '/' + images.length;
            setTimeout(next, 5);
          }, fmt, q);
        }
        next();
      });
    });

    C.querySelector('#icClear').addEventListener('click', function() {
      images = [];
      C.querySelector('#icPreview').innerHTML = '';
      C.querySelector('#icCtrl').style.display = 'none';
    });
  };

  /* ==========================================
     53. Multi-File Code Validator & Formatter
     ========================================== */
  AIO.codeValidator = function(el) {
    var C = document.getElementById(el);
    if (!C) return;

    C.innerHTML =
      '<div class="tool-sec"><label>Upload Code Files</label>' +
      '<div class="file-zone" id="cvZone"><i class="fas fa-code"></i>' +
      '<p>Upload .json, .css, .html, .js, .csv files</p><p class="sm">Validate syntax, auto-format, get error reports</p>' +
      '<input type="file" id="cvFile" accept=".json,.css,.html,.htm,.js,.csv,.xml,.svg" multiple/></div></div>' +
      '<div class="tool-sec"><label>Or Paste Code Directly</label>' +
      '<select class="tool-inp" id="cvType" style="max-width:200px;margin-bottom:8px">' +
      '<option value="json">JSON</option><option value="css">CSS</option><option value="html">HTML</option>' +
      '<option value="js">JavaScript</option><option value="csv">CSV</option></select>' +
      '<textarea class="tool-inp" id="cvText" rows="8" placeholder="Paste your code here..."></textarea>' +
      '<button class="tool-btn" id="cvTextBtn" style="margin-top:8px"><i class="fas fa-check-double"></i> Validate & Format</button></div>' +
      '<div id="cvResults" style="margin-top:16px"></div>';

    var fI = C.querySelector('#cvFile');
    var zone = C.querySelector('#cvZone');
    zone.addEventListener('click', function() { fI.click(); });
    zone.addEventListener('dragover', function(e) { e.preventDefault(); zone.style.borderColor = 'var(--accent)'; });
    zone.addEventListener('dragleave', function() { zone.style.borderColor = ''; });
    zone.addEventListener('drop', function(e) {
      e.preventDefault(); zone.style.borderColor = '';
      processFiles(Array.from(e.dataTransfer.files));
    });
    fI.addEventListener('change', function(e) { processFiles(Array.from(e.target.files)); });

    C.querySelector('#cvTextBtn').addEventListener('click', function() {
      var code = C.querySelector('#cvText').value;
      var type = C.querySelector('#cvType').value;
      if (!code.trim()) return;
      var result = validateCode(code, type, 'pasted-code.' + type);
      showResults([result]);
    });

    function detectType(name) {
      if (/\.json$/i.test(name)) return 'json';
      if (/\.css$/i.test(name)) return 'css';
      if (/\.html?$/i.test(name)) return 'html';
      if (/\.js$/i.test(name)) return 'js';
      if (/\.csv$/i.test(name)) return 'csv';
      if (/\.xml$/i.test(name)) return 'xml';
      if (/\.svg$/i.test(name)) return 'html';
      return 'text';
    }

    function processFiles(files) {
      var results = [];
      var done = 0;
      if (!files.length) return;
      files.forEach(function(file) {
        var reader = new FileReader();
        reader.onload = function(e) {
          var type = detectType(file.name);
          results.push(validateCode(e.target.result, type, file.name));
          done++;
          if (done >= files.length) showResults(results);
        };
        reader.readAsText(file);
      });
    }

    function validateCode(code, type, name) {
      var errors = [];
      var formatted = code;
      var valid = true;

      if (type === 'json') {
        try {
          var obj = JSON.parse(code);
          formatted = JSON.stringify(obj, null, 2);
        } catch (e) {
          valid = false;
          var match = e.message.match(/position (\d+)/);
          var pos = match ? parseInt(match[1]) : -1;
          var line = pos >= 0 ? code.substring(0, pos).split('\n').length : -1;
          errors.push({ line: line, msg: e.message });
        }
      } else if (type === 'css') {
        var open = (code.match(/{/g) || []).length;
        var close = (code.match(/}/g) || []).length;
        if (open !== close) {
          valid = false;
          errors.push({ line: -1, msg: 'Mismatched braces: ' + open + ' opening vs ' + close + ' closing' });
        }
        // Basic formatting
        formatted = code.replace(/\s*{\s*/g, ' {\n  ').replace(/\s*}\s*/g, '\n}\n').replace(/;\s*/g, ';\n  ');
      } else if (type === 'html') {
        try {
          var parser = new DOMParser();
          var doc = parser.parseFromString(code, 'text/html');
          var parserErrors = doc.querySelectorAll('parsererror');
          if (parserErrors.length) {
            valid = false;
            parserErrors.forEach(function(pe) { errors.push({ line: -1, msg: pe.textContent.substring(0, 100) }); });
          }
          // Check for unclosed tags
          var openTags = (code.match(/<[a-zA-Z][^/>]*>/g) || []).length;
          var closeTags = (code.match(/<\/[a-zA-Z]+>/g) || []).length;
          var selfClose = (code.match(/<[a-zA-Z][^/>]*\/>/g) || []).length;
          if (Math.abs(openTags - selfClose - closeTags) > 3) {
            errors.push({ line: -1, msg: 'Possible unclosed tags: ' + openTags + ' open, ' + closeTags + ' close, ' + selfClose + ' self-closing' });
          }
        } catch (e) {
          valid = false;
          errors.push({ line: -1, msg: 'Parse error: ' + e.message });
        }
      } else if (type === 'js') {
        try {
          new Function(code);
        } catch (e) {
          valid = false;
          var lineMatch = e.message.match(/line (\d+)/i) || e.stack && e.stack.match(/:(\d+):\d+/);
          errors.push({ line: lineMatch ? parseInt(lineMatch[1]) : -1, msg: e.message });
        }
      } else if (type === 'csv') {
        var lines = code.split('\n').filter(function(l) { return l.trim(); });
        if (lines.length > 0) {
          var cols = lines[0].split(',').length;
          lines.forEach(function(line, i) {
            var c = line.split(',').length;
            if (c !== cols) {
              errors.push({ line: i + 1, msg: 'Expected ' + cols + ' columns, found ' + c });
              valid = false;
            }
          });
        }
      }

      var lineCount = code.split('\n').length;
      var charCount = code.length;
      return { name: name, type: type, valid: valid, errors: errors, formatted: formatted, lines: lineCount, chars: charCount };
    }

    function showResults(results) {
      var container = C.querySelector('#cvResults');
      var validCount = results.filter(function(r) { return r.valid; }).length;
      var errorCount = results.filter(function(r) { return !r.valid; }).length;

      var h = '<div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">';
      h += '<span class="chip"><i class="fas fa-file-code"></i> ' + results.length + ' file(s)</span>';
      h += '<span class="chip ' + (validCount ? 'badge-g' : '') + '"><i class="fas fa-check"></i> ' + validCount + ' valid</span>';
      h += '<span class="chip ' + (errorCount ? 'badge-r' : '') + '"><i class="fas fa-times"></i> ' + errorCount + ' error(s)</span>';
      h += '</div>';

      results.forEach(function(r) {
        var borderColor = r.valid ? 'var(--green)' : 'var(--red)';
        h += '<div style="padding:16px;margin-bottom:12px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border-left:3px solid ' + borderColor + '">';
        h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
          '<span style="font-weight:600"><i class="fas fa-' + (r.valid ? 'check-circle' : 'exclamation-circle') + '" style="color:' + borderColor + ';margin-right:6px"></i>' + r.name + '</span>' +
          '<span style="font-size:.8rem;color:var(--text-muted)">' + r.type.toUpperCase() + ' | ' + r.lines + ' lines | ' + formatBytes(r.chars) + '</span></div>';

        if (r.errors.length) {
          r.errors.forEach(function(e) {
            h += '<div style="padding:6px 10px;margin-bottom:4px;background:rgba(239,68,68,0.05);border-radius:var(--radius-sm);font-size:.85rem;color:var(--red)">' +
              (e.line > 0 ? '<strong>Line ' + e.line + ':</strong> ' : '') + e.msg + '</div>';
          });
        } else {
          h += '<p style="color:var(--green);font-size:.85rem">No errors found.</p>';
        }

        if (r.valid && r.formatted !== undefined) {
          h += '<details style="margin-top:8px"><summary style="cursor:pointer;font-size:.85rem;color:var(--accent)">View Formatted Output</summary>' +
            '<pre style="margin-top:8px;padding:12px;background:var(--bg);border-radius:var(--radius-sm);font-family:var(--font-mono);font-size:.78rem;max-height:300px;overflow:auto;white-space:pre-wrap;word-break:break-all">' +
            r.formatted.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>' +
            '<button class="tool-btn sec" style="margin-top:6px;font-size:.8rem" onclick="navigator.clipboard.writeText(decodeURIComponent(\'' + encodeURIComponent(r.formatted) + '\'))"><i class="fas fa-copy"></i> Copy</button></details>';
        }
        h += '</div>';
      });

      if (results.length > 1) {
        h += '<button class="tool-btn" id="cvDlAll"><i class="fas fa-download"></i> Download All Formatted ZIP</button>';
      }

      container.innerHTML = h;

      var dlBtn = container.querySelector('#cvDlAll');
      if (dlBtn) {
        dlBtn.addEventListener('click', function() {
          loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js').then(function() {
            var zip = new JSZip();
            results.forEach(function(r) {
              if (r.valid) zip.file(r.name, r.formatted);
            });
            zip.generateAsync({ type: 'blob' }).then(function(b) { downloadBlob(b, 'formatted-code.zip'); });
          });
        });
      }
    }
  };

  /* ==========================================
     54. Bulk Image Watermarker
     ========================================== */
  AIO.bulkWatermarker = function(el) {
    var C = document.getElementById(el);
    if (!C) return;
    var images = [];

    C.innerHTML =
      '<div class="tool-sec"><label>Upload Images</label>' +
      '<div class="file-zone" id="bwZone"><i class="fas fa-stamp"></i>' +
      '<p>Upload images to watermark</p><p class="sm">JPG, PNG, WebP — all processing is local</p>' +
      '<input type="file" id="bwFile" accept="image/*" multiple/></div></div>' +
      '<div class="tool-sec" id="bwCtrl" style="display:none">' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:16px">' +
      '<div><label>Watermark Text</label><input class="tool-inp" id="bwText" value="© My Brand" placeholder="Your watermark"/></div>' +
      '<div><label>Font Size</label><input type="number" class="tool-inp" id="bwSize" value="24" min="8" max="200"/></div>' +
      '<div><label>Opacity: <span id="bwOv">40</span>%</label>' +
      '<input type="range" id="bwOp" min="5" max="100" value="40" style="width:100%;accent-color:var(--accent)"/></div>' +
      '<div><label>Rotation (°)</label><input type="number" class="tool-inp" id="bwRot" value="-30" min="-180" max="180"/></div>' +
      '<div><label>Position</label>' +
      '<select class="tool-inp" id="bwPos"><option value="center">Center</option><option value="tile">Tile</option>' +
      '<option value="bottom-right" selected>Bottom Right</option><option value="bottom-left">Bottom Left</option>' +
      '<option value="top-right">Top Right</option><option value="top-left">Top Left</option></select></div>' +
      '<div><label>Color</label><input type="color" id="bwColor" value="#ffffff" style="width:100%;height:38px;border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer"/></div></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">' +
      '<button class="tool-btn" id="bwPreview"><i class="fas fa-eye"></i> Preview</button>' +
      '<button class="tool-btn" id="bwApply"><i class="fas fa-download"></i> Watermark & Download ZIP</button>' +
      '<button class="tool-btn sec" id="bwClear"><i class="fas fa-trash"></i> Clear</button>' +
      '<span id="bwCount" style="font-size:.85rem;color:var(--text-muted);align-self:center"></span></div></div>' +
      '<div id="bwPrev" style="margin-top:12px;text-align:center"></div>' +
      '<div id="bwProg" style="display:none;margin-top:12px">' +
      '<div style="height:4px;background:var(--bg-input);border-radius:var(--radius-full);overflow:hidden;margin-bottom:8px">' +
      '<div id="bwBar" style="height:100%;width:0;background:var(--accent);transition:width .2s"></div></div>' +
      '<p id="bwStat" style="font-size:.85rem;color:var(--text-muted)"></p></div>';

    var fI = C.querySelector('#bwFile');
    var zone = C.querySelector('#bwZone');
    zone.addEventListener('click', function() { fI.click(); });
    zone.addEventListener('dragover', function(e) { e.preventDefault(); zone.style.borderColor = 'var(--accent)'; });
    zone.addEventListener('dragleave', function() { zone.style.borderColor = ''; });
    zone.addEventListener('drop', function(e) {
      e.preventDefault(); zone.style.borderColor = '';
      addImages(Array.from(e.dataTransfer.files).filter(function(f) { return f.type.startsWith('image/'); }));
    });
    fI.addEventListener('change', function(e) { addImages(Array.from(e.target.files)); });
    C.querySelector('#bwOp').addEventListener('input', function() { C.querySelector('#bwOv').textContent = this.value; });

    function addImages(files) {
      var pending = files.length;
      if (!pending) return;
      files.forEach(function(file) {
        var reader = new FileReader();
        reader.onload = function(e) {
          var img = new Image();
          img.onload = function() {
            images.push({ file: file, img: img, name: file.name });
            pending--;
            if (pending === 0) { C.querySelector('#bwCtrl').style.display = 'block'; C.querySelector('#bwCount').textContent = images.length + ' image(s)'; }
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    function applyWatermark(img, cnv) {
      cnv.width = img.naturalWidth;
      cnv.height = img.naturalHeight;
      var ctx = cnv.getContext('2d');
      ctx.drawImage(img, 0, 0);
      var text = C.querySelector('#bwText').value || 'Watermark';
      var size = parseInt(C.querySelector('#bwSize').value) || 24;
      var opacity = parseInt(C.querySelector('#bwOp').value) / 100;
      var rotation = parseInt(C.querySelector('#bwRot').value) || 0;
      var pos = C.querySelector('#bwPos').value;
      var color = C.querySelector('#bwColor').value;
      ctx.globalAlpha = opacity;
      ctx.fillStyle = color;
      ctx.font = 'bold ' + size + 'px Arial, sans-serif';
      ctx.textBaseline = 'middle';
      if (pos === 'tile') {
        var stepX = ctx.measureText(text).width + 100;
        var stepY = size * 4;
        for (var y = -cnv.height; y < cnv.height * 2; y += stepY) {
          for (var x = -cnv.width; x < cnv.width * 2; x += stepX) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation * Math.PI / 180);
            ctx.fillText(text, 0, 0);
            ctx.restore();
          }
        }
      } else {
        var px, py;
        var pad = size;
        if (pos === 'center') { px = cnv.width / 2; py = cnv.height / 2; }
        else if (pos === 'bottom-right') { px = cnv.width - pad; py = cnv.height - pad; ctx.textAlign = 'right'; }
        else if (pos === 'bottom-left') { px = pad; py = cnv.height - pad; ctx.textAlign = 'left'; }
        else if (pos === 'top-right') { px = cnv.width - pad; py = pad; ctx.textAlign = 'right'; }
        else { px = pad; py = pad; ctx.textAlign = 'left'; }
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.fillText(text, 0, 0);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    C.querySelector('#bwPreview').addEventListener('click', function() {
      if (!images.length) return;
      var item = images[0];
      var cnv = document.createElement('canvas');
      applyWatermark(item.img, cnv);
      cnv.style.cssText = 'max-width:100%;max-height:400px;border-radius:var(--radius-sm);border:1px solid var(--border)';
      var prev = C.querySelector('#bwPrev');
      prev.innerHTML = '<p style="font-size:.85rem;color:var(--text-muted);margin-bottom:8px">Preview: ' + item.name + '</p>';
      prev.appendChild(cnv);
    });

    C.querySelector('#bwApply').addEventListener('click', function() {
      if (!images.length) return;
      loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js').then(function() {
        var zip = new JSZip();
        var prog = C.querySelector('#bwProg'), bar = C.querySelector('#bwBar'), stat = C.querySelector('#bwStat');
        prog.style.display = 'block';
        var done = 0;
        function next() {
          if (done >= images.length) {
            stat.textContent = 'Creating ZIP...';
            zip.generateAsync({ type: 'blob' }).then(function(b) { downloadBlob(b, 'watermarked-images.zip'); stat.textContent = 'Done!'; });
            return;
          }
          var item = images[done];
          var cnv = document.createElement('canvas');
          applyWatermark(item.img, cnv);
          cnv.toBlob(function(b) {
            zip.file(item.name, b);
            done++; bar.style.width = Math.round(done / images.length * 100) + '%';
            stat.textContent = 'Watermarking ' + done + '/' + images.length;
            setTimeout(next, 10);
          }, 'image/jpeg', 0.92);
        }
        next();
      });
    });

    C.querySelector('#bwClear').addEventListener('click', function() {
      images = [];
      C.querySelector('#bwPrev').innerHTML = '';
      C.querySelector('#bwCtrl').style.display = 'none';
    });
  };

  /* ==========================================
     55. Perceptual Duplicate Image Finder
     ========================================== */
  AIO.duplicateFinder = function(el) {
    var C = document.getElementById(el);
    if (!C) return;

    C.innerHTML =
      '<div class="tool-sec"><label>Upload Images</label>' +
      '<div class="file-zone" id="dfZone"><i class="fas fa-clone"></i>' +
      '<p>Upload images to find duplicates</p><p class="sm">Uses perceptual hashing — visually similar images are grouped</p>' +
      '<input type="file" id="dfFile" accept="image/*" multiple/></div></div>' +
      '<div class="tool-sec" id="dfCtrl" style="display:none">' +
      '<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">' +
      '<label style="font-size:.85rem">Sensitivity: <span id="dfSv">10</span> bits</label>' +
      '<input type="range" id="dfSens" min="3" max="25" value="10" style="width:150px;accent-color:var(--accent)"/>' +
      '<button class="tool-btn" id="dfScan"><i class="fas fa-search"></i> Scan for Duplicates</button>' +
      '<button class="tool-btn sec" id="dfClear"><i class="fas fa-trash"></i> Clear</button>' +
      '<span id="dfCount" style="font-size:.85rem;color:var(--text-muted)"></span></div></div>' +
      '<div id="dfProg" style="display:none;margin:12px 0">' +
      '<div style="height:4px;background:var(--bg-input);border-radius:var(--radius-full);overflow:hidden;margin-bottom:8px">' +
      '<div id="dfBar" style="height:100%;width:0;background:var(--accent);transition:width .2s"></div></div>' +
      '<p id="dfStat" style="font-size:.85rem;color:var(--text-muted)"></p></div>' +
      '<div id="dfResults" style="margin-top:16px"></div>';

    var imageData = [];

    var fI = C.querySelector('#dfFile');
    var zone = C.querySelector('#dfZone');
    zone.addEventListener('click', function() { fI.click(); });
    zone.addEventListener('dragover', function(e) { e.preventDefault(); zone.style.borderColor = 'var(--accent)'; });
    zone.addEventListener('dragleave', function() { zone.style.borderColor = ''; });
    zone.addEventListener('drop', function(e) {
      e.preventDefault(); zone.style.borderColor = '';
      loadImages(Array.from(e.dataTransfer.files).filter(function(f) { return f.type.startsWith('image/'); }));
    });
    fI.addEventListener('change', function(e) { loadImages(Array.from(e.target.files)); });
    C.querySelector('#dfSens').addEventListener('input', function() { C.querySelector('#dfSv').textContent = this.value; });

    function loadImages(files) {
      if (!files.length) return;
      imageData = [];
      var prog = C.querySelector('#dfProg'), bar = C.querySelector('#dfBar'), stat = C.querySelector('#dfStat');
      prog.style.display = 'block';
      var done = 0;
      files.forEach(function(file) {
        var reader = new FileReader();
        reader.onload = function(e) {
          var img = new Image();
          img.onload = function() {
            imageData.push({ file: file, img: img, name: file.name, size: file.size, hash: null });
            done++;
            bar.style.width = Math.round(done / files.length * 100) + '%';
            stat.textContent = 'Loading ' + done + '/' + files.length;
            if (done >= files.length) {
              prog.style.display = 'none';
              C.querySelector('#dfCtrl').style.display = 'block';
              C.querySelector('#dfCount').textContent = imageData.length + ' image(s) loaded';
            }
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    function computeDHash(img) {
      var cnv = document.createElement('canvas');
      cnv.width = 9;
      cnv.height = 8;
      var ctx = cnv.getContext('2d');
      ctx.drawImage(img, 0, 0, 9, 8);
      var data = ctx.getImageData(0, 0, 9, 8).data;
      var gray = [];
      for (var i = 0; i < data.length; i += 4) {
        gray.push(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      }
      var hash = [];
      for (var row = 0; row < 8; row++) {
        for (var col = 0; col < 8; col++) {
          hash.push(gray[row * 9 + col] > gray[row * 9 + col + 1] ? 1 : 0);
        }
      }
      return hash;
    }

    function hammingDist(a, b) {
      var dist = 0;
      for (var i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) dist++;
      }
      return dist;
    }

    C.querySelector('#dfScan').addEventListener('click', function() {
      if (imageData.length < 2) return;
      var threshold = parseInt(C.querySelector('#dfSens').value);
      var prog = C.querySelector('#dfProg'), bar = C.querySelector('#dfBar'), stat = C.querySelector('#dfStat');
      prog.style.display = 'block';

      // Compute hashes
      var done = 0;
      imageData.forEach(function(item) {
        item.hash = computeDHash(item.img);
        done++;
        bar.style.width = Math.round(done / imageData.length * 50) + '%';
        stat.textContent = 'Hashing ' + done + '/' + imageData.length;
      });

      stat.textContent = 'Comparing...';

      // Find pairs
      setTimeout(function() {
        var pairs = [];
        for (var i = 0; i < imageData.length; i++) {
          for (var j = i + 1; j < imageData.length; j++) {
            var dist = hammingDist(imageData[i].hash, imageData[j].hash);
            if (dist <= threshold) {
              pairs.push({ a: i, b: j, dist: dist });
            }
          }
        }
        bar.style.width = '100%';
        showResults(pairs, threshold);
        prog.style.display = 'none';
      }, 50);
    });

    function showResults(pairs, threshold) {
      var container = C.querySelector('#dfResults');
      if (!pairs.length) {
        container.innerHTML = '<div style="text-align:center;padding:30px"><i class="fas fa-check-circle" style="font-size:2rem;color:var(--green);margin-bottom:8px;display:block"></i>' +
          '<p style="color:var(--green);font-weight:600">No duplicates found (threshold: ' + threshold + ' bits)</p>' +
          '<p style="color:var(--text-muted);font-size:.85rem">Try increasing sensitivity to find more matches.</p></div>';
        return;
      }

      pairs.sort(function(a, b) { return a.dist - b.dist; });

      // Group into clusters
      var clusters = [];
      var used = {};
      pairs.forEach(function(p) {
        var found = -1;
        for (var c = 0; c < clusters.length; c++) {
          if (clusters[c].indexOf(p.a) !== -1 || clusters[c].indexOf(p.b) !== -1) {
            found = c;
            break;
          }
        }
        if (found >= 0) {
          if (clusters[found].indexOf(p.a) === -1) clusters[found].push(p.a);
          if (clusters[found].indexOf(p.b) === -1) clusters[found].push(p.b);
        } else {
          clusters.push([p.a, p.b]);
        }
      });

      var h = '<div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">';
      h += '<span class="chip"><i class="fas fa-images"></i> ' + imageData.length + ' scanned</span>';
      h += '<span class="chip badge-y"><i class="fas fa-clone"></i> ' + pairs.length + ' similar pair(s)</span>';
      h += '<span class="chip badge-y"><i class="fas fa-layer-group"></i> ' + clusters.length + ' group(s)</span>';
      h += '</div>';

      clusters.forEach(function(cluster, ci) {
        h += '<div style="margin-bottom:20px"><h4 style="margin-bottom:10px"><i class="fas fa-layer-group" style="color:var(--accent)"></i> Group ' + (ci + 1) + ' (' + cluster.length + ' images)</h4>';
        h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px">';
        cluster.forEach(function(idx) {
          var item = imageData[idx];
          h += '<div style="background:var(--bg-tertiary);border-radius:var(--radius-sm);border:1px solid var(--border);overflow:hidden;text-align:center">';
          var cnv = document.createElement('canvas');
          cnv.width = 150; cnv.height = 100;
          var ctx = cnv.getContext('2d');
          var scale = Math.min(150 / item.img.naturalWidth, 100 / item.img.naturalHeight);
          var w = item.img.naturalWidth * scale, ht = item.img.naturalHeight * scale;
          ctx.drawImage(item.img, (150 - w) / 2, (100 - ht) / 2, w, ht);
          // We can't directly append canvas in innerHTML, so use data URL
          var thumbUrl = cnv.toDataURL('image/jpeg', 0.6);
          h += '<img src="' + thumbUrl + '" style="width:100%;height:80px;object-fit:cover;display:block"/>';
          h += '<div style="padding:6px"><p style="font-size:.7rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + item.name + '</p>' +
            '<p style="font-size:.7rem">' + item.img.naturalWidth + 'x' + item.img.naturalHeight + ' ' + formatBytes(item.size) + '</p></div></div>';
        });
        h += '</div>';

        // Show pair distances
        var clusterPairs = pairs.filter(function(p) { return cluster.indexOf(p.a) !== -1 && cluster.indexOf(p.b) !== -1; });
        if (clusterPairs.length) {
          h += '<div style="margin-top:8px">';
          clusterPairs.forEach(function(p) {
            var similarity = Math.round((1 - p.dist / 64) * 100);
            h += '<p style="font-size:.78rem;color:var(--text-muted)">' + imageData[p.a].name + ' ↔ ' + imageData[p.b].name + ' — <strong style="color:var(--accent)">' + similarity + '% similar</strong> (' + p.dist + ' bits)</p>';
          });
          h += '</div>';
        }
        h += '</div>';
      });

      container.innerHTML = h;
    }

    C.querySelector('#dfClear').addEventListener('click', function() {
      imageData = [];
      C.querySelector('#dfResults').innerHTML = '';
      C.querySelector('#dfCtrl').style.display = 'none';
    });
  };

})(window);
