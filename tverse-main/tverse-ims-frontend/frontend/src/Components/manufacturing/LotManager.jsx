import { useState, useEffect } from 'react';
import apiClient from '../apiClient'; // ✅ Using production API client

const LotManager = () => {
    // --- STATE ---
    const [lots, setLots] = useState([]);
    const [fabrics, setFabrics] = useState([]);
    const [availableSkus, setAvailableSkus] = useState([]); // ✅ NEW: For SKU Autocomplete
    
    // UI Toggles
    const [showCreate, setShowCreate] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showFilter, setShowFilter] = useState(false);

    // Selection
    const [selectedLot, setSelectedLot] = useState(null); 
    const [editingLot, setEditingLot] = useState(null);   
    
    // Action State
    const [movingLot, setMovingLot] = useState(null);
    const [nextStatus, setNextStatus] = useState("");
    const [rejections, setRejections] = useState({});

    // Filter State
    const [filters, setFilters] = useState({
        status: "",
        startDateFrom: "",
        startDateTo: "",
        expDateFrom: "",
        expDateTo: ""
    });

    // Forms
    // ✅ NEW: Added totalPlannedQty, removed sizeInput
    const [newLot, setNewLot] = useState({ skuCode: "", fabricId: "", fabricUsedKgs: "", expectedDate: "", remarks: "", totalPlannedQty: "" });
    const [cutSizes, setCutSizes] = useState({ S: 0, M: 0, L: 0, XL: 0, XXL: 0 }); // ✅ NEW: For Cutting phase

    // ✅ FIXED WORKFLOW ORDER
    const STATUS_FLOW = ["NEW", "CUTTING", "PRINTING", "STITCHING", "FINISHING", "PACKING", "COMPLETED"];
    
    useEffect(() => { 
        fetchLots(); 
        fetchFabrics(); 
        fetchSkus(); 
    }, []);

    // --- API CALLS ---
    const fetchLots = async () => { 
        const params = new URLSearchParams(filters);
        for (const [key, value] of params.entries()) { if (!value) params.delete(key); }
        
        const url = params.toString() 
            ? `/api/manufacturing/lot/filter?${params.toString()}`
            : `/api/manufacturing/lots`;

        try {
            const res = await apiClient.get(url); 
            setLots(res.data);
        } catch(e) { console.error(e); }
    };
    
    const fetchFabrics = async () => { 
        try {
            const res = await apiClient.get("/api/manufacturing/fabrics"); 
            setFabrics(res.data);
        } catch(e) { console.error(e); }
    };

    const fetchSkus = async () => {
        try {
            const res = await apiClient.get("/api/catalog/list");
            setAvailableSkus(res.data.map(item => item.sku));
        } catch (e) { 
            console.error("Failed to load SKUs for autocomplete", e); 
        }
    };

    // --- HELPERS ---
    const calculateTotalQty = (lot) => {
        // ✅ NEW: Show estimate for NEW lots, exact sizes for everything else
        if (lot.status === 'NEW') return lot.totalPlannedQty || 0;
        return (lot.sizedBreakdown || lot.sizeBreakdown || []).reduce((sum, item) => sum + item.plannedQty, 0);
    };

    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString() : "N/A";
    
    const getStatusColor = (status) => {
        if(status === 'NEW') return 'bg-primary text-white';
        if(status === 'CUTTING') return 'bg-warning text-dark';
        if(status === 'STITCHING') return 'bg-info text-dark';
        if(status === 'FINISHING') return 'bg-success text-white';
        if(status === 'COMPLETED') return 'bg-dark text-white';
        if(status === 'CANCELLED') return 'bg-secondary text-white'; 
        return 'bg-primary text-white'; 
    };

    // --- ACTIONS ---
    const handleCreateLot = async () => {
        if (!newLot.totalPlannedQty || newLot.totalPlannedQty <= 0) return alert("Please enter the total planned quantity.");
        try {
            await apiClient.post("/api/manufacturing/lot/create", newLot); 
            alert("✅ Production Order Created"); 
            setShowCreate(false); 
            fetchLots();
            setNewLot({ skuCode: "", fabricId: "", fabricUsedKgs: "", expectedDate: "", remarks: "", totalPlannedQty: "" });
        } catch (e) { alert("Failed: " + e.response?.data); }
    };

    const handleStageMove = async () => {
        const payload = {
            lotId: movingLot.id, 
            newStatus: nextStatus, 
            rejections: rejections
        };

        // ✅ FIXED: Check movingLot.status to attach sizes when leaving the Cutting phase
        if (movingLot.status === "CUTTING") {
            const sizeMap = {};
            let totalCut = 0;
            Object.keys(cutSizes).forEach(k => { 
                if(cutSizes[k] > 0) {
                    sizeMap[k] = parseInt(cutSizes[k]);
                    totalCut += sizeMap[k];
                }
            });
            if (totalCut === 0) return alert("You must enter the exact cut sizes before moving out of the Cutting stage.");
            payload.cutSizes = sizeMap;
        }

        try {
            await apiClient.post("/api/manufacturing/lot/status", payload);
            setMovingLot(null); 
            fetchLots(); 
            setSelectedLot(null); 
            setCutSizes({ S: 0, M: 0, L: 0, XL: 0, XXL: 0 }); // Reset
        } catch (e) { alert("Update Failed"); }
    };

    const handleCancelLot = async (id) => {
        if(!window.confirm("Are you sure you want to CANCEL this lot? Process will stop.")) return;
        try {
            await apiClient.post(`/api/manufacturing/lot/cancel/${id}`); 
            fetchLots();
        } catch(e) { alert("Cancel Failed"); }
    };

    const handleDeleteLot = async (id) => {
        if(!window.confirm("⚠️ DANGER: Permanently Delete? This cannot be undone.")) return;
        try {
            await apiClient.delete(`/api/manufacturing/lot/delete/${id}`); 
            fetchLots();
        } catch(e) { alert("Delete Failed"); }
    };

    const handleEditSave = async () => {
        alert("Edit functionality requires backend endpoint update! (Coming soon)");
        setShowEdit(false);
    };

    return (
        <div className="container-fluid p-2 p-md-4">
            
            {/* INJECTED MOBILE-FIRST CSS ENGINE */}
            <style>{`
                .tverse-lot-card {
                    transition: transform 0.2s;
                    border: 1px solid #e9ecef;
                }
                .tverse-lot-card:active {
                    transform: scale(0.98);
                }
                .status-badge {
                    font-size: 0.75rem;
                    letter-spacing: 0.5px;
                    padding: 0.35em 0.65em;
                }
                .drawer-panel {
                    width: 100% !important;
                    max-width: 400px;
                    right: -100%;
                    transition: right 0.3s ease-in-out;
                }
                .drawer-panel.open {
                    right: 0;
                }
                @media (max-width: 768px) {
                    .mobile-action-btn {
                        padding: 0.6rem 1rem;
                        font-size: 1.1rem;
                    }
                }
            `}</style>

            {/* --- HEADER --- */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
                <div>
                    <h4 className="fw-bold text-dark m-0">Production Floor</h4>
                    <p className="text-muted small mb-0">Track work orders, stages, and output.</p>
                </div>
                <div className="d-flex gap-2 w-100 w-md-auto">
                    <button className={`btn flex-grow-1 flex-md-grow-0 ${showFilter ? 'btn-secondary' : 'btn-light border'}`} onClick={() => setShowFilter(!showFilter)}>
                        <i className="bi bi-funnel-fill me-1"></i> <span className="d-none d-sm-inline">Filters</span>
                    </button>
                    <button className="btn btn-dark flex-grow-1 flex-md-grow-0 fw-bold shadow-sm" onClick={() => setShowCreate(true)}>
                        <i className="bi bi-plus-lg me-1"></i> Create Lot
                    </button>
                </div>
            </div>

            {/* --- FILTER BAR (Mobile Stacked) --- */}
            {showFilter && (
                <div className="bg-white p-3 rounded-3 mb-4 border shadow-sm">
                    <div className="row g-3">
                        <div className="col-12 col-md-2">
                            <label className="small fw-bold text-muted mb-1">Status</label>
                            <select className="form-select form-select-sm p-2" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
                                <option value="">All Status</option>
                                {STATUS_FLOW.map(s => <option key={s} value={s}>{s}</option>)}
                                <option value="CANCELLED">CANCELLED</option>
                            </select>
                        </div>
                        <div className="col-12 col-md-4">
                            <label className="small fw-bold text-muted mb-1">Created Date</label>
                            <div className="input-group input-group-sm">
                                <input type="date" className="form-control p-2" value={filters.startDateFrom} onChange={e => setFilters({...filters, startDateFrom: e.target.value})} />
                                <input type="date" className="form-control p-2" value={filters.startDateTo} onChange={e => setFilters({...filters, startDateTo: e.target.value})} />
                            </div>
                        </div>
                        <div className="col-12 col-md-4">
                            <label className="small fw-bold text-muted mb-1">Expected Date</label>
                            <div className="input-group input-group-sm">
                                <input type="date" className="form-control p-2" value={filters.expDateFrom} onChange={e => setFilters({...filters, expDateFrom: e.target.value})} />
                                <input type="date" className="form-control p-2" value={filters.expDateTo} onChange={e => setFilters({...filters, expDateTo: e.target.value})} />
                            </div>
                        </div>
                        <div className="col-6 col-md-1 d-flex align-items-end">
                            <button className="btn btn-primary btn-sm w-100 p-2 fw-bold" onClick={fetchLots}>Apply</button>
                        </div>
                        <div className="col-6 col-md-1 d-flex align-items-end">
                            <button className="btn btn-outline-secondary btn-sm w-100 p-2" onClick={() => {
                                setFilters({ status: "", startDateFrom: "", startDateTo: "", expDateFrom: "", expDateTo: "" });
                                setTimeout(fetchLots, 100);
                            }}>Clear</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- DATA RENDER ENGINE --- */}
            {lots.length === 0 ? (
                <div className="p-5 text-center text-muted bg-white rounded-3 shadow-sm border">
                    <i className="bi bi-box-seam fs-1 d-block mb-3 opacity-50"></i>
                    <h5 className="fw-bold">No active lots found.</h5>
                    <p className="small">Adjust your filters or create a new production lot.</p>
                </div>
            ) : (
                <>
                    {/* 1. DESKTOP VIEW: Standard Table (Hidden on Mobile) */}
                    <div className="pro-table-container d-none d-lg-block bg-white rounded-3 shadow-sm border overflow-visible">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="py-3 px-4">Lot No.</th>
                                    <th>SKU Code</th>
                                    <th>Status</th>
                                    <th>Total Qty</th>
                                    <th>Fabric Used</th>
                                    <th>Start Date</th>
                                    <th>Exp. Completion</th>
                                    <th className="text-end px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lots.map(lot => (
                                    <tr key={lot.id}>
                                        <td className="px-4 font-monospace fw-bold text-primary">
                                            <span style={{cursor:'pointer'}} onClick={() => setSelectedLot(lot)}>{lot.lotNumber}</span>
                                        </td>
                                        <td className="fw-bold">{lot.skuCode}</td>
                                        <td>
                                            <span className={`badge rounded-pill status-badge ${getStatusColor(lot.status)}`}>{lot.status}</span>
                                        </td>
                                        <td className="fw-bold text-dark">{calculateTotalQty(lot)} pcs</td>
                                        <td className="text-muted">{lot.fabricUsedKgs} kgs</td>
                                        <td className="small">{formatDate(lot.creationDate)}</td>
                                        <td className={`small ${new Date(lot.expectedDate) < new Date() ? "text-danger fw-bold" : "text-muted"}`}>
                                            {formatDate(lot.expectedDate)}
                                        </td>
                                        <td className="text-end px-4">
                                            <button className="btn btn-sm btn-light border me-1" title="View Details" onClick={() => setSelectedLot(lot)}>
                                                <i className="bi bi-eye"></i>
                                            </button>
                                            
                                            {lot.status !== 'COMPLETED' && lot.status !== 'CANCELLED' && (
                                                <button 
                                                    className="btn btn-sm btn-dark fw-bold me-1 px-3"
                                                    onClick={() => {
                                                        setMovingLot(lot);
                                                        const currIdx = STATUS_FLOW.indexOf(lot.status);
                                                        setNextStatus(STATUS_FLOW[currIdx + 1]);
                                                        setRejections({});
                                                    }}
                                                >
                                                    Next Stage <i className="bi bi-arrow-right ms-1"></i>
                                                </button>
                                            )}

                                            <div className="btn-group">
                                                <button type="button" className="btn btn-sm btn-light border dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" aria-expanded="false"></button>
                                                <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0">
                                                    <li><button className="dropdown-item small" onClick={() => { setEditingLot(lot); setShowEdit(true); }}><i className="bi bi-pencil me-2"></i> Edit Notes</button></li>
                                                    <li><hr className="dropdown-divider" /></li>
                                                    {lot.status !== 'CANCELLED' && (
                                                        <li><button className="dropdown-item small text-danger" onClick={() => handleCancelLot(lot.id)}><i className="bi bi-x-circle me-2"></i> Cancel Lot</button></li>
                                                    )}
                                                    <li><button className="dropdown-item small text-danger fw-bold" onClick={() => handleDeleteLot(lot.id)}><i className="bi bi-trash me-2"></i> Delete Data</button></li>
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 2. MOBILE VIEW: Stacked Cards (Hidden on Desktop) */}
                    <div className="d-block d-lg-none">
                        <div className="row g-3">
                            {lots.map(lot => (
                                <div className="col-12" key={lot.id}>
                                    <div className="card tverse-lot-card bg-white rounded-4 shadow-sm border-0 h-100 overflow-hidden">
                                        
                                        {/* Card Header */}
                                        <div className="card-header bg-transparent border-bottom-0 pt-3 pb-0 px-3 d-flex justify-content-between align-items-center">
                                            <span className="font-monospace fw-bold text-primary" onClick={() => setSelectedLot(lot)} style={{cursor: 'pointer'}}>
                                                #{lot.lotNumber}
                                            </span>
                                            <span className={`badge rounded-pill status-badge ${getStatusColor(lot.status)}`}>{lot.status}</span>
                                        </div>

                                        {/* Card Body */}
                                        <div className="card-body px-3 py-2" onClick={() => setSelectedLot(lot)} style={{cursor: 'pointer'}}>
                                            <h5 className="fw-black text-dark mb-3 text-truncate">{lot.skuCode}</h5>
                                            
                                            <div className="row g-2 mb-3 bg-light rounded-3 p-2 border">
                                                <div className="col-6 border-end">
                                                    <div className="small text-muted mb-1" style={{fontSize: '11px'}}>PLANNED OUTPUT</div>
                                                    <div className="fw-bold text-dark">{calculateTotalQty(lot)} pcs</div>
                                                </div>
                                                <div className="col-6 ps-3">
                                                    <div className="small text-muted mb-1" style={{fontSize: '11px'}}>FABRIC ROLL</div>
                                                    <div className="fw-bold text-dark">{lot.fabricUsedKgs} kgs</div>
                                                </div>
                                            </div>

                                            <div className="d-flex justify-content-between text-muted" style={{fontSize: '12px'}}>
                                                <span>Start: {formatDate(lot.creationDate)}</span>
                                                <span className={new Date(lot.expectedDate) < new Date() ? "text-danger fw-bold" : ""}>
                                                    Due: {formatDate(lot.expectedDate)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Card Footer Actions */}
                                        <div className="card-footer bg-transparent border-top p-2 d-flex gap-2">
                                            <button className="btn btn-light border mobile-action-btn flex-grow-1" onClick={() => setSelectedLot(lot)}>
                                                <i className="bi bi-eye"></i>
                                            </button>
                                            
                                            {lot.status !== 'COMPLETED' && lot.status !== 'CANCELLED' && (
                                                <button 
                                                    className="btn btn-dark fw-bold flex-grow-1 mobile-action-btn shadow-sm"
                                                    onClick={() => {
                                                        setMovingLot(lot);
                                                        const currIdx = STATUS_FLOW.indexOf(lot.status);
                                                        setNextStatus(STATUS_FLOW[currIdx + 1]);
                                                        setRejections({});
                                                    }}
                                                >
                                                    Next Stage <i className="bi bi-arrow-right"></i>
                                                </button>
                                            )}

                                            <div className="btn-group">
                                                <button type="button" className="btn btn-light border dropdown-toggle dropdown-toggle-split mobile-action-btn" data-bs-toggle="dropdown" aria-expanded="false"></button>
                                                <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0">
                                                    <li><button className="dropdown-item small" onClick={() => { setEditingLot(lot); setShowEdit(true); }}><i className="bi bi-pencil me-2"></i> Edit Notes</button></li>
                                                    <li><hr className="dropdown-divider" /></li>
                                                    {lot.status !== 'CANCELLED' && (
                                                        <li><button className="dropdown-item small text-danger" onClick={() => handleCancelLot(lot.id)}><i className="bi bi-x-circle me-2"></i> Cancel Lot</button></li>
                                                    )}
                                                    <li><button className="dropdown-item small text-danger fw-bold" onClick={() => handleDeleteLot(lot.id)}><i className="bi bi-trash me-2"></i> Delete Data</button></li>
                                                </ul>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* --- MODALS & DRAWERS --- */}
            
            <div className={`drawer-backdrop ${selectedLot ? 'open' : ''}`} onClick={() => setSelectedLot(null)} style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: selectedLot ? 'block' : 'none'}}></div>
            
            <div className={`drawer-panel bg-white shadow-lg h-100 position-fixed top-0 ${selectedLot ? 'open' : ''}`} style={{zIndex: 1050}}>
               {selectedLot && (
                   <div className="d-flex flex-column h-100">
                        <div className="p-3 border-bottom d-flex justify-content-between align-items-start bg-light">
                            <div>
                                <h5 className="fw-bold m-0 text-dark font-monospace">#{selectedLot.lotNumber}</h5>
                                <div className="text-primary small fw-bold mt-1">{selectedLot.skuCode}</div>
                            </div>
                            <button className="btn-close fs-5" onClick={() => setSelectedLot(null)}></button>
                        </div>
                        
                        <div className="flex-grow-1 p-3" style={{overflowY: 'auto'}}>
                            <div className="row g-2 mb-4">
                                <div className="col-4">
                                    <div className="p-2 bg-light border rounded text-center h-100">
                                        <div className="small text-muted" style={{fontSize: '10px'}}>STAGE</div>
                                        <span className={`badge mt-1 ${selectedLot.status === 'COMPLETED' ? 'bg-success' : 'bg-primary'}`}>{selectedLot.status}</span>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="p-2 bg-light border rounded text-center h-100">
                                        <div className="small text-muted" style={{fontSize: '10px'}}>OUTPUT</div>
                                        <div className="fw-bold small mt-1">{calculateTotalQty(selectedLot)} pcs</div>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="p-2 bg-light border rounded text-center h-100">
                                        <div className="small text-muted" style={{fontSize: '10px'}}>FABRIC</div>
                                        <div className="fw-bold small mt-1">{selectedLot.fabricUsedKgs} kgs</div>
                                    </div>
                                </div>
                            </div>

                            <h6 className="fw-bold mt-2 mb-3 text-dark small border-bottom pb-2">SIZE & QUALITY AUDIT</h6>
                            <div className="table-responsive border rounded-3 overflow-hidden">
                                <table className="table table-sm table-borderless mb-0 align-middle text-center">
                                    <thead className="table-light border-bottom">
                                        <tr>
                                            <th className="small text-muted">Size</th>
                                            <th className="small text-muted">Plan</th>
                                            <th className="small text-danger">QC Fail</th>
                                            <th className="small text-success">Good</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(selectedLot.sizedBreakdown|| selectedLot.sizeBreakdown || []).map(item => (
                                            <tr key={item.id} className="border-bottom">
                                                <td className="fw-bold bg-light border-end">{item.size}</td>
                                                <td>{item.plannedQty}</td>
                                                <td className="text-danger fw-bold">{item.rejectedQty > 0 ? item.rejectedQty : "-"}</td>
                                                <td className="text-success fw-bold">{item.produceQty}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-4 p-3 bg-light rounded-3 border">
                                <div className="mb-2"><strong className="small text-muted">PRODUCTION NOTES:</strong></div>
                                <div className="small">{selectedLot.remarks || "No remarks entered."}</div>
                            </div>
                            
                            <div className="mt-4 text-center text-muted" style={{fontSize: '11px'}}>
                                Ticket Generated: {new Date(selectedLot.creationDate).toLocaleString()}
                            </div>
                        </div>

                        <div className="p-3 border-top bg-white">
                            <button className="btn btn-dark w-100 py-2 fw-bold" onClick={() => window.print()}>
                                <i className="bi bi-printer me-2"></i> Print Routing Card
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* CREATE MODAL */}
             {showCreate && (
                <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060}}>
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content shadow border-0 rounded-4">
                            <div className="modal-header bg-light border-bottom-0 py-3 px-4">
                                <h5 className="modal-title fw-bold">Initiate Production Run</h5>
                                <button type="button" className="btn-close" onClick={() => setShowCreate(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="row g-4">
                                    <div className="col-12 col-md-6">
                                        <label className="form-label small fw-bold text-muted">SKU Code</label>
                                        {/* ✅ NEW: Autocomplete Datalist */}
                                        <input 
                                            className="form-control form-control-lg fs-6" 
                                            placeholder="e.g. TTS-HOODIE-BLK" 
                                            value={newLot.skuCode}
                                            onChange={e => setNewLot({...newLot, skuCode: e.target.value})} 
                                            list="sku-suggestions" 
                                            autoComplete="off"
                                        />
                                        <datalist id="sku-suggestions">
                                            {availableSkus.map((sku, idx) => (
                                                <option key={idx} value={sku} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <div className="col-12 col-md-6">
                                        <label className="form-label small fw-bold text-muted">Select Raw Material</label>
                                        <select className="form-select form-select-lg fs-6" onChange={e => setNewLot({...newLot, fabricId: e.target.value})}>
                                            <option value="">Choose Fabric Roll...</option>
                                            {/* ✅ NEW: Filter out 0kg rolls */}
                                            {fabrics
                                                .filter(f => f.remainingKgs > 0)
                                                .map(f => (
                                                    <option key={f.id} value={f.id}>
                                                        {f.fabricName} (Avl: {f.remainingKgs} kgs)
                                                    </option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label small fw-bold text-muted">Consumption (Kgs)</label>
                                        <input type="number" className="form-control form-control-lg fs-6" placeholder="0.00" onChange={e => setNewLot({...newLot, fabricUsedKgs: e.target.value})} />
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label small fw-bold text-muted">Expected Deadline</label>
                                        <input type="date" className="form-control form-control-lg fs-6" onChange={e => setNewLot({...newLot, expectedDate: e.target.value})} />
                                    </div>
                                    
                                    {/* ✅ NEW: Replaced Size Matrix with Total Estimate */}
                                    <div className="col-12">
                                        <div className="p-3 bg-light border rounded-3">
                                            <label className="form-label fw-bold text-dark mb-1">Estimated Total Quantity (Pieces)</label>
                                            <p className="small text-muted mb-2">Exact sizes will be entered after the cutting phase is complete.</p>
                                            <input type="number" className="form-control form-control-lg fs-6 w-50" placeholder="e.g. 500" onChange={e => setNewLot({...newLot, totalPlannedQty: e.target.value})} />
                                        </div>
                                    </div>
                                    
                                    <div className="col-12">
                                        <label className="form-label small fw-bold text-muted">Remarks</label>
                                        <textarea className="form-control" rows="2" onChange={e => setNewLot({...newLot, remarks: e.target.value})}></textarea>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer bg-light border-top-0 py-3 px-4 d-flex flex-nowrap gap-2">
                                <button className="btn btn-outline-secondary flex-grow-1 py-2" onClick={() => setShowCreate(false)}>Cancel</button>
                                <button className="btn btn-dark flex-grow-1 fw-bold py-2" onClick={handleCreateLot}>Start Production</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MOVE MODAL */}
            {movingLot && (
                <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow border-0 rounded-4 overflow-hidden">
                            <div className="modal-header bg-dark text-white border-0 py-3 px-4">
                                <h5 className="modal-title fw-bold m-0">Promote to {nextStatus}</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setMovingLot(null)}></button>
                            </div>
                            
                            {/* ✅ FIXED: Check movingLot.status === 'CUTTING' instead of nextStatus */}
                            <div className="modal-body p-4 bg-white">
                                {movingLot.status === "CUTTING" ? (
                                    <>
                                        <p className="text-dark small mb-3">Cutting is complete. Please enter the <strong>exact number of pieces</strong> successfully cut for each size before moving to {nextStatus}.</p>
                                        <div className="d-flex flex-wrap gap-2 justify-content-between p-3 bg-light border rounded-3">
                                            {['S','M','L','XL','2XL'].map(sz => (
                                                <div key={sz} className="text-center" style={{flex: '1 1 18%'}}>
                                                    <label className="small fw-bold d-block mb-1">{sz}</label>
                                                    <input 
                                                        type="number" 
                                                        inputMode="numeric" 
                                                        className="form-control text-center py-2 border-primary" 
                                                        placeholder="0" 
                                                        value={cutSizes[sz] || ''}
                                                        onChange={e => setCutSizes({...cutSizes, [sz]: e.target.value})} 
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-muted small mb-4">Please record any QC failures or damages detected during the <strong>{movingLot.status}</strong> stage.</p>
                                        <div className="border rounded-3 overflow-hidden">
                                            <table className="table table-borderless table-striped align-middle mb-0">
                                                <thead className="table-light border-bottom">
                                                    <tr>
                                                        <th className="py-2 px-3 small">Size</th>
                                                        <th className="py-2 px-3 small">Plan</th>
                                                        <th className="py-2 px-3 small text-danger text-end">QC Rejections</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(movingLot.sizedBreakdown || movingLot.sizeBreakdown || []).map(item => (
                                                        <tr key={item.id}>
                                                            <td className="fw-bold px-3">{item.size}</td>
                                                            <td className="px-3">{item.plannedQty}</td>
                                                            <td className="px-3 text-end">
                                                                <input 
                                                                    type="number" 
                                                                    inputMode="numeric" 
                                                                    className="form-control form-control-sm text-danger fw-bold d-inline-block text-center" 
                                                                    style={{width: '70px', padding: '0.4rem'}}
                                                                    placeholder="0"
                                                                    onChange={(e) => setRejections({
                                                                        ...rejections, 
                                                                        [item.size]: parseInt(e.target.value) || 0
                                                                    })}
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="modal-footer border-top-0 bg-light p-3 d-flex flex-nowrap gap-2">
                                <button className="btn btn-outline-secondary flex-grow-1 py-2" onClick={() => setMovingLot(null)}>Cancel</button>
                                <button className="btn btn-primary fw-bold flex-grow-1 py-2" onClick={handleStageMove}>Confirm Move</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {showEdit && (
                <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow border-0 rounded-4">
                            <div className="modal-header bg-light border-0 py-3 px-4">
                                <h5 className="modal-title fw-bold">Edit Lot Notes</h5>
                                <button type="button" className="btn-close" onClick={() => setShowEdit(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <label className="form-label small fw-bold text-muted">Production Remarks</label>
                                <textarea className="form-control form-control-lg fs-6" rows="4" defaultValue={editingLot.remarks}></textarea>
                            </div>
                            <div className="modal-footer border-0 p-3 d-flex gap-2">
                                <button className="btn btn-outline-secondary flex-grow-1 py-2" onClick={() => setShowEdit(false)}>Close</button>
                                <button className="btn btn-primary flex-grow-1 fw-bold py-2" onClick={handleEditSave}>Save Notes</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LotManager;