import { useState, useEffect } from 'react';
import axios from 'axios';

const StockoutDashboard = () => {
    // 1. All State Definitions at the very top
    const [snapshotData, setSnapshotData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({ critical: 0, warning: 0, healthy: 0 });

    // 2. Initial Load
    useEffect(() => {
        fetchStockoutData();
    }, []);

    // 3. Function to pull data from the database
    const fetchStockoutData = async () => {
        try {
            const res = await axios.get("http://localhost:8080/api/catalog/analytics/stockout");
            
            // Parse the JSON string stored in the database back into an object
            const parsedData = res.data.map(row => ({
                ...row,
                parsedMetrics: JSON.parse(row.metricValue)
            }));
            
            // Sort so CRITICAL items are at the top of the table
            parsedData.sort((a, b) => a.parsedMetrics.doi - b.parsedMetrics.doi);
            
            setSnapshotData(parsedData);
            
            // Calculate summary stats
            const stats = { critical: 0, warning: 0, healthy: 0 };
            parsedData.forEach(item => {
                if (item.parsedMetrics.status === 'CRITICAL_STOCKOUT') stats.critical++;
                else if (item.parsedMetrics.status === 'WARNING_LOW_STOCK') stats.warning++;
                else stats.healthy++;
            });
            setSummary(stats);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching Stockout Analytics", error);
            setLoading(false);
        }
    };

    // 4. Function for the "Force Refresh" Button
    const handleForceRefresh = async () => {
        setLoading(true);
        try {
            // Step 1: Tell Spring Boot to recalculate the stockout snapshot
            await axios.post('http://localhost:8080/api/catalog/analytics/trigger-stockout');
            console.log("Stockout snapshot recalculated successfully");
            
            // Step 2: Fetch the brand new data and show it on the UI
            await fetchStockoutData(); 
        } catch (error) {
            console.error("Error refreshing data:", error);
            alert("Failed to refresh data. Please check the server.");
            setLoading(false);
        }
    };

    // 5. Early Return for Loading State
    if (loading && snapshotData.length === 0) {
        return <div className="p-5 text-center"><span className="spinner-border text-danger"></span> Loading Predictions...</div>;
    }

    // 6. UI Render
    return (
        <div className="container-fluid p-3 p-md-4 bg-light" style={{ minHeight: '100vh' }}>
            
            {/* --- MOBILE RESPONSIVE HEADER --- */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 bg-white p-3 rounded shadow-sm gap-3">
                <div>
                    <h3 className="fw-bold mb-0">Stockout Predictor</h3>
                    <p className="text-muted small mb-0">Days of Inventory (DOI) vs 30-Day Sales Velocity</p>
                </div>
                
                {/* The updated Force Refresh Button - Full width on mobile */}
                <button 
                    className="btn btn-outline-primary btn-sm fw-bold shadow-sm d-flex align-items-center justify-content-center w-100 w-md-auto"
                    onClick={handleForceRefresh} 
                    disabled={loading}
                    style={{ padding: '8px 16px' }}
                >
                    <i className={`bi bi-arrow-clockwise me-2 ${loading ? 'spin-animation' : ''}`}></i>
                    {loading ? 'Syncing...' : 'Refresh'}
                </button>
            </div>

            {/* --- SUMMARY CARDS (100% width on phone, 33% on desktop) --- */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-lg-4">
                    <div className="card border-0 shadow-sm bg-danger bg-opacity-10 h-100">
                        <div className="card-body">
                            <h6 className="text-danger fw-bold"><i className="bi bi-exclamation-triangle-fill me-2"></i>Critical Stockout</h6>
                            <h2 className="mb-0">{summary.critical} <span className="fs-6 text-muted fw-normal">SKUs</span></h2>
                            <small className="text-muted">Less than 15 Days of Inventory left.</small>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-lg-4">
                    <div className="card border-0 shadow-sm bg-warning bg-opacity-10 h-100">
                        <div className="card-body">
                            <h6 className="text-warning text-dark fw-bold"><i className="bi bi-exclamation-circle-fill me-2"></i>Warning</h6>
                            <h2 className="mb-0">{summary.warning} <span className="fs-6 text-muted fw-normal">SKUs</span></h2>
                            <small className="text-muted">15 - 30 Days of Inventory left.</small>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-lg-4">
                    <div className="card border-0 shadow-sm bg-success bg-opacity-10 h-100">
                        <div className="card-body">
                            <h6 className="text-success fw-bold"><i className="bi bi-check-circle-fill me-2"></i>Healthy</h6>
                            <h2 className="mb-0">{summary.healthy} <span className="fs-6 text-muted fw-normal">SKUs</span></h2>
                            <small className="text-muted">Sufficient stock for current velocity.</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- DATA TABLE --- */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white pt-4 pb-0 border-bottom-0">
                    <h6 className="fw-bold">Procurement Action List</h6>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        {/* Added minWidth to prevent table columns from squishing on small screens */}
                        <table className="table table-hover align-middle mb-0" style={{ minWidth: '700px' }}>
                            <thead className="table-light">
                                <tr>
                                    <th className="ps-4 text-nowrap">SKU Code</th>
                                    <th className="text-nowrap">30-Day Unit Sold</th>
                                    <th className="text-nowrap">Daily Velocity</th>
                                    <th className="text-nowrap">Days of Inventory (DOI)</th>
                                    <th className="text-nowrap">Action Required</th>
                                </tr>
                            </thead>
                            <tbody>
                                {snapshotData.map((row) => (
                                    <tr key={row.id}>
                                        <td className="ps-4 fw-bold text-nowrap">{row.metricKey}</td>
                                        <td>{row.parsedMetrics.units_sold} units</td>
                                        <td>{row.parsedMetrics.velocity.toFixed(1)} units/day</td>
                                        <td>
                                            <span className={`fw-bold ${row.parsedMetrics.doi <= 15 ? 'text-danger' : row.parsedMetrics.doi <= 30 ? 'text-warning text-dark' : 'text-success'}`}>
                                                {row.parsedMetrics.doi} Days
                                            </span>
                                        </td>
                                        <td>
                                            {row.parsedMetrics.status === 'CRITICAL_STOCKOUT' && <span className="badge bg-danger">Manufacture Immediately</span>}
                                            {row.parsedMetrics.status === 'WARNING_LOW_STOCK' && <span className="badge bg-warning text-dark">Plan Production</span>}
                                            {row.parsedMetrics.status === 'HEALTHY' && <span className="badge bg-success">No Action Needed</span>}
                                        </td>
                                    </tr>
                                ))}
                                {snapshotData.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="text-center p-5 text-muted">
                                            No stockout predictions found. Run the engine!
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

export default StockoutDashboard;