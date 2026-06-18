def format_upload_summary(result):
    """
    Builds the human-readable summary object returned after an upload,
    matching the spec's "Uploaded Rows / Imported Rows / Rejected Rows" format.
    """
    return {
        'file_name': result['file_name'],
        'uploaded_rows': result['uploaded_rows'],
        'imported_rows': result['imported_rows'],
        'rejected_rows': result['rejected_rows'],
        'rejected_details': result['rejected_details'],
    }