import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateManualOrder = () => {
    const navigate = useNavigate();

    // --- STATE ---
    const [products, setProducts] = useState([]); // All Products
    const [filteredProducts, setFilteredProducts] = useState([]); // Search Results
    const [searchTerm, setSearchTerm] = useState("");
    
    // Cart & Customer
    const [cart, setCart] = useState([]);
    const [customer, setCustomer] = useState({
        phone: "",
        name: "",
        email: "",
        addressLine1: "",
        city: "",
        state: "",
        pincode: ""
    });

    const [loading, setLoading] = useState(false);

    // --- 1. LOAD CATALOG ON MOUNT ---
    useEffect(() => {
        fetchCatalog();
    }, []);

    const fetchCatalog = async () => {
        try {
            const res = await axios.get("http://localhost:8080/api/catalog/list");
            setProducts(res.data);
            setFilteredProducts(res.data);
        } catch (err) {
            console.error("Catalog Load Error", err);
        }
    };

    // --- 2. SEARCH LOGIC ---
    useEffect(() => {
        const results = products.filter(p => 
            p.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredProducts(results);
    }, [searchTerm, products]);

    // --- 3. CART ACTIONS ---
    const addToCart = (product) => {
        // Check if already in cart
        const existing = cart.find(item => item.variantId === product.variantId);
        
        if (existing) {
            // Increment Qty
            setCart(cart.map(item => 
                item.variantId === product.variantId 
                ? { ...item, qty: item.qty + 1 } 
                : item
            ));
        } else {
            // Add New
            setCart([...cart, { ...product, qty: 1 }]);
        }
    };

    const removeFromCart = (variantId) => {
        setCart(cart.filter(item => item.variantId !== variantId));
    };

    const updateQty = (variantId, newQty) => {
        if (newQty < 1) return;
        setCart(cart.map(item => 
            item.variantId === variantId 
            ? { ...item, qty: newQty } 
            : item
        ));
    };

    // Calculate Total
    const cartTotal = cart.reduce((acc, item) => acc + (item.costPrice * item.qty), 0);

    // --- 4. SUBMIT ORDER ---
    const handlePlaceOrder = async () => {
        if (cart.length === 0) {
            alert("Cart is empty!");
            return;
        }
        if (!customer.phone || !customer.name) {
            alert("Customer Name and Phone are required.");
            return;
        }

        setLoading(true);

        // Map state to DTO structure
        const payload = {
            // Customer Info
            customerName: customer.name,
            customerPhone: customer.phone,
            customerEmail: customer.email,
            addressLine1: customer.addressLine1,
            city: customer.city,
            state: customer.state,
            pincode: customer.pincode,
            
            // Order Info
            channel: "Manual / POS",
            paymentMode: "Prepaid", // Could be a dropdown later

            // The Items
            items: cart.map(item => ({
                sku: item.sku,
                quantity: item.qty,
                sellingPrice: item.costPrice // Using costPrice field from ListingDTO (rename if needed)
            }))
        };

        try {
            await axios.post("http://localhost:8080/api/orders/flow/manual", payload);
            alert("✅ Order Placed Successfully!");
            navigate('/orders'); // Redirect to Order List
        } catch (error) {
            console.error(error);
            alert("Failed: " + (error.response?.data || error.message));
        } finally {
            setLoading(false);
        }
    };

    // Helper for Image
    const getImageUrl = (path) => {
        if (!path) return "https://via.placeholder.com/50";
        if (path.startsWith("http")) return path;
        return `http://localhost:8080/${path}`;
    };

    return (
        <div className="container-fluid p-0">
            <div className="row g-0" style={{height: 'calc(100vh - 80px)'}}>
                
                {/* --- LEFT: PRODUCT CATALOG --- */}
                <div className="col-md-8 p-4 bg-light overflow-auto h-100">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="fw-bold m-0">Select Products</h4>
                        <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Search SKU or Name..." 
                            style={{maxWidth: '300px'}}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="row g-3">
                        {filteredProducts.map(p => (
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
                    </div>
                </div>

                {/* --- RIGHT: CART & CUSTOMER --- */}
                <div className="col-md-4 bg-white border-start h-100 d-flex flex-column shadow-lg">
                    
                    {/* Customer Form */}
                    <div className="p-4 border-bottom bg-light">
                        <h5 className="fw-bold mb-3"><i className="bi bi-person-circle me-2"></i>Customer Details</h5>
                        <div className="row g-2">
                            <div className="col-6">
                                <input type="text" className="form-control form-control-sm" placeholder="Phone *" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} />
                            </div>
                            <div className="col-6">
                                <input type="text" className="form-control form-control-sm" placeholder="Name *" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} />
                            </div>
                            <div className="col-12">
                                <input type="text" className="form-control form-control-sm" placeholder="Address" value={customer.addressLine1} onChange={e => setCustomer({...customer, addressLine1: e.target.value})} />
                            </div>
                            <div className="col-4">
                                <input type="text" className="form-control form-control-sm" placeholder="City" value={customer.city} onChange={e => setCustomer({...customer, city: e.target.value})} />
                            </div>
                            <div className="col-4">
                                <input type="text" className="form-control form-control-sm" placeholder="State" value={customer.state} onChange={e => setCustomer({...customer, state: e.target.value})} />
                            </div>
                            <div className="col-4">
                                <input type="text" className="form-control form-control-sm" placeholder="ZIP" value={customer.pincode} onChange={e => setCustomer({...customer, pincode: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    {/* Cart Items (Scrollable) */}
                    <div className="flex-grow-1 p-3 overflow-auto">
                        {cart.length === 0 ? (
                            <div className="text-center text-muted mt-5">
                                <i className="bi bi-cart-x fs-1"></i>
                                <p>Cart is Empty</p>
                            </div>
                        ) : (
                            <table className="table table-sm align-middle">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th className="text-center">Qty</th>
                                        <th className="text-end">Total</th>
                                        <th></th>
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

                    {/* Total & Action */}
                    <div className="p-4 border-top bg-light">
                        <div className="d-flex justify-content-between mb-2">
                            <span>Subtotal</span>
                            <span className="fw-bold">₹ {cartTotal}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-3 text-success">
                            <span>Discount</span>
                            <span>₹ 0</span>
                        </div>
                        <div className="d-flex justify-content-between mb-4 fs-4 fw-bold">
                            <span>Total</span>
                            <span>₹ {cartTotal}</span>
                        </div>
                        <button 
                            className="btn btn-success w-100 py-2 fw-bold" 
                            onClick={handlePlaceOrder}
                            disabled={loading || cart.length === 0}
                        >
                            {loading ? "Processing..." : "Place Order"}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CreateManualOrder;