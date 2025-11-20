/* ===============================================================
   PDF EXPORT FUNCTIONALITY - Penilaian Kab/Kota (v1.0)
   - Menggunakan jsPDF + autotable
   - Mengikuti pola export pada penilaian-mandiri
   - Tombol Export muncul HANYA pada langkah terakhir
   =============================================================== */

(function() {
  'use strict';

  // Util: encode special characters for PDF safety
  function encodeSpecialChars(text) {
    if (!text) return text;
    return String(text)
      .replace(/≤/g, '<=')
      .replace(/≥/g, '>=')
      .replace(/—/g, '-')
      .replace(/–/g, '-')
      .replace(/…/g, '...');
  }

  // Read displayed component scores from DOM (kabkota)
  function readDisplayedComponentScores() {
    const get = (id) => {
      const el = document.getElementById(id);
      return el ? parseFloat((el.textContent || '0').replace(',', '.')) || 0 : 0;
    };
    return {
      A: get('kabkotaComponentA'),
      B: get('kabkotaComponentB'),
      C: get('kabkotaComponentC'),
      D: get('kabkotaComponentD'),
      E: get('kabkotaComponentE'),
      F: get('kabkotaComponentF'),
      total: get('kabkotaTotalSkor')
    };
  }

  // Attempt to collect detailed answers using FORM_CONFIG if accessible; fallback to DOM-only collection
  function collectFormDataKabkota() {
    const result = { sections: [] };
    const cfg = (typeof FORM_CONFIG !== 'undefined') ? FORM_CONFIG : null;

    if (cfg && Array.isArray(cfg)) {
      // Config-driven collection (preferred for structure/labels)
      cfg.forEach((section) => {
        const sectionData = { title: section.title, items: [] };
        section.items.forEach((item) => {
          if (item.type === 'table-wrapper' && Array.isArray(item.items)) {
            item.items.forEach((subItem) => {
              const subData = { no: subItem.displayNo || subItem.no, label: subItem.label || subItem.display || '', type: subItem.type, answer: null, score: 0 };
              if (subItem.type === 'table-lokasi') {
                const out = [];
                (subItem.rows || []).forEach((row) => {
                  const name = `${subItem.no}_${row.id}`;
                  const el = document.querySelector(`input[name="${name}"]`);
                  if (el && el.value.trim()) out.push(`${row.label}: ${el.value.trim()}`);
                });
                if (out.length) subData.answer = out.join('\n');
              } else if (subItem.type === 'table-input') {
                const out = [];
                const rows = subItem.rows || 0;
                const cols = (subItem.columns || []).length;
                for (let i = 1; i <= rows; i++) {
                  const rowVals = [];
                  for (let j = 1; j <= cols; j++) {
                    const name = `${subItem.no}_row${i}_col${j}`;
                    const cell = document.querySelector(`input[name="${name}"], select[name="${name}"]`);
                    if (cell && cell.value.trim()) {
                      const colLabel = subItem.columns[j - 1]?.label || `Kolom ${j}`;
                      rowVals.push(`${colLabel}: ${cell.value.trim()}`);
                    }
                  }
                  if (rowVals.length) out.push(`Baris ${i}: ${rowVals.join(', ')}`);
                }
                if (out.length) subData.answer = out.join('\n');
              }
              if (subData.answer) sectionData.items.push(subData);
            });
            return; // skip wrapper itself
          }

          const itemData = { no: item.displayNo || item.no, label: item.label || '', type: item.type, answer: null, score: 0 };
          if (item.type === 'radio') {
            const sel = document.querySelector(`input[name="${item.no}"]:checked`);
            if (sel) {
              const op = (item.options || []).find(o => o.value === sel.value);
              if (op) {
                itemData.answer = op.label;
              }
            }
          } else if (item.type === 'checkbox') {
            const cbs = document.querySelectorAll(`input[name="${item.no}"]:checked`);
            if (cbs.length) {
              const labs = Array.from(cbs).map(cb => {
                const op = (item.options || []).find(o => o.value === cb.value);
                return op ? op.label : cb.value;
              });
              itemData.answer = labs.join('\n');
            }
          } else if (item.type === 'rwChoice4') {
            const lines = [];
            for (let rw = 1; rw <= 4; rw++) {
              const sel = document.querySelector(`input[name="${item.no}_${rw}"]:checked`);
              if (sel) {
                const idx = sel.value.charCodeAt(0) - 97; // a-d
                const rwLetter = String.fromCharCode(64 + rw);
                lines.push(`RW ${rwLetter}: ${item.rws[idx] || ''}`);
              }
            }
            if (lines.length) itemData.answer = lines.join('\n');
          } else if (item.type === 'conditional-table') {
            const organik = document.querySelector(`input[name="${item.no}_organik"]`);
            const anorg = document.querySelector(`input[name="${item.no}_anorganik"]`);
            const out = [];
            if (organik && organik.value.trim()) out.push(`Organik: ${organik.value.trim()} kg/bulan`);
            if (anorg && anorg.value.trim()) out.push(`Anorganik: ${anorg.value.trim()} kg/bulan`);
            if (out.length) itemData.answer = out.join('\n');
          } else if (item.type && item.type.startsWith('table-input')) {
            const out = [];
            const rows = item.rows || 0;
            const cols = (item.columns || []).length || 1;
            for (let i = 1; i <= rows; i++) {
              const rowVals = [];
              for (let j = 1; j <= cols; j++) {
                const name = `${item.no}_row${i}_col${j}`;
                const cell = document.querySelector(`input[name="${name}"], select[name="${name}"]`);
                if (cell && cell.value.trim()) {
                  const colLabel = item.columns?.[j - 1]?.label || `Kolom ${j}`;
                  rowVals.push(`${colLabel}: ${cell.value.trim()}`);
                }
              }
              if (rowVals.length) {
                const rowLabel = item.rowLabels?.[i - 1];
                out.push(rowLabel ? `${rowLabel}\n  ${rowVals.join(', ')}` : `Baris ${i}: ${rowVals.join(', ')}`);
              }
            }
            if (out.length) itemData.answer = out.join('\n');
          }

          if (itemData.answer) sectionData.items.push(itemData);
        });
        if (sectionData.items.length) result.sections.push(sectionData);
      });
      return result;
    }

    // Fallback: DOM-driven collection by walking [data-step] sections
    const steps = document.querySelectorAll('section[data-step]');
    steps.forEach((sec) => {
      const titleEl = sec.querySelector('h2');
      const sectionTitle = titleEl ? titleEl.textContent.trim() : 'Bagian';
      const sectionData = { title: sectionTitle, items: [] };

      // radios
      const radios = sec.querySelectorAll('input[type="radio"]');
      const groups = new Map();
      radios.forEach(r => { if (!groups.has(r.name)) groups.set(r.name, []); groups.get(r.name).push(r); });
      groups.forEach((list, name) => {
        const sel = list.find(r => r.checked);
        if (sel) {
          const labelEl = sec.querySelector(`input[name="${name}"][value="${sel.value}"]+span`);
          const qLabel = (sec.querySelector(`input[name="${name}"]`)?.closest('div')?.previousElementSibling?.textContent || '').trim();
          const label = labelEl ? labelEl.textContent.trim() : sel.value;
          sectionData.items.push({ no: name, label: qLabel, type: 'radio', answer: label, score: 0 });
        }
      });

      // checkboxes
      const checkboxes = sec.querySelectorAll('input[type="checkbox"]');
      const cbGroups = new Map();
      checkboxes.forEach(c => { if (!cbGroups.has(c.name)) cbGroups.set(c.name, []); cbGroups.get(c.name).push(c); });
      cbGroups.forEach((list, name) => {
        const checked = list.filter(c => c.checked);
        if (checked.length) {
          const labels = checked.map(c => c.parentElement?.querySelector('span')?.textContent?.trim() || c.value);
          const qLabel = (sec.querySelector(`input[name="${name}"]`)?.closest('div')?.previousElementSibling?.textContent || '').trim();
          sectionData.items.push({ no: name, label: qLabel, type: 'checkbox', answer: labels.join('\n'), score: 0 });
        }
      });

      // text/number inputs inside tables
      const inputs = sec.querySelectorAll('input[type="text"], input[type="number"], select');
      inputs.forEach(inp => {
        if (!inp.name) return;
        const val = (inp.value || '').trim();
        if (!val) return;
        // try find a nearby question/table label
        const table = inp.closest('table');
        const card = inp.closest('.card');
        const labelContainer = table?.closest('div')?.previousElementSibling || card?.querySelector('p.font-semibold');
        const qLabel = (labelContainer?.textContent || '').trim();
        sectionData.items.push({ no: inp.name, label: qLabel, type: inp.tagName.toLowerCase(), answer: val, score: 0 });
      });

      if (sectionData.items.length) result.sections.push(sectionData);
    });
    return result;
  }

  // Main export function
  window.exportKabkotaToPDF = function() {
    try {
      if (typeof jspdf === 'undefined' || !jspdf.jsPDF) {
        alert('Library jsPDF belum dimuat.');
        return;
      }
      const { jsPDF } = jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      try { doc.setFont('arial'); } catch(e) { doc.setFont('times'); }

      // Context
      const selected = JSON.parse(localStorage.getItem('kabkota_selected_assessment') || '{}');
      const scores = readDisplayedComponentScores();
      const formData = (Array.isArray(window.FORM_CONFIG_KABKOTA))
        ? collectFormDataKabkotaV2()
        : collectFormDataKabkota();

      // Header
      doc.setFontSize(18); doc.setTextColor(0, 100, 0);
      doc.text('PENILAIAN KABUPATEN/KOTA', 105, 20, { align: 'center' });
      doc.setFontSize(12); doc.setTextColor(0, 0, 0);
      doc.text('FORMULIR KONDISI – BERSERI', 105, 28, { align: 'center' });

      // Data awal
      let y = 40;
      doc.setFontSize(14); doc.setTextColor(0,128,0);
      doc.rect(20, y, 170, 8, 'F');
      doc.setTextColor(255,255,255); doc.setFontSize(11);
      doc.text('DATA AWAL', 105, y+5.5, { align: 'center' });
      y += 12; doc.setTextColor(0,0,0); doc.setFontSize(10);

      // Ambil verifikator dari context jika tersedia
      const awalCtx = JSON.parse(localStorage.getItem('kabkota_awal_context') || '{}');
      const pmCtx = JSON.parse(localStorage.getItem('kabkota_pm_context') || '{}');
      const ver1 = awalCtx.verifikator1 || pmCtx.verifikator1 || '';
      const ver2 = awalCtx.verifikator2 || pmCtx.verifikator2 || '';
      const ver3 = awalCtx.verifikator3 || pmCtx.verifikator3 || '';

      // Sertakan juga skor dummy (Mandiri) dari penilaian yang dipilih
      const mandiri = selected.componentScores || {};
      const initial = [
        ['Jenis Wilayah', `: ${encodeSpecialChars(selected.jenis_wilayah || '-')}`],
        ['Nama Wilayah', `: ${encodeSpecialChars(selected.nama_wilayah || '-')}`],
        ['Kecamatan', `: ${encodeSpecialChars(selected.kecamatan || '-')}`],
        ['Kabupaten/Kota', `: ${encodeSpecialChars(selected.kabkota || '-')}`],
        ['Menuju Kategori', `: ${encodeSpecialChars((selected.menuju_kategori || '-').toUpperCase())}`],
        ['Skor Mandiri (Total)', `: ${(selected.totalScore != null ? Number(selected.totalScore).toFixed(2) : '-')}`],
        ['Skor Komponen Mandiri A', `: ${(mandiri.kepemimpinan != null ? Number(mandiri.kepemimpinan).toFixed(2) : '0.00')}`],
        ['Skor Komponen Mandiri B', `: ${(mandiri.kelembagaan != null ? Number(mandiri.kelembagaan).toFixed(2) : '0.00')}`],
        ['Skor Komponen Mandiri C', `: ${(mandiri.sampah != null ? Number(mandiri.sampah).toFixed(2) : '0.00')}`],
        ['Skor Komponen Mandiri D', `: ${(mandiri.rth != null ? Number(mandiri.rth).toFixed(2) : '0.00')}`],
        ['Skor Komponen Mandiri E', `: ${(mandiri.energi != null ? Number(mandiri.energi).toFixed(2) : '0.00')}`],
        ['Skor Komponen Mandiri F', `: ${(mandiri.air != null ? Number(mandiri.air).toFixed(2) : '0.00')}`],
        ['Verifikator 1', `: ${encodeSpecialChars(ver1 || '-')}`],
        ['Verifikator 2', `: ${encodeSpecialChars(ver2 || '-')}`],
        ['Verifikator 3', `: ${encodeSpecialChars(ver3 || '-')}`]
      ];
      doc.autoTable({ startY: y, head: [], body: initial, theme: 'plain', styles: { fontSize: 10, cellPadding: 4 }, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 }, 1: { cellWidth: 130 } }, margin: { left: 20, right: 20 } });
      y = doc.lastAutoTable.finalY + 10;

      // Ringkasan skor
      doc.setFillColor(0,128,0); doc.rect(20, y, 170, 8, 'F');
      doc.setTextColor(255,255,255); doc.setFontSize(11);
      doc.text('RINGKASAN SKOR', 105, y+5.5, { align: 'center' });
      y += 12; doc.setTextColor(0,0,0); doc.setFontSize(10);
      const scoreRows = [
        ['A. KEPEMIMPINAN DALAM PENGELOLAAN LINGKUNGAN', scores.A.toFixed(2)],
        ['B. KELEMBAGAAN DAN PARTISIPASI MASYARAKAT', scores.B.toFixed(2)],
        ['C. PENGELOLAAN SAMPAH', scores.C.toFixed(2)],
        ['D. PENGELOLAAN RUANG TERBUKA HIJAU', scores.D.toFixed(2)],
        ['E. KONSERVASI ENERGI', scores.E.toFixed(2)],
        ['F. KONSERVASI AIR', scores.F.toFixed(2)],
        ['', ''],
        ['TOTAL SKOR', scores.total.toFixed(2)]
      ];
      doc.autoTable({ startY: y, head: [], body: scoreRows, theme: 'plain', styles: { fontSize: 10, cellPadding: 4 }, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 130 }, 1: { cellWidth: 40, halign: 'right' } }, margin: { left: 20, right: 20 } });
      y = doc.lastAutoTable.finalY + 10;

      // Detail penilaian
      formData.sections.forEach((section) => {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFillColor(0,128,0); doc.rect(20, y, 170, 8, 'F');
        doc.setTextColor(255,255,255); doc.setFontSize(11);
        doc.text(section.title, 105, y+5.5, { align: 'center' });
        y += 12; doc.setTextColor(0,0,0); doc.setFontSize(9);
        const rows = section.items.map(item => {
        const tableTypes = ['table-input', 'table-lokasi', 'conditional-table', 'table-input-5col', 'table-input-2col'];
        let itemText;
        if (tableTypes.includes(item.type)) {
          itemText = item.label || '';
        } else {
          itemText = `${item.no || ''}. ${item.label || ''}`;
        }
        let answer = item.answer || '(Belum diisi)';
        if (item.type === 'checkbox') {
          // keep line breaks
        } else if (item.type === 'rwChoice4') {
          const lines = String(answer).split('\n');
          answer = lines.map(l => l.trim()).join('\n');
        } else if (section.title && section.title.startsWith('C.') && (item.type === 'table-input' || item.type === 'table-input-2col')) {
          const rows = String(answer).split('\n');
          answer = rows.map(row => {
            const match = row.match(/Baris \d+(?:, Kolom \d+)?: (.+)/);
            return match ? match[1].trim() : row.trim();
          }).join('\n');
        } else {
          answer = String(answer).replace(/\n/g, ', ');
        }
        return [encodeSpecialChars(itemText), encodeSpecialChars(answer)];
      });
        if (!rows.length) return;
        doc.autoTable({ startY: y, head: [], body: rows, theme: 'grid', styles: { fontSize: 8, cellPadding: 2.5, valign: 'top' }, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 65 }, 1: { cellWidth: 105 } }, margin: { left: 20, right: 20 } });
        y = doc.lastAutoTable.finalY + 10;
      });

      // Footer time
      doc.setFontSize(8); doc.setTextColor(128);
      doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 105, 285, { align: 'center' });

      const fileName = `Penilaian_KabKota_${(selected.nama_wilayah || 'BERSERI')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (e) {
      console.error('Export PDF error:', e);
      alert('Terjadi kesalahan saat mengekspor PDF: ' + e.message);
    }
  };

  // Auto-add Export button on last step only
  document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('formKabkota');
    if (!form) return;

    setTimeout(function() {
      const submitBtn = document.getElementById('submitForm');
      if (!submitBtn || !submitBtn.parentElement) return;

      if (document.querySelector('.btn-export-pdf-kabkota')) return;

      const exportBtn = document.createElement('button');
      exportBtn.type = 'button';
      exportBtn.className = 'btn btn-secondary btn-export-pdf-kabkota hidden';
      exportBtn.style.backgroundColor = '#DC2626';
      exportBtn.style.color = 'white';
      exportBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Ekspor ke PDF
      `;
      exportBtn.onclick = window.exportKabkotaToPDF;

      // Insert before submit
      submitBtn.parentElement.insertBefore(exportBtn, submitBtn);

      function updateVisibility() {
        const steps = form.querySelectorAll('[data-step]');
        let current = -1;
        steps.forEach((s, idx) => { if (!s.classList.contains('hidden')) current = idx; });
        if (current === steps.length - 1) exportBtn.classList.remove('hidden');
        else exportBtn.classList.add('hidden');
      }

      // Initial
      updateVisibility();

      const prevBtn = document.getElementById('prevStep');
      const nextBtn = document.getElementById('nextStep');
      prevBtn && prevBtn.addEventListener('click', () => setTimeout(updateVisibility, 150));
      nextBtn && nextBtn.addEventListener('click', () => setTimeout(updateVisibility, 150));

      // Step labels/buttons
      function attachStepLabelListeners() {
        const labels = document.querySelectorAll('.step-label, [role="button"][aria-label*="section"]');
        labels.forEach(l => l.addEventListener('click', () => setTimeout(updateVisibility, 150)));
      }
      attachStepLabelListeners();

      // Observe step visibility changes
      const observer = new MutationObserver(() => setTimeout(updateVisibility, 100));
      form.querySelectorAll('[data-step]').forEach(step => observer.observe(step, { attributes: true, attributeFilter: ['class'] }));

    }, 500);
  });
// New ordered data collector based on Mandiri exporter
  function collectFormDataKabkotaV2() {
    const formData = { sections: [] };

    const CFG = window.FORM_CONFIG_KABKOTA || [];
    if (Array.isArray(CFG) && CFG.length) {
      CFG.forEach((section, sectionIndex) => {
        const sectionData = { title: section.title, items: [] };

        section.items.forEach((item, itemIndex) => {
          if (item.type === 'table-wrapper') {
            if (item.items && Array.isArray(item.items)) {
              item.items.forEach((subItem, subIndex) => {
                const subItemData = {
                  no: subItem.displayNo || subItem.no || `${itemIndex}.${subIndex + 1}`,
                  label: subItem.label || subItem.display || '(Tanpa Label)',
                  type: subItem.type,
                  answer: null,
                  score: 0
                };

                if (subItem.type === 'table-lokasi') {
                  const lokasiData = [];
                  if (subItem.rows && Array.isArray(subItem.rows)) {
                    subItem.rows.forEach((row) => {
                      const fieldName = `${subItem.no}_${row.id}`;
                      const input = document.querySelector(`input[name="${fieldName}"]`);
                      if (input && input.value.trim()) {
                        lokasiData.push(`${row.label}: ${input.value.trim()}`);
                      }
                    });
                  }
                  subItemData.answer = lokasiData.length > 0 ? lokasiData.join('\n') : '(Belum diisi)';
                  sectionData.items.push(subItemData);
                }
                else if (subItem.type === 'table-input') {
                  const tableData = [];
                  const numRows = subItem.rows || 4;
                  const numCols = subItem.columns ? subItem.columns.length : 0;
                  for (let i = 1; i <= numRows; i++) {
                    const rowValues = [];
                    for (let j = 1; j <= numCols; j++) {
                      const fieldName = `${subItem.no}_row${i}_col${j}`;
                      const cell = document.querySelector(`input[name="${fieldName}"], select[name="${fieldName}"]`);
                      if (cell && String(cell.value).trim()) {
                        const colLabel = subItem.columns[j - 1]?.label || `Kolom ${j}`;
                        rowValues.push(`${colLabel}: ${String(cell.value).trim()}`);
                      }
                    }
                    if (rowValues.length > 0) {
                      tableData.push(`Baris ${i}: ${rowValues.join(', ')}`);
                    }
                  }
                  subItemData.answer = tableData.length > 0 ? tableData.join('\n') : '(Belum diisi)';
                  sectionData.items.push(subItemData);
                }
              });
            }
            return; // skip wrapper row itself
          }

          const itemData = {
            no: item.displayNo || item.no || (itemIndex + 1),
            label: item.label || '(Tanpa Label)',
            type: item.type,
            answer: null,
            score: 0
          };

          switch(item.type) {
            case 'rwChoice4': {
              const rwAnswers = [];
              for (let rwIndex = 1; rwIndex <= 4; rwIndex++) {
                const radioValue = document.querySelector(`input[name="${item.no}_${rwIndex}"]:checked`);
                if (radioValue) {
                  const value = radioValue.value;
                  const optionIndex = value.charCodeAt(0) - 97;
                  const rwLetter = String.fromCharCode(64 + rwIndex);
                  const optionText = item.rws[optionIndex];
                  const pct = ((item.scores && item.scores[value]) ? (item.scores[value] * 100) : 0);
                  rwAnswers.push(`RW ${rwLetter}: ${optionText} (${pct.toFixed(0)}%)`);
                }
              }
              if (rwAnswers.length > 0) itemData.answer = rwAnswers.join('\n');
              break;
            }
            case 'kader10': {
              const kaderAnswers = [];
              for (let i = 1; i <= 10; i++) {
                const kaderInput = document.querySelector(`input[name="${item.no}_${i}"]`);
                if (kaderInput && kaderInput.value.trim()) {
                  kaderAnswers.push(`Kader ${i}: ${kaderInput.value.trim()}`);
                }
              }
              const extra = document.querySelector(`textarea[name="${item.no}_11_plus"]`);
              if (extra && extra.value.trim()) {
                const additional = extra.value.trim().split(/[\n,]+/).filter(Boolean).map((k, idx) => `Kader ${11 + idx}: ${k.trim()}`);
                kaderAnswers.push(...additional);
              }
              if (kaderAnswers.length > 0) itemData.answer = kaderAnswers.join('\n');
              break;
            }
            case 'table-lokasi': {
              const lokasiData = [];
              if (item.rows && Array.isArray(item.rows)) {
                item.rows.forEach((row) => {
                  const fieldName = `${item.no}_${row.id}`;
                  const input = document.querySelector(`input[name="${fieldName}"]`);
                  if (input && input.value.trim()) {
                    lokasiData.push(`${row.label}: ${input.value.trim()}`);
                  }
                });
              }
              if (lokasiData.length > 0) itemData.answer = lokasiData.join('\n');
              break;
            }
            case 'conditional-table':
            case 'table-input':
            case 'table-input-2col':
            case 'table-input-5col': {
              const tableData = [];
              if (item.type === 'conditional-table') {
                const organikVal = document.querySelector(`input[name="${item.no}_organik"]`)?.value;
                const anorganikVal = document.querySelector(`input[name="${item.no}_anorganik"]`)?.value;
                if (organikVal) tableData.push(`Organik: ${organikVal} kg/bulan`);
                if (anorganikVal) tableData.push(`Anorganik: ${anorganikVal} kg/bulan`);
              }
              else if (item.hasLeftLabels && item.rowLabels) {
                const numRows = item.rows || item.rowLabels.length;
                const numCols = item.columns ? item.columns.length : 1;
                for (let i = 1; i <= numRows; i++) {
                  const rowLabel = item.rowLabels[i - 1] || `Baris ${i}`;
                  const rowValues = [];
                  for (let j = 1; j <= numCols; j++) {
                    const fieldName = `${item.no}_row${i}_col${j}`;
                    const cell = document.querySelector(`input[name="${fieldName}"], select[name="${fieldName}"]`);
                    if (cell && String(cell.value).trim()) {
                      const colLabel = item.columns[j - 1]?.label || `Kolom ${j}`;
                      rowValues.push(`${colLabel}: ${String(cell.value).trim()}`);
                    }
                  }
                  if (rowValues.length > 0) tableData.push(`${rowLabel}\n  ${rowValues.join(', ')}`);
                }
              }
              else if (item.type === 'table-input' && item.columns) {
                const numRows = item.rows || 4;
                const numCols = item.columns.length;
                for (let i = 1; i <= numRows; i++) {
                  const rowValues = [];
                  for (let j = 1; j <= numCols; j++) {
                    const fieldName = `${item.no}_row${i}_col${j}`;
                    const cell = document.querySelector(`input[name="${fieldName}"], select[name="${fieldName}"]`);
                    if (cell && String(cell.value).trim()) {
                      const colLabel = item.columns[j - 1]?.label || `Kolom ${j}`;
                      rowValues.push(`${colLabel}: ${String(cell.value).trim()}`);
                    }
                  }
                  if (rowValues.length > 0) tableData.push(`Baris ${i}: ${rowValues.join(', ')}`);
                }
              }
              else {
                const cells = document.querySelectorAll(`input[name^="${item.no}_row"], select[name^="${item.no}_row"]`);
                cells.forEach(cell => {
                  if (String(cell.value).trim()) {
                    const match = cell.name.match(/row(\d+)_col?(\d*)/);
                    if (match) {
                      const [_, row, col] = match;
                      tableData.push(`Baris ${row}${col ? `, Kolom ${col}` : ''}: ${String(cell.value).trim()}`);
                    }
                  }
                });
              }
              if (tableData.length > 0) itemData.answer = tableData.join('\n');
              break;
            }
            case 'radio': {
              const selectedRadio = document.querySelector(`input[name="${item.no}"]:checked`);
              if (selectedRadio) {
                const option = item.options?.find(opt => opt.value === selectedRadio.value);
                if (option) itemData.answer = option.label;
              }
              break;
            }
            case 'checkbox': {
              const selectedBoxes = document.querySelectorAll(`input[name="${item.no}"]:checked`);
              if (selectedBoxes.length > 0) {
                const selectedLabels = Array.from(selectedBoxes).map(cb => {
                  const option = item.options?.find(opt => opt.value === cb.value);
                  return option ? option.label : cb.value;
                });
                itemData.answer = selectedLabels.join('\n');
              }
              break;
            }
          }

          if (itemData.answer !== null) {
            sectionData.items.push(itemData);
          }
        });

        if (sectionData.items.length > 0) formData.sections.push(sectionData);
      });
    }

    return formData;
  }
})();
