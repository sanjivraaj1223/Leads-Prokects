# Guhanix CRM — Setup Guide

## Running the App

```bash
npm run dev        # http://localhost:3000
```

Login: `admin@guhanix.com` / `admin123`

---

## How Google Form → CRM Works

```
Someone fills Google Form
        ↓
Google Form saves response to linked Google Sheet
        ↓
CRM polls your Sheet every 30 seconds via Google Sheets API
        ↓
New row detected → created as NEW lead in CRM
        ↓
Duplicate check (phone + email)
        ↓
Auto-assigned to next employee (round-robin)
        ↓
Notification shown in CRM
```

---

## One-Time Google API Setup

### Step 1 — Create Google Cloud Project
1. Go to https://console.cloud.google.com
2. Create a new project (e.g. "Guhanix CRM")
3. Go to **APIs & Services → Library**
4. Search "Google Sheets API" → Enable it

### Step 2 — Create Service Account
1. Go to **IAM & Admin → Service Accounts**
2. Click **Create Service Account**
3. Name it (e.g. "crm-sync"), click Create
4. Skip optional steps, click Done
5. Click the service account → **Keys tab → Add Key → JSON**
6. Download the `.json` file

### Step 3 — Add to .env.local
Open `.env.local` in the project root and add:

```
GOOGLE_SERVICE_ACCOUNT_JSON=<paste entire JSON content here as one line>
```

To convert the JSON file to one line (PowerShell):
```powershell
(Get-Content service-account.json -Raw) -replace "`r`n",'\n' -replace "`n",'\n' | Set-Clipboard
```

### Step 4 — Connect Your Google Form

1. Create a Google Form
2. In the form: **Responses tab → Google Sheets icon** → Create new spreadsheet
3. Open the linked spreadsheet, copy the ID from the URL:
   `https://docs.google.com/spreadsheets/d/**THIS_IS_THE_ID**/edit`
4. **Share the spreadsheet** with your service account email (Editor access)
5. In the CRM: **Google Forms page → Connect Form**
6. Paste the Spreadsheet ID
7. Set **Field Mappings** (e.g. "Full Name" → Name, "Mobile" → Phone)
8. Click Connect

### Step 5 — Test It
- Fill your Google Form
- Wait up to 30 seconds
- The lead appears in the CRM automatically ✓

---

## Field Mapping Examples

| Google Form Column | CRM Field |
|---|---|
| Full Name | name |
| Mobile Number / Phone | phone |
| Email Address | email |
| College Name | college |
| Interested Course | course |
| Year of Study | year |
| City / Location | location |

The **Timestamp** column (first column added by Google Forms) is parsed automatically.

---

## Notes

- **Data is stored in browser localStorage** — persistent across refreshes
- **No backend database needed** for basic usage
- The sync API route (`/api/sync`) runs server-side with your Google credentials
- Duplicate detection uses **phone number + email** 
- New leads are auto-assigned via **round-robin** to active employees
