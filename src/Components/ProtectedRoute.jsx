// components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useUser } from '../Contexts/UserContext';

const ProtectedRoute = ({ children }) => {
    const { state } = useUser();
    
    

    if (!state.user) {
        // Redirect to sign-in if not authenticated
        return <Navigate to="/sign-in" replace />;
    }
    
    return children;
};

export default ProtectedRoute;