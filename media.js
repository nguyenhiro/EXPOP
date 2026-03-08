/**
 * media.js - Quản lý Audio và Video Player.
 */

// ==================== AUDIO PLAYER ====================
const AudioPlayer = {
    sounds: {},

    init() {
        this.load('click', 'https://assets.mixkit.co/sfx/preview/mixkit-modern-technology-select-3124.mp3');
    },

    load(name, src) {
        const audio = new Audio(src);
        audio.preload = 'auto';
        audio.volume = 0.3;
        this.sounds[name] = audio;
    },

    play(name) {
        if (this.sounds[name]) {
            this.sounds[name].currentTime = 0;
            this.sounds[name].play().catch(e => { /* Ignore play error */ });
        }
    }
};

// ==================== VIDEO RENDERER ====================
const VideoRenderer = {
    /**
     * Render một video nhạc cho music feed
     */
    renderMusicUnit(v) {
        const embedSrc = `https://www.youtube.com/embed/${v.id}?enablejsapi=1&controls=0&rel=0&modestbranding=1`;
        const thumbSrc = `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`;
        
        // Xử lý custom duration
        const customDurationAttr = v.customDuration ? `data-custom-duration="${v.customDuration}"` : '';
        const durationAttr = v.customDuration ? `data-duration="${v.customDuration}"` : '';

        // Hiệu ứng sóng nhạc
        const bars = Array.from({length: 12}).map(() => {
            const h = Math.floor(Math.random() * 60) + 20;
            const d = (Math.random() * 0.4 + 0.4).toFixed(2);
            return `<div class="viz-bar" style="--h:${h}px; --d:${d}s"></div>`;
        }).join('');
        const visualizerHTML = `<div class="music-visualizer">${bars}</div>`;

        return `
            <div class="v-unit" data-video-id="${v.id}" ${customDurationAttr} ${durationAttr}>
                <div class="v-wrapper">
                    <iframe 
                        data-src="${embedSrc}" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen
                        onload="this.closest('.v-unit').classList.add('is-loaded')">
                    </iframe>
                    <div class="v-unit-thumb" style="background-image: url('${thumbSrc}')">
                        <div class="v-unit-spinner"></div>
                    </div>
                    ${visualizerHTML}
                    <div class="video-timer">--:--</div>
                    <button class="btn-toggle-skip" data-action="toggle-skip" title="Bỏ qua video này">⏭️</button>
                    <button class="btn-delete-video" data-action="delete-music" data-id="${v.id}">🗑️</button>
                    <a href="https://www.youtube.com/watch?v=${v.id}" target="_blank" class="btn-open-yt" title="Xem trên YouTube">↗️</a>
                </div>
            </div>
        `;
    }
};

// ==================== VIDEO PLAYER ====================
const VideoPlayer = {
    observer: null,

    /**
     * Khởi tạo IntersectionObserver để lazy-load và auto-play/pause.
     */
    initObservers() {
        if (this.observer) this.observer.disconnect();

        const musicFeedElement = document.getElementById('music-feed');
        if (!musicFeedElement) return; // An toàn: không làm gì nếu không tìm thấy container

        const options = {
            root: musicFeedElement, // Sửa lỗi: Phải quan sát bên trong khung cuộn của danh sách nhạc
            rootMargin: '0px',
            threshold: 0.1 // Giảm xuống 0.1 để bắt nhạy hơn, đảm bảo video đầu tiên luôn chạy
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const unit = entry.target;
                const iframe = entry.target.querySelector('iframe');
                if (!iframe) return;
                
                if (entry.isIntersecting) {
                    // Video vào khung nhìn -> Play
                    // Nếu video đang bị bỏ qua (skipped) thì không tự động phát
                    if (unit.classList.contains('skipped')) {
                        this.postMessageToIframe(iframe, 'pause');
                        return;
                    }

                    if ((!iframe.src || iframe.src === 'about:blank') && iframe.dataset.src) {
                        // Lazy load: Gán src từ data-src
                        let src = iframe.dataset.src;
                        if (AppState.isMuted) src += "&mute=1";
                        src += "&autoplay=1";
                        iframe.src = src;
                    } else {
                        // Đã load rồi thì gửi lệnh play
                        // Phát lại từ đầu khi quay lại video cũ
                        this.postMessageToIframe(iframe, 'seekTo', [0, true]);
                        this.postMessageToIframe(iframe, 'play');
                        this.postMessageToIframe(iframe, AppState.isMuted ? 'mute' : 'unMute');
                    }
                    
                    // Kích hoạt bộ đếm giờ ngay lập tức (Chủ động)
                    if (typeof VideoController !== 'undefined') VideoController.onPlay(unit);
                } else {
                    // Video không còn trong khung nhìn -> Dừng phát và xóa bộ đếm thời gian
                    this.postMessageToIframe(iframe, 'pause');
                    
                    // Dừng bộ đếm
                    if (typeof VideoController !== 'undefined') VideoController.onPause(unit);
                    unit.classList.remove('playing'); // Đảm bảo class được gỡ bỏ

                    // Chỉ reset trạng thái kết thúc, giữ lại duration để dùng tiếp
                    delete unit.dataset.hasEnded;
                    delete unit.dataset.currentTime; // Reset thời gian đã chạy để bộ đếm tính lại từ đầu khi quay lại
                }
            });
        }, options);

        // Quan sát tất cả các thẻ video-unit
        document.querySelectorAll('.v-unit').forEach(el => this.observer.observe(el));
    },

    postMessageToIframe(iframe, command, args = []) {
        if (!iframe.contentWindow) return;
        let func = '';
        if (command === 'play') func = 'playVideo';
        else if (command === 'pause') func = 'pauseVideo';
        else if (command === 'mute') func = 'mute';
        else if (command === 'unMute') func = 'unMute';
        else if (command === 'seekTo') func = 'seekTo';

        if (func && iframe.src.includes('youtube.com')) {
            iframe.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: func,
                args: args
            }), '*');
        }
    },

    /**
     * Pause all videos
     */
    pauseAll() {
        document.querySelectorAll('iframe').forEach(iframe => {
            this.postMessageToIframe(iframe, 'pause');
        });
    },

    /**
     * Bật/tắt tiếng toàn cục
     */
    toggleGlobalMute() {
        AppState.isMuted = !AppState.isMuted;
        document.querySelectorAll('.vol-btn').forEach(btn => {
            btn.textContent = AppState.isMuted ? '🔇' : '🔊';
        });

        const cmd = AppState.isMuted ? 'mute' : 'unMute';
        document.querySelectorAll('.v-unit.playing iframe').forEach(iframe => {
            this.postMessageToIframe(iframe, cmd);
        });
    }
};