import { useState, useEffect } from 'react';
import axios from 'axios';

const OrderManagement = () => {
    // UI State
    const [activeTab, setActiveTab] = useState('Pending Labels');
    const [orders, setOrders] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [filters,setFilters]=useState({
        fromDate:"",
        toDate:"",
        channel:"",
        sku:"",
    })
    const [stats,setStats] = useState({approved:0,new:0,packed:0,dispatch_ready:0,shipped:0,on_hold:0});
    // --- NEW: DRAWER STATE ---
    const [quickViewOrder, setQuickViewOrder] = useState(null); // Stores the order object to show in drawer
    const [searchTerm ,setSearchTerm] = useState("");
    const statusMap = {
        'Pending Labels':'Approved'||'NEW',
        'Pending RTD':'PACKING_IN_PROGRESS',
        'Pending Handover':'DISPATCH_READY',
        'Completed':'SHIPPED',
        'On-Hold':'ON-HOLD'
    };
    statusMap[activeTab];   
    useEffect(() => {fetchCounts(); }, [activeTab]);
    const fetchCounts = async()=>{
        try{

            const res=await axios.get(`http://localhost:8080/api/orders/flow/counts`);
            setStats(res.data); 
        }catch(e){
                console.error("Error Fetching order count;",err);
        }
    }
    
    //---- Filtering Feature

    const handleApplyFilters = async () => {
        // Build Query String
        const params = new URLSearchParams();
        params.append("status", statusMap[activeTab]); // Always filter by current tab
        
        if(filters.fromDate) params.append("fromDate", filters.fromDate);
        if(filters.toDate) params.append("toDate", filters.toDate);
        if(filters.channel) params.append("channel", filters.channel);
        if(filters.sku) params.append("sku", filters.sku); // Assuming backend supports SKU search in filter

        console.log("Applying Filters:", params.toString());

        try {
            // Call the Filter Endpoint we created earlier
            const res = await axios.get(`http://localhost:8080/api/orders/flow/filter?${params.toString()}`);
            
            // Map Data (Reuse your mapping logic here)
            const mappedOrders = res.data.map(order => ({
                id: order.id,
                orderId: order.orderId,
                itemId:order.orderItemId||order.uniqueReferenceId,
                channel:order.channel,
                img: order.imageUrl
                    ? (order.imageUrl.startsWith('http') ? order.imageUrl :
                'http://localhost:8080/${order.imageUrl}')
                : "http://via.placeholder.com/100",
                
                title:order.productName,
                sku:order.sku,
                fsn:order.fsn || order.asin,
                itemcost:order.itemCost,
                qty:order.quantity,
                amount:order.sellingPrice||order.productPayment+((order.productPayment*39)/100),

                //SLA Cancellation
                slaHours:order.slaHours,
                dispatchBy:order.dispatchByDate,
                
                originalData:order

        }));
        
        setOrders(mappedOrders);
        alert("Filters applied! (Check console for query params)");
        } catch (err) {
            console.error(err);
        }
    };
    const handleReset = () => {
        setFilters({ fromDate: "", toDate: "", channel: "", sku: "" });
        fetchOrders(); // Reload original list
    };

    // ---- Search Feature useEffect

    useEffect(()=>{
        const delayDebounceFn = setTimeout( async () => {
            if(searchTerm.trim()){
                try{
            const res=axios.get(`http://localhost:8080/api/orders/flow/search?query=${searchTerm}`);  
            const mappedResults =(await res).data.map(order=>({
                id: order.id,
                orderId: order.orderId,
                itemId:order.orderItemId||order.uniqueReferenceId,
                channel:order.channel,
                img: order.imageUrl
                    ? (order.imageUrl.startsWith('http') ? order.imageUrl :
                'http://localhost:8080/${order.imageUrl}')
                : "http://via.placeholder.com/100",
                
                title:order.productName,
                sku:order.sku,
                fsn:order.fsn || order.asin,
                itemcost:order.itemCost,
                qty:order.quantity,
                amount:order.sellingPrice||order.productPayment+((order.productPayment*39)/100),

                //SLA Cancellation
                slaHours:order.slaHours,
                dispatchBy:order.dispatchByDate,
                
                originalData:order

            }));
            setOrders(mappedResults);
        }catch(error){
            console.error("Search failed",error);
            }  
        }else{
            fetchOrders();
        }
        },800);
        
        return ()=>clearTimeout(delayDebounceFn);
    },[searchTerm]);

    useEffect(() => { fetchOrders(); }, [activeTab]);
    const fetchOrders = async()=>{
        try{
            const dbStatus = statusMap[activeTab];

            // 1. Call Backend
            const res=await axios.get(`http://localhost:8080/api/orders/flow/list?status=${dbStatus}`);

            //2. Data Normalization (Convert DB Format -> UI Format)
            const formattedData=res.data.map(order => ({
                id: order.id,
                orderId: order.orderId,
                itemId:order.orderItemId||order.uniqueReferenceId,
                channel:order.channel,
                img: order.imageUrl
                    ? (order.imageUrl.startsWith('http') ? order.imageUrl :
                'http://localhost:8080/${order.imageUrl}')
                : "http://via.placeholder.com/100",
                
                title:order.productName,
                sku:order.sku,
                fsn:order.fsn || order.asin,
                itemcost:order.itemCost,
                qty:order.quantity,
                amount:order.sellingPrice||order.productPayment+((order.productPayment*39)/100),

                //SLA Cancellation
                slaHours:order.slaHours,
                dispatchBy:order.dispatchByDate,
                
                originalData:order


            }));

            setOrders(formattedData);
        }catch(e){
            console.error("Error Fetching orders;",err);
        }
    };

    const handleAction = async (actionEndpoint) => {
        if(selectedIds.length===0){
           alert("Please select at least one order.");
            return;
        }
        try{
                const res=await axios.post(`http://localhost:8080/api/orders/flow/${actionEndpoint}`,{
                ids:selectedIds
            });
            alert("Success!");
            setSelectedIds([]);
            fetchOrders();
            fetchCounts();
            }catch(error){
                console.err(error);
                alert("Action Failed: " + error.message);

            }
    }

    // Selection Handlers
    const toggleSelect = (id) => {
        if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(item => item !== id));
        else setSelectedIds([...selectedIds, id]);
    };

    const toggleSelectAll = (e) => {
        if (e.target.checked) setSelectedIds(orders.map(o => o.id));
        else setSelectedIds([]);
    };

    // Helper: SLA Badge
    const getSlaDisplay = (hours, date) => {
        if(hours<0){
            const delayedBy = Math.abs(hours);
            return(
               <div className="sla-badge" style={{backgroundColor: '#ffe3e3', color: '#c53030', border: '1px solid #c53030'}}>
                    <i className="bi bi-exclamation-octagon-fill"></i>
                    <div>
                        <div>Delayed by {delayedBy} hrs</div>
                        <div className="small opacity-75">SLA Breached</div>
                    </div>
                </div>
            );
        }
        if (hours < 4) {
            return (
                <div className="sla-badge danger sla-pulse">
                    <i className="bi bi-exclamation-circle-fill"></i>
                    <div>
                        <div>Urgent: {hours} hrs left</div>
                        <div className="small opacity-75">{date}</div>
                    </div>
                </div>
            );
        } 
         else if (hours < 24) {
            return (
                <div className="sla-badge warning">
                    <i className="bi bi-clock-history"></i>
                    <div>
                        <div>{hours} hrs left</div>
                        <div className="small opacity-75">{date}</div>
                    </div>
                </div>
            );
        }
    return (
            <div className="sla-badge safe">
                <i className="bi bi-check-circle"></i>
                <div>
                    <div>On Time</div>
                    <div className="small opacity-75">{date}</div>
                </div>
            </div>
        );
    };

    const getPrimaryAction = () =>{
        switch(activeTab){
            case 'Pending Labels':
                return{
                    label:"Generate Labels",
                    icon:"bi-printer",
                    endpoint:"generate-labels"
                };
            case 'Pending RTD':
                return{
                    label:"Mark Ready to Dispatch",
                    icon:"bi-box-sem",
                    endpoint:"mark-rtd"
                };
            case 'Pending Handover':
                return{
                    label:"Download Manifest",
                    icon:"bi-file-earmark-spreadsheet",
                    endpoint:"manifest"
                };
            case 'On-Hold':
                return{
                    label:"Release Orders",
                    icon:"bi-box-sem",
                    endpoint:"unhold"
                };
            case 'Completed':
                return{
                    label:"Download Orders",
                    icon:"bi-file-earmark-spreadsheet",
                    endpoint:"download-orders"
                };
                default:
                    return null;
        }
    };
    const currentAction = getPrimaryAction();

    return (
        <div className="container-fluid p-0 position-relative">
            
            {/* --- DRAWER BACKDROP --- */}
            <div 
                className={`drawer-backdrop ${quickViewOrder ? 'open' : ''}`} 
                onClick={() => setQuickViewOrder(null)}
            ></div>

            {/* --- SLIDE-OVER DRAWER --- */}
            <div className={`drawer-panel ${quickViewOrder ? 'open' : ''}`}>
                {quickViewOrder && (
                    <>
                        <div className="drawer-header">
                            <h5 className="fw-bold m-0"><i className="bi bi-eye me-2 text-primary"></i>Quick Insights</h5>
                            <button className="btn-close" onClick={() => setQuickViewOrder(null)}></button>
                        </div>
                        <div className="drawer-body">
                            
                            {/* 1. Header Info */}
                            <div className="d-flex gap-3 mb-4">
                                <img src={quickViewOrder.img} className="rounded border" style={{width: 60, height: 60, objectFit: 'cover'}} />
                                <div>
                                    <div className="fw-bold text-truncate" style={{maxWidth: '280px'}}>{quickViewOrder.title}</div>
                                    <div className="small text-muted font-monospace">{quickViewOrder.sku}</div>
                                </div>
                            </div>

                            {/* 2. PROFIT CALCULATOR (The "Money" View) */}
                            <h6 className="fw-bold text-dark mb-3"><i className="bi bi-cash-coin me-2"></i>Unit Economics</h6>
                            <div className="profit-card">
                                <div className="info-row">
                                    <span className="text-muted">Selling Price</span>
                                    <span className="fw-bold">₹ {quickViewOrder.amount}</span>
                                </div>
                                <div className="info-row">
                                    <span className="text-muted">Product Cost (COGS)</span>
                                    <span className="text-danger">- ₹ {quickViewOrder.itemcost}</span>
                                </div>
                                <div className="info-row">
                                    <span className="text-muted">Est. Marketplace Fee (20%)</span>
                                    <span className="text-danger">- ₹ {(quickViewOrder.amount * 0.2).toFixed(0)}</span>
                                </div>
                                <div className="info-row total">
                                    <span>Net Profit</span>
                                    <span>₹ {(quickViewOrder.amount - quickViewOrder.cost - (quickViewOrder.amount * 0.2)).toFixed(0)}</span>
                                </div>
                            </div>

                            {/* 3. MANUFACTURING INFO */}
                            <h6 className="fw-bold text-dark mb-3 mt-4"><i className="bi bi-boxes me-2"></i>Manufacturing & Batch</h6>
                            <div className="bg-light p-3 rounded border mb-3">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="small text-muted">Batch Number:</span>
                                    <span className="small fw-bold font-monospace">{quickViewOrder.mfgBatch}</span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="small text-muted">Fabric Lot:</span>
                                    <span className="small fw-bold">COT-99-BLK</span>
                                </div>
                            </div>

                            {/* 4. Timeline */}
                            <div className="ps-2">
                                <div className="timeline-item active">
                                    <div className="small fw-bold">Order Received</div>
                                    <div className="text-muted" style={{fontSize: '11px'}}>Today, 10:00 AM</div>
                                </div>
                                <div className="timeline-item active">
                                    <div className="small fw-bold">Inventory Reserved</div>
                                    <div className="text-muted" style={{fontSize: '11px'}}>Today, 10:05 AM</div>
                                </div>
                                <div className="timeline-item">
                                    <div className="small text-muted">Ready to Dispatch</div>
                                </div>
                            </div>

                        </div>
                        <div className="p-3 border-top bg-light">
                            <button className="btn btn-primary w-100" onClick={() => alert("Redirecting to full Cost Analysis...")}>
                                View Full Analytics
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* --- MAIN PAGE CONTENT --- */}
            <div className="d-flex justify-content-between align-items-end mb-5">
                <div>
                    <h3 className="fw-bold text-dark mb-1">Order Management</h3>
                    <p className="text-muted small mb-0">Manage shipments, labels, and dispatch processing.</p>
                </div>
                <div className="d-flex gap-2">
                <button className="btn btn-light border shadow-sm"><i className="bi bi-cloud-download me-2"></i>Reports</button>
                <button className="btn btn-success shadow-sm" onClick={()=>window.location.href='/orders/create'}><i className="bi bi-plus-lg me-2"></i>Create Manual Order</button>
                 <button  className="btn btn-dark shadow-sm" onClick={()=>window.location.href='/dispatch/scan'}>
                 <i className="bi bi-upc-scan me-2"></i> Scan & Pack
                </button>
                </div>
               
            </div>

            <div className="row g-4 mb-5">
                {[
                    { label: "Pending Labels", val:stats.approved, icon: "bi-tags", color: "text-primary" },
                    { label: "Pending RTD", val: stats.dispatch_ready, icon: "bi-box-seam", color: "text-warning" },
                    { label: "Handover Pending", val: stats.packed, icon: "bi-truck", color: "text-info" },
                    { label: "In Transit", val: stats.shipped, icon: "bi-map", color: "text-success" },
                    { label: "Completed", val: stats.delivered, icon: "bi-map", color: "text-success" },
                ].map((stat, idx) => (
                    <div className="col-md-3" key={idx}>
                        <div className="modern-stat-card">
                            <div className="stat-label">{stat.label}</div>
                            <div className={`stat-value ${stat.color} mt-2`}>{stat.val}</div>
                            <i className={`bi ${stat.icon} stat-icon-bg`}></i>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-top-4 border border-bottom-0 shadow-sm p-4 pb-0">
                <div className="d-flex justify-content-between align-items-center border-bottom pb-3">
                    <div className="modern-tabs mb-0 border-bottom-0">
                        {['Pending Labels', 'Pending RTD', 'Pending Handover', 'Completed','On-Hold'].map(tab => (
                            <div key={tab} className={`modern-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                                {tab}
                                {activeTab === tab && <span className="badge bg-success-subtle text-success ms-2 rounded-pill">{}</span>}
                            </div>
                        ))}
                    </div>
                    <div className="d-flex gap-2">
                        <div className="input-group input-group-sm" style={{width: '250px'}}>
                            <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
                            <input type="text" className="form-control" placeholder="Order ID or SKU..."  value={searchTerm} onChange={(e)=> setSearchTerm(e.target.value)}/>
                        </div>
                        
                    </div>
                    
                </div>
                
            </div>

            <div className="bg-white border rounded-bottom-4 shadow-sm overflow-hidden" style={{marginBottom: '100px'}}>
                <div className="filter-bar-container mb-1">
                    
                    {/* Icon */}
                    <div className="filter-icon-box">
                        <i className="bi bi-funnel-fill"></i>
                    </div>

                    {/* Date Range Group */}
                    <div className="date-range-group">
                        <input 
                            type="text" 
                            className="date-range-input" 
                            placeholder="Start Date" 
                            onFocus={(e) => e.target.type = 'date'}
                            onBlur={(e) => e.target.type = 'text'}
                            value={filters.fromDate}
                            onChange={(e) => setFilters({...filters, fromDate: e.target.value})}
                        />
                        <span className="date-separator">to</span>
                        <input 
                            type="text" 
                            className="date-range-input" 
                            placeholder="End Date"
                            onFocus={(e) => e.target.type = 'date'}
                            onBlur={(e) => e.target.type = 'text'}
                            value={filters.toDate}
                            onChange={(e) => setFilters({...filters, toDate: e.target.value})}
                        />
                    </div>

                    {/* Channel Dropdown */}
                    <select 
                        className="compact-select"
                        value={filters.channel}
                        onChange={(e) => setFilters({...filters, channel: e.target.value})}
                    >
                        <option value="">Channel of Sale</option>
                        <option value="Flipkart">Flipkart</option>
                        <option value="Amazon">Amazon</option>
                        <option value="Meesho">Meesho</option>
                    </select>

                    {/* SKU Input */}
                    <input 
                        type="text" 
                        className="compact-input" 
                        placeholder="Search SKU / FSN"
                        value={filters.sku}
                        onChange={(e) => setFilters({...filters, sku: e.target.value})}
                    />

                    {/* Buttons */}
                    <button className="btn-apply ms-2" onClick={handleApplyFilters}>Apply</button>
                    <span className="btn-reset" onClick={handleReset}>Reset</span>
                </div>

                <div className="table-responsive">    
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th width="40"><input type="checkbox" className="form-check-input" onChange={toggleSelectAll} checked={selectedIds.length === orders.length && orders.length > 0} /></th>
                                <th>Order Details</th>
                                <th width="35%">Product Information</th>
                                <th className="text-center">Qty</th>
                                <th>Amount</th>
                                <th>SLA / Dispatch By</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id} className={selectedIds.includes(order.id) ? "bg-light" : ""}>
                                    <td><input type="checkbox" className="form-check-input" checked={selectedIds.includes(order.id)} onChange={() => toggleSelect(order.id)} /></td>
                                    <td>
                                        <div className="fw-bold text-primary" style={{fontFamily: 'monospace', fontSize: '13px'}}>
                                            {order.orderId}
                                            <i className="bi bi-copy copy-icon" title="Copy Order ID"></i>
                                        </div>
                                        <div className="text-muted small mt-1">ID: {order.itemId} <i className="bi bi-copy copy-icon"></i></div>
                                        <span className="badge bg-light text-dark border mt-2">{order.channel}</span>
                                    </td>
                                    <td>
                                        <div className="product-flex">
                                            <div className="product-img-box"><img src={order.img} alt="Product" /></div>
                                            <div>
                                                <div className="fw-bold text-dark text-truncate" style={{maxWidth: '350px'}} title={order.title}>{order.title}</div>
                                                <div className="mt-2"><span className="meta-tag" title="SKU">SKU: {order.sku}</span><span className="meta-tag" title="FSN">ID: {order.fsn}</span></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-center fw-bold text-secondary">{order.qty}</td>
                                    <td>
                                        <div className="fw-bold text-dark">₹ {order.amount}</div>
                                        <div className="small text-success">Prepaid</div>
                                    </td>
                                    <td>{getSlaDisplay(order.slaHours, order.dispatchBy)}</td>
                                    
                                    {/* --- THE TRIGGER: EYE ICON --- */}
                                    <td className="text-end pe-4">
                                        <button 
                                            className="btn btn-sm btn-light border text-muted hover-shadow" 
                                            onClick={() => setQuickViewOrder(order)} // CLICK TO OPEN DRAWER
                                            title="Quick View Profit & Info"
                                        >
                                            <i className="bi bi-eye"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-3 border-top d-flex justify-content-between align-items-center bg-light">
                    <span className="small text-muted">Showing 1- {stats.approved} of {stats.approved} orders</span>
                    <div className="btn-group"><button className="btn btn-sm btn-white border">Previous</button><button className="btn btn-sm btn-white border">Next</button></div>
                </div>
            </div>

            {selectedIds.length > 0 && (
                <div className="floating-dock">
                    <div className="d-flex align-items-center gap-2"><div className="dock-counter">{selectedIds.length}</div><span className="small fw-bold">Selected</span></div>
                    <div className="dock-divider"></div>
                    <button className="dock-btn" title="Download Invoices"><i className="bi bi-file-earmark-pdf fs-5"></i></button>
                    <button className="dock-btn" title="Hold Shipment" onClick={()=>handleAction('on-hold')}><i className="bi bi-pause-circle fs-5"></i></button>
                    <button className="dock-btn text-danger" title="Cancel Orders" onClick={()=> window.confirm("Are you sure ?")?handleAction('cancel'):""}><i className="bi bi-x-circle fs-5"></i></button>
                    <div className="dock-divider"></div>
                    <button className="dock-btn dock-btn-primary" onClick={() => handleAction(currentAction.endpoint)}><i className={`bi ${currentAction.icon}`}></i>{currentAction.label}</button>
                    <button className="dock-btn ms-3 text-white" onClick={() => setSelectedIds([])}><i className="bi bi-x-lg"></i></button>
                </div>
            )}
        </div>
    );
};

export default OrderManagement;