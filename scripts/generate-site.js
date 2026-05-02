const fs = require('fs');
const path = require('path');

const PLAN_FILE = path.join(__dirname, '../plans/meal_plan_final.md');
const DATA_DIR = path.join(__dirname, '../data');
const DOCS_DIR = path.join(__dirname, '../docs');

if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });

function loadRecipeData() {
    const recipes = {};
    const categoriesDir = path.join(DATA_DIR, 'categories');
    
    // Load category files
    if (fs.existsSync(categoriesDir)) {
        fs.readdirSync(categoriesDir).forEach(file => {
            if (file.endsWith('.json')) {
                const data = JSON.parse(fs.readFileSync(path.join(categoriesDir, file), 'utf8'));
                data.forEach(r => {
                    recipes[r.name.toLowerCase()] = r;
                });
            }
        });
    }

    // Load desserts and other potential loose files
    const additionalFiles = ['desserts.json', 'other.json'];
    additionalFiles.forEach(file => {
        const filePath = path.join(DATA_DIR, file);
        if (fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            data.forEach(r => {
                recipes[r.name.toLowerCase()] = r;
            });
        }
    });

    return recipes;
}

function parseMealPlan() {
    const content = fs.readFileSync(PLAN_FILE, 'utf8');
    const days = [];
    const dayRegex = /## Day (\d+)\n\*\*Category:\*\* (.*?)\n\* \*\*Primary:\*\* (.*?)\n\* \*\*Fallback:\*\* (.*?)\n\* \*\*Dessert:\*\* (.*?)\n\* \*\*Notes:\*\* (.*?)(?=\n\n## Day|\n\n$|$)/gs;
    
    let match;
    while ((match = dayRegex.exec(content)) !== null) {
        days.push({
            day: parseInt(match[1]),
            category: match[2].trim(),
            primary: match[3].trim(),
            fallback: match[4].trim(),
            dessert: match[5].trim(),
            notes: match[6].trim()
        });
    }
    return days;
}

const recipeData = loadRecipeData();
const mealPlan = parseMealPlan();

function getRecipeInfo(name) {
    const recipe = recipeData[name.toLowerCase()];
    if (recipe) {
        return {
            ...recipe,
            name: name // Use name from meal plan if provided
        };
    }
    return { name: name, source_url: null, source: null };
}

const IMAGES_DOCS_DIR = path.join(DOCS_DIR, 'images');
if (!fs.existsSync(IMAGES_DOCS_DIR)) fs.mkdirSync(IMAGES_DOCS_DIR, { recursive: true });

// Find the latest RecipeKeeper images directory
const recipeKeeperDir = fs.readdirSync(DATA_DIR).find(d => d.startsWith('RecipeKeeper_'));
const SOURCE_IMAGES_DIR = recipeKeeperDir ? path.join(DATA_DIR, recipeKeeperDir, 'images') : null;

function copyRecipeImage(imageName) {
    if (!imageName || !SOURCE_IMAGES_DIR) return;
    const sourcePath = path.join(SOURCE_IMAGES_DIR, imageName);
    const destPath = path.join(IMAGES_DOCS_DIR, imageName);
    if (fs.existsSync(sourcePath) && !fs.existsSync(destPath)) {
        fs.copyFileSync(sourcePath, destPath);
    }
}

// Write JSON data
const processedMealPlan = mealPlan.map(day => {
    const primary_info = getRecipeInfo(day.primary);
    const fallback_info = getRecipeInfo(day.fallback);
    const dessert_info = getRecipeInfo(day.dessert);

    // Copy images if they exist
    if (primary_info.image) copyRecipeImage(primary_info.image);
    if (fallback_info.image) copyRecipeImage(fallback_info.image);
    if (dessert_info.image) copyRecipeImage(dessert_info.image);

    return {
        ...day,
        primary_info,
        fallback_info,
        dessert_info
    };
});

fs.writeFileSync(path.join(DOCS_DIR, 'mealplan.json'), JSON.stringify(processedMealPlan, null, 2));

console.log('Site generation complete! (mealplan.json updated)');
