import { useEffect } from 'react';
import QuickInbound from './QuickInbound';
import { useSearchParams } from 'react-router-dom'; 
import BulkStockOp from './BulkStockOp';
import AllInventoryView from './AllInventoryView'; // We will reuse/modify ProductList for this

const InventoryMain = () => {

    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab')||('view');
    const handleTabChange=(tabName)=>{
        setSearchParams({ tab: tabName });
    }
    useEffect(() => {
        const currentTab = searchParams.get('tab');
        const validTabs = ['view', 'inbound', 'bulk'];
        if (currentTab && !validTabs.includes(currentTab)) {
            setSearchParams({ tab: 'view' }, { replace: true });
        }
    }, [searchParams, setSearchParams]);
    

    return (
        <div className="container-fluid p-0">
            <style>{`
            @media (max-width: 767.98px) {
                .tverse-ops-tabs {
                    display: flex !important;
                    flex-wrap: nowrap !important;
                    overflow-x: auto !important;
                    white-space: nowrap !important;
                    -webkit-overflow-scrolling: touch;
                    scrollbar-width: none;
                }
                .tverse-ops-tabs::-webkit-scrollbar {
                    display: none !important;
                    width: 0 !important;
                    height: 0 !important;
                }
                .tverse-ops-tabs .nav-item {
                    flex: 0 0 auto;
                }
                .tverse-ops-tabs .nav-link {
                    font-size: 13.5px !important;
                    padding-bottom: 12px !important;
                }
            }
        `}</style>
            <h3 className="fw-bold mb-4">Inventory Operations</h3>

            {/* Tabs */}
            <div className="bg-white rounded-top border-bottom px-4 pt-3 shadow-sm">
                <ul className="nav nav-tabs border-0 tverse-ops-tabs">
                    <li className="nav-item">
                        <button 
                            className={`nav-link border-0 me-3 ${activeTab === 'view' ? 'active fw-bold border-bottom border-3 border-primary text-primary' : 'text-muted'}`} 
                            onClick={() => handleTabChange('view')}
                        >
                            <i className="bi bi-table me-2"></i> All Inventory
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link border-0 me-3 ${activeTab === 'inbound' ? 'active fw-bold border-bottom border-3 border-primary text-primary' : 'text-muted'}`} 
                            onClick={() => handleTabChange('inbound')}
                        >
                            <i className="bi bi-upc-scan me-2"></i> Quick Inbound (Scanner)
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link border-0 me-3 ${activeTab === 'bulk' ? 'active fw-bold border-bottom border-3 border-primary text-primary' : 'text-muted'}`} 
                            onClick={() => handleTabChange('bulk')}
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