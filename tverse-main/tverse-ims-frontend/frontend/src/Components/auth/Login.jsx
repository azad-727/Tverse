import { useState } from 'react';
import apiClient from '../apiClient';
import tverseLogo from '../../assets/wordmark-logo png.png'; 
import loginVideo from '../../assets/login-video.mp4'; 

const Login = ({ onLoginSuccess }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [securityPin, setSecurityPin] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await apiClient.post('/api/auth/login', {
                phoneNumber: phoneNumber.trim(),
                securityPin: securityPin.trim()
            });

            const { token, role, fullName } = response.data;

            localStorage.setItem('tverse_token', token);
            localStorage.setItem('tverse_role', role);
            localStorage.setItem('tverse_user', fullName);

            onLoginSuccess(role);
        } catch (err) {
            console.error("Authentication failed:", err);
            setError(err.response?.data?.message || "Authentication failed. Please verify your phone number and PIN.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="tverse-login-page-wrapper">
            
            {/* COMPONENT-SPECIFIC RESPONSIVE DESIGN ENGINE */}
            <style>{`
                .tverse-login-page-wrapper {
                    position: relative;
                    width: 100vw;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                    background: #0f172a;
                    overflow-x: hidden;
                    font-family: sans-serif;
                }
                /* MOBILE VIEWPORT CONTROLS: Video spans full background globally */
                .tverse-global-video {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    z-index: 1;
                }
                .tverse-global-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, rgba(15, 23, 42, 0.93) 0%, rgba(2, 44, 34, 0.88) 100%);
                    z-index: 2;
                }
                /* Frosted Glass Floating Card for Phone Devices */
                .tverse-master-card {
                    position: relative;
                    z-index: 3;
                    width: 100%;
                    max-width: 460px;
                    background: rgba(255, 255, 255, 0.88) !important;
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border: 1px solid rgba(255, 255, 255, 0.25);
                    border-radius: 28px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }
                .tverse-right-panel-wrapper {
                    display: none; /* Hidden on mobile viewports */
                }
                .tverse-mobile-status-widget {
                    display: block;
                    background: rgba(0, 0, 0, 0.04);
                    border: 1px solid rgba(0, 0, 0, 0.05);
                }

                /* TABLET & DESKTOP SCREEN ADJUSTMENTS (md breakpoint and up) */
                @media (min-width: 768px) {
                    .tverse-login-page-wrapper {
                        background: #f1f5f9;
                    }
                    /* Revert background video layer parameters back inside split frame context */
                    .tverse-global-video {
                        position: absolute;
                        width: 100%;
                        height: 100%;
                    }
                    .tverse-global-overlay {
                        position: absolute;
                    }
                    /* Solid White Desktop Container based on image_f1c743.png */
                    .tverse-master-card {
                        max-width: 1050px;
                        background: #ffffff !important;
                        backdrop-filter: none;
                        -webkit-backdrop-filter: none;
                        border: none;
                        border-radius: 24px;
                    }
                    .tverse-right-panel-wrapper {
                        display: block; /* Render visual block cleanly alongside forms */
                    }
                    .tverse-mobile-status-widget {
                        display: none; /* Hide standard stack option in favor of premium overlay frame */
                    }
                }
            `}</style>

            {/* BACKGROUND ANIMATED LOOP BLOCK */}
            <video src={loginVideo} autoPlay loop muted playsInline className="tverse-global-video" />
            <div className="tverse-global-overlay" />

            {/* MAIN INTERACTION BOARD */}
            <div className="card border-0 overflow-hidden tverse-master-card">
                <div className="row g-0">
                    
                    {/* LEFT CONTAINER: Clean Form Input Fields */}
                    <div className="col-12 col-md-6 p-4 p-sm-5 d-flex flex-column justify-content-between" style={{ minHeight: '580px' }}>
                        
                        {/* Branding Wordmark Header */}
                        <div className="mb-4 text-center text-md-start">
                            <img 
                                src={tverseLogo} 
                                alt="Tverse Enterprise Wordmark" 
                                style={{ height: '48px', width: 'auto', objectFit: 'contain' }} 
                            />
                        </div>

                        {/* Middle Operational Data Input Interface */}
                        <div className="my-auto mx-auto w-100" style={{ maxWidth: '380px' }}>
                            <h2 className="fw-bold text-dark mb-2 text-center text-md-start" style={{ fontSize: '2.2rem', letterSpacing: '-1.2px', lineHeight: '1.15' }}>
                                Welcome to the T-verse Portal.
                            </h2>
                            <p className="text-muted mb-4 small text-center text-md-start">Log in to manage garment manufacturing runs, raw fabric stock records, and warehouse dispatch pipelines.</p>

                            {error && <div className="alert alert-danger py-2 small border-0 shadow-sm mb-3 text-center">{error}</div>}

                            <form onSubmit={handleSubmit}>
                                {/* Phone Number Inputs Field Wrapper */}
                                <div className="input-group mb-3 border rounded-3 p-1 bg-light align-items-center" style={{ borderColor: '#e2e8f0' }}>
                                    <span className="input-group-text bg-transparent border-0 text-muted px-2">
                                        <i className="bi bi-telephone-fill"></i>
                                    </span>
                                    <input 
                                        type="text" 
                                        className="form-control bg-transparent border-0 shadow-none ps-2" 
                                        placeholder="Registered Phone Number"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        required 
                                    />
                                </div>

                                {/* Security PIN Field Wrapper */}
                                <div className="input-group mb-4 border rounded-3 p-1 bg-light align-items-center" style={{ borderColor: '#e2e8f0' }}>
                                    <span className="input-group-text bg-transparent border-0 text-muted px-2">
                                        <i className="bi bi-shield-lock-fill"></i>
                                    </span>
                                    <input 
                                        type="password" 
                                        className="form-control bg-transparent border-0 shadow-none ps-2 text-center fw-black" 
                                        maxLength="4"
                                        placeholder="4-Digit Kiosk Security PIN"
                                        style={{ letterSpacing: '6px' }}
                                        value={securityPin}
                                        onChange={(e) => setSecurityPin(e.target.value)}
                                        required 
                                    />
                                </div>

                                {/* Submit Execution Trigger Button */}
                                <button 
                                    type="submit" 
                                    className="btn btn-dark w-100 py-3 rounded-3 fw-bold d-flex justify-content-center align-items-center shadow-sm"
                                    style={{ background: '#111', border: 'none' }}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <span className="spinner-border spinner-border-sm"></span>
                                    ) : (
                                        <>Authenticate Terminal <i className="bi bi-arrow-right ms-2"></i></>
                                    )}
                                </button>
                            </form>

                            {/* MOBILE SYNC STATUS NODE (Visible on phone viewports only right below form) */}
                            <div className="p-3 rounded-3 mt-4 tverse-mobile-status-widget">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="text-success small animate-pulse">
                                        <i className="bi bi-circle-fill" style={{ fontSize: '10px' }}></i>
                                    </div>
                                    <div>
                                        <h6 className="mb-0 text-dark fw-bold" style={{ fontSize: '13px' }}>System Engine Engaged</h6>
                                        <p className="mb-0 text-muted" style={{ fontSize: '11px', lineHeight: '1.2' }}>Cloud clusters and warehouse database loops are running securely.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Subtext Block */}
                        <div className="mt-4 pt-2 text-center text-md-start">
                            <p className="text-muted mb-0" style={{ fontSize: '11px', lineHeight: '1.4' }}>
                                Core Version: <span className="text-dark fw-medium">v1.0.0-Stable Production</span>.<br />
                                Access is governed by role-based encryption protocols. All inventory updates, fabric deductions, and barcode scanning loops are audited in real time.
                            </p>
                        </div>
                    </div>

                    {/* RIGHT CONTAINER PANEL: Elegant Split-Canvas Layout (Visible on desktop viewports) */}
                    <div className="col-12 col-md-6 p-3 d-none d-md-block  tverse-right-panel-wrapper">
                        <div 
                            className="w-100 h-100 rounded-4 p-4 d-flex flex-column justify-content-between position-relative overflow-hidden shadow"
                            style={{ borderRadius: '18px', minHeight: '560px' }}
                        >
                            {/* Inner Header Overlays */}
                            <div className="d-flex justify-content-between align-items-center pt-1 px-2 position-relative" style={{ zIndex: 3 }}>
                                <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25 small px-2 py-1" style={{ backdropFilter: 'blur(4px)' }}>
                                    <i className="bi bi-patch-check-fill me-1"></i> Thalasi Knitfab Systems
                                </span>
                                <div className="d-flex gap-3 text-white-50 small fw-medium" style={{ fontSize: '13px' }}>
                                    <span>IMS</span>
                                    <span>WMS</span>
                                    <span>ERP</span>
                                </div>
                            </div>

                            {/* Centered Pitch Context Block */}
                            <div className="my-auto text-center text-white p-4 position-relative" style={{ zIndex: 3 }}>
                                <div className="mb-3 display-5">
                                    <i className="bi bi-cpu text-success opacity-75"></i>
                                </div>
                                <h3 className="fb-bold text-black tracking-tight mb-2" style={{ letterSpacing: '-0.5px' }}>
                                    Thread to Trend Ecosystem
                                </h3>
                                <p className="text-black-50 small mx-auto mb-0" style={{ maxWidth: '320px', fontSize: '13.5px', lineHeight: '1.5' }}>
                                    Bringing tech-driven scalability to manufacturing floors, raw fabric roll tracking, and multi-marketplace order fulfillment channels.
                                </p>
                            </div>

                            {/* Desktop Enterprise Cloud Validation Status Widget Panel */}
                            <div 
                                className="p-3 rounded-3 d-flex align-items-center justify-content-between shadow-lg mx-2 mb-2 position-relative" 
                                style={{ 
                                    zIndex: 3, 
                                    background: 'rgba(255, 255, 255, 0.94)',
                                    backdropFilter: 'blur(10px)'
                                }}
                            >
                                <div className="d-flex align-items-center gap-3">
                                    <div className="p-2 bg-success bg-opacity-10 rounded-2 text-success">
                                        <i className="bi bi-cloud-check-fill fs-4"></i>
                                    </div>
                                    <div>
                                        <h6 className="mb-0 text-dark fw-bold small">Enterprise Engine: Online</h6>
                                        <p className="mb-0 text-muted" style={{ fontSize: '11px', lineHeight: "1.3" }}>
                                            Secure connection established with MySQL Server & Marketplace Sync Channels (Amazon, Flipkart, Meesho).
                                        </p>
                                    </div>
                                </div>
                                <div className="text-success pe-1 animate-pulse">
                                    <i className="bi bi-circle-fill" style={{ fontSize: '9px' }}></i>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
};

export default Login;