// ============================================
// Library Management JavaScript
// ============================================

class LibraryApp {
    constructor() {
        this.currentTab = 'books';
        this.books = [];
        this.categories = [];
        this.statistics = {};
        this.apiUrl = 'library-api.php';
        this.currentEditingId = null;
        
        this.init();
    }
    
    async init() {
        console.log('📚 تهيئة تطبيق المكتبة...');
        
        // Bind methods
        this.bindEvents();
        
        // Load initial data
        await this.loadBooks();
        await this.loadCategories();
        await this.loadStatistics();
        
        console.log('✅ تم تحميل المكتبة بنجاح');
    }
    
    bindEvents() {
        // Tab switching
        document.querySelectorAll('.library-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Search and filters
        const searchInput = document.getElementById('bookSearch');
        const statusFilter = document.getElementById('statusFilter');
        const categoryFilter = document.getElementById('categoryFilter');
        
        if (searchInput) {
            searchInput.addEventListener('input', () => this.applyFilters());
        }
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.applyFilters());
        }
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.applyFilters());
        }
        
        // Add book button
        const addBookBtn = document.getElementById('addBookBtn');
        if (addBookBtn) {
            addBookBtn.addEventListener('click', () => this.openBookModal());
        }
        
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal-backdrop');
                if (modal) modal.classList.remove('active');
            });
        });
        
        // Modal backdrop click
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    backdrop.classList.remove('active');
                }
            });
        });
        
        // Add category button
        const addCategoryBtn = document.getElementById('addCategoryBtn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => this.openCategoryModal());
        }
        
        // Category form submit
        const categoryForm = document.getElementById('categoryForm');
        if (categoryForm) {
            categoryForm.addEventListener('submit', (e) => this.handleCategorySubmit(e));
        }
        
        // Book form submit
        const bookForm = document.getElementById('bookForm');
        if (bookForm) {
            bookForm.addEventListener('submit', (e) => this.handleBookSubmit(e));
        }
    }
    
    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.library-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Update content visibility
        document.querySelectorAll('.library-tab-content').forEach(content => {
            content.style.display = content.id === `${tabName}Tab` ? 'block' : 'none';
        });
    }
    
    async loadBooks() {
        try {
            const formData = new FormData();
            formData.append('action', 'get_books');
            
            const response = await fetch(this.apiUrl, { method: 'POST', body: formData });
            const result = await response.json();
            
            if (result.success) {
                this.books = result.data || [];
                this.renderBooks();
            } else {
                console.error('خطأ في تحميل الكتب:', result.message);
            }
        } catch (error) {
            console.error('خطأ في جلب الكتب:', error);
        }
    }
    
    async loadCategories() {
        try {
            const formData = new FormData();
            formData.append('action', 'get_categories');
            
            const response = await fetch(this.apiUrl, { method: 'POST', body: formData });
            const result = await response.json();
            
            if (result.success) {
                this.categories = result.data || [];
                this.updateCategorySelects();
                this.renderCategories();
            }
        } catch (error) {
            console.error('خطأ في جلب التصنيفات:', error);
        }
    }
    
    async loadStatistics() {
        try {
            const formData = new FormData();
            formData.append('action', 'get_statistics');
            
            const response = await fetch(this.apiUrl, { method: 'POST', body: formData });
            const result = await response.json();
            
            if (result.success) {
                this.statistics = result.data || {};
                this.renderStatistics();
            }
        } catch (error) {
            console.error('خطأ في جلب الإحصائيات:', error);
        }
    }
    
    renderStatistics() {
        const container = document.getElementById('statisticsGrid');
        if (!container) return;
        
        const stats = this.statistics;
        
        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-label">إجمالي الكتب</div>
                <div class="stat-value">${stats.total_books || 0}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">قيد القراءة</div>
                <div class="stat-value">${stats.by_status?.['قيد القراءة'] || 0}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">مكتملة</div>
                <div class="stat-value">${stats.by_status?.['منتهي'] || 0}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">المفضلات</div>
                <div class="stat-value">${stats.favorite_count || 0}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">إجمالي الصفحات</div>
                <div class="stat-value">${stats.total_pages || 0}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">الصفحات المقروءة</div>
                <div class="stat-value">${stats.pages_read || 0}</div>
            </div>
        `;
    }
    
    renderBooks() {
        const container = document.getElementById('booksGrid');
        if (!container) return;
        
        if (this.books.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1;">
                    <div class="empty-state">
                        <div class="empty-state-icon">📚</div>
                        <p class="empty-state-text">لا توجد كتب حتى الآن. ابدأ بإضافة كتاب!</p>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.books.map(book => this.createBookCard(book)).join('');
        
        // Bind book card events
        document.querySelectorAll('.book-card').forEach(card => {
            const bookId = card.dataset.bookId;
            
            // Edit button
            card.querySelector('.book-btn-edit')?.addEventListener('click', () => {
                this.openBookModal(bookId);
            });
            
            // Delete button
            card.querySelector('.book-btn-delete')?.addEventListener('click', () => {
                this.deleteBook(bookId);
            });
            
            // Favorite button
            card.querySelector('.book-favorite')?.addEventListener('click', () => {
                this.toggleFavorite(bookId);
            });
        });
    }
    
    createBookCard(book) {
        const progress = book.total_pages > 0 ? (book.current_page / book.total_pages) * 100 : 0;
        const categories = book.categories || [];
        
        return `
            <div class="book-card" data-book-id="${book.id}">
                <div class="book-card-header">
                    <h3 class="book-title">${this.escapeHtml(book.title)}</h3>
                    <p class="book-author">${this.escapeHtml(book.author)}</p>
                    <button class="book-favorite ${book.favorite ? 'active' : ''}" title="${book.favorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}">
                        ${book.favorite ? '⭐' : '☆'}
                    </button>
                </div>
                <div class="book-card-body">
                    <span class="book-status ${this.getStatusClass(book.status)}">${book.status}</span>
                    
                    ${categories.length > 0 ? `
                        <div class="book-categories">
                            ${categories.map(cat => `
                                <span class="book-category-tag" style="background-color: ${cat.color}">${this.escapeHtml(cat.name)}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <div class="book-info">
                        ${book.total_pages ? `<div class="book-info-item">
                            <span>الصفحات:</span>
                            <span>${book.current_page}/${book.total_pages}</span>
                        </div>` : ''}
                        
                        ${book.publish_year ? `<div class="book-info-item">
                            <span>السنة:</span>
                            <span>${book.publish_year}</span>
                        </div>` : ''}
                        
                        ${book.language ? `<div class="book-info-item">
                            <span>اللغة:</span>
                            <span>${book.language}</span>
                        </div>` : ''}
                    </div>
                    
                    ${book.total_pages ? `
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${progress}%"></div>
                        </div>
                    ` : ''}
                    
                    ${book.rating ? `
                        <div class="book-rating">
                            ${[1, 2, 3, 4, 5].map(i => `
                                <span class="star ${i <= book.rating ? 'filled' : ''}">★</span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="book-card-footer">
                    <button class="book-btn book-btn-edit">تعديل</button>
                    <button class="book-btn book-btn-delete">حذف</button>
                </div>
            </div>
        `;
    }
    
    getStatusClass(status) {
        const statusMap = {
            'لم أبدأ': 'not-started',
            'قيد القراءة': 'reading',
            'منتهي': 'completed',
            'متوقف': 'paused'
        };
        return statusMap[status] || 'not-started';
    }
    
    applyFilters() {
        const search = document.getElementById('bookSearch')?.value.toLowerCase() || '';
        const status = document.getElementById('statusFilter')?.value || '';
        const categoryId = document.getElementById('categoryFilter')?.value || '';
        
        let filtered = this.books;
        
        if (search) {
            filtered = filtered.filter(book =>
                book.title.toLowerCase().includes(search) ||
                book.author.toLowerCase().includes(search)
            );
        }
        
        if (status) {
            filtered = filtered.filter(book => book.status === status);
        }
        
        if (categoryId) {
            filtered = filtered.filter(book =>
                book.categories?.some(cat => cat.id == categoryId)
            );
        }
        
        const displayBooks = filtered;
        const container = document.getElementById('booksGrid');
        
        if (container) {
            if (displayBooks.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: 1 / -1;">
                        <div class="empty-state">
                            <div class="empty-state-icon">🔍</div>
                            <p class="empty-state-text">لا توجد نتائج تطابق معايير البحث</p>
                        </div>
                    </div>
                `;
            } else {
                container.innerHTML = displayBooks.map(book => this.createBookCard(book)).join('');
                this.rebindBookEvents();
            }
        }
    }
    
    rebindBookEvents() {
        document.querySelectorAll('.book-card').forEach(card => {
            const bookId = card.dataset.bookId;
            
            card.querySelector('.book-btn-edit')?.addEventListener('click', () => {
                this.openBookModal(bookId);
            });
            
            card.querySelector('.book-btn-delete')?.addEventListener('click', () => {
                this.deleteBook(bookId);
            });
            
            card.querySelector('.book-favorite')?.addEventListener('click', () => {
                this.toggleFavorite(bookId);
            });
        });
    }
    
    openBookModal(bookId = null) {
        this.currentEditingId = bookId;
        const modal = document.getElementById('bookModal');
        const form = document.getElementById('bookForm');
        const title = document.getElementById('bookModalTitle');
        
        if (!modal || !form) return;
        
        if (bookId) {
            title.textContent = 'تعديل الكتاب';
            const book = this.books.find(b => b.id == bookId);
            if (book) {
                this.populateBookForm(book);
            }
        } else {
            title.textContent = 'إضافة كتاب جديد';
            form.reset();
            this.currentEditingId = null;
            
            // Reset ratings
            document.querySelectorAll('.rating-star').forEach(star => {
                star.classList.remove('filled');
            });
            
            // Uncheck all categories
            document.querySelectorAll('.category-checkbox').forEach(cb => {
                cb.checked = false;
            });
        }
        
        modal.classList.add('active');
    }
    
    populateBookForm(book) {
        document.getElementById('bookTitle').value = book.title;
        document.getElementById('bookAuthor').value = book.author;
        document.getElementById('bookIsbn').value = book.isbn || '';
        document.getElementById('bookPublisher').value = book.publisher || '';
        document.getElementById('bookPublishYear').value = book.publish_year || '';
        document.getElementById('bookTotalPages').value = book.total_pages || 0;
        document.getElementById('bookCurrentPage').value = book.current_page || 0;
        document.getElementById('bookLanguage').value = book.language || 'العربية';
        document.getElementById('bookLocation').value = book.location || '';
        document.getElementById('bookStatus').value = book.status || 'لم أبدأ';
        document.getElementById('bookStartDate').value = book.start_date || '';
        document.getElementById('bookEndDate').value = book.end_date || '';
        document.getElementById('bookNotes').value = book.notes || '';
        document.getElementById('bookFavorite').checked = book.favorite == 1;
        
        // Set rating
        document.querySelectorAll('.rating-star').forEach((star, index) => {
            star.classList.toggle('filled', index < book.rating);
        });
        
        // Check categories
        document.querySelectorAll('.category-checkbox').forEach(cb => {
            cb.checked = book.categories?.some(cat => cat.id == cb.value) || false;
        });
    }
    
    async handleBookSubmit(e) {
        e.preventDefault();
        
        const title = document.getElementById('bookTitle').value;
        const author = document.getElementById('bookAuthor').value;
        
        if (!title || !author) {
            alert('يجب ملء العنوان والمؤلف على الأقل');
            return;
        }
        
        const formData = new FormData();
        formData.append('action', this.currentEditingId ? 'update_book' : 'add_book');
        
        if (this.currentEditingId) {
            formData.append('id', this.currentEditingId);
        }
        
        // Add book data
        formData.append('title', title);
        formData.append('author', author);
        formData.append('isbn', document.getElementById('bookIsbn').value);
        formData.append('publisher', document.getElementById('bookPublisher').value);
        formData.append('publish_year', document.getElementById('bookPublishYear').value);
        formData.append('total_pages', document.getElementById('bookTotalPages').value);
        formData.append('current_page', document.getElementById('bookCurrentPage').value);
        formData.append('language', document.getElementById('bookLanguage').value);
        formData.append('location', document.getElementById('bookLocation').value);
        formData.append('status', document.getElementById('bookStatus').value);
        formData.append('rating', this.getCurrentRating());
        formData.append('start_date', document.getElementById('bookStartDate').value);
        formData.append('end_date', document.getElementById('bookEndDate').value);
        formData.append('notes', document.getElementById('bookNotes').value);
        formData.append('favorite', document.getElementById('bookFavorite').checked ? 1 : 0);
        
        // Add selected categories
        document.querySelectorAll('.category-checkbox:checked').forEach(cb => {
            formData.append('categories[]', cb.value);
        });
        
        try {
            const response = await fetch(this.apiUrl, { method: 'POST', body: formData });
            const result = await response.json();
            
            if (result.success) {
                alert(result.message);
                document.getElementById('bookModal').classList.remove('active');
                await this.loadBooks();
                await this.loadStatistics();
            } else {
                alert('خطأ: ' + result.message);
            }
        } catch (error) {
            console.error('خطأ:', error);
            alert('حدث خطأ أثناء حفظ الكتاب');
        }
    }
    
    getCurrentRating() {
        return document.querySelectorAll('.rating-star.filled').length;
    }
    
    async deleteBook(bookId) {
        if (!confirm('هل أنت متأكد من حذف هذا الكتاب؟')) {
            return;
        }
        
        try {
            const formData = new FormData();
            formData.append('action', 'delete_book');
            formData.append('id', bookId);
            
            const response = await fetch(this.apiUrl, { method: 'POST', body: formData });
            const result = await response.json();
            
            if (result.success) {
                alert(result.message);
                await this.loadBooks();
                await this.loadStatistics();
            } else {
                alert('خطأ: ' + result.message);
            }
        } catch (error) {
            console.error('خطأ:', error);
            alert('حدث خطأ أثناء حذف الكتاب');
        }
    }
    
    async toggleFavorite(bookId) {
        const book = this.books.find(b => b.id == bookId);
        if (!book) return;
        
        try {
            const formData = new FormData();
            formData.append('action', 'update_book');
            formData.append('id', bookId);
            formData.append('title', book.title);
            formData.append('author', book.author);
            formData.append('isbn', book.isbn);
            formData.append('publisher', book.publisher);
            formData.append('publish_year', book.publish_year);
            formData.append('total_pages', book.total_pages);
            formData.append('current_page', book.current_page);
            formData.append('language', book.language);
            formData.append('location', book.location);
            formData.append('status', book.status);
            formData.append('rating', book.rating);
            formData.append('start_date', book.start_date);
            formData.append('end_date', book.end_date);
            formData.append('notes', book.notes);
            formData.append('favorite', book.favorite ? 0 : 1);
            
            book.categories?.forEach(cat => {
                formData.append('categories[]', cat.id);
            });
            
            const response = await fetch(this.apiUrl, { method: 'POST', body: formData });
            const result = await response.json();
            
            if (result.success) {
                await this.loadBooks();
            }
        } catch (error) {
            console.error('خطأ:', error);
        }
    }
    
    renderCategories() {
        const container = document.getElementById('categoriesList');
        if (!container) return;
        
        if (this.categories.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1;">
                    <div class="empty-state">
                        <div class="empty-state-icon">🏷️</div>
                        <p class="empty-state-text">لم تضف أي تصنيفات حتى الآن</p>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.categories.map(category => `
            <div class="category-item">
                <div style="display: flex; align-items: center; flex: 1;">
                    <span class="category-color-indicator" style="background-color: ${category.color}"></span>
                    <span class="category-name">${this.escapeHtml(category.name)}</span>
                </div>
                <div class="category-actions">
                    <button class="category-btn" onclick="libraryApp.openCategoryModal('${category.id}', '${this.escapeHtml(category.name)}', '${category.color}')">تعديل</button>
                    <button class="category-btn category-btn-delete" onclick="libraryApp.deleteCategory('${category.id}')">حذف</button>
                </div>
            </div>
        `).join('');
    }
    
    updateCategorySelects() {
        const categoryFilter = document.getElementById('categoryFilter');
        const categoryCheckboxes = document.getElementById('categoryCheckboxes');
        
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">جميع التصنيفات</option>' +
                this.categories.map(cat => `
                    <option value="${cat.id}">${this.escapeHtml(cat.name)}</option>
                `).join('');
        }
        
        if (categoryCheckboxes) {
            categoryCheckboxes.innerHTML = this.categories.map(cat => `
                <div class="checkbox-item">
                    <input type="checkbox" id="category${cat.id}" value="${cat.id}" class="checkbox-input category-checkbox">
                    <label for="category${cat.id}" class="checkbox-label">${this.escapeHtml(cat.name)}</label>
                </div>
            `).join('');
        }
    }
    
    openCategoryModal(categoryId = null, name = '', color = '#007aff') {
        const modal = document.getElementById('categoryModal');
        const nameInput = document.getElementById('categoryName');
        const colorInput = document.getElementById('categoryColor');
        
        if (!modal) return;
        
        if (categoryId) {
            nameInput.value = name;
            colorInput.value = color;
            modal.dataset.categoryId = categoryId;
        } else {
            nameInput.value = '';
            colorInput.value = '#007aff';
            delete modal.dataset.categoryId;
        }
        
        modal.classList.add('active');
    }
    
    async handleCategorySubmit(e) {
        e.preventDefault();
        
        const name = document.getElementById('categoryName').value;
        const color = document.getElementById('categoryColor').value;
        const modal = document.getElementById('categoryModal');
        const categoryId = modal?.dataset.categoryId;
        
        if (!name) {
            alert('يجب إدخال اسم التصنيف');
            return;
        }
        
        try {
            const formData = new FormData();
            formData.append('action', categoryId ? 'update_category' : 'add_category');
            formData.append('name', name);
            formData.append('color', color);
            
            if (categoryId) {
                formData.append('id', categoryId);
            }
            
            const response = await fetch(this.apiUrl, { method: 'POST', body: formData });
            const result = await response.json();
            
            if (result.success) {
                alert(result.message);
                modal.classList.remove('active');
                await this.loadCategories();
            } else {
                alert('خطأ: ' + result.message);
            }
        } catch (error) {
            console.error('خطأ:', error);
            alert('حدث خطأ أثناء حفظ التصنيف');
        }
    }
    
    async deleteCategory(categoryId) {
        if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟')) {
            return;
        }
        
        try {
            const formData = new FormData();
            formData.append('action', 'delete_category');
            formData.append('id', categoryId);
            
            const response = await fetch(this.apiUrl, { method: 'POST', body: formData });
            const result = await response.json();
            
            if (result.success) {
                alert(result.message);
                await this.loadCategories();
                await this.loadBooks();
            } else {
                alert('خطأ: ' + result.message);
            }
        } catch (error) {
            console.error('خطأ:', error);
            alert('حدث خطأ أثناء حذف التصنيف');
        }
    }
    
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// Initialize when DOM is ready
let libraryApp;
document.addEventListener('DOMContentLoaded', () => {
    libraryApp = new LibraryApp();
});
