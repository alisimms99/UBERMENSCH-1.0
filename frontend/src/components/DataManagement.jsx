import React, { useState } from 'react';
import { Database, Download, Upload, Trash2, AlertTriangle, CheckCircle, X } from 'lucide-react';

const DataManagement = ({ user, onDataAction }) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState('');
  const [exportData, setExportData] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [actionStatus, setActionStatus] = useState(null);

  const handleExportData = async () => {
    try {
      setActionStatus({ type: 'loading', message: 'Exporting data...' });
      const data = await onDataAction('export');
      setExportData(data);
      
      // Create download link
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fittracker-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setActionStatus({ type: 'success', message: 'Data exported successfully!' });
      setTimeout(() => setActionStatus(null), 3000);
    } catch (error) {
      setActionStatus({ type: 'error', message: 'Failed to export data: ' + error.message });
      setTimeout(() => setActionStatus(null), 5000);
    }
  };

  const handleImportData = async () => {
    if (!importFile) return;
    
    try {
      setActionStatus({ type: 'loading', message: 'Importing data...' });
      const text = await importFile.text();
      const data = JSON.parse(text);
      
      await onDataAction('import', data);
      setActionStatus({ type: 'success', message: 'Data imported successfully!' });
      setImportFile(null);
      setTimeout(() => setActionStatus(null), 3000);
    } catch (error) {
      setActionStatus({ type: 'error', message: 'Failed to import data: ' + error.message });
      setTimeout(() => setActionStatus(null), 5000);
    }
  };

  const handleClearData = async () => {
    if (clearConfirmText !== 'CLEAR_ALL_DATA') {
      setActionStatus({ type: 'error', message: 'Please type "CLEAR_ALL_DATA" to confirm' });
      setTimeout(() => setActionStatus(null), 3000);
      return;
    }

    try {
      setActionStatus({ type: 'loading', message: 'Clearing all data...' });
      await onDataAction('clear', { confirmation: clearConfirmText });
      setShowClearConfirm(false);
      setClearConfirmText('');
      setActionStatus({ type: 'success', message: 'All data cleared successfully!' });
      setTimeout(() => setActionStatus(null), 3000);
    } catch (error) {
      setActionStatus({ type: 'error', message: 'Failed to clear data: ' + error.message });
      setTimeout(() => setActionStatus(null), 5000);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <Database className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Data Management</h2>
      </div>

      {/* Status Messages */}
      {actionStatus && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          actionStatus.type === 'success' ? 'bg-green-50 border border-green-200' :
          actionStatus.type === 'error' ? 'bg-red-50 border border-red-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          {actionStatus.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
          {actionStatus.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-600" />}
          {actionStatus.type === 'loading' && <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
          <span className={`text-sm font-medium ${
            actionStatus.type === 'success' ? 'text-green-800' :
            actionStatus.type === 'error' ? 'text-red-800' :
            'text-blue-800'
          }`}>
            {actionStatus.message}
          </span>
        </div>
      )}

      <div className="space-y-6">
        {/* Export Data */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Download className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-800">Export Data</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Download all your fitness data including profile, workout history, and progress entries as a JSON file.
          </p>
          <button
            onClick={handleExportData}
            disabled={actionStatus?.type === 'loading'}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>

        {/* Import Data */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Upload className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Import Data</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Import fitness data from a previously exported JSON file. This will update your profile information.
          </p>
          
          <div className="space-y-3">
            <div>
              <input
                type="file"
                accept=".json"
                onChange={(e) => setImportFile(e.target.files[0])}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            
            {importFile && (
              <div className="text-sm text-gray-600">
                Selected: {importFile.name} ({formatFileSize(importFile.size)})
              </div>
            )}
            
            <button
              onClick={handleImportData}
              disabled={!importFile || actionStatus?.type === 'loading'}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Upload className="w-4 h-4" />
              Import Data
            </button>
          </div>
        </div>

        {/* Clear All Data */}
        <div className="border border-red-200 rounded-lg p-6 bg-red-50">
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-800">Clear All Data</h3>
          </div>
          <p className="text-red-700 mb-4">
            <strong>Warning:</strong> This will permanently delete all your fitness data including workout history, 
            progress entries, and reset your profile to initial state. This action cannot be undone.
          </p>
          
          {!showClearConfirm ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear All Data
            </button>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800">Confirm Data Deletion</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Type <strong>"CLEAR_ALL_DATA"</strong> below to confirm you want to delete all your data.
                    </p>
                  </div>
                </div>
                
                <input
                  type="text"
                  value={clearConfirmText}
                  onChange={(e) => setClearConfirmText(e.target.value)}
                  placeholder="Type CLEAR_ALL_DATA to confirm"
                  className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 mb-3"
                />
                
                <div className="flex gap-3">
                  <button
                    onClick={handleClearData}
                    disabled={clearConfirmText !== 'CLEAR_ALL_DATA' || actionStatus?.type === 'loading'}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Confirm Delete
                  </button>
                  <button
                    onClick={() => {
                      setShowClearConfirm(false);
                      setClearConfirmText('');
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Data Summary */}
        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Profile Created:</span>
              <div className="font-medium">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Total Workouts:</span>
              <div className="font-medium">{user?.total_workouts || 0}</div>
            </div>
            <div>
              <span className="text-gray-600">Current Streak:</span>
              <div className="font-medium">{user?.current_streak || 0} days</div>
            </div>
            <div>
              <span className="text-gray-600">Weeks Completed:</span>
              <div className="font-medium">{user?.weeks_completed || 0}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManagement;

