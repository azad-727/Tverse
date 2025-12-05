import { useState } from 'react';
import axios from 'axios';

const BulkStockOp = () => {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");

    const handleUpload = async () => {
        if (!file) return;
        
        const formData = new FormData();
        formData.append("file", file);
        setStatus("uploading");
        setMessage("");

        try {
            const response = await axios.post("http://192.168.31.84:8080/api/inventory/bulk-adjust", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setStatus("success");
            // Show the summary report from backend
            setMessage(response.data); 
        } catch (error) {
            setStatus("error");
            setMessage("Failed: " + (error.response?.data || error.message));
        }
    };
    const handleDownloadTemplate = ()=>{
        const fileUrl="http://192.168.31.84:8080/BulkStock_UpdateFile.xlsx";
        const link=document.createElement('a');
        link.href=fileUrl;
        link.setAttribute('download','T-verse_BulkStock_Update');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    return (
        <div className="container p-0">
            <h4 className="fw-bold mb-3 text-primary">Bulk Stock Operations</h4>
            
            <div className="row">
                <div className="col-md-8">
                    <div className="custom-card p-4">
                        <div className="alert alert-warning border-0 d-flex align-items-center">
                            <i className="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
                            <div>
                                <strong>Supported Operations:</strong>
                                <ul className="mb-0 small mt-1">
                                    <li><code>ADD</code> - Increases stock (e.g. Inbound)</li>
                                    <li><code>REMOVE</code> - Decreases stock (e.g. Audit correction)</li>
                                    <li><code>LOST</code> - Decreases stock & logs as damage</li>
                                    <li><code>MOVE</code> - Changes Rack Location (Requires 'New_Location' column)</li>
                                </ul>
                            </div>
                        </div>
                         <button 
                                className="btn btn-outline-primary w-100" 
                            onClick={handleDownloadTemplate}
                            >
                                <i className="bi bi-cloud-download me-2"></i>
                                 Download Template
                            </button>

                        <div className="mb-4 mt-4">
                            <label className="form-label fw-bold">Upload Adjustment File (.xlsx)</label>
                            <input 
                                type="file" 
                                className="form-control" 
                                accept=".xlsx"
                                onChange={(e) => setFile(e.target.files[0])} 
                            />
                        </div>

                        <button 
                            className="btn btn-primary w-100 py-2" 
                            onClick={handleUpload}
                            disabled={!file || status === 'uploading'}
                        >
                            {status === 'uploading' ? 'Processing...' : 'Apply Adjustments'}
                        </button>

                        {/* Result Log */}
                        {message && (
                            <div className={`mt-4 p-3 rounded ${status === 'error' ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'}`}>
                                <h6 className="fw-bold">{status === 'error' ? 'Error' : 'Result Report'}</h6>
                                <pre style={{whiteSpace: 'pre-wrap', fontFamily: 'inherit'}}>{message}</pre>
                            </div>
                        )}
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card bg-light border-0 p-3">
                        <h6 className="fw-bold">CSV/Excel Format</h6>
                        <p className="small text-muted">Ensure your file has these headers in order:</p>
                        <table className="table table-bordered table-sm small bg-white">
                            <thead className="table-secondary">
                                <tr><th>Col</th><th>Header</th></tr>
                            </thead>
                            <tbody>
                                <tr><td>A</td><td>SKU</td></tr>
                                <tr><td>B</td><td>Operation</td></tr>
                                <tr><td>C</td><td>Qty</td></tr>
                                <tr><td>D</td><td>Reason</td></tr>
                                <tr><td>E</td><td>New_Location</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkStockOp;