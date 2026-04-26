"""
Centralized logging configuration .
All modules obtain their logger from here — never from the stdlib directly.
"""

import logging
import sys


def configure_logging(level: str = "INFO") -> None:
    logging.basicConfig(
        stream=sys.stdout,
        level=getattr(logging, level.upper()),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%SZ",
    )


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)