import { useState, useEffect } from 'react';
import axios from 'axios';

const AbcDashboard = () => {
    const [snapshotData, setSnapshotData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({ A: 0, B: 0, C: 0, Total: 0 });
    const [lastUpdated, setLastUpdated] = useState(null);
    
    // Tracks whether we are viewing exact SKUs or Parent Designs
    const [viewMode, setViewMode] = useState('CHILD'); 

    useEffect(() => {
        fetchAbcData();
    }, [viewMode]);

    const fetchAbcData = async () => {
        setLoading(true);
        try {
            // Fetches data dynamically based on the toggle switch
            const res = await axios.get(`http://localhost:8080/api/catalog/analytics/abc?viewType=${viewMode}`);
            
            // Parses the JSON string from the backend into a usable JavaScript object
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

    if (loading) {
        return <div className="p-5 text-center"><span className="spinner-border text-primary"></span> Loading Analytics...</div>;
    }

    const fetchData= async () =>{
        setLoading(true);

        try{
            const res = await axios.get('http://localhost:8080/api/catalog/analytics/trigger-abc');
            console.log("Data refreshed successfully");

        }
        catch(error){
            console.error("Error refreshing data:",error);
            alert("Failed to refresh data. Please check the server.");
        }finally{
            setLoading(false);
        }
    };
    
    useEffect(()=>{
        fetchData;
    },[]);

    return (
        <div className="container-fluid p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold mb-0">ABC Inventory Analysis</h3>
                    <p className="text-muted small mb-0">Revenue contribution (80/15/5 Rule)</p>
                    {lastUpdated && (
                        <span className="badge bg-light text-secondary border mt-1">
                            <i className="bi bi-clock-history me-1"></i> Data as of: {lastUpdated}
                        </span>
                    )}
                </div>
                
                <div className="d-flex gap-2">
                    {/* The Parent/Child Toggle Switch */}
                    <div className="btn-group shadow-sm" role="group">
                        <button 
                            className={`btn btn-sm ${viewMode === 'CHILD' ? 'btn-dark' : 'btn-outline-dark'}`}
                            onClick={() => setViewMode('CHILD')}
                        >
                            <i className="bi bi-tag me-1"></i> Child SKUs
                        </button>
                        <button 
                            className={`btn btn-sm ${viewMode === 'PARENT' ? 'btn-dark' : 'btn-outline-dark'}`}
                            onClick={() => setViewMode('PARENT')}
                        >
                            <i className="bi bi-diagram-3 me-1"></i> Parent Designs
                        </button>
                    </div>
                    
                    <button className="btn btn-outline-primary btn-sm fw-bold shadow-sm d-flex align-items-center"
                    onClick={() => fetchData()} // Replace with your actual fetch function name
                    disabled={loading}>
                    <i className={`bi bi-arrow-clockwise me-2 ${loading ? 'spin-animation' : ''}`}></i>
                    {loading ? 'Syncing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* --- SUMMARY CARDS --- */}
            <div className="row g-3 mb-4">
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm bg-success bg-opacity-10">
                        <div className="card-body">
                            <h6 className="text-success fw-bold">Class A (Top 80%)</h6>
                            <h2 className="mb-0">{summary.A} <span className="fs-6 text-muted fw-normal">Items</span></h2>
                            <small className="text-muted">High revenue drivers.</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm bg-warning bg-opacity-10">
                        <div className="card-body">
                            <h6 className="text-warning fw-bold">Class B (Next 15%)</h6>
                            <h2 className="mb-0">{summary.B} <span className="fs-6 text-muted fw-normal">Items</span></h2>
                            <small className="text-muted">Moderate revenue.</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm bg-secondary bg-opacity-10">
                        <div className="card-body">
                            <h6 className="text-secondary fw-bold">Class C (Bottom 5%)</h6>
                            <h2 className="mb-0">{summary.C} <span className="fs-6 text-muted fw-normal">Items</span></h2>
                            <small className="text-muted">Low revenue. Minimize stock.</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm bg-primary bg-opacity-10">
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
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="ps-4">SKU Code</th>
                                    <th>Classification</th>
                                    <th>Total Revenue</th>
                                    <th>Contribution</th>
                                </tr>
                            </thead>
                            <tbody>
                                {snapshotData.map((row) => (
                                    <tr key={row.id}>
                                        <td className="ps-4 fw-bold">{row.metricKey}</td>
                                        <td>
                                            <span className={`badge ${
                                                row.parsedMetrics.category === 'A' ? 'bg-success' : 
                                                row.parsedMetrics.category === 'B' ? 'bg-warning text-dark' : 'bg-secondary'
                                            }`}>
                                                Class {row.parsedMetrics.category}
                                            </span>
                                        </td>
                                        <td className="fw-medium">₹{row.parsedMetrics.revenue.toLocaleString('en-IN')}</td>
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                <span>{row.parsedMetrics.contributionPct.toFixed(2)}%</span>
                                                <div className="progress" style={{ width: '60px', height: '6px' }}>
                                                    <div className={`progress-bar ${row.parsedMetrics.category === 'A' ? 'bg-success' : 'bg-secondary'}`} 
                                                         style={{ width: `${row.parsedMetrics.contributionPct}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AbcDashboard;