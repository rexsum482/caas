def validate_address(data):
    required = [
        "street_address",
        "city",
        "state",
        "zip_code"
    ]
    for field in required:
        if not data.get(field):
            raise ValueError(
                f"{field} is required"
            )

    return data