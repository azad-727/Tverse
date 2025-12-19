import { useEffect, useState } from 'react';
import axios from 'axios';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch Real Data from Backend
        axios.get("http://localhost:8080/api/inventory/dashboard-stats")
            .then(res => {
                setStats(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Dashboard Error:", err);
                setError("Failed to load dashboard data. Is Backend running?");
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-5 text-center"><div className="spinner-border text-primary"></div><p className="mt-2">Analyzing Inventory...</p></div>;
    if (error) return <div className="p-5 text-center text-danger"><h5>{error}</h5></div>;

    return (
        <div className="container-fluid p-0">
            <h3 className="fw-bold mb-4">Dashboard</h3>

            {/* 1. TOP CARDS (Real Financials) */}
            <div className="row g-4 mb-4">
                <div className="col-md-6">
                    <div className="custom-card p-4 h-100 bg-success text-white shadow-sm">
                        <h5 className="opacity-75">Total Inventory Value</h5>
                        <h2 className="fw-bold mt-2">₹ {stats.totalInventoryValue.toLocaleString('en-IN')}</h2>
                        <div className="small opacity-75">Based on Procurement Cost of all items</div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="custom-card p-4 h-100 bg-primary text-white shadow-sm">
                        <h5 className="opacity-75">Total Units in Stock</h5>
                        <h2 className="fw-bold mt-2">{stats.totalStockCount.toLocaleString('en-IN')} Units</h2>
                        <div className="small opacity-75">Physical Stock On Hand</div>
                    </div>
                </div>
            </div>

            {/* 2. INTELLIGENT ALERTS SECTION */}
            <div className="row g-4">
                
                {/* PRODUCTION CALLS (The "Smart" Feature) */}
                <div className="col-md-6">
                    <div className="custom-card p-0 h-100 border-warning border-top border-4 shadow-sm">
                        <div className="p-4 border-bottom">
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="fw-bold text-dark mb-0"><i className="bi bi-gear-wide-connected text-warning me-2"></i>Production Calls</h5>
                                <span className="badge bg-warning text-dark">{stats.productionAlerts.length} Alerts</span>
                            </div>
                            <p className="text-muted small mt-2 mb-0">
                                Stock is available, but based on <strong>Sales Velocity & Lead Time</strong>, you must start production now.
                            </p>
                        </div>
                        
                        <div className="list-group list-group-flush" style={{maxHeight: '300px', overflowY: 'auto'}}>
                            {stats.productionAlerts.length === 0 && <div className="text-center text-muted py-4">No production needed yet. Operations normal.</div>}
                            
                            {stats.productionAlerts.map((item, idx) => (
                                <div key={idx} className="list-group-item d-flex justify-content-between align-items-center p-3">
                                    <div>
                                        <div className="fw-bold text-dark text-truncate" style={{maxWidth: '200px'}} title={item.sku}>{item.sku}</div>
                                        <div className="small text-muted">
                                            Sales: <strong>{item.velocity}</strong> | Lead Time: <strong>{item.leadTime} days</strong>
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        <div className="fw-bold text-warning">{item.stock} left</div>
                                        <span className="badge bg-dark">Start Production</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CRITICAL ALERTS (The Panic Feature) */}
                <div className="col-md-6">
                    <div className="custom-card p-0 h-100 border-danger border-top border-4 shadow-sm">
                        <div className="p-4 border-bottom">
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="fw-bold text-dark mb-0"><i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>Critical Low Stock</h5>
                                <span className="badge bg-danger">{stats.criticalAlerts.length} Alerts</span>
                            </div>
                            <p className="text-muted small mt-2 mb-0">
                                Items below safety buffer (10 units). Immediate attention required.
                            </p>
                        </div>

                        <div className="list-group list-group-flush" style={{maxHeight: '300px', overflowY: 'auto'}}>
                            {stats.criticalAlerts.length === 0 && <div className="text-center text-muted py-4"><i className="bi bi-check-circle text-success fs-1 d-block mb-2"></i>Stock health is good.</div>}

                            {stats.criticalAlerts.map((item, idx) => (
                                <div key={idx} className="list-group-item d-flex justify-content-between align-items-center p-3">
                                    <div className="fw-bold text-danger text-truncate" style={{maxWidth: '250px'}} title={item.sku}>
                                        {item.sku}
                                    </div>
                                    <span className="badge bg-danger rounded-pill px-3">{item.stock} Units</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;