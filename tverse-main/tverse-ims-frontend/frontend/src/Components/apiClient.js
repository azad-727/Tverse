import axios from 'axios';

const apiClient = axios.create({
    baseURL:import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
    timeout:10000,
    headers:{
        'Content-Type':'application/json',
    }
});

apiClient.interceptors.request.use(
    (config)=>{
        const token=localStorage.getItem('tverse_token');
        if(token){
            config.headers['Authorization']=`Bearer ${token}`;

        }
        return config;
    },
    (error)=>{
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response)=>{
        return response;
    },
    (error) => {
        const status = error.response ? error.response.status : null;

        if (status === 401) {
            console.warn("SECURITY WARNING: JWT Token expired or invalid. Flushing session contexts.");
            
            // Wipe local storage to prevent corrupted state loops
            localStorage.removeItem('tverse_token');
            localStorage.removeItem('tverse_role');
            localStorage.removeItem('tverse_user');
            
            // Hard redirect to clear out old React virtual DOM memory trees and force re-authentication
            window.location.href = '/login';
        }
        
        // Pass the error down to the local component try/catch block so the UI can render specific messages
        return Promise.reject(error);
    }
);

export default apiClient;