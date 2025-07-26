// Global variables
let currentUser = null;
let sessionTimer = null;
let sessionTimeout = 10 * 60 * 1000; // 10 minutes in milliseconds
let currentModelId = null;
let currentModelSizes = [];
let currentModelImages = [];
let additionalDescriptions = [];
let currentModelDescriptions = []; // Added for model descriptions

// API Base URL
const API_BASE = 'http://localhost:5000/api';

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('App.js loaded successfully - version 1.0.1');
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    checkSession();
    startSessionTimer();
}

// Event Listeners
function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Refresh buttons
    document.getElementById('refreshDashboardBtn').addEventListener('click', () => refreshTab('dashboard'));
    document.getElementById('refreshCustomersBtn').addEventListener('click', () => refreshTab('customers'));
    document.getElementById('refreshModelsBtn').addEventListener('click', () => refreshTab('models'));
    document.getElementById('refreshOrdersBtn').addEventListener('click', () => refreshTab('orders'));
    
    // Add buttons
    document.getElementById('addCustomerBtn').addEventListener('click', openCustomerModal);
    document.getElementById('addModelBtn').addEventListener('click', openModelModal);
    document.getElementById('addOrderBtn').addEventListener('click', openOrderModal);
    
    // Search and filter
    document.getElementById('customerSearch').addEventListener('input', filterCustomers);
    document.getElementById('modelSearch').addEventListener('input', filterModels);
    document.getElementById('modelStatusFilter').addEventListener('change', filterModels);
    document.getElementById('orderSearch').addEventListener('input', filterOrders);
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    // Customer form
    document.getElementById('customerForm').addEventListener('submit', handleCustomerSubmit);
    
    // Model form
    document.getElementById('modelForm').addEventListener('submit', handleModelSubmit);
    
    // Model modal tabs
    document.querySelectorAll('#modelModal .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchModalTab(btn.dataset.tab));
    });
    
    // Image upload
    document.getElementById('imageUploadArea').addEventListener('click', () => {
        document.getElementById('imageInput').click();
    });
    document.getElementById('imageInput').addEventListener('change', handleImageUpload);
    
    // Drag and drop for images
    setupDragAndDrop();
    
    // Size management
    document.getElementById('addSizeBtn').addEventListener('click', addSizeForm);
    
    // Additional descriptions
    document.getElementById('addDescriptionBtn').addEventListener('click', addAdditionalDescription);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Activity tracking for session management
    document.addEventListener('click', resetSessionTimer);
    document.addEventListener('keydown', resetSessionTimer);
    document.addEventListener('mousemove', resetSessionTimer);
}

// Session Management
function checkSession() {
    fetch(`${API_BASE}/check-session`, {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentUser = data.user;
            showMainScreen();
            loadInitialData();
        } else {
            showLoginScreen();
        }
    })
    .catch(error => {
        console.error('Session check error:', error);
        if (error.message === 'Failed to fetch') {
            console.log('Backend server is not accessible');
        }
        showLoginScreen();
    });
}

function startSessionTimer() {
    sessionTimer = setInterval(() => {
        const remainingTime = Math.max(0, sessionTimeout - (Date.now() - lastActivity));
        const minutes = Math.floor(remainingTime / 60000);
        const seconds = Math.floor((remainingTime % 60000) / 1000);
        
        document.getElementById('sessionTimer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (remainingTime <= 0) {
            handleSessionTimeout();
        }
    }, 1000);
}

let lastActivity = Date.now();

function resetSessionTimer() {
    lastActivity = Date.now();
}

function handleSessionTimeout() {
    showNotification('Oturum süresi doldu. Lütfen tekrar giriş yapın.', 'warning');
    handleLogout();
}

// Authentication
async function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const loginData = {
        username: formData.get('username'),
        password: formData.get('password')
    };
    
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            showNotification('Başarıyla giriş yapıldı!', 'success');
            showMainScreen();
            loadInitialData();
        } else {
            showNotification(data.message || 'Giriş başarısız!', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        if (error.message === 'Failed to fetch') {
            showNotification('Backend sunucusuna bağlanılamıyor! Lütfen backend sunucusunun çalıştığından emin olun.', 'error');
        } else {
            showNotification('Bağlantı hatası!', 'error');
        }
    }
}

function handleLogout() {
    fetch(`${API_BASE}/logout`, {
        method: 'POST',
        credentials: 'include'
    })
    .then(() => {
        currentUser = null;
        showLoginScreen();
        showNotification('Çıkış yapıldı.', 'success');
    })
    .catch(error => {
        console.error('Logout error:', error);
        currentUser = null;
        showLoginScreen();
    });
}

// Screen Management
function showLoginScreen() {
    document.getElementById('loginScreen').classList.add('active');
    document.getElementById('mainScreen').classList.remove('active');
    if (sessionTimer) {
        clearInterval(sessionTimer);
    }
}

function showMainScreen() {
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('mainScreen').classList.add('active');
    document.getElementById('currentUser').textContent = currentUser.username;
    startSessionTimer();
}

// Tab Management
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Load tab data
    loadTabData(tabName);
}

function switchModalTab(tabName) {
    // Update modal tab buttons
    document.querySelectorAll('#modelModal .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`#modelModal [data-tab="${tabName}"]`).classList.add('active');
    
    // Update modal tab panels
    document.querySelectorAll('#modelModal .tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Data Loading
function loadInitialData() {
    loadTabData('customers');
    loadTabData('models');
    loadTabData('orders');
}

function loadTabData(tabName) {
    switch(tabName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'customers':
            loadCustomers();
            break;
        case 'musteriler':
            loadCustomers();
            break;
        case 'models':
            loadModels();
            break;
        case 'modeller':
            loadModels();
            break;
        case 'orders':
            loadOrders();
            break;
    }
}

async function refreshTab(tabName) {
    try {
        const response = await fetch(`${API_BASE}/refresh/${tabName}`, {
            method: 'POST',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            switch(tabName) {
                case 'dashboard':
                    renderDashboard(data.data);
                    break;
                case 'customers':
                case 'musteriler':
                    renderCustomers(data.data);
                    break;
                case 'models':
                case 'modeller':
                    renderModels(data.data);
                    break;
                case 'orders':
                case 'siparisler':
                    renderOrders(data.data);
                    break;
            }
            showNotification(`${tabName} verileri yenilendi.`, 'success');
        }
    } catch (error) {
        console.error(`Refresh ${tabName} error:`, error);
        showNotification('Yenileme hatası!', 'error');
    }
}

// Customer Management
async function loadCustomers() {
    try {
        const response = await fetch(`${API_BASE}/musteriler`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
            renderCustomers(data.musteriler);
        }
    } catch (error) {
        console.error('Load customers error:', error);
        showNotification('Müşteriler yüklenirken hata oluştu!', 'error');
    }
}

function renderCustomers(customers) {
    const tbody = document.getElementById('customersTableBody');
    tbody.innerHTML = '';
    
    customers.forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${customer.musteri_no}</strong></td>
            <td>${customer.musteri_adi}</td>
            <td>${customer.telefon || '-'}</td>
            <td>${customer.email || '-'}</td>
            <td>${customer.adres || '-'}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-sm btn-outline" onclick="editCustomer(${customer.id})">
                        <i class="fas fa-edit"></i> Düzenle
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCustomer(${customer.id})">
                        <i class="fas fa-trash"></i> Sil
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function openCustomerModal(customer = null) {
    const modal = document.getElementById('customerModal');
    const title = document.getElementById('customerModalTitle');
    const form = document.getElementById('customerForm');
    
    if (customer) {
        title.textContent = 'Müşteri Düzenle';
        // Populate form with customer data
        document.getElementById('customerNo').value = customer.customer_no;
        document.getElementById('customerName').value = customer.name;
        document.getElementById('customerPhone').value = customer.phone || '';
        document.getElementById('customerEmail').value = customer.email || '';
        document.getElementById('customerAddress').value = customer.address || '';
    } else {
        title.textContent = 'Yeni Müşteri Ekle';
        form.reset();
        document.getElementById('customerNo').value = '';
    }
    
    modal.classList.add('active');
}

async function handleCustomerSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
            const customerData = {
            musteri_no: formData.get('customer_no'),
            musteri_adi: formData.get('name'),
            telefon: formData.get('phone'),
            email: formData.get('email'),
            adres: formData.get('address')
        };
    
    try {
        const response = await fetch(`${API_BASE}/musteriler`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(customerData),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Müşteri başarıyla kaydedildi!', 'success');
            closeCustomerModal();
            loadCustomers();
        } else {
            showNotification(data.message || 'Müşteri kaydedilirken hata oluştu!', 'error');
        }
    } catch (error) {
        console.error('Customer submit error:', error);
        showNotification('Bağlantı hatası!', 'error');
    }
}

function closeCustomerModal() {
    document.getElementById('customerModal').classList.remove('active');
}

// Model Management
async function loadModels() {
    try {
        const response = await fetch(`${API_BASE}/modeller`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
            renderModels(data.modeller);
        }
    } catch (error) {
        console.error('Load models error:', error);
        showNotification('Modeller yüklenirken hata oluştu!', 'error');
    }
}

function renderModels(models) {
    const tbody = document.getElementById('modelsTableBody');
    tbody.innerHTML = '';
    
    models.forEach(model => {
        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        row.addEventListener('dblclick', () => openModelCard(model));
        
        const imageHtml = model.main_image ? 
            `<img src="${API_BASE}/images/${model.main_image}" alt="Model" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">` :
            '<div style="width: 50px; height: 50px; background: #f8f9fa; border-radius: 5px; display: flex; align-items: center; justify-content: center;"><i class="fas fa-image" style="color: #ddd;"></i></div>';
        
        const terminClass = getTerminWarningClass(model.termin_tarihi);
        const statusBadge = getStatusBadge(model.onay_durumu);
        
        row.innerHTML = `
            <td>${imageHtml}</td>
            <td><strong>${model.model_no}</strong></td>
            <td>${model.model_adi}</td>
            <td>${model.model_order_no || '-'}</td>
            <td>${model.musteri ? model.musteri.musteri_adi : '-'}</td>
            <td>${model.acilis_tarihi || '-'}</td>
            <td>
                ${model.termin_tarihi ? `
                    <div class="${terminClass}">${model.termin_tarihi}</div>
                    ${model.termin_gunleri ? `<small>(${model.termin_gunleri} gün)</small>` : ''}
                ` : '-'}
            </td>
            <td>${statusBadge}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-sm btn-outline" onclick="editModel(${model.id})">
                        <i class="fas fa-edit"></i> Düzenle
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteModel(${model.id})">
                        <i class="fas fa-trash"></i> Sil
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getTerminWarningClass(dueDate) {
    if (!dueDate) return '';
    
    const today = new Date();
    const due = new Date(dueDate.split('.').reverse().join('-'));
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        return 'termin-warning past';
    } else if (diffDays <= 7) {
        return 'termin-warning approaching';
    }
    
    return '';
}

function getStatusBadge(status) {
    const statusMap = {
        'pending': 'Beklemede',
        'approved': 'Onaylandı',
        'rejected': 'Reddedildi'
    };
    
    const classMap = {
        'pending': 'status-pending',
        'approved': 'status-approved',
        'rejected': 'status-rejected'
    };
    
    return `<span class="status-badge ${classMap[status] || 'status-pending'}">${statusMap[status] || 'Beklemede'}</span>`;
}

function openModelModal(model = null) {
    const modal = document.getElementById('modelModal');
    const title = document.getElementById('modelModalTitle');
    const form = document.getElementById('modelForm');
    
    currentModelId = model ? model.id : null;
    
    if (model) {
        title.textContent = 'Model Düzenle';
        populateModelForm(model);
        loadModelSizes(model.id);
        loadModelImages(model.id);
        loadModelDescriptions(model.id); // Load descriptions for existing model
    } else {
        title.textContent = 'Yeni Model Ekle';
        form.reset();
        currentModelSizes = [];
        currentModelImages = [];
        additionalDescriptions = [];
        currentModelDescriptions = []; // Reset descriptions for new model
        
        // Set default dates
        const today = new Date();
        document.getElementById('openingDate').value = formatDate(today);
        document.getElementById('dueDate').value = '';
        
        renderSizes();
        renderImages();
        renderAdditionalDescriptions();
        renderDescriptions(); // Render empty descriptions for new model
    }
    
    // Load customers for dropdown
    loadCustomersForSelect();
    
    modal.classList.add('active');
}

function populateModelForm(model) {
    console.log('populateModelForm called with model:', model);
    document.getElementById('modelNo').value = model.model_no;
    document.getElementById('modelName').value = model.model_adi;
    document.getElementById('customerSelect').value = model.musteri_id || '';
    document.getElementById('modelOrderNo').value = model.model_order_no || '';
    document.getElementById('openingDate').value = model.acilis_tarihi || '';
    document.getElementById('dueDate').value = model.termin_tarihi || '';
    document.getElementById('dueDays').value = model.termin_gunleri || '';
    document.getElementById('modelGroup').value = model.model_grubu || '';
    document.getElementById('composition').value = model.kompozisyon || '';
}

async function handleModelSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
            const modelData = {
            model_no: formData.get('model_no'),
            model_adi: formData.get('model_name'),
            musteri_id: formData.get('customer_id') || null,
            model_order_no: formData.get('model_order_no'),
            acilis_tarihi: formData.get('opening_date'),
            termin_tarihi: formData.get('due_date'),
            termin_gunleri: formData.get('due_days') || null,
            model_grubu: formData.get('model_group'),
            kompozisyon: formData.get('composition')
        };
    
    try {
        const url = currentModelId ? 
            `${API_BASE}/modeller/${currentModelId}` : 
            `${API_BASE}/modeller`;
        
        const method = currentModelId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(modelData),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Model başarıyla kaydedildi!', 'success');
            
            // Save descriptions for both new and existing models
            if (data.model && data.model.id) {
                await saveModelDescriptions(data.model.id);
            } else if (currentModelId) {
                await saveModelDescriptions(currentModelId);
            }
            
            closeModelModal();
            loadModels();
        } else {
            showNotification(data.message || 'Model kaydedilirken hata oluştu!', 'error');
        }
    } catch (error) {
        console.error('Model submit error:', error);
        showNotification('Bağlantı hatası!', 'error');
    }
}

function closeModelModal() {
    document.getElementById('modelModal').classList.remove('active');
    currentModelId = null;
    currentModelSizes = [];
    currentModelImages = [];
    additionalDescriptions = [];
    currentModelDescriptions = []; // Clear descriptions on modal close
}

// Size Management
async function loadModelSizes(modelId) {
    try {
        const response = await fetch(`${API_BASE}/modeller/${modelId}/bedenler`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
            currentModelSizes = data.bedenler;
            renderSizes();
        }
    } catch (error) {
        console.error('Load sizes error:', error);
    }
}

function renderSizes() {
    const container = document.getElementById('sizesList');
    
    if (currentModelSizes.length === 0) {
        container.innerHTML = `
            <div class="no-sizes-message">
                <i class="fas fa-tshirt"></i>
                <p>Henüz beden eklenmemiş</p>
                <small>Yeni beden eklemek için butona tıklayın</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = currentModelSizes.map(size => `
        <div class="size-item">
            <div class="size-item-header">
                <h5>${size.beden_adi} (${size.beden_kodu})</h5>
                <div class="size-actions">
                    <button class="btn btn-sm btn-outline" onclick="editSize(${size.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteSize(${size.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="size-info">
                <div>
                    <label>Beden Kodu:</label>
                    <span>${size.beden_kodu}</span>
                </div>
                <div>
                    <label>Beden Adı:</label>
                    <span>${size.beden_adi}</span>
                </div>
                <div>
                    <label>Üretim Adeti:</label>
                    <span>${size.uretim_adeti}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function addSizeForm() {
    const sizeData = prompt('Beden bilgilerini girin (kod:ad:adet formatında):');
    if (!sizeData) return;
    
    const [code, name, quantity] = sizeData.split(':');
    if (!code || !name) {
        showNotification('Geçersiz beden bilgisi!', 'error');
        return;
    }
    
    const size = {
        beden_kodu: code.trim(),
        beden_adi: name.trim(),
        uretim_adeti: parseInt(quantity) || 0
    };
    
    if (currentModelId) {
        saveSize(size);
    } else {
        currentModelSizes.push({
            id: Date.now(),
            ...size,
            created_at: new Date().toISOString()
        });
        renderSizes();
    }
}

async function saveSize(sizeData) {
    try {
        const response = await fetch(`${API_BASE}/modeller/${currentModelId}/bedenler`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sizeData),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Beden başarıyla eklendi!', 'success');
            loadModelSizes(currentModelId);
        } else {
            showNotification(data.message || 'Beden eklenirken hata oluştu!', 'error');
        }
    } catch (error) {
        console.error('Save size error:', error);
        showNotification('Bağlantı hatası!', 'error');
    }
}

// Image Management
function setupDragAndDrop() {
    const uploadArea = document.getElementById('imageUploadArea');
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#667eea';
        uploadArea.style.background = '#f8f9fa';
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#ddd';
        uploadArea.style.background = 'transparent';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#ddd';
        uploadArea.style.background = 'transparent';
        
        const files = e.dataTransfer.files;
        handleFiles(files);
    });
}

function handleImageUpload(event) {
    const files = event.target.files;
    handleFiles(files);
}

function handleFiles(files) {
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            uploadImage(file);
        }
    });
}

async function uploadImage(file) {
    if (!currentModelId) {
        showNotification('Önce modeli kaydedin!', 'warning');
        return;
    }
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        const response = await fetch(`${API_BASE}/modeller/${currentModelId}/resimler`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Resim başarıyla yüklendi!', 'success');
            loadModelImages(currentModelId);
        } else {
            showNotification(data.message || 'Resim yüklenirken hata oluştu!', 'error');
        }
    } catch (error) {
        console.error('Upload image error:', error);
        showNotification('Resim yükleme hatası!', 'error');
    }
}

async function loadModelImages(modelId) {
    try {
        const response = await fetch(`${API_BASE}/modeller/${modelId}/resimler`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
            currentModelImages = data.resimler;
            renderImages();
        }
    } catch (error) {
        console.error('Load images error:', error);
    }
}

function renderImages() {
    const container = document.getElementById('imageGallery');
    
    if (currentModelImages.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Henüz resim yüklenmemiş</p>';
        return;
    }
    
    container.innerHTML = currentModelImages.map(image => `
        <div class="image-item">
            <img src="${API_BASE}/images/${image.filename}" alt="Model" 
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjhGOEY5Ii8+Cjx0ZXh0IHg9Ijc1IiB5PSI3NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UmVzaW0gQnVsdW5hbWFkaTwvdGV4dD4KPC9zdmc+'">
            <div class="image-actions">
                ${image.is_main ? '<span class="btn btn-sm btn-success">Ana</span>' : ''}
                <button class="btn btn-sm btn-outline" onclick="setMainImage(${image.id})">
                    <i class="fas fa-star"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteImage(${image.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Additional Descriptions
function addAdditionalDescription() {
    const title = prompt('Açıklama başlığını girin:');
    if (!title) return;
    
    const description = prompt('Açıklama metnini girin:');
    if (!description) return;
    
    const newDescription = {
        id: Date.now(),
        title: title,
        description: description
    };
    
    additionalDescriptions.push(newDescription);
    renderAdditionalDescriptions();
}

function renderAdditionalDescriptions() {
    const container = document.getElementById('additionalDescriptionsList');
    
    if (additionalDescriptions.length === 0) {
        container.innerHTML = '<p style="color: #666;">Henüz ek açıklama eklenmemiş</p>';
        return;
    }
    
    container.innerHTML = additionalDescriptions.map(desc => `
        <div class="additional-description-item">
            <div class="additional-description-header">
                <span class="additional-description-title">${desc.title}</span>
                <div class="additional-description-actions">
                    <button class="btn btn-sm btn-outline" onclick="editAdditionalDescription(${desc.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteAdditionalDescription(${desc.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <p>${desc.description}</p>
        </div>
    `).join('');
}

// Model Descriptions Management
async function loadModelDescriptions(modelId) {
    try {
        const response = await fetch(`${API_BASE}/modeller/${modelId}/aciklamalar`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
            currentModelDescriptions = data.aciklamalar;
            renderDescriptions();
        }
    } catch (error) {
        console.error('Load descriptions error:', error);
    }
}

function renderDescriptions() {
    console.log('renderDescriptions called');
    // Map description types to element IDs
    const descriptionMap = {
        'genel': 'generalDescription',
        'dikim': 'sewingInstructions',
        'numune': 'sampleDescription',
        'paketleme': 'packagingDetails',
        'aksesuar': 'accessoryDescription',
        'baskı_nakış': 'printEmbroidery',
        'ek': 'additionalDescriptionsList'
    };
    
    // Clear all description fields
    Object.values(descriptionMap).forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            if (elementId === 'additionalDescriptionsList') {
                element.innerHTML = '<p style="color: #666;">Henüz ek açıklama eklenmemiş</p>';
            } else {
                element.value = '';
            }
        } else {
            console.warn(`Element not found: ${elementId}`);
        }
    });
    
    // Populate with current descriptions
    if (currentModelDescriptions && currentModelDescriptions.length > 0) {
        currentModelDescriptions.forEach(description => {
            const elementId = descriptionMap[description.aciklama_tipi];
            if (elementId) {
                const element = document.getElementById(elementId);
                if (element) {
                    if (elementId === 'additionalDescriptionsList') {
                        // Handle additional descriptions differently
                        element.innerHTML = `
                            <div class="additional-description-item">
                                <div class="additional-description-header">
                                    <span class="additional-description-title">Ek Açıklama</span>
                                </div>
                                <p>${description.aciklama_metni}</p>
                            </div>
                        `;
                    } else {
                        element.value = description.aciklama_metni;
                    }
                }
            }
        });
    }
}

async function saveModelDescriptions(modelId) {
    if (!currentModelId) return;
    
    const descriptions = [
        { aciklama_tipi: 'genel', elementId: 'generalDescription' },
        { aciklama_tipi: 'dikim', elementId: 'sewingInstructions' },
        { aciklama_tipi: 'numune', elementId: 'sampleDescription' },
        { aciklama_tipi: 'paketleme', elementId: 'packagingDetails' },
        { aciklama_tipi: 'aksesuar', elementId: 'accessoryDescription' },
        { aciklama_tipi: 'baskı_nakış', elementId: 'printEmbroidery' }
    ];
    
    for (const desc of descriptions) {
        const element = document.getElementById(desc.elementId);
        if (element && element.value.trim()) {
            try {
                const response = await fetch(`${API_BASE}/modeller/${modelId}/aciklamalar`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        aciklama_tipi: desc.aciklama_tipi,
                        aciklama_metni: element.value.trim()
                    }),
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    console.error(`Failed to save description: ${desc.aciklama_tipi}`);
                }
            } catch (error) {
                console.error('Save description error:', error);
            }
        }
    }
}

// Utility Functions
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'exclamation-circle' : 
                 type === 'warning' ? 'exclamation-triangle' : 'info-circle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

function filterCustomers() {
    const searchTerm = document.getElementById('customerSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#customersTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function filterModels() {
    const searchTerm = document.getElementById('modelSearch').value.toLowerCase();
    const statusFilter = document.getElementById('modelStatusFilter').value;
    const rows = document.querySelectorAll('#modelsTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const status = row.querySelector('.status-badge')?.textContent || '';
        
        const matchesSearch = text.includes(searchTerm);
        const matchesStatus = !statusFilter || status.includes(statusFilter);
        
        row.style.display = matchesSearch && matchesStatus ? '' : 'none';
    });
}

function filterOrders() {
    const searchTerm = document.getElementById('orderSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#ordersTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function handleKeyboardShortcuts(event) {
    // F5 refresh
    if (event.key === 'F5') {
        event.preventDefault();
        const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
        refreshTab(activeTab);
    }
    
    // Ctrl+N for new items
    if (event.ctrlKey && event.key === 'n') {
        event.preventDefault();
        const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
        switch(activeTab) {
            case 'customers':
                openCustomerModal();
                break;
            case 'models':
                openModelModal();
                break;
            case 'orders':
                openOrderModal();
                break;
        }
    }
}

// Dashboard functionality
async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE}/dashboard`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
            renderDashboard(data.data);
        } else {
            showNotification('Dashboard verileri yüklenirken hata oluştu.', 'error');
        }
    } catch (error) {
        console.error('Load dashboard error:', error);
        showNotification('Dashboard verileri yüklenirken hata oluştu.', 'error');
    }
}

function renderDashboard(data) {
    // Update statistics
    document.getElementById('totalCustomers').textContent = data.istatistikler.toplam_musteri;
    document.getElementById('totalModels').textContent = data.istatistikler.toplam_model;
    document.getElementById('totalOrders').textContent = data.istatistikler.toplam_siparis;
    document.getElementById('pendingApprovals').textContent = data.istatistikler.bekleyen_onay;
    
    // Update recent orders table
    const tbody = document.getElementById('recentOrdersTableBody');
    tbody.innerHTML = '';
    
    if (data.son_siparisler.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="no-data">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Henüz sipariş bulunmuyor</p>
                </td>
            </tr>
        `;
        return;
    }
    
    data.son_siparisler.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${order.siparis_no}</strong></td>
            <td>${order.musteri_adi || 'N/A'}</td>
            <td>${order.model_adi || 'N/A'}</td>
            <td><span class="badge badge-info">${order.toplam_adet}</span></td>
            <td>${getOrderStatusBadge(order.durum)}</td>
        `;
        tbody.appendChild(row);
    });
}

// Orders functionality
async function loadOrders() {
    try {
        const response = await fetch(`${API_BASE}/siparisler`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
            renderOrders(data.data);
        } else {
            showNotification('Siparişler yüklenirken hata oluştu.', 'error');
        }
    } catch (error) {
        console.error('Load orders error:', error);
        showNotification('Siparişler yüklenirken hata oluştu.', 'error');
    }
}

function renderOrders(orders) {
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '';
    
    if (orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Henüz sipariş bulunmuyor</p>
                    <small>Yeni sipariş eklemek için butona tıklayın</small>
                </td>
            </tr>
        `;
        return;
    }
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${order.siparis_no}</strong></td>
            <td>${order.musteri ? order.musteri.musteri_adi : 'N/A'}</td>
            <td>${order.model ? order.model.model_adi : 'N/A'}</td>
            <td><span class="badge badge-info">${order.toplam_adet}</span></td>
            <td>${formatDate(order.siparis_tarihi)}</td>
            <td>${getOrderStatusBadge(order.durum)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-outline" onclick="viewOrder(${order.id})" title="Görüntüle">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="editOrder(${order.id})" title="Düzenle">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline btn-danger" onclick="deleteOrder(${order.id})" title="Sil">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getOrderStatusBadge(status) {
    const statusMap = {
        'pending': { text: 'Beklemede', class: 'badge-warning' },
        'processing': { text: 'İşleniyor', class: 'badge-info' },
        'completed': { text: 'Tamamlandı', class: 'badge-success' },
        'cancelled': { text: 'İptal Edildi', class: 'badge-danger' }
    };
    
    const statusInfo = statusMap[status] || { text: status, class: 'badge-secondary' };
    return `<span class="badge ${statusInfo.class}">${statusInfo.text}</span>`;
}

function openOrderModal(order = null) {
    const modal = document.getElementById('orderModal');
    const title = document.getElementById('orderModalTitle');
    const form = document.getElementById('orderForm');
    
    // Set title
    title.textContent = order ? 'Sipariş Düzenle' : 'Yeni Sipariş Ekle';
    
    // Reset form
    form.reset();
    
    // Set default date to today
    document.getElementById('orderDate').value = new Date().toISOString().split('T')[0];
    
    // Load customers and models for select
    loadCustomersForOrderSelect();
    loadModelsForOrderSelect();
    
    // Populate form if editing
    if (order) {
        populateOrderForm(order);
    }
    
    modal.classList.add('active');
}

function openModelCard(model) {
    // TODO: Implement model card view
    showNotification('Model kartı henüz implement edilmedi.', 'warning');
}

function editCustomer(id) {
    // TODO: Implement customer editing
    showNotification('Müşteri düzenleme henüz implement edilmedi.', 'warning');
}

function deleteCustomer(id) {
    // TODO: Implement customer deletion
    showNotification('Müşteri silme henüz implement edilmedi.', 'warning');
}

function editModel(id) {
    // TODO: Implement model editing
    showNotification('Model düzenleme henüz implement edilmedi.', 'warning');
}

function deleteModel(id) {
    // TODO: Implement model deletion
    showNotification('Model silme henüz implement edilmedi.', 'warning');
}

async function loadCustomersForSelect() {
    try {
        const response = await fetch(`${API_BASE}/musteriler`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('customerSelect');
            select.innerHTML = '<option value="">Müşteri Seçin</option>';
            
            data.musteriler.forEach(customer => {
                const option = document.createElement('option');
                option.value = customer.id;
                option.textContent = `${customer.musteri_no} - ${customer.musteri_adi}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Load customers for select error:', error);
    }
}

async function loadCustomersForOrderSelect() {
    try {
        const response = await fetch(`${API_BASE}/musteriler`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('orderCustomerSelect');
            select.innerHTML = '<option value="">Müşteri Seçin</option>';
            
            data.musteriler.forEach(customer => {
                const option = document.createElement('option');
                option.value = customer.id;
                option.textContent = `${customer.musteri_no} - ${customer.musteri_adi}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Load customers for order select error:', error);
    }
}

async function loadModelsForOrderSelect() {
    try {
        const response = await fetch(`${API_BASE}/modeller`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('orderModelSelect');
            select.innerHTML = '<option value="">Model Seçin</option>';
            
            data.modeller.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = `${model.model_no} - ${model.model_adi}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Load models for order select error:', error);
    }
}

function populateOrderForm(order) {
    document.getElementById('orderNo').value = order.siparis_no;
    document.getElementById('orderDate').value = order.siparis_tarihi;
    document.getElementById('orderCustomerSelect').value = order.musteri ? order.musteri.id : '';
    document.getElementById('orderModelSelect').value = order.model ? order.model.id : '';
    document.getElementById('deliveryDate').value = order.teslim_tarihi || '';
    document.getElementById('orderStatus').value = order.durum;
    document.getElementById('totalQuantity').value = order.toplam_adet;
    document.getElementById('unitPrice').value = order.birim_fiyat;
    document.getElementById('orderNotes').value = order.notlar || '';
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
}

// Order form submission
document.addEventListener('DOMContentLoaded', function() {
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', handleOrderSubmit);
    }
});

async function handleOrderSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const orderData = {
        siparis_no: formData.get('siparis_no'),
        siparis_tarihi: formData.get('siparis_tarihi'),
        musteri_id: formData.get('musteri_id'),
        model_id: formData.get('model_id'),
        teslim_tarihi: formData.get('teslim_tarihi'),
        durum: formData.get('durum'),
        toplam_adet: parseInt(formData.get('toplam_adet')),
        birim_fiyat: parseFloat(formData.get('birim_fiyat') || 0),
        notlar: formData.get('notlar')
    };
    
    try {
        const response = await fetch(`${API_BASE}/siparisler`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(orderData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Sipariş başarıyla kaydedildi.', 'success');
            closeOrderModal();
            refreshTab('siparisler');
        } else {
            showNotification(data.message || 'Sipariş kaydedilirken hata oluştu.', 'error');
        }
    } catch (error) {
        console.error('Order submit error:', error);
        showNotification('Sipariş kaydedilirken hata oluştu.', 'error');
    }
}

// Placeholder functions for order actions
function viewOrder(id) {
    showNotification('Sipariş görüntüleme henüz implement edilmedi.', 'warning');
}

function editOrder(id) {
    showNotification('Sipariş düzenleme henüz implement edilmedi.', 'warning');
}

function deleteOrder(id) {
    if (confirm('Bu siparişi silmek istediğinizden emin misiniz?')) {
        showNotification('Sipariş silme henüz implement edilmedi.', 'warning');
    }
}

function setMainImage(imageId) {
    // TODO: Implement set main image
    showNotification('Ana resim ayarlama henüz implement edilmedi.', 'warning');
}

function deleteImage(imageId) {
    // TODO: Implement image deletion
    showNotification('Resim silme henüz implement edilmedi.', 'warning');
}

function editSize(sizeId) {
    // TODO: Implement size editing
    showNotification('Beden düzenleme henüz implement edilmedi.', 'warning');
}

function deleteSize(sizeId) {
    // TODO: Implement size deletion
    showNotification('Beden silme henüz implement edilmedi.', 'warning');
}

function editAdditionalDescription(id) {
    // TODO: Implement additional description editing
    showNotification('Açıklama düzenleme henüz implement edilmedi.', 'warning');
}

function deleteAdditionalDescription(id) {
    // TODO: Implement additional description deletion
    showNotification('Açıklama silme henüz implement edilmedi.', 'warning');
} 