import { useState } from 'react';
import AbcDashboard from './AbcDashboard';
import StockoutDashboard from './StockoutDashboard';

const AnalyticsMain = () => {
    // Default to the ABC tab when the page loads
    const [activeTab, setActiveTab] = useState('abc');

    return (
        <div className="container-fluid p-0">
            {/* Top Navigation Bar */}
            <div className="bg-white p-4 border-bottom mb-2 shadow-sm rounded">
                <h4 className="fw-bold mb-3">Intelligence & Analytics</h4>
                <ul className="nav nav-pills gap-2">
                    <li className="nav-item">
                        <button 
                            className={`nav-link ${activeTab === 'abc' ? 'active bg-primary' : 'text-muted bg-light'}`} 
                            onClick={() => setActiveTab('abc')}
                        >
                            <i className="bi bi-bar-chart-steps me-2"></i>ABC Analysis
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link ${activeTab === 'stockout' ? 'active bg-primary' : 'text-muted bg-light'}`} 
                            onClick={() => setActiveTab('stockout')}
                        >
                            <i className="bi bi-stopwatch me-2"></i>Stockout Predictor
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link ${activeTab === 'margins' ? 'active bg-primary' : 'text-muted bg-light'}`} 
                            onClick={() => setActiveTab('margins')}
                        >
                            <i className="bi bi-currency-rupee me-2"></i>Profitability
                        </button>
                    </li>
                </ul>
            </div>

            {/* Dynamic Content Rendering */}
            <div className="tab-content">
                {activeTab === 'abc' && <AbcDashboard />}
                
                {activeTab === 'stockout' && <StockoutDashboard />}

                {activeTab === 'margins' && (
                    <div className="p-5 text-center text-muted">
                        <i className="bi bi-tools fs-1 mb-3 text-secondary d-block"></i>
                        <h5>Profitability & Margins</h5>
                        <p>Tracks actual Gross Margin contribution per SKU after costs and taxes.</p>
                        <span className="badge bg-secondary">Under Construction</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalyticsMain;