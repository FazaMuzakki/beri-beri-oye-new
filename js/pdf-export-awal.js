(function() {
    'use strict';

    window.exportDataAwalToPDF = function() {
        try {
            console.log('=== MEMULAI EKSPOR DATA AWAL PDF ===');
            
            if (typeof jspdf === 'undefined' || !jspdf.jsPDF) {
                alert('Library jsPDF belum dimuat');
                return;
            }

            // Get form data
            const formData = collectFormData();
            console.log('Form data:', formData);

            // Generate PDF
            generatePDF(formData);
            
        } catch (error) {
            console.error('Error saat mengekspor PDF:', error);
            alert('Terjadi kesalahan saat mengekspor PDF: ' + error.message);
        }
    };

    function collectFormData() {
        const data = {
            jenis_wilayah: getValue('jenis_wilayah'),
            nama_wilayah: getValue('nama_wilayah'),
            kecamatan: getValue('kecamatan'),
            kabkota: getValue('kabkota'),
            menuju_kategori: getRadioValue('menuju_kategori'),
            total_rw: getValue('total_rw'),
            total_rt: getValue('total_rt'),
            kelola_rw: getValue('kelola_rw'),
            kelola_rt: getValue('kelola_rt')
        };

        return data;
    }

    function getValue(id) {
        const el = document.getElementById(id);
        return el ? el.value : '';
    }

    function getRadioValue(name) {
        const radio = document.querySelector(`input[name="${name}"]:checked`);
        return radio ? radio.value : '';
    }

    function generatePDF(data) {
        const { jsPDF } = jspdf;
        const doc = new jsPDF();

        // Title
        doc.setFontSize(18);
        doc.setTextColor(0, 100, 0);
        doc.text('DATA AWAL PENILAIAN MANDIRI', 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('FORMULIR BERSERI', 105, 28, { align: 'center' });

        // Create table data
        const tableData = [
            ['Jenis Wilayah', `: ${data.jenis_wilayah}`],
            ['Nama Wilayah', `: ${data.nama_wilayah}`],
            ['Kecamatan', `: ${data.kecamatan}`],
            ['Kabupaten/Kota', `: ${data.kabkota}`],
            ['Menuju Kategori', `: ${data.menuju_kategori.toUpperCase()}`],
            ['Total RW', `: ${data.total_rw}`],
            ['Total RT', `: ${data.total_rt}`],
            ['RW yang Dikelola', `: ${data.kelola_rw}`],
            ['RT yang Dikelola', `: ${data.kelola_rt}`]
        ];

        // Add table
        doc.autoTable({
            startY: 40,
            head: [],
            body: tableData,
            theme: 'plain',
            styles: { 
                fontSize: 11,
                cellPadding: 4
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 50 },
                1: { cellWidth: 130 }
            }
        });

        // Add footer
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text(
            `Dicetak pada: ${new Date().toLocaleString('id-ID')}`,
            105,
            285,
            { align: 'center' }
        );

        // Save PDF
        const fileName = `Data_Awal_${data.nama_wilayah || 'Wilayah'}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        alert('PDF berhasil diunduh!');
    }

    // Add export button when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        const submitBtn = document.getElementById('simpanAwal');
        if (submitBtn) {
            const exportBtn = document.createElement('button');
            exportBtn.type = 'button';
            exportBtn.className = 'btn btn-secondary';
            exportBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export ke PDF
            `;
            exportBtn.onclick = window.exportDataAwalToPDF;
            
            submitBtn.parentNode.insertBefore(exportBtn, submitBtn.nextSibling);
        }
    });
})();