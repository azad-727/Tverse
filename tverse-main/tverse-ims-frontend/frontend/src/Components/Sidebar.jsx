import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';

const Sidebar = () => {
    const location = useLocation();
    
    // State to toggle the Inventory Submenu (Default Open)
    const [isInvOpen, setIsInvOpen] = useState(true); 

    const isActive = (path) => location.pathname === path ? 'active bg-primary text-white' : 'text-dark';

    return (
        <div className="sidebar-container d-flex flex-column flex-shrink-0 p-3 bg-white border-end">
            {/* Logo */}
            <a href="/" className="d-flex align-items-center mb-4 text-decoration-none text-dark px-2">
                <i className="bi bi-box-seam-fill fs-3 text-success me-2"></i>
                <span className="fs-4 fw-bold">T-Verse WMS</span>
            </a>
            
            <ul className="nav nav-pills flex-column mb-auto">
                
                {/* 1. DASHBOARD */}
                <li className="nav-item mb-1">
                    <Link to="/" className={`sidebar-link text-decoration-none ${isActive('/')}`}>
                        <i className="bi bi-speedometer2 me-3 fs-5"></i> Dashboard
                    </Link>
                </li>

                {/* 2. INVENTORY DROPDOWN (This replaces "Listings") */}
                <li className="nav-item mb-1">
                    {/* The Clickable Header */}
                    <div 
                        className="sidebar-link text-decoration-none d-flex justify-content-between align-items-center" 
                        style={{cursor: 'pointer', color: '#333'}}
                        onClick={() => setIsInvOpen(!isInvOpen)}
                    >
                        <span><i className="bi bi-boxes me-3 fs-5"></i> Inventory</span>
                        <i className={`bi ${isInvOpen ? 'bi-chevron-down' : 'bi-chevron-right'} small`}></i>
                    </div>

                    {/* The Sub-Menu (Only shows if isInvOpen is true) */}
                    {isInvOpen && (
                        <div className="bg-light rounded mt-1 overflow-hidden">
                            <Link to="/inventory/all" className={`sidebar-link ps-5 text-decoration-none small ${isActive('/inventory/all')}`}>
                                📦 All Inventory
                            </Link>
                            <Link to="/inventory/inbound" className={`sidebar-link ps-5 text-decoration-none small ${isActive('/inventory/inbound')}`}>
                                📥 Quick Inbound
                            </Link>
                            <Link to="/inventory/adjust" className={`sidebar-link ps-5 text-decoration-none small ${isActive('/inventory/adjust')}`}>
                                ⚠️ Stock Adjust
                            </Link>
                            <Link to="/inventory/bulk" className={`sidebar-link ps-5 text-decoration-none small ${isActive('/inventory/bulk')}`}>
                                ☁️ Bulk Tools
                            </Link>
                        </div>
                    )}
                </li>

                {/* 3. PICKLIST */}
                <li className="nav-item mb-1">
                    <Link to="/picklist" className={`sidebar-link text-decoration-none ${isActive('/picklist')}`}>
                        <i className="bi bi-clipboard-check me-3 fs-5"></i> Picklist
                    </Link>
                </li>

                {/* 4. ORDERS */}
                <li className="nav-item mb-1">
                    <Link to="/orders" className={`sidebar-link text-decoration-none ${isActive('/orders')}`}>
                        <i className="bi bi-cart me-3 fs-5"></i> Orders
                    </Link>
                </li>
            </ul>
        </div>
    );
};

export default Sidebar;