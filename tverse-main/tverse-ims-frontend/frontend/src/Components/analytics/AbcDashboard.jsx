import { useState, useEffect } from 'react';
import axios from 'axios';

const AbcDashboard = () => {
    const [snapshotData, setSnapshotData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({ A: 0, B: 0, C: 0, Total: 0 });

    useEffect(() => {
        fetchAbcData();
    }, []);

    const fetchAbcData = async () => {
        try {
            // Using localhost just like we fixed in your ProductDetail page
            const res = await axios.get("http://localhost:8080/api/catalog/analytics/abc");
            const data = res.data;
            
            setSnapshotData(data);
            
            // Calculate summary statistics for the top cards
            const stats = { A: 0, B: 0, C: 0, Total: data.length };
            data.forEach(item => {
                if (stats[item.metricValue] !== undefined) {
                    stats[item.metricValue]++;
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

    return (
        <div className="container-fluid p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold mb-0">ABC Inventory Analysis</h3>
                    <p className="text-muted small">Daily snapshot of revenue contribution by SKU (80/15/5 Rule)</p>
                </div>
                <button className="btn btn-outline-primary btn-sm" onClick={fetchAbcData}>
                    <i className="bi bi-arrow-clockwise"></i> Refresh
                </button>
            </div>

            {/* --- SUMMARY CARDS --- */}
            <div className="row g-3 mb-4">
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm bg-success bg-opacity-10">
                        <div className="card-body">
                            <h6 className="text-success fw-bold">Class A (Top 80%)</h6>
                            <h2 className="mb-0">{summary.A} <span className="fs-6 text-muted fw-normal">SKUs</span></h2>
                            <small className="text-muted">High revenue drivers. Never stock out.</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm bg-warning bg-opacity-10">
                        <div className="card-body">
                            <h6 className="text-warning fw-bold">Class B (Next 15%)</h6>
                            <h2 className="mb-0">{summary.B} <span className="fs-6 text-muted fw-normal">SKUs</span></h2>
                            <small className="text-muted">Moderate revenue. Standard reordering.</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm bg-secondary bg-opacity-10">
                        <div className="card-body">
                            <h6 className="text-secondary fw-bold">Class C (Bottom 5%)</h6>
                            <h2 className="mb-0">{summary.C} <span className="fs-6 text-muted fw-normal">SKUs</span></h2>
                            <small className="text-muted">Low revenue. Minimize holding costs.</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm bg-primary bg-opacity-10">
                        <div className="card-body">
                            <h6 className="text-primary fw-bold">Total Analyzed</h6>
                            <h2 className="mb-0">{summary.Total} <span className="fs-6 text-muted fw-normal">SKUs</span></h2>
                            <small className="text-muted">Based on 30-day historical window.</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- DATA TABLE --- */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
                    <h6 className="fw-bold">SKU Breakdown</h6>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="ps-4">SKU Code</th>
                                    <th>Classification</th>
                                    <th>Action Priority</th>
                                </tr>
                            </thead>
                            <tbody>
                                {snapshotData.map((row) => (
                                    <tr key={row.id}>
                                        <td className="ps-4 fw-bold">{row.metricKey}</td>
                                        <td>
                                            <span className={`badge ${
                                                row.metricValue === 'A' ? 'bg-success' : 
                                                row.metricValue === 'B' ? 'bg-warning text-dark' : 'bg-secondary'
                                            }`}>
                                                Class {row.metricValue}
                                            </span>
                                        </td>
                                        <td>
                                            {row.metricValue === 'A' && <span className="text-success small"><i className="bi bi-shield-check"></i> Strict Monitoring</span>}
                                            {row.metricValue === 'B' && <span className="text-warning small text-dark"><i className="bi bi-eye"></i> Periodic Review</span>}
                                            {row.metricValue === 'C' && <span className="text-muted small"><i className="bi bi-box-seam"></i> Bulk / Automated Order</span>}
                                        </td>
                                    </tr>
                                ))}
                                {snapshotData.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="text-center p-5 text-muted">
                                            No analytics found for today. Ensure the nightly Cron job has executed.
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