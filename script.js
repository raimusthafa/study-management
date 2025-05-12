
    // Mobile menu toggle
    const menuBtn = document.getElementById("menu-btn");
    const mobileMenu = document.getElementById("mobile-menu");
    menuBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
    });

    // Data storage keys
    const STORAGE_MATERI = "ms_materi";
    const STORAGE_PROGRES = "ms_progres";

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

    // Get progress bar color based on value
    function getProgressColor(value) {
      if (value >= 80) return "bg-green-600";
      if (value >= 50) return "bg-yellow-500";
      if (value >= 20) return "bg-orange-500";
      return "bg-red-600";
    }

    // Format date Indonesian style
    function formatDate(dateStr) {
      if (!dateStr) return "-";
      const d = new Date(dateStr);
      if (isNaN(d)) return "-";
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    // Generate UUID (fallback if crypto.randomUUID not available)
    function generateUUID() {
      if (crypto.randomUUID) return crypto.randomUUID();
      // fallback simple UUID generator
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
          v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }

    // Main app container
    const app = document.getElementById("app");

    // Current page state
    let currentPage = "dashboard";

    // Chart instance
    let progressChart = null;

    // Render functions for pages

    // Dashboard page: show 3 materi cards max + lihat semua button
    function renderDashboard() {
      app.innerHTML = `
        <section aria-label="Dashboard utama" class="mb-12">
          <h2 class="text-3xl font-bold text-blue-900 mb-6 flex items-center space-x-3">
            <i class="fas fa-tachometer-alt text-blue-700"></i>
            <span>Dashboard</span>
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div class="bg-white rounded-lg shadow p-6 border border-blue-200">
              <h3 class="text-xl font-semibold text-blue-800 mb-2">Total Materi</h3>
              <p class="text-4xl font-bold text-blue-600" id="totalMateri">0</p>
            </div>
            <div class="bg-white rounded-lg shadow p-6 border border-blue-200">
              <h3 class="text-xl font-semibold text-blue-800 mb-2">Materi Selesai</h3>
              <p class="text-4xl font-bold text-blue-600" id="materiSelesai">0</p>
            </div>
            <div class="bg-white rounded-lg shadow p-6 border border-blue-200">
              <h3 class="text-xl font-semibold text-blue-800 mb-2">Progres Rata-rata</h3>
              <p class="text-4xl font-bold text-blue-600" id="progresRata">0%</p>
            </div>
          </div>
          <h3 class="text-2xl font-semibold text-blue-900 mb-4">Materi Terbaru</h3>
          <div id="materiPreview" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6" role="list" aria-label="Preview materi terbaru"></div>
          <div class="flex justify-center">
            <button id="btnLihatSemuaMateri" class="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2 rounded shadow transition focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Lihat semua materi">
              Lihat Semua Materi
            </button>
          </div>
        </section>
      `;

      updateDashboardStats();
      renderMateriPreview();

      document.getElementById("btnLihatSemuaMateri").addEventListener("click", () => {
        navigateTo("materi");
      });
    }

    // Render preview materi cards (max 3)
    function renderMateriPreview() {
      const container = document.getElementById("materiPreview");
      container.innerHTML = "";
      if (materiData.length === 0) {
        container.innerHTML = `<p class="text-blue-700 font-semibold col-span-full">Belum ada materi yang ditambahkan.</p>`;
        return;
      }
      // Sort materi by tanggal descending (latest first)
      const sortedMateri = [...materiData].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
      const previewMateri = sortedMateri.slice(0, 3);

      previewMateri.forEach((m) => {
        const progresList = progresData.filter((p) => p.materiId === m.id);
        let latestProgress = 0;
        let latestDate = null;
        if (progresList.length > 0) {
          progresList.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
          latestProgress = progresList[0].progress;
          latestDate = progresList[0].tanggal;
        }

        const card = document.createElement("article");
        card.className =
          "bg-white rounded-lg shadow p-6 border border-blue-200 flex flex-col justify-between";

        const header = document.createElement("div");
        header.className = "flex justify-between items-start mb-4";

        const title = document.createElement("h3");
        title.className = "text-xl font-semibold text-blue-900";
        title.textContent = m.judul;

        header.appendChild(title);

        const desc = document.createElement("p");
        desc.className = "text-blue-800 mb-4 min-h-[3rem]";
        desc.textContent = m.deskripsi || "Tidak ada deskripsi.";

        const dateLearned = document.createElement("p");
        dateLearned.className = "text-sm text-blue-700 italic mb-4";
        dateLearned.textContent = `Tanggal belajar: ${formatDate(m.tanggal)}`;

        const progressContainer = document.createElement("div");
        progressContainer.className =
          "w-full bg-blue-100 rounded-full h-6 overflow-hidden shadow-inner mb-2";

        const progressFill = document.createElement("div");
        progressFill.className = `h-6 text-white font-semibold flex items-center justify-center ${getProgressColor(
          latestProgress
        )}`;
        progressFill.style.width = `${latestProgress}%`;
        progressFill.textContent = `${latestProgress}%`;

        progressContainer.appendChild(progressFill);

        const updateDate = document.createElement("p");
        updateDate.className = "text-sm text-blue-700 italic";
        updateDate.textContent = latestDate
          ? `Update terakhir: ${formatDate(latestDate)}`
          : "Belum ada progres dicatat.";

        card.appendChild(header);
        card.appendChild(desc);
        card.appendChild(dateLearned);
        card.appendChild(progressContainer);
        card.appendChild(updateDate);

        container.appendChild(card);
      });
    }

    // Update dashboard stats
    function updateDashboardStats() {
      const totalMateriEl = document.getElementById("totalMateri");
      const materiSelesaiEl = document.getElementById("materiSelesai");
      const progresRataEl = document.getElementById("progresRata");

      totalMateriEl.textContent = materiData.length;

      let selesaiCount = 0;
      materiData.forEach((m) => {
        const progresList = progresData.filter((p) => p.materiId === m.id);
        if (progresList.length === 0) return;
        const maxProgress = Math.max(...progresList.map((p) => p.progress));
        if (maxProgress === 100) selesaiCount++;
      });
      materiSelesaiEl.textContent = selesaiCount;

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

    // Materi page: show all materi with view toggle (card, table, calendar)
    function renderMateriPage() {
      app.innerHTML = `
        <section aria-label="Halaman Materi" class="mb-12 max-w-7xl mx-auto">
          <h2 class="text-3xl font-bold text-blue-900 mb-6 flex items-center space-x-3">
            <i class="fas fa-book text-blue-700"></i>
            <span>Materi yang Dipelajari</span>
          </h2>
          <form class="bg-white rounded-lg shadow p-6 border border-blue-200 mb-8 max-w-3xl" id="materiForm" novalidate>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label class="block text-blue-800 font-semibold mb-1" for="judulMateri">Judul Materi</label>
                <input autocomplete="off" class="w-full rounded border border-blue-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" id="judulMateri" name="judulMateri" placeholder="Contoh: Algoritma dan Struktur Data" required type="text" />
              </div>
              <div>
                <label class="block text-blue-800 font-semibold mb-1" for="deskripsiMateri">Deskripsi Singkat</label>
                <input autocomplete="off" class="w-full rounded border border-blue-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" id="deskripsiMateri" name="deskripsiMateri" placeholder="Contoh: Materi dasar pemrograman" type="text" />
              </div>
              <div>
                <label class="block text-blue-800 font-semibold mb-1" for="tanggalBelajar">Tanggal Belajar</label>
                <input autocomplete="off" class="w-full rounded border border-blue-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" id="tanggalBelajar" name="tanggalBelajar" required type="date" />
              </div>
            </div>
            <div class="mt-6 flex justify-end">
              <button class="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2 rounded shadow transition focus:outline-none focus:ring-2 focus:ring-blue-500" type="submit" id="btnTambahMateri">Tambah Materi</button>
            </div>
          </form>

          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-3 sm:space-y-0">
            <div>
              <label for="viewSelect" class="text-blue-800 font-semibold mr-2">Tampilan:</label>
              <select id="viewSelect" class="rounded border border-blue-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="card" selected>Kartu</option>
                <option value="table">Tabel</option>
                <option value="calendar">Kalender</option>
              </select>
            </div>
          </div>

          <div id="materiViewContainer" aria-live="polite"></div>
        </section>
      `;

      // Attach event listeners
      document.getElementById("materiForm").addEventListener("submit", handleAddMateri);
      document.getElementById("viewSelect").addEventListener("change", (e) => {
        renderMateriView(e.target.value);
      });

      renderMateriView("card");
    }

    // Handle add materi from form
    function handleAddMateri(e) {
      e.preventDefault();
      const form = e.target;
      const judul = form.judulMateri.value.trim();
      const deskripsi = form.deskripsiMateri.value.trim();
      const tanggal = form.tanggalBelajar.value;

      if (!judul || !tanggal) {
        alert("Judul dan tanggal belajar wajib diisi.");
        return;
      }

      const newMateri = {
        id: generateUUID(),
        judul,
        deskripsi,
        tanggal,
      };

      materiData.push(newMateri);
      saveMateri();
      renderMateriView(document.getElementById("viewSelect").value);
      updateDashboardStats();
      form.reset();
    }

    // Render materi view by type: card, table, calendar
    function renderMateriView(type) {
      const container = document.getElementById("materiViewContainer");
      container.innerHTML = "";

      if (materiData.length === 0) {
        container.innerHTML = `<p class="text-blue-700 font-semibold">Belum ada materi yang ditambahkan.</p>`;
        return;
      }

      if (type === "card") {
        // Card view
        const grid = document.createElement("div");
        grid.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6";
        grid.setAttribute("role", "list");
        grid.setAttribute("aria-label", "Daftar materi dalam tampilan kartu");

        materiData
          .slice()
          .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
          .forEach((m, i) => {
            const progresList = progresData.filter((p) => p.materiId === m.id);
            let latestProgress = 0;
            let latestDate = null;
            if (progresList.length > 0) {
              progresList.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
              latestProgress = progresList[0].progress;
              latestDate = progresList[0].tanggal;
            }

            const card = document.createElement("article");
            card.className =
              "bg-white rounded-lg shadow p-6 border border-blue-200 flex flex-col justify-between";

            const header = document.createElement("div");
            header.className = "flex justify-between items-start mb-4";

            const title = document.createElement("h3");
            title.className = "text-xl font-semibold text-blue-900";
            title.textContent = m.judul;

            const btnDelete = document.createElement("button");
            btnDelete.className =
              "text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-400 rounded";
            btnDelete.setAttribute("aria-label", `Hapus materi ${m.judul}`);
            btnDelete.innerHTML = '<i class="fas fa-trash-alt"></i>';
            btnDelete.addEventListener("click", () => {
              if (
                confirm(
                  `Yakin ingin menghapus materi "${m.judul}"? Semua progres terkait juga akan dihapus.`
                )
              ) {
                materiData.splice(materiData.findIndex((x) => x.id === m.id), 1);
                progresData = progresData.filter((p) => p.materiId !== m.id);
                saveMateri();
                saveProgres();
                renderMateriView("card");
                updateDashboardStats();
                if (currentPage === "dashboard") renderDashboard();
                if (progressChart) updateChart();
              }
            });

            header.appendChild(title);
            header.appendChild(btnDelete);

            const desc = document.createElement("p");
            desc.className = "text-blue-800 mb-4 min-h-[3rem]";
            desc.textContent = m.deskripsi || "Tidak ada deskripsi.";

            const dateLearned = document.createElement("p");
            dateLearned.className = "text-sm text-blue-700 italic mb-4";
            dateLearned.textContent = `Tanggal belajar: ${formatDate(m.tanggal)}`;

            const progressContainer = document.createElement("div");
            progressContainer.className =
              "w-full bg-blue-100 rounded-full h-6 overflow-hidden shadow-inner mb-2";

            const progressFill = document.createElement("div");
            progressFill.className = `h-6 text-white font-semibold flex items-center justify-center ${getProgressColor(
              latestProgress
            )}`;
            progressFill.style.width = `${latestProgress}%`;
            progressFill.textContent = `${latestProgress}%`;

            progressContainer.appendChild(progressFill);

            const updateDate = document.createElement("p");
            updateDate.className = "text-sm text-blue-700 italic";
            updateDate.textContent = latestDate
              ? `Update terakhir: ${formatDate(latestDate)}`
              : "Belum ada progres dicatat.";

            card.appendChild(header);
            card.appendChild(desc);
            card.appendChild(dateLearned);
            card.appendChild(progressContainer);
            card.appendChild(updateDate);

            grid.appendChild(card);
          });

        container.appendChild(grid);
      } else if (type === "table") {
        // Table view
        const tableWrapper = document.createElement("div");
        tableWrapper.className = "overflow-x-auto";

        const table = document.createElement("table");
        table.className = "min-w-full bg-white rounded-lg shadow border border-blue-200";
        table.setAttribute("role", "table");
        table.setAttribute("aria-label", "Tabel daftar materi");

        const thead = document.createElement("thead");
        thead.className = "bg-blue-700 text-white";

        const trHead = document.createElement("tr");
        ["Judul Materi", "Deskripsi", "Tanggal Belajar", "Aksi"].forEach((txt) => {
          const th = document.createElement("th");
          th.className = "py-3 px-4 text-left font-semibold";
          th.textContent = txt;
          trHead.appendChild(th);
        });
        thead.appendChild(trHead);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        tbody.className = "divide-y divide-blue-200";

        materiData
          .slice()
          .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
          .forEach((m) => {
            const tr = document.createElement("tr");
            tr.className = "hover:bg-blue-50 cursor-default";

            const tdJudul = document.createElement("td");
            tdJudul.className = "py-3 px-4 text-blue-900 font-semibold";
            tdJudul.textContent = m.judul;

            const tdDesc = document.createElement("td");
            tdDesc.className = "py-3 px-4 text-blue-800";
            tdDesc.textContent = m.deskripsi || "-";

            const tdTanggal = document.createElement("td");
            tdTanggal.className = "py-3 px-4 text-blue-700";
            tdTanggal.textContent = formatDate(m.tanggal);

            const tdAksi = document.createElement("td");
            tdAksi.className = "py-3 px-4";

            const btnDelete = document.createElement("button");
            btnDelete.className =
              "text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-400 rounded";
            btnDelete.setAttribute("aria-label", `Hapus materi ${m.judul}`);
            btnDelete.innerHTML = '<i class="fas fa-trash-alt"></i>';
            btnDelete.addEventListener("click", () => {
              if (
                confirm(
                  `Yakin ingin menghapus materi "${m.judul}"? Semua progres terkait juga akan dihapus.`
                )
              ) {
                materiData.splice(materiData.findIndex((x) => x.id === m.id), 1);
                progresData = progresData.filter((p) => p.materiId !== m.id);
                saveMateri();
                saveProgres();
                renderMateriView("table");
                updateDashboardStats();
                if (currentPage === "dashboard") renderDashboard();
                if (progressChart) updateChart();
              }
            });

            tdAksi.appendChild(btnDelete);

            tr.appendChild(tdJudul);
            tr.appendChild(tdDesc);
            tr.appendChild(tdTanggal);
            tr.appendChild(tdAksi);

            tbody.appendChild(tr);
          });

        table.appendChild(tbody);
        tableWrapper.appendChild(table);
        container.appendChild(tableWrapper);
      } else if (type === "calendar") {
        // Calendar view
        // We'll show a simple month calendar with materi dates marked
        // For simplicity, show current month with materi dates highlighted and tooltip on hover

        const calendarContainer = document.createElement("div");
        calendarContainer.className = "bg-white rounded-lg shadow p-6 border border-blue-200 max-w-4xl mx-auto";

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        // Header with month and year
        const header = document.createElement("div");
        header.className = "flex justify-between items-center mb-4";

        const monthYear = document.createElement("h3");
        monthYear.className = "text-xl font-semibold text-blue-900";
        monthYear.textContent = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

        // Navigation buttons for prev/next month
        const navButtons = document.createElement("div");
        navButtons.className = "space-x-2";

        const btnPrev = document.createElement("button");
        btnPrev.className = "px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500";
        btnPrev.textContent = "‹ Bulan Sebelumnya";

        const btnNext = document.createElement("button");
        btnNext.className = "px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500";
        btnNext.textContent = "Bulan Berikutnya ›";

        navButtons.appendChild(btnPrev);
        navButtons.appendChild(btnNext);

        header.appendChild(monthYear);
        header.appendChild(navButtons);

        calendarContainer.appendChild(header);

        // Days of week header
        const daysOfWeek = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
        const daysHeader = document.createElement("div");
        daysHeader.className = "grid grid-cols-7 text-center font-semibold text-blue-700 border-b border-blue-300 pb-2 mb-2";
        daysOfWeek.forEach((d) => {
          const dayEl = document.createElement("div");
          dayEl.textContent = d;
          daysHeader.appendChild(dayEl);
        });
        calendarContainer.appendChild(daysHeader);

        // Container for days
        const daysGrid = document.createElement("div");
        daysGrid.className = "grid grid-cols-7 gap-1 text-center";

        // Function to render calendar days for given year/month
        function renderCalendarDays(y, m) {
          daysGrid.innerHTML = "";
          monthYear.textContent = new Date(y, m).toLocaleDateString("id-ID", {
            month: "long",
            year: "numeric",
          });

          // First day of month (0=Sun,...6=Sat)
          const firstDay = new Date(y, m, 1).getDay();
          // Number of days in month
          const daysInMonth = new Date(y, m + 1, 0).getDate();

          // Fill empty slots before first day
          for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement("div");
            emptyCell.className = "py-4";
            daysGrid.appendChild(emptyCell);
          }

          // Create day cells
          for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = new Date(y, m, day).toISOString().slice(0, 10);
            const dayCell = document.createElement("div");
            dayCell.className =
              "py-4 rounded cursor-default relative select-none";

            // Check if materi exists on this date
            const materiOnDate = materiData.filter((mtr) => mtr.tanggal === dateStr);

            if (materiOnDate.length > 0) {
              dayCell.classList.add("bg-blue-200", "font-semibold", "text-blue-900");
              dayCell.setAttribute("tabindex", "0");
              dayCell.setAttribute("aria-label", `Tanggal ${day}, terdapat ${materiOnDate.length} materi`);
              // Tooltip container
              const tooltip = document.createElement("div");
              tooltip.className =
                "absolute z-10 left-1/2 transform -translate-x-1/2 -translate-y-full bg-white border border-blue-300 rounded shadow-lg p-3 w-48 text-left text-blue-900 text-sm hidden";
              tooltip.setAttribute("role", "tooltip");

              materiOnDate.forEach((mtr) => {
                const item = document.createElement("div");
                item.className = "mb-1 last:mb-0";
                item.textContent = mtr.judul;
                tooltip.appendChild(item);
              });

              dayCell.appendChild(tooltip);

              // Show tooltip on focus and hover
              dayCell.addEventListener("mouseenter", () => {
                tooltip.classList.remove("hidden");
              });
              dayCell.addEventListener("mouseleave", () => {
                tooltip.classList.add("hidden");
              });
              dayCell.addEventListener("focus", () => {
                tooltip.classList.remove("hidden");
              });
              dayCell.addEventListener("blur", () => {
                tooltip.classList.add("hidden");
              });
            } else {
              dayCell.textContent = day;
              dayCell.setAttribute("aria-label", `Tanggal ${day}, tidak ada materi`);
            }

            // Show day number if no materi
            if (materiOnDate.length === 0) {
              dayCell.textContent = day;
            } else {
              // Show day number as small circle top-left
              const dayNum = document.createElement("div");
              dayNum.textContent = day;
              dayNum.className =
                "absolute top-1 left-1 bg-blue-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold";
              dayCell.appendChild(dayNum);
            }

            daysGrid.appendChild(dayCell);
          }
        }

        renderCalendarDays(year, month);

        btnPrev.addEventListener("click", () => {
          let newMonth = month - 1;
          let newYear = year;
          if (newMonth < 0) {
            newMonth = 11;
            newYear--;
          }
          renderCalendarDays(newYear, newMonth);
          month = newMonth;
          year = newYear;
        });

        btnNext.addEventListener("click", () => {
          let newMonth = month + 1;
          let newYear = year;
          if (newMonth > 11) {
            newMonth = 0;
            newYear++;
          }
          renderCalendarDays(newYear, newMonth);
          month = newMonth;
          year = newYear;
        });

        calendarContainer.appendChild(daysGrid);
        container.appendChild(calendarContainer);
      }
    }

    // Progres page: show form and progres cards
    function renderProgresPage() {
      app.innerHTML = `
        <section aria-label="Halaman Progres Belajar" class="mb-12 max-w-7xl mx-auto">
          <h2 class="text-3xl font-bold text-blue-900 mb-6 flex items-center space-x-3">
            <i class="fas fa-tasks text-blue-700"></i>
            <span>Progres Belajar</span>
          </h2>
          <form class="bg-white rounded-lg shadow p-6 border border-blue-200 mb-8 max-w-3xl" id="progresForm" novalidate>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label class="block text-blue-800 font-semibold mb-1" for="materiSelect">Pilih Materi</label>
                <select aria-required="true" class="w-full rounded border border-blue-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" id="materiSelect" name="materiSelect" required>
                  <option disabled selected value="">-- Pilih Materi --</option>
                </select>
              </div>
              <div>
                <label class="block text-blue-800 font-semibold mb-1" for="progressValue">Progres (%)</label>
                <input aria-required="true" autocomplete="off" class="w-full rounded border border-blue-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" id="progressValue" max="100" min="0" name="progressValue" placeholder="0 - 100" required type="number" />
              </div>
              <div>
                <label class="block text-blue-800 font-semibold mb-1" for="tanggalProgres">Tanggal Update</label>
                <input autocomplete="off" class="w-full rounded border border-blue-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" id="tanggalProgres" name="tanggalProgres" required type="date" />
              </div>
            </div>
            <div class="mt-6 flex justify-end">
              <button class="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2 rounded shadow transition focus:outline-none focus:ring-2 focus:ring-blue-500" type="submit">Update Progres</button>
            </div>
          </form>
          <div class="space-y-6 max-w-4xl" id="progresList" role="list" aria-label="Daftar progres belajar"></div>
        </section>
      `;

      // Populate materi select
      const materiSelect = document.getElementById("materiSelect");
      materiSelect.innerHTML = '<option disabled selected value="">-- Pilih Materi --</option>';
      materiData.forEach((m) => {
        const option = document.createElement("option");
        option.value = m.id;
        option.textContent = m.judul;
        materiSelect.appendChild(option);
      });

      document.getElementById("progresForm").addEventListener("submit", handleAddProgres);

      renderProgresList();
    }

    // Handle add progres from form
    function handleAddProgres(e) {
      e.preventDefault();
      const form = e.target;
      const materiId = form.materiSelect.value;
      const progress = Number(form.progressValue.value);
      const tanggal = form.tanggalProgres.value;

      if (!materiId || isNaN(progress) || progress < 0 || progress > 100 || !tanggal) {
        alert("Mohon isi data progres dengan benar.");
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
          id: generateUUID(),
          materiId,
          progress,
          tanggal,
        });
      }

      saveProgres();
      renderProgresList();
      updateDashboardStats();
      if (progressChart) updateChart();

      form.reset();
    }

    // Render progres list cards
    function renderProgresList() {
      const container = document.getElementById("progresList");
      container.innerHTML = "";

      if (materiData.length === 0) {
        container.innerHTML = `<p class="text-blue-700 font-semibold">Belum ada materi yang ditambahkan. Silakan tambah materi terlebih dahulu.</p>`;
        return;
      }
      if (progresData.length === 0) {
        container.innerHTML = `<p class="text-blue-700 font-semibold">Belum ada progres yang dicatat. Silakan update progres belajar.</p>`;
        return;
      }

      // Group progres by materi
      const progresByMateri = {};
      progresData.forEach((p) => {
        if (!progresByMateri[p.materiId]) progresByMateri[p.materiId] = [];
        progresByMateri[p.materiId].push(p);
      });

      materiData.forEach((m) => {
        const progresList = progresByMateri[m.id] || [];
        if (progresList.length === 0) return;

        progresList.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        const latest = progresList[0];

        const card = document.createElement("article");
        card.className = "bg-white rounded-lg shadow p-5 border border-blue-200";

        const header = document.createElement("div");
        header.className = "flex justify-between items-center mb-3";

        const title = document.createElement("h3");
        title.className = "text-xl font-semibold text-blue-900";
        title.textContent = m.judul;

        const date = document.createElement("span");
        date.className = "text-sm text-blue-700 italic";
        date.textContent = `Update: ${formatDate(latest.tanggal)}`;

        header.appendChild(title);
        header.appendChild(date);

        const progressContainer = document.createElement("div");
        progressContainer.className = "w-full bg-blue-100 rounded-full h-6 overflow-hidden shadow-inner";

        const progressFill = document.createElement("div");
        progressFill.className = `h-6 text-white font-semibold flex items-center justify-center ${getProgressColor(
          latest.progress
        )}`;
        progressFill.style.width = `${latest.progress}%`;
        progressFill.textContent = `${latest.progress}%`;

        progressContainer.appendChild(progressFill);

        const btnHistory = document.createElement("button");
        btnHistory.className =
          "mt-3 text-blue-700 hover:text-blue-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 rounded";
        btnHistory.textContent = "Lihat Riwayat Progres";
        btnHistory.addEventListener("click", () => {
          showHistoryModal(m, progresList);
        });

        card.appendChild(header);
        card.appendChild(progressContainer);
        card.appendChild(btnHistory);

        container.appendChild(card);
      });
    }

    // Statistik page: show chart
    function renderStatistikPage() {
      app.innerHTML = `
        <section aria-label="Halaman Statistik Progres" class="mb-12 max-w-7xl mx-auto">
          <h2 class="text-3xl font-bold text-blue-900 mb-6 flex items-center space-x-3">
            <i class="fas fa-chart-line text-blue-700"></i>
            <span>Statistik Progres</span>
          </h2>
          <div class="bg-white rounded-lg shadow p-6 border border-blue-200 max-w-4xl mx-auto">
            <canvas aria-label="Grafik progres belajar per materi" id="progressChart" role="img" width="400" height="200"></canvas>
          </div>
        </section>
      `;

      updateChart();
    }

    // About page
    function renderAboutPage() {
      app.innerHTML = `
        <section aria-label="Halaman Tentang Aplikasi" class="mb-12 max-w-4xl mx-auto text-blue-900">
          <h2 class="text-3xl font-bold mb-4 flex items-center space-x-3">
            <i class="fas fa-info-circle text-blue-700"></i>
            <span>Tentang Aplikasi</span>
          </h2>
          <p class="mb-4 leading-relaxed">
            Aplikasi Manajemen Studi Profesional ini dirancang untuk membantu Anda mencatat materi yang dipelajari dan memantau progres belajar secara efektif. Dengan fitur pencatatan materi, update progres, dan visualisasi statistik, Anda dapat mengelola waktu belajar dengan lebih terstruktur dan fokus.
          </p>
          <p class="mb-4 leading-relaxed">
            Tema biru yang digunakan memberikan kesan profesional dan menenangkan, mendukung suasana belajar yang nyaman dan produktif.
          </p>
          <p class="leading-relaxed">
            Dikembangkan dengan teknologi modern menggunakan Tailwind CSS untuk tampilan responsif dan interaktif.
          </p>
        </section>
      `;
    }

    // Show modal with history progres
    function showHistoryModal(materi, progresList) {
      const modalBg = document.createElement("div");
      modalBg.className =
        "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";

      const modal = document.createElement("div");
      modal.className =
        "bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 relative";

      const title = document.createElement("h3");
      title.className = "text-2xl font-bold text-blue-900 mb-4";
      title.textContent = `Riwayat Progres: ${materi.judul}`;

      const closeBtn = document.createElement("button");
      closeBtn.className =
        "absolute top-4 right-4 text-blue-700 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded";
      closeBtn.setAttribute("aria-label", "Tutup riwayat progres");
      closeBtn.innerHTML = '<i class="fas fa-times fa-lg"></i>';
      closeBtn.addEventListener("click", () => {
        document.body.removeChild(modalBg);
      });

      const list = document.createElement("ul");
      list.className = "space-y-3 text-blue-800";

      progresList.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

      progresList.forEach((p) => {
        const li = document.createElement("li");
        li.className =
          "border border-blue-300 rounded p-3 bg-blue-50 flex justify-between items-center";

        const date = new Date(p.tanggal).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
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

    // Chart.js setup and update
    function updateChart() {
      const ctx = document.getElementById("progressChart").getContext("2d");
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
          type: "bar",
          data: {
            labels,
            datasets: [
              {
                label: "Progres (%)",
                data: dataProgress,
                backgroundColor: "rgba(37, 99, 235, 0.7)",
                borderColor: "rgba(37, 99, 235, 1)",
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
                  color: "#1e40af",
                  font: { weight: "600" },
                },
                grid: {
                  color: "#bfdbfe",
                },
              },
              x: {
                ticks: {
                  color: "#1e40af",
                  font: { weight: "600" },
                },
                grid: {
                  display: false,
                },
              },
            },
            plugins: {
              legend: {
                labels: {
                  color: "#1e40af",
                  font: { weight: "700" },
                },
              },
              tooltip: {
                backgroundColor: "#2563eb",
                titleFont: { weight: "700" },
                bodyFont: { weight: "600" },
              },
            },
          },
        });
      }
    }

    // Navigation handler
    function navigateTo(page) {
      currentPage = page;
      // Close mobile menu if open
      if (!mobileMenu.classList.contains("hidden")) {
        mobileMenu.classList.add("hidden");
      }
      // Update active nav links
      document.querySelectorAll("nav a[data-page]").forEach((a) => {
        if (a.dataset.page === page) {
          a.classList.add("text-blue-300");
        } else {
          a.classList.remove("text-blue-300");
        }
      });
      switch (page) {
        case "dashboard":
          renderDashboard();
          break;
        case "materi":
          renderMateriPage();
          break;
        case "progres":
          renderProgresPage();
          break;
        case "statistik":
          renderStatistikPage();
          break;
        case "about":
          renderAboutPage();
          break;
        default:
          renderDashboard();
      }
    }

    // Initial load
    navigateTo("dashboard");

    // Nav link clicks
    document.querySelectorAll("nav a[data-page]").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const page = e.currentTarget.dataset.page;
        navigateTo(page);
        // Scroll to top on page change
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });