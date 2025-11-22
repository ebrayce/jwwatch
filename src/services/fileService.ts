import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import type {ExcelRow, SchemaMapping, ParsedRecord} from '../types';
import { isValid } from 'date-fns';

export const parseExcelFile = (file: File): Promise<ExcelRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error("File is empty"));
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON, using the first row as header
        const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
          defval: "", // Default value for empty cells
          raw: false, // Try to format things as strings to keep phone numbers safe
        });

        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsBinaryString(file);
  });
};

export const parseWordFile = async (file: File): Promise<ExcelRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (!arrayBuffer) {
          reject(new Error("File is empty"));
          return;
        }

        // Convert DOCX to HTML to extract tables
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const html = result.value;
        
        // Parse HTML table to JSON
        const json = parseHtmlTableToJson(html);
        
        if (json.length === 0) {
             if (result.messages && result.messages.length > 0) {
                 console.warn("Mammoth messages:", result.messages);
             }
             reject(new Error("No table data found in this Word document. Please ensure data is in a standard table format."));
             return;
        }

        resolve(json);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

const parseHtmlTableToJson = (html: string): ExcelRow[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const table = doc.querySelector('table');

    if (!table) {
        return [];
    }

    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length < 2) return []; // Need at least header and one data row

    // Extract headers from the first row
    const headers = Array.from(rows[0].cells).map(cell => {
        return cell.textContent?.replace(/[\u200B-\u200D\uFEFF]/g, '').trim() || `Column${Math.random().toString(36).substring(7)}`;
    });
    
    const data: ExcelRow[] = [];
    
    for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].cells;
        const rowData: ExcelRow = {};
        let hasData = false;
        
        headers.forEach((header, index) => {
            const val = cells[index]?.textContent?.trim() || "";
            rowData[header] = val;
            if (val) hasData = true;
        });
        
        if (hasData) data.push(rowData);
    }
    
    return data;
};

export const getHeaders = (data: ExcelRow[]): string[] => {
  if (data.length === 0) return [];
  return Object.keys(data[0]);
};

export const mapDataToSchema = (data: ExcelRow[], mapping: SchemaMapping): ParsedRecord[] => {
  return data.map((row, index) => {
    let dateVal: Date | null = null;
    
    if (mapping.dateKey && row[mapping.dateKey]) {
      const rawDate = row[mapping.dateKey];
      // Try simple parsing
      const d = new Date(rawDate);
      if (isValid(d)) {
        dateVal = d;
      } else {
        // Try parsing excel serial date or other formats
        const parsed = Date.parse(rawDate);
        if (!isNaN(parsed)) dateVal = new Date(parsed);
      }
    }

    return {
      id: index.toString(),
      date: dateVal,
      name: mapping.nameKey ? row[mapping.nameKey] : 'Unknown',
      phoneNumber: mapping.phoneKey ? String(row[mapping.phoneKey]) : '',
      description: mapping.descriptionKey ? String(row[mapping.descriptionKey]) : '',
      originalData: row
    };
  });
};