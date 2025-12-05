<?php
// db.php - Veritabanı Bağlantı Dosyası

// XAMPP (Localhost) için standart ayarlar:
$host = "localhost";
$dbname = "ahigroup_db";  // Az önce oluşturduğun veritabanı adı
$username = "root";       // XAMPP'ta varsayılan kullanıcı adı hep 'root'tur
$password = "";           // XAMPP'ta varsayılan şifre BOŞTUR (Hiçbir şey yazma)

try {
    // Bağlantıyı kuruyoruz
    $db = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    
    // Hata modunu açıyoruz (Bir sorun olursa gizlemesin, söylesin)
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // --- TEST KISMI (Bağlantı kurulunca bu mesajı göreceksin) ---
    // echo "✅ Tebrikler! Veritabanı bağlantısı başarıyla kuruldu."; 
    
} catch (PDOException $e) {
    // Bağlantı olmazsa hatayı göster ve durdur
    die("❌ Bağlantı hatası: " . $e->getMessage());
}
?>