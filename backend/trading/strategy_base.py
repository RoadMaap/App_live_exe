"""Compatibility wrapper for the strategy base classes.

This project currently loads user strategies dynamically and does not require
an abstract base class in the legacy code. The import remains available to
match the new structure without modifying strategy logic.
"""


class StrategyBase:
    """Minimal strategy base class for compatibility."""

    def __init__(self, params=None):
        self.params = params or {}

    def prepare_indicators(self, data, candle_type='STANDARD'):
        return data

    def check_entry_signal(self, history_slice):
        return None, None, None, None
