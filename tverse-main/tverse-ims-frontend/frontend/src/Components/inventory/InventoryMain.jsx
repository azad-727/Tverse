import { useState } from 'react';
import QuickInbound from './QuickInbound';
import BulkStockOp from './BulkStockOp';
import AllInventoryView from './AllInventoryView'; // We will reuse/modify ProductList for this

const InventoryMain = () => {
    const [activeTab, setActiveTab] = useState('view');

    return (
        <div className="container-fluid p-0">
            <h3 className="fw-bold mb-4">Inventory Operations</h3>

            {/* Tabs */}
            <div className="bg-white rounded-top border-bottom px-4 pt-3 shadow-sm">
                <ul className="nav nav-tabs border-0">
                    <li className="nav-item">
                        <button 
                            className={`nav-link border-0 me-3 ${activeTab === 'view' ? 'active fw-bold border-bottom border-3 border-primary text-primary' : 'text-muted'}`} 
                            onClick={() => setActiveTab('view')}
                        >
                            <i className="bi bi-table me-2"></i> All Inventory
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link border-0 me-3 ${activeTab === 'inbound' ? 'active fw-bold border-bottom border-3 border-primary text-primary' : 'text-muted'}`} 
                            onClick={() => setActiveTab('inbound')}
                        >
                            <i className="bi bi-upc-scan me-2"></i> Quick Inbound (Scanner)
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link border-0 me-3 ${activeTab === 'bulk' ? 'active fw-bold border-bottom border-3 border-primary text-primary' : 'text-muted'}`} 
                            onClick={() => setActiveTab('bulk')}
                        >
                            <i className="bi bi-file-earmark-spreadsheet me-2"></i> Bulk Adjustments
                        </button>
                    </li>
                </ul>
            </div>

            {/* Content */}
            <div className="bg-white p-4 rounded-bottom shadow-sm border border-top-0">
                {activeTab === 'view' && <AllInventoryView />}
                {activeTab === 'inbound' && <QuickInbound />}
                {activeTab === 'bulk' && <BulkStockOp />}
            </div>
        </div>
    );
};

export default InventoryMain;