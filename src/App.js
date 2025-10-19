import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Analysis from './pages/Analysis';
import Reports from './pages/Reports';
import ReportDetail from './pages/ReportDetail';
import Settings from './pages/Settings';
import AgentManagement from './pages/AgentManagement';
import NewsMatcherCenter from './pages/NewsMatcherCenter';
import NewsBrowser from './pages/NewsBrowser';
import MatchResults from './pages/MatchResults';
import LLMCorrection from './pages/LLMCorrection';
import NewsMatcherMonitor from './pages/NewsMatcherMonitor';
import './App.css';

const { Content } = Layout;

function App() {
  return (
    <div className="App">
      <Layout style={{ minHeight: '100vh' }}>
        <Sidebar />
        <Layout>
          <Header />
          <Content className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/analysis" element={<Analysis />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/reports/:company/:date" element={<ReportDetail />} />
              <Route path="/agents/*" element={<AgentManagement />} />
              <Route path="/news-matcher/center" element={<NewsMatcherCenter />} />
              <Route path="/news-matcher/news-browser" element={<NewsBrowser />} />
              <Route path="/news-matcher/results" element={<MatchResults />} />
              <Route path="/news-matcher/llm-correction" element={<LLMCorrection />} />
              <Route path="/news-matcher/monitor" element={<NewsMatcherMonitor />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </div>
  );
}

export default App;