import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const ScanPack = () => {
    // --- STATE ---
    const [session, setSession] = useState({
        staffName: "",
        channel: "",
        courierPartner: "",
        brandName: "Thalasi"
    });
    const [options, setOptions] = useState({ staff: [], channel: [], courier: [] });
    const [isSessionActive, setIsSessionActive] = useState(false);
    
    // Scan State
    const [barcodes, setBarcodes] = useState({ vCode: "", hCode: "" });
    const [lastOrder, setLastOrder] = useState(null); 
    const [scanStatus, setScanStatus] = useState("IDLE"); 
    const [errorMessage, setErrorMessage] = useState("");
    const [scanHistory, setScanHistory] = useState([]); 

    const vInputRef = useRef(null);
    const hInputRef = useRef(null);

    // --- LOGIC ---
    useEffect(() => { loadOptions(); }, []);

    const loadOptions = async () => {
        try {
            const [staffRes, channelRes, courierRes] = await Promise.all([
                axios.get("http://localhost:8080/api/config/STAFF"),
                axios.get("http://localhost:8080/api/config/CHANNEL"),
                axios.get("http://localhost:8080/api/config/COURIER")
            ]);
            setOptions({ staff: staffRes.data, channel: channelRes.data, courier: courierRes.data });
            if(staffRes.data.length > 0) setSession(prev => ({...prev, staffName: staffRes.data[0].value}));
            if(channelRes.data.length > 0) setSession(prev => ({...prev, channel: channelRes.data[0].value}));
            if(courierRes.data.length > 0) setSession(prev => ({...prev, courierPartner: courierRes.data[0].value}));
        } catch (err) { console.error("Config Load Error", err); }
    };

    const handleAddOption = async (category, keyInState) => {
        const newValue = prompt(`Enter new ${category.toLowerCase()} name:`);
        if (!newValue) return;
        try {
            const res = await axios.post("http://localhost:8080/api/config/add", { category, value: newValue });
            setOptions(prev => ({ ...prev, [keyInState]: [...prev[keyInState], res.data] }));
            const sessionKey = category === 'STAFF' ? 'staffName' : category === 'CHANNEL' ? 'channel' : 'courierPartner';
            setSession(prev => ({...prev, [sessionKey]: newValue}));
        } catch (error) { alert("Failed to add."); }
    };

    const playSound = (type) => {
        const audio = new Audio(type === 'success' ? '/sounds/beep.mp3' : '/sounds/error.mp3');
        audio.play().catch(e => {});
    };

    const startSession = () => {
        if(!session.staffName || !session.channel) return alert("Please fill all details");
        setIsSessionActive(true);
        // Force focus on start
        setTimeout(() => vInputRef.current?.focus(), 100);
    };

    const handleKeyPress = (e, field) => {
        if (e.key === 'Enter') {
            if (field === 'vCode') hInputRef.current?.focus();
            else if (field === 'hCode') submitScan();
        }
    };

    // --- AUTO RESET HELPER ---
    const triggerAutoReset = (delay) => {
        setTimeout(() => {
            setScanStatus("IDLE");
            setBarcodes({ vCode: "", hCode: "" });
            // CRITICAL: Force focus back to start so scanner works immediately
            setTimeout(() => vInputRef.current?.focus(), 50); 
        }, delay);
    };

    const submitScan = async () => {
        if (!barcodes.vCode || !barcodes.hCode) return;
        
        setScanStatus("LOADING");
        const payload = { ...session, verticalBarcode: barcodes.vCode, horizontalBarcode: barcodes.hCode };

        try {
            const res = await axios.post("http://localhost:8080/api/dispatch/scan", payload);
            
            // 1. Success State
            setScanStatus("SUCCESS");
            playSound('success');
            
            // Handle Data
            const responseData = Array.isArray(res.data) ? res.data : [res.data];
            setLastOrder(responseData); 

            // Update Log
            const newLogs = responseData.map(item => ({
                time: new Date().toLocaleTimeString(),
                id: item.orderId || "Unknown ID",
                sku: item.sku
            }));
            setScanHistory(prev => [...newLogs, ...prev].slice(0, 12));

            // 2. HANDS-FREE RESET (Fast: 1 second)
            triggerAutoReset(1000);

        } catch (error) {
            // 1. Error State
            setScanStatus("ERROR");
            playSound('error');
            setErrorMessage(error.response?.data || "Scan Failed");
            
            // 2. HANDS-FREE RESET (Slower: 2.5 seconds to read error)
            triggerAutoReset(2500);
        }
    };

    // --- UI ---
    return (
        <div className="scan-page-bg">
            
            <div className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom border-secondary">
                <div className="d-flex align-items-center gap-3">
                    <div className="bg-success rounded-circle" style={{width: 10, height: 10}}></div>
                    <span className="fw-bold text-white tracking-wide">SCAN STATION</span>
                    <button className="btn btn-outline-light btn-sm" onClick={() => window.location.href='/dispatch/logs'}>
                       <i className="bi bi-clock-history me-1"></i> View Logs
                    </button>
                </div>
                {isSessionActive && (
                    <div className="d-flex gap-3">
                        <span className="cyber-badge">{session.staffName}</span>
                        <span className="cyber-badge">{session.channel}</span>
                        <span className="cyber-badge">{session.courierPartner}</span>
                        <button className="btn btn-sm btn-outline-danger ms-3" onClick={() => setIsSessionActive(false)}>End Session</button>
                    </div>
                )}
            </div>

            <div className="container-fluid flex-grow-1 d-flex align-items-center justify-content-center p-4">
                
                {/* SETUP CARD */}
                {!isSessionActive && (
                    <div className="scan-card p-5" style={{width: '100%', maxWidth: '500px'}}>
                        <div className="text-center mb-4">
                            <div className="bg-dark rounded-circle d-inline-flex p-3 mb-3 border border-secondary">
                                <i className="bi bi-gear-wide-connected text-success fs-1"></i>
                            </div>
                            <h3 className="fw-bold">Dispatch Station</h3>
                            <p className="text small">Select your parameters to begin packing.</p>
                        </div>
                        <div className="d-flex flex-column gap-3">
                            <div className="input-group">
                                <select className="form-select bg-dark text-white border-secondary" value={session.staffName} onChange={e => setSession({...session, staffName: e.target.value})}>
                                    <option value="">Select Staff</option>
                                    {options.staff.map(o => <option key={o.id} value={o.value}>{o.value}</option>)}
                                </select>
                                <button className="btn btn-outline-secondary" onClick={() => handleAddOption('STAFF', 'staff')}><i className="bi bi-plus-lg"></i></button>
                            </div>
                            <div className="input-group">
                                <select className="form-select bg-dark text-white border-secondary" value={session.channel} onChange={e => setSession({...session, channel: e.target.value})}>
                                    <option value="">Select Channel</option>
                                    {options.channel.map(o => <option key={o.id} value={o.value}>{o.value}</option>)}
                                </select>
                                <button className="btn btn-outline-secondary" onClick={() => handleAddOption('CHANNEL', 'channel')}><i className="bi bi-plus-lg"></i></button>
                            </div>
                            <div className="input-group">
                                <select className="form-select bg-dark text-white border-secondary" value={session.courierPartner} onChange={e => setSession({...session, courierPartner: e.target.value})}>
                                    <option value="">Select Courier</option>
                                    {options.courier.map(o => <option key={o.id} value={o.value}>{o.value}</option>)}
                                </select>
                                <button className="btn btn-outline-secondary" onClick={() => handleAddOption('COURIER', 'courier')}><i className="bi bi-plus-lg"></i></button>
                            </div>
                            <button className="btn btn-success fw-bold py-3 mt-2" onClick={startSession}>INITIALIZE SYSTEM</button>
                        </div>
                    </div>
                )}

                {/* SCANNER INTERFACE */}
                {isSessionActive && (
                    <div className="row w-100" style={{maxWidth: '1200px'}}>
                        
                        <div className="col-lg-7 mb-4 mb-lg-0">
                            <div className={`scan-card h-100 p-5 d-flex flex-column justify-content-center position-relative ${scanStatus !== 'IDLE' ? 'active-glow' : ''}`}>
                                
                                {/* SUCCESS OVERLAY (Hands Free) */}
                                {scanStatus === 'SUCCESS' && (
                                    <div className="status-overlay">
                                        <div className="animate__animated animate__zoomIn w-100 text-center">
                                            <h1 className="display-4 fw-bold text-success mb-0">SUCCESS</h1>
                                            
                                            {Array.isArray(lastOrder) && lastOrder.length > 1 ? (
                                                <div className="mt-3">
                                                    <div className="badge bg-warning text-dark mb-2 fs-5">⚠️ MULTI-ITEM ({lastOrder.length})</div>
                                                    <div className="text-start mx-auto" style={{maxWidth: '80%'}}>
                                                        <ul className="list-group list-group-flush rounded">
                                                            {lastOrder.map((item, idx) => (
                                                                <li key={idx} className="list-group-item bg-dark text-white border-secondary d-flex justify-content-between">
                                                                    <span className="font-monospace text-success">{item.sku}</span>
                                                                    <span className="small text-muted">{item.orderId}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="fs-4 mt-2 text-white font-monospace">{Array.isArray(lastOrder) ? lastOrder[0].sku : lastOrder?.sku}</div>
                                                    <div className="small text-muted">{Array.isArray(lastOrder) ? lastOrder[0].orderId : lastOrder?.orderId}</div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ERROR OVERLAY (Hands Free) */}
                                {scanStatus === 'ERROR' && (
                                    <div className="status-overlay">
                                        <div className="animate__animated animate__shakeX text-center">
                                            <div className="bg-danger rounded-circle p-4 mb-3 d-inline-block">
                                                <i className="bi bi-x-lg fs-1 text-white"></i>
                                            </div>
                                            <h2 className="text-white fw-bold">ERROR</h2>
                                            <p className="text-danger font-monospace px-4">{errorMessage}</p>
                                        </div>
                                    </div>
                                )}

                                {/* INPUTS */}
                                <div className="text-center mb-5">
                                    <h5 className="text-success fw-normal letter-spacing-2">SCAN WORKFLOW</h5>
                                </div>
                                <div className="mb-4">
                                    <label className="text-success small fw-bold mb-2">1. TRACKING ID (VERTICAL)</label>
                                    <input ref={vInputRef} type="text" className="scan-input" placeholder="Scan..." value={barcodes.vCode} onChange={e => setBarcodes({...barcodes, vCode: e.target.value})} onKeyDown={e => handleKeyPress(e, 'vCode')} autoComplete="off" />
                                </div>
                                <div>
                                    <label className="text-success small fw-bold mb-2">2. ORDER ID (HORIZONTAL)</label>
                                    <input ref={hInputRef} type="text" className="scan-input" placeholder="Waiting..." value={barcodes.hCode} onChange={e => setBarcodes({...barcodes, hCode: e.target.value})} onKeyDown={e => handleKeyPress(e, 'hCode')} autoComplete="off" />
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-5">
                            <div className="scan-card h-100 p-4">
                                <h6 className="text-success border-bottom border-secondary pb-3 mb-3 d-flex justify-content-between">
                                    <span>LIVE ACTIVITY LOG</span>
                                    <span className="text-success">• Online</span>
                                </h6>
                                <div className="d-flex flex-column gap-2" style={{maxHeight: '400px', overflowY: 'auto'}}>
                                    {scanHistory.length === 0 && <div className="text-center text-muted mt-5 opacity-50">Waiting for scans...</div>}
                                    {scanHistory.map((log, i) => (
                                        <div key={i} className="scan-log-item success d-flex justify-content-between align-items-center animate__animated animate__fadeInRight">
                                            <div><div className="fw-bold text-white font-monospace">{log.sku}</div><div className="small text-muted" style={{fontSize: '11px'}}>{log.id}</div></div>
                                            <div className="text-secondary small font-monospace">{log.time}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default ScanPack;