import { useUser } from "../../../Contexts/UserContext";
import { useState } from "react";
const BuyStock = () => {
    const {state, dispatch} = useUser();

    const [isPopular, setIsPopular] = useState();
    const [isSpecific, setIsSpecific] = useState();


    return (
        <div>
            <div>
                <button>Filter Popular</button>
                <button>Search Specific</button>
            </div>
            <div>
                {isPopular && 
                <div>

                </div>
                }
                {isSpecific && 
                <div>
                    
                </div>
                }
            </div>
        </div>
    )
}
export default BuyStock;