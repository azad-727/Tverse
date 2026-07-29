import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from './apiClient';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Quick Edit Operational State
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ stock: 0, cost: 0 });

    // --- CURSOR PAGINATION STATE ---
    const [pageSize, setPageSize] = useState(20);
    const [cursor, setCursor] = useState(null);
    const [nextCursor, setNextCursor] = useState(null);
    const [hasNext, setHasNext] = useState(false);
    const [cursorHistory, setCursorHistory] = useState([]);
    const [pageNumber, setPageNumber] = useState(1);
    const [initialLoading, setInitialLoading] = useState(true);

    const fetchProducts = async (cursorToFetch = null, searchToUse = searchTerm) => {
    setLoading(true);
    try {
        const params = { pageSize };
        if (cursorToFetch) params.cursor = cursorToFetch;
        if (searchToUse) params.search = searchToUse;
        const res = await apiClient.get("/api/catalog/list", { params });
        setProducts(res.data.items);
        setHasNext(res.data.hasNext);
        setNextCursor(res.data.nextCursor);
    } catch (error) {
        console.error("Error fetching products", error);
    } finally {
        setLoading(false);
        setInitialLoading(false);   // only matters the first time; harmless to call every time after
    }
};

    // Runs on mount, and any time pageSize changes
    useEffect(() => {
        setCursor(null);
        setCursorHistory([]);
        setPageNumber(1);
        fetchProducts(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageSize]);

    // Debounced search - resets to page 1 and refetches from the server 800ms after typing stops
    useEffect(() => {
        const timer = setTimeout(() => {
            setCursor(null);
            setCursorHistory([]);
            setPageNumber(1);
            fetchProducts(null, searchTerm);
        }, 800);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    const goToNextPage = () => {
        if (!hasNext || !nextCursor) return;
        setCursorHistory(prev => [...prev, cursor]);
        setCursor(nextCursor);
        setPageNumber(p => p + 1);
        fetchProducts(nextCursor);
    };

    const goToPrevPage = () => {
        if (cursorHistory.length === 0) return;
        const history = [...cursorHistory];
        const prevCursor = history.pop();
        setCursorHistory(history);
        setCursor(prevCursor);
        setPageNumber(p => p - 1);
        fetchProducts(prevCursor);
    };

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
                stock: parseInt(editForm.stock, 10),
                cost: parseFloat(editForm.cost)
            });

            setProducts(products.map(p =>
                p.variantId === variantId
                    ? { ...p, stock: parseInt(editForm.stock, 10), costPrice: parseFloat(editForm.cost) }
                    : p
            ));
            setEditingId(null);
        } catch (error) {
            alert("Operational Update Failed: Verify credentials.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this listing variant record? This will purge history logs and cannot be undone.")) {
            try {
                await apiClient.delete(`/api/catalog/delete/${id}`);
                setProducts(products.filter(p => p.variantId !== id));
            } catch (error) {
                alert("Deletion Blocked: Role validation clearance required.");
            }
        }
    };

    if (initialLoading) return <div className="text-center p-5"><span className="spinner-border text-success"></span><p className="mt-2 small text-muted">Loading System Inventory Ledger...</p></div>;

    return (
        <div className="container-fluid p-0">

            <style>{`
                .tverse-cell-title { font-size: 14px !important; line-height: 1.3; }
                .tverse-cell-sub { font-size: 11px !important; }
                @media (max-width: 768px) {
                    .tverse-toolbar-container { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
                    .tverse-search-box { max-width: 100% !important; width: 100% !important; }
                }
            `}</style>

            {/* Toolbar Area */}
            <div className="d-flex justify-content-between align-items-center mb-3 tverse-toolbar-container">
                <div className="input-group tverse-search-box" style={{ maxWidth: '320px' }}>
                    <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-search"></i></span>
                    <input
                        type="text"
                        className="form-control border-start-0 shadow-none ps-1"
                        placeholder="Search catalog by SKU or Title..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="d-flex align-items-center gap-3">
                    <select
                        className="form-select form-select-sm"
                        style={{ width: '90px' }}
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                    >
                        <option value={20}>20 / page</option>
                        <option value={40}>40 / page</option>
                        <option value={80}>80 / page</option>
                        <option value={160}>160 / page</option>
                    </select>
                    <span className="text-muted small">Page {pageNumber} · {products.length} shown</span>
                    <button className="btn btn-outline-secondary btn-sm px-3 fw-medium" onClick={() => fetchProducts(cursor)}>
                        <i className="bi bi-arrow-clockwise me-1"></i> Sync Grid
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="card border-0 shadow-sm overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0" style={{ minWidth: '900px' }}>
                        <thead className="table-light text-muted small">
                            <tr>
                                <th style={{ width: '70px', paddingLeft: '16px' }}>Image</th>
                                <th>True Product Details</th>
                                <th>Category / Brand Registry</th>
                                <th>Asset Variation Data</th>
                                <th style={{ width: '130px' }}>Procurement Cost</th>
                                <th style={{ width: '110px' }}>Available Qty</th>
                                <th style={{ width: '100px' }} className="text-end pe-3">Actions Matrix</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(p => (
                                <tr key={p.variantId}>
                                    <td style={{ paddingLeft: '16px' }}>
                                        <Link to={`/inventory/product/${p.sku}`}>
                                            <div className="bg-light rounded d-flex align-items-center justify-content-center border overflow-hidden shadow-sm" style={{ width: 48, height: 48 }}>
                                                {p.variantImageUrl ? (
                                                    <img
                                                        src={p.variantImageUrl}
                                                        alt=""
                                                        className="w-100 h-100 object-fit-cover"
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                ) : <i className="bi bi-image text-muted fs-5"></i>}
                                            </div>
                                        </Link>
                                    </td>

                                    <td>
                                        <Link to={`/inventory/product/${p.sku}`} className="text-decoration-none text-dark d-block">
                                            <div className="fw-bold text-dark tverse-cell-title text-truncate" style={{ maxWidth: '280px' }}>{p.productName}</div>
                                            <div className="tverse-cell-sub text-muted mt-0.5">True SKU: <span className="text-primary fw-medium font-monospace">{p.sku}</span></div>
                                        </Link>
                                    </td>

                                    <td>
                                        <span className="badge bg-light text-dark border me-1 small fw-medium">{p.category || 'Unclassified'}</span>
                                        <div className="tverse-cell-sub text-muted mt-1">{p.brand || 'Thalasi Generic'}</div>
                                    </td>

                                    <td>
                                        <div className="d-flex flex-column small">
                                            {p.size && <span className="text-muted" style={{ fontSize: '12px' }}>Size Parameter: <strong className="text-dark">{p.size}</strong></span>}
                                            {p.color && <span className="text-muted" style={{ fontSize: '12px' }}>Color Context: <strong className="text-dark">{p.color}</strong></span>}
                                            {!p.size && !p.color && <span className="fst-italic text-muted small">Standard Single Pattern</span>}
                                        </div>
                                        <div style={{ fontSize: '11px' }} className="text-muted mt-1 fw-medium">
                                            <i className="bi bi-geo-alt me-1 text-secondary"></i>{p.location || "Unallocated"}
                                        </div>
                                    </td>

                                    {editingId === p.variantId ? (
                                        <>
                                            <td className="p-1">
                                                <div className="input-group input-group-sm">
                                                    <span className="input-group-text p-1 bg-transparent small">₹</span>
                                                    <input type="number" className="form-control form-control-sm px-1 text-center" value={editForm.cost} onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })} required />
                                                </div>
                                            </td>
                                            <td className="p-1">
                                                <input type="number" className="form-control form-control-sm px-1 text-center font-monospace fw-bold" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })} required />
                                            </td>
                                            <td className="text-end pe-3">
                                                <div className="d-flex gap-1 justify-content-end">
                                                    <button className="btn btn-sm btn-success p-1 d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }} onClick={() => saveEdit(p.variantId)}><i className="bi bi-check-lg"></i></button>
                                                    <button className="btn btn-sm btn-secondary p-1 d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }} onClick={cancelEdit}><i className="bi bi-x-lg"></i></button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="fw-bold text-dark font-monospace">₹{p.costPrice?.toLocaleString('en-IN') || '0'}</td>
                                            <td>
                                                <span className={`badge px-2.5 py-1.5 font-monospace rounded-pill text-opacity-100 ${p.stock > 15 ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25' : p.stock > 0 ? 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25' : 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25'}`}>
                                                    {p.stock} Qty
                                                </span>
                                            </td>
                                            <td className="text-end pe-3">
                                                <div className="d-flex justify-content-end gap-1">
                                                    <button className="btn btn-sm btn-outline-primary border-0 p-1 d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }} title="Quick Inline Edit" onClick={() => startEdit(p)}>
                                                        <i className="bi bi-pencil-square"></i>
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-danger border-0 p-1 d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }} title="Hard Record Delete Trigger" onClick={() => handleDelete(p.variantId)}>
                                                        <i className="bi bi-trash3-fill"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                            {products.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="text-center p-5 text-muted small fw-medium">
                                        <i className="bi bi-clipboard2-x d-block fs-2 mb-2 text-secondary opacity-50"></i>
                                        No active catalog listings found matching the specified parameters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CURSOR PAGINATION CONTROLS */}
            <div className="d-flex justify-content-between align-items-center mt-3">
                <span className="text-muted small">Page {pageNumber}</span>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-sm btn-outline-secondary"
                        disabled={cursorHistory.length === 0 || loading}
                        onClick={goToPrevPage}
                    >
                        <i className="bi bi-chevron-left"></i> Prev
                    </button>
                    <button
                        className="btn btn-sm btn-outline-secondary"
                        disabled={!hasNext || loading}
                        onClick={goToNextPage}
                    >
                        Next <i className="bi bi-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductList;