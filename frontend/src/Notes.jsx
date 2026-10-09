import React, { useState, useEffect, useRef } from 'react';

const API_BASE = 'http://localhost:5000/api';

function Notes({ primaryColor = '#6366f1', showToast, searchQuery = '' }) {
  // 1. Khởi tạo danh sách chủ đề mặc định bằng tiếng Việt có dấu nguyên bản
  const [topics, setTopics] = useState(['Học tập', 'Công việc', 'Bài tập']);

  // Khôi phục chủ đề từ localStorage khi F5
  const [topic, setTopic] = useState(() => {
    return localStorage.getItem('selectedTopic') || 'Học tập';
  });

  const [newTopicInput, setNewTopicInput] = useState('');
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState({ id: null, title: '', content: '' });

  const editorRef = useRef(null);

  // Hàm tiện ích lấy tên hiển thị của chủ đề (xử lý cả string lẫn object)
  const getTopicName = (t) => {
    if (!t) return '';
    return typeof t === 'object' ? t.name || t.id : t;
  };

  // 2. Chuyển chủ đề an toàn (cảnh báo nếu đang có nội dung chưa lưu)
  const changeTopic = (newTopic) => {
    const currentName = getTopicName(topic);
    const targetName = getTopicName(newTopic);

    if (currentName === targetName) return;

    const hasUnsavedTitle = formData.title.trim().length > 0;
    const hasUnsavedContent = editorRef.current && editorRef.current.innerText.trim().length > 0;

    if (hasUnsavedTitle || hasUnsavedContent) {
      const confirmLeave = window.confirm(
        'Bạn đang có nội dung ghi chú chưa lưu. Chuyển chủ đề sẽ hủy bỏ thay đổi này. Bạn có chắc chắn không?'
      );
      if (!confirmLeave) return;
    }

    setTopic(newTopic);
    localStorage.setItem('selectedTopic', targetName);
  };

  // --- TẢI DANH SÁCH CHỦ ĐỀ TỪ SERVER ---
  const fetchTopics = () => {
    fetch(`${API_BASE}/topics`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTopics(data);

          // Kiểm tra xem chủ đề hiện tại có nằm trong danh sách tải về không
          const currentName = getTopicName(topic);
          const exists = data.some((t) => getTopicName(t) === currentName);
          if (!exists) {
            changeTopic(data[0]);
          }
        }
      })
      .catch(() => {});
  };

  // --- TẢI DANH SÁCH GHI CHÚ TỪ SERVER ---
  const fetchNotes = () => {
    const topicName = getTopicName(topic);
    if (!topicName) return;

    fetch(`${API_BASE}/notes/${encodeURIComponent(topicName)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setNotes(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  useEffect(() => {
    fetchNotes();
    handleResetForm();
  }, [topic]);

  const handleEditNote = (note) => {
    setFormData(note);
    if (editorRef.current) {
      editorRef.current.innerHTML = note.content || '';
    }
  };

  // 3. Reset Form
  const handleResetForm = () => {
    setFormData({ id: null, title: '', content: '' });
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
  };

  // Đồng bộ nội dung editor
  const syncEditorContent = () => {
    if (editorRef.current) {
      if (!editorRef.current.innerText.trim() && editorRef.current.innerHTML !== '') {
        editorRef.current.innerHTML = '';
      }
      setFormData((prev) => ({
        ...prev,
        content: editorRef.current.innerHTML,
      }));
    }
  };

  // CÔNG CỤ SOẠN THẢO RICH TEXT
  const applyFormat = (command) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    const selection = window.getSelection();

    switch (command) {
      case 'bold':
        document.execCommand('bold', false, null);
        break;

      case 'italic':
        document.execCommand('italic', false, null);
        break;

      case 'list':
        document.execCommand('insertUnorderedList', false, null);
        break;

      case 'link': {
        if (!selection || selection.rangeCount === 0) return;
        const anchorNode = selection.anchorNode;
        const parentLink = anchorNode
          ? (anchorNode.nodeType === 3 ? anchorNode.parentNode : anchorNode).closest('a')
          : null;

        if (parentLink) {
          if (window.confirm('Bạn có muốn hủy bỏ liên kết này không?')) {
            document.execCommand('unlink', false, null);
          }
        } else {
          const url = prompt('Nhập đường dẫn liên kết (URL):', 'https://');
          if (url && url.trim()) {
            const formattedUrl = url.trim().startsWith('http')
              ? url.trim()
              : `https://${url.trim()}`;

            if (selection.toString().length === 0) {
              const linkHtml = `<a href="${formattedUrl}" target="_blank" rel="noopener noreferrer">${formattedUrl}</a>`;
              document.execCommand('insertHTML', false, linkHtml);
            } else {
              document.execCommand('createLink', false, formattedUrl);
            }
          }
        }
        break;
      }

      case 'code': {
        if (!selection || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        const selectedText = range.toString();

        const containerNode = range.commonAncestorContainer;
        const codeParent =
          containerNode.nodeType === 3
            ? containerNode.parentNode.closest('code')
            : containerNode.closest('code');

        if (codeParent) {
          const textNode = document.createTextNode(codeParent.textContent);
          codeParent.parentNode.replaceChild(textNode, codeParent);
        } else {
          const codeEl = document.createElement('code');
          codeEl.textContent = selectedText || 'mã_code';

          range.deleteContents();
          range.insertNode(codeEl);

          range.setStartAfter(codeEl);
          range.setEndAfter(codeEl);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        break;
      }

      default:
        break;
    }

    syncEditorContent();
  };

  // --- TẠO CHỦ ĐỀ MỚI & LƯU SERVER (GIỮ NGUYÊN TÊN NHẬP) ---
  const handleAddTopic = () => {
    const trimmed = newTopicInput.trim();
    if (!trimmed) return alert('Vui lòng nhập tên chủ đề!');

    // Kiểm tra trùng lặp
    const exists = topics.some(
      (t) => getTopicName(t).toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      return alert(`Chủ đề "${trimmed}" đã tồn tại!`);
    }

    fetch(`${API_BASE}/topics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    })
      .then((res) => res.json())
      .then((data) => {
        // Giữ nguyên nguyên văn chuỗi nhập
        const addedTopic = data.topic || data.name || trimmed;
        setTopics((prev) => [...prev, addedTopic]);
        changeTopic(addedTopic);
        setNewTopicInput('');
        if (showToast) showToast(`Đã tạo chủ đề "${getTopicName(addedTopic)}"!`);
      })
      .catch(() => {
        // Nếu Server lỗi/chạy offline vẫn cho thêm vào Local State
        setTopics((prev) => [...prev, trimmed]);
        changeTopic(trimmed);
        setNewTopicInput('');
      });
  };

  // --- XÓA CHỦ ĐỀ & CẬP NHẬT SERVER ---
  const handleDeleteTopic = () => {
    if (topics.length <= 1) return alert('Cần giữ lại ít nhất 1 chủ đề!');

    const currentTopicName = getTopicName(topic);

    if (window.confirm(`Xóa chủ đề "${currentTopicName}" và toàn bộ ghi chú bên trong?`)) {
      fetch(`${API_BASE}/topics/${encodeURIComponent(currentTopicName)}`, { method: 'DELETE' })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            const remaining = topics.filter((t) => getTopicName(t) !== currentTopicName);
            setTopics(remaining);
            changeTopic(remaining[0]);
            if (showToast) showToast(`Đã xóa chủ đề "${currentTopicName}"!`);
          }
        })
        .catch(() => alert('Lỗi khi xóa chủ đề!'));
    }
  };

  // --- TẠO / SỬA GHI CHÚ & LƯU SERVER ---
  const handleSaveNote = () => {
    const trimmedTitle = formData.title.trim();
    const contentText = editorRef.current ? editorRef.current.innerText.trim() : '';
    if (!trimmedTitle && !contentText) return alert('Vui lòng nhập nội dung ghi chú!');

    const topicName = getTopicName(topic);
    const noteContent = editorRef.current ? editorRef.current.innerHTML : '';
    const payload = {
      title: formData.title || 'Ghi chú không tiêu đề',
      content: noteContent,
    };

    if (formData.id) {
      fetch(`${API_BASE}/notes/${encodeURIComponent(topicName)}/${formData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            fetchNotes();
            handleResetForm();
            if (showToast) showToast('Đã cập nhật ghi chú!');
          }
        });
    } else {
      fetch(`${API_BASE}/notes/${encodeURIComponent(topicName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            fetchNotes();
            handleResetForm();
            if (showToast) showToast('Đã tạo ghi chú mới!');
          }
        });
    }
  };

  // --- XÓA GHI CHÚ & CẬP NHẬT SERVER ---
  const handleDeleteNote = (id) => {
    const topicName = getTopicName(topic);
    if (window.confirm('Bạn có chắc muốn xóa ghi chú này?')) {
      fetch(`${API_BASE}/notes/${encodeURIComponent(topicName)}/${id}`, {
        method: 'DELETE',
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            fetchNotes();
            if (showToast) showToast('Đã xóa ghi chú!');
          }
        });
    }
  };

  // Lọc ghi chú theo từ khóa tìm kiếm
  const filteredNotes = notes.filter((note) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (note.title && note.title.toLowerCase().includes(query)) ||
      (note.content && note.content.toLowerCase().includes(query))
    );
  });

  const activeTopicName = getTopicName(topic);

  return (
    <div className="dashboard-body">
      <style>{`
        .rich-editor ul, .card-body ul {
          list-style-type: "- " !important;
          padding-left: 20px !important;
          margin: 6px 0 !important;
        }
        .rich-editor li, .card-body li {
          display: list-item !important;
          margin-bottom: 2px !important;
        }
        .rich-editor:empty:before {
          content: 'Nội dung ghi chú của bạn...';
          color: #a0aec0;
          pointer-events: none;
        }
        .rich-editor a, .card-body a {
          color: #2563eb !important;
          text-decoration: underline !important;
        }
        .rich-editor code, .card-body code {
          background-color: #f1f5f9 !important;
          color: #e11d48 !important;
          padding: 2px 6px !important;
          border-radius: 4px !important;
          font-family: monospace !important;
          font-size: 0.9em !important;
          border: 1px solid #e2e8f0 !important;
        }
      `}</style>

      {/* SIDEBAR BÊN TRÁI */}
      <aside className="sidebar">
        <div className="sidebar-header">CHỦ ĐỀ & PHÂN LOẠI</div>

        <div className="add-topic-inline">
          <input
            placeholder="Tên chủ đề mới..."
            value={newTopicInput}
            onChange={(e) => setNewTopicInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
          />
          <button onClick={handleAddTopic}>+</button>
        </div>

        <ul className="topic-list">
          {topics.map((t) => {
            const tName = getTopicName(t);
            const isActive = activeTopicName === tName;

            return (
              <li
                key={tName}
                className={`topic-item ${isActive ? 'active' : ''}`}
                onClick={() => changeTopic(t)}
              >
                📁 {tName}
              </li>
            );
          })}
        </ul>
      </aside>

      {/* NỘI DUNG CHÍNH */}
      <main className="main-content">
        <section className="card-panel">
          <div className="editor-top">
            <div className="editor-title-group">
              <span>✏️</span>
              <h3>{formData.id ? 'Sửa ghi chú' : 'Thêm ghi chú mới'}</h3>
            </div>
            <div className="topic-select-wrapper">
              <label>
                Chủ đề hiện tại: <strong>{activeTopicName}</strong>
              </label>
            </div>
          </div>

          <input
            className="input-note-title"
            placeholder="Tiêu đề ghi chú..."
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />

          <div
            ref={editorRef}
            className="input-note-content rich-editor"
            contentEditable
            onInput={syncEditorContent}
            onKeyUp={syncEditorContent}
            onBlur={syncEditorContent}
            style={{
              minHeight: '120px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px',
              outline: 'none',
              backgroundColor: '#fff',
              overflowY: 'auto',
            }}
          ></div>

          <div className="editor-bottom">
            <div className="toolbar-btns">
              <button
                type="button"
                title="In đậm (Bold)"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyFormat('bold')}
              >
                <b>B</b>
              </button>

              <button
                type="button"
                title="In nghiêng (Italic)"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyFormat('italic')}
              >
                <i>I</i>
              </button>

              <button
                type="button"
                title="Danh sách gạch đầu dòng"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyFormat('list')}
              >
                ☰
              </button>

              <button
                type="button"
                title="Chèn/Hủy liên kết (Link)"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyFormat('link')}
              >
                🔗
              </button>

              <button
                type="button"
                title="Đoạn mã (Code)"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyFormat('code')}
              >
                &lt;/&gt;
              </button>
            </div>

            <div className="action-btns">
              {formData.id && (
                <button className="btn-secondary" onClick={handleResetForm}>
                  Hủy sửa
                </button>
              )}
              <button
                className="btn-primary-purple"
                style={{ backgroundColor: primaryColor }}
                onClick={handleSaveNote}
              >
                {formData.id ? 'Cập nhật' : '+ Tạo ghi chú'}
              </button>
            </div>
          </div>
        </section>

        {/* LƯỚI GHI CHÚ GẦN ĐÂY */}
        <section className="notes-section">
          <div className="section-header">
            <div className="header-left">
              <h3>Ghi chú gần đây</h3>
              <span className="filter-badge">
                {searchQuery
                  ? `Tìm trong "${activeTopicName}": "${searchQuery}"`
                  : `Chủ đề: ${activeTopicName}`}
              </span>
            </div>
            <button className="btn-delete-topic" onClick={handleDeleteTopic}>
              🗑️ Xóa chủ đề này
            </button>
          </div>

          <div className="recent-notes-grid">
            {filteredNotes.length === 0 && (
              <p className="empty-text">
                {searchQuery
                  ? `Không tìm thấy ghi chú nào trong chủ đề "${activeTopicName}" phù hợp với từ khóa "${searchQuery}".`
                  : `Chưa có ghi chú nào trong chủ đề "${activeTopicName}".`}
              </p>
            )}

            {filteredNotes.map((note) => (
              <div key={note.id} className="modern-note-card">
                <div>
                  <span
                    className="note-tag"
                    style={{ backgroundColor: '#e0e7ff', color: primaryColor }}
                  >
                    {activeTopicName}
                  </span>
                  <h4 className="card-title">{note.title}</h4>

                  <div
                    className="card-body"
                    dangerouslySetInnerHTML={{ __html: note.content }}
                  />
                </div>

                <div className="card-footer">
                  <button className="btn-link" onClick={() => handleEditNote(note)}>
                    Sửa
                  </button>
                  <button
                    className="btn-link text-danger"
                    onClick={() => handleDeleteNote(note.id)}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Notes;