import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import FeedbackWidget from "../feedback/FeedbackWidget";

export default function AppLayout() {
  const { pathname } = useLocation();
  const isOnboarding = pathname === "/create-profile";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      {!isOnboarding && <Footer />}
      {!isOnboarding && <FeedbackWidget />}
    </div>
  );
}