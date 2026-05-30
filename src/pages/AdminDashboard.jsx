import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { buildAdminUserRows } from "@/lib/adminMetrics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [users, projects, bids, workspaces] = await Promise.all([
        base44.entities.User.list("-signup_date", 1000),
        base44.entities.JobPost.list("-created_date", 1000),
        base44.entities.Bid.list("-created_date", 1000),
        base44.entities.Workspace.list("-created_at", 1000),
      ]);
      setRows(buildAdminUserRows({ users, projects, bids, workspaces }));
    } catch (err) {
      console.error("[admin] load failed", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const { totalUsers, newSignups } = useMemo(() => {
    const today = startOfToday();
    const newToday = rows.filter((r) => r.signupDate && r.signupDate >= today).length;
    return { totalUsers: rows.length, newSignups: newToday };
  }, [rows]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <h1 className="text-2xl font-bold">Founder dashboard</h1>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{loading ? "—" : totalUsers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                New signups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{loading ? "—" : newSignups}</p>
              <p className="text-xs text-muted-foreground mt-1">Today</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Users</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No users yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Signup date</TableHead>
                    <TableHead className="text-right">Projects</TableHead>
                    <TableHead className="text-right">Bids</TableHead>
                    <TableHead className="text-right">Workspaces</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id || row.email}>
                      <TableCell className="font-medium">{row.email}</TableCell>
                      <TableCell>{row.roleLabel}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.signupDate ? format(row.signupDate, "dd MMM yyyy") : "—"}
                      </TableCell>
                      <TableCell className="text-right">{row.projectsPosted}</TableCell>
                      <TableCell className="text-right">{row.bidsSubmitted}</TableCell>
                      <TableCell className="text-right">{row.workspaceCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
