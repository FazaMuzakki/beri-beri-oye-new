(function(){
  'use strict';

  function encode(text){
    if (!text) return '-';
    return String(text)
      .replace(/≤/g, '<=')
      .replace(/≥/g, '>=')
      .replace(/—/g, '-')
      .replace(/–/g, '-')
      .replace(/…/g, '...');
  }

  function getVerifikatorInput(){
    const v1 = document.querySelector('input[name="verifikator1"]')?.value || '';
    const v2 = document.querySelector('input[name="verifikator2"]')?.value || '';
    const v3 = document.querySelector('input[name="verifikator3"]')?.value || '';
    return { verifikator1: v1, verifikator2: v2, verifikator3: v3 };
  }

  function buildSelectedData(){
    // Ambil dari localStorage jika ada, jika tidak gunakan selection aktif di listManager
    const selectedLS = JSON.parse(localStorage.getItem('kabkota_selected_assessment') || '{}');
    const selectedFromUI = (window.listManager && window.listManager.selectedAssessment) ? window.listManager.selectedAssessment : {};
    const selected = (selectedLS && selectedLS.id) ? selectedLS : selectedFromUI;

    // Jika dapat dari UI, simpan ke localStorage agar konsisten di halaman form
    if (selected && selected.id && (!selectedLS || !selectedLS.id)) {
      localStorage.setItem('kabkota_selected_assessment', JSON.stringify(selected));
    }

    const ver = getVerifikatorInput();
    // merge and persist to a context used by next page
    const ctx = {
      ...selected,
      ...ver,
      saved_at: new Date().toISOString()
    };
    localStorage.setItem('kabkota_awal_context', JSON.stringify(ctx));
    return ctx;
  }

  // Public: export current selection + verifikator to PDF
  window.exportKabkotaAwalToPDF = function(){
    try {
      if (typeof jspdf === 'undefined' || !jspdf.jsPDF) {
        alert('Library jsPDF belum dimuat.');
        return;
      }
      const { jsPDF } = jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      try { doc.setFont('arial'); } catch(e) { doc.setFont('times'); }

      const data = buildSelectedData();

      // Header
      doc.setFontSize(18); doc.setTextColor(0,100,0);
      doc.text('DATA AWAL PENILAIAN KAB/KOTA', 105, 20, { align: 'center' });
      doc.setFontSize(12); doc.setTextColor(0,0,0);
      doc.text('FORMULIR BERSERI', 105, 28, { align: 'center' });

      // Data awal table (sertakan skor komponen Mandiri dari data dummy terpilih)
      const mandiri = data.componentScores || {};
      const table = [
        ['Jenis Wilayah', `: ${encode(data.jenis_wilayah || '-')}`],
        ['Nama Wilayah', `: ${encode(data.nama_wilayah || '-')}`],
        ['Kecamatan', `: ${encode(data.kecamatan || '-')}`],
        ['Kabupaten/Kota', `: ${encode(data.kabkota || '-')}`],
        ['Menuju Kategori', `: ${encode((data.menuju_kategori || '-').toUpperCase())}`],
        ['Skor Mandiri (Total)', `: ${(data.totalScore != null ? Number(data.totalScore).toFixed(2) : '-')}`],
        ['Skor Komponen Mandiri A', `: ${encode((mandiri.kepemimpinan ?? 0).toFixed ? mandiri.kepemimpinan.toFixed(2) : String(mandiri.kepemimpinan || 0))}`],
        ['Skor Komponen Mandiri B', `: ${encode((mandiri.kelembagaan ?? 0).toFixed ? mandiri.kelembagaan.toFixed(2) : String(mandiri.kelembagaan || 0))}`],
        ['Skor Komponen Mandiri C', `: ${encode((mandiri.sampah ?? 0).toFixed ? mandiri.sampah.toFixed(2) : String(mandiri.sampah || 0))}`],
        ['Skor Komponen Mandiri D', `: ${encode((mandiri.rth ?? 0).toFixed ? mandiri.rth.toFixed(2) : String(mandiri.rth || 0))}`],
        ['Skor Komponen Mandiri E', `: ${encode((mandiri.energi ?? 0).toFixed ? mandiri.energi.toFixed(2) : String(mandiri.energi || 0))}`],
        ['Skor Komponen Mandiri F', `: ${encode((mandiri.air ?? 0).toFixed ? mandiri.air.toFixed(2) : String(mandiri.air || 0))}`],
        ['Verifikator 1', `: ${encode(data.verifikator1 || '-')}`],
        ['Verifikator 2', `: ${encode(data.verifikator2 || '-')}`],
        ['Verifikator 3', `: ${encode(data.verifikator3 || '-')}`]
      ];

      doc.autoTable({
        startY: 40,
        head: [],
        body: table,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { cellWidth: 120 } },
        margin: { left: 20, right: 20 }
      });

      doc.setFontSize(8); doc.setTextColor(128);
      doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 105, 285, { align: 'center' });

      const name = `Data_Awal_KabKota_${encode(data.nama_wilayah || 'Wilayah')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(name);
      alert('PDF berhasil diunduh.');
    } catch (e) {
      console.error('Export PDF awal kabkota error:', e);
      alert('Terjadi kesalahan saat mengekspor PDF: ' + e.message);
    }
  };

  // Wire actions on DOM ready
  document.addEventListener('DOMContentLoaded', function(){
    // Change Simpan button behavior to store context
    const simpanBtn = document.getElementById('simpanAwal');
    if (simpanBtn) {
      // Insert export button next to simpan
      const exportBtn = document.createElement('button');
      exportBtn.type = 'button';
      exportBtn.className = 'btn btn-secondary';
      exportBtn.style.marginLeft = '8px';
      exportBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export ke PDF`;
      exportBtn.onclick = window.exportKabkotaAwalToPDF;
      simpanBtn.parentNode.insertBefore(exportBtn, simpanBtn.nextSibling);

      simpanBtn.addEventListener('click', function(){
        const ctx = buildSelectedData();
        // also keep in kabkota_pm_context for form page convenience
        const pm = {
          wilayah: `${ctx.jenis_wilayah || ''} ${ctx.nama_wilayah || ''}, Kec. ${ctx.kecamatan || ''}, ${ctx.kabkota || ''}`.trim(),
          menuju_kategori: ctx.menuju_kategori || '',
          total_skor: ctx.totalScore || 0,
          skor_a: ctx.componentScores?.kepemimpinan || 0,
          skor_b: ctx.componentScores?.kelembagaan || 0,
          skor_c: ctx.componentScores?.sampah || 0,
          skor_d: ctx.componentScores?.rth || 0,
          skor_e: ctx.componentScores?.energi || 0,
          skor_f: ctx.componentScores?.air || 0,
          verifikator1: ctx.verifikator1 || '',
          verifikator2: ctx.verifikator2 || '',
          verifikator3: ctx.verifikator3 || ''
        };
        localStorage.setItem('kabkota_pm_context', JSON.stringify(pm));
        alert('Data awal dan Tim Verifikator tersimpan.');
      });
    }
  });
})();
