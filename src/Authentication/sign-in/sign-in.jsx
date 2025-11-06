import { useState } from "react";
import {signIn} from 'aws-amplify/auth';
import { useNavigate } from "react-router-dom";
import { useUser } from "../../Contexts/UserContext";
import { fetchUserAttributes } from "aws-amplify/auth";


const SignIn = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const {state, dispatch} = useUser();
    


    const handleSignIn = async (e) => {
            e.preventDefault();
            try {
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

                
                navigate('/');

            } catch (error) {
                console.log(error)
                setMessage(error.message);
            }
        }

    return (
        <div className="sign-up-page">
            <form className="sign-up-form" onSubmit={handleSignIn}>
                <input className="username-field" type='text' placeholder="Enter email" required onChange={(e) => {setUsername(e.target.value)}}/>
                <input className="password-field" type='password' placeholder="Enter Password" required onChange={(e) => {setPassword(e.target.value)}}/>
                <button className="submit-button" type='submit'>Sign In</button>
            </form>
        </div>
    )
}
export default SignIn;