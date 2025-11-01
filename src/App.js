import './App.css';
import {Routes, Route} from 'react-router-dom'
import NavigationBar from './Navigation-bar/navigation-bar';
import Sidebar from './Market/Sidebar/sidebar';
import Indices from './Market/indices/indices';
import SignIn from './Authentication/sign-in/sign-in';
import AllStocks from './Market/All-Stocks/all-stocks';
import StockDetails from './Stock-details/stock-details';
import Movers from './Market/movers/movers';
import Sectors from './Market/Sectors/sectors';
import News from './Market/News/news';
import SignUp from './Authentication/SignUp/SignUp';
import ConfirmEmail from './Authentication/SignUp/confirmEmail';
import PortfolioSidebar from './Portfolio/PortfolioSidebar/PortfolioSidebar';
import Watchlist from './Portfolio/Watchlist/watchlist';

function App() {
  return (
    <Routes>
      <Route path="sign-in" element={<SignIn/>}/>
      <Route path='confirm-email' element={<ConfirmEmail/>}/>
      <Route path="sign-up" element={<SignUp/>}/>
      <Route path="/" element={<NavigationBar />}>
        <Route path="/" element={<Sidebar />}>
          <Route index element={<Indices/>}/>
          <Route path="/all-stocks" element={<AllStocks/>}/>
          <Route path="/movers" element={<Movers/>}/>
          <Route path="/sectors" element={<Sectors/>}/>
          <Route path="/overview" element={<Indices/>}/>
        </Route>
          <Route path="/portfolio" element={<PortfolioSidebar />}>
          <Route index element={<Watchlist/>}/>
          
        </Route>
        <Route path="stock-details/:symbol" element={<StockDetails />}/>
      </Route>
    </Routes>
  );
}

export default App;
