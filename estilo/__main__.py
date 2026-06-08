"""Allow running the CLI as: python -m estilo <command>"""

import sys
from .cli import main

if __name__ == "__main__":
    main(sys.argv[1:])
