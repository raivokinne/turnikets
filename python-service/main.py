import openpyxl
from flask import Flask, request, jsonify
import os
from werkzeug.utils import secure_filename
import tempfile
from typing import Dict, List, Union, Optional
import requests

app = Flask(__name__)

# Configuration
ALLOWED_EXTENSIONS = {'xlsx', 'xls'}
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

def process_excel_file(file_path: str) -> Dict[str, Union[bool, str, int, List[str], List[Dict[str, Optional[str]]]]]:
    """Process Excel file and extract student data"""
    try:
        wb = openpyxl.load_workbook(file_path)
        ws = wb.active

        if ws is None:
            return {
                'error': 'Nav atrasts aktīvs darblapas Excel failā'
            }

        data: List[Dict[str, Optional[str]]] = []
        headers: List[str] = []

        first_row = next(ws.iter_rows(min_row=1, max_row=1, values_only=True))
        headers = [str(cell).strip() if cell is not None else '' for cell in first_row]

        required_headers = ['vārds un uzvārds', 'klase', 'e-pasts']
        header_lower = [h.lower() for h in headers]

        missing_headers = [req for req in required_headers if req not in header_lower]
        if missing_headers:
            return {
                'error': f'Trūkst nepieciešamo kolonnu: {", ".join(missing_headers)}'
            }

        # Find column indices
        name_idx: Optional[int] = None
        class_idx: Optional[int] = None
        email_idx: Optional[int] = None
        status_idx: Optional[int] = None

        for i, header in enumerate(header_lower):
            if 'vārds' in header and 'uzvārds' in header:
                name_idx = i
            elif 'klase' in header:
                class_idx = i
            elif 'e-pasts' in header or 'epasts' in header or 'email' in header:
                email_idx = i
            elif 'statuss' in header or 'status' in header:
                status_idx = i

        row_count = 0
        for row in ws.iter_rows(min_row=2, values_only=True):
            # Skip empty rows
            if all(cell is None or str(cell).strip() == '' for cell in row):
                continue

            name = str(row[name_idx]).strip() if name_idx is not None and row[name_idx] is not None else ''
            class_name = str(row[class_idx]).strip() if class_idx is not None and row[class_idx] is not None else ''
            email = str(row[email_idx]).strip() if email_idx is not None and row[email_idx] is not None else ''
            status = str(row[status_idx]).strip() if status_idx is not None and row[status_idx] is not None else 'klātbutne'

            if not name or not class_name or not email:
                continue

            if '@' not in email or '.' not in email:
                continue

            student_data = {
                'name': name,
                'class': class_name,
                'email': email,
                'status': status if status in ['klātbutne', 'prombutnē', 'gaida'] else 'klātbutne',
                'time': None
            }

            data.append(student_data)
            row_count += 1

        return {
            'success': True,
            'data': data,
            'total_records': row_count,
            'headers': headers
        }

    except Exception as e:
        return {
            'error': f'Kļūda apstrādājot Excel failu: {str(e)}'
        }

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
                return

            try:
                backend_url = 'http://127.0.0.1:8000/api/mass-update'
                payload = {
                    'data': result['data'],
                    'total_records': result['total_records']
                }
                response = requests.post(backend_url, json=payload, timeout=10)

                if response.status_code == 200:
                    return jsonify({
                        'status': 'success',
                        'message': f'Veiksmīgi apstrādāti'
                    }), 200
                else:
                    return

            except requests.RequestException as e:
                return

        except Exception as e:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            raise e

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Servera kļūda: {str(e)}'
        }), 500

if __name__ == '__main__':
    app.run(debug=True)
