import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './Login';
import Profile from './Profile';
import RenewSubscription from './RenewSubscription';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/renew-subscription" element={<RenewSubscription />} />
      </Routes>
    </Router>
  );
}

export default App;
