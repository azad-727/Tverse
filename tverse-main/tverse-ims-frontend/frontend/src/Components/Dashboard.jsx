const Dashboard = () => {
    return (
        <div className="container-fluid p-0">
            {/* Row 1: Overview & Revenue */}
            <div className="row g-4 mb-4">
                
                {/* Overview Card */}
                <div className="col-md-6">
                    <div className="custom-card p-4 h-100">
                        <h5 className="fw-bold mb-4">Overview</h5>
                        <div className="d-flex justify-content-between align-items-end">
                            <div>
                                <div className="text-muted mb-1">Sales Today</div>
                                <h2 className="fw-bold text-success mb-0">€ 12,505</h2>
                            </div>
                            <div className="text-end">
                                <div className="h4 fw-bold mb-0">72</div>
                                <div className="text-muted small">Items Sold</div>
                            </div>
                            <button className="btn btn-success px-4">Search Now</button>
                        </div>
                    </div>
                </div>

                {/* Revenue Trend (Placeholder) */}
                <div className="col-md-6">
                    <div className="custom-card p-4 h-100">
                        <h5 className="fw-bold mb-3">Revenue Trend</h5>
                        <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{height: '150px'}}>
                            <span className="text-muted">Chart Graphic Here</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 2: Top Selling, Stack Insights, Performance */}
            <div className="row g-4">
                {/* Top Selling */}
                <div className="col-md-4">
                    <div className="custom-card p-4 h-100">
                        <h5 className="fw-bold mb-3">Top Selling Products</h5>
                        
                        {/* List Item 1 */}
                        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                            <div className="d-flex align-items-center gap-3">
                                <div className="bg-light rounded" style={{width: 40, height: 40}}></div>
                                <div>
                                    <div className="fw-bold small">Low Stock Items</div>
                                    <div className="text-muted" style={{fontSize: '10px'}}>Onsalto Melgck</div>
                                </div>
                            </div>
                            <i className="bi bi-exclamation-circle text-warning fs-5"></i>
                        </div>

                         {/* List Item 2 */}
                         <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                            <div className="d-flex align-items-center gap-3">
                                <div className="bg-light rounded" style={{width: 40, height: 40}}></div>
                                <div>
                                    <div className="fw-bold small">Out of Stock Listings</div>
                                    <div className="text-muted" style={{fontSize: '10px'}}>Onaaho Maiges</div>
                                </div>
                            </div>
                            <i className="bi bi-hand-thumbs-down text-danger fs-5"></i>
                        </div>
                    </div>
                </div>

                {/* Performance Metrics */}
                <div className="col-md-4">
                    <div className="custom-card p-4 h-100">
                        <h5 className="fw-bold mb-3">Performance Metrics</h5>
                        <div className="d-flex align-items-center gap-4">
                            {/* Circle Chart Placeholder */}
                            <div className="rounded-circle border border-5 border-success d-flex align-items-center justify-content-center" style={{width: 100, height: 100}}>
                                75%
                            </div>
                            <div>
                                <div className="fw-bold">View Pound</div>
                                <div className="text-muted small">Caleist Rate</div>
                                <div className="fw-bold mt-2">$7502</div>
                                <div className="text-muted small">Value Rate</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;