import { useState } from 'react';
import FabricManager from './FabricManager';
import LotManager from './LotManager';

const ManufacturingMain = () => {
    const [activeTab, setActiveTab] = useState('lots');

    return (
        <div className="container-fluid p-0">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold text-dark mb-1">Production & Manufacturing</h3>
                    <p className="text-muted small mb-0">Manage fabric stock, cutting lots, and production lifecycle.</p>
                </div>
            </div>

            {/* Professional Tabs */}
            <div className="bg-white rounded-top border-bottom px-4 pt-3 shadow-sm">
                <ul className="nav nav-tabs border-0">
                    <li className="nav-item">
                        <button 
                            className={`nav-link border-0 me-3 ${activeTab === 'lots' ? 'active fw-bold border-bottom border-3 border-success text-success' : 'text-muted'}`} 
                            style={{borderRadius: 0, paddingBottom: '15px'}}
                            onClick={() => setActiveTab('lots')}
                        >
                            <i className="bi bi-scissors me-2"></i>
                            Production Lots
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link border-0 me-3 ${activeTab === 'fabric' ? 'active fw-bold border-bottom border-3 border-success text-success' : 'text-muted'}`} 
                            style={{borderRadius: 0, paddingBottom: '15px'}}
                            onClick={() => setActiveTab('fabric')}
                        >
                            <i className="bi bi-layers me-2"></i>
                            Fabric Store
                        </button>
                    </li>
                </ul>
            </div>

            {/* Content Area */}
            <div className="bg-white p-4 rounded-bottom shadow-sm border border-top-0" style={{minHeight: '80vh'}}>
                {activeTab === 'fabric' && <FabricManager />}
                {activeTab === 'lots' && <LotManager />}
            </div>
        </div>
    );
};

export default ManufacturingMain;