import axios from 'axios';

const apiClient = axios.create({
    baseURL:import.meta.env.VITE_API_BASE_URL,
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

     if (status === 401 || status === 403) {
    console.warn("Access denied. Flushing session and redirecting to login.");
    localStorage.removeItem('tverse_token');
    localStorage.removeItem('tverse_role');
    localStorage.removeItem('tverse_user');
    window.location.href = '/login';
}
        
        // Pass the error down to the local component try/catch block so the UI can render specific messages
        return Promise.reject(error);
    }
);

export default apiClient;