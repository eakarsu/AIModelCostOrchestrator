import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import {
  Brain,
  BarChart3,
  TrendingDown,
  Award,
  Activity,
  Bell,
  GitBranch,
  Hash,
  LineChart,
  FlaskConical,
  Key,
  Users,
  Wand2,
  Database,
  Gauge,
  PieChart,
  Lightbulb,
  DollarSign,
  AlertTriangle,
  Coins,
  TrendingUp,
  Tags,
  Shield,
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  X,
  Sparkles,
  Send,
  ChevronDown,
  ChevronUp,
  Loader2,
  Search,
  Eye,
  MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  getAll,
  getById,
  create,
  update,
  remove,
  aiAction,
  getFeatureConfig,
} from '../services/api';

// ─── Icon Map ────────────────────────────────────────────────────────────────

const iconMap = {
  Brain,
  BarChart3,
  TrendingDown,
  Award,
  Activity,
  Bell,
  GitBranch,
  Hash,
  LineChart,
  FlaskConical,
  Key,
  Users,
  Wand2,
  Database,
  Gauge,
  PieChart,
  Lightbulb,
  DollarSign,
  AlertTriangle,
  Coins,
  TrendingUp,
  Tags,
  Shield,
  MessageSquare,
};

// ─── Markdown / AI Content Renderer ──────────────────────────────────────────

function processBold(text) {
  if (!text) return text;
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}

function renderAIContent(content) {
  if (!content) return null;
  const lines = content.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('### '))
      return (
        <h4 key={i} className="ai-heading-4">
          {processBold(line.slice(4))}
        </h4>
      );
    if (line.startsWith('## '))
      return (
        <h3 key={i} className="ai-heading-3">
          {processBold(line.slice(3))}
        </h3>
      );
    if (line.startsWith('# '))
      return (
        <h2 key={i} className="ai-heading-2">
          {processBold(line.slice(2))}
        </h2>
      );
    if (line.startsWith('- ') || line.startsWith('* '))
      return (
        <div key={i} className="ai-bullet">
          <span className="ai-bullet-dot">&#8226;</span>
          <span>{processBold(line.slice(2))}</span>
        </div>
      );
    if (/^\d+\.\s/.test(line))
      return (
        <div key={i} className="ai-numbered">
          {processBold(line)}
        </div>
      );
    if (line.startsWith('---') || line.startsWith('___'))
      return <hr key={i} className="ai-divider" />;
    if (line.trim() === '') return <div key={i} className="ai-spacer" />;
    return <p key={i}>{processBold(line)}</p>;
  });
}

// ─── Value Formatters ────────────────────────────────────────────────────────

function formatValue(value, fieldType) {
  if (value === null || value === undefined || value === '') return '—';
  switch (fieldType) {
    case 'number':
      return typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : value;
    case 'boolean':
      return value ? 'Yes' : 'No';
    case 'date':
      try {
        return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      } catch {
        return value;
      }
    case 'datetime-local':
      try {
        return new Date(value).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      } catch {
        return value;
      }
    default:
      return String(value);
  }
}

function getFieldType(fieldKey, fields) {
  const field = fields.find((f) => f.key === fieldKey);
  return field ? field.type : 'text';
}

// ─── FeatureDetail Component ─────────────────────────────────────────────────

export default function FeatureDetail() {
  const { featureKey } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const feature = getFeatureConfig(featureKey);

  // State
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Resolve icon
  const FeatureIcon = iconMap[feature?.icon] || Brain;

  // ─── Data Fetching ──────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    if (!feature) return;
    setLoading(true);
    try {
      const data = await getAll(feature.path);
      setItems(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      toast.error(`Failed to load data: ${err.message}`);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [feature]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ─── Redirect if invalid feature ───────────────────────────────────────────

  if (!feature) {
    return (
      <div className="empty-state">
        <AlertTriangle size={48} />
        <h2>Feature not found</h2>
        <p>The feature &quot;{featureKey}&quot; does not exist.</p>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  // ─── Form Helpers ───────────────────────────────────────────────────────────

  const initFormData = (item = null) => {
    const data = {};
    feature.fields.forEach((field) => {
      if (item) {
        data[field.key] = item[field.key] ?? '';
      } else {
        data[field.key] = field.type === 'boolean' ? false : '';
      }
    });
    return data;
  };

  const handleOpenCreate = () => {
    setFormData(initFormData());
    setFormErrors({});
    setIsCreating(true);
    setIsEditing(false);
    setSelectedItem(null);
  };

  const handleOpenEdit = () => {
    if (!selectedItem) return;
    setFormData(initFormData(selectedItem));
    setFormErrors({});
    setIsEditing(true);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setIsCreating(false);
    setIsEditing(false);
    setFormData({});
    setFormErrors({});
    setDeleteConfirmId(null);
  };

  const handleCloseForm = () => {
    setIsCreating(false);
    setIsEditing(false);
    setFormData({});
    setFormErrors({});
  };

  const handleFieldChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    feature.fields.forEach((field) => {
      if (field.required) {
        const val = formData[field.key];
        if (val === '' || val === null || val === undefined) {
          errors[field.key] = `${field.label} is required`;
        }
      }
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ─── CRUD Actions ──────────────────────────────────────────────────────────

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const payload = { ...formData };
      feature.fields.forEach((f) => {
        if (f.type === 'number' && payload[f.key] !== '') {
          payload[f.key] = Number(payload[f.key]);
        }
      });
      await create(feature.path, payload);
      toast.success('Item created successfully');
      handleCloseModal();
      fetchItems();
    } catch (err) {
      toast.error(`Failed to create: ${err.message}`);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const payload = { ...formData };
      feature.fields.forEach((f) => {
        if (f.type === 'number' && payload[f.key] !== '') {
          payload[f.key] = Number(payload[f.key]);
        }
      });
      const id = selectedItem.id || selectedItem._id;
      await update(feature.path, id, payload);
      toast.success('Item updated successfully');
      setIsEditing(false);
      setSelectedItem(null);
      fetchItems();
    } catch (err) {
      toast.error(`Failed to update: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    const id = selectedItem.id || selectedItem._id;
    try {
      await remove(feature.path, id);
      toast.success('Item deleted successfully');
      handleCloseModal();
      fetchItems();
    } catch (err) {
      toast.error(`Failed to delete: ${err.message}`);
    }
  };

  // ─── AI Action ─────────────────────────────────────────────────────────────

  const handleRunAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }
    setAiLoading(true);
    setAiResponse('');
    try {
      const result = await aiAction(feature.aiEndpoint, aiPrompt);
      const content =
        result?.data?.choices?.[0]?.message?.content ||
        result?.choices?.[0]?.message?.content ||
        (typeof result?.data === 'string' ? result.data : JSON.stringify(result?.data || result, null, 2));
      setAiResponse(content);
      toast.success('AI analysis complete');
    } catch (err) {
      toast.error(`AI action failed: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  // ─── Search Filter ─────────────────────────────────────────────────────────

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return feature.tableColumns.some((col) => {
      const val = item[col];
      return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
    });
  });

  // ─── Render: Form Field ────────────────────────────────────────────────────

  const renderFormField = (field) => {
    const value = formData[field.key] ?? '';
    const error = formErrors[field.key];

    switch (field.type) {
      case 'textarea':
        return (
          <div className="form-group" key={field.key}>
            <label className="form-label">
              {field.label}
              {field.required && <span style={{ color: '#ef4444' }}> *</span>}
            </label>
            <textarea
              className={`form-textarea ${error ? 'form-input-error' : ''}`}
              value={value}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              rows={4}
              placeholder={`Enter ${field.label.toLowerCase()}...`}
            />
            {error && <span className="form-error">{error}</span>}
          </div>
        );

      case 'boolean':
        return (
          <div className="form-group" key={field.key}>
            <label className="form-label">{field.label}</label>
            <label className="toggle-wrapper">
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) => handleFieldChange(field.key, e.target.checked)}
              />
              <span className="toggle-label">{value ? 'Yes' : 'No'}</span>
            </label>
          </div>
        );

      case 'select':
        return (
          <div className="form-group" key={field.key}>
            <label className="form-label">
              {field.label}
              {field.required && <span style={{ color: '#ef4444' }}> *</span>}
            </label>
            <select
              className={`form-input ${error ? 'form-input-error' : ''}`}
              value={value}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
            >
              <option value="">Select {field.label.toLowerCase()}...</option>
              {(field.options || []).map((opt) => (
                <option key={opt} value={opt}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1).replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            {error && <span className="form-error">{error}</span>}
          </div>
        );

      case 'number':
        return (
          <div className="form-group" key={field.key}>
            <label className="form-label">
              {field.label}
              {field.required && <span style={{ color: '#ef4444' }}> *</span>}
            </label>
            <input
              type="number"
              step="any"
              className={`form-input ${error ? 'form-input-error' : ''}`}
              value={value}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}...`}
            />
            {error && <span className="form-error">{error}</span>}
          </div>
        );

      case 'date':
        return (
          <div className="form-group" key={field.key}>
            <label className="form-label">
              {field.label}
              {field.required && <span style={{ color: '#ef4444' }}> *</span>}
            </label>
            <input
              type="date"
              className={`form-input ${error ? 'form-input-error' : ''}`}
              value={value}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
            />
            {error && <span className="form-error">{error}</span>}
          </div>
        );

      case 'datetime-local':
        return (
          <div className="form-group" key={field.key}>
            <label className="form-label">
              {field.label}
              {field.required && <span style={{ color: '#ef4444' }}> *</span>}
            </label>
            <input
              type="datetime-local"
              className={`form-input ${error ? 'form-input-error' : ''}`}
              value={value}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
            />
            {error && <span className="form-error">{error}</span>}
          </div>
        );

      default:
        return (
          <div className="form-group" key={field.key}>
            <label className="form-label">
              {field.label}
              {field.required && <span style={{ color: '#ef4444' }}> *</span>}
            </label>
            <input
              type="text"
              className={`form-input ${error ? 'form-input-error' : ''}`}
              value={value}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}...`}
            />
            {error && <span className="form-error">{error}</span>}
          </div>
        );
    }
  };

  // ─── Render: Badge for select / boolean values ─────────────────────────────

  const renderBadge = (value, fieldType) => {
    if (fieldType === 'boolean') {
      return (
        <span className={`badge ${value ? 'badge-success' : 'badge-muted'}`}>
          {value ? 'Yes' : 'No'}
        </span>
      );
    }
    if (fieldType === 'select' && value) {
      const colorMap = {
        active: 'badge-success',
        healthy: 'badge-success',
        implemented: 'badge-success',
        approved: 'badge-success',
        completed: 'badge-success',
        running: 'badge-info',
        enforcing: 'badge-info',
        monitoring: 'badge-info',
        pending: 'badge-warning',
        draft: 'badge-warning',
        triggered: 'badge-warning',
        degraded: 'badge-warning',
        over_budget: 'badge-warning',
        high: 'badge-warning',
        critical: 'badge-danger',
        down: 'badge-danger',
        rejected: 'badge-danger',
        revoked: 'badge-danger',
        cancelled: 'badge-danger',
        inactive: 'badge-muted',
        disabled: 'badge-muted',
        expired: 'badge-muted',
        closed: 'badge-muted',
      };
      const cls = colorMap[value] || 'badge-default';
      return (
        <span className={`badge ${cls}`}>
          {String(value).replace(/_/g, ' ')}
        </span>
      );
    }
    return null;
  };

  // ─── Render: Table Cell ────────────────────────────────────────────────────

  const renderCellValue = (item, colKey) => {
    const fieldType = getFieldType(colKey, feature.fields);
    const value = item[colKey];

    if (fieldType === 'boolean') return renderBadge(value, 'boolean');
    if (fieldType === 'select' && value) return renderBadge(value, 'select');
    return formatValue(value, fieldType);
  };

  // ─── Render: Column Label ──────────────────────────────────────────────────

  const getColumnLabel = (colKey) => {
    const field = feature.fields.find((f) => f.key === colKey);
    return field ? field.label : colKey;
  };

  // ─── Main Render ───────────────────────────────────────────────────────────

  return (
    <AppLayout>
    <div className="feature-detail-page">
      {/* ── Top Bar ──────────────────────────────────────────────────────────── */}
      <div className="navbar" style={{ borderBottom: `3px solid ${feature.color}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: `${feature.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FeatureIcon size={20} style={{ color: feature.color }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                {feature.name}
              </h1>
              <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6 }}>
                {feature.description}
              </p>
            </div>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} />
          New Item
        </button>
      </div>

      {/* ── Search Bar ───────────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 24px 0' }}>
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}
          />
          <input
            type="text"
            className="form-input"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>
      </div>

      {/* ── Data Table ───────────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 24px' }}>
        {loading ? (
          <div className="loading-spinner" style={{ textAlign: 'center', padding: '80px 0' }}>
            <Loader2 size={32} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: 12, opacity: 0.6 }}>Loading data...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center', padding: '80px 0' }}>
            <Database size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <h3 style={{ margin: '0 0 8px', fontWeight: 600 }}>
              {items.length === 0 ? 'No items yet' : 'No matching items'}
            </h3>
            <p style={{ margin: '0 0 20px', opacity: 0.5 }}>
              {items.length === 0
                ? `Get started by creating your first ${feature.name.toLowerCase()} entry.`
                : 'Try adjusting your search query.'}
            </p>
            {items.length === 0 && (
              <button className="btn btn-primary" onClick={handleOpenCreate}>
                <Plus size={16} /> Create First Item
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {feature.tableColumns.map((col) => (
                    <th key={col}>{getColumnLabel(col)}</th>
                  ))}
                  <th style={{ width: 60 }}>View</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const id = item.id || item._id;
                  return (
                    <tr
                      key={id}
                      className="table-row-hover"
                      onClick={() => {
                        setSelectedItem(item);
                        setIsEditing(false);
                        setDeleteConfirmId(null);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {feature.tableColumns.map((col) => (
                        <td key={col}>{renderCellValue(item, col)}</td>
                      ))}
                      <td>
                        <Eye size={16} style={{ opacity: 0.4 }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── AI Panel (Collapsible) ───────────────────────────────────────────── */}
      <div style={{ padding: '0 24px 24px' }}>
        <div className="ai-panel" style={{ border: `1px solid ${feature.color}30`, borderRadius: 12 }}>
          <button
            className="btn btn-ghost"
            onClick={() => setAiPanelOpen(!aiPanelOpen)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              fontWeight: 600,
              fontSize: '1rem',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} style={{ color: feature.color }} />
              AI Analysis — {feature.aiLabel}
            </span>
            {aiPanelOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {aiPanelOpen && (
            <div style={{ padding: '0 20px 20px' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <textarea
                  className="form-textarea"
                  placeholder={feature.aiPromptPlaceholder}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={3}
                  style={{ flex: 1, resize: 'vertical' }}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleRunAI}
                  disabled={aiLoading}
                  style={{
                    alignSelf: 'flex-end',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    minWidth: 150,
                    justifyContent: 'center',
                    backgroundColor: feature.color,
                  }}
                >
                  {aiLoading ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Run AI Analysis
                    </>
                  )}
                </button>
              </div>

              {aiResponse && (
                <div
                  className="ai-response"
                  style={{
                    backgroundColor: `${feature.color}08`,
                    border: `1px solid ${feature.color}20`,
                    borderRadius: 10,
                    padding: '24px',
                    animation: 'fadeIn 0.5s ease-in',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <Sparkles size={16} style={{ color: feature.color }} />
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: feature.color }}>
                      AI Analysis Result
                    </span>
                  </div>
                  <div className="ai-content">{renderAIContent(aiResponse)}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Modal (View Item) ─────────────────────────────────────────── */}
      {selectedItem && !isEditing && !isCreating && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 700, maxHeight: '85vh', overflow: 'auto' }}
          >
            <div className="modal-header">
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                Item Details
              </h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-icon" onClick={handleOpenEdit} title="Edit">
                  <Edit3 size={16} />
                </button>
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={() => setDeleteConfirmId(selectedItem.id || selectedItem._id)}
                  title="Delete"
                  style={{ color: '#ef4444' }}
                >
                  <Trash2 size={16} />
                </button>
                <button className="btn btn-ghost btn-icon" onClick={handleCloseModal} title="Close">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Delete confirmation */}
            {deleteConfirmId && (
              <div
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#fef2f2',
                  borderBottom: '1px solid #fecaca',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ color: '#991b1b', fontWeight: 500, fontSize: '0.9rem' }}>
                  <AlertTriangle size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Are you sure you want to delete this item?
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-danger"
                    onClick={handleDelete}
                    style={{ fontSize: '0.85rem', padding: '6px 14px' }}
                  >
                    Yes, Delete
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => setDeleteConfirmId(null)}
                    style={{ fontSize: '0.85rem', padding: '6px 14px' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="modal-body">
              <div className="detail-grid">
                {feature.fields.map((field) => {
                  const value = selectedItem[field.key];
                  const badge = renderBadge(value, field.type);
                  return (
                    <div className="detail-field" key={field.key}>
                      <div className="detail-label">{field.label}</div>
                      <div className="detail-value">
                        {badge || formatValue(value, field.type)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Show extra fields not in feature.fields (e.g. id, created_at, updated_at) */}
              {['id', '_id', 'created_at', 'updated_at', 'createdAt', 'updatedAt'].map((extraKey) => {
                if (selectedItem[extraKey] === undefined) return null;
                const isDate = extraKey.includes('at') || extraKey.includes('At');
                return (
                  <div
                    key={extraKey}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderTop: '1px solid rgba(0,0,0,0.06)',
                      fontSize: '0.85rem',
                      opacity: 0.6,
                    }}
                  >
                    <span>{extraKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</span>
                    <span>
                      {isDate
                        ? formatValue(selectedItem[extraKey], 'datetime-local')
                        : String(selectedItem[extraKey])}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit Form Modal ─────────────────────────────────────────── */}
      {(isCreating || isEditing) && (
        <div className="modal-overlay" onClick={handleCloseForm}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 640, maxHeight: '85vh', overflow: 'auto' }}
          >
            <div className="modal-header">
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                {isCreating ? 'Create New Item' : 'Edit Item'}
              </h2>
              <button className="btn btn-ghost btn-icon" onClick={handleCloseForm}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={isCreating ? handleSubmitCreate : handleSubmitEdit}>
              <div className="modal-body">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '16px',
                  }}
                >
                  {feature.fields.map((field) => renderFormField(field))}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={handleCloseForm}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ backgroundColor: feature.color }}
                >
                  {isCreating ? 'Create Item' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Inline Styles (keyframes) ────────────────────────────────────────── */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .feature-detail-page {
          min-height: 100vh;
          background: #f8fafc;
        }

        .table-row-hover:hover {
          background-color: rgba(99, 102, 241, 0.04);
        }

        .toggle-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }
        .toggle-wrapper input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: ${feature.color};
        }
        .toggle-label {
          font-size: 0.9rem;
          font-weight: 500;
        }

        .form-error {
          color: #ef4444;
          font-size: 0.8rem;
          margin-top: 4px;
          display: block;
        }
        .form-input-error {
          border-color: #ef4444 !important;
        }

        /* Badge variants */
        .badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: capitalize;
        }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-warning { background: #fef9c3; color: #854d0e; }
        .badge-danger { background: #fee2e2; color: #991b1b; }
        .badge-info { background: #dbeafe; color: #1e40af; }
        .badge-muted { background: #f1f5f9; color: #64748b; }
        .badge-default { background: #e2e8f0; color: #475569; }

        /* Detail grid */
        .detail-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        @media (max-width: 600px) {
          .detail-grid {
            grid-template-columns: 1fr;
          }
        }
        .detail-field {
          padding: 10px 0;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        .detail-label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #94a3b8;
          margin-bottom: 4px;
        }
        .detail-value {
          font-size: 0.95rem;
          font-weight: 500;
          color: #1e293b;
        }

        /* AI Content styling */
        .ai-content h2 {
          font-size: 1.15rem;
          font-weight: 700;
          color: #1e293b;
          margin: 20px 0 8px;
          padding-bottom: 6px;
          border-bottom: 2px solid ${feature.color}30;
        }
        .ai-content h3 {
          font-size: 1.05rem;
          font-weight: 700;
          color: #334155;
          margin: 16px 0 6px;
        }
        .ai-content h4 {
          font-size: 0.95rem;
          font-weight: 600;
          color: #475569;
          margin: 12px 0 4px;
        }
        .ai-content p {
          margin: 6px 0;
          line-height: 1.65;
          color: #334155;
        }
        .ai-content strong {
          color: ${feature.color};
          font-weight: 700;
        }
        .ai-bullet {
          display: flex;
          gap: 8px;
          margin: 4px 0 4px 8px;
          line-height: 1.6;
          color: #334155;
        }
        .ai-bullet-dot {
          color: ${feature.color};
          font-weight: bold;
          flex-shrink: 0;
        }
        .ai-numbered {
          margin: 4px 0 4px 8px;
          line-height: 1.6;
          color: #334155;
        }
        .ai-spacer {
          height: 8px;
        }
        .ai-divider {
          border: none;
          border-top: 1px solid ${feature.color}20;
          margin: 12px 0;
        }

        /* Modal overlay */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
        }
        .modal {
          background: white;
          border-radius: 16px;
          width: 90%;
          box-shadow: 0 25px 60px rgba(0,0,0,0.2);
          animation: fadeIn 0.25s ease-out;
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
        }
        .modal-body {
          padding: 24px;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 16px 24px;
          border-top: 1px solid #e2e8f0;
        }
      `}</style>
    </div>
    </AppLayout>
  );
}
