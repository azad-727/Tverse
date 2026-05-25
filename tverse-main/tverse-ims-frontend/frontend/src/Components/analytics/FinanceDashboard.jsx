import { useState } from 'react';
import axios from 'axios';

const FinanceDashboard = () => {
    const [file, setFile] = useState(null);
    const [channel, setChannel] = useState('FLIPKART');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setMessage('');
        setError('');
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a CSV file first.');
            return;
        }

        setLoading(true);
        setMessage('');
        setError('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('channel', channel);

        try {
            const response = await axios.post('http://localhost:8080/api/finance/upload-settlement', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setMessage(response.data);
            setFile(null); // Clear the file input on success
            document.getElementById('csvFileInput').value = ''; 
        } catch (err) {
            console.error(err);
            setError(err.response?.data || 'An error occurred while uploading the file.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid p-4 bg-light" style={{ minHeight: '100vh' }}>
            <div className="row justify-content-center">
                <div className="col-md-8 col-lg-6">
                    
                    <div className="card border-0 shadow-sm mt-4">
                        <div className="card-header bg-white pt-4 pb-3 border-bottom">
                            <h5 className="fw-bold mb-0 text-primary">
                                <i className="bi bi-wallet2 me-2"></i>Marketplace Reconciliation
                            </h5>
                            <p className="text-muted small mb-0 mt-1">
                                Upload settlement reports to calculate true profit margins.
                            </p>
                        </div>
                        
                        <div className="card-body p-4">
                            {/* Alert Messages */}
                            {message && <div className="alert alert-success shadow-sm">{message}</div>}
                            {error && <div className="alert alert-danger shadow-sm">{error}</div>}

                            {/* Channel Dropdown */}
                            <div className="mb-4">
                                <label className="form-label fw-bold text-dark">1. Select Marketplace</label>
                                <select 
                                    className="form-select form-select-lg bg-light" 
                                    value={channel} 
                                    onChange={(e) => setChannel(e.target.value)}
                                >
                                    <option value="FLIPKART">Flipkart</option>
                                    <option value="MEESHO">Meesho</option>
                                    <option value="MYNTRA">Myntra</option>
                                </select>
                            </div>

                            {/* File Upload */}
                            <div className="mb-4">
                                <label className="form-label fw-bold text-dark">2. Upload Settlement CSV</label>
                                <input 
                                    type="file" 
                                    id="csvFileInput"
                                    className="form-control form-control-lg" 
                                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                    onChange={handleFileChange}
                                />
                                <div className="form-text mt-2">
                                    Ensure the file matches the selected marketplace format.
                                </div>
                            </div>

                            {/* Action Button */}
                            <button 
                                className="btn btn-primary btn-lg w-100 fw-bold shadow-sm"
                                onClick={handleUpload}
                                disabled={loading || !file}
                            >
                                {loading ? (
                                    <span><span className="spinner-border spinner-border-sm me-2"></span>Processing Ledger...</span>
                                ) : (
                                    <span><i className="bi bi-cloud-arrow-up-fill me-2"></i>Calculate True Profit</span>
                                )}
                            </button>
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>
    );
};

export default FinanceDashboard;