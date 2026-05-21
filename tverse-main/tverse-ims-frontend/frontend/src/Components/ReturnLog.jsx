import { useState, useEffect } from 'react';
import axios from 'axios';

const ReturnLogs = () => {
    const [logs, setLogs] = useState([]);
    const [filters, setFilters] = useState({
        fromDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0],
        status: "",
        search: "",
        channel:"",
        staff:"",
        courier:""
    });


    const fetchLogs = async () => {
        try {
            const params = new URLSearchParams(filters);
            console.log(params);
            const res = await axios.get(`http://localhost:8080/api/returns/logs?${params}`);
            setLogs(res.data);
        } catch (err) { console.error(err); }
    };

    const[options,setOptions]= useState({staff:[],channel:[],courier:[]});

        useEffect(() => { fetchLogs();
        fetchOptions();
     }, []);

    const fetchOptions = async () => {
        try{
            const [staffRes,channelRes,courierRes]=await Promise.all([
                axios.get("http://localhost:8080/api/config/STAFF"),
                axios.get("http://localhost:8080/api/config/CHANNEL"),
                axios.get("http://localhost:8080/api/config/COURIER")
            ]);
        setOptions({ staff:staffRes.data, channel:channelRes.data, courier:courierRes.data});

        }catch(e){
            console.error("Config Load Error", e);
        }
    };
    console.log(options);
    return (
        <div className="container-fluid p-4 bg-white" style={{minHeight:'100vh'}}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold">RMA Logs</h3>
                <button className="btn btn-outline-dark btn-sm" onClick={() => window.history.back()}>Back to Station</button>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar-container mb-4">
                <div className="date-range-group">
                    <input type="date" className="date-range-input" value={filters.fromDate} onChange={e=>setFilters({...filters, fromDate: e.target.value})} />
                    <span className="date-separator">to</span>
                    <input type="date" className="date-range-input" value={filters.toDate} onChange={e=>setFilters({...filters, toDate: e.target.value})} />
                </div>
                <select className="compact-select" value={filters.status} onChange={e=>setFilters({...filters, status: e.target.value})}>
                    <option value="">All Status</option>
                    <option value="QC_PASS">QC Pass</option>
                    <option value="QC_FAIL">QC Fail</option>
                </select>
                <select className="compact-select" value={filters.channel} onChange={e => setFilters({...filters, channel: e.target.value})}>
                    <option value="">All Channels</option>
                    {options.channel.map(o => <option key={o.id} value={o.value}>{o.value}</option>)}
                </select>
                <select className="compact-select" value={filters.courier} onChange={e => setFilters({...filters, courier: e.target.value})}>
                    <option value="">All Courier</option>
                    {options.courier.map(o => <option key={o.id} value={o.value}>{o.value}</option>)}
                </select>
                <select className="compact-select" value={filters.staff} onChange={e => setFilters({...filters, staff: e.target.value})}>
                    <option value="">All Staff</option>
                    {options.staff.map(o => <option key={o.id} value={o.value}>{o.value}</option>)}
                </select>
                

                <input type="text" className="compact-input" placeholder="Search Tracking/SKU" value={filters.search} onChange={e=>setFilters({...filters, search: e.target.value})} />
                <button className="btn-apply ms-2" onClick={fetchLogs}>Filter</button>
            </div>

            {/* Table */}
            <div className="table-responsive border rounded">
                <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                        <tr>
                            <th>Date</th>
                            <th>Channel</th>
                            <th>Courier</th>
                            <th>Tracking ID</th>
                            <th>SKU</th>
                            <th>Order ID</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Action</th>
                            <th>Staff</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => (
                            <tr key={log.id}>
                                <td className="small text-muted">{new Date(log.returnDate).toLocaleString()}</td>
                                <td>{log.returnChannel}</td>
                                <td>{log.CourierPartner}</td>
                                <td className="font-monospace">{log.trackingId}</td>
                                <td>{log.sku}</td>
                                <td>{log.channelOrderId}</td>
                                <td className="small">
                                    <div className="fw-bold">{log.returnMainReason}</div>
                                    <div className="text-muted">{log.returnSubReason}</div>
                                </td>
                                <td>
                                    <span className={`badge ${log.qcStatus === 'QC_PASS' ? 'bg-success' : 'bg-danger'}`}>
                                        {log.qcStatus}
                                    </span>
                                </td>
                                <td>{log.actionTaken}</td>
                                <td><span className="badge bg-light text-dark border">{log.processedBy}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default ReturnLogs;