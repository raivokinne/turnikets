import openpyxl
from flask import Flask, request, jsonify
import os
from werkzeug.utils import secure_filename
import tempfile
from typing import Dict, Optional, Any
import requests

app = Flask(__name__)

# Configuration
ALLOWED_EXTENSIONS = {'xlsx', 'xls', 'xlsm'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def allowed_file(filename: str) -> bool:
    """Check if the uploaded file has an allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def validate_file_size(file) -> bool:
    """Check if file size is within limits"""
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)  # Reset file pointer
    return size <= MAX_FILE_SIZE


def process_excel_file(file_path: str) -> Dict[str, Any]:
    """Process Excel file and extract access card data"""
    try:
        wb = openpyxl.load_workbook(file_path)
        ws = wb.active

        if ws is None:
            return {'error': 'Nav atrasts aktīvs darblapas Excel failā'}

        data = []
        headers = [cell.value.strip() if isinstance(cell.value, str) else str(cell.value).strip()
                   for cell in next(ws.iter_rows(min_row=1, max_row=1))]

        # Normalize headers for comparison
        normalized_headers = [h.lower() for h in headers]
        header_indices = {header: idx for idx, header in enumerate(normalized_headers)}

        required_headers = ['name', 'gender', 'card number', 'authority', 'qr code', 'validity period', 'address']
        missing_headers = [h for h in required_headers if h not in normalized_headers]

        if missing_headers:
            return {'error': f'Trūkst nepieciešamo kolonnu: {", ".join(missing_headers)}'}

        for row in ws.iter_rows(min_row=2, values_only=True):
            if all(cell is None or str(cell).strip() == '' for cell in row):
                continue

            # Helper function to safely get row value by index
            def get_row_value(index: Optional[int]) -> Optional[str]:
                if index is not None and index < len(row):
                    cell_value = row[index]
                    if cell_value is None:
                        return None
                    # Convert any cell value to string, handling various openpyxl types
                    return str(cell_value) if not isinstance(cell_value, str) else cell_value
                return None

            entry = {
                'number': get_row_value(header_indices.get('number')) or '',
                'name': get_row_value(header_indices.get('name')),
                'gender': get_row_value(header_indices.get('gender')),
                'status': get_row_value(header_indices.get('status')) or '',
                'card_number': get_row_value(header_indices.get('card number')),
                'authority': get_row_value(header_indices.get('authority')),
                'qr_code': get_row_value(header_indices.get('qr code')),
                'validity_period': str(get_row_value(header_indices.get('validity period')) or ''),
                'email': get_row_value(header_indices.get('address')),
                'qr_url': get_row_value(header_indices.get('qr code url')) or ''
            }

            data.append(entry)

        return {
            'success': True,
            'data': data,
            'total_records': len(data),
            'headers': headers
        }

    except Exception as e:
        return {'error': f'Kļūda apstrādājot Excel failu: {str(e)}'}


@app.route('/upload/excel', methods=['POST'])
def upload_excel():
    """Handle Excel file upload and send processed data to another backend"""
    try:
        if 'file' not in request.files:
            return jsonify({
                'status': 'error',
                'message': 'Nav izvēlēts fails'
            }), 400

        file = request.files['file']

        if file.filename is None or file.filename == '':
            return jsonify({
                'status': 'error',
                'message': 'Nav izvēlēts fails'
            }), 400

        if not allowed_file(file.filename):
            return jsonify({
                'status': 'error',
                'message': 'Neatbalstīts faila formāts. Lūdzu augšupielādējiet .xlsx vai .xls failu'
            }), 400

        if not validate_file_size(file):
            return jsonify({
                'status': 'error',
                'message': 'Fails ir par lielu. Maksimālais izmērs ir 10MB'
            }), 400

        filename = secure_filename(file.filename)
        with tempfile.NamedTemporaryFile(delete=False, suffix=f'-{filename}') as tmp_file:
            file.save(tmp_file.name)
            temp_path = tmp_file.name

        try:
            result = process_excel_file(temp_path)
            os.unlink(temp_path)

            if 'error' in result:
                return jsonify({
                    'status': 'error',
                    'message': result['error']
                }), 400

            try:
                backend_url = 'http://192.168.11.200:8000/api/mass-update'  # <- change if needed
                payload = {
                    'data': result['data'],
                    'total_records': result['total_records']
                }
                response = requests.post(backend_url, json=payload, timeout=10)

                if response.status_code == 200:
                    return jsonify({
                        'status': 'success',
                        'message': 'Veiksmīgi apstrādāti dati un nosūtīti uz backend'
                    }), 200
                else:
                    return jsonify({
                        'status': 'error',
                        'message': f'Neizdevās nosūtīt datus uz backend: {response.status_code}'
                    }), 500

            except requests.RequestException as e:
                return jsonify({
                    'status': 'error',
                    'message': f'Nevar izveidot savienojumu ar backend: {str(e)}'
                }), 500

        except Exception as e:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            return jsonify({
                'status': 'error',
                'message': f'Faila apstrādes kļūda: {str(e)}'
            }), 500

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Servera kļūda: {str(e)}'
        }), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
