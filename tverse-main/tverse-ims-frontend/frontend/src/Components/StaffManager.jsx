import { useState, useEffect } from 'react';
import axios from 'axios';

const StaffManager = () => {
    const [activeTab, setActiveTab] = useState('directory'); // 'directory' or 'logs'
    const [staffList, setStaffList] = useState([]);
    const [logs, setLogs] = useState([]);
    
    // Filters for Logs
    const [filters, setFilters] = useState({
        from: new Date(new Date().setDate(1)).toISOString().split('T')[0], // 1st of month
        to: new Date().toISOString().split('T')[0], // Today
        staffId: ""
    });

    // Edit Modal State
    const [editingStaff, setEditingStaff] = useState(null);

    useEffect(() => {
        fetchStaff();
        if(activeTab === 'logs') fetchLogs();
    }, [activeTab]);

    const fetchStaff = async () => {
        const res = await axios.get("http://localhost:8080/api/attendance/staff/all");
        setStaffList(res.data);
    };

    const fetchLogs = async () => {
        const params = new URLSearchParams(filters);
        if(!filters.staffId) params.delete("staffId");
        
        try {
            const res = await axios.get(`http://localhost:8080/api/attendance/history?${params}`);
            setLogs(res.data);
        } catch (e) { alert("Error fetching logs"); }
    };

    const handleUpdateStaff = async () => {
        try {
            await axios.put(`http://localhost:8080/api/attendance/staff/update/${editingStaff.id}`, editingStaff);
            alert("Staff Updated!");
            setEditingStaff(null);
            fetchStaff();
        } catch(e) { alert("Update Failed"); }
    };

    return (
        <div className="container-fluid p-4">
            <h3 className="fw-bold mb-4">HR & Payroll Manager</h3>

            {/* TABS */}
            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'directory' ? 'active fw-bold' : ''}`} onClick={()=>setActiveTab('directory')}>Employee Directory</button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'logs' ? 'active fw-bold' : ''}`} onClick={()=>setActiveTab('logs')}>Attendance Logs (Photos)</button>
                </li>
            </ul>

            {/* TAB 1: DIRECTORY */}
            {activeTab === 'directory' && (
                <div className="table-responsive bg-white rounded shadow-sm p-3">
                    <table className="table table-hover align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Phone</th>
                                <th>Daily Wage</th>
                                <th>Policy</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staffList.map(s => (
                                <tr key={s.id}>
                                    <td className="fw-bold">{s.fullName}</td>
                                    <td><span className="badge bg-secondary">{s.role}</span></td>
                                    <td>{s.phoneNumber}</td>
                                    <td>₹ {s.dailyWage || 0} /day</td>
                                    <td>{s.workPolicy || "Standard"}</td>
                                    <td>
                                        <button className="btn btn-sm btn-outline-primary" onClick={() => setEditingStaff(s)}>Edit</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* TAB 2: LOGS (With Photos) */}
            {activeTab === 'logs' && (
                <div>
                    {/* Filters */}
                    <div className="d-flex gap-3 mb-3 bg-white p-3 rounded shadow-sm">
                        <input type="date" className="form-control" value={filters.from} onChange={e=>setFilters({...filters, from: e.target.value})} />
                        <input type="date" className="form-control" value={filters.to} onChange={e=>setFilters({...filters, to: e.target.value})} />
                        <select className="form-select" value={filters.staffId} onChange={e=>setFilters({...filters, staffId: e.target.value})}>
                            <option value="">All Staff</option>
                            {staffList.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                        </select>
                        <button className="btn btn-primary" onClick={fetchLogs}>Search</button>
                    </div>

                    <div className="table-responsive bg-white rounded shadow-sm">
                        <table className="table align-middle">
                            <thead className="table-dark">
                                <tr>
                                    <th>Date</th>
                                    <th>Employee</th>
                                    <th>Photo Evidence</th>
                                    <th>In Time</th>
                                    <th>Out Time</th>
                                    <th>Total Hrs</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id}>
                                        <td className="fw-bold">{log.date}</td>
                                        <td>{log.staff.fullName}</td>
                                        <td>
                                            {log.punchPhotoUrl ? (
                                                <img src={log.punchPhotoUrl} alt="Selfie" className="rounded-circle border" style={{width: '50px', height: '50px', objectFit: 'cover'}} />
                                            ) : <span className="text-muted small">No Photo</span>}
                                        </td>
                                        <td>{new Date(log.checkInTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                                        <td>{log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : "-"}</td>
                                        <td className="fw-bold">{log.workedHours || 0}</td>
                                        <td>
                                            <span className={`badge ${log.isLate ? 'bg-warning text-dark' : 'bg-success'}`}>
                                                {log.isLate ? 'LATE' : 'ON TIME'}
                                            </span>
                                            {log.shiftType === 'SUNDAY_OT' && <span className="badge bg-info ms-1">OT</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {editingStaff && (
                <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5>Edit Staff: {editingStaff.fullName}</h5>
                                <button className="btn-close" onClick={()=>setEditingStaff(null)}></button>
                            </div>
                            <div className="modal-body">
                                <label className="form-label">Full Name</label>
                                <input className="form-control mb-2" value={editingStaff.fullName} onChange={e=>setEditingStaff({...editingStaff, fullName: e.target.value})} />
                                <label className="form-label">Role</label>
                                <select className="form-select mb-2" value={editingStaff.role} onChange={e=>setEditingStaff({...editingStaff, role: e.target.value})}>
                                    <option>Packer</option><option>Stitcher</option><option>Supervisor</option>
                                </select>
                                <label className="form-label">Daily Wage (₹)</label>
                                <input type="number" className="form-control mb-2" value={editingStaff.dailyWage} onChange={e=>setEditingStaff({...editingStaff, dailyWage: e.target.value})} />
                                <label className="form-label">Work Policy</label>
                                <select className="form-select mb-2" value={editingStaff.workPolicy} onChange={e=>setEditingStaff({...editingStaff, workPolicy: e.target.value})}>
                                    <option value="STANDARD">Standard (26 Days)</option>
                                    <option value="CONTINUOUS">Continuous (30 Days)</option>
                                </select>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-primary" onClick={handleUpdateStaff}>Save Changes</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffManager;