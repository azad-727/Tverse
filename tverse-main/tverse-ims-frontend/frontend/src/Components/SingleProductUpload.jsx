import { useState, useRef, useEffect } from 'react';
// FIXED: Hooked up centralized API config client instance
import apiClient from './apiClient'; 

const SingleProductAdd = () => {
    const defaultFormState = {
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
    };

    // --- STATE ---
    const [formData, setFormData] = useState(defaultFormState);
    const [uploadedImageUrl, setUploadedImageUrl] = useState(""); 
    const [categoryList, setCategoryList] = useState([]); 
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [hasVariations, setHasVariations] = useState(false);
    const [variantRows, setVariantRows] = useState([{ size: "M", color: "White", sku: "", cost: "", stock: 0, loc: "" }]);
    const [imagePreview, setImagePreview] = useState(null);
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");
    const fileInputRef = useRef(null); 

    // --- FETCH CATEGORIES ---
    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = () => {
        // FIXED: Replaced raw URL routes with secure apiClient relative matching strings
        apiClient.get("/api/catalog/categories")
            .then(response => setCategoryList(response.data))
            .catch(error => console.error("Error fetching categories:", error));
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSaveCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            const res = await apiClient.post("/api/catalog/category/add", { name: newCategoryName.trim() });
            setCategoryList([...categoryList, res.data]);
            setFormData({ ...formData, categoryName: res.data.name });
            setIsAddingCategory(false);
            setNewCategoryName("");
        } catch (error) {
            alert("Failed to add category: " + (error.response?.data || error.message));
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setImagePreview(URL.createObjectURL(file));
            const uploadData = new FormData();
            uploadData.append("file", file);
            try {
                const res = await apiClient.post("/api/catalog/upload-image", uploadData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                setUploadedImageUrl(res.data);
            } catch (err) {
                console.error("Image upload failed", err);
            }
        }
    };

    const handleImageClick = () => fileInputRef.current.click(); 

    const addVariantRow = () => setVariantRows([...variantRows, { size: "", color: "White", sku: "", cost: formData.procurementCost, stock: 0, loc: "" }]);
    
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

    // FIXED: Non-destructive state clear routing function instead of full SPA window reload
    const handleResetForm = () => {
        setFormData(defaultFormState);
        setUploadedImageUrl("");
        setImagePreview(null);
        setHasVariations(false);
        setVariantRows([{ size: "M", color: "White", sku: "", cost: "", stock: 0, loc: "" }]);
        setStatus("idle");
        setMessage("");
    };

    const handleSubmit = async () => {
        setStatus("submitting");
        setMessage("");
        const finalImage = uploadedImageUrl || ""; 
        let finalVariants = [];

        if (hasVariations) {
            finalVariants = variantRows.map(row => ({
                sku: row.sku.trim(),
                size: row.size,
                color: row.color,
                procurementCost: row.cost || 0,
                supplierLeadTime: 7,
                warehouseLocation: row.loc,
                initialStock: row.stock || 0
            }));
        } else {
            finalVariants = [{
                sku: formData.sku.trim(),
                size: null,
                color: null,
                procurementCost: formData.procurementCost || 0,
                supplierLeadTime: 7,
                warehouseLocation: formData.warehouseLocation,
                initialStock: formData.initialStock || 0
            }];
        }

        const payload = {
            productName: formData.productName.trim(),
            brandName: formData.brandName.trim(),
            categoryName: formData.categoryName, 
            hsnCode: formData.hsnCode.trim(),
            taxRate: formData.taxRate,
            description: formData.description.trim(),
            imageUrl: finalImage, 
            variants: finalVariants
        };

        try {
            await apiClient.post("/api/catalog/add", payload);
            setStatus("success");
            setMessage("Product Created Successfully!");
            handleResetForm(); // Fire state wipe to reload interface options cleanly
        } catch (error) {
            setStatus("error");
            setMessage(error.response?.data || error.message);
        }
    };

    const formatErrorMessage = (rawMsg) => {
        if (!rawMsg) return "";
        if (typeof rawMsg !== 'string') return "An unexpected validation exception occurred.";
        if (rawMsg.includes("Duplicate entry")) {
            const matches = rawMsg.match(/'([^']+)'/); 
            return `⚠️ Duplicate SKU Exception: "${matches ? matches[1] : 'This SKU'}" already matches an active warehouse ledger record.`;
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
                {/* PHOTO MANAGER CANVAS */}
                <div className="col-12 col-md-4">
                    <div className="custom-card p-4 text-center shadow-sm border rounded bg-white">
                        <h5 className="fw-bold mb-4">Product Assets</h5>
                        <div 
                            className="bg-light rounded d-flex align-items-center justify-content-center text-muted border mb-3 overflow-hidden position-relative mx-auto w-100" 
                            style={{ height: '250px', borderStyle: 'dashed', cursor: 'pointer', maxWidth: '300px' }}
                            onClick={handleImageClick}
                        >
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="w-100 h-100 object-fit-cover" />
                            ) : (
                                <div><i className="bi bi-camera fs-1 d-block mb-2 text-muted"></i><small>Click to Upload Image Asset</small></div>
                            )}
                        </div>
                        <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleFileChange} />
                        <button className="btn btn-outline-success w-100 fw-medium" onClick={handleImageClick}>
                            {imagePreview ? "Modify Image Asset" : "Upload Main Image"}
                        </button>
                    </div>
                </div>

                {/* CENTRAL METADATA FORM INTERFACE */}
                <div className="col-12 col-md-8">
                    <div className="custom-card p-3 p-md-4 shadow-sm border rounded bg-white">
                        <h6 className="fw-bold text-success mb-3">1. Vital Architecture Details</h6>
                        <div className="row g-3 mb-4">
                            <div className="col-12 col-md-8">
                                <label className="form-label small text-muted fw-bold">Product Title <span className="text-danger">*</span></label>
                                <input type="text" className="form-control shadow-none" name="productName" value={formData.productName} onChange={handleChange} />
                            </div>
                            <div className="col-12 col-md-4">
                                <label className="form-label small text-muted fw-bold">Brand Hub</label>
                                <input type="text" className="form-control shadow-none" name="brandName" value={formData.brandName} onChange={handleChange} />
                            </div>
                            
                            <div className="col-12 col-md-4">
                                <label className="form-label small text-muted fw-bold">System Category</label>
                                {!isAddingCategory ? (
                                    <div className="input-group">
                                        <select className="form-select shadow-none" name="categoryName" value={formData.categoryName} onChange={handleChange}>
                                            <option value="">Select Category Option</option>
                                            {categoryList.map(cat => (
                                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </select>
                                        <button className="btn btn-outline-secondary shadow-none" type="button" onClick={() => setIsAddingCategory(true)}>
                                            <i className="bi bi-plus-lg"></i>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="input-group">
                                        <input 
                                            type="text" 
                                            className="form-control shadow-none" 
                                            placeholder="Label Naming Format" 
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            autoFocus
                                        />
                                        <button className="btn btn-success shadow-none" type="button" onClick={handleSaveCategory}>
                                            <i className="bi bi-check-lg"></i>
                                        </button>
                                        <button className="btn btn-outline-danger shadow-none" type="button" onClick={() => setIsAddingCategory(false)}>
                                            <i className="bi bi-x-lg"></i>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="col-12 col-md-4">
                                <label className="form-label small text-muted fw-bold">HSN Code Parameter</label>
                                <input type="text" className="form-control shadow-none" name="hsnCode" value={formData.hsnCode} onChange={handleChange} />
                            </div>
                            <div className="col-12 col-md-4">
                                <label className="form-label small text-muted fw-bold">Tax Rate Allocation (%)</label>
                                <input type="number" className="form-control shadow-none" name="taxRate" value={formData.taxRate} onChange={handleChange} />
                            </div>
                            <div className="col-12">
                                <label className="form-label small text-muted fw-bold">Description Metadata</label>
                                <textarea className="form-control shadow-none" rows="2" name="description" value={formData.description} onChange={handleChange}></textarea>
                            </div>
                        </div>

                        <hr className="text-muted opacity-25" />

                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="fw-bold text-success mb-0">2. Sku Yield Variations & Inventory Allocation</h6>
                            <div className="form-check form-switch">
                                <input className="form-check-input" type="checkbox" id="variantSwitch" checked={hasVariations} onChange={(e) => setHasVariations(e.target.checked)}/>
                                <label className="form-check-label small fw-bold text-dark" htmlFor="variantSwitch">Deploy Variation Grid</label>
                            </div>
                        </div>

                        {!hasVariations ? (
                            <div className="row g-3 mb-4 bg-light p-3 rounded border mx-0">
                                <div className="col-12 col-md-6">
                                    <label className="form-label small text-muted fw-bold">Master SKU Code <span className="text-danger">*</span></label>
                                    <input type="text" className="form-control shadow-none bg-white" name="sku" value={formData.sku} onChange={handleChange} />
                                </div>
                                <div className="col-6 col-md-3">
                                    <label className="form-label small text-muted fw-bold">Procurement Cost</label>
                                    <input type="number" className="form-control shadow-none bg-white" name="procurementCost" value={formData.procurementCost} onChange={handleChange} />
                                </div>
                                <div className="col-6 col-md-3">
                                    {/* FIXED: Standardized field suffix to Qty */}
                                    <label className="form-label small text-muted fw-bold">Inbound Qty</label>
                                    <input type="number" className="form-control shadow-none bg-white" name="initialStock" value={formData.initialStock} onChange={handleChange} />
                                </div>
                                <div className="col-12">
                                    <label className="form-label small text-muted fw-bold">Physical Warehouse Bin Location Code</label>
                                    <input type="text" className="form-control shadow-none bg-white" name="warehouseLocation" value={formData.warehouseLocation} onChange={handleChange} placeholder="e.g. Aisle 3, Shelf B-4" />
                                </div>
                            </div>
                        ) : (
                            <div className="mb-4">
                                <div className="table-responsive rounded border shadow-sm">
                                    {/* FIXED: Standardized responsive text table widths to avoid text layout wrapping blocks on desktop touch screens */}
                                    <table className="table table-bordered table-sm text-center align-middle mb-0" style={{ minWidth: '700px' }}>
                                        <thead className="table-light text-muted small">
                                            {/* FIXED: Standardized column headers to Qty */}
                                            <tr><th>Size</th><th>Colorway</th><th>Unique Variant SKU</th><th>Cost (₹)</th><th>Inbound Qty</th><th>Bin Code Location</th><th style={{ width: '50px' }}>Purge</th></tr>
                                        </thead>
                                        <tbody>
                                            {variantRows.map((row, index) => (
                                                <tr key={index}>
                                                    <td className="p-1"><input className="form-control form-control-sm text-center shadow-none border-0" value={row.size} onChange={(e)=>handleVariantChange(index,'size',e.target.value)} placeholder="e.g. L" required/></td>
                                                    <td className="p-1"><input className="form-control form-control-sm text-center shadow-none border-0" value={row.color} onChange={(e)=>handleVariantChange(index,'color',e.target.value)} placeholder="e.g. White" required/></td>
                                                    <td className="p-1"><input className="form-control form-control-sm text-center shadow-none border-0 text-primary fw-medium" value={row.sku} onChange={(e)=>handleVariantChange(index,'sku',e.target.value)} placeholder="Unique Child SKU" required/></td>
                                                    <td className="p-1"><input type="number" className="form-control form-control-sm text-center shadow-none border-0" value={row.cost} onChange={(e)=>handleVariantChange(index,'cost',e.target.value)} required/></td>
                                                    <td className="p-1"><input type="number" className="form-control form-control-sm text-center shadow-none border-0" value={row.stock} onChange={(e)=>handleVariantChange(index,'stock',e.target.value)} required/></td>
                                                    <td className="p-1"><input className="form-control form-control-sm text-center shadow-none border-0" value={row.loc} onChange={(e)=>handleVariantChange(index,'loc',e.target.value)} placeholder="Bin Code"/></td>
                                                    <td className="p-1"><button className="btn btn-outline-danger btn-sm border-0 w-100" onClick={()=>removeVariantRow(index)} type="button"><i className="bi bi-trash"></i></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <button className="btn btn-sm btn-outline-primary mt-2 fw-medium" type="button" onClick={addVariantRow}>
                                    <i className="bi bi-plus-lg me-1"></i> Add Variation Matrix Row
                                </button>
                            </div>
                        )}

                        <div className="d-flex justify-content-end gap-2 border-top pt-3 mt-4">
                            <button className="btn btn-light px-4 fw-medium" type="button" onClick={handleResetForm}>Clear Fields</button>
                            <button className="btn btn-success px-4 fw-bold" type="button" onClick={handleSubmit} disabled={status === 'submitting'}>
                                {status === 'submitting' ? <span className="spinner-border spinner-border-sm me-2"></span> : <><i className="bi bi-cloud-arrow-up-fill me-2"></i>Save & Publish Listing</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SingleProductAdd;