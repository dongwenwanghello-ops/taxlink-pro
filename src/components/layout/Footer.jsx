import React from "react";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">TaxPro UK</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The trusted marketplace connecting UK tax and accounting professionals with clients who need expert financial services.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 text-foreground">For Professionals</h4>
            <ul className="space-y-2">
              <li><Link to="/create-profile" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Create Profile</Link></li>
              <li><Link to="/jobs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Browse Jobs</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 text-foreground">For Clients</h4>
            <ul className="space-y-2">
              <li><Link to="/post-job" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Post a Job</Link></li>
              <li><Link to="/professionals" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Find Professionals</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 text-foreground">Community</h4>
            <ul className="space-y-2">
              <li><Link to="/reviews" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Reviews</Link></li>
              <li><span className="text-sm text-muted-foreground">About Us</span></li>
              <li><span className="text-sm text-muted-foreground">Privacy Policy</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-10 pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} TaxPro UK. All rights reserved.
        </div>
      </div>
    </footer>
  );
}