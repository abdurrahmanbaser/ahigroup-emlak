document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Gerekli HTML Elementlerini Seçelim ---
    const tableBody = document.getElementById('listings-table-body');
    const addListingModal = document.getElementById('add-listing-modal');
    const openModalBtn = document.getElementById('add-new-btn');
    const closeModalBtn = addListingModal.querySelector('.close-btn');
    const addListingForm = document.getElementById('add-listing-form');
    // Yeni eklenen resim önizleme alanı
    const existingImagesContainer = document.getElementById('existing-images-container');

    // --- 2. Fonksiyonlarımızı Tanımlayalım ---

    /**
     * Sunucudan ilanları çeker ve tabloyu günceller.
     */
    async function fetchAndDisplayListings() {
        try {
            const response = await fetch('https://ahigroup-backend.onrender.com/api/ilanlar');
            const ilanlar = await response.json();

            tableBody.innerHTML = ''; // Tabloyu temizle

            if (ilanlar.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Gösterilecek ilan yok.</td></tr>';
                return;
            }

            ilanlar.forEach(ilan => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${ilan.id}</td>
                    <td>${ilan.baslik}</td>
                    <td>${ilan.fiyat}</td>
                    <td>${ilan.tip}</td>
                    <td>
                        <button class="edit-btn">Düzenle</button>
                        <button class="delete-btn">Sil</button>
                    </td>
                `;
                tableBody.appendChild(row);

                // Silme butonu olayı
                row.querySelector('.delete-btn').addEventListener('click', async () => {
                    if (!confirm(`"${ilan.baslik}" başlıklı ilanı silmek istediğinize emin misiniz?`)) return;
                    await fetch(`https://ahigroup-backend.onrender.com/api/ilanlar/${ilan.id}`, { method: 'DELETE' });
                    fetchAndDisplayListings();
                });

                // Düzenleme butonu olayı (GÜNCELLENMİŞ KISIM)
                row.querySelector('.edit-btn').addEventListener('click', () => {
                    addListingModal.querySelector('h3').textContent = 'İlanı Düzenle';
                    addListingForm.querySelector('button[type="submit"]').textContent = 'Değişiklikleri Kaydet';
                    addListingForm.setAttribute('data-editing-id', ilan.id);
                    
                    document.getElementById('baslik').value = ilan.baslik;
                    document.getElementById('fiyat').value = ilan.fiyat;
                    document.getElementById('konum').value = ilan.konum;
                    document.getElementById('tip').value = ilan.tip;
                    document.getElementById('odaSayisi').value = ilan.odaSayisi;
                    document.getElementById('metrekare').value = ilan.metrekare;
                    document.getElementById('banyo').value = ilan.banyo;
                    document.getElementById('aciklama').value = ilan.aciklama;

                    // --- YENİ KISIM: MEVCUT RESİMLERİ GÖSTER ---
                    existingImagesContainer.innerHTML = ''; // Önce içini temizle

                    if (ilan.resimler && ilan.resimler.length > 0) {
                        ilan.resimler.forEach(resimUrl => {
                            if (!resimUrl) return; // Boş resim URL'sini atla
                            const imageUrl = `https://ahigroup-backend.onrender.com/${resimUrl.replace(/\\/g, '/')}`;
                            const imageWrapper = document.createElement('div');
                            imageWrapper.style.display = 'inline-block';
                            imageWrapper.style.position = 'relative';
                            imageWrapper.style.margin = '5px';
                            imageWrapper.innerHTML = `<img src="${imageUrl}" style="width:100px; height:100px; object-fit:cover; border-radius:5px;">`;
                            existingImagesContainer.appendChild(imageWrapper);
                        });
                    } else {
                        existingImagesContainer.innerHTML = '<p>Bu ilana ait resim yok.</p>';
                    }
                    
                    openModal();
                });
            });

        } catch (error) { console.error('İlanlar çekilirken hata:', error); }
    }

    /**
     * Yeni ilan ekleme veya düzenleme formunu yönetir.
     */
    async function handleFormSubmit(event) {
        event.preventDefault();
        const formData = new FormData(addListingForm);
        const editingId = addListingForm.getAttribute('data-editing-id');
        const url = editingId ? `https://ahigroup-backend.onrender.com/api/ilanlar/${editingId}` : 'https://ahigroup-backend.onrender.com/api/ilanlar';
        const method = editingId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, { method: method, body: formData });
            if (!response.ok) throw new Error('Sunucu hatası');
            closeModal();
            fetchAndDisplayListings();
        } catch (error) { console.error('Hata:', error); alert('İşlem gerçekleştirilemedi.'); }
    }
    
    /**
     * Modal penceresini açar ve kapatır.
     */
    function openModal() { addListingModal.classList.add('active'); }
    function closeModal() {
        addListingModal.classList.remove('active');
        addListingForm.reset();
        addListingForm.removeAttribute('data-editing-id');
        addListingModal.querySelector('h3').textContent = 'Yeni İlan Ekle';
        addListingForm.querySelector('button[type="submit"]').textContent = 'İlanı Kaydet';
        // Önizleme alanını da temizle
        existingImagesContainer.innerHTML = '<p>Bu ilana ait resim yok.</p>';
    }

    // --- 3. Olay Dinleyicilerini Kuralım ---
    openModalBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    addListingModal.addEventListener('click', (event) => {
        if (event.target === addListingModal) closeModal();
    });
    addListingForm.addEventListener('submit', handleFormSubmit);

    // Çıkış yap butonu
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
                window.location.href = '/logout';
            }
        });
    }

    // --- 4. Sayfa İlk Yüklendiğinde Tabloyu Dolduralım ---
    fetchAndDisplayListings();
});