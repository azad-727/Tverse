import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Components/Layout'; // Import our new Layout
import Dashboard from './Components/Dashboard';
import InventoryPage from './Components/InventoryPage';
import ProductDetail from './Components/ProductDetail';//
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
import AbcDashboard from './Components/analytics/AbcDashboard';
import AnalyticsMain from './Components/analytics/AnalyticsMain';
import AttendanceKiosk from './Components/AttendanceKiosk';
function App() {
  return (
    <BrowserRouter>
      {/* The Layout wraps the content so Sidebar is always there */}
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
            
            <Route path="/inventory/all" element={<InventoryPage />} /> {/* Reuse your existing Table Page */}
            <Route path="/inventory" element={<InventoryPage />} /> {/* Default */}
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
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;