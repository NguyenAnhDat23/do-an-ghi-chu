import React, { useState, useEffect } from 'react';
import Notes from './Notes';
import PrivateNotes from './PrivateNotes';
import Settings from './Settings';
import './App.css';

const API_BASE = 'http://localhost:5000/api';

function App() {
  // 1. Lưu & Khôi phục Tab đang chọn khi F5/Reload
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeTab') || 'notes';
  });

  // State tìm kiếm ghi chú toàn cục
  const [searchQuery, setSearchQuery] = useState('');

  // State Profile bổ sung avatarUrl
  const [profile, setProfile] = useState({
    name: 'Nguyễn Anh Đạt',
    primaryColor: '#7c3aed',
    avatarUrl: '',
  });

  const [toastMessage, setToastMessage] = useState('');

  // Hàm chuyển tab và lưu vào localStorage
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    localStorage.setItem('activeTab', tabName);
  };

  const fetchSettings = () => {
    fetch(`${API_BASE}/settings`)
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          const name = data.displayName || data.name || 'Nguyễn Anh Đạt';
          const primaryColor = data.primaryColor || '#7c3aed';
          const avatarUrl = data.avatarUrl || '';

          setProfile({ name, primaryColor, avatarUrl });

          if (data.theme) {
            document.documentElement.setAttribute('data-theme', data.theme.toLowerCase());
          }
        }
      })
      .catch(() => console.log('Sử dụng dữ liệu mặc định'));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Lấy chữ cái đầu làm Avatar dự phòng
  const avatarLetter = profile.name ? profile.name.trim().charAt(0).toUpperCase() : 'U';

  return (
    <div className="dashboard-container">
      {/* TOAST THÔNG BÁO */}
      {toastMessage && <div className="toast-notification">{toastMessage}</div>}

      {/* TOP NAVBAR CHUẨN MẪU - CỐ ĐỊNH CHIỀU CAO 64PX CHỐNG XÔ LỆCH */}
      <header className="top-navbar" style={{ height: '64px', minHeight: '64px', maxHeight: '64px', boxSizing: 'border-box' }}>
        <div className="nav-left">
          <div className="brand-logo">
            <span className="logo-icon">🛡️</span>
            <div>
              <div className="brand-title">
                <strong>NoteVault</strong> <span className="badge-pro">PRO</span>
              </div>
              <small className="brand-sub">Không gian làm việc & Bảo mật</small>
            </div>
          </div>

          <nav className="nav-tabs">
            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
              onClick={() => handleTabChange('notes')}
            >
              📄 Ghi chú công khai
            </button>
            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'private' ? 'active' : ''}`}
              onClick={() => handleTabChange('private')}
            >
              🔒 Vùng riêng tư <span className="dot-alert"></span>
            </button>
            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => handleTabChange('settings')}
            >
              ⚙️ Cài đặt hệ thống
            </button>
          </nav>
        </div>

        <div className="nav-right">
          {/* Ô TÌM KIẾM CÓ CHỨC NĂNG */}
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Tìm kiếm ghi chú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery ? (
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                }}
                onClick={() => setSearchQuery('')}
                title="Xóa tìm kiếm"
              >
                ✕
              </button>
            ) : (
              <kbd className="search-shortcut">⌘K</kbd>
            )}
          </div>

          <button className="btn-bell-icon" title="Thông báo">
            🔔
          </button>

          {/* CỤM USER PROFILE: HIỂN THỊ ẢNH + CHỐNG THỤT LÊN THỤT XUỐNG */}
          <div
            className="user-profile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              height: '40px',
              flexShrink: 0,
            }}
          >
            {/* VÙNG AVATAR */}
            <div
              className="avatar"
              style={{
                backgroundColor: profile.primaryColor,
                width: '36px',
                height: '36px',
                minWidth: '36px',
                borderRadius: '50%',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '15px',
              }}
            >
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                avatarLetter
              )}
            </div>

            {/* VÙNG TÊN & TRẠNG THÁI */}
            <div
              className="user-details"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                maxWidth: '150px',
                overflow: 'hidden',
              }}
            >
              <span
                className="user-name"
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'block',
                  lineHeight: '1.2',
                }}
                title={`Xin chào, ${profile.name}`}
              >
                Xin chào, <strong>{profile.name}</strong>
              </span>
              <small className="sync-status" style={{ lineHeight: '1.2', marginTop: '2px' }}>
                🔒 Đã mã hóa E2E
              </small>
            </div>
          </div>
        </div>
      </header>

      {/* NỘI DUNG MÀN HÌNH CHÍNH */}
      <div className="dashboard-body-wrap">
        {activeTab === 'notes' && (
          <Notes
            primaryColor={profile.primaryColor}
            showToast={showToast}
            searchQuery={searchQuery}
          />
        )}
        {activeTab === 'private' && (
          <PrivateNotes onBackToPublic={() => handleTabChange('notes')} showToast={showToast} />
        )}
        {activeTab === 'settings' && (
          <Settings onUpdate={fetchSettings} showToast={showToast} />
        )}
      </div>
    </div>
  );
}

export default App;