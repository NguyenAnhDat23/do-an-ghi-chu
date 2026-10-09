import React, { useState } from 'react';

function PrivateVaultLock({ vaultPassword, onUnlockSuccess, onBackToPublic }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // State Modal Popup "Quên mật mã?"
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [inputEmail, setInputEmail] = useState('');
  const [forgotResult, setForgotResult] = useState('');

  // Xử lý Mở khóa
  const handleUnlock = (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg('Vui lòng nhập mật mã!');
      return;
    }
    if (password === vaultPassword) {
      setErrorMsg('');
      onUnlockSuccess(); // Gọi callback mở khóa thành công
    } else {
      setErrorMsg('Mật mã không đúng!');
    }
  };

  // Xử lý Lấy lại mật khẩu
  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!inputEmail.trim()) {
      alert('Vui lòng nhập Email tài khoản!');
      return;
    }
    setForgotResult(`Mật khẩu Vùng riêng tư của (${inputEmail}) là: ${vaultPassword}`);
  };

  return (
    <div className="vault-lock-screen">
      {/* THANH ĐIỀU HƯỚNG TRÊN CÙNG */}
      <div className="vault-top-bar">
        <button className="btn-back-link" onClick={onBackToPublic}>
          ← Quay lại Ghi chú công khai
        </button>
        <span className="vault-badge-tag">🔒 Phân vùng bảo vệ</span>
      </div>

      {/* CARD NHẬP MẬT KHẨU */}
      <div className="vault-card">
        <div className="vault-icon-container">
          <div className="vault-icon-box">
            <span className="vault-icon">🔒</span>
          </div>
        </div>

        <h2 className="vault-title">Mật khẩu Vùng Riêng tư</h2>
        <p className="vault-subtitle">
          Vui lòng nhập mật mã chuyên biệt để giải mã và mở khóa toàn bộ các ghi chú bảo mật cá nhân của bạn.
        </p>

        <form onSubmit={handleUnlock} className="vault-form">
          <div className="vault-label-row">
            <label className="vault-label">MẬT KHẨU MỞ KHÓA</label>
            <button
              type="button"
              className="btn-forgot"
              onClick={() => {
                setShowForgotModal(true);
                setInputEmail('');
                setForgotResult('');
              }}
            >
              Quên mật mã?
            </button>
          </div>

          <div className="vault-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Nhập mật mã vùng riêng tư..."
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              autoFocus
            />
            <button
              type="button"
              className="btn-toggle-eye"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>

          {errorMsg && <p className="vault-error-msg">{errorMsg}</p>}

          <button type="submit" className="btn-unlock-submit">
            🔓 Mở khóa Vùng riêng tư
          </button>
        </form>

        <div className="vault-card-footer" style={{ justifyContent: 'center', textAlign: 'center' }}>
          <span className="vault-status-text">🟢 Bảo mật đầu cuối AES-256</span>
        </div>
      </div>

      {/* MODAL QUÊN MẬT MÃ */}
      {showForgotModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '14px',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'left',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: '#0f172a' }}>
              Lấy lại mật khẩu Vùng Riêng tư
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px' }}>
              Nhập Email tài khoản của bạn để xem mật khẩu tương ứng:
            </p>

            <form onSubmit={handleForgotSubmit}>
              <input
                type="email"
                placeholder="Nhập email (vd: user@gmail.com)..."
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  marginBottom: '14px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                required
              />

              {forgotResult && (
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: '#fff1f2',
                    borderLeft: '4px solid #e11d48',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#9f1239',
                    marginBottom: '16px',
                    fontWeight: '500',
                    wordBreak: 'break-all',
                  }}
                >
                  🔑 {forgotResult}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#e11d48',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '13px',
                  }}
                >
                  Xem mật khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PrivateVaultLock;