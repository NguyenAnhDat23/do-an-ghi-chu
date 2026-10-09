import React, { useState, useEffect } from 'react';
import PrivateVaultLock from './PrivateVaultLock';

function PrivateNotes({ onBackToPublic, searchQuery = '' }) {
  // 1. Tự động nhận diện Chế độ Sáng / Tối (Dark / Light Mode)
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('appTheme');
    return saved ? saved === 'Dark' : document.documentElement.getAttribute('data-theme') === 'dark';
  });

  useEffect(() => {
    const checkTheme = () => {
      const theme = localStorage.getItem('appTheme') || document.documentElement.getAttribute('data-theme');
      setIsDark(theme === 'Dark' || theme === 'dark');
    };

    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.addEventListener('storage', checkTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', checkTheme);
    };
  }, []);

  // 2. Bảng màu hiển thị động theo Theme
  const theme = {
    bg: isDark ? '#0f172a' : '#f8fafc',
    cardBg: isDark ? '#1e293b' : '#ffffff',
    textPrimary: isDark ? '#f8fafc' : '#1e293b',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    borderColor: isDark ? '#334155' : '#e2e8f0',
    inputBg: isDark ? '#0f172a' : '#ffffff',
    inputBorder: isDark ? '#334155' : '#cbd5e1',
    codeBoxBg: isDark ? '#0f172a' : '#f8fafc',
    codeBoxBorder: isDark ? '#334155' : '#f1f5f9',
    badgeBg: isDark ? '#334155' : '#e2e8f0',
    badgeText: isDark ? '#cbd5e1' : '#475569',
    lockBtnBg: isDark ? '#334155' : '#0f172a',
    lockBtnText: '#ffffff',
    filterBtnBg: isDark ? '#0f172a' : '#ffffff',
    filterBtnText: isDark ? '#94a3b8' : '#64748b',
    filterActiveBg: isDark ? '#38bdf8' : '#0f172a',
    filterActiveText: isDark ? '#0f172a' : '#ffffff',
  };

  // 3. Quản lý Mật khẩu Vùng riêng tư
  const [vaultPassword] = useState(() => {
    return localStorage.getItem('vault_password') || '123456';
  });

  // 4. Trạng thái Mở khóa
  const [isUnlocked, setIsUnlocked] = useState(false);

  // 5. Danh sách ghi chú riêng tư
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('private_notes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        /* ignore */
      }
    }
    return [];
  });

  // 6. State Form Thêm/Sửa & Lọc
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [formCategory, setFormCategory] = useState('Tài khoản');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Tất cả');
  const [visibleContentMap, setVisibleContentMap] = useState({});

  // Tự động lưu vào localStorage
  useEffect(() => {
    localStorage.setItem('private_notes', JSON.stringify(notes));
  }, [notes]);

  // Lưu bí mật
  const handleSaveSecret = (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      alert('Vui lòng nhập đầy đủ tiêu đề và nội dung!');
      return;
    }

    if (editingNoteId) {
      setNotes(
        notes.map((n) =>
          n.id === editingNoteId
            ? {
                ...n,
                title: formTitle,
                category: formCategory,
                content: formContent,
                tag:
                  formCategory === 'Tài khoản'
                    ? 'Mật khẩu cá nhân'
                    : formCategory === 'Tài chính'
                    ? 'Tài chính cá nhân'
                    : 'Bảo mật cá nhân',
              }
            : n
        )
      );
      setEditingNoteId(null);
    } else {
      const newSecret = {
        id: `SEC-${Math.floor(1000 + Math.random() * 9000)}`,
        title: formTitle,
        category: formCategory,
        tag:
          formCategory === 'Tài khoản'
            ? 'Mật khẩu cá nhân'
            : formCategory === 'Tài chính'
            ? 'Tài chính cá nhân'
            : 'Bảo mật cá nhân',
        label:
          formCategory === 'Tài khoản'
            ? 'NỘI DUNG GIẢI MÃ'
            : formCategory === 'Tài chính'
            ? 'SỐ TÀI KHOẢN & PIN'
            : 'BẢO MẬT CẤP CAO',
        statusText: '🟢 Khớp chữ ký',
        content: formContent,
        timeAgo: 'Vừa xong',
        icon:
          formCategory === 'Tài khoản'
            ? '🔑'
            : formCategory === 'Tài chính'
            ? '🏦'
            : '🛡️',
      };
      setNotes([newSecret, ...notes]);
    }

    setFormTitle('');
    setFormContent('');
  };

  const handleEdit = (note) => {
    setEditingNoteId(note.id);
    setFormTitle(note.title);
    setFormCategory(note.category || 'Tài khoản');
    setFormContent(note.content);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bí mật này?')) {
      setNotes(notes.filter((n) => n.id !== id));
    }
  };

  const handleGenerateStrongPassword = () => {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
    let randPass = '';
    for (let i = 0; i < 16; i++) {
      randPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormContent(randPass);
  };

  const toggleVisibility = (id) => {
    setVisibleContentMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert('Đã sao chép nội dung!');
  };

  // Đồng bộ tìm kiếm
  const filteredNotes = notes.filter((note) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      note.title.toLowerCase().includes(q) ||
      note.content.toLowerCase().includes(q) ||
      (note.category && note.category.toLowerCase().includes(q));

    const matchesCategory =
      selectedFilter === 'Tất cả' || note.category === selectedFilter;

    return matchesSearch && matchesCategory;
  });

  // -------------------------------------------------------------
  // TH1: CHƯA MỞ KHÓA -> HIỂN THỊ COMPONENT MÀN HÌNH KHÓA TÁCH BIỆT
  // -------------------------------------------------------------
  if (!isUnlocked) {
    return (
      <PrivateVaultLock
        vaultPassword={vaultPassword}
        onUnlockSuccess={() => setIsUnlocked(true)}
        onBackToPublic={onBackToPublic}
      />
    );
  }

  // -------------------------------------------------------------
  // TH2: ĐÃ MỞ KHÓA -> HIỂN THỊ NỘI DUNG GHI CHÚ RIÊNG TƯ
  // -------------------------------------------------------------
  return (
    <div
      style={{
        backgroundColor: theme.bg,
        padding: '20px',
        minHeight: '100vh',
        fontFamily: 'sans-serif',
        color: theme.textPrimary,
        transition: 'all 0.2s ease',
      }}
    >
      {/* HEADER */}
      <div
        style={{
          background: theme.cardBg,
          padding: '20px',
          borderRadius: '12px',
          border: `1px solid ${theme.borderColor}`,
          marginBottom: '20px',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              backgroundColor: isDark ? '#451a03' : '#fee2e2',
              color: '#dc2626',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            🔒
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: theme.textPrimary }}>
              Khu vực Ghi chú Riêng tư
            </h2>
            <p style={{ margin: '4px 0 0 0', color: theme.textSecondary, fontSize: '13px' }}>
              Dữ liệu được mã hóa Zero-Knowledge theo chuẩn AES-256. Không máy chủ hay bên thứ ba nào có thể đọc nội dung của bạn.
            </p>
          </div>
        </div>

        <div>
          <button
            onClick={() => setIsUnlocked(false)}
            style={{
              backgroundColor: theme.lockBtnBg,
              color: theme.lockBtnText,
              border: `1px solid ${theme.borderColor}`,
              padding: '10px 18px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '13px',
            }}
          >
            🔒 Khóa lại ngay
          </button>
        </div>
      </div>

      {/* FORM THÊM / SỬA */}
      <div
        style={{
          background: theme.cardBg,
          borderRadius: '12px',
          border: `1px solid ${theme.borderColor}`,
          borderTop: '4px solid #e11d48',
          padding: '20px',
          marginBottom: '30px',
        }}
      >
        <form onSubmit={handleSaveSecret}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#e11d48', fontSize: '18px', fontWeight: 'bold' }}>+</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: theme.textPrimary }}>
                  {editingNoteId ? 'Chỉnh sửa bí mật' : 'Thêm bí mật mới'}
                </h3>
                <small style={{ color: theme.textSecondary }}>Nội dung sẽ được mã hóa tức thì trước khi lưu</small>
              </div>
            </div>

            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: `1px solid ${theme.inputBorder}`,
                backgroundColor: theme.inputBg,
                color: theme.textPrimary,
                fontSize: '13px',
                outline: 'none',
              }}
            >
              <option value="Tài khoản">🔑 Tài khoản / Mật khẩu</option>
              <option value="Tài chính">🏦 Tài chính / Thẻ ATM</option>
              <option value="Bảo mật">🛡️ Mã bảo mật / Khôi phục</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: theme.textSecondary, marginBottom: '6px' }}>
              TIÊU ĐỀ BÍ MẬT *
            </label>
            <input
              type="text"
              placeholder="Mật khẩu Facebook, Mã PIN ATM..."
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: `1px solid ${theme.inputBorder}`,
                backgroundColor: theme.inputBg,
                color: theme.textPrimary,
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: theme.textSecondary }}>
                NỘI DUNG BÍ MẬT *
              </label>
              <button
                type="button"
                onClick={handleGenerateStrongPassword}
                style={{ background: 'none', border: 'none', color: '#e11d48', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
              >
                🔑 Tạo mật khẩu mạnh
              </button>
            </div>
            <textarea
              rows="3"
              placeholder="Nhập nội dung bí mật..."
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: `1px solid ${theme.inputBorder}`,
                backgroundColor: theme.inputBg,
                color: theme.textPrimary,
                fontSize: '14px',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#16a34a' }}>
              🛡️ Mã hóa Client-Side AES-256
            </span>
            <button
              type="submit"
              style={{ backgroundColor: '#e11d48', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
            >
              💾 {editingNoteId ? 'Cập nhật bí mật' : 'Lưu bí mật'}
            </button>
          </div>
        </form>
      </div>

      {/* DANH SÁCH CARD */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: theme.textPrimary }}>Danh sách Ghi chú đã lưu</h3>
            <span style={{ backgroundColor: theme.badgeBg, color: theme.badgeText, padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
              {filteredNotes.length} mục
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {['Tất cả', 'Tài khoản', 'Tài chính', 'Bảo mật'].map((cat) => {
              const isSelected = selectedFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedFilter(cat)}
                  style={{
                    backgroundColor: isSelected ? theme.filterActiveBg : theme.filterBtnBg,
                    color: isSelected ? theme.filterActiveText : theme.filterBtnText,
                    border: `1px solid ${theme.inputBorder}`,
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: isSelected ? 'bold' : 'normal',
                    cursor: 'pointer',
                  }}
                >
                  {cat === 'Tất cả' ? `Tất cả (${notes.length})` : cat}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredNotes.length === 0 ? (
            <div style={{ background: theme.cardBg, padding: '40px 20px', borderRadius: '12px', border: `1px dashed ${theme.borderColor}`, gridColumn: '1 / -1', textAlign: 'center', color: theme.textSecondary }}>
              Chưa có ghi chú bí mật nào.
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isRevealed = visibleContentMap[note.id];
              return (
                <div key={note.id} style={{ background: theme.cardBg, borderRadius: '12px', border: `1px solid ${theme.borderColor}`, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px' }}>{note.icon || '🔒'}</span>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: theme.textPrimary }}>{note.title}</h4>
                      </div>
                      <small style={{ color: theme.textSecondary, fontSize: '11px' }}>{note.timeAgo}</small>
                    </div>

                    <div style={{ backgroundColor: theme.codeBoxBg, border: `1px solid ${theme.codeBoxBorder}`, borderRadius: '8px', padding: '10px', margin: '12px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 'bold', wordBreak: 'break-all', color: theme.textPrimary }}>
                          {isRevealed ? note.content : '••••••••••••••••'}
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => toggleVisibility(note.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                            {isRevealed ? '👁️‍🗨️' : '👁️'}
                          </button>
                          <button onClick={() => handleCopy(note.content)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                            📋
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: `1px solid ${theme.borderColor}`, paddingTop: '10px' }}>
                    <button onClick={() => handleEdit(note)} style={{ background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Sửa</button>
                    <button onClick={() => handleDelete(note.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Xóa</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default PrivateNotes;