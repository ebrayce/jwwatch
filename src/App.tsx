import React, { useState, useEffect, useMemo } from 'react';
import { FileUpload } from './components/FileUpload';
import { ContactCard } from './components/ContactCard';
import { DateFilter } from './components/DateFilter';
import { ColumnSelector } from './components/ColumnSelector';
import { parseExcelFile, parseWordFile, getHeaders, mapDataToSchema } from './services/fileService';
import type { ParsedRecord, ProcessingStatus, SchemaMapping, ExcelRow, StorageData } from './types';
import { Phone, Calendar, Loader2, AlertCircle, RefreshCw, FileText, Save, Trash2, CheckCircle2 } from 'lucide-react';
import { format, isValid, isSameDay, parseISO } from 'date-fns';

const STORAGE_KEY = 'smart_call_list_data';

const App: React.FC = () => {
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [records, setRecords] = useState<ParsedRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  
  // State for mapping phase
  const [rawRows, setRawRows] = useState<ExcelRow[]>([]);
  const [availableHeaders, setAvailableHeaders] = useState<string[]>([]);

    useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: StorageData = JSON.parse(saved);
        // Revive dates
        const revivedRecords = parsed.records.map(r => ({
          ...r,
          date: r.date ? parseISO(r.date as any) : null
        }));
        setRecords(revivedRecords);
        setFileName(parsed.fileName);
        setStatus('success');
        setIsSaved(true);
      } catch (e) {
        console.error("Failed to load saved data", e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Derived state: Unique dates from records
  const availableDates = useMemo(() => {
    const dates = records
      .map(r => r.date)
      .filter((d): d is Date => d !== null && isValid(d));
    
    // Dedup by string representation
    const uniqueStringDates: string[] = Array.from(new Set(dates.map(d => d.toISOString().split('T')[0])));
    return uniqueStringDates.map(s => new Date(s)).sort((a, b) => a.getTime() - b.getTime());
  }, [records]);

  // Derived state: Filtered records
  const filteredRecords = useMemo(() => {
    if (!selectedDate) {
       // If no date was selected but we have records without dates, showing all might be too much.
       // If we have dates, we select one. If NO records have dates, show all.
       if (availableDates.length === 0 && records.length > 0) return records;
       return [];
    }
    return records.filter(r => r.date && isSameDay(r.date, selectedDate));
  }, [records, selectedDate, availableDates]);

  useEffect(() => {
    // Auto-select the first available date when records are loaded
    if (availableDates.length > 0 && !selectedDate) {
      const today = new Date();
      const hasToday = availableDates.some(d => isSameDay(d, today));
      setSelectedDate(hasToday ? today : availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  const handleFileSelect = async (file: File) => {
    setStatus('analyzing');
    setFileName(file.name);
    setErrorMsg('');
     setIsSaved(false);

    try {
      let data: ExcelRow[] = [];

      // 1. Parse File based on extension
      if (file.name.toLowerCase().endsWith('.docx')) {
        data = await parseWordFile(file);
      } else {
        data = await parseExcelFile(file);
      }
      
      if (data.length === 0) {
        throw new Error("The file appears to be empty or contains no readable table data.");
      }

      // 2. Extract Headers and prepare for user mapping
      const headers = getHeaders(data);
      if (headers.length === 0) {
        throw new Error("Could not detect any columns in the file.");
      }

      setRawRows(data);
      setAvailableHeaders(headers);
      setStatus('mapping');

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to process file.");
      setStatus('error');
    }
  };

  const handleMappingConfirm = (mapping: SchemaMapping) => {
    try {
      const processedRecords = mapDataToSchema(rawRows, mapping);
      setRecords(processedRecords);
      setStatus('success');
    } catch (err: any) {
      setErrorMsg("Failed to map data: " + err.message);
      setStatus('error');
    }
  };

  const handleSaveToLocal = () => {
    const dataToSave: StorageData = {
      records,
      fileName,
      savedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      setIsSaved(true);
    } catch (e) {
      alert("Could not save to local storage. File might be too large.");
    }
  };


  const handleReset = () => {
      setRecords([]);
      setRawRows([]);
      setStatus('idle');
      setFileName('');
      setSelectedDate(null);
      setIsSaved(false);
    };

  const handleClearLocal = () => {
    if (confirm("Clear saved data from this device?")) {
      localStorage.removeItem(STORAGE_KEY);
      handleReset();
    }
  }


  

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto border-x border-gray-200 shadow-xl">
      {/* Header */}
      <header className="bg-teal-600 text-white p-4 shadow-md z-10 relative">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Phone className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-tight">Watch Night Schedule</h1>
          </div>
                    <div className="flex items-center gap-2">
            {status === 'success' && (
              <>
                {!isSaved ? (
                  <button 
                    onClick={handleSaveToLocal}
                    className="p-2 bg-teal-500 rounded-full hover:bg-teal-400 transition-colors flex items-center justify-center"
                    title="Save to device"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                ) : (
                  <button 
                    onClick={handleClearLocal}
                    className="p-2 bg-teal-700 rounded-full hover:bg-teal-800 transition-colors flex items-center justify-center"
                    title="Clear saved data"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={handleReset}
                  className="p-2 bg-teal-700 rounded-full hover:bg-teal-800 transition-colors"
                  aria-label="Reset"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-teal-100 text-xs">Call Made Easy</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        {status === 'idle' && (
          <div className="flex-1 flex flex-col justify-center p-6">
             <div className="bg-white rounded-2xl shadow-sm p-6 text-center border border-gray-100">
                <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-teal-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Import Call List</h2>
                <p className="text-gray-500 text-sm mb-6">
                  Upload a file (.xlsx or .docx). You will be asked to match the columns manually.
                </p>
                <FileUpload onFileSelect={handleFileSelect} />
             </div>
          </div>
        )}

        {status === 'analyzing' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <Loader2 className="w-12 h-12 text-teal-600 animate-spin mb-4" />
            <h3 className="text-lg font-medium text-gray-800">Reading File...</h3>
          </div>
        )}

        {status === 'mapping' && (
          <div className="flex-1 p-4 overflow-hidden">
             <ColumnSelector 
               headers={availableHeaders} 
               onConfirm={handleMappingConfirm}
               onCancel={handleReset}
             />
          </div>
        )}

        {status === 'error' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="bg-red-50 p-6 rounded-2xl text-center border border-red-100">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Import Failed</h3>
              <p className="text-red-600 text-sm mt-2 mb-6">{errorMsg}</p>
              <button 
                onClick={handleReset}
                className="bg-white text-gray-900 border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col h-full">

             <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 truncate max-w-[200px]">{fileName}</span>
                {isSaved && (
                  <span className="text-[10px] text-teal-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Saved to device
                  </span>
                )}
              </div>
              {!isSaved && (
                 <button 
                  onClick={handleSaveToLocal}
                  className="text-[10px] bg-teal-50 text-teal-700 px-2 py-1 rounded border border-teal-100 font-bold uppercase tracking-wider hover:bg-teal-100 transition-colors"
                >
                  Save to Device
                </button>
              )}
            </div>

            {/* Date Selector Bar - Only show if we actually have dates */}
            {availableDates.length > 0 && (
              <div className="bg-white border-b border-gray-200 pt-2 pb-2">
                 <div className="px-4 mb-2 flex items-center gap-2">
                   <Calendar className="w-3 h-3 text-teal-600" />
                   <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                      {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select Date'}
                   </span>
                   <span className="text-xs text-gray-400 truncate max-w-[120px]">{fileName}</span>
                 </div>
                 <DateFilter 
                   dates={availableDates} 
                   selectedDate={selectedDate} 
                   onSelect={setSelectedDate} 
                 />
              </div>
            )}

            {/* Records List */}
             <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 scroll-smooth no-scrollbar">
              {filteredRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <Calendar className="w-10 h-10 mb-2 opacity-50" />
                  <p>{availableDates.length === 0 ? 'List imported' : 'No records for this date'}</p>
                </div>
              ) : (
                filteredRecords.map((record, index) => (
                   <ContactCard key={record.id || index} record={record} />
                ))
              )}
              <div className="h-8" /> {/* Bottom spacer */}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;