import { confirmSignUp } from 'aws-amplify/auth';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const ConfirmEmail = () => {
    const [code, setCode] = useState("");
    const location = useLocation();
    const usernameFromSignup = location.state?.username || "";
    const [username, setUsername] = useState(usernameFromSignup);
    
    const navigate = useNavigate();

    const handleConfirmSignUp = async (e) => {
        e.preventDefault()
        try {
            const { isSignUpComplete, nextStep } = await confirmSignUp({
                username,
                confirmationCode: code
            });
            console.log('Confirmation successful:', { isSignUpComplete, nextStep });
            navigate("/sign-in")
        } catch (error) {
            console.error('Confirmation error:', error);
        }
    };

    return (
        <div className='sign-up-page'>
            <form className='sign-up-form' onSubmit={handleConfirmSignUp}>
                <div className="form-group">
                    <label htmlFor="confirmation-code" className="form-label">Confirmation Code</label>
                    <input 
                        id="confirmation-code"
                        className="form-input" 
                        type='text' 
                        placeholder="Enter 6-digit code" 
                        required 
                        onChange={(e) => setCode(e.target.value)}
                    />
                </div>
                
                <button className="submit-button" type='submit'>Verify</button>
            </form>
        </div>
    )

}
export default ConfirmEmail;