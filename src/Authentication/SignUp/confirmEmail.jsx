import { confirmSignUp } from 'aws-amplify/auth';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

const ConfirmEmail = () => {
    const [code, setCode] = useState("");
    const location = useLocation();
    const usernameFromSignup = location.state?.username || "";
    const [username, setUsername] = useState(usernameFromSignup);

    const handleConfirmSignUp = async (e) => {
        e.preventDefault()
        try {
            const { isSignUpComplete, nextStep } = await confirmSignUp({
                username,
                confirmationCode: code
            });
            console.log('Confirmation successful:', { isSignUpComplete, nextStep });
            // Redirect to login page or auto sign-in
        } catch (error) {
            console.error('Confirmation error:', error);
        }
    };

    return (
        <div className='sign-up-page'>
            <form className='sign-up-form' onSubmit={handleConfirmSignUp}>
                <input type='text' required onChange={(e) => setCode(e.target.value)}/>
                <button type='submit'>Submit</button>
            </form>
        </div>
    )

}
export default ConfirmEmail;