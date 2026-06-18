import { useState } from 'react';
import apiClient from '../apiClient'; // FIXED: Swapped raw axios for centralized API client

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
            // FIXED: Used apiClient to dynamically route the request and pass auth tokens
            const response = await apiClient.post('/api/finance/upload-settlement', formData, {
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
        <div className="container-fluid p-3 p-md-4 bg-light" style={{ minHeight: '100vh' }}>
            
            {/* COMPONENT-SPECIFIC MOBILE RESPONSIVE ENGINE */}
            <style>{`
                @media (max-width: 767.98px) {
                    .tverse-finance-card {
                        padding: 1.25rem !important; /* Reduces bulky padding on small phone screens */
                    }
                    .form-select-lg, .form-control-lg {
                        font-size: 1rem !important; /* Prevents iOS auto-zoom on input focus */
                    }
                }
            `}</style>

            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                    
                    <div className="card border-0 shadow-sm mt-2 mt-md-4 rounded-4 overflow-hidden">
                        <div className="card-header bg-white pt-4 pb-3 border-bottom px-4">
                            <h5 className="fw-bold mb-0 text-primary d-flex align-items-center" style={{ letterSpacing: '-0.5px' }}>
                                <i className="bi bi-wallet2 me-2 fs-4"></i>Marketplace Reconciliation
                            </h5>
                            <p className="text-muted small mb-0 mt-2">
                                Upload settlement reports to calculate true profit margins.
                            </p>
                        </div>
                        
                        <div className="card-body p-4 tverse-finance-card">
                            {/* Alert Messages */}
                            {message && <div className="alert alert-success shadow-sm small fw-medium">{message}</div>}
                            {error && <div className="alert alert-danger shadow-sm small fw-medium">{error}</div>}

                            {/* Channel Dropdown */}
                            <div className="mb-4">
                                <label className="form-label fw-bold text-dark small text-uppercase">1. Select Marketplace</label>
                                <select 
                                    className="form-select form-select-lg bg-light fw-bold text-dark shadow-none border-secondary border-opacity-25" 
                                    value={channel} 
                                    onChange={(e) => setChannel(e.target.value)}
                                >
                                    <option value="FLIPKART">Flipkart</option>
                                    <option value="AMAZON">Amazon</option>
                                    <option value="WEBSITE">WebSite</option>
                                    <option value="MEESHO">Meesho</option>
                                    <option value="MYNTRA">Myntra</option>
                                </select>
                            </div>

                            {/* File Upload */}
                            <div className="mb-4 mt-2">
                                <label className="form-label fw-bold text-dark small text-uppercase">2. Upload Settlement CSV</label>
                                <input 
                                    type="file" 
                                    id="csvFileInput"
                                    className="form-control form-control-lg shadow-none border-secondary border-opacity-25" 
                                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                    onChange={handleFileChange}
                                />
                                <div className="form-text mt-2 small text-muted">
                                    Ensure the file matches the selected marketplace format.
                                </div>
                            </div>

                            {/* Action Button */}
                            <button 
                                className="btn btn-primary btn-lg w-100 fw-bold shadow-sm mt-2 rounded-3"
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