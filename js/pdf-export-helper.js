/* ===============================================================
   HELPER SCRIPT - Expose Config untuk PDF Export
   File ini membantu mengekspos FORM_CONFIG ke window scope
   Tambahkan SETELAH penilaian-mandiri-static.js
   =============================================================== */

(function() {
    'use strict';

    console.log('🔧 PDF Export Helper: Initializing...');

    /**
     * Fungsi untuk mengekspor variabel dari closure ke window scope
     * Jalankan ini setelah penilaian-mandiri-static.js dimuat
     */
    function exposeConfigToWindow() {
        // Coba cari FORM_CONFIG dari berbagai lokasi
        
        // Method 1: Cek apakah sudah ada di window
        if (window.FORM_CONFIG) {
            console.log('✓ FORM_CONFIG sudah tersedia di window scope');
            return;
        }

        // Method 2: Coba ambil dari localStorage jika ada
        try {
            const storedConfig = localStorage.getItem('FORM_CONFIG');
            if (storedConfig) {
                window.FORM_CONFIG = JSON.parse(storedConfig);
                console.log('✓ FORM_CONFIG loaded from localStorage');
                return;
            }
        } catch (e) {
            console.log('⚠ FORM_CONFIG tidak ada di localStorage');
        }

        // Method 3: Cek apakah bisa diakses dari scope lain
        // (Ini hanya akan bekerja jika penilaian-mandiri-static.js sudah expose-nya)
        console.log('⚠ FORM_CONFIG perlu di-expose dari penilaian-mandiri-static.js');
        console.log('   Lihat file PANDUAN-INSTALASI.md untuk cara memperbaiki ini');
    }

    /**
     * Fungsi untuk me-monitor form dan mengumpulkan data
     * Ini adalah backup strategy jika FORM_CONFIG tidak bisa diakses
     */
    function monitorFormState() {
        const form = document.getElementById('formPM') || document.querySelector('form');
        if (!form) {
            console.log('⚠ Form belum dimuat, akan retry...');
            setTimeout(monitorFormState, 500);
            return;
        }

        console.log('✓ Form ditemukan, monitoring aktif');

        // Tambahkan event listener untuk perubahan form
        form.addEventListener('change', function(e) {
            // Store form state ke localStorage sebagai backup
            try {
                const formState = {};
                const inputs = form.querySelectorAll('input, textarea, select');
                
                inputs.forEach(input => {
                    if (input.name) {
                        if (input.type === 'radio' || input.type === 'checkbox') {
                            if (input.checked) {
                                if (!formState[input.name]) formState[input.name] = [];
                                formState[input.name].push(input.value);
                            }
                        } else {
                            formState[input.name] = input.value;
                        }
                    }
                });

                localStorage.setItem('form_state_backup', JSON.stringify(formState));
            } catch (e) {
                // Silent fail
            }
        });
    }

    // Initialize saat DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() {
                exposeConfigToWindow();
                monitorFormState();
            }, 1000); // Tunggu 1 detik untuk memastikan script lain sudah load
        });
    } else {
        setTimeout(function() {
            exposeConfigToWindow();
            monitorFormState();
        }, 1000);
    }

    console.log('✓ PDF Export Helper: Ready');
})();
