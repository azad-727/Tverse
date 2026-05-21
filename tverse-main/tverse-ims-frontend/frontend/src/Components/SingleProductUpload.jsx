import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const SingleProductAdd = () => {
    // --- STATE ---
    const [formData, setFormData] = useState({
        productName: "",
        brandName: "",
        categoryName: "", 
        hsnCode: "",
        taxRate: 18,
        description: "",
        sku: "",
        procurementCost: "",
        initialStock: 0,
        warehouseLocation: ""
    });

    const [uploadedImageUrl, setUploadedImageUrl] = useState(""); 
    const [categoryList, setCategoryList] = useState([]); 
    
    // NEW: Category Add Logic
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    const [hasVariations, setHasVariations] = useState(false);
    const [variantRows, setVariantRows] = useState([{ size: "M", color: "Red", sku: "", cost: "", stock: 0, loc: "" }]);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null); 
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");

    // --- FETCH CATEGORIES ---
    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = () => {
        axios.get("http://localhost:8080/api/catalog/categories")
            .then(response => {
                setCategoryList(response.data);
            })
            .catch(error => console.error("Error fetching categories:", error));
    };

    // --- HANDLERS ---
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // NEW: Save New Category
    const handleSaveCategory = async () => {
        if(!newCategoryName.trim()) return;

        try {
            const res = await axios.post("http://localhost:8080/api/catalog/category/add", { name: newCategoryName });
            
            // 1. Refresh List
            const updatedList = [...categoryList, res.data];
            setCategoryList(updatedList);
            
            // 2. Auto-select the new one
            setFormData({ ...formData, categoryName: res.data.name });
            
            // 3. Reset UI
            setIsAddingCategory(false);
            setNewCategoryName("");
        } catch (error) {
            alert("Failed to add category: " + (error.response?.data || error.message));
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
            const uploadData = new FormData();
            uploadData.append("file", file);
            try {
                const res = await axios.post("http://localhost:8080/api/catalog/upload-image", uploadData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                setUploadedImageUrl(res.data);
            } catch (err) {
                console.error("Image upload failed", err);
            }
        }
    };

    const handleImageClick = () => fileInputRef.current.click(); 

    // Variant Helpers
    const addVariantRow = () => setVariantRows([...variantRows, { size: "", color: "", sku: "", cost: formData.procurementCost, stock: 0, loc: "" }]);
    const removeVariantRow = (index) => {
        const list = [...variantRows];
        list.splice(index, 1);
        setVariantRows(list);
    };
    const handleVariantChange = (index, field, value) => {
        const list = [...variantRows];
        list[index][field] = value;
        setVariantRows(list);
    };

    // --- SUBMIT ---
    const handleSubmit = async () => {
        setStatus("submitting");
        setMessage("");
const finalImage = uploadedImageUrl || ""; 
        let finalVariants = [];
        if (hasVariations) {
            finalVariants = variantRows.map(row => ({
                sku: row.sku,
                size: row.size,
                color: row.color,
                procurementCost: row.cost || 0,
                supplierLeadTime: 7,
                warehouseLocation: row.loc,
                initialStock: row.stock || 0
            }));
        } else {
            finalVariants = [{
                sku: formData.sku,
                size:null,
                color:null,
                procurementCost: formData.procurementCost || 0,
                supplierLeadTime: 7,
                warehouseLocation: formData.warehouseLocation,
                initialStock: formData.initialStock || 0
            }];
        }

        const payload = {
            productName: formData.productName,
            brandName: formData.brandName,
            categoryName: formData.categoryName, 
            hsnCode: formData.hsnCode,
            taxRate: formData.taxRate,
            description: formData.description,
            imageUrl: finalImage, 
            variants: finalVariants
        };
 console.log("Sending Payload:", payload);
        try {
            await axios.post("http://localhost:8080/api/catalog/add", payload);
            setStatus("success");
            setMessage("Product Created Successfully!");
        } catch (error) {
            setStatus("error");
            setMessage(error.response?.data || error.message);
        }
    };

    const formatErrorMessage = (rawMsg) => {
        if (!rawMsg) return "";
        if (rawMsg.includes("Duplicate entry")) {
            const matches = rawMsg.match(/'([^']+)'/); 
            return `⚠️ Duplicate SKU: "${matches ? matches[1] : 'This SKU'}" already exists.`;
        }
        return "❌ " + rawMsg;
    };

    return (
        <div className="container-fluid p-0">
             <div className="mb-4">
                <h4 className="fw-bold">Add a Single Listing</h4>
                {message && (
                    <div className={`alert mt-3 shadow-sm d-flex align-items-center ${status === 'success' ? 'alert-success' : 'alert-danger'}`} role="alert">
                        <div>{status === 'success' ? <strong>Success! </strong> : <strong>Error: </strong>} {formatErrorMessage(message)}</div>
                    </div>
                )}
            </div>

            <div className="row g-4">
                {/* PHOTOS */}
                <div className="col-md-4">
                    <div className="custom-card p-4 h-100 text-center shadow-sm border-0">
                        <h5 className="fw-bold mb-4">Product Photos</h5>
                        <div 
                            className="bg-light rounded d-flex align-items-center justify-content-center text-muted border mb-3 overflow-hidden position-relative" 
                            style={{height: '250px', borderStyle: 'dashed', cursor: 'pointer'}}
                            onClick={handleImageClick}
                        >
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="w-100 h-100 object-fit-cover" />
                            ) : (
                                <div><i className="bi bi-camera fs-1 d-block mb-2"></i><small>Click to Upload</small></div>
                            )}
                        </div>
                        <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleFileChange} />
                        <button className="btn btn-outline-success w-100" onClick={handleImageClick}>
                            {imagePreview ? "Change Photo" : "Upload Main Image"}
                        </button>
                    </div>
                </div>

                {/* FORM */}
                <div className="col-md-8">
                    <div className="custom-card p-4 shadow-sm border-0">
                        <h6 className="fw-bold text-success mb-3">1. Vital Info</h6>
                        <div className="row g-3 mb-4">
                            <div className="col-md-8">
                                <label className="form-label small text-muted">Product Name <span className="text-danger">*</span></label>
                                <input type="text" className="form-control" name="productName" value={formData.productName} onChange={handleChange} />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label small text-muted">Brand Name</label>
                                <input type="text" className="form-control" name="brandName" value={formData.brandName} onChange={handleChange} />
                            </div>
                            
                            {/* DYNAMIC CATEGORY + QUICK ADD */}
                            <div className="col-md-4">
                                <label className="form-label small text-muted">Category</label>
                                {!isAddingCategory ? (
                                    <div className="input-group">
                                        <select className="form-select" name="categoryName" value={formData.categoryName} onChange={handleChange}>
                                            <option value="">Select Category</option>
                                            {categoryList.map(cat => (
                                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </select>
                                        <button className="btn btn-outline-secondary" type="button" onClick={() => setIsAddingCategory(true)} title="Add New Category">
                                            <i className="bi bi-plus-lg"></i>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="input-group">
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder="New Category Name" 
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            autoFocus
                                        />
                                        <button className="btn btn-success" type="button" onClick={handleSaveCategory}>
                                            <i className="bi bi-check-lg"></i>
                                        </button>
                                        <button className="btn btn-outline-danger" type="button" onClick={() => setIsAddingCategory(false)}>
                                            <i className="bi bi-x-lg"></i>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="col-md-4">
                                <label className="form-label small text-muted">HSN Code</label>
                                <input type="text" className="form-control" name="hsnCode" value={formData.hsnCode} onChange={handleChange} />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label small text-muted">Tax Rate (%)</label>
                                <input type="number" className="form-control" name="taxRate" value={formData.taxRate} onChange={handleChange} />
                            </div>
                            <div className="col-12">
                                <label className="form-label small text-muted">Description</label>
                                <textarea className="form-control" rows="2" name="description" value={formData.description} onChange={handleChange}></textarea>
                            </div>
                        </div>

                        {/* ... Rest of the form (Variations & Inventory) remains same ... */}
                        
                        <hr className="text-muted opacity-25" />

                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="fw-bold text-success mb-0">2. Variations & Inventory</h6>
                            <div className="form-check form-switch">
                                <input className="form-check-input" type="checkbox" id="variantSwitch" checked={hasVariations} onChange={(e) => setHasVariations(e.target.checked)}/>
                                <label className="form-check-label small fw-bold" htmlFor="variantSwitch">Variations?</label>
                            </div>
                        </div>

                        {!hasVariations ? (
                            <div className="row g-3 mb-4 bg-light p-3 rounded border">
                                <div className="col-md-6">
                                    <label className="form-label small text-muted">SKU <span className="text-danger">*</span></label>
                                    <input type="text" className="form-control" name="sku" value={formData.sku} onChange={handleChange} />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label small text-muted">Cost</label>
                                    <input type="number" className="form-control" name="procurementCost" value={formData.procurementCost} onChange={handleChange} />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label small text-muted">Stock</label>
                                    <input type="number" className="form-control" name="initialStock" value={formData.initialStock} onChange={handleChange} />
                                </div>
                                <div className="col-12">
                                    <label className="form-label small text-muted">Rack Location</label>
                                    <input type="text" className="form-control" name="warehouseLocation" value={formData.warehouseLocation} onChange={handleChange} />
                                </div>
                            </div>
                        ) : (
                            <div className="mb-4">
                                <div className="table-responsive">
                                    <table className="table table-bordered table-sm text-center align-middle">
                                        <thead className="table-light">
                                            <tr><th>Size</th><th>Color</th><th>SKU</th><th>Cost</th><th>Stock</th><th>Loc</th><th>Action</th></tr>
                                        </thead>
                                        <tbody>
                                            {variantRows.map((row, index) => (
                                                <tr key={index}>
                                                    <td><input className="form-control form-control-sm" value={row.size} onChange={(e)=>handleVariantChange(index,'size',e.target.value)}/></td>
                                                    <td><input className="form-control form-control-sm" value={row.color} onChange={(e)=>handleVariantChange(index,'color',e.target.value)}/></td>
                                                    <td><input className="form-control form-control-sm" value={row.sku} onChange={(e)=>handleVariantChange(index,'sku',e.target.value)}/></td>
                                                    <td><input className="form-control form-control-sm" value={row.cost} onChange={(e)=>handleVariantChange(index,'cost',e.target.value)}/></td>
                                                    <td><input className="form-control form-control-sm" value={row.stock} onChange={(e)=>handleVariantChange(index,'stock',e.target.value)}/></td>
                                                    <td><input className="form-control form-control-sm" value={row.loc} onChange={(e)=>handleVariantChange(index,'loc',e.target.value)}/></td>
                                                    <td><button className="btn btn-outline-danger btn-sm border-0" onClick={()=>removeVariantRow(index)}>X</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <button className="btn btn-sm btn-outline-primary" onClick={addVariantRow}>+ Add Variation</button>
                            </div>
                        )}

                        <div className="d-flex justify-content-end gap-2 border-top pt-3">
                            <button className="btn btn-light" onClick={() => window.location.reload()}>Clear</button>
                            <button className="btn btn-success px-4" onClick={handleSubmit} disabled={status === 'submitting'}>
                                {status === 'submitting' ? 'Saving...' : 'Save & Go Live'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SingleProductAdd;    