import { useState, useEffect } from 'react';
import apiClient from '../apiClient';

const FabricManager = () => {
    const [fabrics, setFabrics] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [newFabric, setNewFabric] = useState({ fabricName: "", color: "", vendorName: "", totalKgs: "", costPerKgs: "" });
    const [searchQuery, setSearchQuery] = useState("");
    
    // ✅ NEW: State to toggle empty/finished rolls
    const [showEmpty, setShowEmpty] = useState(false);

    useEffect(() => { fetchFabrics(); }, []);

    const fetchFabrics = async () => {
        try {
            const res = await apiClient.get("/api/manufacturing/fabrics");
            setFabrics(res.data);
        } catch (e) { console.error(e); }
    };

    const handleAdd = async () => {
        try {
            await apiClient.post("/api/manufacturing/fabric/add", { ...newFabric, remainingKgs: newFabric.totalKgs });
            alert("✅ Fabric Added Successfully");
            setShowForm(false);
            setNewFabric({ fabricName: "", color: "", vendorName: "", totalKgs: "", costPerKgs: "" });
            fetchFabrics();
        } catch (e) { alert("Error adding fabric"); }
    };

  

    const getStockColor = (remaining, total) => {
        const pct = (remaining / total) * 100;
        if(pct > 50) return 'bg-success';
        if(pct > 20) return 'bg-warning';
        return 'bg-danger';
    };

    // ✅ UPDATED: Smart Filtering Logic
    const filteredFabrics = fabrics.filter(f => {
        // 1. Search Filter
        const matchesSearch = f.fabricName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              f.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              f.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
        
        // 2. Hide Empty Filter (Auto-hides rolls with 0 remaining Kgs unless toggled)
        const matchesStock = showEmpty ? true : f.remainingKgs > 0;

        return matchesSearch && matchesStock;
    });

    return (
        <div className="container-fluid p-2 p-md-4">
            
            <style>{`
                .tverse-fabric-card {
                    transition: transform 0.2s;
                    border: 1px solid #e9ecef;
                    background: #ffffff;
                }
                .tverse-fabric-card:active {
                    transform: scale(0.98);
                }
                .stock-indicator-bg {
                    height: 8px;
                    background-color: #f1f5f9;
                    border-radius: 4px;
                    overflow: hidden;
                    width: 100%;
                }
                .stock-fill {
                    height: 100%;
                    border-radius: 4px;
                    transition: width 0.5s ease-in-out;
                }
                .empty-roll-card {
                    opacity: 0.6;
                    filter: grayscale(80%);
                }
                @media (max-width: 768px) {
                    .mobile-action-btn {
                        padding: 0.8rem 1rem;
                        font-size: 1.1rem;
                    }
                    .mobile-stack-input {
                        margin-bottom: 1rem;
                    }
                }
            `}</style>

            {/* --- HEADER & TOOLBAR --- */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
                <div>
                    <h4 className="fw-bold text-dark m-0">Fabric Inventory</h4>
                    <p className="text-muted small mb-0">Manage raw material rolls and stock levels.</p>
                </div>
                
                <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-md-auto align-items-md-center">
                    
                    {/* ✅ NEW: Toggle Switch for Empty Rolls */}
                    <div className="form-check form-switch me-md-2 mt-2 mt-sm-0 align-self-start align-self-sm-center">
                        <input className="form-check-input" type="checkbox" role="switch" id="showEmptySwitch" checked={showEmpty} onChange={() => setShowEmpty(!showEmpty)} />
                        <label className="form-check-label small fw-bold text-muted" htmlFor="showEmptySwitch">Show Empty</label>
                    </div>

                    <div className="input-group flex-grow-1">
                        <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-search"></i></span>
                        <input 
                            type="text" 
                            className="form-control border-start-0 ps-0 p-2" 
                            placeholder="Search materials..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-dark fw-bold shadow-sm p-2 flex-shrink-0" onClick={() => setShowForm(!showForm)}>
                        <i className={`bi ${showForm ? 'bi-x-lg' : 'bi-plus-lg'} me-1`}></i> {showForm ? 'Cancel' : 'Add Roll'}
                    </button>
                </div>
            </div>

            {/* --- ADD FABRIC FORM --- */}
            {showForm && (
                <div className="card mb-4 border-0 bg-white shadow-sm rounded-4 overflow-hidden">
                    <div className="card-header bg-dark text-white p-3 border-0">
                        <h6 className="fw-bold mb-0"><i className="bi bi-box-seam me-2"></i>New Material Entry</h6>
                    </div>
                    <div className="card-body p-4">
                        <div className="row g-3">
                            <div className="col-12 col-md-4 mobile-stack-input">
                                <label className="small fw-bold text-muted mb-1">Fabric Name</label>
                                <input className="form-control form-control-lg fs-6 p-2" placeholder="e.g. Cotton Bio-Wash" value={newFabric.fabricName} onChange={e => setNewFabric({...newFabric, fabricName: e.target.value})} />
                            </div>
                            <div className="col-6 col-md-2 mobile-stack-input">
                                <label className="small fw-bold text-muted mb-1">Color/Dye</label>
                                <input className="form-control form-control-lg fs-6 p-2" placeholder="e.g. Navy Blue" value={newFabric.color} onChange={e => setNewFabric({...newFabric, color: e.target.value})} />
                            </div>
                            <div className="col-6 col-md-2 mobile-stack-input">
                                <label className="small fw-bold text-muted mb-1">Vendor/Mill</label>
                                <input className="form-control form-control-lg fs-6 p-2" placeholder="Supplier Name" value={newFabric.vendorName} onChange={e => setNewFabric({...newFabric, vendorName: e.target.value})} />
                            </div>
                            <div className="col-6 col-md-2 mobile-stack-input">
                                <label className="small fw-bold text-muted mb-1">Total Weight (Kgs)</label>
                                <input type="number" inputMode="decimal" className="form-control form-control-lg fs-6 p-2" placeholder="0.00" value={newFabric.totalKgs} onChange={e => setNewFabric({...newFabric, totalKgs: e.target.value})} />
                            </div>
                            <div className="col-6 col-md-2 mobile-stack-input">
                                <label className="small fw-bold text-muted mb-1">Cost per Kg (₹)</label>
                                <input type="number" inputMode="decimal" className="form-control form-control-lg fs-6 p-2" placeholder="0.00" value={newFabric.costPerKgs} onChange={e => setNewFabric({...newFabric, costPerKgs: e.target.value})} />
                            </div>
                        </div>
                        <div className="mt-4 d-flex gap-2">
                            <button className="btn btn-dark fw-bold w-100 mobile-action-btn" onClick={handleAdd}>Save Material Entry to Ledger</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CARDS GRID --- */}
            {filteredFabrics.length === 0 ? (
                 <div className="p-5 text-center text-muted bg-white rounded-3 shadow-sm border mt-3">
                    <i className="bi bi-layers-half fs-1 d-block mb-3 opacity-50"></i>
                    <h5 className="fw-bold">No active fabrics found.</h5>
                    <p className="small">Add a new roll or toggle "Show Empty" to view finished rolls.</p>
                </div>
            ) : (
                <div className="row g-3 g-md-4">
                    {filteredFabrics.map(f => {
                        const usagePct = ((f.remainingKgs / f.totalKgs) * 100).toFixed(0);
                        const isEmpty = f.remainingKgs <= 0;
                        
                        return (
                            <div className="col-12 col-sm-6 col-xl-4" key={f.id}>
                                {/* ✅ NEW: Greyscale styling for empty rolls */}
                                <div className={`card tverse-fabric-card p-3 p-md-4 h-100 rounded-4 shadow-sm ${isEmpty ? 'empty-roll-card' : ''}`}>
                                    
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <h5 className="fw-bold text-dark mb-1">{f.fabricName} {isEmpty && "(Finished)"}</h5>
                                            <div className="text-muted small"><i className="bi bi-shop me-1"></i> {f.vendorName}</div>
                                        </div>
                                        <div className="text-end">
                                            <span className="badge bg-light text-dark border px-2 py-1 shadow-sm d-block mb-2">{f.color}</span>
                                        
                                        </div>
                                    </div>
                                    
                                    <div className="mt-auto pt-3 border-top">
                                        <div className="d-flex justify-content-between align-items-end mb-2">
                                            <div>
                                                <div className="small text-muted fw-bold" style={{fontSize: '11px'}}>CURRENT STOCK</div>
                                                <div className="fw-black text-dark fs-5">{f.remainingKgs} <span className="fs-6 text-muted fw-normal">/ {f.totalKgs} kgs</span></div>
                                            </div>
                                            <div className={`fw-bold small ${usagePct < 20 ? 'text-danger' : 'text-success'}`}>
                                                {isEmpty ? '0% Left' : `${usagePct}% Left`}
                                            </div>
                                        </div>
                                        
                                        <div className="stock-indicator-bg mt-2">
                                            <div 
                                                className={`stock-fill ${isEmpty ? 'bg-secondary' : getStockColor(f.remainingKgs, f.totalKgs)}`} 
                                                style={{width: `${Math.max(0, Math.min(100, usagePct))}%`}}
                                            ></div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

export default FabricManager;