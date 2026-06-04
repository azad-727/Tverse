import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from './apiClient'; // Adjust relative path to match your folder tree

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        apiClient.get("/api/inventory/dashboard-stats")
            .then(res => {
                setStats(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Dashboard Error:", err);
                const backendMsg = err.response?.data?.message || 
                                   (typeof err.response?.data === 'string' ? err.response.data : null);
                
                setError(backendMsg || "Failed to load system dashboard analytics.");
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-5 text-center"><div className="spinner-border text-primary"></div><p className="mt-2">Analyzing Inventory...</p></div>;
    if (error) return <div className="p-5 text-center text-danger"><h5>{error}</h5></div>;

    // Defensive assignment matrix with fallback variables
    const totalInventoryValue = stats?.totalInventoryValue ?? 0;
    const totalStockCount = stats?.totalStockCount ?? 0;
    const dailySalesAmount = stats?.dailySalesAmount ?? 0; 
    const dailySalesQty = stats?.dailySalesQty ?? 0;       
    const productionAlerts = stats?.productionAlerts || [];
    const criticalAlerts = stats?.criticalAlerts || [];

    const navigateToReports = () => {
        window.location.href = '/analytics'; 
    };

    return (
        <div className="container-fluid p-0">
            
            {/* COMPONENT-SPECIFIC RESPONSIVE DESIGN ENGINE */}
            <style>{`
                .tverse-clickable-card {
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }
                @media (min-width: 992px) {
                    .tverse-clickable-card:hover {
                        transform: translateY(-4px);
                        box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.15) !important;
                        filter: brightness(1.05);
                    }
                }
                
                /* FIXED: Custom premium color style for the revenue card to completely eliminate the black square */
                .tverse-revenue-card {
                    background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                }

                .tverse-quick-link {
                    transition: all 0.2s ease;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                }
                @media (min-width: 992px) {
                    .tverse-quick-link:hover {
                        background: #f8fafc;
                        border-color: #cbd5e1;
                        transform: translateX(3px);
                    }
                }
                
                /* MOBILE VIEWPORT RESPONSIVE BREAKPOINTS */
                @media (max-width: 576px) {
                    .tverse-card-value {
                        font-size: 1.5rem !important; /* Forces long financial strings to scale down cleanly without breaking layouts */
                    }
                    .tverse-quick-link-text {
                        font-size: 11px !important;
                    }
                    .tverse-quick-link-sub {
                        display: none !important; /* Conserves vertical grid real estate on small touch targets */
                    }
                }
            `}</style>

            <h3 className="fw-bold mb-4">Operational Command Center</h3>

            {/* 1. MASTER METRICS MATRIX: TOP OVERVIEW CARDS */}
            <div className="row g-3 g-xl-4 mb-4">
                {/* Total Inventory Value Card */}
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="custom-card p-4 h-100 bg-success text-white shadow-sm rounded-3">
                        <h6 className="opacity-75 uppercase tracking-wider small mb-2">Total Inventory Value</h6>
                        <h3 className="fw-black m-0 tverse-card-value">₹ {totalInventoryValue.toLocaleString('en-IN')}</h3>
                        <div className="small opacity-75 mt-2" style={{ fontSize: '11px' }}>Procurement Valuation</div>
                    </div>
                </div>

                {/* Total Units in Stock Card */}
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="custom-card p-4 h-100 bg-primary text-white shadow-sm rounded-3">
                        <h6 className="opacity-75 uppercase tracking-wider small mb-2">Total Units in Stock</h6>
                        <h3 className="fw-black m-0 tverse-card-value">{totalStockCount.toLocaleString('en-IN')} Qty</h3>
                        <div className="small opacity-75 mt-2" style={{ fontSize: '11px' }}>Physical Stock On Hand</div>
                    </div>
                </div>

                {/* FIXED: Removed bg-dark and added tverse-revenue-card class for a vibrant, professional Indigo finish */}
                <div className="col-12 col-sm-6 col-xl-3">
                    <div 
                        className="custom-card p-4 h-100 text-white shadow-sm rounded-3 tverse-clickable-card tverse-revenue-card position-relative overflow-hidden"
                        onClick={()=>navigate('/analytics')}
                        title="Click to launch deep financial reports"
                    >
                        <h6 className="text-white text-opacity-75 uppercase tracking-wider small mb-2 d-flex justify-content-between align-items-center">
                            <span>Today's Sales Revenue</span>
                            <i className="bi bi-box-arrow-up-right text-white opacity-50" style={{ fontSize: '12px' }}></i>
                        </h6>
                        <h3 className="fw-black m-0 tverse-card-value">₹ {dailySalesAmount.toLocaleString('en-IN')}</h3>
                        <div className="small text-white text-opacity-50 mt-2" style={{ fontSize: '11px' }}>Click to view billing logs</div>
                    </div>
                </div>

                {/* Today's Outbound Volumes Card */}
                <div className="col-12 col-sm-6 col-xl-3">
                    <div 
                        className="custom-card p-4 h-100 bg-info text-white shadow-sm rounded-3 tverse-clickable-card position-relative overflow-hidden border border-info border-opacity-25"
                        onClick={()=>navigate('/analytics')}
                        title="Click to launch shipping volume parameters"
                    >
                        <h6 className="text-white text-opacity-90 uppercase tracking-wider small mb-2 d-flex justify-content-between align-items-center">
                            <span className="fw-bold">Today's Orders Volume</span>
                            <i className="bi bi-box-arrow-up-right text-white opacity-50" style={{ fontSize: '12px' }}></i>
                        </h6>
                        <h3 className="fw-black m-0 tverse-card-value">{dailySalesQty.toLocaleString('en-IN')} Qty</h3>
                        <div className="small text-white text-opacity-75 mt-2" style={{ fontSize: '11px' }}>Click to open routing reports</div>
                    </div>
                </div>
            </div>

            {/* 2. OPERATIONAL QUICK VIEWS MODULE */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm p-3 p-md-4 rounded-3 bg-white">
                        <h5 className="fw-bold text-dark mb-3"><i className="bi bi-lightning-charge-fill text-warning me-2"></i>Quick Terminal Shortcuts</h5>
                        <div className="row g-2 g-md-3">
                            <div className="col-6 col-md-3">
                                <div className="p-2 p-md-3 rounded-3 tverse-quick-link d-flex align-items-center gap-2 gap-md-3 h-100 cursor-pointer" onClick={() => navigate('/dispatch/scan')}>
                                    <div className="text-primary fs-4"><i className="bi bi-qr-code-scan"></i></div>
                                    <div><h6 className="mb-0 tverse-quick-link-text fw-bold text-dark">Scan Station</h6><p className="mb-0 text-muted tverse-quick-link-sub" style={{fontSize: '11px'}}>WMS Packing</p></div>
                                </div>
                            </div>
                            <div className="col-6 col-md-3">
                                <div className="p-2 p-md-3 rounded-3 tverse-quick-link d-flex align-items-center gap-2 gap-md-3 h-100 cursor-pointer" onClick={() => navigate('/returns/inward')}>
                                    <div className="text-danger fs-4"><i className="bi bi-arrow-counterclockwise"></i></div>
                                    <div><h6 className="mb-0 tverse-quick-link-text fw-bold text-dark">Returns Terminal</h6><p className="mb-0 text-muted tverse-quick-link-sub" style={{fontSize: '11px'}}>Inward RTOs</p></div>
                                </div>
                            </div>
                            <div className="col-6 col-md-3">
                                <div className="p-2 p-md-3 rounded-3 tverse-quick-link d-flex align-items-center gap-2 gap-md-3 h-100 cursor-pointer" onClick={() => navigate('/manufacturing')}>
                                    <div className="text-warning fs-4"><i className="bi bi-layer-backward"></i></div>
                                    <div><h6 className="mb-0 tverse-quick-link-text fw-bold text-dark">Lot Production</h6><p className="mb-0 text-muted tverse-quick-link-sub" style={{fontSize: '11px'}}>Fabric Tracking</p></div>
                                </div>
                            </div>
                            <div className="col-6 col-md-3">
                                <div className="p-2 p-md-3 rounded-3 tverse-quick-link d-flex align-items-center gap-2 gap-md-3 h-100 cursor-pointer" onClick={() => navigate('/attendance')}>
                                    <div className="text-success fs-4"><i className="bi bi-person-badge-fill"></i></div>
                                    <div><h6 className="mb-0 tverse-quick-link-text fw-bold text-dark">Staff Kiosk</h6><p className="mb-0 text-muted tverse-quick-link-sub" style={{fontSize: '11px'}}>Shift Attendance</p></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. INTELLIGENT ALERTS PIPELINE SECTION */}
            <div className="row g-4">
                {/* PRODUCTION CALLS PANEL */}
                <div className="col-md-6">
                    <div className="custom-card p-0 h-100 border-warning border-top border-4 shadow-sm rounded-3 bg-white">
                        <div className="p-4 border-bottom">
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="fw-bold text-dark mb-0"><i className="bi bi-gear-wide-connected text-warning me-2"></i>Production Calls</h5>
                                <span className="badge bg-warning text-dark">{productionAlerts.length} Alerts</span>
                            </div>
                            <p className="text-muted small mt-2 mb-0">
                                Stock is available, but based on <strong>Sales Velocity & Lead Time</strong>, you must start production now.
                            </p>
                        </div>
                        
                        <div className="list-group list-group-flush" style={{maxHeight: '300px', overflowY: 'auto'}}>
                            {productionAlerts.length === 0 && <div className="text-center text-muted py-4">No production needed yet. Operations normal.</div>}
                            
                            {productionAlerts.map((item, idx) => (
                                <div key={idx} className="list-group-item d-flex justify-content-between align-items-center p-3">
                                    <div>
                                        <div className="fw-bold text-dark text-truncate" style={{maxWidth: '180px'}} title={item.sku}>{item.sku}</div>
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

                {/* CRITICAL ALERTS PANEL */}
                <div className="col-md-6">
                    <div className="custom-card p-0 h-100 border-danger border-top border-4 shadow-sm rounded-3 bg-white">
                        <div className="p-4 border-bottom">
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="fw-bold text-dark mb-0"><i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>Critical Low Stock</h5>
                                <span className="badge bg-danger">{criticalAlerts.length} Alerts</span>
                            </div>
                            <p className="text-muted small mt-2 mb-0">
                                Items below safety buffer (10 units). Immediate attention required.
                            </p>
                        </div>

                        <div className="list-group list-group-flush" style={{maxHeight: '300px', overflowY: 'auto'}}>
                            {criticalAlerts.length === 0 && <div className="text-center text-muted py-4"><i className="bi bi-check-circle text-success fs-1 d-block mb-2"></i>Stock health is good.</div>}

                            {criticalAlerts.map((item, idx) => (
                                <div key={idx} className="list-group-item d-flex justify-content-between align-items-center p-3">
                                    <div className="fw-bold text-danger text-truncate" style={{maxWidth: '200px'}} title={item.sku}>
                                        {item.sku}
                                    </div>
                                    <span className="badge bg-danger rounded-pill px-3">{item.stock} Qty</span>
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