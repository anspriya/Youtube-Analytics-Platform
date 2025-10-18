import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Play, TrendingUp, Users, DollarSign, Clock, Eye, ThumbsUp, MessageCircle, Share2, Calendar, Target, BarChart3, Settings, Download, RefreshCw } from 'lucide-react';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'comparison', label: 'Comparison' },
  { key: 'audience', label: 'Audience' },
  { key: 'strategy', label: 'Strategy' },
  { key: 'calendar', label: 'Calendar' },
];

const YouTubeAnalyticsPlatform = () => {
  const [inputChannel, setInputChannel] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  // Calendar state for mock add/export
  const [selectedDay, setSelectedDay] = useState(1);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');

  // Fetch analytics from backend
  const fetchAnalytics = async (channel) => {
    setAnalysisLoading(true);
    setError('');
    try {
      const res = await fetch('/api/analyze-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel }),
      });
      let data = await res.json();
      // Inject mock data for missing fields
      if (!data.formatMetrics) {
        data.formatMetrics = [
          { format: 'Shorts', avgViews: 54200, engagementRate: 8.2, avgRevenue: 211, retention: 78 },
          { format: 'Long-form', avgViews: 33000, engagementRate: 12.5, avgRevenue: 495, retention: 45 }
        ];
      }
      if (!data.performanceData) {
        data.performanceData = [
          { date: '2024-01-01', shortsRevenue: 200, longformRevenue: 420 },
          { date: '2024-01-07', shortsRevenue: 210, longformRevenue: 460 },
          { date: '2024-01-14', shortsRevenue: 190, longformRevenue: 480 },
          { date: '2024-01-21', shortsRevenue: 220, longformRevenue: 430 },
          { date: '2024-01-28', shortsRevenue: 230, longformRevenue: 610 }
        ];
      }
      if (!data.detailedMetrics) {
        data.detailedMetrics = [
          { metric: 'Click-through Rate', shorts: '12.4%', longform: '8.7%', diff: '+3.7%' },
          { metric: 'Average View Duration', shorts: '45s', longform: '4m 32s', diff: '-' },
          { metric: 'Subscriber Conversion', shorts: '2.1%', longform: '4.8%', diff: '-2.7%' },
          { metric: 'Share Rate', shorts: '8.3%', longform: '3.2%', diff: '+5.1%' }
        ];
      }
      if (!data.demographics) {
        data.demographics = {
          ageGroups: [
            { range: '18-24', percentage: 28 },
            { range: '25-34', percentage: 35 },
            { range: '35-44', percentage: 22 },
            { range: '45+', percentage: 15 }
          ]
        };
      }
      if (!data.recommendations) {
        data.recommendations = [
          { type: 'optimal-mix', title: 'Optimal Content Mix', description: 'Based on your data, publish 6 Shorts and 3 long-form videos per week for maximum reach and revenue.', impact: '+23% expected growth', priority: 'high' },
          { type: 'upload-timing', title: 'Upload Timing', description: 'Shorts perform 34% better when posted between 6-9 PM. Long-form content peaks at 2-4 PM.', impact: '+15% engagement boost', priority: 'medium' },
          { type: 'repurpose', title: 'Content Repurposing', description: '12 of your long-form videos have segments perfect for Shorts adaptation.', impact: '+40% content efficiency', priority: 'high' }
        ];
      }
      if (!data.analyticsSummary) {
        data.analyticsSummary = {
          topVideos: [
            { videoId: '1', title: 'Quick Recipe Hack #shorts', views: 2100000 },
            { videoId: '2', title: 'Complete Workout Guide', views: 890000 },
            { videoId: '3', title: 'Tech Tips in 30 Seconds', views: 1500000 }
          ]
        };
      }
      if (!data.audienceData) {
        data.audienceData = [
          { name: 'Shorts Only', value: 35, color: '#ff6b6b' },
          { name: 'Long-form Only', value: 28, color: '#4ecdc4' },
          { name: 'Both Formats', value: 37, color: '#45b7d1' }
        ];
      }
      if (!data.calendarData) {
        // Mock: fill calendar with some Shorts and Long-form
        data.calendarData = [
          { day: 3, type: 'Shorts' }, { day: 5, type: 'Shorts' }, { day: 8, type: 'Shorts' },
          { day: 10, type: 'Shorts' }, { day: 12, type: 'Long-form' }, { day: 15, type: 'Shorts' },
          { day: 17, type: 'Long-form' }, { day: 19, type: 'Shorts' }, { day: 22, type: 'Shorts' },
          { day: 24, type: 'Long-form' }, { day: 26, type: 'Shorts' }, { day: 29, type: 'Shorts' }
        ];
      }
      setAnalysisResult(data);
    } catch (err) {
      setError('Could not fetch channel analytics.');
      setAnalysisResult(null);
    } finally {
      setAnalysisLoading(false);
    }
  };
  // Calendar add handlers (mock)
  const handleAddShort = () => {
    const usedDays = (analysisResult?.calendarData || []).map(e => e.day);
    if (selectedDay && !usedDays.includes(selectedDay)) {
      const newData = [...(analysisResult?.calendarData || []), { day: selectedDay, type: 'Shorts' }];
      setAnalysisResult({ ...analysisResult, calendarData: newData });
    }
  };
  const handleAddLong = () => {
    const usedDays = (analysisResult?.calendarData || []).map(e => e.day);
    if (selectedDay && !usedDays.includes(selectedDay)) {
      const newData = [...(analysisResult?.calendarData || []), { day: selectedDay, type: 'Long-form' }];
      setAnalysisResult({ ...analysisResult, calendarData: newData });
    }
  };
  const handleExportCalendar = () => {
    const data = JSON.stringify(analysisResult?.calendarData || [], null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'calendar.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle channel input submit
  const handleAnalyze = (e) => {
    e.preventDefault();
    if (!inputChannel.trim()) return;
    fetchAnalytics(inputChannel.trim());
  };

  // Format numbers
  const formatNumber = (n) => n ? n.toLocaleString() : '-';

  // Demo: fallback chart data
  const performanceData = analysisResult?.performanceData || [
    { date: '2024-08-01', shortsViews: 12000, longformViews: 8000 },
    { date: '2024-08-08', shortsViews: 15000, longformViews: 9000 },
    { date: '2024-08-15', shortsViews: 18000, longformViews: 11000 },
    { date: '2024-08-22', shortsViews: 21000, longformViews: 13000 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-xl font-bold text-red-600 flex items-center"><Play className="w-6 h-6 mr-1" /> YouTube Analytics</span>
          </div>
          <form className="mt-4 md:mt-0 flex" onSubmit={handleAnalyze}>
            <input
              type="text"
              className="border rounded-l px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
              placeholder="Enter Channel ID or URL"
              value={inputChannel}
              onChange={e => setInputChannel(e.target.value)}
              disabled={analysisLoading}
            />
            <button
              type="submit"
              className="bg-red-500 text-white px-4 py-2 rounded-r hover:bg-red-600 disabled:opacity-50"
              disabled={analysisLoading}
            >{analysisLoading ? 'Analyzing...' : 'Analyze'}</button>
          </form>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <nav className="mb-6 flex space-x-2 border-b">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`px-4 py-2 font-medium border-b-2 transition-colors duration-150 ${activeTab === tab.key ? 'border-red-500 text-red-600' : 'border-transparent text-gray-600 hover:text-red-500'}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        {error && <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">{error}</div>}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <section className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
                <Eye className="w-6 h-6 text-blue-500 mb-2" />
                <div className="text-sm text-gray-500">Total Views (30d)</div>
                <div className="text-xl font-bold">{formatNumber(analysisResult?.analyticsSummary?.totalViews)}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
                <Users className="w-6 h-6 text-purple-500 mb-2" />
                <div className="text-sm text-gray-500">Subscribers</div>
                <div className="text-xl font-bold">{formatNumber(analysisResult?.channel?.subscribers)}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
                <Clock className="w-6 h-6 text-orange-500 mb-2" />
                <div className="text-sm text-gray-500">Video Count</div>
                <div className="text-xl font-bold">{formatNumber(analysisResult?.channel?.videoCount)}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
                <DollarSign className="w-6 h-6 text-green-500 mb-2" />
                <div className="text-sm text-gray-500">Avg Views/Video</div>
                <div className="text-xl font-bold">{formatNumber(analysisResult?.analyticsSummary?.avgViews)}</div>
              </div>
            </div>

            {/* Top Performing Content (always visible) */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Top Performing Content</h2>
              <div className="space-y-2">
                {(analysisResult?.analyticsSummary?.topVideos && analysisResult.analyticsSummary.topVideos.length > 0
                  ? analysisResult.analyticsSummary.topVideos
                  : [
                      { videoId: '1', title: 'Quick Recipe Hack #shorts', views: 2100000 },
                      { videoId: '2', title: 'Complete Workout Guide', views: 890000 },
                      { videoId: '3', title: 'Tech Tips in 30 Seconds', views: 1500000 }
                    ]
                ).map((video, idx) => (
                  <div key={video.videoId} className="flex items-center justify-between px-4 py-2 rounded bg-gray-50">
                    <span className={`flex items-center font-medium ${idx === 0 ? 'text-red-500' : idx === 1 ? 'text-blue-500' : 'text-red-400'}`}>
                      <span className={`inline-block w-3 h-3 rounded-full mr-2 ${idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-blue-500' : 'bg-red-400'}`}></span>
                      {video.title}
                    </span>
                    <span className="font-semibold text-gray-700">{formatNumber(video.views)} views</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Format Recommendations */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Format Recommendations</h2>
              <div className="space-y-4">
                {(analysisResult?.recommendations || []).map((rec, idx) => (
                  <div key={rec.type} className="border-l-4 pl-4 py-2 bg-gray-50 rounded border-blue-400 mb-2">
                    <div className="font-bold text-base mb-1">{rec.title}</div>
                    <div className="text-gray-700 mb-1">{rec.description}</div>
                    <div className="text-sm text-green-600 font-semibold">{rec.impact}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Trends Chart */}
            <section className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Performance Trends: Shorts vs Long-form</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="shortsViews" stroke="#ff6b6b" name="Shorts Views" strokeWidth={2} />
                    <Line type="monotone" dataKey="longformViews" stroke="#4ecdc4" name="Long-form Views" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          </section>
        )}
        {/* Comparison Tab */}
        {activeTab === 'comparison' && (
          <section className="space-y-8">
            {/* Format Performance Comparison */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Format Performance Comparison</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(analysisResult?.formatMetrics || []).map((metric, idx) => (
                  <div key={metric.format} className={`rounded-lg p-4 flex flex-col border ${metric.format === 'Shorts' ? 'border-red-300 bg-red-50' : 'border-blue-300 bg-blue-50'}`}>
                    <div className="flex items-center mb-2">
                      <span className={`inline-block w-3 h-3 rounded-full mr-2 ${metric.format === 'Shorts' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                      <span className={`font-bold text-lg ${metric.format === 'Shorts' ? 'text-red-600' : 'text-blue-600'}`}>{metric.format}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">Avg Views: <span className="font-semibold">{formatNumber(metric.avgViews)}</span></div>
                    <div className="text-sm text-gray-600 mb-1">Engagement Rate: <span className="font-semibold">{metric.engagementRate ? metric.engagementRate + '%' : '-'}</span></div>
                    <div className="text-sm text-gray-600 mb-1">Avg Revenue: <span className="font-semibold">{metric.avgRevenue ? `$${formatNumber(metric.avgRevenue)}` : '-'}</span></div>
                    <div className="text-sm text-gray-600">Retention: <span className="font-semibold">{metric.retention ? metric.retention + '%' : '-'}</span></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Comparison Over Time (always visible) */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Revenue Comparison Over Time</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(analysisResult?.performanceData && analysisResult.performanceData.length > 0
                    ? analysisResult.performanceData
                    : [
                        { date: '2024-01-01', shortsRevenue: 200, longformRevenue: 420 },
                        { date: '2024-01-07', shortsRevenue: 210, longformRevenue: 460 },
                        { date: '2024-01-14', shortsRevenue: 190, longformRevenue: 480 },
                        { date: '2024-01-21', shortsRevenue: 220, longformRevenue: 430 },
                        { date: '2024-01-28', shortsRevenue: 230, longformRevenue: 610 }
                      ]
                  )}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="shortsRevenue" fill="#ff6b6b" name="Shorts Revenue" />
                    <Bar dataKey="longformRevenue" fill="#4ecdc4" name="Long-form Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Performance Metrics */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Detailed Performance Metrics</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left border">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 border-b">Metric</th>
                      <th className="px-4 py-2 border-b">Shorts</th>
                      <th className="px-4 py-2 border-b">Long-form</th>
                      <th className="px-4 py-2 border-b">Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(analysisResult?.detailedMetrics || []).map((row, idx) => (
                      <tr key={row.metric}>
                        <td className="px-4 py-2 border-b font-medium">{row.metric}</td>
                        <td className="px-4 py-2 border-b">{row.shorts}</td>
                        <td className="px-4 py-2 border-b">{row.longform}</td>
                        <td className={`px-4 py-2 border-b font-semibold ${row.diff && row.diff.startsWith('+') ? 'text-green-600' : row.diff && row.diff.startsWith('-') ? 'text-red-600' : ''}`}>{row.diff}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Audience Tab */}
        {activeTab === 'audience' && (
          <section className="space-y-8">
            {/* Audience Format Preference */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Audience Format Preference</h2>
              <div className="flex flex-col md:flex-row md:items-center md:space-x-8">
                <div className="w-full md:w-1/2 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analysisResult?.audienceData || []}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        label
                      >
                        {(analysisResult?.audienceData || []).map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 mt-6 md:mt-0">
                  <ul className="space-y-2">
                    {(analysisResult?.audienceData || []).map((entry, idx) => (
                      <li key={entry.name} className="flex items-center">
                        <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ background: entry.color }}></span>
                        <span className="font-medium">{entry.name}:</span>
                        <span className="ml-2">{entry.value}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Audience Demographics */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Audience Demographics</h2>
              <div className="space-y-4">
                {(analysisResult?.demographics?.ageGroups || []).map((group, idx) => (
                  <div key={group.range} className="flex items-center">
                    <span className="w-32 text-gray-700">{group.range} years</span>
                    <div className="flex-1 bg-gray-200 rounded h-3 mx-2">
                      <div className="bg-blue-500 h-3 rounded" style={{ width: `${group.percentage}%` }}></div>
                    </div>
                    <span className="w-10 text-right text-gray-700">{group.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Viewing Behavior Patterns */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Viewing Behavior Patterns</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="font-semibold text-blue-600 mb-2">Shorts Viewers</div>
                  <div className="text-sm text-gray-700">Peak Time: 6-9 PM</div>
                  <div className="text-sm text-gray-700">Avg Session: 12 minutes</div>
                  <div className="text-sm text-gray-700">Mobile Usage: 89%</div>
                  <div className="text-sm text-gray-700">Repeat Rate: 45%</div>
                </div>
                <div>
                  <div className="font-semibold text-blue-600 mb-2">Long-form Viewers</div>
                  <div className="text-sm text-gray-700">Peak Time: 2-4 PM</div>
                  <div className="text-sm text-gray-700">Avg Session: 24 minutes</div>
                  <div className="text-sm text-gray-700">Mobile Usage: 72%</div>
                  <div className="text-sm text-gray-700">Repeat Rate: 28%</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Strategy Tab */}
        {activeTab === 'strategy' && (
          <section className="space-y-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">AI-Powered Strategy Recommendations</h2>
              <div className="space-y-4">
                {(analysisResult?.recommendations || []).map((rec, idx) => (
                  <div key={rec.type} className={`rounded-lg p-4 border-l-4 mb-2 ${rec.priority === 'high' ? 'border-red-400 bg-red-50' : rec.priority === 'medium' ? 'border-yellow-400 bg-yellow-50' : 'border-green-400 bg-green-50'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-base">{rec.title}</span>
                      {rec.priority && (
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold uppercase ${rec.priority === 'high' ? 'bg-red-200 text-red-700' : rec.priority === 'medium' ? 'bg-yellow-200 text-yellow-700' : 'bg-green-200 text-green-700'}`}>{rec.priority}</span>
                      )}
                    </div>
                    <div className="text-gray-700 mb-1">{rec.description}</div>
                    <div className={`text-sm font-semibold ${rec.impact && rec.impact.includes('+') ? 'text-green-600' : 'text-gray-600'}`}>{rec.impact}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <section className="space-y-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <h2 className="text-xl font-semibold">Content Planning Calendar</h2>
                <div className="flex flex-col md:flex-row md:items-center md:space-x-2 mt-4 md:mt-0">
                  <label className="mb-2 md:mb-0 md:mr-2 font-medium text-gray-700">Select Date:
                    <select
                      className="ml-2 border rounded px-2 py-1"
                      value={selectedDay}
                      onChange={e => setSelectedDay(Number(e.target.value))}
                    >
                      {[...Array(31)].map((_, i) => (
                        <option key={i+1} value={i+1}>{i+1}</option>
                      ))}
                    </select>
                  </label>
                  <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 mt-2 md:mt-0" onClick={handleAddShort}>+ Add Short</button>
                  <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 mt-2 md:mt-0" onClick={handleAddLong}>+ Add Long-form</button>
                  <button className="bg-white border px-3 py-1 rounded flex items-center text-gray-700 hover:bg-gray-100 mt-2 md:mt-0" onClick={handleExportCalendar}><Download className="w-4 h-4 mr-1" /> Export Calendar</button>
                </div>
              </div>
              {/* Simple calendar grid mockup (replace with real calendar logic as needed) */}
              <div className="overflow-x-auto">
                <table className="min-w-full text-center border">
                  <thead>
                    <tr>
                      <th className="px-2 py-2 border-b">Sun</th>
                      <th className="px-2 py-2 border-b">Mon</th>
                      <th className="px-2 py-2 border-b">Tue</th>
                      <th className="px-2 py-2 border-b">Wed</th>
                      <th className="px-2 py-2 border-b">Thu</th>
                      <th className="px-2 py-2 border-b">Fri</th>
                      <th className="px-2 py-2 border-b">Sat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(5)].map((_, weekIdx) => (
                      <tr key={weekIdx}>
                        {[...Array(7)].map((_, dayIdx) => {
                          const dayNum = weekIdx * 7 + dayIdx + 1;
                          let label = '';
                          let color = '';
                          if (analysisResult?.calendarData) {
                            const entry = analysisResult.calendarData.find(e => e.day === dayNum);
                            if (entry) {
                              label = entry.type;
                              color = entry.type === 'Shorts' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600';
                            }
                          }
                          return (
                            <td key={dayIdx} className="px-2 py-2 border-b align-top">
                              <div className="text-xs text-gray-500 mb-1">{dayNum <= 31 ? dayNum : ''}</div>
                              {dayNum <= 31 && label && (
                                <div className={`text-xs px-2 py-1 rounded ${color}`}>{label}</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default YouTubeAnalyticsPlatform;
                     