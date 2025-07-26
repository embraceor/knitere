# Knitwear ERP System

A comprehensive Enterprise Resource Planning system designed specifically for knitwear manufacturing companies. This application helps manage customers, models, orders, and production processes.

## Features

- **Customer Management**: Add, edit, and manage customer information
- **Model Management**: Create and manage product models with detailed specifications
- **Image Management**: Upload and manage model images
- **Size Management**: Define sizes and production quantities for each model
- **Description Management**: Add detailed descriptions for models
- **Approval Workflow**: Model approval system with status tracking
- **Activity Logging**: Track all changes and activities
- **Session Management**: Secure user sessions with auto-logout

## System Requirements

- Python 3.8 or higher
- Windows 10/11 (tested on Windows 10)
- Modern web browser (Chrome, Firefox, Edge, Safari)

## Installation

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd knitwearerp
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment**
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - Linux/Mac:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies**
   ```bash
   pip install -r backend/requirements.txt
   ```

## Quick Start

### Option 1: Using the batch file (Windows)
1. Double-click `start_app.bat`
2. Two command windows will open - one for backend, one for frontend
3. Open your browser and go to `http://localhost:8000`

### Option 2: Manual start
1. **Start the backend server**:
   ```bash
   cd backend
   python simple_app.py
   ```

2. **Start the frontend server** (in a new terminal):
   ```bash
   cd frontend
   python -m http.server 8000
   ```

3. **Access the application**:
   - Open your browser
   - Go to `http://localhost:8000`

## Login Credentials

- **Username**: `admin`
- **Password**: `admin123`

## Application Structure

```
knitwearerp/
├── backend/
│   ├── app.py              # Original Flask app (SQLAlchemy version)
│   ├── simple_app.py       # Simplified Flask app (SQLite version)
│   ├── models.py           # Database models
│   ├── create_db.py        # Database initialization script
│   ├── requirements.txt    # Python dependencies
│   ├── instance/           # Database files
│   └── uploads/            # Uploaded images
├── frontend/
│   ├── index.html          # Main HTML file
│   ├── app.js              # JavaScript application logic
│   └── styles.css          # CSS styles
├── venv/                   # Virtual environment
├── start_app.bat           # Windows startup script
└── README.md               # This file
```

## Database Schema

The application uses SQLite with the following main tables:

- **users**: User accounts and authentication
- **customers**: Customer information
- **models**: Product models and specifications
- **model_images**: Model image files
- **model_sizes**: Size specifications for models
- **model_descriptions**: Detailed descriptions for models
- **model_logs**: Activity logging

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/check-session` - Check session status

### Customers
- `GET /api/musteriler` - Get all customers
- `POST /api/musteriler` - Add new customer

### Models
- `GET /api/modeller` - Get all models
- `POST /api/modeller` - Add new model
- `GET /api/modeller/<id>` - Get specific model
- `PUT /api/modeller/<id>` - Update model
- `POST /api/modeller/<id>/onayla` - Approve model

### Images
- `GET /api/modeller/<id>/resimler` - Get model images
- `POST /api/modeller/<id>/resimler` - Upload model image

### Sizes
- `GET /api/modeller/<id>/bedenler` - Get model sizes
- `POST /api/modeller/<id>/bedenler` - Add model size

### Descriptions
- `GET /api/modeller/<id>/aciklamalar` - Get model descriptions
- `POST /api/modeller/<id>/aciklamalar` - Add model description

### Logs
- `GET /api/modeller/<id>/loglar` - Get model activity logs

## Troubleshooting

### Common Issues

1. **SQLAlchemy compatibility issues with Python 3.13**
   - Solution: Use the `simple_app.py` version which uses direct SQLite
   - This avoids the SQLAlchemy compatibility problem

2. **Port already in use**
   - Backend: Change port in `simple_app.py` (default: 5000)
   - Frontend: Change port in HTTP server command (default: 8000)

3. **Virtual environment issues**
   - Delete the `venv` folder and recreate it
   - Make sure to activate it before installing dependencies

4. **Database issues**
   - Delete the `backend/instance/knitwear_erp.db` file
   - Restart the application to recreate the database

### Error Messages

- **"Module not found"**: Make sure virtual environment is activated and dependencies are installed
- **"Port already in use"**: Kill existing processes or change ports
- **"Database locked"**: Close any other applications that might be using the database

## Development

### Adding New Features

1. **Backend**: Add new routes in `simple_app.py`
2. **Frontend**: Add new UI components in `index.html` and logic in `app.js`
3. **Database**: Add new tables in the `init_db()` function

### Code Style

- Use consistent indentation (4 spaces)
- Follow PEP 8 for Python code
- Use meaningful variable and function names
- Add comments for complex logic

## Security Notes

- Change the default admin password after first login
- The application uses session-based authentication
- File uploads are restricted to image files
- SQL injection is prevented using parameterized queries

## License

This project is provided as-is for educational and business use.

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the application logs in the console windows
3. Ensure all dependencies are properly installed
4. Verify the database is accessible and not corrupted 