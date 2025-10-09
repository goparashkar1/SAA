def html_to_pdf(html: str, out_path):
    from weasyprint import HTML
    HTML(string=html).write_pdf(str(out_path))
