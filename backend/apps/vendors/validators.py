import os
import re
import pandas as pd
from django.core.exceptions import ValidationError
from datetime import datetime

ALLOWED_EXTENSIONS = ['.csv', '.xlsx']
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

REQUIRED_COLUMNS = ['Material ID', 'Material Name', 'Quantity', 'Cost', 'Supplier', 'Expiry Date']


def validate_password_strength(password):
    errors = []
    if len(password) < 8:
        errors.append('Password must be at least 8 characters long.')
    if not re.search(r'[A-Z]', password):
        errors.append('Password must contain at least one uppercase letter.')
    if not re.search(r'[a-z]', password):
        errors.append('Password must contain at least one lowercase letter.')
    if not re.search(r'\d', password):
        errors.append('Password must contain at least one digit.')
    if not re.search(r'[^A-Za-z0-9]', password):
        errors.append('Password must contain at least one special character.')
    if errors:
        raise ValidationError(errors)


def validate_uploaded_file(uploaded_file):
    """
    Validates extension, size, and that the file isn't empty.
    Raises ValidationError with a clear message on failure.
    """
    ext = os.path.splitext(uploaded_file.name)[1].lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(
            f'Unsupported file type "{ext}". Only CSV and XLSX files are allowed.'
        )

    if uploaded_file.size == 0:
        raise ValidationError('Uploaded file is empty.')

    if uploaded_file.size > MAX_FILE_SIZE:
        raise ValidationError('File size exceeds the 10MB limit.')

    return ext


def parse_material_file(file_path, file_extension):
    """
    Reads a CSV or XLSX file into a pandas DataFrame, validates required
    columns exist, and returns the DataFrame for row-level validation.
    """
    try:
        if file_extension == '.csv':
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path, engine='openpyxl')
    except Exception as exc:
        raise ValidationError(f'File appears to be corrupted or unreadable: {exc}')

    if df.empty:
        raise ValidationError('File contains no data rows.')

    missing_columns = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing_columns:
        raise ValidationError(f'Missing required columns: {", ".join(missing_columns)}')

    return df


def validate_material_row(row, row_index):
    """
    Validates a single row from the parsed DataFrame.
    Returns (is_valid: bool, cleaned_data: dict, errors: list[str]).
    """
    errors = []
    cleaned = {}

    material_code = str(row.get('Material ID', '')).strip()
    if not material_code or material_code.lower() == 'nan':
        errors.append('Material ID is required.')
    cleaned['material_code'] = material_code

    material_name = str(row.get('Material Name', '')).strip()
    if not material_name or material_name.lower() == 'nan':
        errors.append('Material Name is required.')
    cleaned['material_name'] = material_name

    try:
        quantity = float(row.get('Quantity'))
        if quantity <= 0:
            errors.append('Quantity must be greater than 0.')
        cleaned['quantity'] = quantity
    except (TypeError, ValueError):
        errors.append('Quantity must be a valid number greater than 0.')
        cleaned['quantity'] = None

    try:
        cost = float(row.get('Cost'))
        if cost <= 0:
            errors.append('Cost must be greater than 0.')
        cleaned['cost'] = cost
    except (TypeError, ValueError):
        errors.append('Cost must be a valid number greater than 0.')
        cleaned['cost'] = None

    supplier = str(row.get('Supplier', '')).strip()
    if not supplier or supplier.lower() == 'nan':
        errors.append('Supplier is required.')
    cleaned['supplier'] = supplier

    expiry_raw = row.get('Expiry Date')
    expiry_date = None
    if pd.isna(expiry_raw) or str(expiry_raw).strip() == '':
        errors.append('Expiry Date is required.')
    else:
        try:
            if isinstance(expiry_raw, (pd.Timestamp, datetime)):
                expiry_date = expiry_raw.date() if hasattr(expiry_raw, 'date') else expiry_raw
            else:
                expiry_date = pd.to_datetime(str(expiry_raw)).date()
        except Exception:
            errors.append('Expiry Date is not a valid date.')
    cleaned['expiry_date'] = expiry_date

    is_valid = len(errors) == 0
    return is_valid, cleaned, errors