import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// --- COMPONENT IMPORT SCHEMA Matrix ---
import Layout from './Components/Layout'; 
import Dashboard from './Components/Dashboard';
import InventoryPage from './Components/InventoryPage'; 
import ProductDetail from './Components/ProductDetail';
import InventoryMain from './Components/inventory/InventoryMain';
import PicklistPage from './Components/PicklistPage';
import OrderPage from './Components/order/OrderManagement';
import CreateManualOrder from './Components/order/CreateManualOrder';
import ReturnsInward from './Components/ReturnsInward';
import ScanPack from './Components/ScanPack';
import ReturnLogs from './Components/ReturnLog';
import StaffManager from './Components/StaffManager';
import DispatchLogs from './Components/DispatchLogs';
import ManufacturingMain from './Components/manufacturing/ManufacturingMain';
import InventoryMapping from './Components/ChannelMapping';
import AnalyticsMain from './Components/analytics/AnalyticsMain';
import AttendanceKiosk from './Components/AttendanceKiosk';
import ReportHub from './Components/reports/ReportHub';
import Login from './Components/auth/Login';

function App() {
    // 1. Check local session persistence metrics natively on execution boot
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('tverse_token'));

    // --- GLOBAL STATELESS INTERCEPTOR ENGINE CONFIGURATION ---
    useEffect(() => {
        // Interceptor A: Request Bouncer (Injects the Bearer passport silently into every outbound call)
        const requestInterceptor = axios.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('tverse_token');
                if (token) {
                    config.headers['Authorization'] = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Interceptor B: Response Auditor (Auto-wipes sessions if the backend flags an expired/tampered session)
        const responseInterceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    console.warn("Session token expired or compromised. Routing execution clean out.");
                    localStorage.clear();
                    setIsAuthenticated(false);
                }
                return Promise.reject(error);
            }
        );

        // Cleanup hooks to prevent memory leaks during hot-reloads
        return () => {
            axios.interceptors.request.eject(requestInterceptor);
            axios.interceptors.response.eject(responseInterceptor);
        };
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        setIsAuthenticated(false);
    };

    // --- PHASE A: UNAUTHENTICATED ROUTE SECURITY TERMINAL ---
    if (!isAuthenticated) {
        return (
            <BrowserRouter>
                <Routes>
                    {/* Catch-all bouncer: If you aren't logged in, every path displays the Login container cleanly without the Sidebar layout */}
                    <Route path="/login" element={<Login onLoginSuccess={() => setIsAuthenticated(true)} />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        );
    }

    // --- PHASE B: PRODUCTION LEVEL SECURED ROUTING ENVIRONMENT ---
    return (
        <BrowserRouter>
            <Layout>
                {/* Global contextual header bar notifying users of active clearance settings */}
                <div className="bg-white border-bottom p-2 px-4 d-flex justify-content-between align-items-center shadow-sm rounded-1 mb-2">
                    <span className="small text-muted fw-bold">
                        Active Terminal Operator: <span className="text-primary">{localStorage.getItem('tverse_user')}</span> 
                        <span className="badge bg-secondary-subtle text-secondary border ms-2">{localStorage.getItem('tverse_role')}</span>
                    </span>
                    <button className="btn btn-outline-danger btn-sm py-0 px-2 fw-bold small" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-1"></i> Logout
                    </button>
                </div>

                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/inventory/all" element={<InventoryPage />} /> 
                    <Route path="/inventory" element={<InventoryPage />} /> 
                    <Route path="/stock-management" element={<InventoryMain />} />
                    <Route path="/picklist" element={<div className="p-4"><PicklistPage /></div>} />
                    <Route path="/orders" element={<div className="p-4"><OrderPage /></div>} />
                    <Route path="/orders/create" element={<CreateManualOrder/>}/>
                    <Route path="/dispatch/scan" element={<ScanPack />} />
                    <Route path="/inventory/product/:id" element={<ProductDetail />} />
                    <Route path="/manufacturing" element={<ManufacturingMain />} />
                    <Route path="/inventory/mapping" element={<InventoryMapping />}/>
                    <Route path="/returns/inward" element={<ReturnsInward />} />
                    <Route path="/hr/staff" element={<StaffManager />} />
                    <Route path="/attendance" element={<AttendanceKiosk />} />
                    <Route path="returns/logs" element={<ReturnLogs />}/>
                    <Route path="/dispatch/logs" element={<DispatchLogs />} /> 
                    <Route path="/analytics" element={<AnalyticsMain />} />   
                    <Route path="/reports" element={<ReportHub />} />  
                    {/* Fallback guard: Redirect to home page if an authenticated operator attempts to access login manually */}
                    <Route path="/login" element={<Navigate to="/" replace />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
}

export default App;