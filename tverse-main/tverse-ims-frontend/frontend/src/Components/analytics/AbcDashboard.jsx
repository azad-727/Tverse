import { useState, useEffect } from 'react';
import axios from 'axios';

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
            const res = await axios.get(`http://localhost:8080/api/catalog/analytics/abc?viewType=${viewMode}`);
            
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
            await axios.post('http://localhost:8080/api/catalog/analytics/trigger-abc');
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
            
            {/* --- MOBILE RESPONSIVE HEADER --- */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 bg-white p-3 rounded shadow-sm gap-3">
                <div>
                    <h3 className="fw-bold mb-0">ABC Inventory Analysis</h3>
                    <p className="text-muted small mb-0">Revenue contribution (80/15/5 Rule)</p>
                    {lastUpdated && (
                        <span className="badge bg-light text-secondary border mt-1 d-inline-block">
                            <i className="bi bi-clock-history me-1"></i> Data as of: {lastUpdated}
                        </span>
                    )}
                </div>
                
                <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-md-auto">
                    <div className="btn-group shadow-sm w-100 w-sm-auto" role="group">
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
                    
                    {/* The updated Force Refresh Button */}
                    <button 
                        className="btn btn-outline-primary btn-sm fw-bold shadow-sm d-flex align-items-center justify-content-center w-100 w-sm-auto"
                        onClick={handleForceRefresh} 
                        disabled={loading}
                    >
                        <i className={`bi bi-arrow-clockwise me-2 ${loading ? 'spin-animation' : ''}`}></i>
                        {loading ? 'Syncing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* --- SUMMARY CARDS (100% width on phone, 50% tablet, 25% desktop) --- */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm bg-success bg-opacity-10 h-100">
                        <div className="card-body">
                            <h6 className="text-success fw-bold">Class A (Top 80%)</h6>
                            <h2 className="mb-0">{summary.A} <span className="fs-6 text-muted fw-normal">Items</span></h2>
                            <small className="text-muted">High revenue drivers.</small>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm bg-warning bg-opacity-10 h-100">
                        <div className="card-body">
                            <h6 className="text-warning text-dark fw-bold">Class B (Next 15%)</h6>
                            <h2 className="mb-0">{summary.B} <span className="fs-6 text-muted fw-normal">Items</span></h2>
                            <small className="text-muted">Moderate revenue.</small>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm bg-secondary bg-opacity-10 h-100">
                        <div className="card-body">
                            <h6 className="text-secondary fw-bold">Class C (Bottom 5%)</h6>
                            <h2 className="mb-0">{summary.C} <span className="fs-6 text-muted fw-normal">Items</span></h2>
                            <small className="text-muted">Low revenue. Minimize stock.</small>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm bg-primary bg-opacity-10 h-100">
                        <div className="card-body">
                            <h6 className="text-primary fw-bold">Total Analyzed</h6>
                            <h2 className="mb-0">{summary.Total} <span className="fs-6 text-muted fw-normal">Items</span></h2>
                            <small className="text-muted">Based on 30-day history.</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- DATA TABLE --- */}
            <div className="card border-0 shadow-sm mt-4">
                <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
                    <h6 className="fw-bold">{viewMode === 'PARENT' ? 'Parent Design Breakdown' : 'Exact SKU Breakdown'}</h6>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0" style={{ minWidth: '600px' }}>
                            <thead className="table-light">
                                <tr>
                                    <th className="ps-4 text-nowrap">SKU Code</th>
                                    <th className="text-nowrap">Classification</th>
                                    <th className="text-nowrap">Total Revenue</th>
                                    <th className="text-nowrap">Contribution</th>
                                </tr>
                            </thead>
                            <tbody>
                                {snapshotData.map((row) => (
                                    <tr key={row.id}>
                                        <td className="ps-4 fw-bold text-nowrap">{row.metricKey}</td>
                                        <td>
                                            <span className={`badge ${
                                                row.parsedMetrics.category === 'A' ? 'bg-success' : 
                                                row.parsedMetrics.category === 'B' ? 'bg-warning text-dark' : 'bg-secondary'
                                            }`}>
                                                Class {row.parsedMetrics.category}
                                            </span>
                                        </td>
                                        <td className="fw-medium text-nowrap">₹{row.parsedMetrics.revenue.toLocaleString('en-IN')}</td>
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                <span style={{ minWidth: '45px' }}>{row.parsedMetrics.contributionPct.toFixed(2)}%</span>
                                                <div className="progress w-100" style={{ maxWidth: '100px', height: '6px' }}>
                                                    <div className={`progress-bar ${row.parsedMetrics.category === 'A' ? 'bg-success' : 'bg-secondary'}`} 
                                                         style={{ width: `${row.parsedMetrics.contributionPct}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {snapshotData.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="text-center p-5 text-muted">
                                            No ABC data available. Try refreshing.
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