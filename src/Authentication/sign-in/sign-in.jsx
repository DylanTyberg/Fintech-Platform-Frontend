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
                    `https://as9ppqd9d8.execute-api.us-east-1.amazonaws.com/dev/user?userId=${userAttributes.sub}`,
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
                        .map(item => item.type.split("#")[1]), // Extract symbol after the #
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
                setMessage(error.message);
            } finally {
                setIsLoading(false);
            }
        }

    return (
        <div className="sign-up-page">
            <form className="sign-up-form" onSubmit={handleSignIn}>
                
                <input className="username-field" type='text' placeholder="Enter email" required onChange={(e) => {setUsername(e.target.value)}}/>
                <input className="password-field" type='password' placeholder="Enter Password" required onChange={(e) => {setPassword(e.target.value)}}/>
                {isLoading ? <div className="sign-in-loading"><TradeLoadingState size={20}/></div> : <button className="submit-button" type='submit'>Sign In</button>}
            </form>
        </div>
    )
}
export default SignIn;