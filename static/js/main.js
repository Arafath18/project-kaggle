// Global State
let allReleases = [];
let currentFilter = 'all';
let searchQuery = '';
let selectedUpdateItem = null; // For the tweet composer

// DOM Elements
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = document.getElementById('refresh-icon');
const lastUpdatedText = document.getElementById('last-updated-text');
const feedLoading = document.getElementById('feed-loading');
const feedEmpty = document.getElementById('feed-empty');
const feedContainer = document.getElementById('feed-container');
const resultsCount = document.getElementById('results-count');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const filterPills = document.querySelectorAll('.filter-pill');
const statsGrid = document.getElementById('stats-grid');
const resetFiltersBtn = document.getElementById('reset-filters-btn');

// Stats Counters
const statAllCount = document.getElementById('stat-all-count');
const statFeatureCount = document.getElementById('stat-feature-count');
const statChangeCount = document.getElementById('stat-change-count');
const statIssueCount = document.getElementById('stat-issue-count');
const statDeprecationCount = document.getElementById('stat-deprecation-count');

// Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const modalClose = document.getElementById('modal-close');
const modalItemDate = document.getElementById('modal-item-date');
const modalItemType = document.getElementById('modal-item-type');
const modalOriginalText = document.getElementById('modal-original-text');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCounter = document.getElementById('char-counter');
const charProgressCircle = document.getElementById('char-progress-circle');
const btnCopyTweet = document.getElementById('btn-copy-tweet');
const btnSubmitTweet = document.getElementById('btn-submit-tweet');

// Template Buttons
const tplStandard = document.getElementById('tpl-standard');
const tplAnnouncement = document.getElementById('tpl-announcement');
const tplMinimal = document.getElementById('tpl-minimal');

// Setup circular progress ring properties
const circleRadius = 10;
const circleCircumference = 2 * Math.PI * circleRadius;
if (charProgressCircle) {
    charProgressCircle.style.strokeDasharray = `${circleCircumference} ${circleCircumference}`;
    charProgressCircle.style.strokeDashoffset = circleCircumference;
}

// ----------------------------------------------------
// Page Initialization & Event Listeners
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    fetchReleaseNotes(false);
    
    // Refresh Button Event
    refreshBtn.addEventListener('click', () => {
        fetchReleaseNotes(true);
    });

    // Search Input Event
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        clearSearchBtn.style.display = searchQuery.length > 0 ? 'block' : 'none';
        renderFeed();
    });

    // Clear Search Event
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        renderFeed();
    });

    // Filter Pills Event
    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            const filter = pill.getAttribute('data-filter');
            setFilter(filter);
        });
    });

    // Stats Cards Clicking (Acts as filtering)
    statsGrid.querySelectorAll('.stat-card').forEach(card => {
        card.addEventListener('click', () => {
            const filter = card.getAttribute('data-filter');
            setFilter(filter);
            // Scroll to controls/feed section on mobile
            document.querySelector('.controls-panel').scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Reset Filters Button (Empty State helper)
    resetFiltersBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        setFilter('all');
    });

    // Modal Close Events
    modalClose.addEventListener('click', closeModal);
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) closeModal();
    });

    // Textarea Input Event
    tweetTextarea.addEventListener('input', updateCharCounter);

    // Template Button Events
    tplStandard.addEventListener('click', () => selectTemplate('standard'));
    tplAnnouncement.addEventListener('click', () => selectTemplate('announcement'));
    tplMinimal.addEventListener('click', () => selectTemplate('minimal'));

    // Copy Tweet Event
    btnCopyTweet.addEventListener('click', copyTweetToClipboard);

    // Post Tweet Event
    btnSubmitTweet.addEventListener('click', submitTweetToTwitter);
});

// ----------------------------------------------------
// Feed Loading & Parsing
// ----------------------------------------------------
async function fetchReleaseNotes(forceRefresh = false) {
    // Show loading state
    feedLoading.style.display = 'flex';
    feedContainer.style.display = 'none';
    feedEmpty.style.display = 'none';
    refreshBtn.disabled = true;
    refreshIcon.classList.add('fa-spin');
    
    if (forceRefresh) {
        showToast('Fetching latest updates from feed...', 'info');
    }

    try {
        const url = `/api/releases${forceRefresh ? '?refresh=true' : ''}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Server returned ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        allReleases = data.releases || [];
        
        // Update last updated timestamp
        const fetchTime = new Date(data.last_fetched * 1000);
        lastUpdatedText.textContent = `Last Checked: ${fetchTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        
        // Update stats
        calculateStats(allReleases);
        
        // Render feed
        renderFeed();
        
        if (forceRefresh) {
            showToast('Feed successfully updated!', 'success');
        }
    } catch (error) {
        console.error('Failed to load release notes:', error);
        showToast(`Error: ${error.message}. Please try again.`, 'error');
        
        // If we have some releases in memory, just show them, otherwise empty state
        if (allReleases.length === 0) {
            feedLoading.style.display = 'none';
            feedEmpty.style.display = 'flex';
        }
    } finally {
        feedLoading.style.display = 'none';
        refreshBtn.disabled = false;
        refreshIcon.classList.remove('fa-spin');
    }
}

// Calculate total statistics counts
function calculateStats(releases) {
    let total = 0;
    let features = 0;
    let changes = 0;
    let issues = 0;
    let deprecations = 0;
    
    releases.forEach(release => {
        release.items.forEach(item => {
            total++;
            const type = item.type.toLowerCase();
            if (type.includes('feature')) features++;
            else if (type.includes('change')) changes++;
            else if (type.includes('issue')) issues++;
            else if (type.includes('deprecation')) deprecations++;
        });
    });
    
    // Animate stats numbers
    animateValue(statAllCount, parseInt(statAllCount.textContent), total, 600);
    animateValue(statFeatureCount, parseInt(statFeatureCount.textContent), features, 600);
    animateValue(statChangeCount, parseInt(statChangeCount.textContent), changes, 600);
    animateValue(statIssueCount, parseInt(statIssueCount.textContent), issues, 600);
    animateValue(statDeprecationCount, parseInt(statDeprecationCount.textContent), deprecations, 600);
}

// Animate numbers for premium feel
function animateValue(obj, start, end, duration) {
    if (start === end) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.textContent = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.textContent = end;
        }
    };
    window.requestAnimationFrame(step);
}

// ----------------------------------------------------
// Filtering & Rendering
// ----------------------------------------------------
function setFilter(filter) {
    currentFilter = filter;
    
    // Update active pill
    filterPills.forEach(pill => {
        if (pill.getAttribute('data-filter') === filter) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });

    renderFeed();
}

function renderFeed() {
    feedContainer.innerHTML = '';
    let filteredCount = 0;
    
    // Format feed title based on active filter
    const filterNames = {
        all: 'All Release Notes',
        feature: 'Features & Announcements',
        change: 'API & Config Changes',
        issue: 'Known Issues & Fixes',
        deprecation: 'Deprecations & Sunsets'
    };
    document.getElementById('feed-title-text').textContent = filterNames[currentFilter] || 'Release Notes';

    allReleases.forEach(release => {
        // Filter items in this release
        const matchedItems = release.items.filter(item => {
            // Check Type filter
            let typeMatches = false;
            const typeLower = item.type.toLowerCase();
            
            if (currentFilter === 'all') {
                typeMatches = true;
            } else if (currentFilter === 'feature' && typeLower.includes('feature')) {
                typeMatches = true;
            } else if (currentFilter === 'change' && typeLower.includes('change')) {
                typeMatches = true;
            } else if (currentFilter === 'issue' && typeLower.includes('issue')) {
                typeMatches = true;
            } else if (currentFilter === 'deprecation' && typeLower.includes('deprecation')) {
                typeMatches = true;
            }
            
            // Check Search query matches (search in type and text)
            let searchMatches = true;
            if (searchQuery) {
                const textLower = item.text.toLowerCase();
                const dateLower = release.date.toLowerCase();
                searchMatches = textLower.includes(searchQuery) || typeLower.includes(searchQuery) || dateLower.includes(searchQuery);
            }
            
            return typeMatches && searchMatches;
        });

        if (matchedItems.length > 0) {
            filteredCount += matchedItems.length;
            
            // Create release day card
            const dayCard = document.createElement('div');
            dayCard.className = 'day-card';
            
            // Day Header
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            
            const dayTitle = document.createElement('div');
            dayTitle.className = 'day-title';
            dayTitle.innerHTML = `<i class="fa-regular fa-calendar-days"></i> <span>${release.date}</span>`;
            
            const dayLink = document.createElement('a');
            dayLink.className = 'day-link';
            dayLink.href = release.link;
            dayLink.target = '_blank';
            dayLink.rel = 'noopener noreferrer';
            dayLink.innerHTML = `<span>View source</span> <i class="fa-solid fa-arrow-up-right-from-square"></i>`;
            
            dayHeader.appendChild(dayTitle);
            dayHeader.appendChild(dayLink);
            dayCard.appendChild(dayHeader);
            
            // Day Items List
            const itemsList = document.createElement('div');
            dayItemsListClass = 'day-items-list';
            itemsList.className = dayItemsListClass;
            
            matchedItems.forEach(item => {
                const updateItem = document.createElement('div');
                updateItem.className = 'update-item';
                
                const itemHeader = document.createElement('div');
                itemHeader.className = 'update-item-header';
                
                // Type Badge
                const badge = document.createElement('span');
                badge.className = `type-badge type-${getItemClass(item.type)}`;
                badge.innerHTML = `<span class="pill-dot dot-${getItemClass(item.type)}"></span>${item.type}`;
                
                // Tweet Button
                const tweetBtn = document.createElement('button');
                tweetBtn.className = 'btn-card-tweet';
                tweetBtn.innerHTML = `<i class="fa-brands fa-x-twitter"></i> Tweet Update`;
                tweetBtn.addEventListener('click', () => {
                    openTweetModal(release, item);
                });
                
                itemHeader.appendChild(badge);
                itemHeader.appendChild(tweetBtn);
                
                // Content HTML
                const contentDiv = document.createElement('div');
                contentDiv.className = 'update-content';
                contentDiv.innerHTML = item.html;
                
                // Standardize target='_blank' for links inside feed content
                contentDiv.querySelectorAll('a').forEach(a => {
                    a.setAttribute('target', '_blank');
                    a.setAttribute('rel', 'noopener noreferrer');
                });

                updateItem.appendChild(itemHeader);
                updateItem.appendChild(contentDiv);
                itemsList.appendChild(updateItem);
            });
            
            dayCard.appendChild(itemsList);
            feedContainer.appendChild(dayCard);
        }
    });

    resultsCount.textContent = `Showing ${filteredCount} ${filteredCount === 1 ? 'update' : 'updates'}`;
    
    // Toggle containers based on counts
    if (filteredCount === 0) {
        feedContainer.style.display = 'none';
        feedEmpty.style.display = 'flex';
    } else {
        feedContainer.style.display = 'block';
        feedEmpty.style.display = 'none';
    }
}

// Helpers to match badges to style sheets
function getItemClass(type) {
    const t = type.toLowerCase();
    if (t.includes('feature')) return 'feature';
    if (t.includes('change')) return 'change';
    if (t.includes('issue')) return 'issue';
    if (t.includes('deprecation')) return 'deprecation';
    return 'general';
}

// ----------------------------------------------------
// Tweet Composer & Modal Logic
// ----------------------------------------------------
function openTweetModal(release, item) {
    selectedUpdateItem = {
        date: release.date,
        link: release.link,
        type: item.type,
        text: item.text
    };
    
    // Set static UI tags in modal
    modalItemDate.textContent = release.date;
    modalItemType.textContent = item.type;
    
    // Set color badge class
    modalItemType.className = `preview-type-badge type-${getItemClass(item.type)}`;
    
    // Set original text preview (with html formatted to normal text)
    modalOriginalText.textContent = item.text;
    
    // Default to Standard Template
    selectTemplate('standard');
    
    // Display Modal
    tweetModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Lock background scroll
}

function closeModal() {
    tweetModal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Unlock scroll
    selectedUpdateItem = null;
}

function selectTemplate(templateType) {
    if (!selectedUpdateItem) return;
    
    // Remove active state from all templates
    document.querySelectorAll('.btn-template').forEach(btn => btn.classList.remove('active'));
    
    const { date, type, text, link } = selectedUpdateItem;
    
    // Standardize URL: use Google Cloud Release notes landing page if link is absent
    const targetLink = link || 'https://cloud.google.com/bigquery/docs/release-notes';
    
    let tweetText = '';
    
    // Base tweet templates
    if (templateType === 'standard') {
        tplStandard.classList.add('active');
        
        // Calculate max text characters
        // Standard template overhead: "BigQuery Release (June 15, 2026) - Feature: \n\n #BigQuery #GoogleCloud" + link
        const overheadText = `BigQuery Release (${date}) - ${type}: \n\n${targetLink} #BigQuery #GoogleCloud`;
        const textLimit = 280 - overheadText.length;
        const truncated = truncateText(text, textLimit);
        
        tweetText = `BigQuery Release (${date}) - ${type}: ${truncated}\n\n${targetLink} #BigQuery #GoogleCloud`;
        
    } else if (templateType === 'announcement') {
        tplAnnouncement.classList.add('active');
        
        // Overhead: "📢 BigQuery Update ({date}): \n\nDetails: {link} #GoogleCloud"
        const overheadText = `📢 BigQuery Update (${date}): \n\nDetails: ${targetLink} #GoogleCloud`;
        const textLimit = 280 - overheadText.length;
        const truncated = truncateText(text, textLimit);
        
        tweetText = `📢 BigQuery Update (${date}): ${truncated}\n\nDetails: ${targetLink} #GoogleCloud`;
        
    } else if (templateType === 'minimal') {
        tplMinimal.classList.add('active');
        
        // Overhead: "{type}: \n\n{link}"
        const overheadText = `${type}: \n\n${targetLink}`;
        const textLimit = 280 - overheadText.length;
        const truncated = truncateText(text, textLimit);
        
        tweetText = `${type}: ${truncated}\n\n${targetLink}`;
    }
    
    tweetTextarea.value = tweetText;
    updateCharCounter();
}

function truncateText(str, maxLength) {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
}

function updateCharCounter() {
    const text = tweetTextarea.value;
    const len = text.length;
    charCounter.textContent = `${len} / 280`;
    
    // Adjust visual progress circle
    const percent = Math.min(len / 280, 1);
    const strokeOffset = circleCircumference - (percent * circleCircumference);
    charProgressCircle.style.strokeDashoffset = strokeOffset;
    
    // Update color indicator based on size limits
    if (len > 280) {
        charProgressCircle.setAttribute('stroke', '#ef4444'); // Red
        charCounter.style.color = '#ef4444';
        btnSubmitTweet.disabled = true;
        btnSubmitTweet.style.opacity = '0.5';
        btnSubmitTweet.style.cursor = 'not-allowed';
    } else if (len > 250) {
        charProgressCircle.setAttribute('stroke', '#f59e0b'); // Orange
        charCounter.style.color = '#f59e0b';
        btnSubmitTweet.disabled = false;
        btnSubmitTweet.style.opacity = '1';
        btnSubmitTweet.style.cursor = 'pointer';
    } else {
        charProgressCircle.setAttribute('stroke', '#8b5cf6'); // Violet
        charCounter.style.color = 'var(--text-secondary)';
        btnSubmitTweet.disabled = false;
        btnSubmitTweet.style.opacity = '1';
        btnSubmitTweet.style.cursor = 'pointer';
    }
}

function copyTweetToClipboard() {
    const text = tweetTextarea.value;
    navigator.clipboard.writeText(text).then(() => {
        showToast('Tweet copied to clipboard!', 'success');
    }).catch(err => {
        console.error('Could not copy text: ', err);
        showToast('Failed to copy text. Please select manually.', 'error');
    });
}

function submitTweetToTwitter() {
    const text = tweetTextarea.value;
    if (text.length > 280) {
        showToast('Draft is too long! Limit is 280 characters.', 'error');
        return;
    }
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    showToast('Redirecting to Twitter/X...', 'success');
    closeModal();
}

// ----------------------------------------------------
// Toast Notification Engine
// ----------------------------------------------------
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-circle-xmark';
    
    toast.innerHTML = `
        <i class="fa-solid ${iconClass}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 3.5 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        toast.style.transition = 'all 0.5s ease';
        
        setTimeout(() => {
            toast.remove();
        }, 500);
    }, 3000);
}
