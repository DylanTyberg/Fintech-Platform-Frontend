import { useState } from "react";
import {signIn} from 'aws-amplify/auth';
import { useNavigate } from "react-router-dom";
const SignIn = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [message, setMessage] = useState("");
    const navigate = useNavigate();
    
    const handleSignIn = async (e) => {
            e.preventDefault();
            try {
                const { isSignedIn, nextStep } = await signIn({
                    username: username.trim(),
                    password: password.trim(),
                })
                setMessage("Sign-up successful! Please check your email to confirm.");
                navigate('/');
                console.log({ isSignedIn, nextStep });
            } catch (error) {
                console.log(error)
                setMessage(error.message);
            }
        }

    return (
        <div className="sign-up-page">
            <form className="sign-up-form" onSubmit={handleSignIn}>
                <input className="username-field" type='text' placeholder="Enter Username or email" required onChange={(e) => {setUsername(e.target.value)}}/>
                <input className="password-field" type='password' placeholder="Enter Password" required onChange={(e) => {setPassword(e.target.value)}}/>
                <button className="submit-button" type='submit'>Sign In</button>
            </form>
        </div>
    )
}
export default SignIn;