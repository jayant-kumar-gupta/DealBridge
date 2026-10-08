import { initAdminLayout } from '../../components/admin-layout.js';
import { api } from '../../utils/api.js';
import { showModal, closeModal } from '../../components/modal.js';
import { showToast } from '../../components/toast.js';
import { formatDate } from '../../utils/helpers.js';

let comments = [];
let products = [];
let searchQuery = '';
let selectedProduct = '';

document.addEventListener('DOMContentLoaded', async () => {
    initAdminLayout();
    setupEvents();
    await loadData();
});

function setupEvents() {
    const searchInput = document.getElementById('review-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            renderTable();
        });
    }

    const productFilter = document.getElementById('review-product-filter');
    if (productFilter) {
        productFilter.addEventListener('change', (e) => {
            selectedProduct = e.target.value;
            renderTable();
        });
    }
}

async function loadData() {
    const tbody = document.getElementById('reviews-table-body');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2.5rem;" class="text-secondary">Loading reviews and comments...</td></tr>';
    }

    try {
        const [commentsData, prodsData] = await Promise.all([
            api.get('/ratings/comment/all'),
            api.get('/products/?limit=100').catch(() => [])
        ]);

        comments = Array.isArray(commentsData) ? commentsData : [];
        products = Array.isArray(prodsData) ? prodsData : [];

        populateProductFilter();
        renderTable();
    } catch (err) {
        console.error('Failed to load reviews data:', err);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2.5rem;" class="text-error">Failed to load reviews: ${err.message || 'Error'}</td></tr>`;
        }
        showToast(err.message || 'Failed to load reviews', 'error');
    }
}

function populateProductFilter() {
    const filter = document.getElementById('review-product-filter');
    if (!filter) return;

    const cur = filter.value;
    filter.innerHTML = '<option value="">All Products</option>';

    products.forEach(p => {
        const opt = document.createElement('option');
        opt.value = String(p.id);
        opt.textContent = `#${p.id} — ${p.name}`;
        filter.appendChild(opt);
    });

    filter.value = cur;
}

function renderTable() {
    const tbody = document.getElementById('reviews-table-body');
    if (!tbody) return;

    const filtered = comments.filter(c => {
        const prod = products.find(p => p.id === c.product_id);

        // Product Filter
        if (selectedProduct && String(c.product_id) !== selectedProduct) {
            return false;
        }

        // Search Query
        if (searchQuery) {
            const commentText = (c.comment || '').toLowerCase();
            const authorName = (c.user_name || '').toLowerCase();
            const prodName = prod ? prod.name.toLowerCase() : '';
            const idMatch = String(c.id).includes(searchQuery) || String(c.product_id).includes(searchQuery) || String(c.user_id).includes(searchQuery);

            if (!commentText.includes(searchQuery) && !authorName.includes(searchQuery) && !prodName.includes(searchQuery) && !idMatch) {
                return false;
            }
        }

        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="admin-empty" style="text-align: center; padding: 2.5rem; color: var(--color-text-secondary);">
                    ${comments.length === 0 ? 'No user reviews or comments have been posted yet.' : 'No reviews match your filters.'}
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(c => {
        const prod = products.find(p => p.id === c.product_id);
        const prodName = prod ? prod.name : `Product #${c.product_id}`;
        let prodImg = prod?.image_path || '/assets/images/placeholder.jpg';
        if (prodImg && !prodImg.startsWith('/') && !prodImg.startsWith('http')) {
            prodImg = '/' + prodImg;
        }

        const author = c.user_name || `User #${c.user_id}`;
        const ratingDisplay = (prod && prod.avg_rating != null)
            ? `<span style="font-weight: 600; color: #f59e0b;">⭐ ${Number(prod.avg_rating).toFixed(1)}</span> <small class="text-secondary">(${prod.rating_count || 0})</small>`
            : '<span class="text-secondary" style="font-style: italic;">N/A</span>';

        const commentText = c.comment || '';
        const preview = commentText.length > 50 ? commentText.slice(0, 48) + '...' : commentText;

        return `
            <tr>
                <td><strong>#${c.id}</strong></td>
                <td style="max-width: 230px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <img src="${prodImg}" alt="" style="width: 36px; height: 36px; object-fit: contain; border-radius: 4px; border: 1px solid var(--color-border); background: var(--color-surface); flex-shrink: 0;" onerror="this.src='/assets/images/placeholder.jpg'">
                        <div>
                            <div style="font-weight: 600; color: var(--color-text); font-size: 0.9rem; line-height: 1.2;">${prodName}</div>
                            <small style="color: var(--color-text-secondary); font-size: 0.78rem;">ID: #${c.product_id}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <strong>${author}</strong>
                    <div style="font-size: 0.78rem; color: var(--color-text-secondary);">User #${c.user_id}</div>
                </td>
                <td>${ratingDisplay}</td>
                <td>
                    <div style="font-size: 0.85rem; color: var(--color-text);">${formatDate(c.date)}</div>
                </td>
                <td style="max-width: 280px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
                        <span style="font-size: 0.9rem; color: var(--color-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 220px;" title="${commentText}">
                            ${preview}
                        </span>
                    </div>
                </td>
                <td style="text-align: right;">
                    <div class="table-actions" style="justify-content: flex-end; gap: 6px;">
                        <button class="btn btn-sm btn-outline view-review-btn" data-id="${c.id}">View</button>
                        <button class="btn btn-sm btn-outline delete-review-btn" data-id="${c.id}" style="color: var(--color-error); border-color: var(--color-border);">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Attach view button events
    tbody.querySelectorAll('.view-review-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id, 10);
            const found = comments.find(c => c.id === id);
            if (found) {
                openReviewModal(found);
            }
        });
    });

    // Attach delete button events
    tbody.querySelectorAll('.delete-review-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id, 10);
            deleteComment(id);
        });
    });
}

function openReviewModal(commentData) {
    const prod = products.find(p => p.id === commentData.product_id);
    const prodName = prod ? prod.name : `Product #${commentData.product_id}`;
    let prodImg = prod?.image_path || '/assets/images/placeholder.jpg';
    if (prodImg && !prodImg.startsWith('/') && !prodImg.startsWith('http')) {
        prodImg = '/' + prodImg;
    }

    const author = commentData.user_name || `User #${commentData.user_id}`;
    const ratingDisplay = (prod && prod.avg_rating != null)
        ? `⭐ ${Number(prod.avg_rating).toFixed(1)} / 5 (${prod.rating_count || 0} reviews)`
        : 'N/A';

    const modalContent = `
        <div style="display: flex; flex-direction: column; gap: var(--space-md); max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; align-items: center; gap: 12px; padding-bottom: var(--space-md); border-bottom: 1px solid var(--color-border);">
                <img src="${prodImg}" alt="" style="width: 50px; height: 50px; object-fit: contain; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-surface); flex-shrink: 0;" onerror="this.src='/assets/images/placeholder.jpg'">
                <div>
                    <h4 style="margin: 0; font-size: 1.05rem; color: var(--color-text);">${prodName}</h4>
                    <div style="color: var(--color-text-secondary); font-size: 0.85rem; margin-top: 3px;">
                        Product ID: #${commentData.product_id} • Average Rating: <strong style="color: #f59e0b;">${ratingDisplay}</strong>
                    </div>
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 0.9rem;">
                <div>
                    Author: <strong style="color: var(--color-text);">${author}</strong> 
                    <span style="color: var(--color-text-secondary); font-size: 0.8rem;">(User #${commentData.user_id})</span>
                </div>
                <div style="color: var(--color-text-secondary); font-size: 0.85rem;">
                    📅 ${formatDate(commentData.date)}
                </div>
            </div>

            <div>
                <div style="font-weight: 600; font-size: 0.95rem; margin-bottom: 6px; color: var(--color-text);">Full Review / Comment:</div>
                <div style="background: var(--color-bg); padding: var(--space-md); border-radius: var(--radius-md); border: 1px solid var(--color-border); line-height: 1.6; font-size: 0.95rem; white-space: pre-wrap; word-break: break-word; color: var(--color-text);">
                    ${commentData.comment}
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-sm); padding-top: var(--space-md); border-top: 1px solid var(--color-border);">
                <button type="button" class="btn btn-outline" id="modal-delete-review-btn" style="color: var(--color-error); border-color: var(--color-error);">
                    Delete Review
                </button>
                <button type="button" class="btn btn-secondary" id="modal-close-review-btn">
                    Close
                </button>
            </div>
        </div>
    `;

    showModal(modalContent, { title: `Review #${commentData.id}`, maxWidth: '560px' });

    const closeBtn = document.getElementById('modal-close-review-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    const modalDeleteBtn = document.getElementById('modal-delete-review-btn');
    if (modalDeleteBtn) {
        modalDeleteBtn.addEventListener('click', async () => {
            closeModal();
            await deleteComment(commentData.id);
        });
    }
}

async function deleteComment(id) {
    const found = comments.find(c => c.id === id);
    if (!found) return;

    const author = found.user_name || `User #${found.user_id}`;
    if (!confirm(`Are you sure you want to delete this comment by ${author}?\n"${found.comment.slice(0, 60)}..."`)) {
        return;
    }

    try {
        await api.delete(`/ratings/comment/${id}`);
        comments = comments.filter(c => c.id !== id);
        renderTable();
        showToast('Review comment deleted successfully', 'success');
    } catch (err) {
        console.error('Failed to delete comment:', err);
        showToast(err.message || 'Failed to delete review comment', 'error');
    }
}
