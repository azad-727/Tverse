import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Components/Layout'; // Import our new Layout
import Dashboard from './Components/Dashboard';
import InventoryPage from './Components/InventoryPage';
import ProductDetail from './Components/ProductDetail';//
import InventoryMain from './Components/inventory/InventoryMain';
import PicklistPage from './Components/PicklistPage';
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
            <Route path="/inventory/product/:id" element={<div className="p-4"><ProductDetail /></div>} />   
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;