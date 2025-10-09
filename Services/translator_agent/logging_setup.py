from rich.console import Console
from rich.traceback import install
from rich.logging import RichHandler
import logging

console = Console()
install(show_locals=False)

def setup_logging(level: int = logging.INFO):
    logging.basicConfig(
        level=level,
        format="%(message)s",
        datefmt="[%X]",
        handlers=[RichHandler(rich_tracebacks=True)]
    )
