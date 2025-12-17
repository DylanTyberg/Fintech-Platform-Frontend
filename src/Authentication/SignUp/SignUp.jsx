import { useState } from "react";
import {signUp} from 'aws-amplify/auth';
import { useNavigate } from "react-router-dom";
import "../SignUp/SignUp.css"
import { TradeLoadingState } from "../../Components/LoadingPage/LoadingPage";

const SignUp = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [key, setKey] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null)

    const handleSignUp = async (e) => {
        e.preventDefault();
        setIsLoading(true)
        try {
            const { isSignUpComplete, userId, nextStep } = await signUp({
                username: email,
                password,
                options: { 
                    userAttributes: {
                        email,
                    }
                }
            })
            setMessage("Sign-up successful! Please check your email to confirm.");
            navigate('/confirm-email', { state: { username: email } });
            console.log({ isSignUpComplete, userId, nextStep });
        } catch (error) {
            console.log(error)
            setError(error.message || 'Failed to sign up. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="sign-up-page">
            {error && <div className="error-message">{error}</div>}
            <form className="sign-up-form" onSubmit={handleSignUp}>
                <h1 className="sign-up-title">Sign Up</h1>
                <div className="form-group">
                    <label htmlFor="email" className="form-label">Email</label>
                    <div className="password-input-wrapper">
                        <input 
                            id="email"
                            className="form-input" 
                            type='email' 
                            placeholder="example@gmail.com" 
                            required 
                            onChange={(e) => {setEmail(e.target.value)}}
                        />
                    </div>
                </div>
                
                <div className="form-group">
                    <label htmlFor="password" className="form-label">Password</label>
                    <div className="password-input-wrapper">
                        <input 
                            id="password"
                            className="form-input" 
                            type='password' 
                            placeholder="Minimum 8 characters" 
                            minLength="8"
                            required 
                            onChange={(e) => {setPassword(e.target.value)}}
                        />
                        
                    </div>
                    <p className="password-hint">Must be at least 8 characters</p>
                    <p className="password-hint">Must have at least 1 uppercase character</p>
                    <p className="password-hint">Must have at least 1 special character</p>
                    <p className="password-hint">Must have at least 1 numeric character</p>

                </div>
                
                {isLoading ? (
                    <div className="sign-in-loading">
                        <TradeLoadingState size={20}/>
                    </div>
                ) : (
                    <button className="submit-button" type='submit'>Sign Up</button>
                )}
                <p className="auth-switch">
                    Already have an account? <a href="/sign-in" className="auth-link">Sign In</a>
                </p>
            </form>
        </div>
    )

}
export default SignUp;