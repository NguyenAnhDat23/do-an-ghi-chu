import React, { useState, useEffect } from 'react';

const COLOR_PRESETS = [
  { name: 'Tím NoteVault', hex: '#7c3aed' },
  { name: 'Xanh Sapphire', hex: '#2563eb' },
  { name: 'Ngọc Lục Bảo', hex: '#059669' },
  { name: 'Hồng Thạch Anh', hex: '#e11d48' },
  { name: 'Hổ Phách', hex: '#d97706' },
];

function Settings({ onUpdate, showToast }) {
  // 1. Khởi tạo State lấy theme từ localStorage ngay lập tức để CHỐNG NHÁY
  const [formData, setFormData] = useState(() => {
    const savedTheme = localStorage.getItem('appTheme') || 'Light';
    return {
      displayName: 'Nguyễn Anh Đạt',
      email: 'nguyenanhdat@gmail.com',
      theme: savedTheme,
      primaryColor: '#7c3aed',
      privatePassword: '',
    };
  });

  const [showPassword, setShowPassword] = useState(false);

  // 2. Tải thông tin cài đặt từ Server
  useEffect(() => {
    fetch('http://localhost:5000/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          const currentTheme = data.theme || 'Light';
          // Đồng bộ với localStorage
          localStorage.setItem('appTheme', currentTheme);
          document.documentElement.setAttribute('data-theme', currentTheme.toLowerCase());

          setFormData((prev) => ({
            ...prev,
            displayName: data.displayName || 'Nguyễn Anh Đạt',
            email: data.email || 'nguyenanhdat@gmail.com',
            theme: currentTheme,
            primaryColor: data.primaryColor || '#7c3aed',
          }));
        }
      })
      .catch((err) => console.error('Lỗi tải cài đặt:', err));
  }, []);

  // 3. Hàm chuyển đổi Theme tức thì (không bị trễ)
  const handleThemeChange = (newTheme) => {
    setFormData((prev) => ({ ...prev, theme: newTheme }));
    localStorage.setItem('appTheme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme.toLowerCase());
  };

  const isDark = formData.theme === 'Dark';

  // Cập nhật CSS Variables chủ đạo
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', formData.primaryColor);
  }, [formData.primaryColor]);

  // Bộ màu linh hoạt cho giao diện Settings
  const themeStyles = {
    cardBg: isDark ? '#1e293b' : '#ffffff',
    textColor: isDark ? '#f8fafc' : '#1e293b',
    subTextColor: isDark ? '#94a3b8' : '#64748b',
    borderColor: isDark ? '#334155' : '#e2e8f0',
    dividerColor: isDark ? '#334155' : '#f1f5f9',
    inputBg: isDark ? '#0f172a' : '#ffffff',
    inputBorder: isDark ? '#475569' : '#cbd5e1',
    btnSecBg: isDark ? '#334155' : '#f1f5f9',
    btnSecText: isDark ? '#f1f5f9' : '#334155',
    badgeBg: isDark ? '#064e3b' : '#ecfdf5',
    badgeText: isDark ? '#34d399' : '#059669',
    badgeBorder: isDark ? '#047857' : '#a7f3d0',
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
    let randPass = '';
    for (let i = 0; i < 16; i++) {
      randPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, privatePassword: randPass }));
  };

  const getPasswordStrength = (pass) => {
    if (!pass) return { label: 'Chưa nhập', color: '#94a3b8', width: '0%' };
    if (pass.length < 6) return { label: 'Yếu', color: '#ef4444', width: '25%' };
    if (pass.length < 10) return { label: 'Trung bình', color: '#f59e0b', width: '60%' };
    return { label: 'Rất mạnh (Strong)', color: '#10b981', width: '100%' };
  };

  const strength = getPasswordStrength(formData.privatePassword);

  const handleSave = (e) => {
    if (e) e.preventDefault();

    const payload = {
      displayName: formData.displayName,
      email: formData.email,
      theme: formData.theme,
      primaryColor: formData.primaryColor,
    };

    if (formData.privatePassword.trim()) {
      payload.privatePassword = formData.privatePassword.trim();
    }

    fetch('http://localhost:5000/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success) {
          if (showToast) showToast('Đã lưu cài đặt hệ thống thành công!');
          setFormData((prev) => ({ ...prev, privatePassword: '' }));
          if (onUpdate) onUpdate();
        }
      })
      .catch((err) => alert('Không thể lưu: ' + err.message));
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', padding: '24px', fontFamily: 'sans-serif', color: themeStyles.textColor, transition: 'all 0.2s ease' }}>
      
      {/* HEADER TIÊU ĐỀ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: themeStyles.textColor }}>
            ⚙️ Cài đặt hệ thống
          </h2>
          <p style={{ margin: '4px 0 0 0', color: themeStyles.subTextColor, fontSize: '14px' }}>
            Quản lý tùy chọn hồ sơ cá nhân của bạn.
          </p>
        </div>
        <span style={{ backgroundColor: themeStyles.badgeBg, color: themeStyles.badgeText, border: `1px solid ${themeStyles.badgeBorder}`, padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
          🔒 Mã hóa AES-256 Đầu cuối
        </span>
      </div>

      {/* KHỐI 1: HỒ SƠ & TÀI KHOẢN */}
      <div style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.borderColor}`, borderRadius: '12px', padding: '20px', marginBottom: '20px', transition: 'all 0.2s ease' }}>
        <div style={{ marginBottom: '16px', borderBottom: `1px solid ${themeStyles.dividerColor}`, paddingBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: themeStyles.textColor }}>👤 Hồ sơ & Tài khoản</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', marginBottom: '6px', color: themeStyles.textColor }}>Tên hiển thị (Display Name)</label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${themeStyles.inputBorder}`, backgroundColor: themeStyles.inputBg, color: themeStyles.textColor, fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', marginBottom: '6px', color: themeStyles.textColor }}>Địa chỉ Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${themeStyles.inputBorder}`, backgroundColor: themeStyles.inputBg, color: themeStyles.textColor, fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      </div>

      {/* KHỐI 2: GIAO DIỆN & TRỰC QUAN */}
      <div style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.borderColor}`, borderRadius: '12px', padding: '20px', marginBottom: '20px', transition: 'all 0.2s ease' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold', borderBottom: `1px solid ${themeStyles.dividerColor}`, paddingBottom: '12px', color: themeStyles.textColor }}>
          🎨 Giao diện & Trực quan
        </h3>

        {/* Chế độ hiển thị */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', marginBottom: '10px', color: themeStyles.textColor }}>Chế độ hiển thị (Theme Mode)</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div
              onClick={() => handleThemeChange('Light')}
              style={{
                border: formData.theme === 'Light' ? `2px solid ${formData.primaryColor}` : `1px solid ${themeStyles.borderColor}`,
                borderRadius: '10px',
                padding: '12px',
                cursor: 'pointer',
                backgroundColor: '#ffffff',
                color: '#1e293b'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px' }}>
                <span>☀️ Sáng (Light)</span>
                {formData.theme === 'Light' && <span style={{ color: formData.primaryColor }}>✓</span>}
              </div>
            </div>

            <div
              onClick={() => handleThemeChange('Dark')}
              style={{
                border: formData.theme === 'Dark' ? `2px solid ${formData.primaryColor}` : `1px solid ${themeStyles.borderColor}`,
                borderRadius: '10px',
                padding: '12px',
                cursor: 'pointer',
                backgroundColor: '#0f172a',
                color: '#ffffff'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px' }}>
                <span>🌙 Tối (Dark)</span>
                {formData.theme === 'Dark' && <span style={{ color: formData.primaryColor }}>✓</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Màu sắc chủ đạo */}
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', marginBottom: '8px', color: themeStyles.textColor }}>Màu sắc chủ đạo (Primary / Accent Color)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.hex}
                type="button"
                onClick={() => setFormData({ ...formData, primaryColor: preset.hex })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: formData.primaryColor === preset.hex ? `2px solid ${preset.hex}` : `1px solid ${themeStyles.inputBorder}`,
                  backgroundColor: themeStyles.inputBg,
                  color: themeStyles.textColor,
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: formData.primaryColor === preset.hex ? 'bold' : 'normal'
                }}
              >
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: preset.hex, display: 'inline-block' }}></span>
                {preset.name}
              </button>
            ))}

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto', border: `1px solid ${themeStyles.inputBorder}`, backgroundColor: themeStyles.inputBg, padding: '4px 8px', borderRadius: '6px' }}>
              <span style={{ fontSize: '11px', color: themeStyles.subTextColor, fontWeight: 'bold' }}>HEX:</span>
              <input
                type="color"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                style={{ width: '24px', height: '24px', border: 'none', cursor: 'pointer', background: 'none' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* KHỐI 3: BẢO MẬT VÙNG RIÊNG TƯ */}
      <div style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.borderColor}`, borderRadius: '12px', padding: '20px', marginBottom: '24px', transition: 'all 0.2s ease' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold', borderBottom: `1px solid ${themeStyles.dividerColor}`, paddingBottom: '12px', color: themeStyles.textColor }}>
          🔒 Bảo mật Vùng riêng tư
        </h3>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ fontWeight: 'bold', fontSize: '13px', color: themeStyles.textColor }}>Mật khẩu vùng riêng tư mới</label>
            <button type="button" onClick={generateRandomPassword} style={{ background: 'none', border: 'none', color: formData.primaryColor, cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
              🔑 Tạo ngẫu nhiên
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••••••"
              value={formData.privatePassword}
              onChange={(e) => setFormData({ ...formData, privatePassword: e.target.value })}
              style={{ width: '100%', padding: '10px 40px 10px 12px', borderRadius: '8px', border: `1px solid ${themeStyles.inputBorder}`, backgroundColor: themeStyles.inputBg, color: themeStyles.textColor, fontSize: '14px', boxSizing: 'border-box' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: themeStyles.textColor }}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>

          {formData.privatePassword && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ height: '4px', width: '100%', backgroundColor: themeStyles.dividerColor, borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: strength.width, backgroundColor: strength.color }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px' }}>
                <span style={{ color: themeStyles.subTextColor }}>Độ mạnh mật khẩu:</span>
                <span style={{ color: strength.color, fontWeight: 'bold' }}>{strength.label}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NÚT LƯU THAY ĐỔI */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button
          type="button"
          onClick={handleSave}
          style={{ backgroundColor: formData.primaryColor, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          ✓ Lưu thay đổi
        </button>
      </div>

    </div>
  );
}

export default Settings;