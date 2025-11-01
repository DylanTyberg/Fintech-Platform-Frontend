import { useState } from "react";
import {signUp} from 'aws-amplify/auth';
import { useNavigate } from "react-router-dom";
import "../SignUp/SignUp.css"

const SignUp = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [key, setKey] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleSignUp = async (e) => {
        e.preventDefault();
        try {
            const { isSignUpComplete, userId, nextStep } = await signUp({
                username: username,
                password,
                options: {  // Changed from 'attributes' to 'options.userAttributes'
                    userAttributes: {
                        email,
                        preferred_username: username,
                        "custom:privateKey": key,
                    }
                }
            })
            setMessage("Sign-up successful! Please check your email to confirm.");
            navigate('/confirm-email', { state: { username: username } });
            console.log({ isSignUpComplete, userId, nextStep });
        } catch (error) {
            console.log(error)
            setMessage(error.message);
        }
    }

    return (
        <div className="sign-up-page">
            <form className="sign-up-form" onSubmit={handleSignUp}>
                <input className="username-field" type='text' placeholder="Enter Username (not email)" required onChange={(e) => {setUsername(e.target.value)}}/>
                <input className="email-field" type='email' placeholder="example@gmail.com" required onChange={(e) => {setEmail(e.target.value)}}/>
                <input className="password-field" type='password' placeholder="Enter Password" required onChange={(e) => {setPassword(e.target.value)}}/>
                <input className="key-field" type='text'required placeholder="Enter Key"  onChange={(e) => {setKey(e.target.value)}}/>
                <button className="submit-button" type='submit'>Sign Up</button>
            </form>
        </div>
    )

}
export default SignUp;