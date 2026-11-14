
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import FlightResults from "./pages/FlightResults";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/flights" element={<FlightResults />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
