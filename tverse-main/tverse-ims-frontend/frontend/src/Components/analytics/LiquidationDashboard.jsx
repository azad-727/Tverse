import { useState, useEffect } from 'react';
import apiClient from '../apiClient';

const LiquidationDashboard = () => {
    // 1. Data States
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState('90'); 
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    
    // MISSING LINE ADDED HERE: State for dynamic categories
    const [availableCategories, setAvailableCategories] = useState([]);
    
    const [summary, setSummary] = useState({ star: 0, core: 0, slow: 0, dead: 0, total: 0 });

    // MISSING FUNCTION ADDED HERE: Fetch categories from Spring Boot on load
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await apiClient.get('/api/catalog/categories');
                setAvailableCategories(res.data);
            } catch (error) {
                console.error("Failed to load categories from database", error);
            }
        };
        fetchCategories();
    }, []);

    // 2. Fetch the actual Liquidation data
    useEffect(() => {
        fetchLifecycleData();
    }, [dateFilter, categoryFilter]);

    const fetchLifecycleData = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/api/catalog/analytics/liquidation?days=${dateFilter}&category=${categoryFilter}`);
            
            const fetchedData = res.data;
            setData(fetchedData);
            
            // Calculate summary for the KPI cards
            const stats = { star: 0, core: 0, slow: 0, dead: 0, total: fetchedData.length };
            fetchedData.forEach(item => {
                if (item.status === 'STAR') stats.star++;
                else if (item.status === 'CORE') stats.core++;
                else if (item.status === 'SLOW') stats.slow++;
                else if (item.status === 'DEAD_STOCK') stats.dead++;
            });
            setSummary(stats);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching Lifecycle Analytics", error);
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'STAR': return <span className="badge bg-success"><i className="bi bi-star-fill me-1"></i> Star (Top 5%)</span>;
            case 'CORE': return <span className="badge bg-primary">Core (Next 15%)</span>;
            case 'SLOW': return <span className="badge bg-warning text-dark">Slow Mover</span>;
            case 'DEAD_STOCK': return <span className="badge bg-danger"><i className="bi bi-exclamation-octagon-fill me-1"></i> Dead Stock</span>;
            default: return <span className="badge bg-secondary">Unknown</span>;
        }
    };

    return (
        <div className="container-fluid p-3 p-md-4 bg-light" style={{ minHeight: '100vh' }}>
            
            {/* --- MOBILE RESPONSIVE TOP FILTERS --- */}
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center mb-4 bg-white p-3 rounded shadow-sm gap-3">
                <div>
                    <h4 className="fw-bold mb-0 text-dark"><i className="bi bi-box-seam me-2 text-primary"></i>Products Tracker</h4>
                    <p className="text-muted small mb-0 mt-1">Identify top performers and liquidate dead stock.</p>
                </div>
                
                <div className="d-flex flex-column flex-md-row gap-3 w-100 w-lg-auto">
                    {/* Category Filter */}
                    <div className="d-flex align-items-center bg-light rounded px-2 border w-100 w-md-auto">
                        <i className="bi bi-tags text-muted me-2"></i>
                        <select 
                            className="form-select form-select-sm border-0 bg-transparent fw-bold text-dark shadow-none w-100" 
                            style={{ minWidth: '150px', cursor: 'pointer' }}
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="ALL">All Categories</option>
                            
                            {/* DYNAMIC MAPPING */}
                            {availableCategories.map((category) => (
                                <option key={category.id} value={category.name}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Timeframe Buttons */}
                    <div className="btn-group shadow-sm w-100 w-md-auto">
                        {['30', '90', '180'].map((days) => (
                            <button 
                                key={days}
                                className={`btn btn-sm w-100 ${dateFilter === days ? 'btn-dark fw-bold' : 'btn-outline-dark'}`}
                                onClick={() => setDateFilter(days)}
                                disabled={loading}
                            >
                                Last {days} Days
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- SUMMARY CARDS --- */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm bg-success bg-opacity-10 h-100">
                        <div className="card-body">
                            <h6 className="text-success fw-bold">Star Variants</h6>
                            <h2 className="mb-0">{summary.star} <span className="fs-6 text-muted fw-normal">SKUs</span></h2>
                            <small className="text-muted">Top 5% volume drivers.</small>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm bg-primary bg-opacity-10 h-100">
                        <div className="card-body">
                            <h6 className="text-primary fw-bold">Core Variants</h6>
                            <h2 className="mb-0">{summary.core} <span className="fs-6 text-muted fw-normal">SKUs</span></h2>
                            <small className="text-muted">Next 15% consistent sellers.</small>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm bg-warning bg-opacity-10 h-100">
                        <div className="card-body">
                            <h6 className="text-warning text-dark fw-bold">Slow Movers</h6>
                            <h2 className="mb-0">{summary.slow} <span className="fs-6 text-muted fw-normal">SKUs</span></h2>
                            <small className="text-muted">Requires marketing push.</small>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm bg-danger bg-opacity-10 h-100 border-start border-danger border-4">
                        <div className="card-body">
                            <h6 className="text-danger fw-bold">Dead Stock (0 Sales)</h6>
                            <h2 className="mb-0">{summary.dead} <span className="fs-6 text-muted fw-normal">SKUs</span></h2>
                            <small className="text-danger fw-bold">Prime for Liquidation.</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- DATA TABLE --- */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white pt-4 pb-0 border-bottom-0 d-flex justify-content-between">
                    <h6 className="fw-bold">Variant Lifecycle Roster</h6>
                    {loading && <span className="spinner-border spinner-border-sm text-primary"></span>}
                </div>
                <div className="card-body p-0 mt-3">
                    <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        <table className="table table-hover align-middle mb-0" style={{ minWidth: '700px' }}>
                            <thead className="table-light position-sticky top-0" style={{ zIndex: 1 }}>
                                <tr>
                                    <th className="ps-4 text-nowrap">Variant SKU</th>
                                    <th className="text-nowrap">Category</th>
                                    <th className="text-nowrap">Units Sold</th>
                                    <th className="text-nowrap">Revenue Generated</th>
                                    <th className="text-nowrap">Lifecycle Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length > 0 ? data.map((item, idx) => (
                                    <tr key={idx} className={item.status === 'DEAD_STOCK' ? 'bg-danger bg-opacity-10' : ''}>
                                        <td className="ps-4 fw-bold text-dark text-nowrap">{item.sku}</td>
                                        <td><span className="badge bg-light text-secondary border">{item.category}</span></td>
                                        <td className="fw-medium">{item.unitsSold} units</td>
                                        <td className="fw-medium text-success">
                                            ₹{item.revenue ? item.revenue.toLocaleString('en-IN') : '0'}
                                        </td>
                                        <td>{getStatusBadge(item.status)}</td>
                                    </tr>
                                )) : !loading && (
                                    <tr>
                                        <td colSpan="5" className="text-center p-5 text-muted">
                                            No variant data found for this category and timeframe.
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

export default LiquidationDashboard;