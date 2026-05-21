import { useState, useEffect } from 'react';
import axios from 'axios';

const ChannelMapping = () => {
    const [activeTab, setActiveTab] = useState('alias'); // 'alias' or 'bundle'
    const [aliases, setAliases] = useState([]);
    const [bundles, setBundles] = useState([]);
    const [uploadFile,setUploadFile]=useState(null);
    
    // Forms
    const [newAlias, setNewAlias] = useState({ channel: "Flipkart", channelSku: "", masterSku: "" });
    const [newBundle, setNewBundle] = useState({ comboSku: "", componentSku: "", quantity: 1 });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        try {
            if (activeTab === 'alias') {
                const res = await axios.get("http://localhost:8080/api/mapping/aliases");
                setAliases(res.data);
            } else {
                const res = await axios.get("http://localhost:8080/api/mapping/bundles");
                setBundles(res.data);
            }
        } catch (e) { console.error(e); }
    };

    // --- HANDLERS ---
    const handleAddAlias = async () => {
        if (!newAlias.channelSku || !newAlias.masterSku) return alert("Fill all fields");
        await axios.post("http://localhost:8080/api/mapping/alias/add", newAlias);
        setNewAlias({ ...newAlias, channelSku: "", masterSku: "" });
        fetchData();
    };

    const handleAddBundle = async () => {
        if (!newBundle.comboSku || !newBundle.componentSku) return alert("Fill all fields");
        await axios.post("http://localhost:8080/api/mapping/bundle/add", newBundle);
        setNewBundle({ ...newBundle, componentSku: "", quantity: 1 }); // Keep combo sku for easy multi-add
        fetchData();
    };

    const handleDelete = async (id, type) => {
        if(!confirm("Delete rule?")) return;
        await axios.delete(`http://localhost:8080/api/mapping/${type}/delete/${id}`);
        fetchData();
    };

    const handleBulkUpload = async()=>{
        if(!uploadFile) return alert("Select a file first");

        const formData=new FormData();
        formData.append("file",uploadFile);
        formData.append("type",activeTab);

        try{
            await axios.post("http://localhost:8080/api/mapping/upload",formData,{
                headers:{"Content-Type":"multipart/form-data"}  
            });
            alert("Upload SuccessFully");
            fetchData();
            setUploadFile(null);
        }catch(e){
            alert("Upload Failed:"+(e.response?.data||e.message));
        }
    };
    return(
        <div className="container-fluid p-0">
            <h3 className="fw-bold mb-4">Channel Mapping & Kitting</h3>

            {/* TABS */}
            <div className="bg-white rounded-top border-bottom px-4 pt-3 shadow-sm">
                <ul className="nav nav-tabs border-0">
                    <li className="nav-item">
                        <button 
                            className={`nav-link border-0 me-3 ${activeTab === 'alias' ? 'active fw-bold border-bottom border-3 border-success text-success' : 'text-muted'}`} 
                            onClick={() => setActiveTab('alias')}
                        >
                            <i className="bi bi-arrow-left-right me-2"></i> SKU Aliasing
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link border-0 ${activeTab === 'bundle' ? 'active fw-bold border-bottom border-3 border-success text-success' : 'text-muted'}`} 
                            onClick={() => setActiveTab('bundle')}
                        >
                            <i className="bi bi-box-seam me-2"></i> Combo / Kitting
                        </button>
                    </li>
                </ul>
            </div>

            <div className="bg-white p-4 rounded-bottom shadow-sm border border-top-0" style={{minHeight: '80vh'}}>
                
                <div className="card p-3 mb-4 bg-light border-primary border shadow-sm">
    <div className="d-flex justify-content-between align-items-center">
        <div>
            <h6 className="fw-bold text-primary mb-1">
                <i className="bi bi-file-earmark-spreadsheet me-2"></i>
                Bulk Upload {activeTab === 'alias' ? 'Aliases' : 'Bundles'}
            </h6>
            <small className="text-muted">
                {activeTab === 'alias' 
                    ? "Format: Channel | Wrong SKU | Correct SKU" 
                    : "Format: Combo SKU | Child SKU | Qty"}
            </small>
        </div>
                <div className="d-flex gap-2">
                            <input 
                                type="file" 
                                className="form-control form-control-sm" 
                                accept=".xlsx"
                                onChange={(e) => setUploadFile(e.target.files[0])}
                                    />
                            <button className="btn btn-sm btn-primary" onClick={handleBulkUpload}>Upload</button>
                        </div>
                    </div>
                </div>
                {/* --- TAB 1: ALIASING --- */}
                {activeTab === 'alias' && (
                    <div className="row">
                        {/* Form */}
                        <div className="col-md-4 border-end">
                            <h5 className="fw-bold mb-3">Add New Rule</h5>
                            <div className="mb-3">
                                <label className="form-label small fw-bold">Channel</label>
                                <select className="form-select" value={newAlias.channel} onChange={e=>setNewAlias({...newAlias, channel: e.target.value})}>
                                    <option>Flipkart</option><option>Amazon</option><option>Meesho</option>
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label small fw-bold">Wrong SKU (From Channel)</label>
                                <input className="form-control" placeholder="e.g. TTS_BLK_SMALL" value={newAlias.channelSku} onChange={e=>setNewAlias({...newAlias, channelSku: e.target.value})} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label small fw-bold">Correct SKU (System Master)</label>
                                <input className="form-control" placeholder="e.g. TTS_BLK_S" value={newAlias.masterSku} onChange={e=>setNewAlias({...newAlias, masterSku: e.target.value})} />
                            </div>
                            <button className="btn btn-success w-100" onClick={handleAddAlias}>Save Alias</button>
                        </div>

                        {/* Table */}
                        <div className="col-md-8 ps-4">
                            <h5 className="fw-bold mb-3">Active Rules</h5>
                            <table className="table table-hover border">
                                <thead className="table-light">
                                    <tr><th>Channel</th><th>Incoming SKU</th><th>Maps To</th><th>Action</th></tr>
                                </thead>
                                <tbody>
                                    {aliases.map(a => (
                                        <tr key={a.id}>
                                            <td><span className="badge bg-light text-dark border">{a.channel}</span></td>
                                            <td className="text-danger">{a.channelSku}</td>
                                            <td className="text-success fw-bold"><i className="bi bi-arrow-right me-2"></i>{a.masterSku}</td>
                                            <td><button className="btn btn-sm text-danger" onClick={()=>handleDelete(a.id, 'alias')}><i className="bi bi-trash"></i></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- TAB 2: BUNDLING --- */}
                {activeTab === 'bundle' && (
                    
                    <div className="row">
                        {/* Form */}
                        <div className="col-md-4 border-end">
                            <h5 className="fw-bold mb-3">Create Bundle</h5>
                            <div className="mb-3">
                                <label className="form-label small fw-bold">Combo SKU Name</label>
                                <input className="form-control" placeholder="e.g. PACK_OF_2_BLK" value={newBundle.comboSku} onChange={e=>setNewBundle({...newBundle, comboSku: e.target.value})} />
                            </div>
                            <div className="p-3 bg-light rounded border mb-3">
                                <label className="form-label small fw-bold">Component Item</label>
                                <input className="form-control mb-2" placeholder="Child SKU (e.g. SHIRT_BLK_S)" value={newBundle.componentSku} onChange={e=>setNewBundle({...newBundle, componentSku: e.target.value})} />
                                <div className="input-group">
                                    <span className="input-group-text">Qty</span>
                                    <input type="number" className="form-control" value={newBundle.quantity} onChange={e=>setNewBundle({...newBundle, quantity: parseInt(e.target.value)})} />
                                </div>
                            </div>
                            <button className="btn btn-primary w-100" onClick={handleAddBundle}>Add Component</button>
                        </div>

                        {/* Table */}
                        <div className="col-md-8 ps-4">
                            <h5 className="fw-bold mb-3">Bundle Configurations</h5>
                            <table className="table table-hover border">
                                <thead className="table-light">
                                    <tr><th>Combo SKU</th><th>Includes Item</th><th>Qty</th><th>Action</th></tr>
                                </thead>
                                <tbody>
                                    {bundles.map(b => (
                                        <tr key={b.id}>
                                            <td className="fw-bold text-primary">{b.comboSku}</td>
                                            <td>{b.componentSku}</td>
                                            <td>{b.quantity}</td>
                                            <td><button className="btn btn-sm text-danger" onClick={()=>handleDelete(b.id, 'bundle')}><i className="bi bi-trash"></i></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ChannelMapping;