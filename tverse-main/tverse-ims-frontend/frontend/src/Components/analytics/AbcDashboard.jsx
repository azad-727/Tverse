import { useState, useEffect } from 'react';
import apiClient from '../apiClient';

const AbcDashboard = () => {
    // 1. All State Definitions at the very top
    const [snapshotData, setSnapshotData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({ A: 0, B: 0, C: 0, Total: 0 });
    const [lastUpdated, setLastUpdated] = useState(null);
    const [viewMode, setViewMode] = useState('CHILD'); 

    // 2. Initial Load / View Mode Switcher
    useEffect(() => {
        fetchAbcData();
    }, [viewMode]);

    // 3. Function to pull data from the database
    const fetchAbcData = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/api/catalog/analytics/abc?viewType=${viewMode}`);
            
            const parsedData = res.data.map(row => ({
                ...row,
                parsedMetrics: JSON.parse(row.metricValue)
            }));
            
            setSnapshotData(parsedData);
            
            if (parsedData.length > 0) {
                setLastUpdated(parsedData[0].snapshotDate);
            }
            
            const stats = { A: 0, B: 0, C: 0, Total: parsedData.length };
            parsedData.forEach(item => {
                if (stats[item.parsedMetrics.category] !== undefined) {
                    stats[item.parsedMetrics.category]++;
                }
            });
            setSummary(stats);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching ABC Analytics", error);
            setLoading(false);
        }
    };

    // 4. Function for the "Force Refresh" Button
    const handleForceRefresh = async () => {
        setLoading(true);
        try {
            // Step 1: Tell Spring Boot to recalculate the snapshot
            await apiClient.post('/api/catalog/analytics/trigger-abc');
            console.log("Database snapshot recalculated successfully");
            
            // Step 2: Fetch the brand new data and show it on the UI
            await fetchAbcData(); 
        } catch (error) {
            console.error("Error refreshing data:", error);
            alert("Failed to refresh data. Please check the server.");
            setLoading(false);
        }
    };

    // 5. Early Returns
    if (loading && snapshotData.length === 0) {
        return <div className="p-5 text-center"><span className="spinner-border text-primary"></span> Loading Analytics...</div>;
    }

    // 6. UI Render
    return (
        <div className="container-fluid p-3 p-md-4 bg-light" style={{ minHeight: '100vh' }}>
            
            {/* --- COMPONENT-SPECIFIC MOBILE RESPONSIVE ENGINE --- */}
            <style>{`
                @media (max-width: 767.98px) {
                    /* Enables native high-speed momentum scrolling on iOS/Android for the table */
                    .table-responsive {
                        -webkit-overflow-scrolling: touch;
                        scrollbar-width: none; /* Hides Firefox scrollbar */
                    }
                    .table-responsive::-webkit-scrollbar {
                        display: none !important; /* Hides WebKit scrollbars */
                    }
                    /* Makes the header button group stack properly */
                    .mobile-action-group {
                        width: 100%;
                        flex-direction: column;
                        gap: 10px;
                    }
                    .mobile-action-group .btn-group {
                        width: 100%;
                    }
                }
            `}</style>

            {/* --- MOBILE RESPONSIVE HEADER --- */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 bg-white p-3 rounded shadow-sm gap-3">
                <div>
                    <h3 className="fw-bold mb-0">ABC Inventory Analysis</h3>
                    <p className="text-muted small mb-0">Revenue contribution (80/15/5 Rule)</p>
                    {lastUpdated && (
                        <span className="badge bg-light text-secondary border mt-1 d-inline-block font-monospace">
                            <i className="bi bi-clock-history me-1"></i> Data as of: {lastUpdated}
                        </span>
                    )}
                </div>
                
                {/* FIXED: Applied mobile action group class to ensure buttons stay full width on phones */}
                <div className="d-flex mobile-action-group w-md-auto">
                    <div className="btn-group shadow-sm" role="group">
                        <button 
                            className={`btn btn-sm w-50 ${viewMode === 'CHILD' ? 'btn-dark' : 'btn-outline-dark'}`}
                            onClick={() => setViewMode('CHILD')}
                        >
                            <i className="bi bi-tag me-1"></i> Child SKUs
                        </button>
                        <button 
                            className={`btn btn-sm w-50 ${viewMode === 'PARENT' ? 'btn-dark' : 'btn-outline-dark'}`}
                            onClick={() => setViewMode('PARENT')}
                        >
                            <i className="bi bi-diagram-3 me-1"></i> Parent Designs
                        </button>
                    </div>
                    
                    <button 
                        className="btn btn-outline-primary btn-sm fw-bold shadow-sm d-flex align-items-center justify-content-center"
                        onClick={handleForceRefresh} 
                        disabled={loading}
                    >
                        {loading ? (
                            <><span className="spinner-border spinner-border-sm me-2"></span>Syncing...</>
                        ) : (
                            <><i className="bi bi-arrow-clockwise me-2"></i>Refresh</>
                        )}
                    </button>
                </div>
            </div>

            {/* --- SUMMARY CARDS (100% width on phone, 50% tablet, 25% desktop) --- */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm bg-success bg-opacity-10 h-100 rounded-3">
                        <div className="card-body">
                            <h6 className="text-success fw-bold">Class A (Top 80%)</h6>
                            <h2 className="mb-0 font-monospace fw-bold">{summary.A} <span className="fs-6 text-muted fw-normal font-sans-serif">Items</span></h2>
                            <small className="text-muted">High revenue drivers.</small>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm bg-warning bg-opacity-10 h-100 rounded-3">
                        <div className="card-body">
                            <h6 className="text-warning text-dark fw-bold">Class B (Next 15%)</h6>
                            <h2 className="mb-0 font-monospace fw-bold">{summary.B} <span className="fs-6 text-muted fw-normal font-sans-serif">Items</span></h2>
                            <small className="text-muted">Moderate revenue.</small>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm bg-secondary bg-opacity-10 h-100 rounded-3">
                        <div className="card-body">
                            <h6 className="text-secondary fw-bold">Class C (Bottom 5%)</h6>
                            <h2 className="mb-0 font-monospace fw-bold">{summary.C} <span className="fs-6 text-muted fw-normal font-sans-serif">Items</span></h2>
                            <small className="text-muted">Low revenue. Minimize stock.</small>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm bg-primary bg-opacity-10 h-100 rounded-3">
                        <div className="card-body">
                            <h6 className="text-primary fw-bold">Total Analyzed</h6>
                            <h2 className="mb-0 font-monospace fw-bold">{summary.Total} <span className="fs-6 text-muted fw-normal font-sans-serif">Items</span></h2>
                            <small className="text-muted">Based on 30-day history.</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- DATA TABLE --- */}
            <div className="card border-0 shadow-sm mt-4 rounded-3 overflow-hidden">
                <div className="card-header bg-white border-bottom-0 pt-4 pb-3">
                    <h6 className="fw-bold mb-0 text-dark"><i className="bi bi-bar-chart-steps me-2 text-primary"></i>{viewMode === 'PARENT' ? 'Parent Design Breakdown' : 'Exact SKU Breakdown'}</h6>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        {/* FIXED: Increased minWidth to 700px to ensure the progress bar columns never overlap the text on small screens */}
                        <table className="table table-hover align-middle mb-0" style={{ minWidth: '700px' }}>
                            <thead className="table-light text-muted small uppercase">
                                <tr>
                                    <th className="ps-4 text-nowrap">SKU Code</th>
                                    <th className="text-nowrap">Classification</th>
                                    <th className="text-nowrap">Total Revenue</th>
                                    <th className="text-nowrap pe-4">Contribution</th>
                                </tr>
                            </thead>
                            <tbody>
                                {snapshotData.map((row) => (
                                    <tr key={row.id}>
                                        <td className="ps-4 fw-bold text-dark font-monospace small text-nowrap">{row.metricKey}</td>
                                        <td>
                                            <span className={`badge px-3 py-2 rounded-pill font-monospace ${
                                                row.parsedMetrics.category === 'A' ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25' : 
                                                row.parsedMetrics.category === 'B' ? 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25' : 'bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25'
                                            }`}>
                                                Class {row.parsedMetrics.category}
                                            </span>
                                        </td>
                                        <td className="fw-bold text-dark font-monospace text-nowrap">₹{row.parsedMetrics.revenue.toLocaleString('en-IN')}</td>
                                        <td className="pe-4">
                                            <div className="d-flex align-items-center gap-3">
                                                <span className="font-monospace small fw-medium text-muted" style={{ minWidth: '55px' }}>{row.parsedMetrics.contributionPct.toFixed(2)}%</span>
                                                <div className="progress flex-grow-1" style={{ maxWidth: '150px', height: '6px' }}>
                                                    <div className={`progress-bar ${
                                                        row.parsedMetrics.category === 'A' ? 'bg-success' : 
                                                        row.parsedMetrics.category === 'B' ? 'bg-warning' : 'bg-secondary'
                                                    }`} 
                                                         style={{ width: `${row.parsedMetrics.contributionPct}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {snapshotData.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="text-center p-5 text-muted small fw-medium">
                                            <i className="bi bi-inboxes d-block fs-3 mb-2 opacity-50"></i>
                                            No ABC data available. Trigger a manual sync to generate a new snapshot.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>  
        </div>
    );
};

export default AbcDashboard;