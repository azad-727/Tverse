import { useState } from 'react';
import apiClient from './apiClient';

const PicklistPage = () => {
    const [file, setFile] = useState(null);
    const [picklist, setPicklist] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    // Batch ID for Delete Functionality
    const [currentBatchId, setCurrentBatchId] = useState(null);
    const[brand,setBrand]=useState("Thalasi");
    
    // Options
    const [channel, setChannel] = useState("Flipkart"); 
    const [saveToDb, setSaveToDb] = useState(true);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError("");
    };

    // --- GENERATE PICKLIST ---
    const handleGenerate = async () => {
        if (!file) {
            setError("Please select a file.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("channel", channel);
        formData.append("brand",brand);
        formData.append("saveToDb", saveToDb); // Send boolean to backend

        setLoading(true);
        setPicklist([]); 
        setCurrentBatchId(null);

        try {
            const response = await apiClient.post("/api/orders/generate-picklist", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setPicklist(response.data);
            
            // Capture the Batch ID from the first item (if exists)
            if (response.data.length > 0) {
                setCurrentBatchId(response.data[0].picklistId);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to generate list: " + (err.response?.data || err.message));
        } finally {
            setLoading(false);
        }
    };

    // --- DELETE BATCH ---
    const handleDeleteBatch = async () => {
        if (!currentBatchId) return;
        
        if (!confirm("Are you sure? This will remove all sales history associated with this file upload.")) {
            return;
        }

        try {
            await apiClient.delete(`/api/orders/picklist/${currentBatchId}`);
            alert("Orders deleted from history.");
            setPicklist([]); // Clear UI
            setCurrentBatchId(null);
        } catch (error) {
            alert("Delete failed: " + (error.response?.data || error.message));
        }
    };

    // --- HELPERS ---
    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith("http")) return path;
        // FIXED: Corrected the default baseURL reference so images render properly
        return `${apiClient.defaults.baseURL || 'http://localhost:8080'}/${path}`;
    };

    const formatVariant = (details) => {
        if(!details) return <span className="text-muted small">Standard</span>;
        return (
            <div className="d-flex gap-1 flex-wrap">
                {details.includes("Size:") && <span className="badge bg-light text-dark border">S: {details.split("Size: ")[1].split(" ")[0]}</span>}
                {details.includes("Color:") && <span className="badge bg-light text-dark border">C: {details.split("Color: ")[1]}</span>}
            </div>
        );
    };

    // --- WHATSAPP SHARE ---
    const handleWhatsAppShare = () => {
        if (picklist.length === 0) return;

        let message = `📦 *PICKLIST FOR ${channel.toUpperCase()}*\n`;
        message += `📅 ${new Date().toLocaleDateString()} | ⏰ ${new Date().toLocaleTimeString()}\n`;
        message += `📊 Total Items: *${picklist.reduce((acc, item) => acc + item.orderQty, 0)}*\n`;
        message += `--------------------------------\n`;

        picklist.forEach(item => {
            const statusIcon = item.status === 'READY' ? '✅' : '❌';
            message += `${statusIcon} *${item.location || 'NO LOC'}* : ${item.sku}\n`;
            message += `   └ Qty: *${item.orderQty}* | ${item.variantDetails || ''}\n\n`;
        });

        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="container-fluid p-0">
            
            
            {/* MOBILE RESPONSIVE STYLE ENGINE */}
                    <style>{`
            @media print {
                .btn, .sidebar, .navbar, .drawer-backdrop, .drawer-panel {
                    display: none !important;
                }

                /* Force full page width and fixed layout */
                .modern-table, table {
                    width: 100% !important;
                    table-layout: fixed !important;
                }

                /* THE KEY FIX: enforce column widths in print */
                table colgroup,
                table thead tr th:nth-child(1) { width: 12% !important; }  /* LOC */
                table thead tr th:nth-child(2) { width: 8% !important; }   /* IMG */
                table thead tr th:nth-child(3) { width: 22% !important; }  /* SKU */
                table thead tr th:nth-child(4) { width: 38% !important; }  /* PRODUCT NAME */
                table thead tr th:nth-child(5) { width: 10% !important; }  /* QTY */
                table thead tr th:nth-child(6) { width: 10% !important; }  /* CHECK */

                /* Force ALL cells to wrap and never overflow */
                table td, table th {
                    word-break: break-all !important;
                    white-space: normal !important;
                    overflow: hidden !important;
                    padding: 6px 4px !important;
                    font-size: 11px !important;
                }

                /* Override the no-wrap class that's causing overflow */
                .no-wrap-data {
                    white-space: normal !important;
                    word-break: break-all !important;
                    overflow: hidden !important;
                    font-size: 11px !important;
                }

                /* Shrink images for print */
                .img-fixed {
                    max-width: 35px !important;
                    max-height: 35px !important;
                }

                /* QTY badge - make it print-friendly */
                .badge.fs-4 {
                    font-size: 13px !important;
                    padding: 4px 6px !important;
                }

                /* SKU monospace text - must wrap */
                .font-monospace {
                    font-size: 10px !important;
                    word-break: break-all !important;
                    white-space: normal !important;
                }
            }

            @media (max-width: 768px) {
                .table-responsive {
                    -webkit-overflow-scrolling: touch;
                    scrollbar-width: none;
                }
                .table-responsive::-webkit-scrollbar {
                    display: none !important;
                }
                .img-fixed {
                    max-width: 40px;
                    max-height: 40px;
                    object-fit: contain;
                }
            }
        `}</style>

            {/* Header */}
            {/* ADDED: flex-column flex-md-row and gap-3 for mobile stacking */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3 d-print-none">
                <div>
                    <h3 className="fw-bold mb-0">Daily Picklist</h3>
                    <div className="text-muted small">Optimized walking path based on location.</div>
                </div>
                {picklist.length > 0 && (
                    <div className="d-flex flex-wrap gap-2 w-100 w-md-auto">
                        {/* Only show delete if we have a valid batch ID */}
                        {currentBatchId && (
                            <button className="btn btn-outline-danger flex-grow-1 flex-md-grow-0" onClick={handleDeleteBatch} title="Delete from History">
                                <i className="bi bi-trash"></i>
                            </button>
                        )}
                        <button className="btn btn-success flex-grow-1 flex-md-grow-0" onClick={handleWhatsAppShare}>
                            <i className="bi bi-whatsapp me-2"></i> Share
                        </button>
                        <button className="btn btn-dark px-4 flex-grow-1 flex-md-grow-0" onClick={() => window.print()}>
                            <i className="bi bi-printer me-2"></i> Print
                        </button>
                    </div>
                )}
            </div>

            {/* Upload Box */}
            {picklist.length === 0 && (
                <div className="custom-card p-3 p-md-5 mb-4 d-print-none text-center">
                    <div className="border rounded p-3 p-md-5 bg-light mx-auto" style={{maxWidth: '600px', borderStyle: 'dashed'}}>
                        <i className="bi bi-file-earmark-spreadsheet fs-1 text-primary mb-3"></i>
                        <h5 className="fw-bold">Generate Picklist</h5>
                        
                        {/* 1. CHANNEL SELECTION */}
                        <div className="row mb-3 text-start">

                            <div className="col-md-4 mb-3 mb-md-0">
                                <label className="form-label small fw-bold text-muted">Sales Channel</label>
                                <select className="form-select" value={channel} onChange={(e) => setChannel(e.target.value)}>
                                    <option value="Flipkart">Flipkart</option>
                                    <option value="Amazon">Amazon</option>
                                    <option value="Meesho">Meesho</option>
                                    <option value="Myntra">Myntra</option>
                                    <option value="Website">My Website</option>
                                    <option value="B2B">Wholesale / B2B</option>
                                </select>
                            </div>
                            <div className="col-12 col-md-4 mb-3 mb-md-0">
                                <label className="form-label small fw-bold text-muted">Brand</label>
                                <select className="form-select" value={brand} onChange={(e) => setBrand(e.target.value)}>
                                    <option value="Thalasi">Thalasi</option>
                                    <option value="ThreeArrows">Three Arrows</option>
                                    <option value="Other">Other</option>
                                    {/* Add any other brands your business uses here */}
                                </select>
                            </div>

                            
                            {/* 2. SAVE TOGGLE */}
                            <div className="col-md-6">
                                <label className="form-label small fw-bold text-muted">Data Options</label>
                                <div className="form-check form-switch pt-2">
                                    <input 
                                        className="form-check-input" 
                                        type="checkbox" 
                                        id="saveToggle" 
                                        checked={saveToDb}
                                        onChange={(e) => setSaveToDb(e.target.checked)}
                                        style={{cursor: 'pointer'}}
                                    />
                                    <label className="form-check-label small" htmlFor="saveToggle">
                                        {saveToDb ? <span className="text-success fw-bold">Save to Analytics DB</span> : <span className="text-muted">Generate PDF Only</span>}
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* File Upload */}
                        <div className="mb-4 text-start">
                            <label className="form-label small fw-bold text-muted">Upload Order Report</label>
                            <input type="file" className="form-control" onChange={handleFileChange} accept=".csv, .xlsx, .xls" />
                        </div>
                        
                        <button className="btn btn-primary w-100" onClick={handleGenerate} disabled={loading}>
                            {loading ? "Processing..." : "Generate Picklist"}
                        </button>

                        {error && <div className="alert alert-danger mt-3 small">{error}</div>}
                    </div>
                </div>
            )}

            {/* Results Table */}
            {picklist.length > 0 && (
                <div className="card border-0 shadow-sm">
                    <div className="d-none d-print-flex p-4 pb-0 justify-content-between align-items-end">
                        <div>
                            <h2 className="fw-bold mb-0 text-uppercase">{channel} PICKLIST</h2>
                            <div className="small">Date: {new Date().toLocaleString()}</div>
                        </div>
                        <div className="text-end">
                            <h1>Total Items: {picklist.reduce((acc, item) => acc + item.orderQty, 0)}</h1>
                        </div>
                    </div>

                    <div className="table-responsive mt-3">
                        {/* ADDED: minWidth to prevent table squishing on mobile */}
                        <table className="table table-bordered align-middle mb-0" style={{borderColor: '#dee2e6', minWidth: '850px'}}>
                            <thead className="table-dark">
                                <tr className="text-uppercase small">
                                    <th style={{width: '15%'}} className="text-center">Loc</th>
                                    <th style={{width: '10%'}} className="text-center">Img</th>
                                    <th style={{width: '20%'}}>SKU / Variant</th>
                                    <th style={{width: '35%'}}>Product Name</th>
                                    <th style={{width: '10%'}} className="text-center">QTY</th>
                                    <th style={{width: '10%'}} className="text-center">Check</th>
                                </tr>
                            </thead>
                            <tbody>
                                {picklist.map((item, index) => (
                                    <tr key={index} style={{height: '60px'}}>
                                        <td className="text-center bg-light">
                                            <div className="fw-bold fs-5 text-dark no-wrap-data">{item.location || "N/A"}</div>
                                        </td>
                                        <td className="text-center">
                                            <div className="img-box-fixed mx-auto">
                                                {getImageUrl(item.imageUrl) ? (
                                                    <img src={getImageUrl(item.imageUrl)} alt="" className="img-fixed" />
                                                ) : <span className="text-muted small">No Img</span>}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="fw-bold text-primary font-monospace no-wrap-data" style={{fontSize: '0.95rem'}}>{item.sku}</div>
                                            <div className="mt-1">{formatVariant(item.variantDetails)}</div>
                                        </td>
                                        <td>
                                            <div className="product-name-truncate text-muted small" title={item.productName}>{item.productName}</div>
                                            {item.status !== 'READY' && (
                                                <div className="d-block mt-1">
                                                    {item.status === 'OUT_OF_STOCK' && <span className="badge bg-danger">Short: {item.stockAvailable}</span>}
                                                    {item.status === 'SKU_MISMATCH' && <span className="badge bg-warning text-dark">Unknown SKU</span>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="text-center">
                                            <span className="badge bg-dark fs-4 rounded-3 px-3">{item.orderQty}</span>
                                        </td>
                                        <td className="text-center">
                                            <div style={{width: '25px', height: '25px', border: '2px solid #ccc', margin: '0 auto', borderRadius: '4px'}}></div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PicklistPage;