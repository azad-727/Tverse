import { useState, useEffect } from 'react';
import apiClient from '../apiClient';

const OrderManagement = () => {
    const [activeTab, setActiveTab] = useState('Pending Labels');
    const [orders, setOrders] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [filters,setFilters]=useState({ fromDate:"", toDate:"", channel:"", sku:"" });
    const [stats,setStats] = useState({approved:"",new:"",packing_in_progress:"",dispatch_ready:"",shipped:"",on_hold:""});
    const [quickViewOrder, setQuickViewOrder] = useState(null);
    const [searchTerm ,setSearchTerm] = useState("");

    const statusMap = {
        'Pending Labels':'Approved'||'NEW',
        'Pending RTD':'PACKING_IN_PROGRESS',
        'Pending Handover':'DISPATCH_READY',
        'Completed':'SHIPPED',
        'On-Hold':'ON-HOLD'
    };

    const fetchCounts = async ()=> {
        try{
            const res=await apiClient.get(`/api/orders/flow/counts`);
            console.log("COUNTS RESPONSE:", res.data);
            setStats(res.data); 
        }catch(e){ console.error("Error Fetching order count;",e); }
    }

    const handleApplyFilters = async () => {
        const params = new URLSearchParams();
        params.append("status", statusMap[activeTab]);
        if(filters.fromDate) params.append("fromDate", filters.fromDate);
        if(filters.toDate) params.append("toDate", filters.toDate);
        if(filters.channel) params.append("channel", filters.channel);
        if(filters.sku) params.append("sku", filters.sku);
        console.log("Applying Filters:", params.toString());
        try {
            const res = await apiClient.get(`/api/orders/flow/filter?${params.toString()}`);
            const mappedOrders = res.data.map(order => ({
                id: order.id, orderId: order.orderId,
                itemId:order.orderItemId||order.uniqueReferenceId, channel:order.channel,
                img: order.imageUrl ? (order.imageUrl.startsWith('http') ? order.imageUrl : `${apiClient.defaults.baseURL || 'http://localhost:8080'}/${order.imageUrl}`) : "http://via.placeholder.com/100",
                title:order.productName, sku:order.sku, fsn:order.fsn || order.asin,
                itemcost:order.itemCost, qty:order.quantity,
                amount:order.sellingPrice||order.productPayment+((order.productPayment*39)/100),
                slaHours:order.slaHours, dispatchBy:order.dispatchByDate, originalData:order
            }));
            setOrders(mappedOrders);
            alert("Filters applied!");
        } catch (err) { console.error(err); }
    };

    const handleReset = () => {
        setFilters({ fromDate: "", toDate: "", channel: "", sku: "" });
        fetchOrders();
    };

    useEffect(()=>{
        const delayDebounceFn = setTimeout( async () => {
            if(searchTerm.trim()){
                try{
                    const res=apiClient.get(`/api/orders/flow/search?query=${searchTerm}`);  
                    const mappedResults =(await res).data.map(order=>({
                        id: order.id, orderId: order.orderId,
                        itemId:order.orderItemId||order.uniqueReferenceId, channel:order.channel,
                        img: order.imageUrl ? (order.imageUrl.startsWith('http') ? order.imageUrl : `${apiClient.defaults.baseURL || 'http://localhost:8080' }/${order.imageUrl}`) : "http://via.placeholder.com/100",
                        title:order.productName, sku:order.sku, fsn:order.fsn || order.asin,
                        itemcost:order.itemCost, qty:order.quantity,
                        amount:order.sellingPrice||order.productPayment+((order.productPayment*39)/100),
                        slaHours:order.slaHours, dispatchBy:order.dispatchByDate, originalData:order
                    }));
                    setOrders(mappedResults);
                }catch(error){ console.error("Search failed",error); }  
            }else{ fetchOrders(); }
        },800);
        return ()=>clearTimeout(delayDebounceFn);
    },[searchTerm]);

    useEffect(() => { fetchOrders(); fetchCounts(); }, [activeTab]);

    const fetchOrders = async()=>{
        try{
            const dbStatus = statusMap[activeTab];
            const res=await apiClient.get(`/api/orders/flow/list?status=${dbStatus}`);
            const formattedData=res.data.map(order => ({
                id: order.id, orderId: order.orderId,
                itemId:order.orderItemId||order.uniqueReferenceId, channel:order.channel,
                img: order.imageUrl ? (order.imageUrl.startsWith('http') ? order.imageUrl : `${apiClient.defaults.baseUrl || 'http://localhost:8080'}/${order.imageUrl}`) : "http://via.placeholder.com/100",
                title:order.productName, sku:order.sku, fsn:order.fsn || order.asin,
                itemcost:order.itemCost, qty:order.quantity,
                amount:order.sellingPrice||order.productPayment+((order.productPayment*39)/100),
                slaHours:order.slaHours, dispatchBy:order.dispatchByDate, originalData:order
            }));
            setOrders(formattedData);
        }catch(e){ console.error("Error Fetching orders;",e); }
    };

    const handleAction = async (actionEndpoint) => {
        if(selectedIds.length===0){ alert("Please select at least one order."); return; }
        try{
            await apiClient.post(`/api/orders/flow/${actionEndpoint}`,{ ids:selectedIds });
            alert("Success!");
            setSelectedIds([]);
            fetchOrders();
            fetchCounts();
        }catch(error){
            console.error(error);
            alert("Action Failed: " + error.message);
        }
    }

    const toggleSelect = (id) => {
        if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(item => item !== id));
        else setSelectedIds([...selectedIds, id]);
    };
    const toggleSelectAll = (e) => {
        if (e.target.checked) setSelectedIds(orders.map(o => o.id));
        else setSelectedIds([]);
    };

    const getSlaDisplay = (hours, date) => {
        if(hours<0){
            const delayedBy = Math.abs(hours);
            return(
               <div className="sla-badge" style={{backgroundColor: '#ffe3e3', color: '#c53030', border: '1px solid #c53030'}}>
                    <i className="bi bi-exclamation-octagon-fill"></i>
                    <div><div>Delayed by {delayedBy} hrs</div><div className="small opacity-75">SLA Breached</div></div>
                </div>
            );
        }
        if (hours < 4) {
            return (
                <div className="sla-badge danger sla-pulse">
                    <i className="bi bi-exclamation-circle-fill"></i>
                    <div><div>Urgent: {hours} hrs left</div><div className="small opacity-75">{date}</div></div>
                </div>
            );
        } else if (hours < 24) {
            return (
                <div className="sla-badge warning">
                    <i className="bi bi-clock-history"></i>
                    <div><div>{hours} hrs left</div><div className="small opacity-75">{date}</div></div>
                </div>
            );
        }
        return (
            <div className="sla-badge safe">
                <i className="bi bi-check-circle"></i>
                <div><div>On Time</div><div className="small opacity-75">{date}</div></div>
            </div>
        );
    };

    const getPrimaryAction = () =>{
        switch(activeTab){
            case 'Pending Labels': return{ label:"Generate Labels", icon:"bi-printer", endpoint:"generate-labels" };
            case 'Pending RTD': return{ label:"Mark Ready to Dispatch", icon:"bi-box-seam", endpoint:"mark-rtd" };
            case 'Pending Handover': return{ label:"Download Manifest", icon:"bi-file-earmark-spreadsheet", endpoint:"manifest" };
            case 'On-Hold': return{ label:"Release Orders", icon:"bi-box-seam", endpoint:"unhold" };
            case 'Completed': return{ label:"Download Orders", icon:"bi-file-earmark-spreadsheet", endpoint:"download-orders" };
            default: return null;
        }
    };
    const currentAction = getPrimaryAction();

    return (
        <div className="container-fluid p-0 position-relative">
            <style>{`

                /* ================================================
                   MOBILE CARD VIEW — hidden by default
                   ================================================ */
                .mobile-card-view { display: none; }

                /* ================================================
                   DESKTOP (≥993px) — original layout, zero changes
                   ================================================ */
                @media (min-width: 993px) {
                    .pro-table-desktop-view { display: block !important; }
                    .mobile-card-view { display: none !important; }
                }

                /* ================================================
                   MOBILE (≤992px) — fix only, no visual changes
                   ================================================ */
                @media (max-width: 992px) {

                    /* Switch table → cards */
                    .pro-table-desktop-view { display: none !important; }
                    .mobile-card-view { display: block !important; }

                    /* --- Page header: stack vertically --- */
                    .om-page-header {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 12px !important;
                        margin-bottom: 20px !important;
                    }
                    .om-page-header > div:last-child {
                        flex-wrap: wrap !important;
                        width: 100% !important;
                    }
                    .om-page-header .btn {
                        flex: 1 1 auto !important;
                        font-size: 12px !important;
                        padding: 6px 10px !important;
                    }

                    /* --- Stat cards: 2 columns --- */
                    .om-stats-row > .col-md-3 {
                        flex: 0 0 50% !important;
                        max-width: 50% !important;
                    }

                    /* --- Tabs + search bar: stack vertically --- */
                    .om-tabs-search-bar {
                        flex-direction: column !important;
                        align-items: stretch !important;
                        gap: 10px !important;
                    }
                    /* Tab strip scrolls horizontally, no wrap */
                    .modern-tabs {
                        overflow-x: auto !important;
                        white-space: nowrap !important;
                        display: flex !important;
                        flex-wrap: nowrap !important;
                        scrollbar-width: none !important;
                        -webkit-overflow-scrolling: touch !important;
                    }
                    .modern-tabs::-webkit-scrollbar { display: none !important; }
                    .modern-tab {
                        flex: 0 0 auto !important;
                        font-size: 12px !important;
                        padding: 6px 12px !important;
                    }
                    /* Search: full width */
                    .om-tabs-search-bar > div:last-child { width: 100% !important; }
                    .om-tabs-search-bar .input-group { width: 100% !important; }

                    /* --- Filter bar: wrap to 2-col grid --- */
                    .filter-bar-container {
                        display: grid !important;
                        grid-template-columns: 1fr 1fr !important;
                        gap: 8px !important;
                        padding: 10px 12px !important;
                        align-items: center !important;
                    }
                    .filter-icon-box { grid-column: 1 / -1 !important; }
                    .date-range-group {
                        grid-column: 1 / -1 !important;
                        display: flex !important;
                        flex-wrap: wrap !important;
                        gap: 6px !important;
                        align-items: center !important;
                    }
                    .date-range-input {
                        flex: 1 1 120px !important;
                        min-width: 0 !important;
                        font-size: 12px !important;
                    }
                    .compact-select, .compact-input {
                        width: 100% !important;
                        font-size: 12px !important;
                        box-sizing: border-box !important;
                    }
                    .btn-apply { flex: 1 !important; font-size: 12px !important; }
                    .btn-reset { flex: 1 !important; font-size: 12px !important; text-align: center !important; }

                    /* --- Drawer: full width --- */
                    .drawer-panel {
                        width: 100% !important;
                        max-width: 100% !important;
                    }

                    /* --- Floating dock: full width, wrap actions --- */
                    .floating-dock {
                        left: 8px !important;
                        right: 8px !important;
                        bottom: 12px !important;
                        width: auto !important;
                        flex-wrap: wrap !important;
                        gap: 6px !important;
                        padding: 10px 12px !important;
                    }
                    .dock-btn-primary {
                        flex: 1 1 100% !important;
                        justify-content: center !important;
                        margin-top: 4px !important;
                        margin-left: 0 !important;
                    }
                }

                /* ================================================
                   MOBILE ORDER CARD STYLES
                   (mirrors the visual language of the desktop table)
                   ================================================ */
                .order-mobile-card {
                    border: 1px solid #e9ecef;
                    border-radius: 12px;
                    padding: 14px;
                    margin-bottom: 10px;
                    background: #fff;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
                }
                .order-mobile-card.selected-card {
                    border-color: #0d6efd;
                    background: #f0f6ff;
                }
                .order-mobile-card-top {
                    display: flex;
                    gap: 10px;
                    align-items: flex-start;
                }
                .order-mobile-card-img {
                    width: 52px; height: 52px;
                    border-radius: 8px; object-fit: cover;
                    border: 1px solid #dee2e6; flex-shrink: 0;
                }
                .order-mobile-card-info { flex: 1; min-width: 0; }
                .order-mobile-card-title {
                    font-weight: 600; font-size: 13px; color: #212529;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .order-mobile-card-id {
                    font-size: 11px; color: #0d6efd;
                    font-family: monospace; margin-top: 2px;
                }
                .order-mobile-card-sku {
                    font-size: 11px; color: #6c757d; margin-top: 2px;
                }
                .order-mobile-card-meta {
                    display: flex; flex-wrap: wrap;
                    gap: 6px; margin-top: 10px; align-items: center;
                }
                .order-mobile-card-amount {
                    font-weight: 700; font-size: 14px;
                    color: #212529; margin-left: auto;
                }
                .order-mobile-card-qty {
                    font-size: 11px; color: #6c757d;
                    background: #f8f9fa; border: 1px solid #dee2e6;
                    padding: 2px 7px; border-radius: 5px;
                }
            `}</style>

            {/* DRAWER BACKDROP */}
            <div className={`drawer-backdrop ${quickViewOrder ? 'open' : ''}`} onClick={() => setQuickViewOrder(null)}></div>

            {/* SLIDE-OVER DRAWER — unchanged */}
            <div className={`drawer-panel ${quickViewOrder ? 'open' : ''}`}>
                {quickViewOrder && (
                    <>
                        <div className="drawer-header">
                            <h5 className="fw-bold m-0"><i className="bi bi-eye me-2 text-primary"></i>Quick Insights</h5>
                            <button className="btn-close" onClick={() => setQuickViewOrder(null)}></button>
                        </div>
                        <div className="drawer-body">
                            <div className="d-flex gap-3 mb-4">
                                <img src={quickViewOrder.img} className="rounded border" style={{width: 60, height: 60, objectFit: 'cover'}} />
                                <div>
                                    <div className="fw-bold text-truncate" style={{maxWidth: '280px'}}>{quickViewOrder.title}</div>
                                    <div className="small text-muted font-monospace">{quickViewOrder.sku}</div>
                                </div>
                            </div>
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
                                    <span>₹ {(quickViewOrder.amount - quickViewOrder.itemcost - (quickViewOrder.amount * 0.2)).toFixed(0)}</span>
                                </div>
                            </div>
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

            {/* PAGE HEADER */}
            <div className="d-flex justify-content-between align-items-end mb-5 om-page-header">
                <div>
                    <h3 className="fw-bold text-dark mb-1">Order Management</h3>
                    <p className="text-muted small mb-0">Manage shipments, labels, and dispatch processing.</p>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-light border shadow-sm" onClick={()=>window.location.href='/reports'}><i className="bi bi-cloud-download me-2"></i>Reports</button>
                    <button className="btn btn-success shadow-sm" onClick={()=>window.location.href='/orders/create'}><i className="bi bi-plus-lg me-2"></i>Create Manual Order</button>
                    <button className="btn btn-dark shadow-sm" onClick={()=>window.location.href='/dispatch/scan'}>
                        <i className="bi bi-upc-scan me-2"></i> Scan & Pack
                    </button>
                </div>
            </div>

            {/* STAT CARDS */}
            <div className="row g-4 mb-5 om-stats-row">
                {[
                    { label: "Pending Labels", val:stats.approved, icon: "bi-tags", color: "text-primary" },
                    { label: "Pending RTD", val: stats.packing_in_progress, icon: "bi-box-seam", color: "text-warning" },
                    { label: "Handover Pending", val: stats.dispatch_ready, icon: "bi-truck", color: "text-info" },
                    // { label: "In Transit", val: stats.shipped, icon: "bi-map", color: "text-success" },
                    { label: "Completed", val: stats.shipped, icon: "bi-map", color: "text-success" },
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

            {/* TABS + SEARCH */}
            <div className="bg-white rounded-top-4 border border-bottom-0 shadow-sm p-4 pb-0">
                <div className="d-flex justify-content-between align-items-center border-bottom pb-3 om-tabs-search-bar">
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
                            <input type="text" className="form-control" placeholder="Order ID or SKU..." value={searchTerm} onChange={(e)=> setSearchTerm(e.target.value)}/>
                        </div>
                    </div>
                </div>
            </div>

            {/* FILTER BAR + TABLE/CARDS */}
            <div className="bg-white border rounded-bottom-4 shadow-sm overflow-hidden" style={{marginBottom: '100px'}}>
                <div className="filter-bar-container mb-1">
                    <div className="filter-icon-box">
                        <i className="bi bi-funnel-fill"></i>
                    </div>
                    <div className="date-range-group">
                        <input type="text" className="date-range-input" placeholder="Start Date"
                            onFocus={(e) => e.target.type = 'date'} onBlur={(e) => e.target.type = 'text'}
                            value={filters.fromDate} onChange={(e) => setFilters({...filters, fromDate: e.target.value})} />
                        <span className="date-separator">to</span>
                        <input type="text" className="date-range-input" placeholder="End Date"
                            onFocus={(e) => e.target.type = 'date'} onBlur={(e) => e.target.type = 'text'}
                            value={filters.toDate} onChange={(e) => setFilters({...filters, toDate: e.target.value})} />
                    </div>
                    <select className="compact-select" value={filters.channel} onChange={(e) => setFilters({...filters, channel: e.target.value})}>
                        <option value="">Channel of Sale</option>
                        <option value="Flipkart">Flipkart</option>
                        <option value="Myntra">Myntra</option>
                        <option value="Amazon">Amazon</option>
                        <option value="Meesho">Meesho</option>
                    </select>
                    <input type="text" className="compact-input" placeholder="Search SKU / FSN"
                        value={filters.sku} onChange={(e) => setFilters({...filters, sku: e.target.value})} />
                    <button className="btn-apply ms-2" onClick={handleApplyFilters}>Apply</button>
                    <span className="btn-reset" onClick={handleReset}>Reset</span>
                </div>

                {/* DESKTOP TABLE — 100% original, not touched */}
                <div className="table-responsive pro-table-desktop-view">
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
                                    <td className="text-end pe-4">
                                        <button className="btn btn-sm btn-light border text-muted hover-shadow"
                                            onClick={() => setQuickViewOrder(order)} title="Quick View Profit & Info">
                                            <i className="bi bi-eye"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* MOBILE CARD VIEW — same data, card layout */}
                <div className="mobile-card-view p-3">
                    <div className="d-flex align-items-center gap-2 mb-3">
                        <input type="checkbox" className="form-check-input" onChange={toggleSelectAll}
                            checked={selectedIds.length === orders.length && orders.length > 0} />
                        <span className="small text-muted">Select All ({orders.length})</span>
                    </div>
                    {orders.map(order => (
                        <div key={order.id} className={`order-mobile-card ${selectedIds.includes(order.id) ? 'selected-card' : ''}`}>
                            <div className="order-mobile-card-top">
                                <input type="checkbox" className="form-check-input mt-1"
                                    checked={selectedIds.includes(order.id)} onChange={() => toggleSelect(order.id)} />
                                <img src={order.img} className="order-mobile-card-img" alt="Product" />
                                <div className="order-mobile-card-info">
                                    <div className="order-mobile-card-title" title={order.title}>{order.title}</div>
                                    <div className="order-mobile-card-id">{order.orderId}</div>
                                    <div className="order-mobile-card-sku">SKU: {order.sku} &nbsp;·&nbsp; ID: {order.itemId}</div>
                                </div>
                                <button className="btn btn-sm btn-light border text-muted"
                                    style={{flexShrink:0}}
                                    onClick={() => setQuickViewOrder(order)} title="Quick View">
                                    <i className="bi bi-eye"></i>
                                </button>
                            </div>
                            <div className="order-mobile-card-meta">
                                <span className="badge bg-light text-dark border">{order.channel}</span>
                                <span className="order-mobile-card-qty">Qty: {order.qty}</span>
                                {getSlaDisplay(order.slaHours, order.dispatchBy)}
                                <span className="order-mobile-card-amount">₹ {order.amount}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-3 border-top d-flex justify-content-between align-items-center bg-light">
                    <span className="small text-muted">Showing 1–{stats.approved} of {stats.approved} orders</span>
                    <div className="btn-group">
                        <button className="btn btn-sm btn-white border">Previous</button>
                        <button className="btn btn-sm btn-white border">Next</button>
                    </div>
                </div>
            </div>

            {/* FLOATING DOCK — unchanged */}
            {selectedIds.length > 0 && (
                <div className="floating-dock">
                    <div className="d-flex align-items-center gap-2">
                        <div className="dock-counter">{selectedIds.length}</div>
                        <span className="small fw-bold">Selected</span>
                    </div>
                    <div className="dock-divider"></div>
                    <button className="dock-btn" title="Download Invoices"><i className="bi bi-file-earmark-pdf fs-5"></i></button>
                    <button className="dock-btn" title="Hold Shipment" onClick={()=>handleAction('on-hold')}><i className="bi bi-pause-circle fs-5"></i></button>
                    <button className="dock-btn text-danger" title="Cancel Orders" onClick={()=> window.confirm("Are you sure ?") ? handleAction('cancel') : ""}><i className="bi bi-x-circle fs-5"></i></button>
                    <button className="dock-btn text-danger" title="Permanently Delete"
                        onClick={() => { if(window.confirm(`⚠️ DANGER: Are you sure you want to PERMANENTLY DELETE ${selectedIds.length} orders?\n\nThis will revert inventory stock.`)) { handleAction('delete'); } }}>
                        <i className="bi bi-trash3-fill fs-5"></i>
                    </button>
                    <div className="dock-divider"></div>
                    <button className="dock-btn dock-btn-primary" onClick={() => handleAction(currentAction.endpoint)}>
                        <i className={`bi ${currentAction.icon}`}></i>{currentAction.label}
                    </button>
                    <button className="dock-btn ms-3 text-white" onClick={() => setSelectedIds([])}><i className="bi bi-x-lg"></i></button>
                </div>
            )}
        </div>
    );
};

export default OrderManagement;