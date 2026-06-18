import { useState, useEffect } from 'react';
import apiClient from '../apiClient'; // FIXED: Swapped raw axios for secure client

const ReportHub = () => {
    // --- STATE MANAGEMENT ---
    const [masterCategory, setMasterCategory] = useState('INVENTORY');
    const [reportType, setReportType] = useState('ALL_STOCK');
    const [isDownloading, setIsDownloading] = useState(false);
    const [skuLevel, setSkuLevel] = useState('CHILD');

    // Dynamic Filters State
    const [availableCategories, setAvailableCategories] = useState([]);
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [dateFilter, setDateFilter] = useState('30');
    const [channelFilter, setChannelFilter] = useState('ALL');
    
    // New HR Filters State
    const [monthFilter, setMonthFilter] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
    const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));

    // --- REPORT HIERARCHY CONFIGURATION ---
    const reportStructure = {
        INVENTORY: [
            { id: 'ALL_STOCK', name: 'All Stock Inventory', needsCategory: false, needsDate: false, needsChannel: false, needsSkuLevel: false, needsMonthYear: false },
            { id: 'CATALOG_TEMPLATE', name: 'Catalog Listing Template', needsCategory: true, needsDate: false, needsChannel: false, needsSkuLevel: false, needsMonthYear: false }
        ],
        ORDERS: [
            { id: 'TOTAL_DISPATCHED', name: 'Total Dispatched Orders', needsCategory: false, needsDate: true, needsChannel: true, needsSkuLevel: false, needsMonthYear: false },
            { id: 'TOTAL_RETURNS', name: 'Total Return Orders (Scan-Based)', needsCategory: false, needsDate: true, needsChannel: true, needsSkuLevel: false, needsMonthYear: false },
            { id: 'TOTAL_CANCELLED', name: 'Total Cancelled Orders', needsCategory: false, needsDate: true, needsChannel: true, needsSkuLevel: false, needsMonthYear: false },
            { id: 'DISPATCH_LOGS', name: 'Raw Dispatch Scanning Logs', needsCategory: false, needsDate: true, needsChannel: false, needsSkuLevel: false, needsMonthYear: false },
            { id: 'RETURN_LOGS', name: 'Raw Return Scanning Logs', needsCategory: false, needsDate: true, needsChannel: false, needsSkuLevel: false, needsMonthYear: false }
        ],
        ANALYTICS: [
            { id: 'ABC_CLASSIFICATION', name: 'ABC Revenue Classification', needsCategory: false, needsDate: false, needsChannel: false, needsSkuLevel: true, needsMonthYear: false },
            { id: 'VARIANT_LIFECYCLE', name: 'Variant Lifecycle List', needsCategory: true, needsDate: true, needsChannel: false, needsSkuLevel: false, needsMonthYear: false },
            { id: 'DEAD_STOCK', name: 'Dead Stock Targets (0 Sales)', needsCategory: true, needsDate: true, needsChannel: false, needsSkuLevel: false, needsMonthYear: false },
            { id: 'PROCUREMENT', name: 'Procurement Action List', needsCategory: false, needsDate: false, needsChannel: false, needsSkuLevel: false, needsMonthYear: false }
        ],
        MANUFACTURING: [
            { id: 'ALL_LOTS', name: 'All Lot Details (Production Runs)', needsCategory: false, needsDate: true, needsChannel: false, needsSkuLevel: false, needsMonthYear: false },
            { id: 'FABRIC_AVAILABILITY', name: 'Fabric Availability (Raw Material)', needsCategory: false, needsDate: false, needsChannel: false, needsSkuLevel: false, needsMonthYear: false }
        ],
        HR_ADMIN: [
            { id: 'ATTENDANCE_LOG', name: 'Monthly Attendance Log', needsCategory: false, needsDate: false, needsChannel: false, needsSkuLevel: false, needsMonthYear: true }
        ]
    };

    // --- INITIAL DATA FETCH ---
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                // FIXED: Used apiClient to ensure auth tokens are injected
                const res = await apiClient.get('/api/catalog/categories');
                setAvailableCategories(res.data);
            } catch (error) {
                console.error("Failed to load categories", error);
            }
        };
        fetchCategories();
    }, []);

    const handleMasterCategoryChange = (e) => {
        const newCat = e.target.value;
        setMasterCategory(newCat);
        setReportType(reportStructure[newCat][0].id); 
    };

    const currentReportConfig = reportStructure[masterCategory].find(r => r.id === reportType);

    // --- THE DOWNLOAD ENGINE ---
    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            // FIXED: Used dynamic base URL so downloads work securely across environments
            const baseUrl = apiClient.defaults.baseURL || 'http://localhost:8080';
            let url = `${baseUrl}/api/reports/download?type=${reportType}`;
            
            if (currentReportConfig?.needsCategory) url += `&category=${categoryFilter}`;
            if (currentReportConfig?.needsDate) url += `&days=${dateFilter}`;
            if (currentReportConfig?.needsChannel) url += `&channel=${channelFilter}`;
            if (currentReportConfig?.needsSkuLevel) url += `&skuLevel=${skuLevel}`;
            if (currentReportConfig?.needsMonthYear) url += `&month=${monthFilter}&year=${yearFilter}`;

            // We must pass the Authorization header manually here since we are treating the response as a blob
            const token = localStorage.getItem('tverse_token');
            const response = await apiClient.get(url, { 
                responseType: 'blob',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = blobUrl;
            
            const contentDisposition = response.headers['content-disposition'];
            let fileName = `${reportType.toLowerCase()}_report.csv`;
            if (contentDisposition && contentDisposition.indexOf('filename=') !== -1) {
                fileName = contentDisposition.split('filename=')[1].replace(/['"]/g, '');
            }
            
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            
        } catch (error) {
            console.error("Download event interrupted:", error);
            if (error.response && error.response.status === 403) {
                alert("⛔ Security Access Denied: Your assigned personnel role does not clear credential limits for this asset classification level.");
            } else {
                alert("Failed to generate report file. Verify service operational loops.");
            }
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="container-fluid p-3 p-md-4 bg-light" style={{ minHeight: '100vh' }}>
            
            {/* MOBILE RESPONSIVE ENGINE */}
            <style>{`
                .tverse-report-card {
                    transition: transform 0.2s ease;
                }
                @media (max-width: 576px) {
                    .tverse-report-card {
                        padding: 1rem !important; /* Reduces extreme padding on small mobile screens */
                    }
                    /* Makes select boxes easier to tap on phones */
                    .form-select {
                        min-height: 48px;
                        font-size: 16px !important; 
                    }
                }
            `}</style>

            <div className="mb-4 text-center text-md-start">
                <h3 className="fw-bold mb-1" style={{ letterSpacing: '-0.5px' }}><i className="bi bi-file-earmark-spreadsheet me-2 text-primary"></i>Tverse Report Hub</h3>
                <p className="text-muted small">Export clean, actionable CSV data for accounting, warehouse, and marketing teams.</p>
            </div>

            <div className="row justify-content-center justify-content-lg-start">
                <div className="col-12 col-lg-8 col-xl-6">
                    <div className="card border-0 shadow-sm rounded-4">
                        <div className="card-body p-4 tverse-report-card">
                            
                            {/* --- STEP 1: MASTER CATEGORY --- */}
                            <div className="mb-4">
                                <label className="form-label fw-bold text-muted small text-uppercase">1. Select Department</label>
                                <select className="form-select form-select-lg fw-bold shadow-sm" value={masterCategory} onChange={handleMasterCategoryChange}>
                                    <option value="INVENTORY">Warehouse & Inventory</option>
                                    <option value="ORDERS">Orders & Dispatch</option>
                                    <option value="ANALYTICS">Analytics & Strategy</option>
                                    <option value="MANUFACTURING">Manufacturing Floor</option>
                                    <option value="HR_ADMIN">HR & Admin Personnel</option>
                                </select>
                            </div>

                            {/* --- STEP 2: SPECIFIC REPORT --- */}
                            <div className="mb-4">
                                <label className="form-label fw-bold text-muted small text-uppercase">2. Select Report Type</label>
                                <select className="form-select shadow-sm" value={reportType} onChange={(e) => setReportType(e.target.value)}>
                                    {reportStructure[masterCategory].map(report => (
                                        <option key={report.id} value={report.id}>{report.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* --- STEP 3: DYNAMIC FILTERS --- */}
                            {(currentReportConfig?.needsCategory || currentReportConfig?.needsDate || currentReportConfig?.needsChannel || currentReportConfig?.needsSkuLevel || currentReportConfig?.needsMonthYear) && (
                                <div className="p-3 bg-light rounded-3 border mb-4">
                                    <label className="form-label fw-bold text-muted small text-uppercase mb-3"><i className="bi bi-funnel me-1"></i> Data Filters</label>
                                    <div className="row g-3">
                                        
                                        {currentReportConfig?.needsCategory && (
                                            <div className="col-12 col-md-6">
                                                <label className="form-label small fw-bold">Category</label>
                                                <select className="form-select form-select-sm" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                                                    <option value="ALL">All Categories</option>
                                                    {availableCategories.map(cat => (
                                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {currentReportConfig?.needsDate && (
                                            <div className="col-12 col-md-6">
                                                <label className="form-label small fw-bold">Timeframe</label>
                                                <select className="form-select form-select-sm" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                                                    <option value="30">Last 30 Days</option>
                                                    <option value="60">Last 60 Days</option>
                                                    <option value="90">Last 90 Days</option>
                                                    <option value="180">Last 6 Months</option>
                                                    <option value="365">Last 1 Year</option>
                                                </select>
                                            </div>
                                        )}

                                        {currentReportConfig?.needsChannel && (
                                            <div className="col-12 col-md-6">
                                                <label className="form-label small fw-bold">Sales Channel</label>
                                                <select className="form-select form-select-sm" value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)}>
                                                    <option value="ALL">All Marketplaces</option>
                                                    <option value="AMAZON">Amazon</option>
                                                    <option value="COCOBLU">Amazon - Cocoblu</option>
                                                    <option value="FLIPKART">Flipkart</option>
                                                    <option value="MEESHO">Meesho</option>
                                                    <option value="MYNTRA">Myntra</option>
                                                </select>
                                            </div>
                                        )}

                                        {currentReportConfig?.needsSkuLevel && (
                                            <div className="col-12">
                                                <label className="form-label small fw-bold">Analysis Aggregation Level</label>
                                                <select className="form-select form-select-sm fw-bold text-primary" value={skuLevel} onChange={(e) => setSkuLevel(e.target.value)}>
                                                    <option value="CHILD">Child SKU Level (Sizes & Colors)</option>
                                                    <option value="PARENT">Parent Style Level (Master Designs)</option>
                                                </select>
                                            </div>
                                        )}

                                        {currentReportConfig?.needsMonthYear && (
                                            <>
                                                <div className="col-6">
                                                    <label className="form-label small fw-bold">Select Month</label>
                                                    <select className="form-select form-select-sm fw-bold" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
                                                        <option value="01">January</option><option value="02">February</option><option value="03">March</option>
                                                        <option value="04">April</option><option value="05">May</option><option value="06">June</option>
                                                        <option value="07">July</option><option value="08">August</option><option value="09">September</option>
                                                        <option value="10">October</option><option value="11">November</option><option value="12">December</option>
                                                    </select>
                                                </div>
                                                <div className="col-6">
                                                    <label className="form-label small fw-bold">Select Year</label>
                                                    <select className="form-select form-select-sm fw-bold" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                                                        <option value="2026">2026</option>
                                                        <option value="2025">2025</option>
                                                    </select>
                                                </div>
                                            </>
                                        )}

                                    </div>
                                </div>
                            )}

                            {/* --- STEP 4: DOWNLOAD BUTTON --- */}
                            <button 
                                className="btn btn-primary w-100 py-3 fw-bold d-flex justify-content-center align-items-center shadow-sm rounded-3 mt-4" 
                                onClick={handleDownload} 
                                disabled={isDownloading}
                            >
                                {isDownloading ? (
                                    <><span className="spinner-border spinner-border-sm me-2"></span> Generating Data File...</>
                                ) : (
                                    <><i className="bi bi-cloud-download me-2"></i> Download Secure Report</>
                                )}
                            </button>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportHub;