# Project: Meal Planning System Maintenance & Execution
Take over maintenance and monthly planning for this meal planning system.

## Project Structure
- `data/categories/*.json`: Recipe data by type (e.g., `chicken.json`, `bean_beef.json`).
- `plans/config.json`: Planning rules & default category rotation.
- `scripts/import-recipes.js`: Ingest Recipe Keeper HTML exports (`node scripts/import-recipes.js <file>`).
- `site/`: Mobile-responsive static website. `index.html` (monthly view); daily pages (`YYYY-MM-DD.html`) show recipe details.

## Core Rules & Intent (DO NOT IGNORE)
- **Selection Criteria**: No repeating recipes. Use "main dish" course only. Use recipes with ratings only.
- **Dietary/Content Rules**: No adjacent pasta. No adjacent soup. No soups with beans and chicken.
- **Seasonal**: Butternut squash or sweet potato recipes ONLY between September and February.
- **Efficiency**: Ensure continuity of ingredients to use groceries efficiently without waste.
- **Planning Logic**: Follow the specific category rotation sequence (refer to `docs/original-prompt.md` for the full 41-category cycle if needed, or `plans/config.json`).
- **External Research**: Perform Brave searches for each week to find utilitarian tips, techniques, and synergies between meals (ingredient sharing/preparation tips) not in the recipe text.

## Monthly Planning Task
1. **Rule Load**: Read `plans/config.json` and `docs/original-prompt.md` rules.
2. **Recipe Picking**: Select one primary dinner and one fallback/secondary recipe for every day. Select an optional dessert.
3. **Weekly Batches**: Process in weekly batches, performing at least 3 Brave searches per week for additional culinary insights.
4. **Plan Generation**: Create `plans/YYYY-MM-plan.md`.
5. **Site Update**:
   - Generate one HTML page per day. 
   - **UI**: Header (Day/Meal), Left/Right nav arrows.
   - **Content**: Details/Summary sections for Dinner (open by default), Fallback, Dessert, and Notes (research findings).
   - Ensure mobile-responsive design (phone-first).
   - Link the new month in `site/index.html`.
6. **Deployment**: If requested, use Git tools to push to GitHub Pages.

## Token Efficiency
- Ingest only relevant `data/categories/*.json` files for the current rotation step.
- Reference `docs/original-prompt.md` only for rule verification.
