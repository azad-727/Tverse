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
    const [scanStatus, setScanStatus] = useState("IDLE"); // IDLE, LOADING, SUCCESS, ERROR
    const [errorMessage, setErrorMessage] = useState("");
    const [scanHistory, setScanHistory] = useState([]); 

    const vInputRef = useRef(null);
    const hInputRef = useRef(null);

    // --- LOGIC (Kept same as before) ---
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
        setTimeout(() => vInputRef.current?.focus(), 100);
    };

    const handleKeyPress = (e, field) => {
        if (e.key === 'Enter') {
            if (field === 'vCode') hInputRef.current?.focus();
            else if (field === 'hCode') submitScan();
        }
    };

    const submitScan = async () => {
        if (!barcodes.vCode || !barcodes.hCode) return;
        setScanStatus("LOADING");
        const payload = { ...session, verticalBarcode: barcodes.vCode, horizontalBarcode: barcodes.hCode };

        try {
            const res = await axios.post("http://localhost:8080/api/dispatch/scan", payload);
            setScanStatus("SUCCESS");
            playSound('success');
            setLastOrder(res.data);
            setScanHistory(prev => [{ time: new Date().toLocaleTimeString(), id: res.data.orderId, sku: res.data.sku }, ...prev].slice(0, 8));
            setBarcodes({ vCode: "", hCode: "" });
            
            // Auto Reset after 1.5s
            setTimeout(() => {
                setScanStatus("IDLE");
                vInputRef.current?.focus();
            }, 1500);

        } catch (error) {
            setScanStatus("ERROR");
            playSound('error');
            setErrorMessage(error.response?.data || "Scan Failed");
            setBarcodes({ vCode: "", hCode: "" });
            
            // Auto Reset after 2s
            setTimeout(() => {
                setScanStatus("IDLE");
                vInputRef.current?.focus();
            }, 2500);
        }
    };

    // --- THE NEW UI DESIGN ---
    return (
        <div className="scan-page-bg">
            
            {/* Header / Session Bar */}
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
                
                {/* 1. SETUP CARD (If Session Not Active) */}
                {!isSessionActive && (
                    <div className="scan-card p-5" style={{width: '100%', maxWidth: '500px'}}>
                        <div className="text-center mb-4">
                            <div className="bg-dark rounded-circle d-inline-flex p-3 mb-3 border border-secondary">
                                <i className="bi bi-gear-wide-connected text-success fs-1"></i>
                            </div>
                            
                            <h3 className="fw-bold">Configure Station</h3>
                            <p className="text-muted small">Select your parameters to begin packing.</p>
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

                            <button className="btn btn-success fw-bold py-3 mt-2" onClick={startSession}>
                                INITIALIZE SYSTEM
                            </button>
                        </div>
                    </div>
                )}

                {/* 2. SCANNING INTERFACE (Split View) */}
                {isSessionActive && (
                    <div className="row w-100" style={{maxWidth: '1200px'}}>
                        
                        {/* LEFT: THE SCANNER */}
                        <div className="col-lg-7 mb-4 mb-lg-0">
                            <div className={`scan-card h-100 p-5 d-flex flex-column justify-content-center position-relative ${scanStatus !== 'IDLE' ? 'active-glow' : ''}`}>
                                
                                {/* Status Overlay (Success/Error) */}
                                {scanStatus === 'SUCCESS' && (
                                    <div className="status-overlay">
                                        <div className="bg-success rounded-circle p-4 mb-3 animate__animated animate__bounceIn">
                                            <i className="bi bi-check-lg fs-1 text-white"></i>
                                        </div>
                                        <h2 className="text-white fw-bold">DISPATCHED</h2>
                                        <p className="text-success font-monospace">{lastOrder?.sku}</p>
                                    </div>
                                )}

                                {scanStatus === 'ERROR' && (
                                    <div className="status-overlay">
                                        <div className="bg-danger rounded-circle p-4 mb-3 animate__animated animate__shakeX">
                                            <i className="bi bi-x-lg fs-1 text-white"></i>
                                        </div>
                                        <h2 className="text-white fw-bold">ERROR</h2>
                                        <p className="text-danger font-monospace text-center px-4">{errorMessage}</p>
                                    </div>
                                )}

                                {/* Inputs */}
                                <div className="text-center mb-5">
                                    <h5 className="text-muted fw-normal letter-spacing-2">SCAN WORKFLOW</h5>
                                </div>

                                <div className="mb-4">
                                    <label className="text-success small fw-bold mb-2">1. TRACKING ID (VERTICAL)</label>
                                    <input 
                                        ref={vInputRef}
                                        type="text" 
                                        className="scan-input"
                                        placeholder="Scan..."
                                        value={barcodes.vCode}
                                        onChange={e => setBarcodes({...barcodes, vCode: e.target.value})}
                                        onKeyDown={e => handleKeyPress(e, 'vCode')}
                                        autoComplete="off"
                                    />
                                </div>

                                <div>
                                    <label className="text-success small fw-bold mb-2">2. ORDER ID (HORIZONTAL)</label>
                                    <input 
                                        ref={hInputRef}
                                        type="text" 
                                        className="scan-input"
                                        placeholder="Waiting..."
                                        value={barcodes.hCode}
                                        onChange={e => setBarcodes({...barcodes, hCode: e.target.value})}
                                        onKeyDown={e => handleKeyPress(e, 'hCode')}
                                        autoComplete="off"
                                    />
                                </div>

                            </div>
                        </div>

                        {/* RIGHT: THE LIVE LOG */}
                        
                        <div className="col-lg-5">
                            <div className="scan-card h-100 p-4">
                                <h6 className="text-muted border-bottom border-secondary pb-3 mb-3 d-flex justify-content-between">
                                    <span>LIVE ACTIVITY LOG</span>
                                    <span className="text-success">• Online</span>
                                </h6>

                                <div className="d-flex flex-column gap-2" style={{maxHeight: '400px', overflowY: 'auto'}}>
                                    {scanHistory.length === 0 && <div className="text-center text-muted mt-5 opacity-50">Waiting for scans...</div>}
                                    
                                    {scanHistory.map((log, i) => (
                                        <div key={i} className="scan-log-item success d-flex justify-content-between align-items-center animate__animated animate__fadeInRight">
                                            <div>
                                                <div className="fw-bold text-white font-monospace">{log.sku}</div>
                                                <div className="small text-muted" style={{fontSize: '11px'}}>{log.id}</div>
                                            </div>
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