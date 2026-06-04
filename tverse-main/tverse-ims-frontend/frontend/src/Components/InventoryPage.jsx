import { useEffect } from 'react'; 
import { useSearchParams } from 'react-router-dom';
import BulkProductAdd from './BulkProductUpload';
import SingleProductAdd from './SingleProductUpload';
import ProductList from './ProductList';

const InventoryPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    // RESOLVE ACTIVE TAB STATE DYNAMICALLY FROM THE BROWSER URL BAR
    const activeTab = searchParams.get('tab') || 'upload';

    // Helper handler to cleanly modify parameters without breaking SPA contexts
    const handleTabChange = (tabName) => {
        setSearchParams({ tab: tabName });
    };

    // Optional Guard: Clean up dirty or illegal route states automatically
    useEffect(() => {
        const currentTab = searchParams.get('tab');
        const validTabs = ['upload', 'single', 'list'];
        
        if (currentTab && !validTabs.includes(currentTab)) {
            setSearchParams({ tab: 'upload' }, { replace: true });
        }
    }, [searchParams, setSearchParams]);
        
    return (
        <div className="container-fluid p-0">
            
            {/* COMPONENT-SPECIFIC MOBILE RESPONSIVE ENGINE */}
            <style>{`
                /* MOBILE VIEWPORT ADJUSTMENTS (xs/sm devices) */
                @media (max-width: 767.98px) {
                    .tverse-responsive-tabs {
                        display: flex !important;
                        flex-nowrap: nowrap !important;
                        overflow-x: auto !important;
                        white-space: nowrap !important;
                        -webkit-overflow-scrolling: touch; /* High-speed native momentum scrolling on iOS */
                        scrollbar-width: none; /* Hides standard Firefox scrollbar track */
                    }
                    
                    /* Hide default WebKit scrollbars on Chrome/Safari/Edge */
                    .tverse-responsive-tabs::-webkit-scrollbar {
                        display: none !important;
                        width: 0 !important;
                        height: 0 !important;
                    }

                    .tverse-responsive-tabs .nav-item {
                        flex: 0 0 auto; /* Blocks tabs from shrinking or collapsing text spacing */
                    }

                    .tverse-responsive-tabs .nav-link {
                        font-size: 13.5px !important;
                        padding-left: 12px !important;
                        padding-right: 12px !important;
                        padding-bottom: 12px !important;
                    }
                }
            `}</style>

            {/* Header Layout */}
            <div className="d-flex justify-content-between align-items-center mb-4 px-2 px-md-0">
                <h3 className="fw-bold mb-0" style={{ letterSpacing: '-0.5px' }}>Inventory & Catalog</h3>
                <div className="text-muted small d-none d-sm-block">Manage your product listings</div>
            </div>

            {/* Tab Navigation Menu Bar */}
            {/* FIXED: Embedded tverse-responsive-tabs viewport wrapper to support horizontal swipe formatting */}
            <div className="bg-white rounded-top border-bottom px-3 px-md-4 pt-3 shadow-sm overflow-hidden">
                <ul className="nav nav-tabs border-0 tverse-responsive-tabs">
                    <li className="nav-item">
                        <button 
                            className={`nav-link border-0 me-2 me-md-3 ${activeTab === 'upload' ? 'active fw-bold border-bottom border-3 border-success text-success' : 'text-muted'}`} 
                            style={{ borderRadius: 0, paddingBottom: '15px' }}
                            onClick={() => handleTabChange('upload')}
                        >
                            <i className="bi bi-file-earmark-spreadsheet me-2"></i>
                            Bulk Upload
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link border-0 me-2 me-md-3 ${activeTab === 'single' ? 'active fw-bold border-bottom border-3 border-success text-success' : 'text-muted'}`} 
                            style={{ borderRadius: 0, paddingBottom: '15px' }}
                            onClick={() => handleTabChange('single')}
                        >
                            <i className="bi bi-plus-circle me-2"></i>
                            Add Single Product
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link border-0 ${activeTab === 'list' ? 'active fw-bold border-bottom border-3 border-success text-success' : 'text-muted'}`} 
                            style={{ borderRadius: 0, paddingBottom: '15px' }}
                            onClick={() => handleTabChange('list')}
                        >
                            <i className="bi bi-list-ul me-2"></i>
                            View Listings
                        </button>
                    </li>
                </ul>
            </div>

            {/* Tab Content Display Area */}
            <div className="bg-white p-3 p-md-4 rounded-bottom shadow-sm border border-top-0">
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
                        <ProductList />
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventoryPage;