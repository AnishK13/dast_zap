import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TesterDashboard from "./pages/tester/Dashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/tester/dashboard" element={<TesterDashboard />} />
        <Route path="/" element={<TesterDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
