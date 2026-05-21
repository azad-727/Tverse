import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Webcam from 'react-webcam'; // Ensure npm install react-webcam

const AttendanceKiosk = () => {
    // --- STATE ---
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    
    // --- NEW: SECURITY STATE ---
    const [selectedStaff, setSelectedStaff] = useState(null); // Who is punching?
    const [pin, setPin] = useState("");
    const webcamRef = useRef(null);

    // Add Staff Modal State
    const [showAdd, setShowAdd] = useState(false);
    const [newStaff, setNewStaff] = useState({ fullName: "", role: "Packer", phoneNumber: "", hourlyWage: "",securityPin:"" });

    // --- EFFECTS ---
    useEffect(() => { fetchDashboard(); }, []);
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchDashboard = async () => {
        try {
            const res = await axios.get("http://localhost:8080/api/attendance/today");
            setStaffList(res.data);
            setLoading(false);
        } catch (error) { console.error(error); }
    };

    // --- ACTIONS ---

    // 1. MODIFIED: Just open the modal, don't punch yet
    const handlePunchClick = (staff) => {
        if (staff.status === 'COMPLETED') return; // Cannot punch if done
        setSelectedStaff(staff);
        setPin(""); // Clear previous pin
    };

    // 2. NEW: Verify & Punch (The Real Action)
    const handleVerifyAndPunch = async () => {
        if (!pin) return alert("Please Enter PIN");
        
        // Capture Selfie
        const imageSrc = webcamRef.current ? webcamRef.current.getScreenshot() : null;
        console.log(imageSrc);
        try {
            // Update this URL to match your backend Logic
            // Sending PIN and Photo in body
            const res = await axios.post(`http://localhost:8080/api/attendance/punch/${selectedStaff.staffId}`, {
                pin: pin,
                photo: imageSrc
            });
            
            alert(res.data); // Success Message
            fetchDashboard();
            setSelectedStaff(null); // Close Modal

        } catch (error) {
            alert("❌ Verification Failed: " + (error.response?.data || error.message));
            setPin(""); // Clear PIN on error
        }
    };

    const handleAddStaff = async () => {
        if (!newStaff.fullName || !newStaff.phoneNumber) return alert("Fill all fields");
        try {
            // Auto-set default PIN for now
            await axios.post("http://localhost:8080/api/attendance/staff/add", { ...newStaff});
            alert("Staff Added! Default PIN is 1234");
            setShowAdd(false);
            setNewStaff({ fullName: "", role: "Packer", phoneNumber: "" });
            fetchDashboard();
        } catch (e) { alert("Failed to add staff"); }
    };

    // --- HELPERS ---
    const formatTime = (isoString) => {
        if (!isoString) return "--:--";
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const presentCount = staffList.filter(s => s.status === 'WORKING').length;
    const completedCount = staffList.filter(s => s.status === 'COMPLETED').length;

    if (loading) return <div className="p-5 text-center">Loading Kiosk...</div>;

    return (
        <div className="container-fluid p-4" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
            
            {/* HEADER & CLOCK (Kept Same) */}
            <div className="d-flex justify-content-between align-items-center mb-5">
                <div>
                    <h2 className="fw-bold m-0 text-dark">Attendance Kiosk</h2>
                    <p className="text-muted mb-0">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="text-end">
                    <h1 className="fw-bold text-primary m-0" style={{ fontFamily: 'monospace' }}>{currentTime.toLocaleTimeString()}</h1>
                    <button className="btn btn-sm btn-outline-dark mt-2" onClick={() => setShowAdd(true)}>+ Add Employee</button>
                </div>
            </div>

            {/* STATS BAR (Kept Same) */}
            <div className="row g-4 mb-5">
                <div className="col-md-4"><div className="card border-0 shadow-sm p-3 border-start border-5 border-success"><div className="small text-muted fw-bold">CURRENTLY WORKING</div><div className="fs-2 fw-bold text-success">{presentCount}</div></div></div>
                <div className="col-md-4"><div className="card border-0 shadow-sm p-3 border-start border-5 border-primary"><div className="small text-muted fw-bold">COMPLETED SHIFT</div><div className="fs-2 fw-bold text-primary">{completedCount}</div></div></div>
                <div className="col-md-4"><div className="card border-0 shadow-sm p-3 border-start border-5 border-secondary"><div className="small text-muted fw-bold">TOTAL STAFF</div><div className="fs-2 fw-bold text-secondary">{staffList.length}</div></div></div>
            </div>

            {/* STAFF GRID (Updated onClick) */}
            <div className="row g-3">
                {staffList.map(staff => {
                    let cardClass = "bg-white border-0 shadow-sm";
                    let btnClass = "btn-outline-success";
                    let btnText = "PUNCH IN";
                    let statusColor = "text-muted";
                    
                    if(staff.status === 'WORKING') {
                        cardClass = "bg-success bg-opacity-10 border border-success";
                        btnClass = "btn-danger";
                        btnText = "PUNCH OUT";
                        statusColor = "text-success";
                    } else if (staff.status === 'COMPLETED') {
                        cardClass = "bg-primary bg-opacity-10 border border-primary";
                        btnClass = "btn-secondary disabled";
                        btnText = "DONE";
                        statusColor = "text-primary";
                    }

                    return (
                        <div className="col-md-4 col-lg-3" key={staff.staffId}>
                            <div className={`card h-100 p-3 text-center ${cardClass} position-relative overflow-hidden`}>
                                {staff.status === 'WORKING' && <div className="position-absolute top-0 end-0 p-2"><span className="spinner-grow spinner-grow-sm text-success"></span></div>}
                                
                                <div className="card-body">
                                    <div className="bg-white rounded-circle d-inline-flex p-3 mb-3 border shadow-sm" style={{width: 60, height: 60, alignItems:'center', justifyContent:'center'}}>
                                        <span className="fw-bold fs-4 text-dark">{staff.name.charAt(0)}</span>
                                    </div>
                                    <h5 className="fw-bold mb-1">{staff.name}</h5>
                                    <p className="text-muted small mb-3">{staff.role}</p>

                                    <div className="d-flex justify-content-center gap-3 small mb-4 font-monospace bg-white rounded p-2 border">
                                        <div><div className="text-muted" style={{fontSize:'10px'}}>IN</div><strong>{formatTime(staff.checkIn)}</strong></div>
                                        <div className="border-end"></div>
                                        <div><div className="text-muted" style={{fontSize:'10px'}}>OUT</div><strong>{formatTime(staff.checkOut)}</strong></div>
                                    </div>

                                    <button 
                                        className={`btn ${btnClass} w-100 fw-bold py-2`}
                                        onClick={() => handlePunchClick(staff)} // CHANGED THIS
                                        disabled={staff.status === 'COMPLETED'}
                                    >
                                        {btnText}
                                    </button>
                                </div>
                                <div className={`card-footer bg-transparent border-0 pt-0 small fw-bold ${statusColor}`}>
                                    {staff.status === 'WORKING' ? '🟢 ONLINE' : staff.status === 'COMPLETED' ? `🔵 ${staff.hours} HRS` : '⚪ AWAY'}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* --- NEW: SECURITY VERIFICATION MODAL --- */}
            {selectedStaff && (
                <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.85)'}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0 overflow-hidden">
                            
                            {/* Header */}
                            <div className="modal-header bg-dark text-white border-0">
                                <h5 className="modal-title">Verify: {selectedStaff.name}</h5>
                                <button className="btn-close btn-close-white" onClick={() => setSelectedStaff(null)}></button>
                            </div>
                            
                            <div className="modal-body p-0">
                                <div className="row g-0">
                                    
                                    {/* Left: Camera */}
                                    <div className="col-md-6 bg-black d-flex align-items-center justify-content-center p-3">
                                        <div className="rounded overflow-hidden border border-secondary" style={{width: '100%', maxWidth: '240px'}}>
                                            <Webcam
                                                audio={false}
                                                ref={webcamRef}
                                                screenshotFormat="image/jpeg"
                                                width="100%"
                                                videoConstraints={{ facingMode: "user" }}
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Right: PIN Pad */}
                                    <div className="col-md-6 p-4 bg-white">
                                        <div className="mb-3 text-center">
                                            <label className="small text-muted fw-bold mb-2">ENTER PIN</label>
                                            <input 
                                                type="password" 
                                                className="form-control form-control-lg text-center fw-bold fs-2 letter-spacing-2" 
                                                value={pin} 
                                                readOnly 
                                                placeholder="••••" 
                                            />
                                        </div>
                                        <div className="d-grid gap-2" style={{gridTemplateColumns: 'repeat(3, 1fr)'}}>
                                            {[1,2,3,4,5,6,7,8,9].map(n => (
                                                <button key={n} className="btn btn-outline-dark btn-lg py-3 fw-bold" onClick={()=>setPin(pin+n)}>{n}</button>
                                            ))}
                                            <button className="btn btn-danger btn-lg fw-bold" onClick={()=>setPin("")}>C</button>
                                            <button className="btn btn-outline-dark btn-lg fw-bold" onClick={()=>setPin(pin+'0')}>0</button>
                                            <button className="btn btn-success btn-lg fw-bold" onClick={handleVerifyAndPunch}><i className="bi bi-check-lg"></i></button>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD STAFF MODAL (Existing) */}
            {showAdd && (
                <div className="modal d-block" style={{background:'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow">
                            <div className="modal-header">
                                <h5 className="modal-title">Add New Employee</h5>
                                <button className="btn-close" onClick={() => setShowAdd(false)}></button>
                            </div>
                            <div className="modal-body">
                                <input className="form-control mb-2" placeholder="Full Name" onChange={e => setNewStaff({...newStaff, fullName: e.target.value})} />
                                <input className="form-control mb-2" placeholder="Phone Number" onChange={e => setNewStaff({...newStaff, phoneNumber: e.target.value})} />
                                <input className="form-control mb-2" placeholder="Security Pin" onChange={e => setNewStaff({...newStaff, securityPin: e.target.value})} />
                                <select className="form-select" onChange={e => setNewStaff({...newStaff, role: e.target.value})}>
                                    <option value="Packer">Packer</option>
                                    <option value="Stitcher">Stitcher</option>
                                    <option value="Supervisor">Supervisor</option>
                                    <option value="Helper">Helper</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-primary" onClick={handleAddStaff}>Save Employee</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceKiosk;