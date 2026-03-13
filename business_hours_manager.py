import json
import os
import re
from datetime import time
from pathlib import Path


ENV_FILE_PATH = Path(__file__).resolve().parent / ".env"


class BusinessHoursError(Exception):
    pass


def _validate_business_hours(data: dict):
    """
    Validate input dictionary format:
    {
        0: ("09:00", "19:00"),
        1: ("09:00", "19:00"),
        ...
    }
    """
    if not isinstance(data, dict):
        raise BusinessHoursError("Business hours must be a dictionary.")

    for weekday, hours in data.items():
        if not isinstance(weekday, int) or not 0 <= weekday <= 6:
            raise BusinessHoursError(
                f"Invalid weekday '{weekday}'. Must be int between 0-6."
            )

        if (
            not isinstance(hours, (list, tuple))
            or len(hours) != 2
        ):
            raise BusinessHoursError(
                f"Weekday {weekday} must have (start, end)."
            )

        start, end = hours

        try:
            start_time = time.fromisoformat(start)
            end_time = time.fromisoformat(end)
        except Exception:
            raise BusinessHoursError(
                f"Invalid time format for weekday {weekday}. "
                f"Use 'HH:MM'."
            )

        if start_time >= end_time:
            raise BusinessHoursError(
                f"Start time must be before end time for weekday {weekday}."
            )


def _format_for_env(data: dict) -> str:
    """
    Convert dictionary into the JSON string format required
    by settings.py and escape it properly for .env usage.
    """
    string_keyed = {
        str(k): [v[0], v[1]]
        for k, v in data.items()
    }

    json_string = json.dumps(string_keyed)
    escaped = json_string.replace('"', '\\"')

    return f'"{escaped}"'


def set_business_hours(data: dict):
    """
    Overwrite BUSINESS_HOURS_BY_WEEKDAY inside .env
    """
    _validate_business_hours(data)

    formatted_value = _format_for_env(data)

    if not ENV_FILE_PATH.exists():
        raise BusinessHoursError(".env file not found.")

    content = ENV_FILE_PATH.read_text()

    pattern = r'^BUSINESS_HOURS_BY_WEEKDAY=.*$'
    replacement = f'BUSINESS_HOURS_BY_WEEKDAY={formatted_value}'

    if re.search(pattern, content, flags=re.MULTILINE):
        new_content = re.sub(
            pattern,
            replacement,
            content,
            flags=re.MULTILINE
        )
    else:
        new_content = content + f"\n{replacement}\n"

    ENV_FILE_PATH.write_text(new_content)

    return True

if __name__ == "__main__":
    # Example usage:
    hours = {
        0: ("08:00", "18:00"),
        1: ("08:00", "18:00"),
        2: ("08:00", "18:00"),
        3: ("08:00", "18:00"),
        4: ("08:00", "18:00"),

        5: ("09:00", "15:00"),
        6: ("09:00", "15:00"),
    }

    try:
        set_business_hours(hours)
        print("Business hours updated successfully in .env!")
    except BusinessHoursError as e:
        print(f"Error setting business hours: {e}")