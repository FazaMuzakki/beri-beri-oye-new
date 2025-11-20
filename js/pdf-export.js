/* ===============================================================
   PDF EXPORT FUNCTIONALITY - Penilaian Mandiri (FINAL v2.4.1)
   Version: 2.4.1 FINAL - Button placement optimization (FIXED ALL)
   
   CHANGELOG v2.4.1:
   - ✅ Fixed: Button hidden untuk SEMUA metode navigasi
   - ✅ Added: MutationObserver untuk detect step changes
   - ✅ Added: Multiple selector untuk step indicators
   - ✅ Tombol Export PDF HANYA muncul di halaman G
   - ✅ Works dengan: Prev/Next buttons, Step labels (A-G), Direct clicks
   
   CHANGELOG v2.4:
   - ✅ Tombol Export PDF hanya muncul di halaman terakhir (G)
   - ✅ Posisi di tengah bersama tombol Kirim
   - ✅ Dynamic visibility control dengan step detection
   
   CHANGELOG v2.3:
   - ✅ Hide nomor untuk table types (table-input, table-lokasi, dll)
   - ✅ Tampilan PDF lebih rapi dan profesional
   
   CHANGELOG v2.2:
   - ✅ Fixed table-wrapper handler - C-table1 & C-table2 now appear in PDF
   - ✅ Better label handling for nested items
   
   =============================================================== */

(function() {
    'use strict';

    /**
     * Fungsi utama untuk mengekspor data penilaian ke PDF
     */
    window.exportPenilaianToPDF = function() {
        try {
            console.log('=== MEMULAI EKSPOR PDF ===');
            
            // Cek apakah library jsPDF tersedia
            if (typeof jspdf === 'undefined' || !jspdf.jsPDF) {
                alert('Library jsPDF belum dimuat. Pastikan sudah include script jsPDF di HTML.');
                return;
            }

            // Ambil data dari localStorage
            const pmContext = JSON.parse(localStorage.getItem('pm_context') || '{}');
            console.log('Context:', pmContext);
            
            // Kumpulkan data dari form
            console.log('Mengumpulkan data form...');
            const formData = collectFormData();
            console.log('Data form terkumpul:', formData);
            
            // Validasi data
            if (!formData.sections || formData.sections.length === 0) {
                alert('Tidak ada data form yang ditemukan. Pastikan form sudah diisi.');
                console.error('Form data kosong!');
                return;
            }
            
            // Hitung skor
            console.log('Menghitung skor...');
            const scoreData = calculateScores(formData);
            console.log('Skor terhitung:', scoreData);
            
            // Generate PDF
            console.log('Membuat PDF...');
            generatePDF(formData, scoreData, pmContext);
            
            console.log('=== EKSPOR PDF SELESAI ===');
            
        } catch (error) {
            console.error('Error saat mengekspor PDF:', error);
            alert('Terjadi kesalahan saat mengekspor PDF: ' + error.message + '\n\nCek console (F12) untuk detail.');
        }
    };

    /**
     * Mengumpulkan semua data dari form yang terisi
     * v2.2 FIX: Perbaikan handler table-wrapper
     */
    function collectFormData() {
        const formData = {
            sections: []
        };

        if (FORM_CONFIG && Array.isArray(FORM_CONFIG)) {
            FORM_CONFIG.forEach((section, sectionIndex) => {
                const sectionData = {
                    title: section.title,
                    items: []
                };

                section.items.forEach((item, itemIndex) => {
                    // Skip table-wrapper tapi process items di dalamnya
                    if (item.type === 'table-wrapper') {
                        console.log(`\n=== Processing table-wrapper ===`);
                        
                        if (item.items && Array.isArray(item.items)) {
                            item.items.forEach((subItem, subIndex) => {
                                console.log(`  Subitem ${subIndex}: ${subItem.no} (${subItem.type})`);
                                
                                const subItemData = {
                                    no: subItem.displayNo || subItem.no || `${itemIndex}.${subIndex + 1}`,
                                    label: subItem.label || subItem.display || '(Tanpa Label)',
                                    type: subItem.type,
                                    answer: null,
                                    score: 0
                                };
                                
                                // Handle table-lokasi dalam wrapper
                                if (subItem.type === 'table-lokasi') {
                                    console.log(`    Processing table-lokasi: ${subItem.no}`);
                                    const lokasiData = [];
                                    
                                    if (subItem.rows && Array.isArray(subItem.rows)) {
                                        subItem.rows.forEach((row) => {
                                            const fieldName = `${subItem.no}_${row.id}`;
                                            const input = document.querySelector(`input[name="${fieldName}"]`);
                                            
                                            if (input && input.value.trim()) {
                                                lokasiData.push(`${row.label}: ${input.value.trim()}`);
                                                console.log(`      ✓ ${row.label} = ${input.value.trim()}`);
                                            } else {
                                                console.log(`      ✗ ${row.label} = (kosong)`);
                                            }
                                        });
                                    }
                                    
                                    if (lokasiData.length > 0) {
                                        subItemData.answer = lokasiData.join('\n');
                                        console.log(`    ✓ ${subItem.no}: ${lokasiData.length} rows collected`);
                                    } else {
                                        // Tetap tambahkan meskipun kosong, tapi beri marker
                                        subItemData.answer = '(Belum diisi)';
                                        console.log(`    ⚠ ${subItem.no}: No data found, added placeholder`);
                                    }
                                    
                                    // PENTING: Tambahkan ke items
                                    sectionData.items.push(subItemData);
                                    console.log(`    → Added to section items (${sectionData.items.length} items total)`);
                                }
                                // Handle table-input dalam wrapper
                                else if (subItem.type === 'table-input') {
                                    console.log(`    Processing table-input: ${subItem.no}`);
                                    const tableData = [];
                                    const numRows = subItem.rows || 4;
                                    const numCols = subItem.columns ? subItem.columns.length : 0;
                                    
                                    console.log(`      Rows: ${numRows}, Cols: ${numCols}`);
                                    
                                    for (let i = 1; i <= numRows; i++) {
                                        const rowValues = [];
                                        
                                        for (let j = 1; j <= numCols; j++) {
                                            const fieldName = `${subItem.no}_row${i}_col${j}`;
                                            const cell = document.querySelector(`input[name="${fieldName}"], select[name="${fieldName}"]`);
                                            
                                            if (cell && cell.value.trim()) {
                                                const colLabel = subItem.columns[j - 1]?.label || `Kolom ${j}`;
                                                rowValues.push(`${colLabel}: ${cell.value.trim()}`);
                                                console.log(`      ✓ Row${i} Col${j} = ${cell.value.trim()}`);
                                            }
                                        }
                                        
                                        if (rowValues.length > 0) {
                                            tableData.push(`Baris ${i}: ${rowValues.join(', ')}`);
                                        }
                                    }
                                    
                                    if (tableData.length > 0) {
                                        subItemData.answer = tableData.join('\n');
                                        console.log(`    ✓ ${subItem.no}: ${tableData.length} rows collected`);
                                    } else {
                                        subItemData.answer = '(Belum diisi)';
                                        console.log(`    ⚠ ${subItem.no}: No data found, added placeholder`);
                                    }
                                    
                                    // PENTING: Tambahkan ke items
                                    sectionData.items.push(subItemData);
                                    console.log(`    → Added to section items (${sectionData.items.length} items total)`);
                                }
                            });
                        }
                        
                        console.log(`=== End table-wrapper (total items now: ${sectionData.items.length}) ===\n`);
                        return; // Skip adding wrapper itself
                    }
                    
                    // Process normal items (non-wrapper)
                    const itemData = {
                        no: item.displayNo || item.no || (itemIndex + 1),
                        label: item.label || '(Tanpa Label)',
                        type: item.type,
                        answer: null,
                        score: 0
                    };

                    switch(item.type) {
                        case 'rwChoice4':
                            const rwAnswers = [];
                            let totalScore = 0;
                            let countAnswered = 0;

                            for (let rwIndex = 1; rwIndex <= 4; rwIndex++) {
                                const radioValue = document.querySelector(`input[name="${item.no}_${rwIndex}"]:checked`);
                                if (radioValue) {
                                    const value = radioValue.value;
                                    const score = item.scores[value] || 0;
                                    const optionIndex = value.charCodeAt(0) - 97;
                                    const rwLetter = String.fromCharCode(64 + rwIndex);
                                    const optionText = item.rws[optionIndex];
                                    
                                    rwAnswers.push(`RW ${rwLetter}: ${optionText} (${score * 100}%)`);
                                    totalScore += score * item.weight;
                                    countAnswered++;
                                }
                            }

                            if (rwAnswers.length > 0) {
                                itemData.answer = rwAnswers.join('\n');
                                itemData.score = totalScore;
                            }
                            break;

                        case 'kader10':
                            const kaderAnswers = [];
                            let kaderCount = 0;

                            for (let i = 1; i <= 10; i++) {
                                const kaderInput = document.querySelector(`input[name="${item.no}_${i}"]`);
                                if (kaderInput && kaderInput.value.trim()) {
                                    kaderAnswers.push(`Kader ${i}: ${kaderInput.value.trim()}`);
                                    kaderCount++;
                                }
                            }

                            const extraKaders = document.querySelector(`textarea[name="${item.no}_11_plus"]`);
                            if (extraKaders && extraKaders.value.trim()) {
                                const additionalKaders = extraKaders.value.trim()
                                    .split(/[\n,]+/)
                                    .filter(k => k.trim())
                                    .map((kader, idx) => `Kader ${11 + idx}: ${kader.trim()}`);
                                
                                kaderAnswers.push(...additionalKaders);
                                kaderCount += additionalKaders.length;
                            }

                            if (kaderAnswers.length > 0) {
                                itemData.answer = kaderAnswers.join('\n');
                                itemData.score = (kaderCount < 4 ? 0.25 : 
                                                kaderCount < 8 ? 0.50 :
                                                kaderCount < 11 ? 0.75 : 1.00) * item.weight;
                            }
                            break;

                        case 'table-lokasi':
                            console.log(`Processing standalone table-lokasi: ${item.no}`);
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
                            
                            if (lokasiData.length > 0) {
                                itemData.answer = lokasiData.join('\n');
                            }
                            break;

                        case 'conditional-table':
                        case 'table-input':
                        case 'table-input-2col':
                        case 'table-input-5col':
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
                                        
                                        if (cell && cell.value.trim()) {
                                            const colLabel = item.columns[j - 1]?.label || `Kolom ${j}`;
                                            rowValues.push(`${colLabel}: ${cell.value.trim()}`);
                                        }
                                    }
                                    
                                    if (rowValues.length > 0) {
                                        tableData.push(`${rowLabel}\n  ${rowValues.join(', ')}`);
                                    }
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
                                        
                                        if (cell && cell.value.trim()) {
                                            const colLabel = item.columns[j - 1]?.label || `Kolom ${j}`;
                                            rowValues.push(`${colLabel}: ${cell.value.trim()}`);
                                        }
                                    }
                                    
                                    if (rowValues.length > 0) {
                                        tableData.push(`Baris ${i}: ${rowValues.join(', ')}`);
                                    }
                                }
                            }
                            else {
                                const cells = document.querySelectorAll(`input[name^="${item.no}_row"], select[name^="${item.no}_row"]`);
                                cells.forEach(cell => {
                                    if (cell.value.trim()) {
                                        const match = cell.name.match(/row(\d+)_col?(\d*)/);
                                        if (match) {
                                            const [_, row, col] = match;
                                            tableData.push(`Baris ${row}${col ? `, Kolom ${col}` : ''}: ${cell.value.trim()}`);
                                        }
                                    }
                                });
                            }
                            
                            if (tableData.length > 0) {
                                itemData.answer = tableData.join('\n');
                            }
                            break;

                        case 'radio':
                            const selectedRadio = document.querySelector(`input[name="${item.no}"]:checked`);
                            if (selectedRadio) {
                                const option = item.options.find(opt => opt.value === selectedRadio.value);
                                if (option) {
                                    itemData.answer = option.label;
                                    itemData.score = (option.score || 0) * item.weight;
                                }
                            }
                            break;

                        case 'checkbox':
                            const selectedBoxes = document.querySelectorAll(`input[name="${item.no}"]:checked`);
                            if (selectedBoxes.length > 0) {
                                const selectedLabels = Array.from(selectedBoxes).map(cb => {
                                    const option = item.options.find(opt => opt.value === cb.value);
                                    return option ? option.label : cb.value;
                                });
                                itemData.answer = selectedLabels.join('\n');
                                
                                let score = 0;
                                const totalSelected = selectedBoxes.length;

                                if (item.no === '2') {
                                    if (totalSelected === 1) score = 0.25;
                                    else if (totalSelected >= 2 && totalSelected <= 3) score = 0.50;
                                    else if (totalSelected >= 4 && totalSelected <= 5) score = 0.75;
                                    else if (totalSelected >= 6) score = 1.0;
                                    score = score * 2;
                                }
                                else if (item.no === '3') {
                                    if (totalSelected === 1) score = 0.5;
                                    else if (totalSelected === 2) score = 1.0;
                                    else if (totalSelected === 3) score = 1.5;
                                    else if (totalSelected >= 4) score = 2.0;
                                }
                                else if (item.no === '5') {
                                    if (totalSelected === 1) score = 0.25;
                                    else if (totalSelected === 2) score = 0.50;
                                    else if (totalSelected === 3) score = 0.75;
                                    else if (totalSelected >= 4) score = 1.00;
                                    score = score * 2;
                                }
                                else if (item.no === '6') {
                                    if (totalSelected === 1) score = 0.5;
                                    else if (totalSelected === 2) score = 1.0;
                                    else if (totalSelected === 3) score = 1.5;
                                    else if (totalSelected >= 4) score = 2.0;
                                }
                                else if (item.no === '7') {
                                    if (totalSelected === 1) score = 0.25;
                                    else if (totalSelected === 2) score = 0.50;
                                    else if (totalSelected === 3) score = 0.75;
                                    else if (totalSelected >= 4) score = 1.00;
                                    score = score * 2;
                                }
                                else if (item.no === '8') {
                                    score = Math.min(totalSelected * 0.5, 2.0);
                                }
                                else if (item.no === '9') {
                                    score = Math.min(totalSelected * 0.5, 2.0);
                                }
                                else {
                                    if (totalSelected === 1) score = 0.25;
                                    else if (totalSelected === 2) score = 0.50;
                                    else if (totalSelected === 3) score = 0.75;
                                    else if (totalSelected >= 4) score = 1.00;
                                    score = score * (item.weight || 0);
                                }

                                itemData.score = score;
                            }
                            break;
                    }

                    // Add item if it has answer OR if it's a required field type
                    if (itemData.answer !== null) {
                        sectionData.items.push(itemData);
                    }
                });

                if (sectionData.items.length > 0) {
                    formData.sections.push(sectionData);
                    console.log(`Section "${sectionData.title}" added with ${sectionData.items.length} items`);
                }
            });
        }

        return formData;
    }

    /**
     * Menghitung skor berdasarkan data form
     */
    function calculateScores(formData) {
        const scoreData = {
            sectionScores: {},
            totalScore: 0,
            maxScore: 0,
            percentage: 0,
            category: '',
            passingStatus: ''
        };

        const SECTION_MAX_SCORES = window.SECTION_MAX_SCORES || {
            'A. KEPEMIMPINAN DALAM PENGELOLAAN LINGKUNGAN': 10,
            'B. KELEMBAGAAN DAN PARTISIPASI MASYARAKAT': 20,
            'C. PENGELOLAAN SAMPAH': 160,
            'D. PENGELOLAAN RUANG TERBUKA HIJAU': 40,
            'E. KONSERVASI ENERGI': 40,
            'F. KONSERVASI AIR': 40
        };

        const pmContext = JSON.parse(localStorage.getItem('pm_context') || '{}');
        const targetCategory = (pmContext.menuju_kategori || '').toLowerCase();

        console.log('Menghitung skor...');
        console.log('Target category:', targetCategory);

        formData.sections.forEach(section => {
            let sectionScore = 0;
            let itemCount = 0;
            
            section.items.forEach(item => {
                if (item.score) {
                    sectionScore += item.score;
                    itemCount++;
                }
            });
            
            const maxScore = SECTION_MAX_SCORES[section.title] || 0;
            
            scoreData.sectionScores[section.title] = sectionScore;
            scoreData.totalScore += sectionScore;
            scoreData.maxScore += maxScore;
            
            console.log(`  ${section.title}: ${sectionScore.toFixed(2)} (dari ${itemCount} item, max ${maxScore})`);
        });

        scoreData.percentage = (scoreData.totalScore / scoreData.maxScore) * 100;

        if (targetCategory) {
            scoreData.category = targetCategory.charAt(0).toUpperCase() + targetCategory.slice(1);
            
            const PASSING_CRITERIA = {
                'pratama': 110.5,
                'madya': 167.5,
                'mandiri': 232.5
            };

            const requiredScore = PASSING_CRITERIA[targetCategory];
            if (requiredScore) {
                scoreData.passingStatus = scoreData.totalScore >= requiredScore ? 'LOLOS' : 'TIDAK LOLOS';
                scoreData.category += ` (${scoreData.passingStatus})`;
            }
        } else {
            scoreData.category = 'Belum ada target kategori';
        }
        
        return scoreData;
    }

    /**
     * Encode special characters to ensure they display properly in PDF
     */
    function encodeSpecialChars(text) {
        if (!text) return text;
        
        // Create a mapping of special characters to their UTF-8 equivalents
        // This ensures they render properly in PDF
        return text
            .replace(/≤/g, '<=')      // Less than or equal
            .replace(/≥/g, '>=')      // Greater than or equal
            .replace(/—/g, '-')       // Em dash
            .replace(/–/g, '-')       // En dash
            .replace(/"/g, '"')       // Left double quote
            .replace(/"/g, '"')       // Right double quote
            .replace(/'/g, "'")       // Left single quote
            .replace(/'/g, "'")       // Right single quote
            .replace(/•/g, '•')       // Bullet point
            .replace(/…/g, '...');    // Ellipsis
    }

    /**
     * Generate PDF dengan styling yang bagus
     */
    function generatePDF(formData, scoreData, pmContext) {
        const { jsPDF } = jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Use Arial font which supports special characters better
        // If Arial is not available, use Times
        try {
            doc.setFont('arial');
        } catch (e) {
            doc.setFont('times');
        }

        // ========== HEADER ==========
        doc.setFontSize(18);
        doc.setTextColor(0, 100, 0);
        doc.text('PENILAIAN MANDIRI', 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('FORMULIR BERSERI', 105, 28, { align: 'center' });

        // ========== DATA AWAL SECTION ==========
        let yPos = 40;
        doc.setFontSize(14);
        doc.setTextColor(0, 100, 0);
        doc.rect(20, yPos, 170, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text('DATA AWAL', 105, yPos + 5.5, { align: 'center' });
        yPos += 12;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);

        const initialDataTable = [
            ['Jenis Wilayah', `: ${encodeSpecialChars(pmContext.jenis_wilayah || '-')}`],
            ['Nama Wilayah', `: ${encodeSpecialChars(pmContext.nama_wilayah || '-')}`],
            ['Kecamatan', `: ${encodeSpecialChars(pmContext.kecamatan || '-')}`],
            ['Kabupaten/Kota', `: ${encodeSpecialChars(pmContext.kabkota || '-')}`],
            ['Menuju Kategori', `: ${encodeSpecialChars((pmContext.menuju_kategori || '-').toUpperCase())}`],
            ['Total RW', `: ${encodeSpecialChars(pmContext.total_rw || '-')}`],
            ['Total RT', `: ${encodeSpecialChars(pmContext.total_rt || '-')}`],
            ['RW yang Dikelola', `: ${encodeSpecialChars(pmContext.kelola_rw || '-')}`],
            ['RT yang Dikelola', `: ${encodeSpecialChars(pmContext.kelola_rt || '-')}`]
        ];

        doc.autoTable({
            startY: yPos,
            head: [],
            body: initialDataTable,
            theme: 'plain',
            styles: {
                fontSize: 10,
                cellPadding: 4
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 50 },
                1: { cellWidth: 130 }
            },
            margin: { left: 20, right: 20 }
        });

        yPos = doc.lastAutoTable.finalY + 10;

        // ========== RINGKASAN SKOR ==========
        doc.setFillColor(0, 128, 0);
        doc.rect(20, yPos, 170, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.text('RINGKASAN SKOR', 105, yPos + 5.5, { align: 'center' });
        yPos += 12;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);

        const SECTION_MAX_SCORES = window.SECTION_MAX_SCORES || {
            'A. KEPEMIMPINAN DALAM PENGELOLAAN LINGKUNGAN': 10,
            'B. KELEMBAGAAN DAN PARTISIPASI MASYARAKAT': 20,
            'C. PENGELOLAAN SAMPAH': 160,
            'D. PENGELOLAAN RUANG TERBUKA HIJAU': 40,
            'E. KONSERVASI ENERGI': 40,
            'F. KONSERVASI AIR': 40
        };

        const scoreRows = Object.entries(scoreData.sectionScores).map(([section, score]) => {
            const maxScore = SECTION_MAX_SCORES[section] || 0;
            return [
                `${encodeSpecialChars(section)} (max: ${maxScore})`,
                score.toFixed(2)
            ];
        });

        scoreRows.push(
            ['', ''],
            ['TOTAL SKOR (max: 310)', scoreData.totalScore.toFixed(2)],
            ['PERSENTASE', `${scoreData.percentage.toFixed(2)}%`],
            ['KATEGORI', encodeSpecialChars(scoreData.category || 'Belum ditentukan')]
        );

        doc.autoTable({
            startY: yPos,
            head: [],
            body: scoreRows,
            theme: 'plain',
            styles: {
                fontSize: 10,
                cellPadding: 4
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 130 },
                1: { cellWidth: 40, halign: 'right' }
            },
            margin: { left: 20, right: 20 }
        });

        yPos = doc.lastAutoTable.finalY + 10;

        // ========== DETAIL PENILAIAN ==========
        formData.sections.forEach((section, sectionIndex) => {
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFillColor(0, 128, 0);
            doc.rect(20, yPos, 170, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(11);
            doc.text(section.title, 105, yPos + 5.5, { align: 'center' });
            yPos += 12;

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);

            const itemRows = section.items.map(item => {
                // Tipe-tipe table yang tidak perlu nomor (hanya tampilkan label)
                const tableTypes = ['table-input', 'table-lokasi', 'conditional-table', 
                                   'table-input-5col', 'table-input-2col'];
                
                // Format item text: table types tanpa nomor, yang lain dengan nomor
                let itemText;
                if (tableTypes.includes(item.type)) {
                    itemText = item.label;  // ✅ Hanya label, tanpa nomor
                } else {
                    itemText = `${item.no}. ${item.label}`;  // Dengan nomor
                }
                
                let answer = item.answer || '(Belum diisi)';
                
                // Special handling for checkbox - keep each item on separate line
                if (item.type === 'checkbox') {
                    // answer already has newlines from collection, keep them as-is
                    // Don't convert to comma, maintain line breaks for clarity
                }
                // Special handling for rwChoice4 (RW A, B, C, D answers)
                else if (item.type === 'rwChoice4') {
                    // Keep line breaks for rwChoice4 to show each RW answer on a separate line
                    // Trim whitespace to prevent overflow
                    const lines = answer.split('\n');
                    answer = lines.map(line => {
                        // Clean up line - remove extra spaces but keep structure
                        return line.trim();
                    }).join('\n');
                }
                // Special handling for table inputs
                else if (section.title.startsWith('C.') && (item.type === 'table-input' || item.type === 'table-input-2col')) {
                    const rows = answer.split('\n');
                    answer = rows.map(row => {
                        const match = row.match(/Baris \d+(?:, Kolom \d+)?: (.+)/);
                        return match ? match[1].trim() : row.trim();
                    }).join('\n');
                }
                
                // For non-table-input types, preserve newlines for better readability
                // Only convert to comma if necessary
                if (item.type !== 'rwChoice4' && item.type !== 'checkbox' && item.type !== 'table-input' && 
                    item.type !== 'table-lokasi' && item.type !== 'conditional-table' && 
                    item.type !== 'table-input-5col' && item.type !== 'table-input-2col') {
                    answer = answer.replace(/\n/g, ', ');
                }
                
                // Encode special characters for PDF compatibility
                answer = encodeSpecialChars(answer);
                itemText = encodeSpecialChars(itemText);
                
                return [itemText, answer];
            });

            doc.autoTable({
                startY: yPos,
                head: [],
                body: itemRows,
                theme: 'grid',
                styles: {
                    fontSize: 8,
                    cellPadding: 2.5,
                    valign: 'top',
                    overflow: 'linebreak',
                    halign: 'left',
                    lineColor: [150, 150, 150],
                    lineWidth: 0.5
                },
                columnStyles: {
                    0: { 
                        fontStyle: 'bold', 
                        cellWidth: 65,
                        minCellHeight: 10,
                        textColor: [0, 0, 0]
                    },
                    1: { 
                        cellWidth: 105,
                        minCellHeight: 10,
                        valign: 'top', 
                        overflow: 'linebreak', 
                        halign: 'left',
                        textColor: [0, 80, 0]
                    }
                },
                margin: { left: 20, right: 20 },
                bodyStyles: {
                    lineWidth: 0.5,
                    lineColor: [150, 150, 150]
                },
                didDrawPage: function(data) {
                    // Add page number if needed
                },
                didDrawCell: function(data) {
                    // Ensure proper cell sizing
                    if (data.cell.section === 'body') {
                        // Ensure cells have proper height for wrapped content
                        const textLines = data.cell.text || [];
                        const lineCount = textLines.length || 1;
                        data.cell.height = Math.max(8, lineCount * 3.5 + 2);
                    }
                }
            });

            yPos = doc.lastAutoTable.finalY + 10;
        });

        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text(
            `Dicetak pada: ${new Date().toLocaleString('id-ID')}`,
            105,
            285,
            { align: 'center' }
        );

        const fileName = `Penilaian_${pmContext.nama_wilayah || 'BERSERI'}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    }

})();

// ========== AUTO-ADD EXPORT BUTTON ==========
// Button akan muncul HANYA di halaman terakhir (section G)
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('formPM');
    if (!form) return;

    // Tunggu sebentar untuk memastikan DOM sudah siap
    setTimeout(function() {
        // Cari container tombol Submit yang ada di dalam navigation
        const submitBtn = document.getElementById('submitForm');
        if (!submitBtn) {
            console.log('⚠ Submit button not found, retrying...');
            return;
        }

        const submitContainer = submitBtn.parentElement;
        if (!submitContainer) return;

        // Check jika button sudah ada
        if (document.querySelector('.btn-export-pdf')) {
            console.log('⚠ Export button already exists');
            return;
        }

        // Create export button
        const exportBtn = document.createElement('button');
        exportBtn.type = 'button';
        exportBtn.className = 'btn btn-secondary btn-export-pdf';
        exportBtn.style.backgroundColor = '#DC2626';
        exportBtn.style.color = 'white';
        exportBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Ekspor ke PDF
        `;
        exportBtn.onclick = window.exportPenilaianToPDF;

        // PENTING: Button harus hidden by default, hanya show di halaman terakhir
        exportBtn.classList.add('hidden');

        // Tambahkan button SEBELUM tombol Kirim
        submitContainer.insertBefore(exportBtn, submitContainer.firstChild);
        
        console.log('✓ Export button added (will show only on final page)');

        // Setup visibility control - show/hide based on current step
        function updateExportButtonVisibility() {
            const allSteps = form.querySelectorAll('[data-step]');
            const totalSteps = allSteps.length;
            let currentStepIndex = -1;

            // Find current visible step
            allSteps.forEach((step, index) => {
                if (!step.classList.contains('hidden')) {
                    currentStepIndex = index;
                }
            });

            // Show button only on last step (index = totalSteps - 1)
            if (currentStepIndex === totalSteps - 1) {
                exportBtn.classList.remove('hidden');
            } else {
                exportBtn.classList.add('hidden');
            }
        }

        // Initial check
        updateExportButtonVisibility();

        // Listen for step changes via navigation buttons
        const prevBtn = document.getElementById('prevStep');
        const nextBtn = document.getElementById('nextStep');

        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                setTimeout(updateExportButtonVisibility, 150);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                setTimeout(updateExportButtonVisibility, 150);
            });
        }

        // Listen for step indicator/label clicks (A, B, C, D, E, F, G)
        // Try multiple selectors to ensure we catch all step navigation
        function attachStepListeners() {
            // Selector 1: .step-label (step indicators)
            const stepLabels = document.querySelectorAll('.step-label');
            console.log(`Found ${stepLabels.length} step labels`);
            
            stepLabels.forEach((label, index) => {
                label.addEventListener('click', function() {
                    console.log(`Step label ${index} clicked`);
                    setTimeout(updateExportButtonVisibility, 150);
                });
            });

            // Selector 2: button dengan role="button" di step dots area
            const stepDots = document.querySelectorAll('[role="button"][aria-label*="section"]');
            console.log(`Found ${stepDots.length} step dots`);
            
            stepDots.forEach((dot, index) => {
                dot.addEventListener('click', function() {
                    console.log(`Step dot ${index} clicked`);
                    setTimeout(updateExportButtonVisibility, 150);
                });
            });

            // Selector 3: Semua button di dalam dots wrapper
            const dotsWrapper = document.getElementById('dotsWrap');
            if (dotsWrapper) {
                const allButtons = dotsWrapper.querySelectorAll('button, span[role="button"]');
                console.log(`Found ${allButtons.length} buttons in dotsWrap`);
                
                allButtons.forEach((btn, index) => {
                    btn.addEventListener('click', function() {
                        console.log(`Dots wrapper button ${index} clicked`);
                        setTimeout(updateExportButtonVisibility, 150);
                    });
                });
            }
        }

        // Attach listeners immediately
        attachStepListeners();

        // Also use MutationObserver to detect step changes
        // This catches ANY change to step visibility
        const observerConfig = {
            attributes: true,
            attributeFilter: ['class'],
            subtree: true
        };

        const observer = new MutationObserver(function(mutations) {
            let stepChanged = false;
            
            mutations.forEach(function(mutation) {
                if (mutation.target.hasAttribute('data-step')) {
                    // A step element's class changed (hidden/visible toggle)
                    stepChanged = true;
                }
            });

            if (stepChanged) {
                console.log('Step change detected by MutationObserver');
                setTimeout(updateExportButtonVisibility, 100);
            }
        });

        // Observe the form for any class changes on step elements
        const allSteps = form.querySelectorAll('[data-step]');
        allSteps.forEach(step => {
            observer.observe(step, observerConfig);
        });

        console.log('✓ Export button visibility control active (with MutationObserver)');

    }, 500); // Tunggu 500ms untuk memastikan DOM sudah loaded
});

console.log('✓ PDF Export v2.4.1 FINAL: Ready - works with ALL navigation methods!');