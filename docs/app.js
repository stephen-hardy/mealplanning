let mealPlan = [];
let wakeLock = null;

async function init() {
    try {
        const response = await fetch('mealplan.json');
        if (!response.ok) throw new Error('Failed to load meal plan data');
        mealPlan = await response.json();
        window.addEventListener('hashchange', router);
        
        // Re-acquire wake lock if tab becomes visible again
        document.addEventListener('visibilitychange', async () => {
            if (wakeLock !== null && document.visibilityState === 'visible') {
                await requestWakeLock();
            }
        });

        router();
    } catch (error) {
        document.getElementById('app-content').innerHTML = `
            <div class="error" style="text-align:center; padding: 2rem;">
                <p>Error loading meal plan: ${error.message}</p>
                <button onclick="location.reload()" style="margin-top:1rem; padding: 0.8rem 1.5rem; background: var(--accent-color); color:white; border:none; border-radius:var(--radius); font-weight:600;">Retry</button>
                <br><br>
                <a href="#overview" style="color: var(--accent-color); text-decoration:none;">Go to Overview</a>
            </div>`;
    }
}

function router() {
    if (!document.startViewTransition) {
        performRoute();
        return;
    }
    document.startViewTransition(() => performRoute());
}

function performRoute() {
    const hash = window.location.hash || '#overview';
    const nav = document.getElementById('app-nav');
    const viewTitle = document.getElementById('view-title');

    // Scroll to top on every navigation
    window.scrollTo(0, 0);

    if (hash === '#overview') {
        releaseWakeLock();
        renderOverview();
        nav.classList.add('hidden');
        viewTitle.textContent = '';
    } else if (hash.startsWith('#day-')) {
        const dayNum = parseInt(hash.split('-')[1]);
        if (isNaN(dayNum) || dayNum < 1 || dayNum > mealPlan.length) {
            window.location.hash = '#overview';
            return;
        }
        requestWakeLock();
        renderDay(dayNum);
        nav.classList.remove('hidden');
    } else {
        // Fallback for any other hash
        window.location.hash = '#overview';
    }
}

async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Wake Lock active');
        } catch (err) {
            console.error(`${err.name}, ${err.message}`);
        }
    }
}

function releaseWakeLock() {
    if (wakeLock) {
        wakeLock.release();
        wakeLock = null;
        console.log('Wake Lock released');
    }
}

async function shareDay(dayNum) {
    const dayData = mealPlan.find(d => d.day === dayNum);
    if (!dayData || !navigator.share) return;

    try {
        await navigator.share({
            title: `Meal Plan: Day ${dayNum}`,
            text: `Today's Meal: ${dayData.primary}\nFallback: ${dayData.fallback}`,
            url: window.location.href
        });
    } catch (err) {
        console.error('Share failed:', err);
    }
}

function renderOverview() {
    const content = document.getElementById('app-content');
    const listItems = mealPlan.map(d => `
        <a href="#day-${d.day}" class="day-card">
            <span class="day-num">${d.day}</span>
            <span class="day-title">${d.primary}</span>
        </a>
    `).join('');

    content.innerHTML = `<div class="day-grid">${listItems}</div>`;
}

function renderDay(dayNum) {
    const dayData = mealPlan.find(d => d.day === dayNum);
    const content = document.getElementById('app-content');
    const viewTitle = document.getElementById('view-title');
    
    if (!dayData) {
        content.innerHTML = `
            <div style="text-align:center; padding: 2rem;">
                <p class="error">Day ${dayNum} not found.</p>
                <a href="#overview" style="display:inline-block; margin-top:1rem; padding: 0.8rem 1.5rem; background: var(--accent-color); color:white; text-decoration:none; border-radius:var(--radius); font-weight:600;">Return to Calendar</a>
            </div>`;
        return;
    }

    const dateStr = `May ${dayData.day.toString().padStart(2, '0')}`;
    viewTitle.textContent = `Day ${dayData.day} - ${dateStr}`;

    const renderRecipe = (info, label) => {
        if (!info) return '';
        
        const hasDetails = (info.ingredients && info.ingredients.length > 0) || 
                          (info.directions && info.directions.length > 0);

        return `
            <details ${label === 'Primary' ? 'open' : ''}>
                <summary>${label}: ${info.name}</summary>
                <div class="details-content">
                    ${info.image ? `<img src="images/${info.image}" class="recipe-image" alt="${info.name}">` : ''}
                    
                    <div class="recipe-meta">
                        ${info.prepTime ? `<span><strong>Prep:</strong> ${info.prepTime.replace('PT', '').replace('M', ' mins')}</span>` : ''}
                        ${info.cookTime ? `<span><strong>Cook:</strong> ${info.cookTime.replace('PT', '').replace('M', ' mins')}</span>` : ''}
                        ${info.source ? `<span><strong>Source:</strong> ${info.source_url ? `<a href="${info.source_url}" target="_blank">${info.source}</a>` : info.source}</span>` : ''}
                    </div>

                    ${hasDetails ? `
                        <div class="recipe-sections">
                            <div class="ingredients-section">
                                <h3>Ingredients</h3>
                                <ul>
                                    ${info.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                                </ul>
                            </div>
                            <div class="directions-section">
                                <h3>Directions</h3>
                                <ol>
                                    ${info.directions.map(step => `<li>${step}</li>`).join('')}
                                </ol>
                            </div>
                        </div>
                    ` : `
                        <p>${info.source_url ? `<a href="${info.source_url}" target="_blank" class="recipe-link">View Full Recipe</a>` : 'Recipe details not available.'}</p>
                    `}

                    ${info.notes ? `
                        <div class="recipe-notes-internal">
                            <h3>Recipe Notes</h3>
                            <p>${info.notes}</p>
                        </div>
                    ` : ''}
                </div>
            </details>
        `;
    };

    content.innerHTML = `
        <main class="day-view">
            ${renderRecipe(dayData.primary_info, 'Primary')}
            ${renderRecipe(dayData.fallback_info, 'Fallback')}
            ${renderRecipe(dayData.dessert_info, 'Dessert')}

            <details open>
                <summary>Kitchen Notes</summary>
                <div class="details-content notes-section">
                    <p>${dayData.notes || 'No notes for today.'}</p>
                </div>
            </details>
            
            <div class="actions-section" style="grid-column: 1 / -1; display: flex; justify-content: center; padding: 1rem 0;">
                <button onclick="shareDay(${dayNum})" class="btn-share" style="background: var(--secondary-color); color: white; border: none; padding: 0.8rem 1.5rem; border-radius: var(--radius); font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                    <span>Share Today's Plan</span>
                </button>
            </div>
        </main>
    `;

    // Update nav buttons
    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');
    
    const prevDay = dayNum > 1 ? dayNum - 1 : null;
    const nextDay = dayNum < mealPlan.length ? dayNum + 1 : null;

    if (prevDay) {
        prevBtn.href = `#day-${prevDay}`;
        prevBtn.classList.remove('disabled');
    } else {
        prevBtn.removeAttribute('href');
        prevBtn.classList.add('disabled');
    }

    if (nextDay) {
        nextBtn.href = `#day-${nextDay}`;
        nextBtn.classList.remove('disabled');
    } else {
        nextBtn.removeAttribute('href');
        nextBtn.classList.add('disabled');
    }
}

init();
