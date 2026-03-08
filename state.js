/**
 * state.js - Quản lý trạng thái và dữ liệu ứng dụng.
 */

// ==================== STATE MANAGEMENT ====================
const AppState = {
    state: null,
    isMuted: true,

    init() {
        this.loadState();
        this.bindEvents();
    },

    loadState() {
        const saved = localStorage.getItem('haven_v1');
        let parsed = null;
        try {
            if (saved) parsed = JSON.parse(saved);
        } catch (e) {
            console.error("Could not parse state, resetting.", e);
        }

        if (parsed && parsed.version === 'haven_v1') {
            this.state = parsed;
        } else {
            this.state = this.getDefaultState();
        }
        this.saveState();
    },

    getDefaultState() {
        return {
            version: 'haven_v1',
            currentUser: null,
            users: {}, // { "username": { password: "..." } }
            musicVids: [
                { id: 'jfKfPfyJRdk' } // Video Lofi Girl mặc định để test
            ], 
        };
    },

    saveState() {
        try {
            localStorage.setItem('haven_v1', JSON.stringify(this.state));
        } catch (e) {
            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                console.error("Storage full!", e);
                // Thông báo qua UIController nếu có thể, hoặc alert nhẹ
                alert("Bộ nhớ trình duyệt đã đầy! Không thể lưu thêm ảnh hoặc dữ liệu mới. Hãy xóa bớt ảnh trong thư viện.");
            } else {
                console.error("Error saving state:", e);
            }
        }
    },

    bindEvents() {
        window.addEventListener('storage', (e) => {
            if (e.key === 'haven_v1') {
                this.state = JSON.parse(e.newValue);
            }
        });
    }
};