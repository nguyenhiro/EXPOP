/**
 * ui.js - Điều khiển giao diện người dùng.
 */

// ==================== UI CONTROLLER ====================
const UIController = {
    /**
     * Hiển thị thông báo toast
     */
    showToast(message, type = 'info') {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        const appContainer = document.querySelector('.app-container');
        if (appContainer) appContainer.appendChild(toast);
        else document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    },

    /**
     * Cập nhật trạng thái người dùng trên header
     */
    updateUserStatus(user) {
        const userStatusEl = document.getElementById('user-status');
        const logoutBtn = document.getElementById('logout-btn');

        if (userStatusEl && logoutBtn) {
            if (user) {
                userStatusEl.textContent = `👤 ${user.toUpperCase()}`;
                logoutBtn.style.display = 'inline-block';
            } else {
                userStatusEl.textContent = '👤 GUEST';
                logoutBtn.style.display = 'none';
            }
        }
    },

    /**
     * Chuyển đổi giữa form đăng nhập và đăng ký
     */
    switchAuthMode() {
        const title = document.getElementById('auth-title');
        const nameInput = document.getElementById('auth-name');
        const passInput = document.getElementById('auth-pass');
        const confirmInput = document.getElementById('auth-pass-confirm');
        const submitBtn = document.getElementById('auth-submit-btn');
        const switchLink = document.getElementById('auth-switch-link');

        // Reset trạng thái UI về mặc định (đề phòng trường hợp bị thay đổi bởi Change Password view)
        nameInput.style.display = 'block';
        nameInput.placeholder = 'Tên tài khoản';
        passInput.placeholder = 'Mật khẩu';
        confirmInput.placeholder = 'Nhập lại mật khẩu';

        // Tự động tạo ô nhập Mật khẩu cấp 2 nếu chưa có (để không phải sửa HTML thủ công)
        let pass2Input = document.getElementById('auth-pass-2');
        if (!pass2Input && confirmInput) {
            pass2Input = document.createElement('input');
            pass2Input.type = 'password';
            pass2Input.id = 'auth-pass-2';
            // Chèn vào sau ô nhập lại mật khẩu
            confirmInput.parentNode.insertBefore(pass2Input, confirmInput.nextSibling);
        }
        if (pass2Input) pass2Input.placeholder = 'Mật khẩu cấp 2';

        const isLoginMode = submitBtn.dataset.action === 'login';

        if (isLoginMode) {
            // Switch to Register mode
            title.textContent = 'Đăng Ký';
            confirmInput.style.display = 'block';
            if (pass2Input) pass2Input.style.display = 'block';
            submitBtn.textContent = 'Đăng Ký';
            submitBtn.dataset.action = 'register';
            switchLink.textContent = 'Đã có tài khoản? Đăng nhập';
        } else {
            // Switch to Login mode
            title.textContent = 'Đăng Nhập';
            confirmInput.style.display = 'none';
            if (pass2Input) pass2Input.style.display = 'none';
            submitBtn.textContent = 'Đăng Nhập';
            submitBtn.dataset.action = 'login';
            switchLink.textContent = 'Chưa có tài khoản? Đăng ký';
            // Khôi phục action của link nếu bị đổi
            switchLink.dataset.action = 'switch-auth-mode';
        }

        // Clear inputs
        this.clearAuthForm();
    },

    /**
     * Xóa nội dung các trường input trong form đăng nhập/đăng ký
     */
    clearAuthForm() {
        document.getElementById('auth-name').value = '';
        document.getElementById('auth-pass').value = '';
        document.getElementById('auth-pass-confirm').value = '';
        const pass2 = document.getElementById('auth-pass-2');
        if (pass2) pass2.value = '';
    },

    /**
     * Render danh sách nhạc
     */
    renderMusicFeed() {
        const feed = document.getElementById('music-feed');
        if (!feed) return;

        const musicVideos = AppState.state.musicVids || [];

        if (musicVideos.length === 0) {
            feed.innerHTML = `<div class="empty-state"><p>Không có bài hát nào.</p></div>`;
        } else {
            feed.innerHTML = musicVideos.map((v) => VideoRenderer.renderMusicUnit(v)).join('');
            // Khởi tạo lazy loading và auto-play cho các video vừa render
            setTimeout(() => VideoPlayer.initObservers(), 100);
        }
    },

    /**
     * Render kho ảnh
     */
    async renderGallery() {
        const grid = document.getElementById('gallery-grid');
        if (!grid) return;

        // Kiểm tra an toàn: Nếu DB chưa được tải
        if (typeof DB === 'undefined') {
            grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1"><p>Lỗi: Không thể kết nối cơ sở dữ liệu ảnh.</p></div>`;
            return;
        }

        // Xóa các Object URL cũ để giải phóng bộ nhớ
        grid.querySelectorAll('img[src^="blob:"]').forEach(img => URL.revokeObjectURL(img.src));
        grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1"><p>Đang tải ảnh...</p></div>`;

        const photos = await DB.getAllPhotos();
        
        if (photos.length === 0) {
            grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1"><p>Chưa có ảnh nào. Hãy tải lên!</p></div>`;
        } else {
            grid.innerHTML = photos.map(p => {
                const imageUrl = URL.createObjectURL(p.file); // Tạo URL tạm thời từ Blob
                return `
                    <div class="gallery-item">
                        <img src="${imageUrl}" loading="lazy" alt="Photo" data-action="view-photo" data-src="${imageUrl}">
                        <button class="btn-delete-photo" data-action="delete-photo" data-id="${p.id}">🗑️</button>
                    </div>`;
            }).join('');
        }
    },

    /**
     * Tự động thêm các nút chức năng vào màn hình chính (VD: Cài đặt)
     */
    renderHomeExtras() {
        const homeMenu = document.querySelector('#home-view .home-menu');
        if (!homeMenu) return;

        // Kiểm tra nếu nút Cài đặt đã tồn tại thì không thêm nữa
        if (homeMenu.querySelector('[data-action="open-change-password"]')) return;

        const settingsButtonHTML = `
            <div class="home-menu-btn" data-action="open-change-password">
                <div class="btn-bg" style="background: linear-gradient(45deg, #6b7280, #1f2937);"></div>
                <div class="btn-content">
                    <div class="home-menu-icon">⚙️</div>
                    <div class="home-menu-label">Cài đặt</div>
                </div>
            </div>
        `;
        homeMenu.insertAdjacentHTML('beforeend', settingsButtonHTML);
    },

    /**
     * Hiển thị giao diện đổi mật khẩu bằng cách tái sử dụng form đăng nhập.
     */
    showChangePasswordView() {
        // Chuyển sang view đăng nhập/đăng ký
        ViewController.switchView('auth-view');

        // Ẩn nội dung giới thiệu đăng nhập
        const loginIntro = document.getElementById('login-intro-text');
        if (loginIntro) loginIntro.style.display = 'none';

        // Ẩn nút quay lại màn hình chào mừng để tránh nhầm lẫn
        const authBackLink = document.getElementById('auth-back-link');
        if (authBackLink) authBackLink.style.display = 'none';

        // Lấy các element của form
        const title = document.getElementById('auth-title');
        const nameInput = document.getElementById('auth-name');
        const passInput = document.getElementById('auth-pass');
        const confirmInput = document.getElementById('auth-pass-confirm');
        const submitBtn = document.getElementById('auth-submit-btn');
        const switchLink = document.getElementById('auth-switch-link');

        // Đảm bảo ô input thứ 3 (auth-pass-2) luôn tồn tại
        let pass2Input = document.getElementById('auth-pass-2');
        if (!pass2Input && confirmInput) {
            pass2Input = document.createElement('input');
            pass2Input.type = 'password';
            pass2Input.id = 'auth-pass-2';
            // Chèn vào sau ô nhập lại mật khẩu
            confirmInput.parentNode.insertBefore(pass2Input, confirmInput.nextSibling);
        }

        // Cấu hình lại form cho chức năng đổi mật khẩu
        title.textContent = 'Giới Thiệu';
        nameInput.style.display = 'none'; // Ẩn ô nhập tên

        // Thêm nội dung giới thiệu
        let introText = document.getElementById('app-intro-text');
        if (!introText) {
            introText = document.createElement('div');
            introText.id = 'app-intro-text';
            introText.style.cssText = 'color: #cbd5e1; font-size: 0.9rem; text-align: center; margin-bottom: 15px; line-height: 1.5;';
            introText.innerHTML = `
                <p style="margin-bottom: 10px;">EXPOP được viết tắt từ '' experience game one person '', là một ứng dụng cá nhân giải trí miễn phí do Nguyễn Hoài Nam (Hiro Nguyen) cùng AI Gemini phát triển, hi vọng bạn sẽ thích sau khi khám phá ứng dụng này. Xin cảm ơn!</p>
                <p style="font-weight: bold; color: #38bdf8;">TK donate: Nguyễn Hoài Nam MB Bank (Ngân hàng quân đội)<br>STK: 0393369901</p>
                <div style="margin: 20px 0 10px 0; border-top: 1px solid #334155; padding-top: 15px; font-weight: bold; color: #fff; font-size: 1.1rem;">Đổi Mật Khẩu</div>
            `;
            title.parentNode.insertBefore(introText, nameInput);
        }
        introText.style.display = 'block';

        passInput.value = '';
        passInput.placeholder = 'Nhập mật khẩu cấp 2';
        passInput.style.display = 'block';

        confirmInput.value = '';
        confirmInput.placeholder = 'Mật khẩu mới';
        confirmInput.style.display = 'block';

        pass2Input.value = '';
        pass2Input.placeholder = 'Nhập lại mật khẩu mới';
        pass2Input.style.display = 'block';

        submitBtn.textContent = 'Lưu Thay Đổi';
        submitBtn.dataset.action = 'change-password';

        // Biến link chuyển đổi thành nút "Quay lại"
        switchLink.textContent = '‹ Quay lại Màn hình chính';
        switchLink.dataset.action = 'back-to-home';
    },

    /**
     * Hiển thị màn hình chào mừng (Intro + 2 Nút chọn)
     */
    showWelcomeScreen() {
        // Ẩn các input và nút submit cũ
        document.getElementById('auth-name').style.display = 'none';
        document.getElementById('auth-pass').style.display = 'none';
        document.getElementById('auth-pass-confirm').style.display = 'none';
        const pass2 = document.getElementById('auth-pass-2');
        if (pass2) pass2.style.display = 'none';
        
        document.getElementById('auth-submit-btn').style.display = 'none';
        document.getElementById('auth-switch-link').style.display = 'none';
        document.getElementById('auth-title').textContent = 'Chào Mừng';

        // Đảm bảo intro text hiện
        const loginIntro = document.getElementById('login-intro-text');
        if (loginIntro) loginIntro.style.display = 'block';

        // Tạo hoặc hiển thị container chứa 2 nút mới
        let welcomeOpts = document.getElementById('welcome-options');
        if (!welcomeOpts) {
            welcomeOpts = document.createElement('div');
            welcomeOpts.id = 'welcome-options';
            welcomeOpts.style.cssText = 'display: flex; flex-direction: column; gap: 15px; margin-top: 10px;';
            welcomeOpts.innerHTML = `
                <button class="btn-main" data-action="play-guest" style="background: linear-gradient(135deg, #22c55e 0%, #10b981 100%);">🎮 Chơi Ngay</button>
                <button class="btn-main" data-action="show-login" style="background: linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%);">👤 Đăng Nhập</button>
            `;
            // Chèn vào sau intro text
            const form = document.querySelector('.auth-form');
            if (loginIntro && loginIntro.parentNode === form) {
                form.insertBefore(welcomeOpts, loginIntro.nextSibling);
            } else {
                form.appendChild(welcomeOpts);
            }
        }
        welcomeOpts.style.display = 'flex';
    },

    /**
     * Hiển thị form đăng nhập (khi bấm nút Đăng Nhập)
     */
    showLoginForm() {
        const welcomeOpts = document.getElementById('welcome-options');
        if (welcomeOpts) welcomeOpts.style.display = 'none';

        // Gọi lại resetAuthViewToDefault nhưng bỏ qua bước showWelcomeScreen để hiện form
        this.resetAuthViewToDefault(true); 
    },

    /**
     * Đưa form đăng nhập/đăng ký về trạng thái mặc định (chế độ Đăng nhập).
     */
    resetAuthViewToDefault(showFormDirectly = false) {
        const submitBtn = document.getElementById('auth-submit-btn');
        const nameInput = document.getElementById('auth-name');
        const backLink = document.getElementById('auth-back-link');
        
        // Fix: Luôn hiển thị lại ô nhập tên (vì có thể bị ẩn bởi chức năng Đổi mật khẩu)
        if (nameInput) nameInput.style.display = showFormDirectly ? 'block' : 'none';

        // Các phần tử khác
        const passInput = document.getElementById('auth-pass');
        const switchLink = document.getElementById('auth-switch-link');
        
        if (showFormDirectly) {
            if (passInput) passInput.style.display = 'block';
            if (submitBtn) submitBtn.style.display = 'block';
            if (switchLink) switchLink.style.display = 'block';
            if (backLink) backLink.style.display = 'block';
            document.getElementById('auth-title').textContent = 'Đăng Nhập';
        } else {
            if (backLink) backLink.style.display = 'none';
        }

        // Ẩn nội dung giới thiệu nếu có
        const introText = document.getElementById('app-intro-text');
        if (introText) introText.style.display = 'none';

        // Hiện lại nội dung giới thiệu đăng nhập
        const loginIntro = document.getElementById('login-intro-text');
        if (loginIntro) loginIntro.style.display = 'block';

        // Nếu form không ở chế độ đăng nhập, chuyển nó về.
        if (submitBtn.dataset.action !== 'login') {
            // Đặt tạm action để `switchAuthMode` chắc chắn chuyển về login
            submitBtn.dataset.action = 'register'; 
            this.switchAuthMode();
        }
        this.clearAuthForm();

        // Nếu không yêu cầu hiện form trực tiếp, hiển thị màn hình chào mừng (2 nút)
        if (!showFormDirectly) {
            this.showWelcomeScreen();
        }
    },

    /**
     * Hiển thị popup xác nhận tùy chỉnh (thay thế confirm mặc định)
     */
    showConfirmModal(message, onConfirm) {
        const existing = document.getElementById('confirm-modal');
        if (existing) existing.remove();

        const modalHTML = `
            <div id="confirm-modal" class="overlay">
                <div class="auth-form" style="background: #1e293b; padding: 25px; border-radius: 20px; border: 1px solid #334155; text-align: center; width: 85%; max-width: 320px;">
                    <h3 style="color: #fff; margin-bottom: 15px; font-size: 1.4rem;">Xác nhận</h3>
                    <p style="color: #cbd5e1; margin-bottom: 25px; font-size: 1rem; line-height: 1.5;">${message}</p>
                    <div style="display: flex; gap: 15px; justify-content: center;">
                         <button class="btn-main" id="confirm-yes" style="flex: 1;">Đồng ý</button>
                         <button class="btn-icon" id="confirm-no" style="flex: 1; background: transparent; border: 1px solid #475569;">Hủy</button>
                    </div>
                </div>
            </div>
        `;
        
        const appContainer = document.querySelector('.app-container');
        if (appContainer) appContainer.insertAdjacentHTML('beforeend', modalHTML);
        else document.body.insertAdjacentHTML('beforeend', modalHTML);

        document.getElementById('confirm-yes').onclick = () => {
            document.getElementById('confirm-modal').remove();
            if (onConfirm) onConfirm();
        };

        document.getElementById('confirm-no').onclick = () => {
            document.getElementById('confirm-modal').remove();
        };
    },

    /**
     * Hiển thị giao diện thêm nhạc (thay thế prompt)
     */
    showAddMusicModal(onConfirm) {
        const existing = document.getElementById('add-music-modal');
        if (existing) existing.remove();

        const modalHTML = `
            <div id="add-music-modal" class="overlay">
                <div class="auth-form" style="width: 85%; max-width: 350px;">
                    <h3 style="color: #fff; margin-bottom: 20px; text-align: center;">Thêm Bài Hát</h3>
                    <input type="text" id="music-url-input" placeholder="Dán link YouTube vào đây..." style="margin-bottom: 15px;">
                    
                    <div style="margin-bottom: 20px;">
                        <label style="color: #cbd5e1; font-size: 0.9rem; display: block; margin-bottom: 8px;">Thời gian bộ đếm (Tùy chọn):</label>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="number" id="music-min-input" placeholder="Phút" min="0" max="99" style="text-align: center; flex: 1;">
                            <span style="color: #fff; font-weight: bold; font-size: 1.2rem;">:</span>
                            <input type="number" id="music-sec-input" placeholder="Giây" min="0" max="99" style="text-align: center; flex: 1;">
                        </div>
                        <p style="color: #64748b; font-size: 0.75rem; margin-top: 5px;">Để trống nếu muốn dùng thời lượng gốc.</p>
                    </div>

                    <div style="display: flex; gap: 10px;">
                         <button class="btn-main" id="music-confirm-btn">Thêm Ngay</button>
                         <button class="btn-icon" id="music-cancel-btn" style="background: transparent; border: 1px solid #475569;">Hủy</button>
                    </div>
                    <p style="color: #64748b; font-size: 0.8rem; text-align: center; margin-top: 10px;">Hỗ trợ: YouTube Video, Short</p>
                </div>
            </div>
        `;
        
        const appContainer = document.querySelector('.app-container');
        if (appContainer) appContainer.insertAdjacentHTML('beforeend', modalHTML);

        document.getElementById('music-confirm-btn').onclick = () => {
            const url = document.getElementById('music-url-input').value;
            const min = parseInt(document.getElementById('music-min-input').value) || 0;
            const sec = parseInt(document.getElementById('music-sec-input').value) || 0;
            
            let duration = 0;
            if (min > 0 || sec > 0) {
                duration = min * 60 + sec;
            }

            if (url) {
                document.getElementById('add-music-modal').remove();
                if (onConfirm) onConfirm(url, duration);
            }
        };
        document.getElementById('music-cancel-btn').onclick = () => document.getElementById('add-music-modal').remove();
    },

    /**
     * Hiển thị giao diện thêm ảnh (File hoặc Link)
     */
    showAddPhotoModal(onFileSelect, onUrlConfirm) {
        const existing = document.getElementById('add-photo-modal');
        if (existing) existing.remove();

        const modalHTML = `
            <div id="add-photo-modal" class="overlay">
                <div class="auth-form" style="width: 85%; max-width: 350px;">
                    <h3 style="color: #fff; margin-bottom: 20px; text-align: center;">Đăng Ảnh</h3>
                    
                    <button class="btn-main" id="photo-file-btn" style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); margin-bottom: 15px;">📁 Tải ảnh từ thiết bị</button>
                    
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                        <div style="height: 1px; background: #334155; flex: 1;"></div>
                        <span style="color: #64748b; font-size: 0.9rem;">HOẶC</span>
                        <div style="height: 1px; background: #334155; flex: 1;"></div>
                    </div>

                    <input type="text" id="photo-url-input" placeholder="Dán link ảnh (URL)..." style="margin-bottom: 10px;">
                    
                    <div style="display: flex; gap: 10px;">
                         <button class="btn-main" id="photo-url-btn">Thêm từ Link</button>
                         <button class="btn-icon" id="photo-cancel-btn" style="background: transparent; border: 1px solid #475569;">Hủy</button>
                    </div>
                </div>
            </div>
        `;
        
        const appContainer = document.querySelector('.app-container');
        if (appContainer) appContainer.insertAdjacentHTML('beforeend', modalHTML);

        document.getElementById('photo-file-btn').onclick = () => {
            document.getElementById('add-photo-modal').remove();
            if (onFileSelect) onFileSelect();
        };

        document.getElementById('photo-url-btn').onclick = () => {
            const url = document.getElementById('photo-url-input').value;
            if (url) {
                document.getElementById('add-photo-modal').remove();
                if (onUrlConfirm) onUrlConfirm(url);
            }
        };

        document.getElementById('photo-cancel-btn').onclick = () => document.getElementById('add-photo-modal').remove();
    },

    /**
     * Hiển thị ảnh full size
     */
    showFullImage(src) {
        const modalHTML = `
            <div id="image-viewer-modal" class="overlay" onclick="this.remove()" style="z-index: 10000; cursor: zoom-out;">
                <img src="${src}" style="max-width: 95%; max-height: 95%; border-radius: 8px; box-shadow: 0 0 20px rgba(0,0,0,0.5); object-fit: contain; animation: modalPopIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
            </div>
        `;
        const appContainer = document.querySelector('.app-container');
        if (appContainer) appContainer.insertAdjacentHTML('beforeend', modalHTML);
        else document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
};
