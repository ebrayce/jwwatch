export interface ParsedRecord {
  id: string;
  date: Date | null;
  name: string;
  phoneNumber: string;
  description: string; // Can be notes, address, or any other secondary info
  originalData: any;
}

export interface SchemaMapping {
  dateKey: string | null;
  nameKey: string | null;
  phoneKey: string | null;
  descriptionKey: string | null;
  analysisSource?: 'ai' | 'heuristic';
}

export type ProcessingStatus = 'idle' | 'analyzing' | 'mapping' | 'success' | 'error';

export interface ExcelRow {
  [key: string]: any;
}