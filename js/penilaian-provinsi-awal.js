// List Manager for handling filtering, sorting, and display of assessments
class ListManager {
    constructor() {
        this.elements = {
            searchInput: document.getElementById('searchKabKota'),
            categoryFilter: document.getElementById('categoryFilter'),
            sortOption: document.getElementById('sortOption'),
            listPenilaian: document.getElementById('listPenilaian'),
            emptyState: document.getElementById('emptyState'),
            selectedPreview: document.getElementById('selectedPreview'),
            lanjutBtn: document.getElementById('lanjutBtn'),
            refreshBtn: document.getElementById('refreshList')
        };

        this.selectedAssessment = null;
        this.currentFilters = {
            search: '',
            category: '',
            sort: 'date-desc'
        };

        this.initializeEventListeners();
        this.initializeDummyData();
    }

    initializeDummyData() {
        const dummySubmissions = [
            {
                id: 'prov-001',
                nama_kabkota: 'JOMBANG',
                wilayah_nilai: {
                    jenis_wilayah: 'Desa',
                    nama_wilayah: 'SUDIMORO',
                    kecamatan: 'MEGALUH'
                },
                menuju_kategori: 'mandiri',
                totalScore: 265,
                submitted_at: '2023-10-01',
                status: 'submitted',
                componentScores: {
                    kepemimpinan: 10,
                    kelembagaan: 20,
                    sampah: 120,
                    rth: 40,
                    energi: 40,
                    air: 35
                },
                verifikator: [
                    'Ir. Ahmad Subandi, M.M.',
                    'Drs. Bambang Sugianto',
                    'Hj. Sri Wahyuni, S.T.'
                ]
            },
            {
                id: 'prov-002',
                nama_kabkota: 'MALANG',
                wilayah_nilai: {
                    jenis_wilayah: 'Kelurahan',
                    nama_wilayah: 'KAUMAN',
                    kecamatan: 'KLOJEN'
                },
                menuju_kategori: 'madya',
                totalScore: 198,
                submitted_at: '2023-10-05',
                status: 'submitted',
                componentScores: {
                    kepemimpinan: 10,
                    kelembagaan: 18,
                    sampah: 80,
                    rth: 30,
                    energi: 30,
                    air: 30
                },
                verifikator: [
                    'Dr. Eko Purnomo, M.Env.',
                    'Ir. Siti Aminah, M.Si.',
                    'H. Supriadi, S.E.'
                ]
            },
            {
                id: 'prov-003',
                nama_kabkota: 'BOJONEGORO',
                wilayah_nilai: {
                    jenis_wilayah: 'Desa',
                    nama_wilayah: 'SUMBERAGUNG',
                    kecamatan: 'DANDER'
                },
                menuju_kategori: 'pratama',
                totalScore: 125,
                submitted_at: '2023-10-08',
                status: 'submitted',
                componentScores: {
                    kepemimpinan: 10,
                    kelembagaan: 15,
                    sampah: 60,
                    rth: 20,
                    energi: 10,
                    air: 10
                },
                verifikator: [
                    'Dra. Retno Widyastuti',
                    'H. Agus Santoso, M.M.',
                    'Ir. Hadi Supriyanto'
                ]
            }
        ];
        
        localStorage.setItem('prov_submissions', JSON.stringify(dummySubmissions));
        this.applyFiltersAndSort();
    }

    initializeEventListeners() {
        // Search input
        this.elements.searchInput?.addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value.toLowerCase().trim();
            this.applyFiltersAndSort();
        });

        // Category filter
        this.elements.categoryFilter?.addEventListener('change', (e) => {
            this.currentFilters.category = e.target.value;
            this.applyFiltersAndSort();
        });

        // Sort option
        this.elements.sortOption?.addEventListener('change', (e) => {
            this.currentFilters.sort = e.target.value;
            this.applyFiltersAndSort();
        });

        // Refresh button
        this.elements.refreshBtn?.addEventListener('click', () => {
            this.initializeDummyData();
        });

        // Continue button
        this.elements.lanjutBtn?.addEventListener('click', (e) => {
            if (!this.selectedAssessment) {
                e.preventDefault();
                alert('Silahkan pilih salah satu penilaian kabupaten/kota terlebih dahulu');
                return;
            }
            
            // Store the selected assessment data in localStorage
            localStorage.setItem('selected_prov_assessment', JSON.stringify({
                ...this.selectedAssessment,
                formattedScore: this.selectedAssessment.totalScore.toFixed(2),
                formattedCategory: `Menuju ${this.selectedAssessment.menuju_kategori.charAt(0).toUpperCase() + 
                                 this.selectedAssessment.menuju_kategori.slice(1)}`,
                componentScores: this.selectedAssessment.componentScores,
                wilayah_nilai: this.selectedAssessment.wilayah_nilai,
                verifikator: this.selectedAssessment.verifikator
            }));

            // Set complete context data
            const provContext = {
                menuju_kategori: this.selectedAssessment.menuju_kategori,
                wilayah: `${this.selectedAssessment.wilayah_nilai.jenis_wilayah} ${this.selectedAssessment.wilayah_nilai.nama_wilayah}, Kec. ${this.selectedAssessment.wilayah_nilai.kecamatan}, ${this.selectedAssessment.nama_kabkota}`,
                verifikator: this.selectedAssessment.verifikator,
                total_skor: this.selectedAssessment.totalScore,
                skor_a: this.selectedAssessment.componentScores.kepemimpinan,
                skor_b: this.selectedAssessment.componentScores.kelembagaan,
                skor_c: this.selectedAssessment.componentScores.sampah,
                skor_d: this.selectedAssessment.componentScores.rth,
                skor_e: this.selectedAssessment.componentScores.energi,
                skor_f: this.selectedAssessment.componentScores.air,
                last_updated: new Date().toISOString()
            };
            localStorage.setItem('prov_context', JSON.stringify(provContext));
            
            // Allow the default navigation to proceed
        });
    }

    getCategoryClass(category) {
        switch(category.toLowerCase()) {
            case 'mandiri':
                return 'bg-emerald-100 text-emerald-800';
            case 'madya':
                return 'bg-blue-100 text-blue-800';
            case 'pratama':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    applyFiltersAndSort() {
        let submissions = JSON.parse(localStorage.getItem('prov_submissions') || '[]');

        // Apply search filter
        if (this.currentFilters.search) {
            submissions = submissions.filter(sub => 
                sub.nama_kabkota.toLowerCase().includes(this.currentFilters.search) ||
                sub.wilayah_nilai.nama_wilayah.toLowerCase().includes(this.currentFilters.search) ||
                sub.wilayah_nilai.kecamatan.toLowerCase().includes(this.currentFilters.search) ||
                sub.wilayah_nilai.jenis_wilayah.toLowerCase().includes(this.currentFilters.search)
            );
        }

        // Apply category filter
        if (this.currentFilters.category) {
            submissions = submissions.filter(sub => 
                sub.menuju_kategori === this.currentFilters.category
            );
        }

        // Apply sorting
        submissions.sort((a, b) => {
            switch(this.currentFilters.sort) {
                case 'date-desc':
                    return new Date(b.submitted_at) - new Date(a.submitted_at);
                case 'date-asc':
                    return new Date(a.submitted_at) - new Date(b.submitted_at);
                case 'score-desc':
                    return b.totalScore - a.totalScore;
                case 'score-asc':
                    return a.totalScore - b.totalScore;
                default:
                    return 0;
            }
        });

        this.renderAssessments(submissions);
    }

    updatePreview(assessment) {
        if (!this.elements.selectedPreview) return;

        this.elements.selectedPreview.classList.remove('hidden');

        // Update wilayah info
        document.getElementById('preview-wilayah').textContent = 
            `${assessment.wilayah_nilai.jenis_wilayah} ${assessment.wilayah_nilai.nama_wilayah}, Kec. ${assessment.wilayah_nilai.kecamatan}, ${assessment.nama_kabkota}`;

        // Update verifikator info
        const verifikatorDiv = document.getElementById('preview-verifikator');
        if (verifikatorDiv) {
            verifikatorDiv.innerHTML = assessment.verifikator.map(v => `<p>${v}</p>`).join('');
        }

        // Update status/category with inline highlight
        document.getElementById('preview-status').innerHTML = 
            `<span class="inline-block px-3 py-1 rounded-full ${this.getCategoryClass(assessment.menuju_kategori)}">Menuju ${assessment.menuju_kategori.charAt(0).toUpperCase() + assessment.menuju_kategori.slice(1)}</span>`;
        document.getElementById('preview-status').className = 'text-lg font-semibold';

        // Update component scores
        const scores = assessment.componentScores;
        document.getElementById('preview-score-a').textContent = scores.kepemimpinan.toFixed(1);
        document.getElementById('preview-score-b').textContent = scores.kelembagaan.toFixed(1);
        document.getElementById('preview-score-c').textContent = scores.sampah.toFixed(1);
        document.getElementById('preview-score-d').textContent = scores.rth.toFixed(1);
        document.getElementById('preview-score-e').textContent = scores.energi.toFixed(1);
        document.getElementById('preview-score-f').textContent = scores.air.toFixed(1);
    }

    renderAssessments(assessments) {
        const { listPenilaian, emptyState } = this.elements;

        if (!listPenilaian) {
            console.error('List penilaian element not found');
            return;
        }

        if (!assessments?.length) {
            listPenilaian.innerHTML = '';
            emptyState?.classList.remove('hidden');
            return;
        }

        emptyState?.classList.add('hidden');
        
        listPenilaian.innerHTML = assessments.map(assessment => `
            <div class="assessment-card p-4 border rounded-xl hover:bg-emerald-50 cursor-pointer transition-colors ${
                this.selectedAssessment?.id === assessment.id ? 'bg-emerald-50 border-emerald-500' : ''
            }" data-id="${assessment.id}">
                <div class="flex flex-col md:flex-row justify-between gap-4">
                    <div class="flex-1">
                        <h4 class="font-semibold text-emerald-800">
                            ${assessment.nama_kabkota}
                        </h4>
                        <p class="text-sm text-gray-600">Lokasi: ${assessment.wilayah_nilai.jenis_wilayah} ${assessment.wilayah_nilai.nama_wilayah}</p>
                        <p class="text-sm text-gray-600">Kecamatan ${assessment.wilayah_nilai.kecamatan}</p>
                    </div>
                    <div class="text-left md:text-right">
                        <span class="inline-block px-3 py-1 rounded-full text-sm font-medium 
                               ${this.getCategoryClass(assessment.menuju_kategori)}">
                            Menuju ${assessment.menuju_kategori.charAt(0).toUpperCase() + 
                            assessment.menuju_kategori.slice(1)}
                        </span>
                        <p class="text-sm text-gray-500 mt-1">
                            Skor: ${assessment.totalScore.toFixed(2)}
                        </p>
                        <p class="text-sm text-gray-500">
                            Disubmit: ${new Date(assessment.submitted_at).toLocaleDateString('id-ID')}
                        </p>
                    </div>
                </div>
            </div>
        `).join('');

        // Add click handlers
        document.querySelectorAll('.assessment-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                const submissions = JSON.parse(localStorage.getItem('prov_submissions') || '[]');
                this.selectedAssessment = submissions.find(s => s.id === id);

                // Update visual selection
                document.querySelectorAll('.assessment-card').forEach(c => {
                    c.classList.remove('bg-emerald-50', 'border-emerald-500');
                });
                card.classList.add('bg-emerald-50', 'border-emerald-500');

                // Update preview
                this.updatePreview(this.selectedAssessment);

                // Enable lanjut button
                if (this.elements.lanjutBtn) {
                    this.elements.lanjutBtn.disabled = false;
                }
            });
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.listManager = new ListManager();
});