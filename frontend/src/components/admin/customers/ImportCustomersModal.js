'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '@/hooks/useScrollLock';
import Papa from 'papaparse';
import { 
  RiCloseLine, RiUploadCloud2Line, RiDownload2Line, 
  RiFileExcel2Line, RiCheckLine, RiErrorWarningLine,
  RiLoader2Line, RiArrowRightLine
} from 'react-icons/ri';
import api from '@/lib/api';

const TEMPLATE_HEADERS = ['First Name', 'Last Name', 'Phone', 'Email', 'Gender', 'DOB (YYYY-MM-DD)', 'Source', 'Notes'];
const TEMPLATE_DATA = [
  ['John', 'Doe', '9876543210', 'john@example.com', 'male', '1990-05-15', 'walk_in', 'VIP customer'],
  ['Jane', 'Smith', '9876543211', 'jane@example.com', 'female', '1985-10-20', 'referral', '']
];

export default function ImportCustomersModal({ isOpen, onClose, onSuccess }) {
  const [mounted, setMounted] = useState(false);
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  
  const fileInputRef = useRef(null);

  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleDownloadTemplate = () => {
    const csvContent = [
      TEMPLATE_HEADERS.join(','),
      ...TEMPLATE_DATA.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'customers_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.name.endsWith('.csv')) {
      alert('Please upload a valid CSV file.');
      return;
    }
    setFile(selectedFile);
    setResults(null);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setParsedData(result.data);
      }
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleImport = async () => {
    if (!parsedData || parsedData.length === 0) return;
    
    setLoading(true);
    
    // Map CSV keys to backend keys
    const formattedData = parsedData.map(row => {
      // Find matching keys ignoring case and whitespace
      const getVal = (possibleKeys) => {
        const key = Object.keys(row).find(k => possibleKeys.some(pk => k.toLowerCase().includes(pk)));
        return key ? row[key] : undefined;
      };

      const genderMap = { 'm': 'male', 'male': 'male', 'f': 'female', 'female': 'female' };
      const sourceMap = { 'walk-in': 'walk_in', 'walk in': 'walk_in', 'referral': 'referral', 'online': 'online', 'campaign': 'campaign' };

      const rawGender = getVal(['gender']);
      const rawSource = getVal(['source']);

      return {
        first_name: getVal(['first name', 'firstname', 'name']) || undefined,
        last_name: getVal(['last name', 'lastname']) || undefined,
        phone: getVal(['phone', 'mobile', 'contact']) || undefined,
        email: getVal(['email', 'e-mail']) || undefined,
        gender: rawGender ? (genderMap[rawGender.toLowerCase()] || 'other') : 'other',
        date_of_birth: getVal(['dob', 'date of birth', 'birth']) || undefined,
        source: rawSource ? (sourceMap[rawSource.toLowerCase()] || 'walk_in') : 'walk_in',
        notes: getVal(['note', 'notes', 'remarks']) || undefined
      };
    }).filter(c => c.first_name); // First name is required

    if (formattedData.length === 0) {
      alert('No valid customers found in CSV. Make sure "First Name" is provided.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/customers/bulk', { customers: formattedData });
      setResults(res.data.data || res.data);
      // We don't call onSuccess here anymore, we let the user review the results first.
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to import customers');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setParsedData([]);
    setResults(null);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease_forwards] p-4 sm:p-6">
      <div className="bg-admin-card w-full max-w-2xl rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-[slideUp_0.3s_ease_forwards]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-admin-border bg-admin-surface-light">
          <div>
            <h2 className="text-xl font-bold text-admin-text">Import Customers</h2>
            <p className="text-sm text-admin-text-secondary mt-1">Upload a CSV file to bulk import customers</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-admin-border text-admin-text-secondary transition-colors"
          >
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {results ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-accent-green/10 text-accent-green flex items-center justify-center text-3xl mx-auto mb-4">
                  <RiCheckLine />
                </div>
                <h3 className="text-2xl font-bold">Import Completed!</h3>
                <p className="text-admin-text-secondary mt-2">
                  Successfully imported <strong>{results.successful}</strong> customers.
                </p>
              </div>

              {results.failed > 0 && (
                <div className="bg-accent-red/5 border border-accent-red/20 rounded-xl p-4">
                  <h4 className="font-bold text-accent-red flex items-center gap-2 mb-3">
                    <RiErrorWarningLine /> {results.failed} Rows Failed
                  </h4>
                  <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                    {results.errors.map((err, i) => (
                      <div key={i} className="text-sm flex flex-col p-2 bg-admin-card rounded border border-admin-border">
                        <span className="font-semibold text-admin-text">Row {err.row}: {err.name || 'Unknown'}</span>
                        <span className="text-accent-red">{err.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Template Download */}
              <div className="bg-brand/5 border border-brand/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-brand">Need a template?</h4>
                  <p className="text-xs text-admin-text-secondary mt-1">Download our CSV template to ensure your data is formatted correctly.</p>
                </div>
                <button 
                  onClick={handleDownloadTemplate}
                  className="px-4 py-2 bg-admin-card border border-brand/30 text-brand rounded-lg text-sm font-semibold hover:bg-brand hover:text-white transition-colors flex items-center gap-2"
                >
                  <RiDownload2Line /> Template
                </button>
              </div>

              {/* Upload Area */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 
                  ${isDragging ? 'border-brand bg-brand/5' : 'border-admin-border hover:border-brand/50 hover:bg-admin-surface-light'}
                  ${file ? 'bg-admin-surface border-solid' : ''}
                `}
              >
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={(e) => handleFile(e.target.files[0])}
                />
                
                {file ? (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center text-2xl mb-3">
                      <RiFileExcel2Line />
                    </div>
                    <p className="font-bold text-admin-text">{file.name}</p>
                    <p className="text-xs text-admin-text-secondary mt-1">
                      {parsedData.length > 0 ? `${parsedData.length} rows detected` : 'Parsing file...'}
                    </p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); resetModal(); }}
                      className="mt-4 text-xs font-semibold text-accent-red hover:underline"
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-admin-surface-light flex items-center justify-center text-3xl text-admin-text-muted mb-4 group-hover:text-brand transition-colors">
                      <RiUploadCloud2Line />
                    </div>
                    <p className="font-bold text-admin-text mb-1">Click to upload or drag and drop</p>
                    <p className="text-sm text-admin-text-secondary">CSV files only</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-admin-border bg-admin-surface-light flex gap-3 justify-end rounded-b-2xl">
          {results ? (
            <>
              <button 
                onClick={resetModal}
                className="px-6 py-2.5 rounded-xl border border-admin-border bg-admin-surface hover:bg-admin-card text-admin-text font-bold text-sm transition-colors"
              >
                Import Another
              </button>
              <button 
                onClick={() => {
                  if (onSuccess) onSuccess();
                  onClose();
                }}
                className="px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-sm transition-colors shadow-lg shadow-brand/20"
              >
                Done
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl border border-admin-border bg-admin-surface hover:bg-admin-card text-admin-text font-bold text-sm transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleImport}
                disabled={!file || parsedData.length === 0 || loading}
                className="px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-sm transition-colors shadow-lg shadow-brand/20 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
              >
                {loading ? <RiLoader2Line className="animate-spin text-lg" /> : 'Start Import'}
              </button>
            </>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}
