/**
 * db.js - Quản lý cơ sở dữ liệu IndexedDB cho ứng dụng.
 */

const DB_NAME = 'HavenPlayDB';
const DB_VERSION = 1;
const PHOTO_STORE_NAME = 'photos';

const DB = {
    db: null,

    async init() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                return resolve(this.db);
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("Lỗi khi mở IndexedDB:", event.target.error);
                reject("Lỗi IndexedDB");
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log("✅ IndexedDB đã sẵn sàng.");
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(PHOTO_STORE_NAME)) {
                    // Tạo kho lưu trữ ảnh với 'id' là khóa chính và tự động tăng
                    db.createObjectStore(PHOTO_STORE_NAME, { keyPath: 'id', autoIncrement: true });
                    console.log(`Kho '${PHOTO_STORE_NAME}' đã được tạo.`);
                }
            };
        });
    },

    async addPhoto(file) {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([PHOTO_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(PHOTO_STORE_NAME);
            const photo = {
                file: file, // Lưu file gốc (Blob)
                date: new Date()
            };
            const request = store.add(photo);

            request.onsuccess = () => resolve(request.result); // Trả về ID của ảnh mới
            request.onerror = (event) => reject("Không thể thêm ảnh: " + event.target.error);
        });
    },

    async getAllPhotos() {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([PHOTO_STORE_NAME], 'readonly');
            const store = transaction.objectStore(PHOTO_STORE_NAME);
            // Lấy tất cả ảnh và sắp xếp theo thứ tự mới nhất trước
            const request = store.getAll();

            request.onsuccess = () => {
                // Sắp xếp kết quả theo ngày giảm dần
                const sortedPhotos = request.result.sort((a, b) => b.date - a.date);
                resolve(sortedPhotos);
            };
            request.onerror = (event) => reject("Không thể lấy ảnh: " + event.target.error);
        });
    },

    async deleteOldestPhoto(countToKeep = 6) {
        const photos = await this.getAllPhotos();
        if (photos.length > countToKeep) {
            const oldestPhoto = photos[photos.length - 1];
            const transaction = this.db.transaction([PHOTO_STORE_NAME], 'readwrite');
            transaction.objectStore(PHOTO_STORE_NAME).delete(oldestPhoto.id);
        }
    },

    async deletePhoto(id) {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([PHOTO_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(PHOTO_STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = (event) => reject("Không thể xóa ảnh: " + event.target.error);
        });
    }
};