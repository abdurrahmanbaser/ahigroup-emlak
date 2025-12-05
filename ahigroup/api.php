<?php
// api.php - Verileri alıp veren merkez

// Türkçe karakter sorunu olmasın diye ayar:
header("Content-Type: application/json; charset=UTF-8");

// Veritabanı bağlantımızı çağırıyoruz:
require_once 'db.php';

// Hangi işlemi yapmak istiyoruz? (GET: Veri Çek, POST: Veri Ekle)
$method = $_SERVER['REQUEST_METHOD'];

// --- GET İŞLEMİ (İlanları Listeleme) ---
if ($method == 'GET') {
    // Veritabanındaki tüm ilanları 'en yeni en üstte olacak şekilde' çek
    $sql = "SELECT * FROM ilanlar ORDER BY olusturma_tarihi DESC";
    
    // Sorguyu hazırla ve çalıştır
    $stmt = $db->prepare($sql);
    $stmt->execute();
    
    // Sonuçları bir liste (dizi) haline getir
    $ilanlar = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Bu listeyi JSON formatına (JavaScript'in anlayacağı dile) çevirip ekrana bas
    echo json_encode($ilanlar);
}

// --- POST İŞLEMİ (Yeni İlan Ekleme) ---
elseif ($method == 'POST') {
    // JavaScript'ten gelen veriyi al
    $veri = json_decode(file_get_contents("php://input"), true);
    
    // Verileri değişkenlere ata
    $baslik = $veri['baslik'];
    $aciklama = $veri['aciklama'];
    $fiyat = $veri['fiyat'];
    $konum = $veri['konum'];
    $resim = $veri['resim_url'];
    $kategori = $veri['kategori'];
    
    // Veritabanına ekle
    $sql = "INSERT INTO ilanlar (baslik, aciklama, fiyat, konum, resim_url, kategori) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $db->prepare($sql);
    
    if($stmt->execute([$baslik, $aciklama, $fiyat, $konum, $resim, $kategori])) {
        echo json_encode(["mesaj" => "İlan başarıyla eklendi"]);
    } else {
        echo json_encode(["hata" => "Ekleme başarısız"]);
    }
}
?>