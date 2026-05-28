import { useState, useEffect } from 'react';
import axios from 'axios';

const ReportHub = () => {
    // --- STATE MANAGEMENT ---
    const [masterCategory, setMasterCategory] = useState('INVENTORY');
    const [reportType, setReportType] = useState('CATALOG_TEMPLATE');
    const [isDownloading, setIsDownloading] = useState(false);

    // Dynamic Filters State
    const [availableCategories, setAvailableCategories] = useState([]);
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [dateFilter, setDateFilter] = useState('30');
    const [channelFilter, setChannelFilter] = useState('ALL');

    // --- REPORT HIERARCHY CONFIGURATION ---
    const reportStructure = {
        INVENTORY: [
            { id: 'ALL_STOCK', name: 'All Stock Inventory', needsCategory: false, needsDate: false, needsChannel: false },
            { id: 'CATALOG_TEMPLATE', name: 'Catalog Listing Template', needsCategory: true, needsDate: false, needsChannel: false }
        ],
        ORDERS: [
            { id: 'TOTAL_DISPATCHED', name: 'Total Dispatched Orders', needsCategory: false, needsDate: true, needsChannel: true },
            { id: 'TOTAL_RETURNS', name: 'Total Return Orders', needsCategory: false, needsDate: true, needsChannel: true },
            { id: 'TOTAL_CANCELLED', name: 'Total Cancelled Orders', needsCategory: false, needsDate: true, needsChannel: true }
        ],
        ANALYTICS: [
            { id: 'ABC_CLASSIFICATION', name: 'ABC Revenue Classification', needsCategory: false, needsDate: true, needsChannel: false },
            { id: 'VARIANT_LIFECYCLE', name: 'Variant Lifecycle List', needsCategory: true, needsDate: true, needsChannel: false },
            { id: 'DEAD_STOCK', name: 'Dead Stock Targets (0 Sales)', needsCategory: true, needsDate: true, needsChannel: false },
            { id: 'PROCUREMENT', name: 'Procurement Action List', needsCategory: false, needsDate: false, needsChannel: false }
        ]
    };

    // --- INITIAL DATA FETCH ---
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get('http://localhost:8080/api/catalog/categories');
                setAvailableCategories(res.data);
            } catch (error) {
                console.error("Failed to load categories", error);
            }
        };
        fetchCategories();
    }, []);

    // Handle cascading reset when Master Category changes
    const handleMasterCategoryChange = (e) => {
        const newCat = e.target.value;
        setMasterCategory(newCat);
        // Automatically select the first report in the new category
        setReportType(reportStructure[newCat][0].id); 
    };

    // Get the currently selected report's configuration (to know which filters to show)
    const currentReportConfig = reportStructure[masterCategory].find(r => r.id === reportType);

    // --- THE DOWNLOAD ENGINE ---
    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            // 1. Build the dynamic URL based on selected filters
            let url = `http://localhost:8080/api/reports/download?type=${reportType}`;
            if (currentReportConfig.needsCategory) url += `&category=${categoryFilter}`;
            if (currentReportConfig.needsDate) url += `&days=${dateFilter}`;
            if (currentReportConfig.needsChannel) url += `&channel=${channelFilter}`;

            // 2. Fetch the file as a Blob (Future-proof for when we add JWT Security)
            const response = await axios.get(url, { responseType: 'blob' });

            // 3. Create a hidden download link and click it to save the file
            const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = blobUrl;
            
            // Extract filename from headers if possible, otherwise generate a generic one
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
            console.error("Download failed", error);
            alert("Failed to generate report. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="container-fluid p-4 bg-light" style={{ minHeight: '100vh' }}>
            
            <div className="mb-4">
                <h3 className="fw-bold mb-0"><i className="bi bi-file-earmark-spreadsheet me-2 text-primary"></i>Tverse Report Hub</h3>
                <p className="text-muted">Export clean, actionable CSV data for accounting, warehouse, and marketing teams.</p>
            </div>

            <div className="row">
                <div className="col-12 col-lg-8 col-xl-6">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-4">
                            
                            {/* --- STEP 1: MASTER CATEGORY --- */}
                            <div className="mb-4">
                                <label className="form-label fw-bold text-muted small text-uppercase">1. Select Department</label>
                                <select 
                                    className="form-select form-select-lg fw-bold shadow-sm"
                                    value={masterCategory}
                                    onChange={handleMasterCategoryChange}
                                >
                                    <option value="INVENTORY">Warehouse & Inventory</option>
                                    <option value="ORDERS">Orders & Dispatch</option>
                                    <option value="ANALYTICS">Analytics & Strategy</option>
                                </select>
                            </div>

                            {/* --- STEP 2: SPECIFIC REPORT --- */}
                            <div className="mb-4">
                                <label className="form-label fw-bold text-muted small text-uppercase">2. Select Report Type</label>
                                <select 
                                    className="form-select shadow-sm"
                                    value={reportType}
                                    onChange={(e) => setReportType(e.target.value)}
                                >
                                    {reportStructure[masterCategory].map(report => (
                                        <option key={report.id} value={report.id}>{report.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* --- STEP 3: DYNAMIC FILTERS --- */}
                            {(currentReportConfig.needsCategory || currentReportConfig.needsDate || currentReportConfig.needsChannel) && (
                                <div className="p-3 bg-light rounded border mb-4">
                                    <label className="form-label fw-bold text-muted small text-uppercase mb-3"><i className="bi bi-funnel me-1"></i> Data Filters</label>
                                    
                                    <div className="row g-3">
                                        {/* Category Filter */}
                                        {currentReportConfig.needsCategory && (
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold">Category</label>
                                                <select className="form-select form-select-sm" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                                                    <option value="ALL">All Categories</option>
                                                    {availableCategories.map(cat => (
                                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {/* Date Filter */}
                                        {currentReportConfig.needsDate && (
                                            <div className="col-md-6">
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

                                        {/* Channel Filter */}
                                        {currentReportConfig.needsChannel && (
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold">Sales Channel</label>
                                                <select className="form-select form-select-sm" value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)}>
                                                    <option value="ALL">All Marketplaces</option>
                                                    <option value="AMAZON">Amazon</option>
                                                    <option value="MEESHO">Meesho</option>
                                                    <option value="FLIPKART">Flipkart</option>
                                                    <option value="MYNTRA">Myntra</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* --- STEP 4: DOWNLOAD BUTTON --- */}
                            <button 
                                className="btn btn-primary w-100 py-2 fw-bold d-flex justify-content-center align-items-center shadow-sm"
                                onClick={handleDownload}
                                disabled={isDownloading}
                            >
                                {isDownloading ? (
                                    <><span className="spinner-border spinner-border-sm me-2"></span> Generating CSV...</>
                                ) : (
                                    <><i className="bi bi-cloud-download me-2"></i> Download Report</>
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