from flask import Flask, request, jsonify, send_from_directory, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
import os
import json
import uuid
import sqlite3
import base64

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=10)

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

CORS(app, origins=['http://localhost:8000', 'http://127.0.0.1:8000', 'http://localhost:3000'], supports_credentials=True, allow_headers=['Content-Type', 'Authorization'])

# Database setup
def get_db():
    db = sqlite3.connect('instance/knitwear_erp.db')
    db.row_factory = sqlite3.Row
    return db

def init_db():
    with get_db() as db:
        # Create tables
        db.executescript('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_no TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                phone TEXT,
                address TEXT,
                email TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS models (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                model_no TEXT UNIQUE NOT NULL,
                model_name TEXT NOT NULL,
                customer_id INTEGER,
                customer_model_no TEXT,
                composition TEXT,
                model_group TEXT,
                group_description TEXT,
                stock_code TEXT,
                stock_name TEXT,
                model_order_no TEXT,
                opening_date DATE,
                due_date DATE,
                due_days INTEGER,
                prepared_by INTEGER,
                approved_by INTEGER,
                approval_date DATETIME,
                approval_status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers (id),
                FOREIGN KEY (prepared_by) REFERENCES users (id),
                FOREIGN KEY (approved_by) REFERENCES users (id)
            );
            
            CREATE TABLE IF NOT EXISTS model_images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                model_id INTEGER NOT NULL,
                filename TEXT NOT NULL,
                is_main BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (model_id) REFERENCES models (id)
            );
            
            CREATE TABLE IF NOT EXISTS model_sizes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                model_id INTEGER NOT NULL,
                size_code TEXT NOT NULL,
                size_name TEXT NOT NULL,
                production_quantity INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (model_id) REFERENCES models (id)
            );
            
            CREATE TABLE IF NOT EXISTS model_descriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                model_id INTEGER NOT NULL,
                description_type TEXT NOT NULL,
                description_text TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (model_id) REFERENCES models (id)
            );
            
            CREATE TABLE IF NOT EXISTS model_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                model_id INTEGER NOT NULL,
                user_id INTEGER,
                action_type TEXT NOT NULL,
                old_value TEXT,
                new_value TEXT,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (model_id) REFERENCES models (id),
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
            
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_no TEXT UNIQUE NOT NULL,
                customer_id INTEGER NOT NULL,
                model_id INTEGER NOT NULL,
                order_date DATE NOT NULL,
                delivery_date DATE,
                total_quantity INTEGER NOT NULL,
                unit_price DECIMAL(10,2),
                total_price DECIMAL(10,2),
                status TEXT DEFAULT 'pending',
                notes TEXT,
                created_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers (id),
                FOREIGN KEY (model_id) REFERENCES models (id),
                FOREIGN KEY (created_by) REFERENCES users (id)
            );
            
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                size_code TEXT NOT NULL,
                size_name TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                unit_price DECIMAL(10,2),
                total_price DECIMAL(10,2),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders (id)
            );
        ''')
        
        # Create admin user if not exists
        cursor = db.execute('SELECT id FROM users WHERE username = ?', ('admin',))
        if not cursor.fetchone():
            db.execute(
                'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
                ('admin', generate_password_hash('admin123'), 'admin')
            )
            db.commit()

# Test endpoint
@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({'success': True, 'message': 'Backend is running!'})

# Static file serving for images
@app.route('/images/<path:filename>')
def serve_image(filename):
    """Serve uploaded images"""
    try:
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    except FileNotFoundError:
        return jsonify({'error': 'Image file not found'}), 404

# Authentication routes
@app.route('/api/login', methods=['POST'])
def login():
    print("Login attempt received")
    try:
        data = request.get_json()
        print(f"Request data: {data}")
        username = data.get('username')
        password = data.get('password')
        print(f"Username: {username}")
    except Exception as e:
        print(f"Error parsing request: {e}")
        return jsonify({'success': False, 'message': 'Invalid request format'}), 400
    
    with get_db() as db:
        user = db.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
        if user and check_password_hash(user['password_hash'], password):
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['role'] = user['role']
            
            # Update last activity
            db.execute('UPDATE users SET last_activity = ? WHERE id = ?', (datetime.utcnow(), user['id']))
            db.commit()
            
            return jsonify({
                'success': True,
                'user': {
                    'id': user['id'],
                    'username': user['username'],
                    'role': user['role']
                }
            })
    
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@app.route('/api/check-session', methods=['GET'])
def check_session():
    if 'user_id' in session:
        return jsonify({
            'success': True,
            'user': {
                'id': session['user_id'],
                'username': session['username'],
                'role': session['role']
            }
        })
    return jsonify({'success': False, 'message': 'Not authenticated'}), 401

# Customer routes
@app.route('/api/musteriler', methods=['GET'])
def get_musteriler():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    with get_db() as db:
        customers = db.execute('SELECT * FROM customers ORDER BY created_at DESC').fetchall()
        return jsonify({
            'success': True,
            'musteriler': [{
                'id': c['id'],
                'musteri_no': c['customer_no'],
                'musteri_adi': c['name'],
                'telefon': c['phone'],
                'adres': c['address'],
                'email': c['email']
            } for c in customers]
        })

@app.route('/api/musteriler', methods=['POST'])
def add_musteri():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    data = request.get_json()
    
    # Generate unique customer number if not provided
    musteri_no = data.get('musteri_no')
    if not musteri_no:
        musteri_no = f"CUST{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    with get_db() as db:
        # Check if customer number already exists
        existing = db.execute('SELECT id FROM customers WHERE customer_no = ?', (musteri_no,)).fetchone()
        if existing:
            return jsonify({'success': False, 'message': 'Müşteri numarası zaten mevcut'}), 400
        
        # Add customer
        cursor = db.execute(
            'INSERT INTO customers (customer_no, name, phone, address, email) VALUES (?, ?, ?, ?, ?)',
            (musteri_no, data.get('musteri_adi'), data.get('telefon'), data.get('adres'), data.get('email'))
        )
        db.commit()
        
        customer_id = cursor.lastrowid
        
        return jsonify({
            'success': True,
            'message': 'Müşteri başarıyla eklendi',
            'musteri': {
                'id': customer_id,
                'musteri_no': musteri_no,
                'musteri_adi': data.get('musteri_adi'),
                'telefon': data.get('telefon'),
                'adres': data.get('adres'),
                'email': data.get('email')
            }
        })

# Model routes
@app.route('/api/modeller', methods=['GET'])
def get_modeller():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    with get_db() as db:
        models = db.execute('''
            SELECT m.*, c.name as customer_name, c.customer_no as customer_no,
                   u.username as prepared_by_name
            FROM models m
            LEFT JOIN customers c ON m.customer_id = c.id
            LEFT JOIN users u ON m.prepared_by = u.id
            ORDER BY m.created_at DESC
        ''').fetchall()
        
        return jsonify({
            'success': True,
            'modeller': [{
                'id': m['id'],
                'model_no': m['model_no'],
                'model_adi': m['model_name'],
                'musteri': {
                    'id': m['customer_id'],
                    'musteri_adi': m['customer_name'],
                    'musteri_no': m['customer_no']
                } if m['customer_id'] else None,
                'musteri_model_no': m['customer_model_no'],
                'kompozisyon': m['composition'],
                'model_grubu': m['model_group'],
                'grup_aciklamasi': m['group_description'],
                'stok_kodu': m['stock_code'],
                'stok_adi': m['stock_name'],
                'model_order_no': m['model_order_no'],
                'acilis_tarihi': m['opening_date'],
                'termin_tarihi': m['due_date'],
                'termin_gunleri': m['due_days'],
                'hazirlayan': m['prepared_by_name'],
                'onay_durumu': m['approval_status'],
                'olusturma_tarihi': m['created_at'],
                'guncelleme_tarihi': m['updated_at']
            } for m in models]
        })

@app.route('/api/modeller', methods=['POST'])
def add_model():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    data = request.get_json()
    
    # Generate unique model number if not provided
    model_no = data.get('model_no')
    if not model_no:
        model_no = f"MODEL{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    with get_db() as db:
        # Check if model number already exists
        existing = db.execute('SELECT id FROM models WHERE model_no = ?', (model_no,)).fetchone()
        if existing:
            return jsonify({'success': False, 'message': 'Model numarası zaten mevcut'}), 400
        
        # Add model
        cursor = db.execute('''
            INSERT INTO models (model_no, model_name, customer_id, customer_model_no, composition,
                              model_group, group_description, stock_code, stock_name, model_order_no,
                              opening_date, due_date, due_days, prepared_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            model_no, data.get('model_adi'), data.get('musteri_id'), data.get('musteri_model_no'),
            data.get('kompozisyon'), data.get('model_grubu'), data.get('grup_aciklamasi'),
            data.get('stok_kodu'), data.get('stok_adi'), data.get('model_order_no'),
            data.get('acilis_tarihi'), data.get('termin_tarihi'), data.get('termin_gunleri'),
            session['user_id']
        ))
        db.commit()
        
        model_id = cursor.lastrowid
        
        # Log the creation
        db.execute('''
            INSERT INTO model_logs (model_id, user_id, action_type, description)
            VALUES (?, ?, ?, ?)
        ''', (model_id, session['user_id'], 'creation', f'Model {model_no} oluşturuldu'))
        db.commit()
        
        return jsonify({
            'success': True,
            'message': 'Model başarıyla eklendi',
            'model': {
                'id': model_id,
                'model_no': model_no,
                'model_adi': data.get('model_adi')
            }
        })

# Orders API endpoints
@app.route('/api/siparisler', methods=['GET'])
def get_siparisler():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    with get_db() as db:
        orders = db.execute('''
            SELECT o.*, c.name as customer_name, c.customer_no as customer_no,
                   m.model_name, m.model_no as model_no
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            LEFT JOIN models m ON o.model_id = m.id
            ORDER BY o.created_at DESC
        ''').fetchall()
        
        return jsonify({
            'success': True,
            'data': [{
                'id': o['id'],
                'siparis_no': o['order_no'],
                'musteri': {
                    'id': o['customer_id'],
                    'musteri_adi': o['customer_name'],
                    'musteri_no': o['customer_no']
                },
                'model': {
                    'id': o['model_id'],
                    'model_adi': o['model_name'],
                    'model_no': o['model_no']
                },
                'siparis_tarihi': o['order_date'],
                'teslim_tarihi': o['delivery_date'],
                'toplam_adet': o['total_quantity'],
                'birim_fiyat': float(o['unit_price']) if o['unit_price'] else 0,
                'toplam_fiyat': float(o['total_price']) if o['total_price'] else 0,
                'durum': o['status']
            } for o in orders]
        })

@app.route('/api/siparisler', methods=['POST'])
def add_siparis():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    data = request.get_json()
    
    # Generate unique order number if not provided
    order_no = data.get('siparis_no')
    if not order_no:
        order_no = f"SIPARIS{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    with get_db() as db:
        # Check if order number already exists
        existing = db.execute('SELECT id FROM orders WHERE order_no = ?', (order_no,)).fetchone()
        if existing:
            return jsonify({'success': False, 'message': 'Sipariş numarası zaten mevcut'}), 400
        
        # Calculate total price
        total_quantity = data.get('toplam_adet', 0)
        unit_price = data.get('birim_fiyat', 0)
        total_price = total_quantity * unit_price
        
        # Add order
        cursor = db.execute('''
            INSERT INTO orders (order_no, customer_id, model_id, order_date, delivery_date,
                              total_quantity, unit_price, total_price, status, notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            order_no, data.get('musteri_id'), data.get('model_id'), data.get('siparis_tarihi'),
            data.get('teslim_tarihi'), total_quantity, unit_price, total_price,
            data.get('durum', 'pending'), data.get('notlar'), session['user_id']
        ))
        db.commit()
        
        order_id = cursor.lastrowid
        
        # Add order items if provided
        if data.get('siparis_kalemleri'):
            for item in data['siparis_kalemleri']:
                item_total = item['adet'] * item.get('birim_fiyat', unit_price)
                db.execute('''
                    INSERT INTO order_items (order_id, size_code, size_name, quantity, unit_price, total_price)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    order_id, item['beden_kodu'], item['beden_adi'], item['adet'],
                    item.get('birim_fiyat', unit_price), item_total
                ))
            db.commit()
        
        return jsonify({
            'success': True,
            'message': 'Sipariş başarıyla eklendi',
            'siparis': {
                'id': order_id,
                'siparis_no': order_no
            }
        })

# Model approval endpoint
@app.route('/api/modeller/<int:model_id>/onayla', methods=['POST'])
def approve_model(model_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    with get_db() as db:
        # Update model approval status
        db.execute('''
            UPDATE models 
            SET approval_status = 'approved', approved_by = ?, approval_date = ?
            WHERE id = ?
        ''', (session['user_id'], datetime.utcnow(), model_id))
        
        # Log the approval
        db.execute('''
            INSERT INTO model_logs (model_id, user_id, action_type, description)
            VALUES (?, ?, ?, ?)
        ''', (model_id, session['user_id'], 'approval', 'Model onaylandı'))
        db.commit()
        
        return jsonify({
            'success': True,
            'message': 'Model başarıyla onaylandı'
        })

# Model sizes endpoints
@app.route('/api/modeller/<int:model_id>/bedenler', methods=['GET'])
def get_model_sizes(model_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    with get_db() as db:
        sizes = db.execute('SELECT * FROM model_sizes WHERE model_id = ? ORDER BY created_at DESC', (model_id,)).fetchall()
        return jsonify({
            'success': True,
            'data': [{
                'id': s['id'],
                'beden_kodu': s['size_code'],
                'beden_adi': s['size_name'],
                'uretim_adeti': s['production_quantity']
            } for s in sizes]
        })

@app.route('/api/modeller/<int:model_id>/bedenler', methods=['POST'])
def add_model_size(model_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    data = request.get_json()
    
    with get_db() as db:
        cursor = db.execute('''
            INSERT INTO model_sizes (model_id, size_code, size_name, production_quantity)
            VALUES (?, ?, ?, ?)
        ''', (model_id, data.get('beden_kodu'), data.get('beden_adi'), data.get('uretim_adeti', 0)))
        db.commit()
        
        return jsonify({
            'success': True,
            'message': 'Beden başarıyla eklendi',
            'size': {
                'id': cursor.lastrowid,
                'beden_kodu': data.get('beden_kodu'),
                'beden_adi': data.get('beden_adi'),
                'uretim_adeti': data.get('uretim_adeti', 0)
            }
        })

# Model images endpoints
@app.route('/api/modeller/<int:model_id>/resimler', methods=['GET'])
def get_model_images(model_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    with get_db() as db:
        images = db.execute('SELECT * FROM model_images WHERE model_id = ? ORDER BY created_at DESC', (model_id,)).fetchall()
        return jsonify({
            'success': True,
            'data': [{
                'id': img['id'],
                'filename': img['filename'],
                'is_main': bool(img['is_main']),
                'url': f'/images/{img["filename"]}'
            } for img in images]
        })

@app.route('/api/modeller/<int:model_id>/resimler', methods=['POST'])
def upload_model_image(model_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected'}), 400
    
    if file:
        filename = secure_filename(file.filename)
        # Add unique identifier to filename
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], unique_filename))
        
        with get_db() as db:
            cursor = db.execute('''
                INSERT INTO model_images (model_id, filename, is_main)
                VALUES (?, ?, ?)
            ''', (model_id, unique_filename, False))
            db.commit()
            
            return jsonify({
                'success': True,
                'message': 'Resim başarıyla yüklendi',
                'image': {
                    'id': cursor.lastrowid,
                    'filename': unique_filename,
                    'url': f'/images/{unique_filename}'
                }
            })

# Model descriptions endpoints
@app.route('/api/modeller/<int:model_id>/aciklamalar', methods=['GET'])
def get_model_descriptions(model_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    with get_db() as db:
        descriptions = db.execute('SELECT * FROM model_descriptions WHERE model_id = ? ORDER BY created_at DESC', (model_id,)).fetchall()
        return jsonify({
            'success': True,
            'data': [{
                'id': d['id'],
                'aciklama_tipi': d['description_type'],
                'aciklama_metni': d['description_text']
            } for d in descriptions]
        })

@app.route('/api/modeller/<int:model_id>/aciklamalar', methods=['POST'])
def add_model_description(model_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    data = request.get_json()
    
    with get_db() as db:
        cursor = db.execute('''
            INSERT INTO model_descriptions (model_id, description_type, description_text)
            VALUES (?, ?, ?)
        ''', (model_id, data.get('aciklama_tipi'), data.get('aciklama_metni')))
        db.commit()
        
        return jsonify({
            'success': True,
            'message': 'Açıklama başarıyla eklendi',
            'description': {
                'id': cursor.lastrowid,
                'aciklama_tipi': data.get('aciklama_tipi'),
                'aciklama_metni': data.get('aciklama_metni')
            }
        })

# Dashboard statistics endpoint
@app.route('/api/dashboard', methods=['GET'])
def get_dashboard_stats():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    with get_db() as db:
        # Get counts
        customer_count = db.execute('SELECT COUNT(*) as count FROM customers').fetchone()['count']
        model_count = db.execute('SELECT COUNT(*) as count FROM models').fetchone()['count']
        order_count = db.execute('SELECT COUNT(*) as count FROM orders').fetchone()['count']
        pending_models = db.execute('SELECT COUNT(*) as count FROM models WHERE approval_status = "pending"').fetchone()['count']
        
        # Get recent orders
        recent_orders = db.execute('''
            SELECT o.*, c.name as customer_name, m.model_name
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            LEFT JOIN models m ON o.model_id = m.id
            ORDER BY o.created_at DESC
            LIMIT 5
        ''').fetchall()
        
        return jsonify({
            'success': True,
            'data': {
                'istatistikler': {
                    'toplam_musteri': customer_count,
                    'toplam_model': model_count,
                    'toplam_siparis': order_count,
                    'bekleyen_onay': pending_models
                },
                'son_siparisler': [{
                    'id': o['id'],
                    'siparis_no': o['order_no'],
                    'musteri_adi': o['customer_name'],
                    'model_adi': o['model_name'],
                    'toplam_adet': o['total_quantity'],
                    'durum': o['status']
                } for o in recent_orders]
            }
        })

# Refresh route for all tabs
@app.route('/api/refresh/<tab_name>', methods=['POST'])
def refresh_tab(tab_name):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    if tab_name == 'dashboard':
        with get_db() as db:
            # Get counts
            customer_count = db.execute('SELECT COUNT(*) as count FROM customers').fetchone()['count']
            model_count = db.execute('SELECT COUNT(*) as count FROM models').fetchone()['count']
            order_count = db.execute('SELECT COUNT(*) as count FROM orders').fetchone()['count']
            pending_models = db.execute('SELECT COUNT(*) as count FROM models WHERE approval_status = "pending"').fetchone()['count']
            
            # Get recent orders
            recent_orders = db.execute('''
                SELECT o.*, c.name as customer_name, m.model_name
                FROM orders o
                LEFT JOIN customers c ON o.customer_id = c.id
                LEFT JOIN models m ON o.model_id = m.id
                ORDER BY o.created_at DESC
                LIMIT 5
            ''').fetchall()
            
            return jsonify({
                'success': True,
                'data': {
                    'istatistikler': {
                        'toplam_musteri': customer_count,
                        'toplam_model': model_count,
                        'toplam_siparis': order_count,
                        'bekleyen_onay': pending_models
                    },
                    'son_siparisler': [{
                        'id': o['id'],
                        'siparis_no': o['order_no'],
                        'musteri_adi': o['customer_name'],
                        'model_adi': o['model_name'],
                        'toplam_adet': o['total_quantity'],
                        'durum': o['status']
                    } for o in recent_orders]
                }
            })
    elif tab_name == 'musteriler':
        with get_db() as db:
            customers = db.execute('SELECT * FROM customers ORDER BY created_at DESC').fetchall()
            return jsonify({
                'success': True,
                'data': [{
                    'id': c['id'],
                    'musteri_no': c['customer_no'],
                    'musteri_adi': c['name'],
                    'telefon': c['phone'],
                    'adres': c['address'],
                    'email': c['email']
                } for c in customers]
            })
    elif tab_name == 'modeller':
        with get_db() as db:
            models = db.execute('''
                SELECT m.*, c.name as customer_name, c.customer_no as customer_no
                FROM models m
                LEFT JOIN customers c ON m.customer_id = c.id
                ORDER BY m.created_at DESC
            ''').fetchall()
            return jsonify({
                'success': True,
                'data': [{
                    'id': m['id'],
                    'model_no': m['model_no'],
                    'model_adi': m['model_name'],
                    'musteri': {
                        'id': m['customer_id'],
                        'musteri_adi': m['customer_name'],
                        'musteri_no': m['customer_no']
                    } if m['customer_id'] else None,
                    'acilis_tarihi': m['opening_date'],
                    'termin_tarihi': m['due_date'],
                    'onay_durumu': m['approval_status']
                } for m in models]
            })
    elif tab_name == 'siparisler':
        with get_db() as db:
            orders = db.execute('''
                SELECT o.*, c.name as customer_name, c.customer_no as customer_no,
                       m.model_name, m.model_no as model_no
                FROM orders o
                LEFT JOIN customers c ON o.customer_id = c.id
                LEFT JOIN models m ON o.model_id = m.id
                ORDER BY o.created_at DESC
            ''').fetchall()
            return jsonify({
                'success': True,
                'data': [{
                    'id': o['id'],
                    'siparis_no': o['order_no'],
                    'musteri': {
                        'id': o['customer_id'],
                        'musteri_adi': o['customer_name'],
                        'musteri_no': o['customer_no']
                    },
                    'model': {
                        'id': o['model_id'],
                        'model_adi': o['model_name'],
                        'model_no': o['model_no']
                    },
                    'siparis_tarihi': o['order_date'],
                    'teslim_tarihi': o['delivery_date'],
                    'toplam_adet': o['total_quantity'],
                    'birim_fiyat': float(o['unit_price']) if o['unit_price'] else 0,
                    'toplam_fiyat': float(o['total_price']) if o['total_price'] else 0,
                    'durum': o['status']
                } for o in orders]
            })
    else:
        return jsonify({'success': False, 'message': 'Geçersiz tab adı'}), 400

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000) 