import { useState, useEffect, useRef } from 'react';
import apiClient from '../apiClient';
import { useNavigate } from 'react-router-dom';

const CreateManualOrder = () => {
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);   // accumulated, appended on "Load More"
    const [searchTerm, setSearchTerm] = useState("");
    const [catalogLoading, setCatalogLoading] = useState(false);
    const [cursor, setCursor] = useState(null);
    const [nextCursor, setNextCursor] = useState(null);
    const [hasNext, setHasNext] = useState(false);
    const isFirstRender = useRef(true);

    const [cart, setCart] = useState([]);
    const [customer, setCustomer] = useState({
        phone: "", name: "", email: "", addressLine1: "", city: "", state: "", pincode: ""
    });
    const [loading, setLoading] = useState(false);

    // append=true for "Load More", append=false for a fresh search/initial load (replaces the list)
    const fetchCatalog = async (cursorToFetch = null, searchToUse = searchTerm, append = false) => {
        setCatalogLoading(true);
        try {
            const params = { pageSize: 40 };
            if (cursorToFetch) params.cursor = cursorToFetch;
            if (searchToUse) params.search = searchToUse;
            const res = await apiClient.get("/api/catalog/list", { params });
            setProducts(prev => append ? [...prev, ...res.data.items] : res.data.items);
            setHasNext(res.data.hasNext);
            setNextCursor(res.data.nextCursor);
            setCursor(cursorToFetch);
        } catch (err) {
            console.error("Catalog Load Error", err);
        } finally {
            setCatalogLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchCatalog(null, "", false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Debounced search - resets to a fresh (replaced, not appended) result set
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const timer = setTimeout(() => {
            fetchCatalog(null, searchTerm, false);
        }, 800);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    const loadMore = () => {
        if (!hasNext || !nextCursor) return;
        fetchCatalog(nextCursor, searchTerm, true); // append=true
    };

    // --- CART ACTIONS (unchanged) ---
    const addToCart = (product) => {
        const existing = cart.find(item => item.variantId === product.variantId);
        if (existing) {
            setCart(cart.map(item =>
                item.variantId === product.variantId ? { ...item, qty: item.qty + 1 } : item
            ));
        } else {
            setCart([...cart, { ...product, qty: 1 }]);
        }
    };

    const removeFromCart = (variantId) => {
        setCart(cart.filter(item => item.variantId !== variantId));
    };

    const updateQty = (variantId, newQty) => {
        if (newQty < 1) return;
        setCart(cart.map(item => item.variantId === variantId ? { ...item, qty: newQty } : item));
    };

    const cartTotal = cart.reduce((acc, item) => acc + (item.costPrice * item.qty), 0);

    const handlePlaceOrder = async () => {
        if (cart.length === 0) { alert("Cart is empty!"); return; }
        if (!customer.phone || !customer.name) { alert("Customer Name and Phone are required."); return; }

        setLoading(true);
        const payload = {
            customerName: customer.name,
            customerPhone: customer.phone,
            customerEmail: customer.email,
            addressLine1: customer.addressLine1,
            city: customer.city,
            state: customer.state,
            pincode: customer.pincode,
            channel: "Manual / POS",
            paymentMode: "Prepaid",
            items: cart.map(item => ({
                sku: item.sku,
                quantity: item.qty,
                sellingPrice: item.costPrice
            }))
        };

        try {
            await apiClient.post("/api/orders/flow/manual", payload);
            alert("✅ Order Placed Successfully!");
            navigate('/orders');
        } catch (error) {
            console.error(error);
            alert("Failed: " + (error.response?.data || error.message));
        } finally {
            setLoading(false);
        }
    };

    const getImageUrl = (path) => {
        if (!path) return "https://via.placeholder.com/50";
        if (path.startsWith("http")) return path;
        return `${apiClient.defaults.baseURL || 'http://localhost:8080'}/${path}`;
    };

    return (
        <div className="container-fluid p-0 overflow-hidden">
            <style>{`
                .tverse-pos-frame { height: calc(100vh - 56px); }
                .tverse-product-grid-card { transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease; }
                .tverse-product-grid-card:hover { transform: translateY(-2px); box-shadow: 0 8px 16px -4px rgba(0,0,0,0.1) !important; }
                @media (max-width: 767.98px) {
                    .tverse-pos-frame { height: auto !important; display: flex; flex-direction: column; }
                    .tverse-catalog-panel { height: 50vh !important; padding: 16px !important; }
                    .tverse-cart-panel { height: auto !important; box-shadow: 0 -10px 25px -5px rgba(0,0,0,0.1) !important; border-left: none !important; border-top: 1px solid #e2e8f0; }
                }
            `}</style>

            <div className="row g-0 stverse-pos-frame">
                <div className="col-12 col-md-8 p-4 bg-light overflow-auto h-100 tverse-catalog-panel">
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-3 mb-4">
                        <h4 className="fw-bold m-0" style={{ letterSpacing: '-0.5px' }}>Select Products</h4>
                        <input
                            type="text"
                            className="form-control shadow-none bg-white"
                            placeholder="Search SKU or Name..."
                            style={{maxWidth: '100%', width: '320px'}}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="row g-3">
                        {products.map(p => (
                            <div className="col-md-4 col-lg-3" key={p.variantId}>
                                <div className="card h-100 shadow-sm border-0 product-card" onClick={() => addToCart(p)} style={{cursor: 'pointer'}}>
                                    <div className="card-img-top bg-white d-flex align-items-center justify-content-center p-2" style={{height: '140px'}}>
                                        <img src={getImageUrl(p.imageUrl || p.variantImageUrl)} className="img-fluid" style={{maxHeight: '100%'}} />
                                    </div>
                                    <div className="card-body p-2">
                                        <div className="small fw-bold text-truncate">{p.productName}</div>
                                        <div className="d-flex justify-content-between align-items-center mt-2">
                                            <span className="badge bg-light text-dark border">{p.sku}</span>
                                            <span className="fw-bold text-success">₹{p.costPrice}</span>
                                        </div>
                                        <div className="small text-muted mt-1">Stock: {p.stock}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {products.length === 0 && !catalogLoading && (
                            <div className="col-12 text-center p-5 text-muted small">No active listings match your current filter keywords.</div>
                        )}
                    </div>

                    {hasNext && (
                        <div className="text-center mt-3">
                            <button className="btn btn-outline-dark btn-sm px-4" onClick={loadMore} disabled={catalogLoading}>
                                {catalogLoading ? "Loading..." : "Load More"}
                            </button>
                        </div>
                    )}
                </div>

                <div className="col-md-4 bg-white border-start h-100 d-flex flex-column shadow-lg tverse-cart-panel">
                    <div className="p-4 border-bottom bg-light">
                        <h5 className="fw-bold mb-3"><i className="bi bi-person-circle me-2"></i>Customer Details</h5>
                        <div className="row g-2">
                            <div className="col-6"><input type="text" className="form-control form-control-sm" placeholder="Phone *" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} /></div>
                            <div className="col-6"><input type="text" className="form-control form-control-sm" placeholder="Name *" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} /></div>
                            <div className="col-12"><input type="text" className="form-control form-control-sm" placeholder="Address" value={customer.addressLine1} onChange={e => setCustomer({...customer, addressLine1: e.target.value})} /></div>
                            <div className="col-4"><input type="text" className="form-control form-control-sm" placeholder="City" value={customer.city} onChange={e => setCustomer({...customer, city: e.target.value})} /></div>
                            <div className="col-4"><input type="text" className="form-control form-control-sm" placeholder="State" value={customer.state} onChange={e => setCustomer({...customer, state: e.target.value})} /></div>
                            <div className="col-4"><input type="text" className="form-control form-control-sm" placeholder="ZIP" value={customer.pincode} onChange={e => setCustomer({...customer, pincode: e.target.value})} /></div>
                        </div>
                    </div>

                    <div className="flex-grow-1 p-2 p-md-3 overflow-auto" style={{ minHeight: '180px' }}>
                        {cart.length === 0 ? (
                            <div className="text-center text-muted mt-5">
                                <i className="bi bi-cart-dash display-6 d-block mb-2"></i>
                                <p>Cart is Empty</p>
                            </div>
                        ) : (
                            <table className="table table-sm align-middle">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th className="text-center" style={{ width: '90px' }}>Qty</th>
                                        <th className="text-end" style={{ width: '80px' }}>Total</th>
                                        <th style={{ width: '30px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cart.map(item => (
                                        <tr key={item.variantId}>
                                            <td style={{maxWidth: '120px'}}>
                                                <div className="text-truncate small fw-bold">{item.productName}</div>
                                                <div className="text-muted" style={{fontSize:'10px'}}>{item.sku}</div>
                                            </td>
                                            <td className="text-center">
                                                <div className="input-group input-group-sm" style={{width: '80px'}}>
                                                    <button className="btn btn-outline-secondary px-1" onClick={() => updateQty(item.variantId, item.qty - 1)}>-</button>
                                                    <input type="text" className="form-control text-center px-0" value={item.qty} readOnly />
                                                    <button className="btn btn-outline-secondary px-1" onClick={() => updateQty(item.variantId, item.qty + 1)}>+</button>
                                                </div>
                                            </td>
                                            <td className="text-end fw-bold">₹{item.costPrice * item.qty}</td>
                                            <td className="text-end">
                                                <button className="btn btn-link text-danger p-0" onClick={() => removeFromCart(item.variantId)}><i className="bi bi-x-circle"></i></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="p-4 border-top bg-light">
                        <div className="d-flex justify-content-between mb-2"><span>Subtotal</span><span className="fw-bold">₹ {cartTotal}</span></div>
                        <div className="d-flex justify-content-between mb-3 text-success"><span>Discount</span><span>₹ 0</span></div>
                        <div className="d-flex justify-content-between mb-4 fs-4 fw-bold"><span>Total</span><span>₹ {cartTotal}</span></div>
                        <button className="btn btn-success w-100 py-2 fw-bold" onClick={handlePlaceOrder} disabled={loading || cart.length === 0}>
                            {loading ? "Processing..." : "Place Order"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateManualOrder;