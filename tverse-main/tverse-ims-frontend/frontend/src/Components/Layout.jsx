import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import logo from '../assets/wordmark-logo.png';
const Layout = ({ children }) => {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const isActive = (path) => location.pathname === path ? 'active' : '';
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div>
            {/* 1. MOBILE OVERLAY (Click to close menu) */}
            <div 
                className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} 
                onClick={() => setIsSidebarOpen(false)}
            ></div>

            {/* 2. SIDEBAR */}
            <div className={`sidebar-container ${isSidebarOpen ? 'active' : ''}`}>
                {/* Logo Area */}
                <div className="p-4 d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                        <span><img src={logo} alt="logo" style={{width:"fit-content",height:60}}></img></span>
                    </div>
                    {/* Close Button (Mobile Only) */}
                    <button className="btn btn-sm d-md-none" onClick={() => setIsSidebarOpen(false)}>
                        <i className="bi bi-x-lg fs-4"></i>
                    </button>
                </div>

                {/* Navigation Links */}
                <div className="pe-3"> 
                    <Link to="/" className={`sidebar-link text-decoration-none ${isActive('/')}`} onClick={() => setIsSidebarOpen(false)}>
                        <i className="bi bi-house me-3 fs-5"></i> Home
                    </Link>
                    <Link to="/inventory" className={`sidebar-link text-decoration-none ${isActive('/inventory')}`} onClick={() => setIsSidebarOpen(false)}>
                            <i className="bi bi-tags-fill me-3 fs-5"></i> Listings (Catalog)
                    </Link>

                {/* --- NEW MENU ITEM --- */}
                    <Link to="/stock-management" className={`sidebar-link text-decoration-none ${isActive('/stock-management')}`} onClick={() => setIsSidebarOpen(false)}>
                        <i className="bi bi-boxes me-3 fs-5"></i> Inventory Ops
                    </Link>
                    <Link to="/orders" className={`sidebar-link text-decoration-none ${isActive('/orders')}`} onClick={() => setIsSidebarOpen(false)}>
                        <i className="bi bi-cart me-3 fs-5"></i> Orders
                    </Link>
                    {/* <Link to="/customers" className={`sidebar-link text-decoration-none ${isActive('/customers')}`} onClick={() => setIsSidebarOpen(false)}>
                        <i className="bi bi-people me-3 fs-5"></i> Customers
                    </Link>*/}
                    <Link to="/analytics" className={`sidebar-link text-decoration-none ${isActive('/analytics')}`} onClick={() => setIsSidebarOpen(false)}>
                        <i className="bi bi-graph-up me-3 fs-5"></i> Analytics & BI
                    </Link> 
                    <Link to="/returns/inward" className={`sidebar-link text-decoration-none ${isActive('/returns/inward')}`}>
                        <i className="bi bi-arrow-counterclockwise me-3 fs-5"></i> Returns (RMA)
                    </Link>
                    <Link to="/manufacturing" className={`sidebar-link text-decoration-none ${isActive('/manufacturing')}`}>
                        <i className="bi bi-scissors me-3 fs-5"></i> Manufacturing
                    </Link>
                    <Link to="/attendance" className={`sidebar-link text-decoration-none ${isActive('/attendance')}`}>
                        <i className="bi bi-clock-history me-3 fs-5"></i> Attendance
                    </Link>
                    <Link to="/inventory/mapping" className={`sidebar-link text-decoration-none ${isActive('/inventory/mapping')}`}>
                    <i className="bi bi-shop-window me-3 fs-5"></i>Channels
                    </Link>
                    
                    <Link to="/hr/staff" className={`sidebar-link text-decoration-none ${isActive('/hr/staff')}`}>
                     <i className="bi bi-people-fill me-2 fs-5"></i> HR & Payroll </Link>
                     
                    <Link to="/picklist" className={`sidebar-link text-decoration-none ${isActive('/picklist')}`} onClick={() => setIsSidebarOpen(false)}>
                        <i className="bi bi-clipboard-check me-3 fs-5"></i> Picklist
                    </Link>
                    <Link to="/reports" className={`sidebar-link text-decoration-none ${isActive('/reports')}`} onClick={() => setIsSidebarOpen(false)}>
                        <i className="bi bi-download me-3 fs-5"></i> Reports
                    </Link>
                
                </div>
            </div>

            {/* 3. MAIN CONTENT AREA */}
            <div className="main-content d-flex flex-column">
                
                {/* Top Header */}
                <div className="bg-white py-2 px-3 px-md-4 d-flex justify-content-between align-items-center shadow-sm sticky-top" style={{ height: '70px' }}>
                    
                    {/* LEFT: Mobile Menu Button & Search */}
                    <div className="d-flex align-items-center gap-3">
                        <button className="btn btn-light d-md-none border-0" onClick={toggleSidebar}>
                            <i className="bi bi-list fs-3"></i>
                        </button>

                        <div className="input-group d-none d-md-flex" style={{ maxWidth: '400px' }}>
                            <span className="input-group-text bg-light border-0"><i className="bi bi-search"></i></span>
                            <input type="text" className="form-control bg-light border-0" placeholder="Search..." />
                        </div>
                    </div>

                    {/* RIGHT: User Profile */}
                    <div className="d-flex align-items-center gap-3">
                        <i className="bi bi-bell fs-5 text-muted"></i>
                        <div className="d-flex align-items-center gap-2">
                            <div className="text-end lh-1 d-none d-md-block">
                                <div className="fw-bold small">THALASIKNITFAB</div>
                                <div className="text-muted" style={{fontSize: '10px'}}>Admin</div>
                            </div>
                            <div className="bg-dark rounded-circle text-white d-flex align-items-center justify-content-center" style={{width: 35, height: 35}}>
                                T
                            </div>
                        </div>
                    </div>
                </div>

                {/* Page Content */}
                <div className="p-3 p-md-4 flex-grow-1" style={{ overflowY: 'auto' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Layout;