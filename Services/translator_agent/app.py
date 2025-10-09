import typer, pathlib, sys, json, logging
from logging_setup import setup_logging
from pipeline import pipeline_url, pipeline_file
from config import settings

app = typer.Typer(add_completion=False, no_args_is_help=True)

@app.callback()
def main(verbose: bool = typer.Option(False, "--verbose", "-v", help="Verbose logs")):
    # setup_logging(logging.DEBUG if verbose else logging.INFO)
    pass

@app.command(help="Translate a web article at URL and output to terminal or file")
def url(u: str,
        out: str = typer.Option("terminal", "--out", help="terminal, docx, pdf, or html"),
        dest: str = typer.Option(".", "--dest", help="Destination directory (for file outputs)"),
        model: str = typer.Option(settings.model, "--model", help="OpenAI model name"),
        glossary: str = typer.Option(None, "--glossary", help="Path to glossary JSON (optional)")):
    dest_path = pathlib.Path(dest).expanduser().resolve()
    if out.lower() != "terminal":
        dest_path.mkdir(parents=True, exist_ok=True)
    glossary_dict = None
    if glossary:
        glossary_dict = json.loads(pathlib.Path(glossary).read_text(encoding="utf-8"))
    output = pipeline_url(u, out_format=out, model=model, glossary=glossary_dict, dest_dir=dest_path)
    if out.lower() == "terminal":
        print(output)
    else:
        typer.echo(json.dumps(output, ensure_ascii=False, indent=2))
    # typer.echo(json.dumps(output, ensure_ascii=False, indent=2))

@app.command(help="Translate a local file and output to terminal or file")
def file(path: str,
         out: str = typer.Option("terminal", "--out", help="terminal, docx, pdf, or html"),
         dest: str = typer.Option(".", "--dest", help="Destination directory (for file outputs)"),
         model: str = typer.Option(settings.model, "--model", help="OpenAI model name"),
         glossary: str = typer.Option(None, "--glossary", help="Path to glossary JSON (optional)")):
    dest_path = pathlib.Path(dest).expanduser().resolve()
    if out.lower() != "terminal":
        dest_path.mkdir(parents=True, exist_ok=True)
    glossary_dict = None
    if glossary:
        glossary_dict = json.loads(pathlib.Path(glossary).read_text(encoding="utf-8"))
    output = pipeline_file(path, out_format=out, model=model, glossary=glossary_dict, dest_dir=dest_path)
    if out.lower() == "terminal":
        print(output)
    else:
        typer.echo(json.dumps(output, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    app()
