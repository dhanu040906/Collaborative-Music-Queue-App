import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RoomPage from './pages/RoomPage';
import ProfilePage from './pages/ProfilePage';
import CallbackPage from './pages/CallbackPage';
import TransferPage from './pages/TransferPage';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/room/:code" element={<RoomPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/callback" element={<CallbackPage />} />
                <Route path="/transfer" element={<TransferPage />} />
            </Routes>
        </BrowserRouter>
    );
}
