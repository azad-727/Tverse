import { useState } from 'react';
import axios from 'axios';

const PicklistPage = () => {
    const [file, setFile] = useState(null);
    const [picklist, setPicklist] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    // --- NEW: CHANNEL STATE ---
    const [channel, setChannel] = useState("Flipkart"); // Default

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError("");
    };

    const handleGenerate = async () => {
        if (!file) {
            setError("Please select a file.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        setLoading(true);
        setPicklist([]); 

        try {
            const response = await axios.post("http://192.168.31.84:8080/api/orders/generate-picklist", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setPicklist(response.data);
        } catch (err) {
            console.error(err);
            setError("Failed to generate list: " + (err.response?.data || err.message));
        } finally {
            setLoading(false);
        }
    };

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith("http")) return path;
        return `http://192.168.31.84:8080/${path}`;
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

    // --- NEW: WHATSAPP SHARE LOGIC ---
    const handleWhatsAppShare = () => {
        if (picklist.length === 0) return;

        // 1. Create a Header
        let message = ` *PICKLIST FOR ${channel.toUpperCase()}*\n`;
        message += ` ${new Date().toLocaleDateString()} |  ${new Date().toLocaleTimeString()}\n`;
        message += ` Total Items: *${picklist.reduce((acc, item) => acc + item.orderQty, 0)}*\n`;
        message += `--------------------------------\n`;

        // 2. Add Rows (Condensed for Chat)
        picklist.forEach(item => {
            const statusIcon = item.status === 'READY' ? '' : '';
            message += `${statusIcon} *${item.location || 'NO LOC'}* : ${item.sku}\n`;
            message += `   └ Qty: *${item.orderQty}* | ${item.variantDetails || ''}\n\n`;
        });

        // 3. Open WhatsApp
        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="container-fluid p-0">
            
            {/* --- HEADER --- */}
            <div className="d-flex justify-content-between align-items-center mb-4 d-print-none">
                <div>
                    <h3 className="fw-bold mb-0">Daily Picklist</h3>
                    <div className="text-muted small">Optimized walking path based on location.</div>
                </div>
                {picklist.length > 0 && (
                    <div className="d-flex gap-2">
                        <button className="btn btn-outline-danger" onClick={() => window.location.reload()}>
                            <i className="bi bi-trash"></i>
                        </button>
                        {/* WhatsApp Button */}
                        <button className="btn btn-success" onClick={handleWhatsAppShare}>
                            <i className="bi bi-whatsapp me-2"></i> Share
                        </button>
                        <button className="btn btn-dark px-4" onClick={() => window.print()}>
                            <i className="bi bi-printer me-2"></i> Print
                        </button>
                    </div>
                )}
            </div>

            {/* --- UPLOAD BOX --- */}
            {picklist.length === 0 && (
                <div className="custom-card p-5 mb-4 d-print-none text-center">
                    <div className="border rounded p-5 bg-light mx-auto" style={{maxWidth: '600px', borderStyle: 'dashed'}}>
                        <i className="bi bi-file-earmark-spreadsheet fs-1 text-primary mb-3"></i>
                        <h5 className="fw-bold">Generate Picklist</h5>
                        
                        {/* 1. CHANNEL SELECTION */}
                        <div className="mb-3 text-start">
                            <label className="form-label small fw-bold text-muted">Select Sales Channel</label>
                            <select 
                                className="form-select" 
                                value={channel} 
                                onChange={(e) => setChannel(e.target.value)}
                            >
                                <option value="Flipkart">Flipkart</option>
                                <option value="Amazon">Amazon-Cocoblu</option>
                                <option value="Amazon">Amazon</option>
                                <option value="Meesho">Meesho</option>
                                <option value="Meesho">Myntra</option>
                                <option value="Meesho">Ajio</option>
                                <option value="Website">My Website</option>
                                <option value="B2B">Wholesale / B2B</option>
                                <option value="B2B">Other</option>
                            </select>
                        </div>

                        {/* 2. FILE UPLOAD */}
                        <div className="mb-4 text-start">
                            <label className="form-label small fw-bold text-muted">Upload Order Report (.csv / .xlsx)</label>
                            <input type="file" className="form-control" onChange={handleFileChange} accept=".csv, .xlsx, .xls" />
                        </div>
                        
                        <button className="btn btn-primary w-100" onClick={handleGenerate} disabled={loading}>
                            {loading ? "Processing..." : "Generate Picklist"}
                        </button>

                        {error && <div className="alert alert-danger mt-3 small">{error}</div>}
                    </div>
                </div>
            )}

            {/* --- RESULTS TABLE --- */}
            {picklist.length > 0 && (
                <div className="card border-0 shadow-sm">
                    {/* Print Header with Channel Name */}
                    <div className="d-none d-print-flex p-4 pb-0 justify-content-between align-items-end">
                        <div>
                            {/* DYNAMIC CHANNEL NAME */}
                            <h2 className="fw-bold mb-0 text-uppercase">{channel} PICKLIST</h2>
                            <div className="small">Date: {new Date().toLocaleString()}</div>
                        </div>
                        <div className="text-end">
                            <h1>Total Items: {picklist.reduce((acc, item) => acc + item.orderQty, 0)}</h1>
                        </div>
                    </div>

                    <div className="table-responsive mt-3">
                        <table className="table table-bordered align-middle mb-0" style={{borderColor: '#dee2e6'}}>
                            <thead className="table-dark">
                                <tr className="text-uppercase small">
                                    <th style={{width: '15%'}} className="text-center">Loc</th>
                                    <th style={{width: '10%'}} className="text-center">Img</th>
                                    <th style={{width: '25%'}}>SKU / Variant</th>
                                    <th style={{width: '30%'}}>Product Name</th>
                                    <th style={{width: '10%'}} className="text-center">QTY</th>
                                    <th style={{width: '10%'}} className="text-center">Check</th>
                                </tr>
                            </thead>
                            <tbody>
                                {picklist.map((item, index) => (
                                    <tr key={index} style={{height: '60px'}}>
                                        
                                        <td className="text-center bg-light">
                                            <div className="fw-bold fs-5 text-dark no-wrap-data">
                                                {item.location || "N/A"}
                                            </div>
                                        </td>

                                        <td className="text-center">
                                            <div className="img-box-fixed mx-auto">
                                                {getImageUrl(item.imageUrl) ? (
                                                    <img src={getImageUrl(item.imageUrl)} alt="" className="img-fixed" />
                                                ) : <span className="text-muted small">No Img</span>}
                                            </div>
                                        </td>

                                        <td>
                                            <div className="fw-bold text-primary font-monospace no-wrap-data" style={{fontSize: '0.95rem'}}>
                                                {item.sku}
                                            </div>
                                            <div className="mt-1">
                                                {formatVariant(item.variantDetails)}
                                            </div>
                                        </td>

                                        <td>
                                            <div className="product-name-truncate text-muted small" title={item.productName}>
                                                {item.productName}
                                            </div>
                                            {item.status !== 'READY' && (
                                                <div className="d-block mt-1">
                                                    {item.status === 'OUT_OF_STOCK' && <span className="badge bg-danger">Short: {item.stockAvailable}</span>}
                                                    {item.status === 'SKU_MISMATCH' && <span className="badge bg-warning text-dark">Unknown SKU</span>}
                                                </div>
                                            )}
                                        </td>

                                        <td className="text-center">
                                            <span className="badge bg-dark fs-4 rounded-3 px-3">
                                                {item.orderQty}
                                            </span>
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