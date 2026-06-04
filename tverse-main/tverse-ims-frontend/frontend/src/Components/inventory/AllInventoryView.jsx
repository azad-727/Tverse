import { useState, useEffect } from 'react';
import apiClient from '../apiClient';

const AllInventoryView = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Quick Edit State
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ stock: 0, cost: 0 });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await apiClient.get("/api/catalog/list");
            setProducts(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching inventory", error);
            setLoading(false);
        }
    };

    // --- QUICK EDIT LOGIC ---
    const startEdit = (product) => {
        setEditingId(product.variantId);
        setEditForm({ stock: product.stock, cost: product.costPrice });
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    const saveEdit = async (variantId) => {
        try {
            await apiClient.put("/api/catalog/quick-update", {
                variantId: variantId,
                stock: editForm.stock,
                cost: editForm.cost
            });
            
            // Update UI locally
            setProducts(products.map(p => 
                p.variantId === variantId 
                ? { ...p, stock: editForm.stock, costPrice: editForm.cost } 
                : p
            ));
            setEditingId(null);
        } catch (error) {
            alert("Update Failed: " + error.message);
        }
    };

    // Filter Logic
    const filteredProducts = products.filter(p => 
        p.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.location && p.location.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return <div className="text-center p-5"><span className="spinner-border text-primary"></span> Loading Inventory...</div>;

    return (
        <div>
            <style>{`
            .product-name-truncate {
                max-width: 250px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            @media (max-width: 768px) {
                .product-name-truncate {
                    max-width: 140px; /* Squeezes text down dynamically on small screens */
                }
            }
        `}</style>

            {/* Toolbar */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="input-group" style={{ maxWidth: '350px' }}>
                    <span className="input-group-text bg-white border-end-0"><i className="bi bi-search"></i></span>
                    <input 
                        type="text" 
                        className="form-control border-start-0" 
                        placeholder="Search SKU, Name, or Location..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Inventory Table */}
            <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 border" style={{ minWidth: '800px' }}>
                    <thead className="table-light">
                        <tr>
                            <th style={{width: '110px'}}>Location</th>
                            <th style={{width: '130px'}}>SKU / Variant</th>
                            <th style={{width: '220px'}}>Product Name</th>
                            <th style={{width: '110px'}} className="text-center">Avaliable Qty</th>
                            <th style={{width: '100px'}}>Cost</th>
                            <th style={{width: '100px'}} className="text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map(p => (
                            <tr key={p.variantId}>
                                {/* 1. Location (Highlighted for Ops) */}
                                <td>
                                    <div className="badge bg-light text-dark border no-wrap-data">
                                        <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                                        {p.location || "No Loc"}
                                    </div>
                                </td>

                                {/* 2. SKU & Variant */}
                                <td>
                                    <div className="fw-bold text-primary font-monospace small">{p.sku}</div>
                                    <div className="d-flex gap-1 mt-1 flex-wrap">
                                        {p.size && <span className="badge bg-secondary" style={{fontSize: '10px'}}>Size: {p.size}</span>}
                                        {p.color && <span className="badge bg-secondary" style={{fontSize: '10px'}}>Color: {p.color}</span>}
                                    </div>
                                </td>

                                {/* 3. Product Name */}
                                <td>
                                    <div className="product-name-truncate text-muted small" title={p.productName}>
                                        {p.productName}
                                    </div>
                                    <div className="small text-muted">{p.category} • {p.brand}</div>
                                </td>

                                {/* --- EDITABLE SECTION --- */}
                                {editingId === p.variantId ? (
                                    <>
                                        <td className="text-center">
                                            <input 
                                                type="number" 
                                                className="form-control form-control-sm text-center fw-bold" 
                                                value={editForm.stock} 
                                                onChange={(e) => setEditForm({...editForm, stock: e.target.value})} 
                                            />
                                        </td>
                                        <td>
                                            <input 
                                                type="number" 
                                                className="form-control form-control-sm" 
                                                value={editForm.cost} 
                                                onChange={(e) => setEditForm({...editForm, cost: e.target.value})} 
                                            />
                                        </td>
                                        <td className="text-center">
                                            <div className="btn-group btn-group-sm">
                                                <button className="btn btn-success" onClick={() => saveEdit(p.variantId)}><i className="bi bi-check-lg"></i></button>
                                                <button className="btn btn-outline-secondary" onClick={cancelEdit}><i className="bi bi-x-lg"></i></button>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="text-center">
                                            <span className={`badge rounded-pill px-2.5 py-1.5 font-monospace ${
                                           p.stock > 15 ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25' : 
                                           p.stock > 0 ? 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25' : 
                                            'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25'
                                       }`}>
                                            {p.stock} Qty
                                            </span>
                                        </td>
                                        <td className="small text-muted">₹{p.costPrice}</td>
                                        <td className="text-center">
                                            <button 
                                                className="btn btn-sm btn-light border" 
                                                onClick={() => startEdit(p)}
                                                title="Quick Adjust"
                                            >
                                                <i className="bi bi-pencil"></i> Edit
                                            </button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                        {filteredProducts.length === 0 && (
                            <tr>
                                <td colSpan="6" className="text-center p-5 text-muted">No inventory found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AllInventoryView;