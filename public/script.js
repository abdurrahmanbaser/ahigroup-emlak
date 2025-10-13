document.addEventListener('DOMContentLoaded', () => {
    // --- MOBİL MENÜ KONTROLÜ (TÜM SAYFALAR İÇİN) ---
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('header nav');

    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            // Menüye 'is-active' class'ını ekle veya kaldır
            nav.classList.toggle('is-active');

            // Butonun ikonunu değiştir (☰ veya ×)
            if (nav.classList.contains('is-active')) {
                menuToggle.innerHTML = '&times;'; // Çarpı işareti
            } else {
                menuToggle.innerHTML = '☰'; // Hamburger ikonu
            }
        });
    }

    // --- ANA KONTROL ---
    if (document.querySelector('.slider-container')) {
        initializeHomepage();
    } else if (document.querySelector('.listings-grid')) {
        initializeListingsPage();
    } else if (document.getElementById('listing-detail-page')) {
        initializeDetailPage();
    }

    // ======================= ANASAYFA FONKSİYONLARI =======================
    async function initializeHomepage() {
        const sliderContainer = document.querySelector('.slider-container');
        const sliderWrapper = document.querySelector('.slider-wrapper');
        const nextBtn = document.getElementById('next-btn');
        const prevBtn = document.getElementById('prev-btn');
        const openFilterBtn = document.getElementById('open-filter-btn');
        const closeFilterBtn = document.getElementById('close-filter-btn');
        const filterModal = document.getElementById('filter-modal');
        const filterButton = document.querySelector('.modal-content .filter-button');

        let ilanlar = [];
        try {
            const response = await fetch('https://ahigroup-backend.onrender.com/api/ilanlar');
            if (!response.ok) throw new Error('Network response was not ok');
            ilanlar = await response.json();
        } catch (error) {
            console.error('Anasayfa verisi çekilirken hata:', error);
            if (sliderContainer) sliderContainer.innerHTML = '<p class="no-results">İlanlar yüklenemedi. Backend sunucusunun çalıştığından emin misin?</p>';
            return;
        }

        let currentIndex = 0;
        let autoScrollInterval;

        function setupSlider(propertyList) {
            sliderContainer.innerHTML = '';
            const doubledList = [...propertyList, ...propertyList];
            doubledList.forEach(ilan => {
                const card = document.createElement('div');
                card.className = 'slide property-card';
                
                const anaResim = ilan.resimler && ilan.resimler.length > 0 ? ilan.resimler[0] : null;
                const imageUrl = anaResim ? `https://ahigroup-backend.onrender.com/${anaResim.replace(/\\/g, '/')}` : 'https://via.placeholder.com/400x250.png?text=Resim+Yok';
                
                card.innerHTML = `<div class="card-image"><img src="${imageUrl}" alt="${ilan.baslik}"><div class="card-price">${ilan.fiyat}</div></div><div class="card-content"><h3>${ilan.baslik}</h3><p>📍 ${ilan.konum}</p><div class="card-features"><span>🛏️ ${ilan.odaSayisi}</span><span>🛁 ${ilan.banyo}</span><span>📐 ${ilan.metrekare} m²</span></div><a href="ilan-detay.html?id=${ilan.id}" class="card-button">Detayları Gör</a></div>`;
                sliderContainer.appendChild(card);
            });
            startSliderLogic(propertyList.length);
        }

        function startSliderLogic(originalItemCount) {
            const items = document.querySelectorAll('#portfolio-slider .property-card');
            if (items.length === 0 || !items[0]) return;
            const itemWidth = items[0].offsetWidth + 24;
            
            function moveTo(index) {
                if(!sliderContainer) return;
                sliderContainer.style.transition = 'transform 0.5s ease-in-out';
                sliderContainer.style.transform = `translateX(-${index * itemWidth}px)`;
                currentIndex = index;
            }

            function handleNext() {
                if (currentIndex >= originalItemCount) {
                    sliderContainer.style.transition = 'none';
                    currentIndex = 0;
                    sliderContainer.style.transform = `translateX(0px)`;
                    setTimeout(() => { moveTo(currentIndex + 1); }, 20);
                } else {
                    moveTo(currentIndex + 1);
                }
            }

            function handlePrev() {
                if (currentIndex <= 0) {
                    sliderContainer.style.transition = 'none';
                    currentIndex = originalItemCount;
                    sliderContainer.style.transform = `translateX(-${currentIndex * itemWidth}px)`;
                    setTimeout(() => { moveTo(currentIndex - 1); }, 20);
                } else {
                    moveTo(currentIndex - 1);
                }
            }
            
            nextBtn.addEventListener('click', handleNext);
            prevBtn.addEventListener('click', handlePrev);

            function startAutoScroll() {
                if (autoScrollInterval) clearInterval(autoScrollInterval);
                autoScrollInterval = setInterval(handleNext, 4000);
            }

            sliderWrapper.addEventListener('mouseenter', () => clearInterval(autoScrollInterval));
            sliderWrapper.addEventListener('mouseleave', startAutoScroll);

            startAutoScroll();
        }

        function openModal() { filterModal.classList.add('active'); }
        function closeModal() { filterModal.classList.remove('active'); }

        function applyFiltersAndRedirect() {
            const secilenTip = document.querySelector('input[name="modal-ilan-tipi"]:checked').value;
            const minFiyat = document.getElementById('modal-price-min').value;
            const maxFiyat = document.getElementById('modal-price-max').value;
            const secilenOda = document.getElementById('modal-room-count').value;
            let url = 'ilanlar.html?';
            if (secilenTip !== 'all') url += `tip=${secilenTip}&`;
            if (minFiyat) url += `minFiyat=${minFiyat}&`;
            if (maxFiyat) url += `maxFiyat=${maxFiyat}&`;
            if (secilenOda) url += `oda=${secilenOda}&`;
            window.location.href = url;
        }

        openFilterBtn.addEventListener('click', openModal);
        closeFilterBtn.addEventListener('click', closeModal);
        filterModal.addEventListener('click', (event) => { if (event.target === filterModal) closeModal(); });
        filterButton.addEventListener('click', applyFiltersAndRedirect);

        setupSlider(ilanlar);
    }

    // ======================= İLANLAR SAYFASI FONKSİYONLARI =======================
    async function initializeListingsPage() {
        let ilanlar = [];
        try {
            const response = await fetch('https://ahigroup-backend.onrender.com/api/ilanlar');
            if (!response.ok) throw new Error('Network response was not ok');
            ilanlar = await response.json();
        } catch (error) {
            console.error('İlan listesi verisi çekilirken hata:', error);
            document.querySelector('.listings-grid').innerHTML = '<p class="no-results">İlanlar yüklenemedi. Backend sunucusunun çalıştığından emin misin?</p>';
            return;
        }

        const listingsGrid = document.querySelector('.listings-grid');
        const filterButtonOnPage = document.querySelector('.filter-sidebar .filter-button');
        const sortBySelect = document.getElementById('sort-by');

        function displayListings(propertyList) {
            listingsGrid.innerHTML = '';
            if (propertyList.length === 0) {
                listingsGrid.innerHTML = '<p class="no-results">Bu kriterlere uygun ilan bulunamadı.</p>';
                return;
            }
            let allCardsHTML = '';
            propertyList.forEach(ilan => {
                const anaResim = ilan.resimler && ilan.resimler.length > 0 ? ilan.resimler[0] : null;
                const imageUrl = anaResim ? `https://ahigroup-backend.onrender.com/${anaResim.replace(/\\/g, '/')}` : 'https://via.placeholder.com/400x250.png?text=Resim+Yok';
                allCardsHTML += `<div class="property-card"><div class="card-image"><img src="${imageUrl}" alt="${ilan.baslik}"></div><div class="card-content"><h4>${ilan.fiyat}</h4><h3>${ilan.baslik}</h3><p>📍 ${ilan.konum}</p><div class="card-features"><span>🛏️ ${ilan.odaSayisi}</span><span>🛁 ${ilan.banyo}</span><span>📐 ${ilan.metrekare} m²</span></div><a href="ilan-detay.html?id=${ilan.id}" class="card-button">Detayları Gör</a></div></div>`;
            });
            listingsGrid.innerHTML = allCardsHTML;
        }
        
        function applyFiltersOnPage() {
            const filters = {
                tip: document.querySelector('input[name="ilan-tipi"]:checked').value,
                minFiyat: parseFloat(document.getElementById('price-min').value) || 0,
                maxFiyat: parseFloat(document.getElementById('price-max').value) || Infinity,
                oda: document.getElementById('room-count').value
            };
            const filtrelenmisIlanlar = ilanlar.filter(ilan => {
                const ilanFiyati = parseFloat(ilan.fiyat.replace(/[^0-9]/g, ''));
                const tipUygun = filters.tip === 'all' || ilan.tip === filters.tip;
                const fiyatUygun = ilanFiyati >= minFiyat && ilanFiyati <= maxFiyat;
                const odaUygun = filters.oda === '' || ilan.odaSayisi === filters.oda;
                return tipUygun && fiyatUygun && odaUygun;
            });
            displayListings(filtrelenmisIlanlar);
        }

        async function handleSortChange() {
            try {
                const sortOption = sortBySelect.value;
                const response = await fetch(`https://ahigroup-backend.onrender.com/api/ilanlar?sortBy=${sortOption}`);
                if (!response.ok) throw new Error('Network response was not ok');
                ilanlar = await response.json(); // Ana listeyi sıralanmış yeni veriyle güncelle
                applyFiltersOnPage(); // Filtreleri bu yeni sıralanmış liste üzerinde uygula
            } catch(error) {
                console.error("Sıralama sırasında hata:", error);
            }
        }

        const params = new URLSearchParams(window.location.search);
        const initialFilters = { tip: params.get('tip') || 'all', minFiyat: params.get('minFiyat') || '', maxFiyat: params.get('maxFiyat') || '', oda: params.get('oda') || '' };
        
        const tipRadio = document.querySelector(`input[name="ilan-tipi"][value="${initialFilters.tip}"]`);
        if (tipRadio) tipRadio.checked = true;
        
        // --- HATA BURADAYDI VE DÜZELTİLDİ ---
        // Artık doğru kutudan (initialFilters) değerleri okuyoruz.
        if (initialFilters.minFiyat) document.getElementById('price-min').value = initialFilters.minFiyat;
        if (initialFilters.maxFiyat) document.getElementById('price-max').value = initialFilters.maxFiyat;
        if (initialFilters.oda) document.getElementById('room-count').value = initialFilters.oda;
        
        displayListings(ilanlar); // Sayfa ilk açıldığında varsayılan sıralama ile göster
        
        if(filterButtonOnPage) filterButtonOnPage.addEventListener('click', applyFiltersOnPage);
        if(sortBySelect) sortBySelect.addEventListener('change', handleSortChange);
    }

    // ======================= İLAN DETAY SAYFASI FONKSİYONLARI =======================
    // Bu bölüm öncekiyle aynı, değişiklik yok.
    async function initializeDetailPage() {
        const mainContent = document.getElementById('listing-detail-page');
        const params = new URLSearchParams(window.location.search);
        const ilanId = parseInt(params.get('id'));

        let ilan;
        try {
            const response = await fetch('https://ahigroup-backend.onrender.com/api/ilanlar');
            if (!response.ok) throw new Error('Network response was not ok');
            const ilanlar = await response.json();
            ilan = ilanlar.find(item => item.id === ilanId);
        } catch (error) {
            console.error('İlan detay verisi çekilirken hata:', error);
            mainContent.innerHTML = '<div class="container"><h1>İlan Yüklenemedi.</h1></div>';
            return;
        }

        if (!ilan) {
            mainContent.innerHTML = '<div class="container"><h1>İlan Bulunamadı</h1></div>';
            return;
        }

        document.title = `${ilan.baslik} | Ahi GROUP Gayrimenkul`;

        const anaResim = ilan.resimler && ilan.resimler.length > 0 ? ilan.resimler[0] : null;
        const anaResimUrl = anaResim ? `https://ahigroup-backend.onrender.com/${anaResim.replace(/\\/g, '/')}` : 'https://via.placeholder.com/800x600.png?text=Resim+Yok';
        
        let galeriHTML = '';
        if (ilan.resimler && ilan.resimler.length > 1) {
            ilan.resimler.forEach(resimUrl => {
                galeriHTML += `<img class="thumbnail" src="https://ahigroup-backend.onrender.com/${resimUrl.replace(/\\/g, '/')}">`;
            });
        }

        const pageHTML = `
            <div class="container listing-detail-container">
                <div class="listing-main-content">
                    <div class="listing-gallery">
                        <img id="main-image" src="${anaResimUrl}" alt="${ilan.baslik}">
                        <div class="thumbnail-container">${galeriHTML}</div>
                    </div>
                    <div class="listing-header"><h1>${ilan.baslik}</h1><p class="location">📍 ${ilan.konum}</p></div>
                    <div class="listing-description"><h2>İlan Açıklaması</h2><p>${ilan.aciklama}</p></div>
                </div>
                <aside class="listing-sidebar">
                    <div class="agent-contact-box">
                        <p class="price" style="text-align: center; font-size: 2rem;">${ilan.fiyat}</p>
                        <hr style="border-color: #444; margin: 1rem 0;">
                        <img src="https://via.placeholder.com/100x100.png?text=Danışman" alt="Danışman" class="agent-photo">
                        <p class="agent-name">Ahi GROUP Danışmanlık</p>
                        <h3>Bu Mülk İçin Bilgi Alın</h3>
                        <form><input type="text" placeholder="Adınız Soyadınız" required><input type="tel" placeholder="Telefon Numaranız" required><textarea placeholder="Merhaba, bu ilan hakkında bilgi almak istiyorum..." rows="4"></textarea><button type="submit">Mesaj Gönder</button></form>
                    </div>
                    <ul class="listing-features" style="margin-top: 2rem;">
                        <li>Oda Sayısı: <strong>${ilan.odaSayisi}</strong></li>
                        <li>Banyo: <strong>${ilan.banyo}</strong></li>
                        <li>Metrekare: <strong>${ilan.metrekare} m²</strong></li>
                        <li>İlan Tipi: <strong>${ilan.tip === 'satilik' ? 'Satılık' : 'Kiralık'}</strong></li>
                    </ul>
                </aside>
            </div>
        `;
        mainContent.innerHTML = pageHTML;

        mainContent.querySelectorAll('.thumbnail').forEach(thumb => {
            thumb.addEventListener('click', () => {
                mainContent.querySelector('#main-image').src = thumb.src;
            });
        });
    }

});