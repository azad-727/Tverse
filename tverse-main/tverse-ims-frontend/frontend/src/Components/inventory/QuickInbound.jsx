import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const QuickInbound = () => {
    const [skuInput, setSkuInput] = useState("");
    const [scannedProduct, setScannedProduct] = useState(null);
    const [qty, setQty] = useState(1);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]); // Recent scans

    const skuInputRef = useRef(null);

    // Auto-focus input for scanner
    useEffect(() => {
        skuInputRef.current?.focus();
    }, [scannedProduct]);

    const handleScan = async (e) => {
        if (e.key === 'Enter') {
            // Fetch Product by SKU
            try {
                // We need a specific endpoint to find by SKU exactly
                // Assuming you have a way to search, or we use the List API and filter
                // For efficiency, let's assume we create a quick search endpoint later.
                // For now, let's simulate or use the existing list logic if you prefer.
                
                // Let's assume we call the detail endpoint we made earlier, but we need Variant ID.
                // We actually need a "Get By SKU" endpoint. Let's add that to backend next.
                const res = await axios.get(`http://192.168.31.84:8080/api/catalog/search?sku=${skuInput}`);
                if(res.data) {
                    setScannedProduct(res.data);
                    setSkuInput(""); // Clear for quantity entry
                }
            } catch (err) {
                alert("Product not found!");
                setSkuInput("");
            }
        }
    };

    const handleSubmitStock = async (operation) => {
        if (!scannedProduct) return;
        
        setLoading(true);
        try {
            const payload = {
                variantId: scannedProduct.variantId,
                quantity: parseInt(qty),
                operation: operation, // "ADD" or "DEDUCT"
                reason: "Quick Scanner " + operation,
                performedBy: "ScannerUser"
            };

            await axios.post("http://192.168.31.84:8080/api/inventory/adjust", payload);
            
            // Add to local history log
            setHistory([{
                sku: scannedProduct.sku,
                name: scannedProduct.productName,
                qty: operation === "ADD" ? `+${qty}` : `-${qty}`,
                time: new Date().toLocaleTimeString()
            }, ...history]);

            // Reset
            setScannedProduct(null);
            setQty(1);
            skuInputRef.current?.focus(); // Ready for next scan

        } catch (error) {
            alert("Update Failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="row">
            <div className="col-md-6">
                <div className="card bg-light border-0 p-4 text-center">
                    <i className="bi bi-upc-scan fs-1 text-muted mb-3"></i>
                    <h5>Scan Barcode</h5>
                    <p className="text-muted small">Place cursor here and scan product.</p>
                    
                    <input 
                        type="text" 
                        className="form-control form-control-lg text-center fw-bold text-uppercase" 
                        placeholder="Scan SKU..."
                        value={skuInput}
                        onChange={(e) => setSkuInput(e.target.value)}
                        onKeyDown={handleScan}
                        ref={skuInputRef}
                        autoFocus
                    />
                </div>

                {scannedProduct && (
                    <div className="card mt-3 border-success border-2 shadow-sm animate__animated animate__pulse">
                        <div className="card-body text-center">
                            <h4 className="fw-bold text-success">{scannedProduct.sku}</h4>
                            <p>{scannedProduct.productName}</p>
                            <p className="badge bg-secondary">{scannedProduct.size} | {scannedProduct.color}</p>
                            <hr />
                            
                            <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
                                <label className="fw-bold">Qty:</label>
                                <input 
                                    type="number" 
                                    className="form-control text-center" 
                                    style={{width: '80px'}} 
                                    value={qty} 
                                    onChange={(e) => setQty(e.target.value)} 
                                />
                            </div>

                            <div className="d-flex gap-2">
                                <button className="btn btn-success flex-grow-1" onClick={() => handleSubmitStock("ADD")}>
                                    <i className="bi bi-plus-lg"></i> INBOUND
                                </button>
                                <button className="btn btn-danger flex-grow-1" onClick={() => handleSubmitStock("DEDUCT")}>
                                    <i className="bi bi-dash-lg"></i> REMOVE
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="col-md-6">
                <h6 className="fw-bold text-muted">Recent Scans</h6>
                <ul className="list-group">
                    {history.map((h, i) => (
                        <li key={i} className="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <span className="fw-bold d-block">{h.sku}</span>
                                <small className="text-muted">{h.name}</small>
                            </div>
                            <span className={`badge ${h.qty.includes('+') ? 'bg-success' : 'bg-danger'} rounded-pill`}>{h.qty}</span>
                        </li>
                    ))}
                    {history.length === 0 && <li className="list-group-item text-center text-muted">No scans yet</li>}
                </ul>
            </div>
        </div>
    );
};

export default QuickInbound;