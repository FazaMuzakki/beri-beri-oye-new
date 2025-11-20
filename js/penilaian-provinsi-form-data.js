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

// Fungsi untuk memperbarui data kabupaten/kota dari local storage
function updateKabkotaData() {
    // Ambil data dari selected_prov_assessment dan prov_context
    const selectedAssessment = JSON.parse(localStorage.getItem('selected_prov_assessment') || '{}');
    const provContext = JSON.parse(localStorage.getItem('prov_context') || '{}');
    
    // Update wilayah
    const wilayahEl = document.getElementById('wilayahKabkota');
    if (wilayahEl) {
        if (selectedAssessment.wilayah_nilai && selectedAssessment.nama_kabkota) {
            wilayahEl.textContent = `${selectedAssessment.wilayah_nilai.jenis_wilayah} ${selectedAssessment.wilayah_nilai.nama_wilayah}, Kec. ${selectedAssessment.wilayah_nilai.kecamatan}, ${selectedAssessment.nama_kabkota}`;
        } else if (provContext.wilayah) {
            wilayahEl.textContent = provContext.wilayah;
        }
    }

    // Update verifikator
    const verifikatorEl = document.getElementById('verifikatorKabkota');
    if (verifikatorEl && selectedAssessment.verifikator) {
        verifikatorEl.innerHTML = selectedAssessment.verifikator.map(v => `<p>${v}</p>`).join('');
    }

    // Update status
    const statusEl = document.getElementById('statusKabkota');
    if (statusEl) {
        if (selectedAssessment.menuju_kategori) {
            const status = selectedAssessment.menuju_kategori.charAt(0).toUpperCase() + 
                          selectedAssessment.menuju_kategori.slice(1).toLowerCase();
            statusEl.textContent = status;
        } else if (provContext.menuju_kategori) {
            const status = provContext.menuju_kategori.charAt(0).toUpperCase() + 
                          provContext.menuju_kategori.slice(1).toLowerCase();
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
        const scoreKabkotaEl = document.getElementById(`component${comp}Kabkota`);
        if (scoreKabkotaEl) {
            if (selectedAssessment.componentScores && selectedAssessment.componentScores[componentNames[comp]]) {
                scoreKabkotaEl.textContent = selectedAssessment.componentScores[componentNames[comp]].toFixed(2);
            } else if (provContext[`skor_${comp.toLowerCase()}`]) {
                scoreKabkotaEl.textContent = provContext[`skor_${comp.toLowerCase()}`].toFixed(2);
            } else {
                scoreKabkotaEl.textContent = '0.00';
            }
        }
    });

    // Update total skor mandiri
    const totalScoreKabkotaEl = document.getElementById('totalSkorKabkota');
    if (totalScoreKabkotaEl) {
        if (selectedAssessment.totalScore) {
            totalScoreKabkotaEl.textContent = selectedAssessment.totalScore.toFixed(2);
        } else if (provContext.total_skor) {
            totalScoreKabkotaEl.textContent = provContext.total_skor.toFixed(2);
        } else {
            totalScoreKabkotaEl.textContent = '0.00';
        }
    }

    // Update last updated time
    const lastUpdatedEl = document.getElementById('lastUpdated');
    if (lastUpdatedEl && provContext.last_updated) {
        lastUpdatedEl.textContent = formatDate(provContext.last_updated);
    } else if (lastUpdatedEl) {
        const now = new Date();
        lastUpdatedEl.textContent = formatDate(now);
    }
}

// Initialize data when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Get selected assessment
    const selectedAssessment = JSON.parse(localStorage.getItem('selected_prov_assessment') || '{}');
    
    // Get current prov_context
    let provContext = JSON.parse(localStorage.getItem('prov_context') || '{}');
    
    // If we have a selected assessment, update prov_context with its data
    if (selectedAssessment.id) {
        provContext = {
            ...provContext,
            wilayah: `${selectedAssessment.wilayah_nilai.jenis_wilayah} ${selectedAssessment.wilayah_nilai.nama_wilayah}, Kec. ${selectedAssessment.wilayah_nilai.kecamatan}, ${selectedAssessment.nama_kabkota}`,
            verifikator: selectedAssessment.verifikator,
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
        localStorage.setItem('prov_context', JSON.stringify(provContext));
    }
    
    // Update display
    updateKabkotaData();
    
    // Initialize form rendering
    if (typeof render === 'function') {
        render();
    } else {
        console.error('render() function not found');
    }
});

// Update display every 30 seconds
setInterval(updateKabkotaData, 30000);