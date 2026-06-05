import { useState, useRef, useEffect } from 'react';
import apiClient from './apiClient';
import { useNavigate } from 'react-router-dom';

const ReturnsInward = () => {
    const navigate = useNavigate();
    
    // --- SESSION STATE ---
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [session, setSession] = useState({
        staffName: "",
        channel: "",
        courierPartner: ""
    });
    const [options, setOptions] = useState({ staff: [], channel: [], courier: [] });

    // --- OPERATIONAL STATE ---
    const [trackingInput, setTrackingInput] = useState("");
    
    // NEW: Multi-Item Handling
    const [foundOrders, setFoundOrders] = useState([]); // List of items found
    const [activeOrder, setActiveOrder] = useState(null); // The specific item selected
    
    // NEW: External Order Handling
    const [isExternal, setIsExternal] = useState(false);
    const [manualSku, setManualSku] = useState("");

    const [step, setStep] = useState(1);
    const [returnType, setReturnType] = useState(""); 
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedReason, setSelectedReason] = useState("");
    const [qcResult, setQcResult] = useState(""); 
    const [loading, setLoading] = useState(false);

    // Load Configs on Mount
    useEffect(() => {
        const loadConfigs = async () => {
            try {
                const [s, c, cp] = await Promise.all([
                    apiClient.get("/api/config/STAFF"),
                    apiClient.get("/api/config/CHANNEL"),
                    apiClient.get("/api/config/COURIER")
                ]);
                setOptions({ staff: s.data, channel: c.data, courier: cp.data });
                // Defaults
                if(s.data.length) setSession(p =>({...p, staffName: s.data[0].value}));
                if(c.data.length) setSession(p =>({...p, channel: c.data[0].value}));
                if(cp.data.length) setSession(p =>({...p, courierPartner: cp.data[0].value}));
            } catch(e) { console.error(e); }
        };
        loadConfigs();
    }, []);

    // Session Start
    const startSession = () => {
        if(!session.staffName) return alert("Select Staff");
        setIsSessionActive(true);
    };

    // --- HANDLERS (Scan & Process) ---
    const handleScan = async (e) => {
        if (e.key === 'Enter') {
            setLoading(true);
            setFoundOrders([]);
            setActiveOrder(null);
            setIsExternal(false);
            setManualSku("");

            try {
                const res = await apiClient.get(`/api/orders/search?query=${trackingInput}`);
                
                if (res.data && res.data.length > 0) {
                    setFoundOrders(res.data);
                    
                    // Logic: If only 1 item found, auto-select it. If >1, show selection list.
                    if (res.data.length === 1) {
                        setActiveOrder(res.data[0]);
                        setStep(1);
                    }
                } else {
                    // Not Found -> Prompt for External
                    if(confirm("❌ Order not found in Database.\n\nDo you want to process this as an EXTERNAL RETURN?")) {
                        setIsExternal(true);
                        setActiveOrder({
                            productName: "EXTERNAL / MANUAL RETURN",
                            sku: "UNKNOWN",
                            orderId: "N/A",
                            channel: "EXTERNAL",
                            quantity: 1,
                            imageUrl: null
                        });
                        setStep(1);
                    }
                }
            } catch (err) { alert("Error searching order"); } 
            finally { setLoading(false); }
        }
    };

    const handleProcess = async () => {
        const isGood = returnType === 'COURIER_RETURN' ? true : (qcResult === 'PASS');
        
        // Use Manual SKU if external, otherwise DB SKU
        const finalSku = isExternal ? manualSku : activeOrder.sku;
        if(isExternal && !manualSku) return alert("Please enter SKU for external order");

        const payload = {
            trackingId: isExternal ? "EXT-" + Date.now() : (activeOrder.trackingId || trackingInput), 
            sku: finalSku,
            quantity: 1, // Default 1
            isExternalOrder: isExternal,

            returnType: returnType,
            returnMainReason: returnType === 'COURIER_RETURN' ? 'RTO' : selectedCategory,
            returnSubReason: returnType === 'COURIER_RETURN' ? 'Auto' : selectedReason,
            isGoodCondition: isGood,
            
            // USE SESSION DATA
            staffName: session.staffName,
            returnChannel: session.channel,
            courierPartner: session.courierPartner
        };

        try {
            await apiClient.post("/api/returns/inward", payload);
            alert(`✅ Return Processed: ${isGood ? 'Restocked' : 'Scrapped'}`);
            // Reset for next item
            setActiveOrder(null);
            setFoundOrders([]);
            setTrackingInput("");
            setStep(1);
            setReturnType("");
            setSelectedCategory("");
            setQcResult("");
            setIsExternal(false);
            setManualSku("");
        } catch (error) {
            alert("Processing Failed: " + (error.response?.data || error.message));
        }
    };

    const reasonsMap = {
        "Size/Fit": ["Too Small", "Too Large", "Fit Issue"],
        "Quality": ["Fabric Defect", "Stitching Open", "Faded"],
        "Wrong Item": ["Wrong Color", "Wrong Brand", "Wrong Size Tag"],
        "Damaged": ["Torn", "Stained", "Used Condition"]
    };

    const getImageUrl = (path) => path?.startsWith('http') ? path : `${apiClient.defaults.baseURL}/${path}`;

    // --- RENDER ---
    return (
        <div className="scan-page-bg" style={{height: '100vh', overflow: 'hidden'}}>
            
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom border-secondary">
                <div className="d-flex align-items-center gap-3">
                    <div className="bg-warning rounded-circle" style={{width: 10, height: 10}}></div>
                    <span className="fw-bold text-white tracking-wide">RMA STATION</span>
                    <button className="btn btn-outline-light btn-sm" onClick={() => navigate('/returns/logs')}>
                        <i className="bi bi-clock-history me-1"></i> View Logs
                    </button>
                </div>
                {isSessionActive && (
                    <div className="d-flex gap-3">
                        <span className="cyber-badge">{session.staffName}</span>
                        <span className="cyber-badge">{session.courierPartner}</span>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => setIsSessionActive(false)}>End Session</button>
                    </div>
                )}
            </div>

            {/* SETUP SCREEN */}
            {!isSessionActive && (
                <div className="d-flex align-items-center justify-content-center h-100">
                    <div className="scan-card p-5" style={{width: '500px'}}>
                        <h4 className="text-center mb-4">Configure RMA Station</h4>
                        
                        <div className="mb-3">
                            <label className="fw-bold">Staff</label>
                            <select className="form-select bg-dark text-white border-secondary" value={session.staffName} onChange={e => setSession({...session, staffName: e.target.value})}>
                                <option value="">Select...</option>
                                {options.staff.map(o => <option key={o.id} value={o.value}>{o.value}</option>)}
                            </select>
                        </div>
                        <div className="mb-3">
                            <label className="fw-bold">Channel (Source)</label>
                            <select className="form-select bg-dark text-white border-secondary" value={session.channel} onChange={e => setSession({...session, channel: e.target.value})}>
                                <option value="">Select...</option>
                                {options.channel.map(o => <option key={o.id} value={o.value}>{o.value}</option>)}
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="fw-bold">Courier (Reverse)</label>
                            <select className="form-select bg-dark text-white border-secondary" value={session.courierPartner} onChange={e => setSession({...session, courierPartner: e.target.value})}>
                                <option value="">Select...</option>
                                {options.courier.map(o => <option key={o.id} value={o.value}>{o.value}</option>)}
                            </select>
                        </div>
                        <button className="btn btn-success w-100 py-3 fw-bold" onClick={startSession}>START RETURNS</button>
                    </div>
                </div>
            )}

            {/* MAIN INTERFACE (Only when Session Active) */}
            {isSessionActive && (
                <div className="container-fluid h-100 p-4">
                    <div className="row h-100">
                        {/* LEFT: SCAN & DETAILS */}
                        <div className="col-md-5 d-flex flex-column gap-5">
                            
                            {/* SCANNER */}
                            {(!activeOrder && foundOrders.length === 0) && (
                                <div className="scan-card p-5 mt-5">
                                    <label className="text-success small fw-bold mb-2">SCAN TRACKING ID</label>
                                    <input type="text" className="scan-input text-center" placeholder="Waiting..." value={trackingInput} onChange={e => setTrackingInput(e.target.value)} onKeyDown={handleScan} autoFocus />
                                    {loading && <div className="text-center text-success mt-2">Searching...</div>}
                                </div>
                            )}

                            {/* MULTI-ITEM SELECTION (New Feature) */}
                            {foundOrders.length > 1 && !activeOrder && (
                                <div className="scan-card p-4 h-100 overflow-auto">
                                    <h5 className="text-white mb-3">Select Item to Return</h5>
                                    <div className="d-flex flex-column gap-2">
                                        {foundOrders.map(order => (
                                            <div key={order.id} className="p-3 rounded border border-secondary bg-dark d-flex gap-3 align-items-center"
                                                 onClick={() => { setActiveOrder(order); setStep(1); }}
                                                 style={{cursor: 'pointer'}}
                                            >
                                                <img src={getImageUrl(order.imageUrl)} style={{width: 50, height: 50, objectFit: 'cover'}} className="rounded" />
                                                <div>
                                                    <div className="fw-bold text-white small">{order.sku}</div>
                                                    <div className="text-data small">{order.productName}</div>
                                                </div>
                                                <button className="btn btn-sm btn-outline-success ms-auto">Select</button>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="btn btn-outline-danger w-100 mt-3" onClick={() => {setFoundOrders([]); setTrackingInput("");}}>Cancel</button>
                                </div>
                            )}

                            {/* DETAILS CARD (Same as before but using activeOrder) */}
                            {activeOrder && (
                                <div className="scan-card rma-product-card flex-grow-1 animate__animated animate__fadeInLeft h-100 d-flex flex-column">
                                    <div className="text-center mb-3">
                                        <div className="bg-dark d-inline-flex p-2 rounded border border-secondary">
                                            {activeOrder.imageUrl ? (
                                                <img src={getImageUrl(activeOrder.imageUrl)} style={{height: '200px', objectFit: 'contain'}} />
                                            ) : (
                                                <div className="text-white p-5"><i className="bi bi-box fs-1"></i></div>
                                            )}
                                        </div>
                                    </div>
                                    <h5 className="text-white fw-bold text-center">{activeOrder.productName}</h5>
                                    
                                    {/* EXTERNAL SKU INPUT (New Feature) */}
                                    {isExternal ? (
                                        <div className="mt-4">
                                            <label className="text-warning small fw-bold mb-1">ENTER SKU MANUALLY (REQUIRED)</label>
                                            <input 
                                                type="text" 
                                                className="form-control bg-dark text-white border-warning text-center fw-bold" 
                                                value={manualSku} 
                                                onChange={e=>setManualSku(e.target.value)} 
                                                placeholder="e.g. SHIRT-RED-S" 
                                                autoFocus
                                            />
                                            <div className="text-data small mt-2">This will be added to stock if QC passes.</div>
                                        </div>
                                    ) : (
                                        <div className="row mt-4 g-3 text-center">
                                            <div className="col-6"><div className="text-data small">SKU</div><div className="text-warning">{activeOrder.sku}</div></div>
                                            <div className="col-6"><div className="text-data small">ID</div><div className="text-info">{activeOrder.orderId}</div></div>
                                            <div className="col-6"><div className="text-data small">CUSTOMER NAME</div><div className="text-warning">{activeOrder.customerName}</div></div>
                                            <div className="col-6"><div className="text-data small">CHANNEL</div><div className="text-info">{activeOrder.channel}</div></div>
                                            <div className="col-6"><div className="text-data small">QTY</div><div className="text-warning">{activeOrder.quantity}</div></div>
                                            <div className="col-6"><div className="text-data small">AMOUNT</div><div className="text-info">{activeOrder.productPayment}</div></div>
                                        </div>
                                    )}
                                    
                                    <button className="btn btn-outline-danger mt-auto" onClick={() => {setActiveOrder(null); setFoundOrders([]); setTrackingInput(""); setIsExternal(false);}}>Cancel Scan</button>
                                </div>
                            )}
                        </div>

                        {/* RIGHT: QC WORKFLOW (Unchanged UI) */}
                        <div className="col-md-7">
                            {activeOrder && (
                                <div className="scan-card h-100 p-5 animate__animated animate__fadeInRight">
                                    
                                    {step === 1 && (
                                        <div className="row g-4 mt-5">
                                            <div className="col-6"><div className={`qc-tile ${returnType==='COURIER_RETURN'?'active':''}`} onClick={()=>{setReturnType('COURIER_RETURN'); setStep(3); setQcResult('PASS');}}><i className="bi bi-truck fs-1"></i><h5>RTO</h5></div></div>
                                            <div className="col-6"><div className={`qc-tile ${returnType==='CUSTOMER_RETURN'?'active':''}`} onClick={()=>{setReturnType('CUSTOMER_RETURN'); setStep(2);}}><i className="bi bi-person-x fs-1"></i><h5>Customer</h5></div></div>
                                        </div>
                                    )}

                                    {step === 2 && (
                                        <div className="mt-4">
                                            <h5>Select Issue</h5>
                                            <div className="row g-3">
                                                {Object.keys(reasonsMap).map(r=><div className="col-4" key={r}><div className={`qc-tile p-2 ${selectedCategory===r?'active':''}`} onClick={()=>setSelectedCategory(r)}>{r}</div></div>)}
                                            </div>
                                            {selectedCategory && (
                                                <div className="mt-3 d-flex flex-wrap gap-2">
                                                    {reasonsMap[selectedCategory].map(sr=><button className={`btn ${selectedReason===sr?'btn-success':'btn-outline-secondary'} btn-sm`} onClick={()=>{setSelectedReason(sr); setStep(3);}} key={sr}>{sr}</button>)}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {step === 3 && (
                                        <div className="text-center mt-5">
                                            {returnType === 'CUSTOMER_RETURN' && (
                                                <div className="row g-4 mb-4">
                                                    <div className="col-6"><div className={`qc-tile ${qcResult==='PASS'?'active':''}`} onClick={()=>setQcResult('PASS')}><i className="bi bi-check-lg fs-1 text-success"></i><h5>PASS</h5></div></div>
                                                    <div className="col-6"><div className={`qc-tile danger ${qcResult==='FAIL'?'active':''}`} onClick={()=>setQcResult('FAIL')}><i className="bi bi-x-lg fs-1 text-danger"></i><h5>FAIL</h5></div></div>
                                                </div>
                                            )}
                                            <button className="btn btn-success btn-lg w-100" onClick={handleProcess}>CONFIRM & SAVE</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReturnsInward;