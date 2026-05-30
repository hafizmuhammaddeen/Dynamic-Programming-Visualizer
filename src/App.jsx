import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import MCMAnalyzer from "./assets/Home";
export default function App() {
  return (
    
    <BrowserRouter>
      <Routes>
        {}
        <Route path="/" element={<MCMAnalyzer />} />
        
      </Routes>
    </BrowserRouter>
  );
}

