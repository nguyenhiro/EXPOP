/**
 * main.js - Điểm khởi chạy ứng dụng, xử lý hành động người dùng và admin.
 */

// ==================== VIEW CONTROLLER ====================
const ViewController = {
    /**
     * Chuyển đổi giữa các view chính (Home, Collection, Games, v.v.)
     * @param {string} viewId ID của view cần hiển thị
     */
    switchView(viewId) {
        // Ẩn tất cả các view chính
        document.querySelectorAll('.main-view-container > .main-view').forEach(view => {
            view.classList.remove('active');
        });
        // Hiển thị view mục tiêu
        const targetView = document.getElementById(viewId);
        if (targetView) targetView.classList.add('active');
    }
};

// ==================== USER ACTIONS ====================
const UserActions = {
    /**
     * Handle login
     */
    login() {
        const nameInput = document.getElementById('auth-name');
        const passwordInput = document.getElementById('auth-pass');
        const name = nameInput.value.trim();
        const password = passwordInput.value;

        if (!name) {
            UIController.showToast('Vui lòng nhập tên tài khoản!', 'error');
            return;
        }

        // Check if user exists
        if (AppState.state.users[name]) {
            // User exists, check password
            // Cho phép đăng nhập bằng Mật khẩu cấp 1 HOẶC Mật khẩu cấp 2
            if (AppState.state.users[name].password === password || AppState.state.users[name].secondPassword === password) {
                AppState.state.currentUser = name;
                AppState.saveState();
                App.showMainView();
                UIController.clearAuthForm();
            } else {
                UIController.showToast('Mật khẩu không đúng!', 'error');
            }
        } else {
            UIController.showToast('Tài khoản không tồn tại. Vui lòng đăng ký!', 'error');
        }
    },

    /**
     * Handle registration
     */
    register() {
        const nameInput = document.getElementById('auth-name');
        const passInput = document.getElementById('auth-pass');
        const confirmInput = document.getElementById('auth-pass-confirm');
        const pass2Input = document.getElementById('auth-pass-2');
        
        const name = nameInput.value.trim();
        const pass = passInput.value;
        const confirm = confirmInput.value;
        // Lấy giá trị mật khẩu cấp 2, nếu input chưa render thì để trống
        const pass2 = pass2Input ? pass2Input.value : '';

        if (!name || !pass || !pass2) {
            UIController.showToast('Vui lòng nhập đầy đủ thông tin!', 'error');
            return;
        }

        if (name.length < 2 || name.length > 20) {
            UIController.showToast('Tên tài khoản phải từ 2-20 ký tự!', 'error');
            return;
        }

        if (pass !== confirm) {
            UIController.showToast('Mật khẩu nhập lại không khớp!', 'error');
            return;
        }

        if (AppState.state.users[name]) {
            UIController.showToast('Tên tài khoản đã tồn tại!', 'error');
            return;
        }

        // Create user
        AppState.state.users[name] = { password: pass, secondPassword: pass2 };
        AppState.state.currentUser = name;
        AppState.saveState();
        
        App.showMainView();
        UIController.clearAuthForm();
    },

    /**
     * Handle password change
     */
    changePassword() {
        const currentUser = AppState.state.currentUser;
        if (!currentUser) return;

        const secondPassInput = document.getElementById('auth-pass');
        const newPassInput = document.getElementById('auth-pass-confirm');
        const confirmPassInput = document.getElementById('auth-pass-2');

        if (!secondPassInput || !newPassInput || !confirmPassInput) {
            console.error("Change password form elements not found!");
            return;
        }

        const secondPass = secondPassInput.value;
        const newPass = newPassInput.value;
        const confirmPass = confirmPassInput.value;

        if (!secondPass || !newPass || !confirmPass) {
            UIController.showToast('Vui lòng nhập đầy đủ thông tin!', 'error');
            return;
        }

        if (newPass.length < 4) {
            UIController.showToast('Mật khẩu mới phải có ít nhất 4 ký tự!', 'error');
            return;
        }

        if (newPass !== confirmPass) {
            UIController.showToast('Mật khẩu mới không khớp!', 'error');
            return;
        }

        const userData = AppState.state.users[currentUser];
        if (userData.secondPassword !== secondPass) {
            UIController.showToast('Mật khẩu cấp 2 không đúng!', 'error');
            return;
        }

        // Update password
        userData.password = newPass;
        AppState.saveState();

        UIController.showToast('Đổi mật khẩu thành công!', 'success');
        ViewController.switchView('home-view'); // Quay về màn hình chính
    },

    /**
     * Chơi ngay không cần tài khoản
     */
    playAsGuest() {
        AppState.state.currentUser = null; // Đảm bảo không có user
        // Không lưu state để lần sau vào lại vẫn hỏi
        ViewController.switchView('home-view');
        UIController.updateUserStatus(null);
        UIController.renderHomeExtras();
    },

    /**
     * Handle logout
     */
    logout() {
        UIController.showConfirmModal('Bạn có chắc muốn đăng xuất?', () => {
            AppState.state.currentUser = null;
            AppState.saveState();
            App.showMainView();
            UIController.showToast('Đã đăng xuất thành công!', 'success');
        });
    },

    /**
     * Thêm bài hát mới từ link YouTube
     */
    addMusic() {
        UIController.showAddMusicModal((url, customDuration) => {
            // Regex mạnh mẽ hơn để bắt ID từ mọi dạng link (Shorts, Mobile, Embed, Standard)
            const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v=))([^#\&\?]*).*/;
            const match = url.match(regExp);

            if (match && match[1]) {
                const videoId = match[1].substr(0, 11); // Lấy đúng 11 ký tự ID
                
                // Kiểm tra xem đã có danh sách nhạc chưa, nếu chưa thì tạo mới
                if (!AppState.state.musicVids) {
                    AppState.state.musicVids = [];
                }

                // Thêm vào đầu danh sách
                const videoData = { id: videoId };
                if (customDuration > 0) {
                    videoData.customDuration = customDuration;
                }
                AppState.state.musicVids.unshift(videoData);
                AppState.saveState();
                
                // Render lại giao diện và thông báo
                UIController.renderMusicFeed();
                UIController.showToast('Đã thêm bài hát thành công!', 'success');
            } else {
                UIController.showToast('Link YouTube không hợp lệ!', 'error');
            }
        });
    },

    /**
     * Xóa video khỏi danh sách
     */
    deleteMusic(id) {
        UIController.showConfirmModal('Bạn có chắc muốn xóa video này?', () => {
            if (AppState.state.musicVids) {
                AppState.state.musicVids = AppState.state.musicVids.filter(v => v.id !== id);
                AppState.saveState();
                UIController.renderMusicFeed();
                UIController.showToast('Đã xóa video!', 'success');
            }
        });
    },

    /**
     * Xử lý upload ảnh
     */
    async handlePhotoUpload(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        UIController.showToast(`Đang xử lý ${files.length} ảnh...`, 'info');

        for (const file of Array.from(files)) {
            try {
                await DB.addPhoto(file);
                // Giới hạn số lượng ảnh, xóa ảnh cũ nhất nếu vượt quá
                await DB.deleteOldestPhoto(6);
            } catch (error) {
                console.error("Lỗi khi thêm ảnh vào DB:", error);
                UIController.showToast('Tải ảnh lên thất bại!', 'error');
                return;
            }
        }

        UIController.showToast(`Đã tải lên ${files.length} ảnh!`, 'success');
        // Render lại gallery nếu đang ở view đó
        if (document.getElementById('gallery-view').classList.contains('active')) {
            UIController.renderGallery();
        }
    },

    /**
     * Thêm ảnh từ URL
     */
    async addPhotoFromUrl(url) {
        UIController.showToast('Đang tải ảnh từ link...', 'info');
        try {
            // Tải ảnh từ URL về dưới dạng Blob
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok.');
            const blob = await response.blob();

            // Thêm Blob vào DB
            await DB.addPhoto(blob);
            await DB.deleteOldestPhoto(6);

            UIController.showToast('Đã thêm ảnh từ liên kết!', 'success');
            if (document.getElementById('gallery-view').classList.contains('active')) {
                UIController.renderGallery();
            }
        } catch (error) {
            console.error("Lỗi khi tải ảnh từ URL:", error);
            UIController.showToast('Link ảnh không hợp lệ hoặc không thể tải!', 'error');
        }
    },

    /**
     * Mở modal chọn cách đăng ảnh
     */
    openAddPhoto() {
        UIController.showAddPhotoModal(
            () => document.getElementById('photo-upload-input').click(), // Callback chọn file
            (url) => this.addPhotoFromUrl(url) // Callback nhập link
        );
    },

    /**
     * Xóa ảnh khỏi thư viện
     */
    async deletePhoto(id) {
        const photoId = Number(id); // ID trong IndexedDB là số
        UIController.showConfirmModal('Bạn có chắc muốn xóa ảnh này?', async () => {
            try {
                await DB.deletePhoto(photoId);
                UIController.showToast('Đã xóa ảnh!', 'success');
                UIController.renderGallery();
            } catch (e) {
                console.error(e);
                UIController.showToast('Lỗi khi xóa ảnh', 'error');
            }
        });
    }
};

// ==================== VIDEO CONTROLLER ====================
const VideoController = {
    // Không dùng biến toàn cục để tránh xung đột giữa các video
    isShuffle: false,
    isLoop: false,

    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        
        // Nếu bật Shuffle thì tắt Loop
        if (this.isShuffle) {
            this.isLoop = false;
            document.getElementById('btn-loop').classList.remove('active');
        }
        document.getElementById('btn-shuffle').classList.toggle('active', this.isShuffle);
        UIController.showToast(this.isShuffle ? 'Đã bật phát ngẫu nhiên' : 'Đã tắt phát ngẫu nhiên', 'info');
    },

    toggleLoop() {
        this.isLoop = !this.isLoop;
        // Nếu bật Loop thì tắt Shuffle
        if (this.isLoop) {
            this.isShuffle = false;
            document.getElementById('btn-shuffle').classList.remove('active');
        }
        document.getElementById('btn-loop').classList.toggle('active', this.isLoop);
        UIController.showToast(this.isLoop ? 'Đã bật vòng lặp danh sách' : 'Đã tắt vòng lặp', 'info');
    },

    toggleSkip(target) {
        const unit = target.closest('.v-unit');
        if (unit) {
            unit.classList.toggle('skipped');
            const isSkipped = unit.classList.contains('skipped');
            UIController.showToast(isSkipped ? 'Đã bỏ qua video này' : 'Đã bật lại video này', 'info');
            
            // Nếu đang phát video này mà bấm bỏ qua -> Chuyển bài ngay
            if (isSkipped && unit.classList.contains('playing')) {
                this.playNext(unit);
            }
        }
    },

    // Được gọi khi video bắt đầu phát (từ media.js hoặc YouTube event)
    onPlay(unit) {
        if (!unit) return;
        unit.classList.add('playing');
        
        // Fallback: Nếu chưa có thời lượng, gán mặc định 5 phút để đồng hồ chạy ngay
        if (!unit.dataset.duration) {
            if (unit.dataset.customDuration) {
                unit.dataset.duration = unit.dataset.customDuration;
            } else {
                unit.dataset.duration = 300; 
            }
        }
        
        this.updateTimerUI(unit); // Cập nhật giao diện ngay lập tức, không chờ 1s
        this.startTimer(unit);
    },

    onPause(unit) {
        if (!unit) return;
        this.stopTimer(unit);
    },

    // Cập nhật thông tin chuẩn từ YouTube (nếu nhận được)
    updateInfo(unit, info) {
        if (!unit) return;
        // Chỉ cập nhật duration từ YouTube nếu KHÔNG có custom duration
        if (info.duration && !unit.dataset.customDuration) {
            unit.dataset.duration = info.duration;
        }
        if (typeof info.currentTime !== 'undefined') {
            unit.dataset.currentTime = info.currentTime;
            this.updateTimerUI(unit);
            this.checkVideoEnd(unit);
        }
    },

    startTimer(unit) {
        this.stopTimer(unit); // Reset timer cũ của video này
        unit.videoTimerId = setInterval(() => {
            // Nếu video không còn là video đang phát (do lướt đi), dừng timer
            if (!unit.classList.contains('playing')) {
                this.stopTimer(unit);
                return;
            }

            // Tự tăng thời gian hiện tại lên 1s
            let current = parseFloat(unit.dataset.currentTime || 0);
            current += 1;
            unit.dataset.currentTime = current;

            this.updateTimerUI(unit);
            this.checkVideoEnd(unit);
        }, 1000);
    },

    stopTimer(unit) {
        if (unit && unit.videoTimerId) {
            clearInterval(unit.videoTimerId);
            unit.videoTimerId = null;
        }
    },

    updateTimerUI(unit) {
        const duration = parseFloat(unit.dataset.duration || 0);
        const current = parseFloat(unit.dataset.currentTime || 0);
        const timerEl = unit.querySelector('.video-timer');
        
        if (timerEl) {
            const left = Math.max(0, Math.ceil(duration - current));
            const m = Math.floor(left / 60).toString().padStart(2, '0');
            const s = (left % 60).toString().padStart(2, '0');
            timerEl.textContent = `-${m}:${s}`;
        }
    },

    checkVideoEnd(unit) {
        const duration = parseFloat(unit.dataset.duration || 0);
        const current = parseFloat(unit.dataset.currentTime || 0);
        if (duration > 0 && current >= duration - 1) {
            this.playNext(unit);
        }
    },

    playNext(unit) {
        this.stopTimer(unit);
        if (unit.dataset.hasEnded) return;
        unit.dataset.hasEnded = 'true';

        const container = document.getElementById('music-feed');
        const units = Array.from(container.querySelectorAll('.v-unit'));
        const currentIndex = units.indexOf(unit);
        let nextIndex = -1;
        let nextUnit = null;

        if (this.isShuffle) {
            // Chọn ngẫu nhiên một video khác video hiện tại và KHÔNG bị skip
            const availableUnits = units.filter(u => u !== unit && !u.classList.contains('skipped'));
            if (availableUnits.length > 0) {
                nextUnit = availableUnits[Math.floor(Math.random() * availableUnits.length)];
            }
        } else {
            // Chế độ tuần tự: Tìm video tiếp theo KHÔNG bị skip
            for (let i = currentIndex + 1; i < units.length; i++) {
                if (!units[i].classList.contains('skipped')) {
                    nextUnit = units[i];
                    break;
                }
            }
            
            // Nếu hết danh sách và bật Loop -> Tìm video đầu tiên KHÔNG bị skip
            if (!nextUnit && this.isLoop) {
                for (let i = 0; i < units.length; i++) {
                    if (!units[i].classList.contains('skipped')) {
                        nextUnit = units[i];
                        break;
                    }
                }
            }
        }

        if (nextUnit) {
            nextUnit.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
};

// ==================== GAME LAUNCHER ====================
const GameLauncher = {
    play(url, title) {
        const player = document.getElementById('game-player-container');
        const iframe = document.getElementById('game-iframe');
        const playerTitle = document.getElementById('game-player-title');
        const appContainer = document.querySelector('.app-container');

        if (player && iframe && playerTitle && appContainer) {
            playerTitle.textContent = title || 'Game';
            iframe.src = url;
            document.getElementById('game-menu-container').classList.remove('active');
            player.classList.add('active');
        }
    },

    backToMenu() {
        const player = document.getElementById('game-player-container');
        const iframe = document.getElementById('game-iframe');
        const appContainer = document.querySelector('.app-container');

        if (player && iframe && appContainer) {
            iframe.src = 'about:blank'; // Dừng game và giải phóng tài nguyên
            player.classList.remove('active');
            document.getElementById('game-menu-container').classList.add('active');
        }
    }
};

// ==================== INITIALIZATION ====================
const App = {
    init() {
        // Initialize state
        if (typeof DB !== 'undefined') {
            DB.init(); // Khởi tạo IndexedDB
        } else {
            console.warn("DB module not found. Please ensure db.js is included in index.html");
        }
        AppState.init();

        // Initialize Audio
        if (typeof AudioPlayer !== 'undefined') {
            AudioPlayer.init();
        }

        // Show the correct main view (login or home)
        this.showMainView();

        // Hiển thị intro splash screen
        UIController.showSplashScreen();

        // Setup event listeners
        this.setupEventListeners();

        console.log('✅ HavenPlay initialized');
    },

    showMainView() {
        const user = AppState.state.currentUser;
        if (user) {
            ViewController.switchView('home-view');
            UIController.updateUserStatus(user);
            UIController.renderHomeExtras(); // Thêm các nút chức năng như Cài đặt
        } else {
            ViewController.switchView('auth-view');
            UIController.updateUserStatus(null);
            UIController.resetAuthViewToDefault(); // Đảm bảo form ở trạng thái đăng nhập mặc định
        }
    },

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;

            // Play sound on interaction
            if (typeof AudioPlayer !== 'undefined') AudioPlayer.play('click');

            switch (action) {
                // Auth
                case 'login': UserActions.login(); break;
                case 'play-guest': UserActions.playAsGuest(); break;
                case 'show-login': UIController.showLoginForm(); break;
                case 'back-to-welcome': UIController.resetAuthViewToDefault(); break;
                case 'register': UserActions.register(); break;
                case 'logout': UserActions.logout(); break;
                case 'switch-auth-mode': UIController.switchAuthMode(); break;

                // Settings
                case 'open-change-password': UIController.showChangePasswordView(); break;
                case 'change-password': UserActions.changePassword(); break;

                // Navigation
                case 'open-music':
                    ViewController.switchView('music-view');
                    UIController.renderMusicFeed();
                    break;
                case 'add-music': UserActions.addMusic(); break;
                case 'delete-music': UserActions.deleteMusic(target.dataset.id); break;
                case 'open-games': 
                    ViewController.switchView('games-view');
                    GameLauncher.backToMenu(); // Đảm bảo game cũ đã tắt và menu game được hiển thị
                    break;
                case 'back-to-home':
                    ViewController.switchView('home-view');
                    VideoPlayer.pauseAll();
                    UIController.resetAuthViewToDefault(); // Đặt lại form auth khi quay về home
                    break;
                
                // Gallery
                case 'open-gallery':
                    ViewController.switchView('gallery-view');
                    UIController.renderGallery();
                    break;
                case 'trigger-upload':
                    UserActions.openAddPhoto();
                    break;
                case 'delete-photo': UserActions.deletePhoto(target.dataset.id); break;
                case 'view-photo': UIController.showFullImage(target.dataset.src); break;

                // Game Launcher
                case 'play-game': {
                    const url = target.dataset.gameUrl;
                    const title = target.dataset.gameTitle;
                    if (url && !target.classList.contains('disabled')) {
                        GameLauncher.play(url, title);
                    }
                    break;
                }
                case 'back-to-game-menu': GameLauncher.backToMenu(); break;

                // Music Player
                case 'toggle-mute': VideoPlayer.toggleGlobalMute(); break;
                case 'toggle-shuffle': VideoController.toggleShuffle(); break;
                case 'toggle-loop': VideoController.toggleLoop(); break;
                case 'toggle-skip': VideoController.toggleSkip(target); break;
            }
        });

        // Enter key for auth
        document.getElementById('auth-view').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const currentAction = document.getElementById('auth-submit-btn').dataset.action;
                if (currentAction === 'login') {
                    UserActions.login();
                } else {
                    UserActions.register();
                }
            }
        });

        // Photo Upload Listener
        const photoInput = document.getElementById('photo-upload-input');
        if (photoInput) {
            photoInput.addEventListener('change', UserActions.handlePhotoUpload);
        }

        // Listen for game exit message from iframe
        window.addEventListener('message', (e) => {
            if (e.data === 'exit-game') {
                GameLauncher.backToMenu();
            }

            // Listen for YouTube Player events (e.g., video ended)
            if (e.origin === 'https://www.youtube.com') {
                try {
                    const data = JSON.parse(e.data);
                    
                    // Fix: Tìm chính xác video unit chứa iframe đã gửi tin nhắn này
                    let targetUnit = null;
                    const units = document.querySelectorAll('.v-unit');
                    for (const unit of units) {
                        const iframe = unit.querySelector('iframe');
                        if (iframe && iframe.contentWindow === e.source) {
                            targetUnit = unit;
                            break;
                        }
                    }

                    // Fallback: Nếu không tìm thấy qua source (do bảo mật), lấy video đang active
                    if (!targetUnit) {
                        const playingUnit = document.querySelector('.v-unit.playing');
                        if (playingUnit) targetUnit = playingUnit;
                    }

                    if (!targetUnit) return;

                    // 1. Cập nhật thông tin thời gian (Hỗ trợ cả initialDelivery)
                    if ((data.event === 'infoDelivery' || data.event === 'initialDelivery') && data.info) {
                        VideoController.updateInfo(targetUnit, data.info);
                        if (typeof data.info.playerState !== 'undefined') {
                            handlePlayerState(targetUnit, data.info.playerState);
                        }
                    }

                    // 2. Xử lý trạng thái phát (State Change)
                    if (data.event === 'onStateChange') {
                        handlePlayerState(targetUnit, data.info);
                    }

                    // --- HELPER FUNCTIONS (Định nghĩa trong scope này để dùng chung biến window) ---
                    function handlePlayerState(unit, state) {
                        if (state === 1) { // Playing
                            VideoController.onPlay(unit);
                        } else if (state === 0) { // Ended
                            VideoController.playNext(unit);
                        } else { // Paused/Buffering
                            VideoController.onPause(unit);
                        }
                    }
                } catch (error) {
                    // Not a JSON message, ignore.
                }
            }
        });
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
