import { useState, useEffect, useRef } from 'react';
import apiClient from '../apiClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const SalesDashboard = () => {
    const [dateFilter, setDateFilter] = useState('7D');
    const [channelFilter, setChannelFilter] = useState('ALL');
    const [loading, setLoading] = useState(false);

    // --- CUSTOM DATE RANGE STATE ---
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [customApplied, setCustomApplied] = useState(false); // true when custom range is active
    const pickerRef = useRef(null);

    const [kpiData, setKpiData] = useState({
        grossSales: 0, grossUnits: 0,
        cancellations: 0, cancelledUnits: 0,
        returns: 0, returnUnits: 0, rtoUnits: 0, rtvUnits: 0,
        netSales: 0, netUnits: 0
    });
    const [chartData, setChartData] = useState([]);
    const [productData, setProductData] = useState([]);

    const PIE_COLORS = ['#1E3A8A', '#7F1D1D', '#F5A623', '#10B981', '#6B7280'];

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

    // Close picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) {
                setShowCustomPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Re-fetch whenever preset filter or channel changes
    useEffect(() => {
        if (!customApplied) {
            fetchDashboardData(dateFilter, channelFilter, null, null);
        }
    }, [dateFilter, channelFilter]);

    // Re-fetch when channel changes while custom range is active
    useEffect(() => {
        if (customApplied && customFrom && customTo) {
            fetchDashboardDataCustom(customFrom, customTo, channelFilter);
        }
    }, [channelFilter]);

    const fetchDashboardData = async (date, channel, fromDate, toDate) => {
        setLoading(true);
        const days = getDaysFromFilter(date);
        try {
            const res = await apiClient.get(`/api/catalog/analytics/sales-overview?days=${days}&channel=${channel}`);
            setKpiData(res.data);
            setChartData(res.data.dailyTrends || []);
            setProductData(res.data.topProducts || []);
        } catch (error) {
            console.error("Error fetching Sales Overview", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDashboardDataCustom = async (from, to, channel) => {
        setLoading(true);
        try {
            const res = await apiClient.get(
                `/api/catalog/analytics/sales-overview?fromDate=${from}&toDate=${to}&channel=${channel}`
            );
            setKpiData(res.data);
            setChartData(res.data.dailyTrends || []);
            setProductData(res.data.topProducts || []);
        } catch (error) {
            console.error("Error fetching Sales Overview (custom range)", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyCustomRange = () => {
        if (!customFrom || !customTo) {
            alert('Please select both From and To dates.');
            return;
        }
        if (new Date(customFrom) > new Date(customTo)) {
            alert('Start date cannot be after end date.');
            return;
        }
        setCustomApplied(true);
        setShowCustomPicker(false);
        fetchDashboardDataCustom(customFrom, customTo, channelFilter);
    };

    const handleClearCustomRange = () => {
        setCustomApplied(false);
        setCustomFrom('');
        setCustomTo('');
        setDateFilter('7D');
        setShowCustomPicker(false);
        fetchDashboardData('7D', channelFilter, null, null);
    };

    const handlePresetClick = (range) => {
        setCustomApplied(false);
        setCustomFrom('');
        setCustomTo('');
        setShowCustomPicker(false);
        setDateFilter(range);
    };

    // Label shown in the active custom button
    const customRangeLabel = customApplied
        ? `${customFrom} → ${customTo}`
        : 'Custom Range';

    const formatRupees = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="container-fluid p-3 p-md-4 bg-light" style={{ minHeight: '100vh' }}>

            <style>{`
                /* Custom date picker popover */
                .custom-date-picker {
                    position: absolute;
                    top: calc(100% + 8px);
                    right: 0;
                    background: #fff;
                    border: 1px solid #dee2e6;
                    border-radius: 12px;
                    padding: 16px;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
                    z-index: 999;
                    min-width: 300px;
                }
                .custom-date-picker h6 {
                    font-size: 13px;
                    font-weight: 700;
                    color: #212529;
                    margin-bottom: 12px;
                }
                .custom-date-picker label {
                    font-size: 11px;
                    font-weight: 600;
                    color: #6c757d;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 4px;
                }
                .custom-date-picker input[type="date"] {
                    width: 100%;
                    padding: 7px 10px;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    font-size: 13px;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .custom-date-picker input[type="date"]:focus {
                    border-color: #0d6efd;
                }
                .custom-date-picker .picker-arrow {
                    text-align: center;
                    color: #6c757d;
                    font-size: 18px;
                    line-height: 1;
                    padding-top: 22px;
                }
                .custom-date-picker .picker-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 14px;
                }
                .custom-date-picker .picker-actions .btn {
                    flex: 1;
                    font-size: 12px;
                    font-weight: 600;
                    padding: 7px;
                }
                /* Active custom range button */
                .btn-custom-active {
                    background: #0d6efd !important;
                    color: #fff !important;
                    border-color: #0d6efd !important;
                    font-weight: 700 !important;
                    max-width: 200px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .custom-range-wrapper { position: relative; }

                @media (max-width: 576px) {
                    .custom-date-picker {
                        right: auto;
                        left: 0;
                        min-width: 280px;
                    }
                }
            `}</style>

            {/* TOP BAR */}
            <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center mb-4 bg-white p-3 rounded shadow-sm gap-3">
                <h5 className="mb-0 fw-bold">Performance Overview</h5>

                <div className="d-flex flex-column flex-md-row align-items-md-center gap-3 w-100 w-xl-auto">

                    {/* Marketplace Dropdown */}
                    <div className="d-flex align-items-center w-100 w-md-auto">
                        <i className="bi bi-shop text-muted me-2"></i>
                        <select
                            className="form-select form-select-sm shadow-sm fw-bold bg-light flex-grow-1"
                            style={{ minWidth: '150px', cursor: 'pointer' }}
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

                    <div className="d-none d-md-block border-start mx-1" style={{ height: '24px' }}></div>

                    {/* Date Filter Buttons */}
                    <div className="d-flex flex-wrap gap-1 shadow-sm rounded w-100 w-md-auto align-items-center">
                        {['TODAY', '7D', '30D', '90D', '180D', '360D', 'LIFETIME'].map((range) => (
                            <button
                                key={range}
                                className={`btn btn-sm flex-grow-1 flex-md-grow-0 ${!customApplied && dateFilter === range ? 'btn-dark fw-bold' : 'btn-outline-dark'}`}
                                onClick={() => handlePresetClick(range)}
                                disabled={loading}
                            >
                                {range === '7D' ? 'Last 7 Days' : range}
                            </button>
                        ))}

                        {/* ── CUSTOM RANGE BUTTON + PICKER ── */}
                        <div className="custom-range-wrapper" ref={pickerRef}>
                            <button
                                className={`btn btn-sm flex-grow-1 flex-md-grow-0 ${customApplied ? 'btn-custom-active' : 'btn-outline-primary'}`}
                                onClick={() => setShowCustomPicker(v => !v)}
                                disabled={loading}
                                title={customApplied ? customRangeLabel : 'Pick a custom date range'}
                            >
                                <i className="bi bi-calendar-range me-1"></i>
                                {customApplied ? customRangeLabel : 'Custom'}
                            </button>

                            {/* Clear button when custom range is active */}
                            {customApplied && (
                                <button
                                    className="btn btn-sm btn-outline-secondary ms-1"
                                    onClick={handleClearCustomRange}
                                    title="Clear custom range"
                                    disabled={loading}
                                >
                                    <i className="bi bi-x-lg"></i>
                                </button>
                            )}

                            {/* Date Picker Popover */}
                            {showCustomPicker && (
                                <div className="custom-date-picker">
                                    <h6><i className="bi bi-calendar3 me-2 text-primary"></i>Select Date Range</h6>
                                    <div className="d-flex gap-2 align-items-end">
                                        <div style={{ flex: 1 }}>
                                            <label>From</label>
                                            <input
                                                type="date"
                                                value={customFrom}
                                                max={customTo || undefined}
                                                onChange={(e) => setCustomFrom(e.target.value)}
                                            />
                                        </div>
                                        <div className="picker-arrow">→</div>
                                        <div style={{ flex: 1 }}>
                                            <label>To</label>
                                            <input
                                                type="date"
                                                value={customTo}
                                                min={customFrom || undefined}
                                                max={new Date().toISOString().split('T')[0]}
                                                onChange={(e) => setCustomTo(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    {/* Quick shortcuts inside picker */}
                                    <div className="d-flex gap-1 mt-2 flex-wrap">
                                        {[
                                            { label: 'This Month', days: 'thisMonth' },
                                            { label: 'Last Month', days: 'lastMonth' },
                                            { label: 'This Quarter', days: 'thisQuarter' },
                                        ].map(({ label, days }) => (
                                            <button
                                                key={label}
                                                className="btn btn-xs btn-outline-secondary"
                                                style={{ fontSize: '11px', padding: '3px 8px' }}
                                                onClick={() => {
                                                    const now = new Date();
                                                    let from, to;
                                                    if (days === 'thisMonth') {
                                                        from = new Date(now.getFullYear(), now.getMonth(), 1);
                                                        to = now;
                                                    } else if (days === 'lastMonth') {
                                                        from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                                                        to = new Date(now.getFullYear(), now.getMonth(), 0);
                                                    } else if (days === 'thisQuarter') {
                                                        const q = Math.floor(now.getMonth() / 3);
                                                        from = new Date(now.getFullYear(), q * 3, 1);
                                                        to = now;
                                                    }
                                                    const fmt = (d) => d.toISOString().split('T')[0];
                                                    setCustomFrom(fmt(from));
                                                    setCustomTo(fmt(to));
                                                }}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="picker-actions">
                                        <button className="btn btn-outline-secondary" onClick={() => setShowCustomPicker(false)}>Cancel</button>
                                        <button className="btn btn-primary" onClick={handleApplyCustomRange}>
                                            <i className="bi bi-check2 me-1"></i>Apply
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {loading && (
                        <div className="text-center w-100 w-md-auto">
                            <span className="spinner-border spinner-border-sm text-primary"></span>
                        </div>
                    )}
                </div>
            </div>

            {/* KPI RIBBON */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <h6 className="text-muted mb-2"><i className="bi bi-graph-up me-2"></i>Gross Sales</h6>
                            <h3 className="fw-bold mb-0 text-primary">{formatRupees(kpiData.grossSales)}</h3>
                            <span className="fs-6 text-muted fw-normal">{kpiData.grossUnits} units ordered</span>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm h-100 border-start border-danger border-4">
                        <div className="card-body">
                            <h6 className="text-muted mb-2"><i className="bi bi-x-circle me-2"></i>Cancellations</h6>
                            <h3 className="fw-bold mb-0 text-danger">{formatRupees(kpiData.cancellations)}</h3>
                            <span className="fs-6 text-muted fw-normal">{kpiData.cancelledUnits} units cancelled</span>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm h-100 border-start border-warning border-4">
                        <div className="card-body">
                            <h6 className="text-muted mb-2"><i className="bi bi-arrow-return-left me-2"></i>Returns Breakdown</h6>
                            <h3 className="fw-bold mb-0 text-warning text-dark">{formatRupees(kpiData.returns)}</h3>
                            <div className="d-flex justify-content-between mt-2 small">
                                <div><span className="badge bg-danger bg-opacity-10 text-danger border">RTO: {kpiData.rtoUnits}</span></div>
                                <div><span className="badge bg-warning bg-opacity-10 text-warning border border-warning">RTV: {kpiData.rtvUnits}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm h-100 border-start border-success border-4 bg-success bg-opacity-10">
                        <div className="card-body">
                            <h6 className="text-success fw-bold mb-2"><i className="bi bi-check-circle-fill me-2"></i>Net Sales</h6>
                            <h3 className="fw-bold mb-0 text-success">{formatRupees(kpiData.netSales)}</h3>
                            <span className="fs-6 text-success fw-normal">{kpiData.netUnits} units delivered</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* LINE + DONUT */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-lg-8">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white pt-3 pb-0 border-0 d-flex justify-content-between align-items-center">
                            <h6 className="fw-bold mb-0">Daily Performance Trend</h6>
                            <div className="d-flex gap-2">
                                {channelFilter !== 'ALL' && <span className="badge bg-dark">{channelFilter}</span>}
                                {customApplied && (
                                    <span className="badge bg-primary">
                                        <i className="bi bi-calendar-range me-1"></i>
                                        {customFrom} → {customTo}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="card-body" style={{ height: '380px' }}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                        <XAxis dataKey="date" tick={{fontSize: 12}} tickMargin={10} axisLine={false} tickLine={false} />
                                        <YAxis tickFormatter={(val) => `₹${val/1000}k`} tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                                        <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                        <Line type="monotone" dataKey="gross" stroke="#1E3A8A" strokeWidth={3} name="Gross Sales" dot={{r: 4}} activeDot={{r: 6}} />
                                        <Line type="monotone" dataKey="net" stroke="#10B981" strokeWidth={3} name="Net Sales" dot={{r: 4}} />
                                        <Line type="monotone" dataKey="returns" stroke="#F5A623" strokeWidth={2} name="Returns (₹)" dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="d-flex align-items-center justify-content-center h-100 text-muted">No chart data available.</div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="col-12 col-lg-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white pt-3 pb-0 border-0">
                            <h6 className="fw-bold"><i className="bi bi-pie-chart-fill me-2 text-primary"></i>Channel Split</h6>
                        </div>
                        <div className="card-body d-flex flex-column align-items-center justify-content-center" style={{ height: '380px' }}>
                            {kpiData.channelData && kpiData.channelData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={kpiData.channelData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value" nameKey="name">
                                            {kpiData.channelData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                                        <Legend verticalAlign="bottom" iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <span className="text-muted small">No channel data available</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* BAR CHART */}
            <div className="row g-3 mb-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white pt-3 pb-0 border-0">
                            <h6 className="fw-bold"><i className="bi bi-bar-chart-fill me-2 text-success"></i>Monthly Revenue Trends</h6>
                        </div>
                        <div className="card-body" style={{ height: '350px' }}>
                            {kpiData.monthlyData && kpiData.monthlyData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={kpiData.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                        <XAxis dataKey="month" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                                        <YAxis tickFormatter={(val) => `₹${val/1000}k`} tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{fill: '#f8f9fa'}} formatter={(value) => `₹${value.toLocaleString()}`} />
                                        <Bar dataKey="gross" fill="#1E3A8A" radius={[6, 6, 0, 0]} name="Gross Sales" barSize={40} />
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

            {/* PRODUCT TABLE */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white pt-4 pb-3 border-bottom d-flex justify-content-between align-items-center">
                    <h6 className="fw-bold mb-0">Top Selling Products</h6>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0" style={{ minWidth: '600px' }}>
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
                                        <td className="text-danger"><span className="fw-bold">{item.cancellations}</span> units</td>
                                        <td className="text-warning text-dark"><span className="fw-bold">{item.returns}</span> units</td>
                                        <td className="text-success fw-bold"><span className="fw-bold text-dark">{item.netUnits}</span> units delivered</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="text-center p-4 text-muted">No product sales data found for this period.</td>
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