# Meal Planning Project

A structured system for importing recipes from Recipe Keeper and generating monthly meal plans.

## Directory Structure

- `data/`: Extracted recipe data in JSON format, categorized for efficiency.
- `plans/`: Monthly rotation configurations and generated markdown plans.
- `scripts/`: Automation scripts for importing and processing.
- `site/`: The web-based viewer for the current meal plan.

## Getting Started

### 1. Import New Recipes
Export your recipes from Recipe Keeper as an HTML file, then run:

```bash
node scripts/import-recipes.js /path/to/recipes.html
```

This will update the files in `data/categories/` and `data/desserts.json`.

### 2. Generate a New Meal Plan
To generate a new month:
1. Review the rotation in `plans/config.json`.
2. Use the assistant to generate a new `plans/YYYY-MM-plan.md` based on the available data in `data/`.

### 3. Update the Website
Once a plan is finalized:
1. Generate the daily HTML files in `site/`.
2. Update `site/index.html` to point to the current month.

## Token Efficiency
Recipe data is stored in small, category-specific JSON files. When working with an AI assistant, only provide the relevant category file (e.g., `data/categories/chicken.json`) to save tokens and maintain high context quality.
