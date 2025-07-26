from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
import uuid

db = SQLAlchemy()

class Kullanici(db.Model, UserMixin):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    kullanici_adi = db.Column(db.String(150), unique=True, nullable=False)
    sifre_hash = db.Column(db.String(256), nullable=False)
    rol = db.Column(db.String(20), default='kullanici')
    aktif = db.Column(db.Boolean, default=True)

class Musteri(db.Model):
    __tablename__ = 'customers'
    id = db.Column(db.Integer, primary_key=True)
    musteri_no = db.Column(db.String(20), unique=True, nullable=False)
    musteri_adi = db.Column(db.String(150), nullable=False)
    telefon = db.Column(db.String(50))
    email = db.Column(db.String(100))
    adres = db.Column(db.Text)
    vergi_no = db.Column(db.String(50))
    vergi_dairesi = db.Column(db.String(100))
    notlar = db.Column(db.Text)
    eklenme_tarihi = db.Column(db.DateTime, default=datetime.utcnow)

class Model(db.Model):
    __tablename__ = 'models'
    id = db.Column(db.Integer, primary_key=True)
    model_no = db.Column(db.String(50), unique=True, nullable=False)
    model_adi = db.Column(db.String(200), nullable=False)
    musteri_model_no = db.Column(db.String(100))
    kompozisyon = db.Column(db.Text)
    model_grubu = db.Column(db.String(100))
    grup_aciklamasi = db.Column(db.Text)
    stok_kodu = db.Column(db.String(50))
    stok_adi = db.Column(db.String(200))
    model_order_no = db.Column(db.String(50))  # Model sipariş numarası
    acilis_tarihi = db.Column(db.Date)
    termin_tarihi = db.Column(db.Date)  # Termin tarihi eklendi
    termin_gun_sayisi = db.Column(db.Integer)  # Gün sayısı eklendi
    hazirlayan_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    model_alt_grubu = db.Column(db.String(100))
    lisansli_karakter = db.Column(db.String(100))
    aciklama = db.Column(db.Text)
    olusturma_tarihi = db.Column(db.DateTime, default=datetime.utcnow)
    guncelleme_tarihi = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Müşteri ilişkisi
    musteri_id = db.Column(db.Integer, db.ForeignKey('customers.id'))
    
    # Onaylama alanları
    onaylayan_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    onaylama_tarihi = db.Column(db.DateTime)
    onay_durumu = db.Column(db.String(20), default='beklemede')  # beklemede, onaylandı, reddedildi
    
    # İlişkiler
    musteri = db.relationship('Musteri', backref='modeller')
    hazirlayan = db.relationship('Kullanici', foreign_keys=[hazirlayan_id], backref='hazirladigi_modeller')
    onaylayan = db.relationship('Kullanici', foreign_keys=[onaylayan_id], backref='onayladigi_modeller')
    resimler = db.relationship('ModelResim', backref='model', cascade='all, delete-orphan')
    aciklamalar = db.relationship('ModelAciklama', backref='model', cascade='all, delete-orphan')
    loglar = db.relationship('ModelLog', backref='model', cascade='all, delete-orphan')

class ModelResim(db.Model):
    __tablename__ = 'model_resimler'
    id = db.Column(db.Integer, primary_key=True)
    unique_id = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    model_id = db.Column(db.Integer, db.ForeignKey('models.id'), nullable=False)
    dosya_adi = db.Column(db.String(255), nullable=False)
    dosya_yolu = db.Column(db.String(500), nullable=False)
    dosya_boyutu = db.Column(db.Integer)
    mime_type = db.Column(db.String(100))
    yuklenme_tarihi = db.Column(db.DateTime, default=datetime.utcnow)
    aciklama = db.Column(db.Text)
    ana_resim = db.Column(db.Boolean, default=False)  # Ana resim olarak işaretleme

class ModelAciklama(db.Model):
    __tablename__ = 'model_aciklamalar'
    id = db.Column(db.Integer, primary_key=True)
    model_id = db.Column(db.Integer, db.ForeignKey('models.id'), nullable=False)
    aciklama_tipi = db.Column(db.String(50), nullable=False)  # genel, dikim, numune, paketleme, aksesuar, baskı_nakış, ek
    baslik = db.Column(db.String(200))
    icerik = db.Column(db.Text)
    olusturma_tarihi = db.Column(db.DateTime, default=datetime.utcnow)
    guncelleme_tarihi = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ModelBeden(db.Model):
    __tablename__ = 'model_bedenler'
    id = db.Column(db.Integer, primary_key=True)
    model_id = db.Column(db.Integer, db.ForeignKey('models.id'), nullable=False)
    beden_kodu = db.Column(db.String(20), nullable=False)  # XS, S, M, L, XL, XXL, vb.
    beden_adi = db.Column(db.String(50), nullable=False)  # Extra Small, Small, Medium, vb.
    uretim_adeti = db.Column(db.Integer, default=0)  # Bu bedenden kaç adet üretilecek
    olusturma_tarihi = db.Column(db.DateTime, default=datetime.utcnow)
    guncelleme_tarihi = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # İlişkiler
    model = db.relationship('Model', backref='bedenler')

class ModelLog(db.Model):
    __tablename__ = 'model_loglar'
    id = db.Column(db.Integer, primary_key=True)
    model_id = db.Column(db.Integer, db.ForeignKey('models.id'), nullable=False)
    kullanici_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    islem_tipi = db.Column(db.String(50), nullable=False)  # oluşturma, güncelleme, onaylama, silme
    eski_deger = db.Column(db.Text)  # JSON formatında eski değerler
    yeni_deger = db.Column(db.Text)  # JSON formatında yeni değerler
    aciklama = db.Column(db.Text)
    islem_tarihi = db.Column(db.DateTime, default=datetime.utcnow)
    
    # İlişkiler
    kullanici = db.relationship('Kullanici', backref='model_loglari') 