import { useState, useEffect } from 'react';
import axios from 'axios';

const FabricManager = () => {
    const [fabrics, setFabrics] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [newFabric, setNewFabric] = useState({ fabricName: "", color: "", vendorName: "", totalKgs: ""});

    useEffect(() => { fetchFabrics(); }, []);

    const fetchFabrics = async () => {
        try {
            const res = await axios.get("http://localhost:8080/api/manufacturing/fabrics");
            setFabrics(res.data);
        } catch (e) { console.error(e); }
    };

    const handleAdd = async () => {
        try {
            await axios.post("http://localhost:8080/api/manufacturing/fabric/add", { ...newFabric, remainingKgs: newFabric.totalKgs });
            alert("✅ Fabric Added Successfully");
            setShowForm(false);
            fetchFabrics();
        } catch (e) { alert("Error adding fabric"); }
    };

    // Helper for Progress Color
    const getStockColor = (remaining, total) => {
        const pct = (remaining / total) * 100;
        if(pct > 50) return 'high';
        if(pct > 20) return 'medium';
        return 'low';
    };

    return (
        <div>
            {/* Toolbar */}
            <div className="d-flex justify-content-between mb-4">
                <div className="input-group" style={{maxWidth: '300px'}}>
                    <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
                    <input type="text" className="form-control" placeholder="Search Fabric..." />
                </div>
                <button className="btn btn-success" onClick={() => setShowForm(true)}>
                    <i className="bi bi-plus-lg me-2"></i> Add Fabric Roll
                </button>
            </div>

            {/* Add Form (Overlay Card) */}
            {showForm && (
                <div className="card mb-4 border-success bg-light shadow-sm">
                    <div className="card-body">
                        <h5 className="fw-bold mb-3 text-success">New Material Entry</h5>
                        <div className="row g-3">
                            <div className="col-md-4"><input className="form-control" placeholder="Fabric Name (e.g. Cotton Bio-Wash)" onChange={e => setNewFabric({...newFabric, fabricName: e.target.value})} /></div>
                            <div className="col-md-2"><input className="form-control" placeholder="Color" onChange={e => setNewFabric({...newFabric, color: e.target.value})} /></div>
                            <div className="col-md-2"><input className="form-control" placeholder="Vendor" onChange={e => setNewFabric({...newFabric, vendorName: e.target.value})} /></div>
                            <div className="col-md-2"><input type="number" className="form-control" placeholder="Total Kgs" onChange={e => setNewFabric({...newFabric, totalKgs: e.target.value})} /></div>
                            <div className="col-md-2"><input type="number" className="form-control" placeholder="Cost per Kgs" onChange={e => setNewFabric({...newFabric, costPerKgs: e.target.value})} /></div>
                        </div>
                        <div className="mt-3 d-flex gap-2 justify-content-end">
                            <button className="btn btn-light" onClick={() => setShowForm(false)}>Cancel</button>
                            <button className="btn btn-success px-4" onClick={handleAdd}>Save Entry</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cards Grid */}
            <div className="row g-4">
                {fabrics.map(f => (
                    <div className="col-md-6 col-lg-4" key={f.id}>
                        <div className="mfg-card p-3 h-100 d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <h6 className="fw-bold text-dark mb-0">{f.fabricName}</h6>
                                <span className="badge bg-light text-dark border">{f.color}</span>
                            </div>
                            
                            <div className="text-muted small mb-3">Vendor: {f.vendorName}</div>
                            
                            <div className="mt-auto">
                                <div className="d-flex justify-content-between small fw-bold mb-1">
                                    <span className="text-muted">Stock Level</span>
                                    <span>{f.remainingKgs} / {f.totalKgs} kgs</span>
                                </div>
                                <div className="stock-indicator-bar">
                                    <div 
                                        className={`stock-fill ${getStockColor(f.remainingKgs, f.totalKgs)}`} 
                                        style={{width: `${(f.remainingKgs/f.totalKgs)*100}%`}}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FabricManager;