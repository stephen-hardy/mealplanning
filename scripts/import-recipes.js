const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

/**
 * Robust Recipe Importer for Recipe Keeper HTML exports.
 * Usage: node scripts/import-recipes.js <path-to-html>
 */

const htmlPath = process.argv[2];
if (!htmlPath) {
    console.error('Error: Please provide the path to the recipes.html file.');
    console.log('Usage: node scripts/import-recipes.js /path/to/recipes.html');
    process.exit(1);
}

async function importRecipes() {
    try {
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        const dom = new JSDOM(htmlContent);
        const document = dom.window.document;

        const recipeElements = document.querySelectorAll('.recipe-details');
        console.log(`Found ${recipeElements.length} recipes.`);

        const recipes = [];

        recipeElements.forEach((el) => {
            const name = el.querySelector('[itemprop="name"]')?.textContent?.trim();
            const course = el.querySelector('[itemprop="recipeCourse"]')?.textContent?.trim();
            
            // Extract categories
            const categoryMetas = el.querySelectorAll('[itemprop="recipeCategory"]');
            const categories = Array.from(categoryMetas).map(m => m.getAttribute('content'));
            
            const sourceEl = el.querySelector('[itemprop="recipeSource"]');
            let source = sourceEl?.textContent?.trim();
            let source_url = sourceEl?.querySelector('a')?.getAttribute('href');

            // If source is just the URL, and we have a source_url, maybe we want to clean it up?
            // For now, let's just store both if available.
            
            const rating = el.querySelector('[itemprop="recipeRating"]')?.getAttribute('content');

            if (name) {
                recipes.push({
                    name,
                    course,
                    categories,
                    source,
                    source_url,
                    rating: rating ? parseInt(rating) : null
                });
            }
        });

        // Group by primary category for planning
        const categoryMap = {
            'chicken': [],
            'beef': [],
            'pork': [],
            'fish': [],
            'vegetarian': [],
            'dessert': []
        };

        recipes.forEach(recipe => {
            const mainCat = recipe.categories?.[0]?.toLowerCase() || '';
            const course = recipe.course?.toLowerCase() || '';

            if (course === 'dessert' || mainCat.includes('dessert') || recipe.categories?.some(c => c.toLowerCase().includes('cookie'))) {
                categoryMap['dessert'].push(recipe);
            } else if (mainCat.includes('chicken')) {
                categoryMap['chicken'].push(recipe);
            } else if (mainCat.includes('beef')) {
                categoryMap['beef'].push(recipe);
            } else if (mainCat.includes('pork')) {
                categoryMap['pork'].push(recipe);
            } else if (mainCat.includes('fish') || mainCat.includes('seafood')) {
                categoryMap['fish'].push(recipe);
            } else if (mainCat.includes('vegetarian') || mainCat.includes('pasta') || mainCat.includes('meatless')) {
                categoryMap['vegetarian'].push(recipe);
            }
        });

        // Ensure directories exist
        const dataDir = path.join(__dirname, '../data');
        const catDir = path.join(dataDir, 'categories');
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true });

        // Save categories to individual files for token efficiency
        for (const [key, list] of Object.entries(categoryMap)) {
            if (list.length > 0) {
                const filePath = key === 'dessert' 
                    ? path.join(dataDir, 'desserts.json')
                    : path.join(catDir, `${key}.json`);
                
                fs.writeFileSync(filePath, JSON.stringify(list, null, 2));
                console.log(`Saved ${list.length} recipes to ${filePath}`);
            }
        }

        console.log('Import complete!');

    } catch (error) {
        console.error('An error occurred during import:', error);
    }
}

importRecipes();
