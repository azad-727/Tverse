import { useState } from 'react';
import BulkProductAdd from './BulkProductUpload';
import SingleProductAdd from './SingleProductUpload';
import ProductList from './ProductList';
const InventoryPage = () => {
    // State to track which tab is active
    const [activeTab, setActiveTab] = useState('upload'); // Options: 'upload', 'single', 'list'

    return (
        <div className="container-fluid p-0">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold mb-0">Inventory & Catalog</h3>
                <div className="text-muted small">Manage your product listings</div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-top border-bottom px-4 pt-3 shadow-sm">
                <ul className="nav nav-tabs border-0">
                    <li className="nav-item">
                        <button 
                            className={`nav-link border-0 me-3 ${activeTab === 'upload' ? 'active fw-bold border-bottom border-3 border-success text-success' : 'text-muted'}`} 
                            style={{borderRadius: 0, paddingBottom: '15px'}}
                            onClick={() => setActiveTab('upload')}
                        >
                            <i className="bi bi-file-earmark-spreadsheet me-2"></i>
                            Bulk Upload
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link border-0 me-3 ${activeTab === 'single' ? 'active fw-bold border-bottom border-3 border-success text-success' : 'text-muted'}`} 
                            style={{borderRadius: 0, paddingBottom: '15px'}}
                            onClick={() => setActiveTab('single')}
                        >
                            <i className="bi bi-plus-circle me-2"></i>
                            Add Single Product
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link border-0 ${activeTab === 'list' ? 'active fw-bold border-bottom border-3 border-success text-success' : 'text-muted'}`} 
                            style={{borderRadius: 0, paddingBottom: '15px'}}
                            onClick={() => setActiveTab('list')}
                        >
                            <i className="bi bi-list-ul me-2"></i>
                            View Listings
                        </button>
                    </li>
                </ul>
            </div>

            {/* Tab Content Area */}
            <div className="bg-white p-4 rounded-bottom shadow-sm border border-top-0">
                
                {activeTab === 'upload' && (
                    <div className="animate__animated animate__fadeIn">
                        <BulkProductAdd />
                    </div>
                )}

                {activeTab === 'single' && (
                    <div className="animate__animated animate__fadeIn">
                        <SingleProductAdd />
                    </div>
                )}

                 {activeTab === 'list' && (
                    <div className="animate__animated animate__fadeIn">
                        {/* THE NEW COMPONENT */}
                        <ProductList />
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventoryPage;