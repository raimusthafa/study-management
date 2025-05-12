
   // Mobile menu toggle
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });

    // Data storage keys
    const STORAGE_MATERI = 'ms_materi';
    const STORAGE_PROGRES = 'ms_progres';

    // Elements
    const materiForm = document.getElementById('materiForm');
    const materiListEl = document.getElementById('materiList');
    const materiSelect = document.getElementById('materiSelect');
    const progresForm = document.getElementById('progresForm');
    const progresListEl = document.getElementById('progresList');
    const totalMateriEl = document.getElementById('totalMateri');
    const materiSelesaiEl = document.getElementById('materiSelesai');
    const progresRataEl = document.getElementById('progresRata');

    // Load data from localStorage or initialize
    let materiData = JSON.parse(localStorage.getItem(STORAGE_MATERI)) || [];
    let progresData = JSON.parse(localStorage.getItem(STORAGE_PROGRES)) || [];

    // Utility: Save data
    function saveMateri() {
      localStorage.setItem(STORAGE_MATERI, JSON.stringify(materiData));
    }
    function saveProgres() {
      localStorage.setItem(STORAGE_PROGRES, JSON.stringify(progresData));
    }

    // Render Materi Table
    function renderMateri() {
      materiListEl.innerHTML = '';
      materiSelect.innerHTML = '<option value="" disabled selected>-- Pilih Materi --</option>';
      materiData.forEach((m, i) => {
        // Table row
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-blue-50 cursor-default';

        const tdJudul = document.createElement('td');
        tdJudul.className = 'py-3 px-4 text-blue-900 font-semibold';
        tdJudul.textContent = m.judul;

        const tdDesc = document.createElement('td');
        tdDesc.className = 'py-3 px-4 text-blue-800';
        tdDesc.textContent = m.deskripsi || '-';

        const tdTanggal = document.createElement('td');
        tdTanggal.className = 'py-3 px-4 text-blue-700';
        tdTanggal.textContent = new Date(m.tanggal).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

        const tdAksi = document.createElement('td');
        tdAksi.className = 'py-3 px-4';

        const btnDelete = document.createElement('button');
        btnDelete.className =
          'text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-400 rounded';
        btnDelete.setAttribute('aria-label', `Hapus materi ${m.judul}`);
        btnDelete.innerHTML = '<i class="fas fa-trash-alt"></i>';
        btnDelete.addEventListener('click', () => {
          if (confirm(`Yakin ingin menghapus materi "${m.judul}"? Semua progres terkait juga akan dihapus.`)) {
            // Remove materi
            materiData.splice(i, 1);
            // Remove related progres
            progresData = progresData.filter((p) => p.materiId !== m.id);
            saveMateri();
            saveProgres();
            renderMateri();
            renderProgres();
            updateDashboard();
            updateChart();
          }
        });

        tdAksi.appendChild(btnDelete);

        tr.appendChild(tdJudul);
        tr.appendChild(tdDesc);
        tr.appendChild(tdTanggal);
        tr.appendChild(tdAksi);

        materiListEl.appendChild(tr);

        // Add to select
        const option = document.createElement('option');
        option.value = m.id;
        option.textContent = m.judul;
        materiSelect.appendChild(option);
      });
    }

    // Render Progres List
    function renderProgres() {
      progresListEl.innerHTML = '';
      if (materiData.length === 0) {
        progresListEl.innerHTML = `<p class="text-blue-700 font-semibold">Belum ada materi yang ditambahkan. Silakan tambah materi terlebih dahulu.</p>`;
        return;
      }
      if (progresData.length === 0) {
        progresListEl.innerHTML = `<p class="text-blue-700 font-semibold">Belum ada progres yang dicatat. Silakan update progres belajar.</p>`;
        return;
      }

      // Group progres by materi
      const progresByMateri = {};
      progresData.forEach((p) => {
        if (!progresByMateri[p.materiId]) progresByMateri[p.materiId] = [];
        progresByMateri[p.materiId].push(p);
      });

      // For each materi, show latest progres with progress bar
      materiData.forEach((m) => {
        const progresList = progresByMateri[m.id] || [];
        if (progresList.length === 0) return;

        // Sort by tanggal descending
        progresList.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        const latest = progresList[0];

        // Container
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow p-5 border border-blue-200';

        // Header
        const header = document.createElement('div');
        header.className = 'flex justify-between items-center mb-3';

        const title = document.createElement('h3');
        title.className = 'text-xl font-semibold text-blue-900';
        title.textContent = m.judul;

        const date = document.createElement('span');
        date.className = 'text-sm text-blue-700 italic';
        date.textContent = `Update: ${new Date(latest.tanggal).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}`;

        header.appendChild(title);
        header.appendChild(date);

        // Progress bar container
        const progressContainer = document.createElement('div');
        progressContainer.className = 'w-full bg-blue-100 rounded-full h-6 overflow-hidden shadow-inner';

        // Progress bar fill
        const progressFill = document.createElement('div');
        progressFill.className = 'h-6 bg-blue-600 text-white font-semibold flex items-center justify-center';
        progressFill.style.width = `${latest.progress}%`;
        progressFill.textContent = `${latest.progress}%`;

        progressContainer.appendChild(progressFill);

        // History button
        const btnHistory = document.createElement('button');
        btnHistory.className =
          'mt-3 text-blue-700 hover:text-blue-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 rounded';
        btnHistory.textContent = 'Lihat Riwayat Progres';
        btnHistory.addEventListener('click', () => {
          showHistoryModal(m, progresList);
        });

        card.appendChild(header);
        card.appendChild(progressContainer);
        card.appendChild(btnHistory);

        progresListEl.appendChild(card);
      });
    }

    // Show modal with history progres
    function showHistoryModal(materi, progresList) {
      // Create modal elements
      const modalBg = document.createElement('div');
      modalBg.className =
        'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

      const modal = document.createElement('div');
      modal.className =
        'bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 relative';

      const title = document.createElement('h3');
      title.className = 'text-2xl font-bold text-blue-900 mb-4';
      title.textContent = `Riwayat Progres: ${materi.judul}`;

      const closeBtn = document.createElement('button');
      closeBtn.className =
        'absolute top-4 right-4 text-blue-700 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded';
      closeBtn.setAttribute('aria-label', 'Tutup riwayat progres');
      closeBtn.innerHTML = '<i class="fas fa-times fa-lg"></i>';
      closeBtn.addEventListener('click', () => {
        document.body.removeChild(modalBg);
      });

      const list = document.createElement('ul');
      list.className = 'space-y-3 text-blue-800';

      // Sort progres ascending by date
      progresList.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

      progresList.forEach((p) => {
        const li = document.createElement('li');
        li.className = 'border border-blue-300 rounded p-3 bg-blue-50 flex justify-between items-center';

        const date = new Date(p.tanggal).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

        li.innerHTML = `<span>${date}</span><span class="font-semibold">${p.progress}%</span>`;

        list.appendChild(li);
      });

      modal.appendChild(closeBtn);
      modal.appendChild(title);
      modal.appendChild(list);
      modalBg.appendChild(modal);
      document.body.appendChild(modalBg);
    }

    // Update Dashboard stats
    function updateDashboard() {
      totalMateriEl.textContent = materiData.length;

      // Count materi selesai (progress 100%)
      let selesaiCount = 0;
      materiData.forEach((m) => {
        const progresList = progresData.filter((p) => p.materiId === m.id);
        if (progresList.length === 0) return;
        const maxProgress = Math.max(...progresList.map((p) => p.progress));
        if (maxProgress === 100) selesaiCount++;
      });
      materiSelesaiEl.textContent = selesaiCount;

      // Average progress
      let totalProgress = 0;
      let count = 0;
      materiData.forEach((m) => {
        const progresList = progresData.filter((p) => p.materiId === m.id);
        if (progresList.length === 0) return;
        const maxProgress = Math.max(...progresList.map((p) => p.progress));
        totalProgress += maxProgress;
        count++;
      });
      const avg = count === 0 ? 0 : Math.round(totalProgress / count);
      progresRataEl.textContent = `${avg}%`;
    }

    // Add Materi
    materiForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const judul = e.target.judulMateri.value.trim();
      const deskripsi = e.target.deskripsiMateri.value.trim();
      const tanggal = e.target.tanggalBelajar.value;

      if (!judul || !tanggal) {
        alert('Judul dan tanggal belajar wajib diisi.');
        return;
      }

      // Create new materi object
      const newMateri = {
        id: crypto.randomUUID(),
        judul,
        deskripsi,
        tanggal,
      };

      materiData.push(newMateri);
      saveMateri();
      renderMateri();
      updateDashboard();

      // Reset form
      e.target.reset();
    });

    // Add Progres
    progresForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const materiId = e.target.materiSelect.value;
      const progress = Number(e.target.progressValue.value);
      const tanggal = e.target.tanggalProgres.value;

      if (!materiId || isNaN(progress) || progress < 0 || progress > 100 || !tanggal) {
        alert('Mohon isi data progres dengan benar.');
        return;
      }

      // Check if progres for this materi on this date exists, update if yes
      const existingIndex = progresData.findIndex(
        (p) => p.materiId === materiId && p.tanggal === tanggal
      );
      if (existingIndex >= 0) {
        progresData[existingIndex].progress = progress;
      } else {
        progresData.push({
          id: crypto.randomUUID(),
          materiId,
          progress,
          tanggal,
        });
      }

      saveProgres();
      renderProgres();
      updateDashboard();
      updateChart();

      // Reset form
      e.target.reset();
    });

    // Chart.js setup
    const ctx = document.getElementById('progressChart').getContext('2d');
    let progressChart;

    function updateChart() {
      // Prepare data: latest progress per materi
      const labels = materiData.map((m) => m.judul);
      const dataProgress = materiData.map((m) => {
        const progresList = progresData.filter((p) => p.materiId === m.id);
        if (progresList.length === 0) return 0;
        return Math.max(...progresList.map((p) => p.progress));
      });

      if (progressChart) {
        progressChart.data.labels = labels;
        progressChart.data.datasets[0].data = dataProgress;
        progressChart.update();
      } else {
        progressChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Progres (%)',
                data: dataProgress,
                backgroundColor: 'rgba(37, 99, 235, 0.7)',
                borderColor: 'rgba(37, 99, 235, 1)',
                borderWidth: 1,
                borderRadius: 4,
                maxBarThickness: 50,
              },
            ],
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  stepSize: 10,
                  color: '#1e40af',
                  font: { weight: '600' },
                },
                grid: {
                  color: '#bfdbfe',
                },
              },
              x: {
                ticks: {
                  color: '#1e40af',
                  font: { weight: '600' },
                },
                grid: {
                  display: false,
                },
              },
            },
            plugins: {
              legend: {
                labels: {
                  color: '#1e40af',
                  font: { weight: '700' },
                },
              },
              tooltip: {
                backgroundColor: '#2563eb',
                titleFont: { weight: '700' },
                bodyFont: { weight: '600' },
              },
            },
          },
        });
      }
    }

    // Initial render
    renderMateri();
    renderProgres();
    updateDashboard();
    updateChart();