import { useState } from 'react';
import SalesDashboard from './SalesDashboard';
import AbcDashboard from './AbcDashboard';
import StockoutDashboard from './StockoutDashboard';
import FinanceDashboard from './FinanceDashboard'; // <-- Add this import!
import LiquidationDashboard from './LiquidationDashboard';
const AnalyticsMain = () => {
    // We now have 4 tabs!
    const [activeTab, setActiveTab] = useState('SALES');

    return (
        <div className="container-fluid p-0 bg-light" style={{ minHeight: '100vh' }}>
            
            <div className="bg-white px-4 pt-4 mb-3 shadow-sm border-bottom">
                <div className="d-flex align-items-center mb-3">
                    <div className="bg-primary text-white rounded p-2 me-3">
                        <i className="bi bi-bar-chart-steps fs-4"></i>
                    </div>
                    <div>
                        <h4 className="fw-bold mb-0">T-Verse Analytics Hub</h4>
                        <p className="text-muted small mb-0">Manufacturing & Sales Intelligence Engine</p>
                    </div>
                </div>

                {/* --- TAB BUTTONS --- */}
                <ul className="nav nav-tabs border-0 mt-3" style={{ gap: '10px' }}>
                    <li className="nav-item">
                        <button 
                            className={`nav-link border-0 border-bottom border-3 px-4 py-2 ${activeTab === 'SALES' ? 'active border-primary fw-bold text-dark bg-white' : 'text-muted border-transparent bg-transparent'}`}
                            onClick={() => setActiveTab('SALES')}
                        >
                            <i className="bi bi-graph-up me-2"></i> Sales Overview
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link border-0 border-bottom border-3 px-4 py-2 ${activeTab === 'SEGMENTATION' ? 'active border-primary fw-bold text-dark bg-white' : 'text-muted border-transparent bg-transparent'}`}
                            onClick={() => setActiveTab('SEGMENTATION')}
                        >
                            <i className="bi bi-files me-2"></i> Segmentation
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link border-0 border-bottom border-3 px-4 py-2 ${activeTab === 'ABC' ? 'active border-primary fw-bold text-dark bg-white' : 'text-muted border-transparent bg-transparent'}`}
                            onClick={() => setActiveTab('ABC')}
                        >
                            <i className="bi bi-diagram-3-fill me-2"></i> ABC Analysis
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link border-0 border-bottom border-3 px-4 py-2 ${activeTab === 'STOCKOUT' ? 'active border-primary fw-bold text-dark bg-white' : 'text-muted border-transparent bg-transparent'}`}
                            onClick={() => setActiveTab('STOCKOUT')}
                        >
                            <i className="bi bi-box-seam me-2"></i> Stockout Predictor
                        </button>
                    </li>
                    {/* --- THE NEW FINANCE TAB --- */}
                    <li className="nav-item">
                        <button 
                            className={`nav-link border-0 border-bottom border-3 px-4 py-2 ${activeTab === 'FINANCE' ? 'active border-primary fw-bold text-dark bg-white' : 'text-muted border-transparent bg-transparent'}`}
                            onClick={() => setActiveTab('FINANCE')}
                        >
                            <i className="bi bi-wallet2 me-2"></i> Settlements
                        </button>
                    </li>
                    
                </ul>
            </div>

            {/* --- DYNAMIC TAB CONTENT --- */}
            <div className="px-2">
                {activeTab === 'SALES' && <SalesDashboard />}
                {activeTab === 'ABC' && <AbcDashboard />}
                {activeTab === 'STOCKOUT' && <StockoutDashboard />}
                {activeTab === 'FINANCE' && <FinanceDashboard />}
                {activeTab === 'SEGMENTATION' && <LiquidationDashboard />}
                 {/* <-- Render the new dashboard! */}
            </div>
            
        </div>
    );
};

export default AnalyticsMain;