import os
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# Load values (optional env overrides)
CREDS_PATH = "/home/rexsum/Downloads/credentials.json"
SCOPES = ["https://www.googleapis.com/auth/business.manage"]


def list_gmb_accounts_and_locations():
    # Authenticate (browser window will open for login)
    flow = InstalledAppFlow.from_client_secrets_file(CREDS_PATH, SCOPES)
    creds = flow.run_local_server(port=0)

    # Google My Business API
    mybusiness = build("mybusiness", "v4", credentials=creds)

    print("\n🔍 Fetching Google Business Accounts...\n")
    accounts_response = mybusiness.accounts().list().execute()

    accounts = accounts_response.get("accounts", [])

    if not accounts:
        print("No Google Business accounts found on this login.")
        return

    for acc in accounts:
        account_name = acc.get("name")
        print(f"📌 ACCOUNT: {acc.get('accountName', 'Unnamed Account')} ({account_name})")
        print(f"➡ Use ACCOUNT ID in env as:\nGOOGLE_ACCOUNT_ID='{account_name}'\n")

        # Get locations for this account
        print("   Retrieving Locations...\n")
        locations_response = mybusiness.accounts().locations().list(parent=account_name).execute()
        locations = locations_response.get("locations", [])

        if not locations:
            print("   ⚠ No locations found in this account.\n")
            continue

        for loc in locations:
            loc_name = loc.get("name")
            loc_title = loc.get("locationName", "Unnamed Location")
            loc_id_full = f"{account_name}/{loc_name.split('/')[-1]}" if "/" not in loc_name else loc_name

            print(f"🏪 LOCATION: {loc_title}")
            print(f"📍 LOCATION ID: {loc_name}")
            print(f"➡ Add to .env:\nGOOGLE_LOCATION_ID='{loc_name}'\n")


if __name__ == "__main__":
    list_gmb_accounts_and_locations()
