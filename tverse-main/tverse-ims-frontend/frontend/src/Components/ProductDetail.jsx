import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProductDetail = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    
    // State to hold the data being edited
    const [formData, setFormData] = useState({
        variants: [] // Initialize array to prevent crash on first render
    });
    
    // State to hold the original fetched data (for images/display)
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('details');

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = () => {
        axios.get(`http://192.168.31.84:8080/api/catalog/detail/${id}`)
            .then(res => {
                setProduct(res.data);
                
                // MAPPING: Convert Backend Response -> Frontend Form State
                // Important: Map 'cost' (from GET) to 'procurementCost' (for PUT)
                setFormData({
                    productName: res.data.productName,
                    brandName: res.data.brandName,
                    categoryName: res.data.categoryName,
                    hsnCode: res.data.hsnCode,
                    taxRate: res.data.taxRate,
                    description: res.data.description,
                    imageUrl: res.data.imageUrl,
                    isActive: res.data.isActive || true, // Default to true if missing
                    
                    variants: res.data.variants.map(v => ({
                        sku: v.sku,
                        size: v.size,   // Capture Size
                        color: v.color, // Capture Color
                        procurementCost: v.cost,
                        initialStock: v.stock,
                        supplierLeadTime: 7, 
                        variantImageUrl:v.variantImageUrl,
                        warehouseLocation: v.location
                    }))
                });
                
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                alert("Could not load product details");
                navigate('/inventory'); 
            });
    };

    // --- HANDLERS ---

    // 1. Handle Top-Level Inputs (Name, Brand, etc.)
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 2. Handle Variant Inputs (Rows in the table)
    const handleVariantChange = (index, field, value) => {
        const updatedVariants = [...formData.variants];
        updatedVariants[index][field] = value;
        setFormData({ ...formData, variants: updatedVariants });
    };

    // 3. Toggle Active/Disabled Status
    const toggleStatus = async () => {
        const newStatus = !product.isActive; // Toggle current status
        try {
            // Call API to patch status (You created this endpoint earlier)
            await axios.patch(`http://localhost:8080/api/catalog/status/${product.productId}?isActive=${newStatus}`);
            
            // Update local UI immediately
            setProduct({...product, isActive: newStatus}); 
        } catch (error) {
            console.error("Status update failed", error);
            alert("Failed to update status.");
        }
    };

    // 4. Handle Save (PUT Request)
    const handleSave = async () => {
        try {
            // Use product.productId because 'id' from URL might be a Variant ID depending on logic
            // But usually detail page URL uses Parent ID or Variant ID. 
            // Based on your Controller, updateProduct uses Parent ID.
            await axios.put(`http://localhost:8080/api/catalog/update/${product.productId}`, formData);
            alert("✅ Product Updated Successfully!");
            window.location.reload(); 
        } catch (error) {
            console.error(error);
            alert("Update Failed: " + (error.response?.data || error.message));
        }
    };

    const handleDelete = async () => {
        if(confirm("Are you sure? This will delete the product and history logs.")) {
             // Logic to delete parent or specific variant needs to be clarified based on your UI flow.
             // For now, assuming we delete the variant clicked in the list.
             // If this page represents the Parent, you might need a delete parent endpoint.
             alert("Delete functionality coming soon for Detail Page.");
        }
    }
    // Helper for Images
    const getImageUrl = (path) => {
        if (!path) return "https://via.placeholder.com/150";
        if (path.startsWith("http")) return path;
        return `http://192.168.31.84:8080/${path}`;
    };

    if (loading) return <div className="p-5 text-center"><span className="spinner-border text-success"></span> Loading...</div>;

    return (
        <div className="container-fluid p-0">
            {/* --- HEADER --- */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/inventory')}>
                    <i className="bi bi-arrow-left"></i> Back to List
                </button>
                
                <div className="d-flex gap-3 align-items-center">
                    {/* Status Toggle */}
                    <div className="form-check form-switch">
                        <input 
                            className="form-check-input" 
                            type="checkbox" 
                            checked={product.isActive || false}
                            onChange={toggleStatus}
                            style={{cursor: 'pointer'}}
                        />
                        <label className="form-check-label small fw-bold">
                            {product.isActive ? <span className="text-success">Active</span> : <span className="text-muted">Disabled</span>}
                        </label>
                    </div>

                    <button className="btn btn-outline-danger btn-sm" onClick={handleDelete}>Delete</button>
                    <button className="btn btn-success btn-sm" onClick={handleSave}>Save Changes</button>
                </div>
            </div>

            <div className="row g-4">
                {/* --- LEFT COL: IMAGE --- */}
                <div className="col-md-4">
                    <div className="card shadow-sm border-0 mb-4">
                        <div className="card-body text-center">
                            <img 
                                src={getImageUrl(product.imageUrl)} 
                                className="img-fluid rounded mb-3" 
                                style={{maxHeight: '300px', objectFit: 'contain'}} 
                                alt="Product" 
                            />
                            <h5 className="fw-bold">{formData.productName}</h5>
                            <span className="badge bg-secondary me-1">{formData.brandName}</span>
                            <span className="badge bg-light text-dark border">{formData.categoryName}</span>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COL: EDIT TABS --- */}
                <div className="col-md-8">
                    <div className="card shadow-sm border-0">
                        <div className="card-header bg-white">
                            <ul className="nav nav-tabs card-header-tabs">
                                <li className="nav-item">
                                    <button className={`nav-link ${activeTab === 'details' ? 'active fw-bold text-success' : 'text-muted'}`} onClick={() => setActiveTab('details')}>Details</button>
                                </li>
                                <li className="nav-item">
                                    <button className={`nav-link ${activeTab === 'variants' ? 'active fw-bold text-success' : 'text-muted'}`} onClick={() => setActiveTab('variants')}>Variations ({formData.variants.length})</button>
                                </li>
                            </ul>
                        </div>
                        <div className="card-body">
                            
                            {/* TAB 1: DETAILS */}
                            {activeTab === 'details' && (
                                <div className="row g-3">
                                    <div className="col-md-12">
                                        <label className="form-label text-muted small">Product Name</label>
                                        <input type="text" className="form-control" name="productName" value={formData.productName || ""} onChange={handleInputChange} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label text-muted small">Brand</label>
                                        <input type="text" className="form-control" name="brandName" value={formData.brandName || ""} onChange={handleInputChange} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label text-muted small">Category</label>
                                        <input type="text" className="form-control" name="categoryName" value={formData.categoryName || ""} onChange={handleInputChange} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label text-muted small">HSN Code</label>
                                        <input type="text" className="form-control" name="hsnCode" value={formData.hsnCode || ""} onChange={handleInputChange} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label text-muted small">Tax Rate</label>
                                        <input type="number" className="form-control" name="taxRate" value={formData.taxRate || ""} onChange={handleInputChange} />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label text-muted small">Description</label>
                                        <textarea className="form-control" rows="3" name="description" value={formData.description || ""} onChange={handleInputChange}></textarea>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: VARIANTS */}
                            {activeTab === 'variants' && (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>SKU</th>
                                                <th>Size</th>
                                                <th>Color</th>
                                                <th>Stock</th>
                                                <th>Cost</th>
                                                <th>Location</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.variants.map((v, index) => (
                                                <tr key={index}>
                                                    <td className="fw-bold small">{v.sku}</td>
                                                    
                                                    {/* NEW COLUMNS */}
                                                    <td>{v.size || "-"}</td>
                                                    <td>{v.color || "-"}</td>
                                                    
                                                    {/* EDITABLE FIELDS */}
                                                    <td>
                                                        <input 
                                                            type="number" 
                                                            className="form-control form-control-sm" 
                                                            style={{width: '80px'}} 
                                                            value={v.initialStock} 
                                                            onChange={(e) => handleVariantChange(index, 'initialStock', e.target.value)} 
                                                        />
                                                    </td>
                                                    <td>
                                                        <input 
                                                            type="number" 
                                                            className="form-control form-control-sm" 
                                                            style={{width: '80px'}} 
                                                            value={v.procurementCost} 
                                                            onChange={(e) => handleVariantChange(index, 'procurementCost', e.target.value)} 
                                                        />
                                                    </td>
                                                    <td>
                                                        <input 
                                                            type="text" 
                                                            className="form-control form-control-sm" 
                                                            value={v.warehouseLocation} 
                                                            onChange={(e) => handleVariantChange(index, 'warehouseLocation', e.target.value)} 
                                                        />
                                                    </td>
                                                    <td><button className="btn btn-sm btn-outline-danger"><i className="bi bi-trash"></i></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <button className="btn btn-outline-primary btn-sm mt-2">+ Add Variant</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;