import './App.css';
import {Routes, Route} from 'react-router-dom'
import NavigationBar from './Navigation-bar/navigation-bar';
import Sidebar from './Market/Sidebar/sidebar';
import Indices from './Market/indices/indices';
import SignIn from './Authentication/sign-in/sign-in';
import AllStocks from './Market/All-Stocks/all-stocks';

function App() {
  return (
    <Routes>
      <Route path="sign-in" element={<SignIn/>}/>
      <Route path="/" element={<NavigationBar />}>
        <Route path="/" element={<Sidebar />}>
          <Route index element={<Indices/>}/>
          <Route path="/all-stocks" element={<AllStocks/>}/>
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
