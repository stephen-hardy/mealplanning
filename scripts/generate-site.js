const fs = require('fs');
const path = require('path');

const PLAN_FILE = path.join(__dirname, '../plans/meal_plan_final.md');
const DATA_DIR = path.join(__dirname, '../data');
const DOCS_DIR = path.join(__dirname, '../site');

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

    // Load desserts
    const dessertFile = path.join(DATA_DIR, 'desserts.json');
    if (fs.existsSync(dessertFile)) {
        const data = JSON.parse(fs.readFileSync(dessertFile, 'utf8'));
        data.forEach(r => {
            recipes[r.name.toLowerCase()] = r;
        });
    }

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
            name: name,
            source_url: recipe.source_url || null,
            source: recipe.source || null
        };
    }
    return { name: name, source_url: null, source: null };
}

// Write JSON data
const processedMealPlan = mealPlan.map(day => ({
    ...day,
    primary_info: getRecipeInfo(day.primary),
    fallback_info: getRecipeInfo(day.fallback),
    dessert_info: getRecipeInfo(day.dessert)
}));

fs.writeFileSync(path.join(DOCS_DIR, 'mealplan.json'), JSON.stringify(processedMealPlan, null, 2));

console.log('Site generation complete! (mealplan.json updated)');
