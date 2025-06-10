import logging
from enum import Enum

LOG_FORMAT_DEBUG = "%(levelname)s:%(message)s:%(pathname)s:%(funcName)s:%(lineno)d"

class LogLevels(str, Enum):  # Make it a str Enum so it behaves like a string
    info = "INFO"
    warn = "WARN"
    error = "ERROR"
    debug = "DEBUG"

def configure_logging(log_level: str = LogLevels.error):
    log_level_str = str(log_level).upper()
    log_levels = [level.value for level in LogLevels]

    if log_level_str not in log_levels:
        logging.basicConfig(level=logging.ERROR)
        return

    if log_level_str == LogLevels.debug.value:
        logging.basicConfig(level=logging.DEBUG, format=LOG_FORMAT_DEBUG)
        return

    # Map string to logging level
    level_map = {
        LogLevels.info.value: logging.INFO,
        LogLevels.warn.value: logging.WARNING,
        LogLevels.error.value: logging.ERROR,
        LogLevels.debug.value: logging.DEBUG,
    }

    logging.basicConfig(level=level_map[log_level_str])
