import { useState } from "react";
import {signIn} from 'aws-amplify/auth';
import { useNavigate } from "react-router-dom";
import { useUser } from "../../Contexts/UserContext";
import { fetchUserAttributes } from "aws-amplify/auth";
import { TradeLoadingState } from "../../Components/LoadingPage/LoadingPage";
import "./sign-in.css"


const SignIn = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const {state, dispatch} = useUser();

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null)
    


    const handleSignIn = async (e) => {
            e.preventDefault();
            try {
                setIsLoading(true);
                await signIn({username, password})
                setMessage("Sign-in successful!");
                const userAttributes = await fetchUserAttributes();
                console.log(userAttributes);
                
                
                dispatch({type: "SET_USER", 
                    payload: { 
                        userId: userAttributes.sub,
                        email: userAttributes.email,
                        ...userAttributes      
                    }
                })

                const response = await fetch(
                    `${process.env.REACT_APP_API_URL}/user?userId=${userAttributes.sub}`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const userItems = await response.json()

                

                dispatch({
                    type: "SET_WATCHLIST",
                    payload: userItems
                        .filter(item => item.type?.startsWith("watchlist#"))
                        .map(item => item.type.split("#")[1]),  
                });

                dispatch({
                    type: "SET_CASH",
                    payload: userItems.find(item => item.type?.startsWith("cash#"))?.amount || 0
                })

                dispatch({
                    type: "SET_HOLDINGS",
                    payload: userItems
                        .filter(item => item.type?.startsWith("holding#") && item?.quantity > 0)
                        .map(item => ({
                            symbol: item.type.split("#")[1],
                            quantity: item.quantity,
                    }))
                });

                dispatch({
                    type: "SET_SNAPSHOTS",
                    payload: userItems.filter(item => item.type?.startsWith("snapshot#"))
                    .map(item => ({
                        date: item.type.split("#")[1],
                        portfolioValue: item.totalPortfolioValue,
                        cash: item.cash,
                        holdings: item.holdings
                    }))
                })

                
                navigate('/');

            } catch (error) {
                console.log(error)
                setError(error.message || 'Failed to sign in. Please try again.')
            } finally {
                setIsLoading(false);
            }
        }

    return (
        <div className="sign-up-page">
            {error && <div className="error-message">{error}</div>}
            <form className="sign-up-form" onSubmit={handleSignIn}>
                <h1 className="sign-up-title">Sign In</h1>

                <div className="form-group">
                    <label htmlFor="email" className="form-label">Email</label>
                    <div className="password-input-wrapper">
                        <input 
                            id="email"
                            className="form-input" 
                            type='email' 
                            placeholder="example@gmail.com" 
                            required 
                            onChange={(e) => {setUsername(e.target.value)}}
                        />
                    </div>
                </div>
                
                <div className="form-group">
                    <label htmlFor="password" className="form-label">Password</label>
                    <div className="password-input-wrapper">
                        <input 
                            id="password"
                            className="form-input" 
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password" 
                            required 
                            onChange={(e) => {setPassword(e.target.value)}}
                        />
                        
                    </div>
                </div>
            
            {isLoading ? (
                <div className="sign-in-loading">
                    <TradeLoadingState size={20}/>
                </div>
            ) : (
                <button className="submit-button" type='submit'>Sign In</button>
            )}
             <p className="auth-switch">
                Don't have an account? <a href="/sign-up" className="auth-link">Sign Up</a>
            </p>
        </form>
    </div>
    )
}
export default SignIn;