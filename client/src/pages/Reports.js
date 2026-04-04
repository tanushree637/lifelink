import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminAPI } from "../utils/api";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "../styles/Reports.css";

const Reports = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("30");
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAnalytics(timeRange);
      setAnalytics(response.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="reports-loading">
        <div className="spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  if (!analytics)
    return (
      <div className="reports-error">
        <p>Failed to load analytics</p>
      </div>
    );

  const blood_group_colors = {
    "O+": "#EF4444",
    "O-": "#DC2626",
    "A+": "#F97316",
    "A-": "#EA580C",
    "B+": "#EAB308",
    "B-": "#CA8A04",
    "AB+": "#8B5CF6",
    "AB-": "#7C3AED",
  };

  return (
    <div className="reports-container">
      {/* Header */}
      <div className="reports-header">
        <div className="header-content">
          <h1>📊 Analytics & Reports</h1>
          <p>Real-time insights into platform performance</p>
        </div>

        {/* Time Filter */}
        <div className="time-filter">
          <span>Time Range:</span>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${timeRange === "7" ? "active" : ""}`}
              onClick={() => setTimeRange("7")}
            >
              Last 7 days
            </button>
            <button
              className={`filter-btn ${timeRange === "30" ? "active" : ""}`}
              onClick={() => setTimeRange("30")}
            >
              Last 30 days
            </button>
            <button
              className={`filter-btn ${timeRange === "365" ? "active" : ""}`}
              onClick={() => setTimeRange("365")}
            >
              Last Year
            </button>
            <button
              className={`filter-btn ${timeRange === "0" ? "active" : ""}`}
              onClick={() => setTimeRange("0")}
            >
              All Time
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card summary-card">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <h3>Total Donors</h3>
            <p className="card-value">{analytics.totalDonors}</p>
          </div>
        </div>

        <div className="card summary-card">
          <div className="card-icon">🩸</div>
          <div className="card-content">
            <h3>Total Donations</h3>
            <p className="card-value">{analytics.totalDonations}</p>
          </div>
        </div>

        <div className="card summary-card">
          <div className="card-icon">📩</div>
          <div className="card-content">
            <h3>Total Requests</h3>
            <p className="card-value">{analytics.totalRequests}</p>
          </div>
        </div>

        <div className="card summary-card success-card">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <h3>Fulfillment Rate</h3>
            <p className="card-value">{analytics.successRate}%</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Chart 1: Donations Trend */}
        <div className="card chart-card">
          <h2>📈 Donation Trends (Monthly)</h2>
          <p className="chart-subtitle">
            Shows platform growth and donation patterns
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.trendsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="donations"
                stroke="#2b8cff"
                strokeWidth={3}
                dot={{ fill: "#1a6fe0", r: 5 }}
                activeDot={{ r: 7 }}
                name="Monthly Donations"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2: Requests vs Fulfilled */}
        <div className="card chart-card">
          <h2>📊 Request Fulfillment Status</h2>
          <p className="chart-subtitle">
            Shows system effectiveness in fulfilling requests
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                {
                  name: "Requests vs Fulfilled",
                  "Total Requests": analytics.totalRequests,
                  "Fulfilled Requests": analytics.completedRequests,
                },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="Total Requests"
                fill="#3b82f6"
                name="Total Requests"
              />
              <Bar
                dataKey="Fulfilled Requests"
                fill="#10b981"
                name="Fulfilled Requests"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 3: Blood Group Distribution */}
        <div className="card chart-card">
          <h2>🥧 Blood Group Distribution</h2>
          <p className="chart-subtitle">Demographics of collected donations</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.bloodGroupData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.bloodGroupData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={blood_group_colors[entry.name] || "#999999"}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 4: City-wise Distribution */}
        {analytics.cityData?.length > 0 && (
          <div className="card chart-card">
            <h2>📍 City-wise Distribution (Top 10)</h2>
            <p className="chart-subtitle">
              Geographic demand patterns and coverage
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={analytics.cityData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="city" type="category" width={140} />
                <Tooltip />
                <Bar
                  dataKey="donations"
                  fill="#8b5cf6"
                  name="Donations"
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Insights Section */}
      <div className="insights-section">
        <h2>💡 Key Insights</h2>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">🩸</div>
            <h3>Most Requested Blood Group</h3>
            <p>{analytics.insights?.mostRequestedBlood || "No data"}</p>
          </div>

          <div className="insight-card">
            <div className="insight-icon">📍</div>
            <h3>Highest Activity City</h3>
            <p>{analytics.insights?.mostActiveCity || "No data"}</p>
          </div>

          <div className="insight-card">
            <div className="insight-icon">📊</div>
            <h3>Request Fulfillment Rate</h3>
            <p>{analytics.insights?.fulfillmentRate || "No data"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
