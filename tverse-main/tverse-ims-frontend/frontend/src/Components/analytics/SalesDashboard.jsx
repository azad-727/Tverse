import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
const SalesDashboard = () => {
    const [dateFilter, setDateFilter] = useState('7D');
    const [channelFilter, setChannelFilter] = useState('ALL'); // NEW: Channel State
    const [loading, setLoading] = useState(false);
    
    // 1. Master State for everything coming from Spring Boot
    const [kpiData, setKpiData] = useState({
        grossSales: 0, grossUnits: 0,
        cancellations: 0, cancelledUnits: 0,
        returns: 0, returnUnits: 0, rtoUnits: 0, rtvUnits: 0,
        netSales: 0, netUnits: 0
    });
    const [chartData, setChartData] = useState([]);     // For the Line Chart
    const [productData, setProductData] = useState([]); // For the Bottom Table

    const getDaysFromFilter = (filter) => {
        switch (filter) {
            case 'TODAY': return 1; 
            case '7D': return 7;
            case '30D': return 30;
            case '90D': return 90;
            case '180D': return 180;
            case '360D': return 360;
            case 'LIFETIME': return 9999;
            default: return 7;
        }
    };

    // NEW: Trigger a re-fetch if EITHER the date or the channel changes
    useEffect(() => {
        fetchDashboardData(dateFilter, channelFilter);
    }, [dateFilter, channelFilter]);

    const fetchDashboardData = async (date, channel) => {
        setLoading(true);
        const days = getDaysFromFilter(date);
        try {
            // NEW: Pass both days and channel to the robust Spring Boot API
            const res = await axios.get(`http://localhost:8080/api/catalog/analytics/sales-overview?days=${days}&channel=${channel}`);
            
            // 2. Populate all three sections instantly!
            setKpiData(res.data);
            setChartData(res.data.dailyTrends || []);
            setProductData(res.data.topProducts || []);
            
            setLoading(false);
        } catch (error) {
            console.error("Error fetching Sales Overview", error);
            setLoading(false);
        }
    };

    const formatRupees = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="container-fluid p-4 bg-light" style={{ minHeight: '100vh' }}>
            
            {/* --- TOP BAR: FILTERS --- */}
            <div className="d-flex justify-content-between align-items-center mb-4 bg-white p-3 rounded shadow-sm">
                <h5 className="mb-0 fw-bold">Performance Overview</h5>
                
                <div className="d-flex align-items-center gap-3">
                    
                    {/* --- NEW: MARKETPLACE DROPDOWN --- */}
                    <div className="d-flex align-items-center">
                        <i className="bi bi-shop text-muted me-2"></i>
                        <select 
                            className="form-select form-select-sm shadow-sm fw-bold bg-light" 
                            style={{ width: '160px', cursor: 'pointer' }}
                            value={channelFilter}
                            onChange={(e) => setChannelFilter(e.target.value)}
                            disabled={loading}
                        >
                            <option value="ALL">All Marketplaces</option>
                            <option value="AMAZON">Amazon</option>
                            <option value="MEESHO">Meesho</option>
                            <option value="FLIPKART">Flipkart</option>
                            <option value="MYNTRA">Myntra</option>
                        </select>
                    </div>

                    <div className="border-start ms-1 me-1" style={{ height: '24px' }}></div>

                    {/* --- DATE FILTER BUTTONS --- */}
                    <div className="btn-group shadow-sm">
                        {['TODAY', '7D', '30D', '90D', '180D', '360D', 'LIFETIME'].map((range) => (
                            <button 
                                key={range}
                                className={`btn btn-sm ${dateFilter === range ? 'btn-dark fw-bold' : 'btn-outline-dark'}`}
                                onClick={() => setDateFilter(range)}
                                disabled={loading}
                            >
                                {range === '7D' ? 'Last 7 Days' : range}
                            </button>
                        ))}
                    </div>
                    
                    {loading && <span className="spinner-border spinner-border-sm text-primary ms-2"></span>}
                </div>
            </div>

            {/* --- LIVE KPI RIBBON --- */}
            <div className="row g-3 mb-4">
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <h6 className="text-muted mb-2"><i className="bi bi-graph-up me-2"></i>Gross Sales</h6>
                            <h3 className="fw-bold mb-0 text-primary">
                                {formatRupees(kpiData.grossSales)} 
                            </h3>
                            <span className="fs-6 text-muted fw-normal">{kpiData.grossUnits} units ordered</span>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100 border-start border-danger border-4">
                        <div className="card-body">
                            <h6 className="text-muted mb-2"><i className="bi bi-x-circle me-2"></i>Cancellations</h6>
                            <h3 className="fw-bold mb-0 text-danger">
                                {formatRupees(kpiData.cancellations)} 
                            </h3>
                            <span className="fs-6 text-muted fw-normal">{kpiData.cancelledUnits} units cancelled</span>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100 border-start border-warning border-4">
                        <div className="card-body">
                            <h6 className="text-muted mb-2"><i className="bi bi-arrow-return-left me-2"></i>Returns Breakdown</h6>
                            <h3 className="fw-bold mb-0 text-warning text-dark">
                                {formatRupees(kpiData.returns)} 
                            </h3>
                            <div className="d-flex justify-content-between mt-2 small">
                                <div><span className="badge bg-danger bg-opacity-10 text-danger border">RTO: {kpiData.rtoUnits} units</span></div>
                                <div><span className="badge bg-warning bg-opacity-10 text-warning border border-warning">RTV: {kpiData.rtvUnits} units</span></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100 border-start border-success border-4 bg-success bg-opacity-10">
                        <div className="card-body">
                            <h6 className="text-success fw-bold mb-2"><i className="bi bi-check-circle-fill me-2"></i>Net Sales</h6>
                            <h3 className="fw-bold mb-0 text-success">
                                {formatRupees(kpiData.netSales)} 
                            </h3>
                            <span className="fs-6 text-success fw-normal">{kpiData.netUnits} units delivered</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MIDDLE SECTION: CHARTS --- */}
            <div className="row g-3 mb-4">
                <div className="col-md-8">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white pt-3 pb-0 border-0 d-flex justify-content-between">
                            <h6 className="fw-bold">Daily Performance Trend</h6>
                            {channelFilter !== 'ALL' && <span className="badge bg-dark">{channelFilter}</span>}
                        </div>
                        {/* --- NEW: PIE & BAR CHARTS --- */}
            <div className="row g-3 mb-4">
                
                {/* Channel Distribution Pie Chart */}
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white pt-3 pb-0 border-0">
                            <h6 className="fw-bold"><i className="bi bi-pie-chart-fill me-2 text-primary"></i>Channel Split</h6>
                        </div>
                        <div className="card-body d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
                            {kpiData.channelData && kpiData.channelData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={kpiData.channelData}
                                            cx="50%" cy="50%"
                                            innerRadius={60} outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            nameKey="name"
                                            label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {/* Beautiful enterprise colors */}
                                            {kpiData.channelData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={['#4A90E2', '#50E3C2', '#F5A623', '#D0021B', '#9013FE'][index % 5]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <span className="text-muted small">No channel data available</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Top Selling Months Bar Chart */}
                <div className="col-md-8">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white pt-3 pb-0 border-0">
                            <h6 className="fw-bold"><i className="bi bi-bar-chart-fill me-2 text-success"></i>Monthly Revenue Trends</h6>
                        </div>
                        <div className="card-body" style={{ height: '300px' }}>
                            {kpiData.monthlyData && kpiData.monthlyData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={kpiData.monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                        <XAxis dataKey="month" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                                        <YAxis tickFormatter={(val) => `₹${val/1000}k`} tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{fill: '#f8f9fa'}} formatter={(value) => `₹${value.toLocaleString()}`} />
                                        <Bar dataKey="gross" fill="#4A90E2" radius={[4, 4, 0, 0]} name="Gross Sales" barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="d-flex align-items-center justify-content-center h-100 text-muted small">
                                    No monthly data available (Try expanding the date filter)
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
                        <div className="card-body" style={{ height: '350px' }}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                        <XAxis dataKey="date" tick={{fontSize: 12}} tickMargin={10} axisLine={false} tickLine={false} />
                                        <YAxis tickFormatter={(val) => `₹${val/1000}k`} tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                                        <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                                        <Legend iconType="circle" />
                                        <Line type="monotone" dataKey="gross" stroke="#4A90E2" strokeWidth={3} name="Gross Sales" dot={{r: 4}} activeDot={{r: 6}} />
                                        <Line type="monotone" dataKey="net" stroke="#50E3C2" strokeWidth={3} name="Net Sales" dot={{r: 4}} />
                                        <Line type="monotone" dataKey="returns" stroke="#F5A623" strokeWidth={2} name="Returns (₹)" dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                                    No chart data available for this period.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Regional mock left as a placeholder for later */}
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white pt-3 pb-2 border-bottom">
                            <h6 className="fw-bold text-danger"><i className="bi bi-geo-alt-fill me-2"></i>High Return Regions</h6>
                            <small className="text-muted">Places generating the most RTO/RTV</small>
                        </div>
                        <div className="card-body p-0">
                            <ul className="list-group list-group-flush">
                                <li className="list-group-item d-flex justify-content-between align-items-center p-3">
                                    <div><span className="fw-bold">Pending V2 Feature</span></div>
                                    <span className="badge bg-secondary rounded-pill">--</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- BOTTOM SECTION: LIVE SKU DATA TABLE --- */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white pt-4 pb-3 border-bottom d-flex justify-content-between align-items-center">
                    <h6 className="fw-bold mb-0">Top Selling Products</h6>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="ps-4">Product SKU</th>
                                    <th>Gross Sales</th>
                                    <th>Cancellations</th>
                                    <th>Returns (RTO+RTV)</th>
                                    <th className="text-success">Net Sales</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productData.length > 0 ? productData.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="ps-4 fw-bold text-primary">{item.sku}</td>
                                        <td>
                                            ₹{item.gross ? item.gross.toLocaleString() : '0'}
                                            <br/><small className="text-muted">{item.units} units</small>
                                        </td>
                                        <td className="text-danger">
                                            <span className="fw-bold">{item.cancellations}</span> units
                                        </td>
                                        <td className="text-warning">
                                            <span className="fw-bold">{item.returns}</span> units
                                        </td>
                                        <td className="text-success fw-bold">
                                            <span className="fw-bold text-dark">{item.netUnits}</span> units delivered
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="text-center p-4 text-muted">
                                            No product sales data found for this period.
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

export default SalesDashboard;