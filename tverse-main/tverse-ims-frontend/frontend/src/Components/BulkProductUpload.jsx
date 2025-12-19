import { useState } from 'react';
import axios from 'axios';

const BulkProductUpload = () => {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState("idle"); 
    const [message, setMessage] = useState("");

    // --- NEW: DOWNLOAD HANDLER ---
    const handleDownloadTemplate = () => {
        // This URL points directly to the file inside src/main/resources/static
        const fileUrl = "http://localhost:8080/product_upload_template.xlsx";
        
        // Create a temporary hidden link and click it to trigger download
        const link = document.createElement('a');
        link.href = fileUrl;
        link.setAttribute('download', 'T-Verse_Listing_Template.xlsx'); // Name the file for the user
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setStatus("idle");
        setMessage("");
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage("Please select a file first.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        setStatus("uploading");

        try {
            const response = await axios.post("http://localhost:8080/api/catalog/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setStatus("success");
            setMessage("✅ " + response.data);
        } catch (error) {
            console.error(error);
            setStatus("error");
            setMessage("❌ Upload failed: " + (error.response?.data || error.message));
        }
    };

    return (
        <div className="container-fluid p-0">
            <h4 className="fw-bold mb-4">Add Listings in Bulk</h4>
            
            <div className="custom-card p-5">
                <div className="row g-5 align-items-center">
                    
                    {/* Left: Instructions */}
                    <div className="col-md-5">
                        <div className="border rounded p-4 text-center h-100 bg-light">
                            <i className="bi bi-file-earmark-spreadsheet fs-1 text-primary mb-3"></i>
                            <h5 className="fw-bold">1. Download Template</h5>
                            <p className="text-muted small">Use the standard format.</p>
                            
                            {/* UPDATED BUTTON WITH ONCLICK */}
                            <button 
                                className="btn btn-outline-primary w-100" 
                                onClick={handleDownloadTemplate}
                            >
                                <i className="bi bi-cloud-download me-2"></i> Download Template
                            </button>
                            
                        </div>
                    </div>

                    {/* Arrow */}
                    <div className="col-md-2 text-center d-none d-md-block">
                        <i className="bi bi-arrow-right fs-1 text-muted"></i>
                    </div>

                    {/* Right: Upload Logic */}
                    <div className="col-md-5">
                        <div className="border rounded p-4 text-center h-100 bg-white shadow-sm">
                            <i className="bi bi-cloud-upload fs-1 text-success mb-3"></i>
                            <h5 className="fw-bold">2. Upload Excel File</h5>
                            
                            <input 
                                type="file" 
                                className="form-control mb-3" 
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                            />
                            
                            <button 
                                className="btn btn-success w-100" 
                                onClick={handleUpload}
                                disabled={!file || status === "uploading"}
                            >
                                {status === "uploading" ? (
                                    <span><span className="spinner-border spinner-border-sm me-2"></span> Processing...</span>
                                ) : "Upload & Process"}
                            </button>

                            {message && (
                                <div className={`alert mt-3 py-2 small ${status === 'error' ? 'alert-danger' : 'alert-success'}`}>
                                    {message}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="mt-5 p-3 bg-light rounded border-start border-5 border-success">
                    <h6 className="fw-bold text-dark"><i className="bi bi-lightbulb me-2"></i> File Guidelines:</h6>
                    <ul className="small text-muted mb-0">
                        <li><strong>Parent Rows:</strong> Leave 'Parent_Sku' empty. Fill Brand, Category, HSN.</li>
                        <li><strong>Child Rows:</strong> Fill 'Parent_Sku' with the exact Parent SKU. Fill Size, Color, Stock.</li>
                        <li>Ensure SKUs are unique across the entire system.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default BulkProductUpload;