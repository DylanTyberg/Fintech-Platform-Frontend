// components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useUser } from '../Contexts/UserContext';

const ProtectedRoute = ({ children }) => {
    const { state } = useUser();
    
    console.log('ProtectedRoute - User state:', state.user); // Debug log

    if (!state.user) {
        // Redirect to sign-in if not authenticated
        return <Navigate to="/sign-in" replace />;
    }
    
    return children;
};

export default ProtectedRoute;