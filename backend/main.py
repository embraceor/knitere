from flask import Flask, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return jsonify({'message': 'Knitwear ERP Backend is running!', 'status': 'success'})

@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'message': 'Backend is working!'})

@app.route('/api/test')
def test():
    return jsonify({'success': True, 'message': 'Backend is running!'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port) 