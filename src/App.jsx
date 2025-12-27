import React from "react";
import Navbar from "./components/Navbar";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import Coin from "./pages/Home/Coin/Coin";
import Footer from "./components/Footer";
import Pricing from "./components/Pricing";
import Blog from "./components/Blog";
import Features from "./components/Features";
import Signup from "./components/Signup";
import Login from "./components/Login"

const App = () => {
  return (
    <div className="app">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/coin/:coinId" element={<Coin />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/features" element={<Features />} />
        <Route path="/signup" element={<Signup />} /> 
        <Route path="/login" element={<Login />} />
      </Routes>
      <Footer />
    </div>
  );
};

export default App;
