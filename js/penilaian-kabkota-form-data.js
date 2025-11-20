// Fungsi untuk memformat tanggal
function formatDate(date) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(date).toLocaleDateString('id-ID', options);
}

// Fungsi untuk memperbarui data mandiri dari local storage
function updateMandiriData() {
    // Ambil data dari kabkota_selected_assessment dan pm_context
    const selectedAssessment = JSON.parse(localStorage.getItem('kabkota_selected_assessment') || '{}');
    const pmContext = JSON.parse(localStorage.getItem('pm_context') || '{}');
    
    // Update wilayah
    const wilayahEl = document.getElementById('wilayahMandiri');
    if (wilayahEl) {
        if (selectedAssessment.jenis_wilayah && selectedAssessment.nama_wilayah) {
            wilayahEl.textContent = `${selectedAssessment.jenis_wilayah} ${selectedAssessment.nama_wilayah}, Kec. ${selectedAssessment.kecamatan}, ${selectedAssessment.kabkota}`;
        } else if (pmContext.wilayah) {
            wilayahEl.textContent = pmContext.wilayah;
        }
    }

    // Update status
    const statusEl = document.getElementById('statusMandiri');
    if (statusEl) {
        if (selectedAssessment.menuju_kategori) {
            const status = selectedAssessment.menuju_kategori.charAt(0).toUpperCase() + 
                          selectedAssessment.menuju_kategori.slice(1).toLowerCase();
            statusEl.textContent = status;
        } else if (pmContext.menuju_kategori) {
            const status = pmContext.menuju_kategori.charAt(0).toUpperCase() + 
                          pmContext.menuju_kategori.slice(1).toLowerCase();
            statusEl.textContent = status;
        }
    }

    // Update skor komponen
    const components = ['A', 'B', 'C', 'D', 'E', 'F'];
    const componentNames = {
        'A': 'kepemimpinan',
        'B': 'kelembagaan',
        'C': 'sampah',
        'D': 'rth',
        'E': 'energi',
        'F': 'air'
    };

    components.forEach(comp => {
        const scoreMandiriEl = document.getElementById(`component${comp}Mandiri`);
        if (scoreMandiriEl) {
            if (selectedAssessment.componentScores && selectedAssessment.componentScores[componentNames[comp]]) {
                scoreMandiriEl.textContent = selectedAssessment.componentScores[componentNames[comp]].toFixed(2);
            } else if (pmContext[`skor_${comp.toLowerCase()}`]) {
                scoreMandiriEl.textContent = pmContext[`skor_${comp.toLowerCase()}`].toFixed(2);
            } else {
                scoreMandiriEl.textContent = '0.00';
            }
        }
    });

    // Update total skor mandiri
    const totalScoreMandiriEl = document.getElementById('totalSkorMandiri');
    if (totalScoreMandiriEl) {
        if (selectedAssessment.totalScore) {
            totalScoreMandiriEl.textContent = selectedAssessment.totalScore.toFixed(2);
        } else if (pmContext.total_skor) {
            totalScoreMandiriEl.textContent = pmContext.total_skor.toFixed(2);
        } else {
            totalScoreMandiriEl.textContent = '0.00';
        }
    }

    // Update last updated time
    const lastUpdatedEl = document.getElementById('lastUpdated');
    if (lastUpdatedEl && pmContext.last_updated) {
        lastUpdatedEl.textContent = formatDate(pmContext.last_updated);
    } else if (lastUpdatedEl) {
        const now = new Date();
        lastUpdatedEl.textContent = formatDate(now);
    }
}

// Initialize data when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Get selected assessment
    const selectedAssessment = JSON.parse(localStorage.getItem('kabkota_selected_assessment') || '{}');
    
    // Get current pm_context
    let pmContext = JSON.parse(localStorage.getItem('kabkota_pm_context') || '{}');
    
    // If we have a selected assessment, update pm_context with its data
    if (selectedAssessment.id) {
        pmContext = {
            ...pmContext,
            wilayah: `${selectedAssessment.jenis_wilayah} ${selectedAssessment.nama_wilayah}, Kec. ${selectedAssessment.kecamatan}, ${selectedAssessment.kabkota}`,
            menuju_kategori: selectedAssessment.menuju_kategori,
            total_skor: selectedAssessment.totalScore,
            skor_a: selectedAssessment.componentScores?.kepemimpinan || 0,
            skor_b: selectedAssessment.componentScores?.kelembagaan || 0,
            skor_c: selectedAssessment.componentScores?.sampah || 0,
            skor_d: selectedAssessment.componentScores?.rth || 0,
            skor_e: selectedAssessment.componentScores?.energi || 0,
            skor_f: selectedAssessment.componentScores?.air || 0
        };
        
        // Save updated context
        localStorage.setItem('kabkota_pm_context', JSON.stringify(pmContext));
    }
    
    // Update display
    updateMandiriData();
});

// Update display every 30 seconds
setInterval(updateMandiriData, 30000);