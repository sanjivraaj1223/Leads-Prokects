import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export interface SyncRequestBody {
  spreadsheetId: string;
  formId: string;
  formName: string;
  fieldMappings: { formField: string; leadField: string }[];
  existingLeads: { phone: string; email: string; rowIndex?: number }[];
  lastSyncRow: number; // last row we already imported (0 = never synced)
}

export interface SyncResult {
  success: boolean;
  error?: string;
  rows: SheetRow[];
  totalRows: number;
  headers: string[];
}

export interface SheetRow {
  rowIndex: number;
  values: Record<string, string>;
  timestamp: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: SyncRequestBody = await req.json();
    const { spreadsheetId, fieldMappings, lastSyncRow } = body;

    // Build Google auth from env
    const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!credentialsJson) {
      return NextResponse.json(
        { success: false, error: 'GOOGLE_SERVICE_ACCOUNT_JSON not configured in .env.local', rows: [], totalRows: 0, headers: [] },
        { status: 200 } // 200 so frontend can show the error gracefully
      );
    }

    let credentials: object;
    try {
      credentials = JSON.parse(credentialsJson);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid GOOGLE_SERVICE_ACCOUNT_JSON — must be valid JSON', rows: [], totalRows: 0, headers: [] },
        { status: 200 }
      );
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Read all data from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A:Z', // read up to column Z
    });

    const allRows = response.data.values ?? [];
    if (allRows.length < 2) {
      return NextResponse.json({
        success: true,
        rows: [],
        totalRows: 0,
        headers: allRows[0] ?? [],
      } satisfies SyncResult);
    }

    const headers: string[] = allRows[0].map((h: string) => String(h).trim());
    const dataRows = allRows.slice(1); // skip header row

    // Only return rows newer than lastSyncRow
    const newDataRows = lastSyncRow > 0
      ? dataRows.slice(lastSyncRow)
      : dataRows;

    // Build field map: spreadsheet column index → lead field
    const colToLeadField: Record<number, string> = {};
    headers.forEach((header, colIdx) => {
      const mapping = fieldMappings.find(
        (m) => m.formField.toLowerCase().trim() === header.toLowerCase().trim()
      );
      if (mapping) colToLeadField[colIdx] = mapping.leadField;
    });

    // Build rows
    const rows: SheetRow[] = newDataRows.map((row: string[], idx: number) => {
      const values: Record<string, string> = {};

      // Always map by header name
      headers.forEach((header, colIdx) => {
        const cellValue = String(row[colIdx] ?? '').trim();
        // Map to CRM field if mapping exists
        if (colToLeadField[colIdx]) {
          values[colToLeadField[colIdx]] = cellValue;
        }
        // Also store by header name (for unmapped fields)
        values[`__col_${header}`] = cellValue;
      });

      // First column of Google Forms is always Timestamp
      const timestamp = String(row[0] ?? new Date().toISOString()).trim();

      return {
        rowIndex: (lastSyncRow > 0 ? lastSyncRow : 0) + idx + 1, // 1-based data row
        values,
        timestamp,
      };
    });

    return NextResponse.json({
      success: true,
      rows,
      totalRows: dataRows.length,
      headers,
    } satisfies SyncResult);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Sync API Error]', message);
    return NextResponse.json(
      { success: false, error: message, rows: [], totalRows: 0, headers: [] },
      { status: 200 }
    );
  }
}
