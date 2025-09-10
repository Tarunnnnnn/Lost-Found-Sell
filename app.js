// Lost & Found Application - Simplified and Fixed Version

// Application data
let itemsDatabase = [
    {
        id: 1,
        title: "Lost iPhone 13",
        description: "Black iPhone 13 with cracked screen, lost near campus library",
        category: "Electronics",
        location: "University Library",
        contact_info: "john@email.com",
        item_type: "lost",
        price: null,
        date_posted: "2024-09-10",
        status: "active"
    },
    {
        id: 2,
        title: "Found Car Keys",
        description: "Set of car keys with Honda keychain found in parking lot",
        category: "Keys",
        location: "Main Parking Lot",
        contact_info: "mary@email.com",
        item_type: "found",
        price: null,
        date_posted: "2024-09-09",
        status: "active"
    },
    {
        id: 3,
        title: "Laptop for Sale",
        description: "Dell laptop in good condition, 8GB RAM, 256GB SSD",
        category: "Electronics",
        location: "Downtown",
        contact_info: "seller@email.com",
        item_type: "sell",
        price: 450,
        date_posted: "2024-09-08",
        status: "active"
    }
];

const categories = ["Electronics", "Clothing", "Documents", "Keys", "Jewelry", "Books", "Sports Equipment", "Bags/Wallets", "Other"];
let nextItemId = 4;

// Core navigation functions - make immediately available
function showPage(pageName) {
    console.log('Navigating to:', pageName);
    
    try {
        // Hide all pages
        document.getElementById('homePage').classList.remove('active');
        document.getElementById('searchPage').classList.remove('active');
        document.getElementById('postItemPage').classList.remove('active');
        
        // Show target page
        const targetPage = document.getElementById(pageName + 'Page');
        if (targetPage) {
            targetPage.classList.add('active');
            console.log('Page shown:', pageName);
        }
        
        // Update navigation buttons
        document.getElementById('homeBtn').classList.remove('btn--primary');
        document.getElementById('homeBtn').classList.add('btn--outline');
        document.getElementById('searchBtn').classList.remove('btn--primary');
        document.getElementById('searchBtn').classList.add('btn--outline');
        document.getElementById('postItemBtn').classList.remove('btn--primary');
        document.getElementById('postItemBtn').classList.add('btn--outline');
        
        // Highlight current page button
        if (pageName === 'home') {
            document.getElementById('homeBtn').classList.remove('btn--outline');
            document.getElementById('homeBtn').classList.add('btn--primary');
        } else if (pageName === 'search') {
            document.getElementById('searchBtn').classList.remove('btn--outline');
            document.getElementById('searchBtn').classList.add('btn--primary');
            displayAllItems();
        } else if (pageName === 'postItem') {
            document.getElementById('postItemBtn').classList.remove('btn--outline');
            document.getElementById('postItemBtn').classList.add('btn--primary');
        }
        
        if (pageName === 'home') {
            displayRecentItems();
        }
        
    } catch (error) {
        console.error('Navigation error:', error);
    }
}

function showPostPage(itemType) {
    console.log('Showing post page for:', itemType);
    
    try {
        showPage('postItem');
        
        // Set item type and update form
        setTimeout(() => {
            const itemTypeSelect = document.getElementById('itemType');
            if (itemTypeSelect) {
                itemTypeSelect.value = itemType;
                updateFormForItemType(itemType);
            }
        }, 100);
        
    } catch (error) {
        console.error('Post page error:', error);
    }
}

function updateFormForItemType(itemType) {
    const priceGroup = document.getElementById('priceGroup');
    const priceInput = document.getElementById('itemPrice');
    const titleElement = document.getElementById('postItemTitle');
    
    const titles = {
        lost: 'Post Lost Item',
        found: 'Post Found Item',
        sell: 'Post Item for Sale'
    };
    
    if (titleElement) {
        titleElement.textContent = titles[itemType] || 'Post New Item';
    }
    
    if (priceGroup && priceInput) {
        if (itemType === 'sell') {
            priceGroup.style.display = 'block';
            priceInput.required = true;
        } else {
            priceGroup.style.display = 'none';
            priceInput.required = false;
            priceInput.value = '';
        }
    }
}

function displayRecentItems() {
    const container = document.getElementById('recentItemsList');
    if (!container) return;
    
    const recentItems = itemsDatabase.filter(item => item.status === 'active').slice(0, 6);
    container.innerHTML = recentItems.map(item => createItemCard(item)).join('');
}

function displayAllItems() {
    const container = document.getElementById('searchResultsList');
    const noResults = document.getElementById('noResults');
    if (!container || !noResults) return;
    
    const activeItems = itemsDatabase.filter(item => item.status === 'active');
    
    if (activeItems.length === 0) {
        container.innerHTML = '';
        noResults.classList.remove('hidden');
    } else {
        noResults.classList.add('hidden');
        container.innerHTML = activeItems.map(item => createItemCard(item)).join('');
    }
}

function createItemCard(item) {
    const typeClass = `item-type--${item.item_type}`;
    const formattedDate = new Date(item.date_posted).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    return `
        <div class="card item-card">
            <div class="card__body">
                <div class="item-header">
                    <h3 class="item-title">${escapeHtml(item.title)}</h3>
                    <span class="item-type ${typeClass}">${item.item_type.toUpperCase()}</span>
                </div>
                <p class="item-description">${escapeHtml(item.description)}</p>
                <div class="item-details">
                    <div class="item-detail"><strong>Category:</strong> ${escapeHtml(item.category)}</div>
                    <div class="item-detail"><strong>Location:</strong> ${escapeHtml(item.location)}</div>
                    <div class="item-detail"><strong>Contact:</strong> ${escapeHtml(item.contact_info)}</div>
                </div>
                ${item.price ? `<div class="item-price">$${item.price.toFixed(2)}</div>` : ''}
                <div class="item-date">Posted on ${formattedDate}</div>
            </div>
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function performSearch() {
    const keywords = document.getElementById('searchKeywords')?.value?.toLowerCase() || '';
    const type = document.getElementById('searchType')?.value || '';
    const category = document.getElementById('searchCategory')?.value || '';
    const location = document.getElementById('searchLocation')?.value?.toLowerCase() || '';
    
    const results = itemsDatabase.filter(item => {
        if (keywords && !`${item.title} ${item.description}`.toLowerCase().includes(keywords)) return false;
        if (type && item.item_type !== type) return false;
        if (category && item.category !== category) return false;
        if (location && !item.location.toLowerCase().includes(location)) return false;
        return item.status === 'active';
    });
    
    const container = document.getElementById('searchResultsList');
    const noResults = document.getElementById('noResults');
    
    if (results.length === 0) {
        container.innerHTML = '';
        noResults.classList.remove('hidden');
    } else {
        noResults.classList.add('hidden');
        container.innerHTML = results.map(item => createItemCard(item)).join('');
    }
}

function clearSearchFilters() {
    document.getElementById('searchKeywords').value = '';
    document.getElementById('searchType').value = '';
    document.getElementById('searchCategory').value = '';
    document.getElementById('searchLocation').value = '';
    displayAllItems();
}

function showSuccessModal(message) {
    document.getElementById('successMessage').textContent = message;
    document.getElementById('successModal').classList.remove('hidden');
}

function showErrorModal(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorModal').classList.remove('hidden');
}

function closeSuccessModal() {
    document.getElementById('successModal').classList.add('hidden');
    showPage('home');
}

function closeErrorModal() {
    document.getElementById('errorModal').classList.add('hidden');
}

// Make functions globally available
window.showPage = showPage;
window.showPostPage = showPostPage;
window.closeSuccessModal = closeSuccessModal;
window.closeErrorModal = closeErrorModal;

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Lost & Found App...');
    
    // Populate category dropdowns
    const categorySelects = ['searchCategory', 'itemCategory'];
    categorySelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                select.appendChild(option);
            });
        }
    });
    
    // Set up navigation event listeners
    document.getElementById('homeBtn')?.addEventListener('click', () => showPage('home'));
    document.getElementById('searchBtn')?.addEventListener('click', () => showPage('search'));
    document.getElementById('postItemBtn')?.addEventListener('click', () => showPage('postItem'));
    
    // Brand click to home
    document.querySelector('.navbar-brand h2')?.addEventListener('click', () => showPage('home'));
    
    // Search functionality
    document.getElementById('performSearch')?.addEventListener('click', performSearch);
    document.getElementById('clearFilters')?.addEventListener('click', clearSearchFilters);
    document.getElementById('searchKeywords')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    
    // Form handling
    const form = document.getElementById('postItemForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                title: document.getElementById('itemTitle').value.trim(),
                description: document.getElementById('itemDescription').value.trim(),
                category: document.getElementById('itemCategory').value,
                location: document.getElementById('itemLocation').value.trim(),
                contact_info: document.getElementById('itemContact').value.trim(),
                item_type: document.getElementById('itemType').value,
                price: document.getElementById('itemPrice').value || null
            };
            
            // Validation
            if (!formData.title || !formData.description || !formData.category || 
                !formData.location || !formData.contact_info || !formData.item_type) {
                showErrorModal('Please fill in all required fields.');
                return;
            }
            
            if (formData.item_type === 'sell' && (!formData.price || parseFloat(formData.price) <= 0)) {
                showErrorModal('Please enter a valid price for items for sale.');
                return;
            }
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.contact_info)) {
                showErrorModal('Please enter a valid email address.');
                return;
            }
            
            // Add item to database
            const newItem = {
                id: nextItemId++,
                ...formData,
                price: formData.price ? parseFloat(formData.price) : null,
                date_posted: new Date().toISOString().split('T')[0],
                status: 'active'
            };
            
            itemsDatabase.unshift(newItem);
            form.reset();
            updateFormForItemType('');
            showSuccessModal('Your item has been posted successfully!');
        });
    }
    
    // Item type change handler
    document.getElementById('itemType')?.addEventListener('change', function() {
        updateFormForItemType(this.value);
    });
    
    // Cancel button
    document.getElementById('cancelPost')?.addEventListener('click', () => showPage('home'));
    
    // Modal close buttons
    document.getElementById('closeSuccessModal')?.addEventListener('click', closeSuccessModal);
    document.getElementById('closeErrorModal')?.addEventListener('click', closeErrorModal);
    
    // Initialize app
    showPage('home');
    
    console.log('App initialized successfully');
});