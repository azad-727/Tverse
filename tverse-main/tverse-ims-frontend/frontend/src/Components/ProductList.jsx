import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Edit State
    const [editingId, setEditingId] = useState(null); // Which row is being edited?
    const [editForm, setEditForm] = useState({ stock: 0, cost: 0 });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await axios.get("http://192.168.31.84:8080/api/catalog/list");
            setProducts(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching products", error);
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
            await axios.put("http://192.168.31.84:8080/api/catalog/quick-update", {
                variantId: variantId,
                stock: editForm.stock,
                cost: editForm.cost
            });
            
            // Update UI locally without refresh
            setProducts(products.map(p => 
                p.variantId === variantId 
                ? { ...p, stock: editForm.stock, costPrice: editForm.cost } 
                : p
            ));
            setEditingId(null);
        } catch (error) {
            alert("Update Failed");
        }
    };

    // --- DELETE LOGIC ---
    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this listing? This cannot be undone.")) {
            try {
                await axios.delete(`http://192.168.31.84:8080/api/catalog/delete/${id}`);
                setProducts(products.filter(p => p.variantId !== id)); // Remove from UI
            } catch (error) {
                alert("Delete Failed");
            }
        }
    };

    // Search Filter
    const filteredProducts = products.filter(p => 
        p.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `http://192.168.31.84:8080/${path}`;
    };


    if (loading) return <div className="text-center p-5"><span className="spinner-border text-success"></span> Loading Inventory...</div>;

    return (
        <div className="container-fluid p-0">
            {/* Toolbar */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="input-group" style={{ maxWidth: '300px' }}>
                    <span className="input-group-text bg-white border-end-0"><i className="bi bi-search"></i></span>
                    <input 
                        type="text" 
                        className="form-control border-start-0" 
                        placeholder="Search SKU or Name..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div>
                     <span className="text-muted small me-3">Total SKUs: <strong>{products.length}</strong></span>
                     <button className="btn btn-outline-secondary btn-sm" onClick={fetchProducts}><i className="bi bi-arrow-clockwise"></i> Refresh</button>
                </div>
            </div>

            {/* Table */}
            <div className="card border-0 shadow-sm">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th style={{width: '60px'}}>Image</th>
                                <th>Product Details</th>
                                <th>Category / Brand</th>
                                <th>Variation</th>
                                <th style={{width: '120px'}}>Cost Price</th>
                                <th style={{width: '100px'}}>Stock</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map(p => (
                                <tr key={p.variantId}>
    {/* Image Link */}
    <td>
        <Link to={`/inventory/product/${p.variantId}`}>
            <div className="bg-light rounded d-flex align-items-center justify-content-center border overflow-hidden" style={{width: 50, height: 50}}>
                {p.imageUrl ? (
                    <img 
                        src={getImageUrl(p.imageUrl)} 
                        alt="" 
                        className="w-100 h-100 object-fit-cover" 
                        onError={(e) => e.target.style.display='none'} 
                    />
                ) : <i className="bi bi-image text-muted"></i>}
            </div>
        </Link>
    </td>

                                    {/* Product Name & SKU */}
                                    <td>
        <Link to={`/inventory/product/${p.variantId}`} className="text-decoration-none text-dark">
            <div className="fw-bold">{p.productName}</div>
            <div className="small text-muted">SKU: <span className="text-primary">{p.sku}</span></div>
        </Link>
    </td>

                                    {/* Category */}
                                    <td>
                                        <span className="badge bg-light text-dark border me-1">{p.category}</span>
                                        <small className="text-muted">{p.brand}</small>
                                    </td>

                                {/* Variation Column */}
                                    <td>
                                        <div className="d-flex flex-column small">
                                            {/* Show Size and Color distinctly */}
                                            {p.size && <span className="text-muted">Size: <strong className="text-dark">{p.size}</strong></span>}
                                            {p.color && <span className="text-muted">Color: <strong className="text-dark">{p.color}</strong></span>}
                                            
                                            {/* Fallback if both are empty */}
                                            {!p.size && !p.color && <span className="fst-italic text-muted">Single</span>}
                                        </div>
                                        <div style={{fontSize: '11px'}} className="text-muted mt-1">
                                            <i className="bi bi-geo-alt"></i> {p.location || "No Loc"}
                                        </div>
                                    </td>

                                    {/* --- EDITABLE FIELDS --- */}
                                    {editingId === p.variantId ? (
                                        // EDIT MODE
                                        <>
                                            <td>
                                                <input type="number" className="form-control form-control-sm" value={editForm.cost} onChange={(e) => setEditForm({...editForm, cost: e.target.value})} />
                                            </td>
                                            <td>
                                                <input type="number" className="form-control form-control-sm" value={editForm.stock} onChange={(e) => setEditForm({...editForm, stock: e.target.value})} />
                                            </td>
                                            <td className="text-end">
                                                <button className="btn btn-sm btn-success me-1" onClick={() => saveEdit(p.variantId)}><i className="bi bi-check"></i></button>
                                                <button className="btn btn-sm btn-secondary" onClick={cancelEdit}><i className="bi bi-x"></i></button>
                                            </td>
                                        </>
                                    ) : (
                                        // VIEW MODE
                                        <>
                                            <td className="fw-bold text-dark">₹{p.costPrice}</td>
                                            <td>
                                                <span className={`badge ${p.stock > 0 ? 'bg-success' : 'bg-danger'}`}>
                                                    {p.stock}
                                                </span>
                                            </td>
                                            <td className="text-end">
                                                <button 
                                                    className="btn btn-sm btn-outline-primary border-0 me-1" 
                                                    title="Quick Edit"
                                                    onClick={() => startEdit(p)}
                                                >
                                                    <i className="bi bi-pencil-square"></i>
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-outline-danger border-0" 
                                                    title="Delete"
                                                    onClick={() => handleDelete(p.variantId)}
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="text-center p-5 text-muted">
                                        No products found. Add some products or check your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProductList;