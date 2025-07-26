from app import app, db, User, Customer, Model, ModelImage, ModelSize, ModelDescription, ModelLog
from werkzeug.security import generate_password_hash

with app.app_context():
    # Veritabanını oluştur
    db.drop_all()  # Tüm tabloları sil
    db.create_all()  # Yeni tabloları oluştur

    # Admin kullanıcısını oluştur
    admin = User(
        username='admin',
        password_hash=generate_password_hash('admin123'),
        role='admin'
    )
    db.session.add(admin)
    
    # Test kullanıcısı oluştur
    test_user = User(
        username='test',
        password_hash=generate_password_hash('test123'),
        role='user'
    )
    db.session.add(test_user)
    
    # Test müşterisi oluştur
    test_customer = Customer(
        customer_no='CUST001',
        name='Test Müşteri A.Ş.',
        phone='0212 123 45 67',
        email='test@musteri.com',
        address='İstanbul, Türkiye'
    )
    db.session.add(test_customer)
    
    db.session.commit()

    print("Veritabanı başarıyla oluşturuldu!")
    print("Admin kullanıcısı oluşturuldu:")
    print("Kullanıcı adı: admin")
    print("Şifre: admin123")
    print("\nTest kullanıcısı oluşturuldu:")
    print("Kullanıcı adı: test")
    print("Şifre: test123")
    print("\nTest müşterisi oluşturuldu:")
    print("Müşteri No: CUST001")
    print("Müşteri Adı: Test Müşteri A.Ş.")
    print("\nTablolar:")
    print("- users (Kullanıcı yönetimi)")
    print("- customers (Müşteri yönetimi)")
    print("- models (Model yönetimi)")
    print("- model_images (Model resimleri)")
    print("- model_sizes (Model bedenleri)")
    print("- model_descriptions (Model açıklamaları)")
    print("- model_logs (Model değişiklik logları)") 