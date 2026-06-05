import { useState, useEffect } from 'react';
import apiClient from '../apiClient';

const LotManager = () => {
    const [lots, setLots] = useState([]);
    const [fabrics, setFabrics] = useState([]);
    
    const [showCreate, setShowCreate] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showFilter, setShowFilter] = useState(false);

    const [selectedLot, setSelectedLot] = useState(null); 
    const [editingLot, setEditingLot] = useState(null);   
    
    const [movingLot, setMovingLot] = useState(null);
    const [nextStatus, setNextStatus] = useState("");
    const [rejections, setRejections] = useState({});

    const [filters, setFilters] = useState({
        status: "",
        startDateFrom: "",
        startDateTo: "",
        expDateFrom: "",
        expDateTo: ""
    });

    const [newLot, setNewLot] = useState({ skuCode: "", fabricId: "", fabricUsedKgs: "", expectedDate: "", remarks: "" });
    const [sizeInput, setSizeInput] = useState({ S: 0, M: 0, L: 0, XL: 0, XXL: 0 });

    const STATUS_FLOW = ["NEW", "CUTTING", "STITCHING", "PRINTING", "FINISHING", "PACKING", "COMPLETED"];

    useEffect(() => { fetchLots(); fetchFabrics(); }, []);

    const fetchLots = async () => { 
        const params = new URLSearchParams(filters);
        for (const [key, value] of params.entries()) { if (!value) params.delete(key); }
        
        const url = params.toString() 
            ? `/api/manufacturing/lot/filter?${params.toString()}`
            : `/api/manufacturing/lots`;

        try {
            const res = await apiClient.get(url); // ✅ FIXED
            setLots(res.data);
        } catch(e) { console.error(e); }
    };
    
    const fetchFabrics = async () => {
        try {
            const res = await apiClient.get("/api/manufacturing/fabrics"); // ✅ FIXED
            setFabrics(res.data);
        } catch(e) { console.error(e); }
    };

    const calculateTotalQty = (lot) => (lot.sizedBreakdown || lot.sizeBreakdown || []).reduce((sum, item) => sum + item.plannedQty, 0);
    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString() : "N/A";
    
    const getStatusColor = (status) => {
        if(status === 'NEW') return 'new';
        if(status === 'CUTTING') return 'cutting';
        if(status === 'STITCHING') return 'stitching';
        if(status === 'FINISHING') return 'finishing';
        if(status === 'COMPLETED') return 'completed';
        if(status === 'CANCELLED') return 'bg-secondary text-white';
        return 'new';
    };

    const handleCreateLot = async () => {
        const sizeMap = {};
        Object.keys(sizeInput).forEach(k => { if(sizeInput[k] > 0) sizeMap[k] = parseInt(sizeInput[k]); });
        try {
            await apiClient.post("/api/manufacturing/lot/create", { ...newLot, sizedBreakdown: sizeMap }); // ✅ FIXED
            alert("✅ Production Order Created"); setShowCreate(false); fetchLots();
        } catch (e) { alert("Failed: " + e.response?.data); }
    };

    const handleStageMove = async () => {
        try {
            await apiClient.post("/api/manufacturing/lot/status", { // ✅ FIXED
                lotId: movingLot.id, newStatus: nextStatus, rejections: rejections
            });
            setMovingLot(null); fetchLots(); setSelectedLot(null); 
        } catch (e) { alert("Update Failed"); }
    };

    const handleCancelLot = async (id) => {
        if(!confirm("Are you sure you want to CANCEL this lot? Process will stop.")) return;
        try {
            await apiClient.post(`/api/manufacturing/lot/cancel/${id}`); // ✅ FIXED
            fetchLots();
        } catch(e) { alert("Cancel Failed"); }
    };

    const handleDeleteLot = async (id) => {
        if(!confirm("⚠️ DANGER: Permanently Delete? This cannot be undone.")) return;
        try {
            await apiClient.delete(`/api/manufacturing/lot/delete/${id}`); // ✅ FIXED
            fetchLots();
        } catch(e) { alert("Delete Failed"); }
    };

    const handleEditSave = async () => {
        alert("Edit functionality requires backend endpoint update! (Coming soon)");
        setShowEdit(false);
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="fw-bold text-dark">Production Floor</h4>
                    <p className="text-muted small mb-0">Track work orders, stages, and output.</p>
                </div>
                <div className="d-flex gap-2">
                    <button className={`btn ${showFilter ? 'btn-secondary' : 'btn-light'} border`} onClick={() => setShowFilter(!showFilter)}>
                        <i className="bi bi-funnel-fill me-2"></i> Filters
                    </button>
                    <button className="btn btn-dark" onClick={() => setShowCreate(true)}>
                        <i className="bi bi-plus-lg me-2"></i> Create Lot
                    </button>
                </div>
            </div>

            {showFilter && (
                <div className="bg-light p-3 rounded mb-4 border shadow-sm">
                    <div className="row g-3">
                        <div className="col-md-2">
                            <label className="small fw-bold text-muted">Status</label>
                            <select className="form-select form-select-sm" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
                                <option value="">All Status</option>
                                {STATUS_FLOW.map(s => <option key={s} value={s}>{s}</option>)}
                                <option value="CANCELLED">CANCELLED</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="small fw-bold text-muted">Created Date (From - To)</label>
                            <div className="input-group input-group-sm">
                                <input type="date" className="form-control" value={filters.startDateFrom} onChange={e => setFilters({...filters, startDateFrom: e.target.value})} />
                                <input type="date" className="form-control" value={filters.startDateTo} onChange={e => setFilters({...filters, startDateTo: e.target.value})} />
                            </div>
                        </div>
                        <div className="col-md-3">
                            <label className="small fw-bold text-muted">Expected Date (From - To)</label>
                            <div className="input-group input-group-sm">
                                <input type="date" className="form-control" value={filters.expDateFrom} onChange={e => setFilters({...filters, expDateFrom: e.target.value})} />
                                <input type="date" className="form-control" value={filters.expDateTo} onChange={e => setFilters({...filters, expDateTo: e.target.value})} />
                            </div>
                        </div>
                        <div className="col-md-2 d-flex align-items-end">
                            <button className="btn btn-primary btn-sm w-100" onClick={fetchLots}>Apply Filter</button>
                        </div>
                        <div className="col-md-2 d-flex align-items-end">
                            <button className="btn btn-outline-secondary btn-sm w-100" onClick={() => {
                                setFilters({ status: "", startDateFrom: "", startDateTo: "", expDateFrom: "", expDateTo: "" });
                                setTimeout(fetchLots, 100);
                            }}>Reset</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="pro-table-container">
                <table className="pro-table">
                    <thead>
                        <tr>
                            <th>Lot No.</th>
                            <th>SKU Code</th>
                            <th>Status</th>
                            <th>Total Qty</th>
                            <th>Fabric Used</th>
                            <th>Start Date</th>
                            <th>Exp. Completion</th>
                            <th className="text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lots.map(lot => (
                            <tr key={lot.id}>
                                <td className="font-monospace fw-bold text-primary">
                                    <span style={{cursor:'pointer'}} onClick={() => setSelectedLot(lot)}>{lot.lotNumber}</span>
                                </td>
                                <td className="fw-bold">{lot.skuCode}</td>
                                <td>
                                    <span className={`status-pill ${getStatusColor(lot.status)}`}>{lot.status}</span>
                                </td>
                                <td className="fw-bold">{calculateTotalQty(lot)} pcs</td>
                                <td className="text-muted">{lot.fabricUsedKgs}kgs</td>
                                <td>{formatDate(lot.creationDate)}</td>
                                <td className={new Date(lot.expectedDate) < new Date() ? "text-danger fw-bold" : ""}>
                                    {formatDate(lot.expectedDate)}
                                </td>
                                <td className="text-end">
                                    <button className="btn btn-sm btn-light border me-1" title="View Details" onClick={() => setSelectedLot(lot)}>
                                        <i className="bi bi-eye"></i>
                                    </button>
                                    <button className="btn btn-sm btn-light border me-1" title="Edit Info" onClick={() => { setEditingLot(lot); setShowEdit(true); }}>
                                        <i className="bi bi-pencil"></i>
                                    </button>
                                    {lot.status !== 'COMPLETED' && lot.status !== 'CANCELLED' && (
                                        <>
                                            <button 
                                                className="btn btn-sm btn-outline-primary me-1"
                                                onClick={() => {
                                                    setMovingLot(lot);
                                                    const currIdx = STATUS_FLOW.indexOf(lot.status);
                                                    setNextStatus(STATUS_FLOW[currIdx + 1]);
                                                    setRejections({});
                                                }}
                                            >
                                                Next <i className="bi bi-arrow-right"></i>
                                            </button>
                                            <button className="btn btn-sm btn-outline-danger me-1" title="Cancel Lot" onClick={() => handleCancelLot(lot.id)}>
                                                <i className="bi bi-x-circle"></i>
                                            </button>
                                        </>
                                    )}
                                    <button className="btn btn-sm btn-link text-muted" title="Delete Permanent" onClick={() => handleDeleteLot(lot.id)}>
                                        <i className="bi bi-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {lots.length === 0 && <div className="p-5 text-center text-muted">No lots found.</div>}
            </div>

            <div className={`drawer-backdrop ${selectedLot ? 'open' : ''}`} onClick={() => setSelectedLot(null)}></div>
            <div className={`drawer-panel ${selectedLot ? 'open' : ''}`} style={{width: '400px'}}>
               {selectedLot && (
                    <>
                        <div className="lot-file-header d-flex justify-content-between align-items-start">
                            <div>
                                <h5 className="fw-bold m-0 text-dark">LOT FILE: {selectedLot.lotNumber}</h5>
                                <div className="text-primary small fw-bold mt-1">{selectedLot.skuCode}</div>
                            </div>
                            <button className="btn-close" onClick={() => setSelectedLot(null)}></button>
                        </div>
                        <div className="drawer-body">
                            <div className="lot-stat-grid">
                                <div className="stat-box">
                                    <label>Current Stage</label>
                                    <span className={`badge mt-1 ${selectedLot.status === 'COMPLETED' ? 'bg-success' : 'bg-primary'}`}>{selectedLot.status}</span>
                                </div>
                                <div className="stat-box">
                                    <label>Planned Output</label>
                                    <span>{calculateTotalQty(selectedLot)} pcs</span>
                                </div>
                                <div className="stat-box">
                                    <label>Fabric Consumed</label>
                                    <span>{selectedLot.fabricUsedKgs} kgs</span>
                                </div>
                            </div>
                            <h6 className="fw-bold mt-4 mb-2 text-muted small">SIZE & QUALITY BREAKDOWN</h6>
                            <div className="matrix-table">
                                <table className="w-100">
                                    <thead>
                                        <tr>
                                            <th>Size</th>
                                            <th>Planned</th>
                                            <th>Rejected (QC)</th>
                                            <th>Good Production</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(selectedLot.sizedBreakdown || selectedLot.sizeBreakdown || []).map(item => (
                                            <tr key={item.id}>
                                                <td className="fw-bold bg-light">{item.size}</td>
                                                <td>{item.plannedQty}</td>
                                                <td className="text-danger fw-bold">{item.rejectedQty > 0 ? item.rejectedQty : "-"}</td>
                                                <td className="text-success fw-bold">{item.produceQty}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-4 p-3 bg-light rounded border">
                                <div className="mb-2"><strong className="small text-muted">REMARKS:</strong></div>
                                <div>{selectedLot.remarks || "No remarks entered."}</div>
                            </div>
                            <div className="mt-3 text-muted small">
                                Started: {new Date(selectedLot.creationDate).toLocaleString()}
                            </div>
                        </div>
                        <div className="p-3 border-top bg-light text-end">
                            <button className="btn btn-outline-dark" onClick={() => window.print()}><i className="bi bi-printer me-2"></i>Print Job Card</button>
                        </div>
                    </>
                )}
            </div>

            {showCreate && (
                <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content shadow border-0">
                            <div className="modal-header bg-light">
                                <h5 className="modal-title fw-bold">Create Production Order</h5>
                                <button type="button" className="btn-close" onClick={() => setShowCreate(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold">SKU Code</label>
                                        <input className="form-control" placeholder="e.g. TTS-HOODIE-BLK" onChange={e => setNewLot({...newLot, skuCode: e.target.value})} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold">Select Fabric</label>
                                        <select className="form-select" onChange={e => setNewLot({...newLot, fabricId: e.target.value})}>
                                            <option value="">Choose Raw Material...</option>
                                            {fabrics.map(f => <option key={f.id} value={f.id}>{f.fabricName} (Avl: {f.remainingKgs} kgs)</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold">Consumption (Kgs)</label>
                                        <input type="number" className="form-control" placeholder="0.00" onChange={e => setNewLot({...newLot, fabricUsedKgs: e.target.value})} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold">Expected Completion</label>
                                        <input type="date" className="form-control" onChange={e => setNewLot({...newLot, expectedDate: e.target.value})} />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label small fw-bold">Remarks</label>
                                        <textarea className="form-control" rows="2" onChange={e => setNewLot({...newLot, remarks: e.target.value})}></textarea>
                                    </div>
                                    <div className="col-12">
                                        <div className="p-3 bg-light border rounded">
                                            <h6 className="fw-bold small mb-3">Size Plan</h6>
                                            <div className="d-flex gap-3">
                                                {['S','M','L','XL','2XL'].map(sz => (
                                                    <div key={sz} className="text-center">
                                                        <label className="small fw-bold d-block mb-1">{sz}</label>
                                                        <input type="number" className="form-control form-control-sm text-center" style={{width: '60px'}} onChange={e => setSizeInput({...sizeInput, [sz]: e.target.value})} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer bg-light border-0">
                                <button className="btn btn-outline-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                                <button className="btn btn-success px-4 fw-bold" onClick={handleCreateLot}>Confirm & Start</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {movingLot && (
                <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow border-0">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title fw-bold">Promote to {nextStatus}</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setMovingLot(null)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <p className="text-muted small mb-3">Please record any QC failures or damages detected in the <strong>{movingLot.status}</strong> stage.</p>
                                <div className="table-responsive border rounded">
                                    <table className="table table-sm mb-0">
                                        <thead className="table-light">
                                            <tr><th>Size</th><th>Planned</th><th className="text-danger">Rejections (Qty)</th></tr>
                                        </thead>
                                        <tbody>
                                            {(movingLot.sizedBreakdown || movingLot.sizeBreakdown || []).map(item => (
                                                <tr key={item.id}>
                                                    <td className="fw-bold">{item.size}</td>
                                                    <td>{item.plannedQty}</td>
                                                    <td>
                                                        <input 
                                                            type="number" 
                                                            className="form-control form-control-sm text-danger fw-bold" 
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
                            </div>
                            <div className="modal-footer border-0">
                                <button className="btn btn-light" onClick={() => setMovingLot(null)}>Cancel</button>
                                <button className="btn btn-primary fw-bold px-4" onClick={handleStageMove}>Confirm Movement</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showEdit && (
                <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow border-0">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">Edit Lot Details</h5>
                                <button type="button" className="btn-close" onClick={() => setShowEdit(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <label className="form-label">Remarks / Notes</label>
                                <textarea className="form-control" rows="3" defaultValue={editingLot.remarks}></textarea>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-primary" onClick={handleEditSave}>Save Changes</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LotManager;
