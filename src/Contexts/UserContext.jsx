import { useContext, createContext, useReducer, useState, useEffect } from "react";
import { getCurrentUser, fetchUserAttributes } from "@aws-amplify/auth";

export const UserContext = createContext();

const savedState = JSON.parse(localStorage.getItem("userState"));

const initialState = savedState || {
    user: null,
    watchlist: []
}



const userReducer = (state, action) => {
    switch (action.type) {
        case "SET_USER":
            return {...state, user: action.payload};
        case "SET_WATCHLIST":
            return {...state, watchlist: action.payload};
        case "ADD_TO_WATCHLIST":
            const newSet = new Set(state.watchlist);
            newSet.add(action.payload);
            return { ...state, watchlist: Array.from(newSet) };
        case "REMOVE_FROM_WATCHLIST":
            return {
                ...state,
                watchlist: state.watchlist.filter(item => item.id !== action.payload)
            };
        case "LOGOUT":
            return { ...initialState};
        default:
            return state;
    }
}

export const UserProvider = ({children}) => {
    const [state, dispatch] = useReducer(userReducer, initialState);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        localStorage.setItem("userState", JSON.stringify(state));
    }, [state]);


    // Check for existing session on mount/refresh
    useEffect(() => {
        const checkExistingSession = async () => {
            try {
                // Check if user is authenticated
                const currentUser = await getCurrentUser();
                console.log('Found existing session:', currentUser);
                
                // Get user attributes
                const userAttributes = await fetchUserAttributes();
                console.log('User attributes:', userAttributes);
                
                // Set user in context
                dispatch({ 
                    type: 'SET_USER', 
                    payload: {
                        userId: userAttributes.sub,
                        email: userAttributes.email,
                        username: currentUser.username,
                        ...userAttributes
                    }
                });
                
                // Optionally fetch watchlist here
                // const watchlistRes = await fetch(`/api/watchlist/${userAttributes.sub}`);
                // const watchlist = await watchlistRes.json();
                // dispatch({ type: 'SET_WATCHLIST', payload: watchlist });
                
            } catch (error) {
                console.log('No existing session:', error);
                // User is not signed in, that's okay
            } finally {
                setIsLoading(false);
            }
        };

        checkExistingSession();
    }, []);

    // Show loading while checking session
    if (isLoading) {
        return <div>Loading...</div>; // Or your loading component
    }

    return (
        <UserContext.Provider value={{state, dispatch}}>
            {children}
        </UserContext.Provider>
    )

}
export const useUser = () => {
    const context = useContext(UserContext);
    return context;
}