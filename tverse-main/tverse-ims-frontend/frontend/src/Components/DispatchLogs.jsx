import { useState, useEffect } from 'react';
import apiClient from './apiClient';

const DispatchLogs = () => {
    // 1. Data State
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // 2. Filter State
    const [filters, setFilters] = useState({
        fromDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], // Last 30 Days
        toDate: new Date().toISOString().split('T')[0], // Today
        channel: "",
        courier: "",
        staff: "",
        search: "" // For Barcodes
    });

    // 3. Dropdown Options State
    const [options, setOptions] = useState({ staff: [], channel: [], courier: [] });

    // --- INITIAL LOAD ---
    useEffect(() => {
        fetchOptions();
        handleApplyFilters(); // Load default data (last 30 days)
    }, []);

    // Helper: Load Dropdowns from Master Table
    const fetchOptions = async () => {
        try {
            const [staffRes, channelRes, courierRes] = await Promise.all([
                apiClient.get("/api/config/STAFF"),
                apiClient.get("/api/config/CHANNEL"),
                apiClient.get("/api/config/COURIER")
            ]);
            setOptions({ staff: staffRes.data, channel: channelRes.data, courier: courierRes.data });
        } catch (err) { console.error("Config Load Error", err); }
    };

    // --- ACTION: FETCH LOGS ---
    const handleApplyFilters = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        
        if(filters.fromDate) params.append("fromDate", filters.fromDate);
        if(filters.toDate) params.append("toDate", filters.toDate);
        if(filters.channel) params.append("channel", filters.channel);
        if(filters.courier) params.append("courier", filters.courier);
        if(filters.staff) params.append("staff", filters.staff);
        if(filters.search) params.append("search", filters.search);

        try {
            const res = await apiClient.get(`/api/dispatch/logs?${params.toString()}`);
            setLogs(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFilters({
            fromDate: "", toDate: "", channel: "", courier: "", staff: "", search: ""
        });
        // Trigger fetch after state update (or call fetch with empty params directly)
        // Ideally use useEffect on filters or just reload:
        window.location.reload(); 
    };

    return (
        <div className="container-fluid p-4 bg-white" style={{minHeight: '100vh'}}>
            
            {/* HEADER */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold mb-1">Dispatch Logs</h3>
                    <p className="text-muted small mb-0">Audit history of all scanned and packed orders.</p>
                </div>
                <div className="badge bg-light text-dark border p-2">
                    Total Records: {logs.length}
                </div>
            </div>

            {/* FILTER BAR (Reuse your CSS) */}
            <div className="filter-bar-container mb-4">
                <div className="filter-icon-box"><i className="bi bi-funnel-fill"></i></div>

                {/* Date Range */}
                <div className="date-range-group">
                    <input type="date" className="date-range-input" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} />
                    <span className="date-separator">to</span>
                    <input type="date" className="date-range-input" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} />
                </div>

                {/* Dynamic Dropdowns */}
                <select className="compact-select" value={filters.channel} onChange={e => setFilters({...filters, channel: e.target.value})}>
                    <option value="">All Channels</option>
                    {options.channel.map(o => <option key={o.id} value={o.value}>{o.value}</option>)}
                </select>

                <select className="compact-select" value={filters.courier} onChange={e => setFilters({...filters, courier: e.target.value})}>
                    <option value="">All Couriers</option>
                    {options.courier.map(o => <option key={o.id} value={o.value}>{o.value}</option>)}
                </select>

                <select className="compact-select" value={filters.staff} onChange={e => setFilters({...filters, staff: e.target.value})}>
                    <option value="">All Staff</option>
                    {options.staff.map(o => <option key={o.id} value={o.value}>{o.value}</option>)}
                </select>

                {/* Search */}
                <input 
                    type="text" 
                    className="compact-input" 
                    style={{minWidth: '200px'}}
                    placeholder="Search Tracking ID / Order ID"
                    value={filters.search}
                    onChange={e => setFilters({...filters, search: e.target.value})}
                />

                <button className="btn-apply ms-2" onClick={handleApplyFilters}>Filter</button>
                <span className="btn-reset" onClick={handleReset}>Reset</span>
            </div>

            {/* TABLE */}
            <div className="table-responsive border rounded">
                <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                        <tr className="small text-uppercase text-muted">
                            <th>Scan Time</th>
                            <th>Order id</th>
                            <th>Tracking ID (Horizontal)</th>
                            <th>Tracking ID (Vertical)</th>
                            <th>Product Sku</th>
                            <th>Staff</th>
                            <th>Channel</th>
                            <th>Courier</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="text-center p-5">Loading...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan="6" className="text-center p-5 text-muted">No logs found for this criteria.</td></tr>
                        ) : (
                            logs.map(log => (
                                <tr key={log.id}>
                                    <td className="small">
                                        <div className="fw-bold">{new Date(log.scanTime).toLocaleDateString()}</div>
                                        <div className="text-muted">{new Date(log.scanTime).toLocaleTimeString()}</div>
                                    </td>
                                    <td className="font-monospace text-primary">{log.orderId}</td>
                                    <td className="font-monospace text-primary">{log.horizontalBarcode}</td>
                                    <td className="font-monospace">{log.verticalBarcode}</td>
                                    <td className="font-monospace">{log.sku}</td>
                                    <td><span className="badge bg-light text-dark border">{log.staffName}</span></td>
                                    <td>{log.channel}</td>
                                    <td>{log.courierPartner}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DispatchLogs;