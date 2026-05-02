# Recipe Extraction and Categorization Plan

## 1. Objective
Transform the exported `recipes.html` from RecipeKeeper into structured JSON data. Filter for "Main Dish" courses with ratings, check for specific ingredients, and organize into JSON files based on the requested meal rotation categories.

## 2. JSON Schema Design
For each recipe extracted, we will use the following JSON structure:

```json
{
  "id": "String (UUID extracted from <meta itemprop=\"recipeId\">)",
  "name": "String (<h2 itemprop=\"name\">)",
  "courses": ["String (Array of <span itemprop=\"recipeCourse\">)"],
  "categories": ["String (Array of <meta itemprop=\"recipeCategory\">)"],
  "rating": "Number (extracted from <meta itemprop=\"recipeRating\">)",
  "ingredients": ["String (Array from <div itemprop=\"recipeIngredients\"><p>)"],
  "directions": "String (Text from <div itemprop=\"recipeDirections\">)",
  "notes": "String (Text from <div itemprop=\"recipeNotes\">)",
  "mapped_rotation_category": "String (The final category this recipe falls into based on our logic)"
}
```

## 3. Category Mapping Logic
The user has requested the following meal rotation categories:
- Bean & vegetarian
- Chicken
- Fish
- Bean & beef
- Vegetarian
- Pork
- Beef

To map the existing HTML categories and ingredients to these rotation categories, the extraction script will apply the following rules to recipes where `course` includes "Main Dish":

1. **Chicken**: If `categories` includes "Chicken" or `ingredients` include "chicken".
2. **Fish**: If `categories` includes "Fish" or `ingredients` include fish/seafood terms.
3. **Pork**: If `categories` includes "Pork".
4. **Bean & Beef**: If `categories` includes "Beef" AND "Bean".
5. **Beef**: If `categories` includes "Beef" (and not Bean).
6. **Bean & Vegetarian**: If `categories` includes "Bean" AND "Vegetarian".
7. **Vegetarian**: If `categories` includes "Vegetarian" (and not Bean).

*Note: For ingredients like pasta, soup, butternut squash, and sweet potato mentioned by the user, we can either append them as tags to the recipe objects, or create separate sub-categories or boolean flags in the JSON (e.g., `has_pasta: true`).*

## 4. Extraction Steps (For Implementation in `code` mode)

1. **Parse the HTML:**
   - Use a robust HTML parser (like `cheerio` in Node.js or `BeautifulSoup` in Python).
   - Iterate over each `<div class="recipe-details">`.

2. **Extract Data:**
   - For each recipe block, extract ID, name, courses, categories, rating, ingredients, directions, and notes based on the `itemprop` attributes and tags.

3. **Filter:**
   - Keep only recipes where `courses` includes "Main Dish".
   - Keep only recipes that have a valid `rating` (e.g., `rating > 0`).

4. **Map to Rotation Categories:**
   - Apply the mapping logic defined in Section 3 to determine the `mapped_rotation_category`.
   - Identify specific requested ingredients (pasta, soup, beans, chicken, butternut squash, sweet potato) using regex on the `ingredients` array and add boolean flags to the JSON object if needed.

5. **Export to JSON:**
   - Group the filtered and mapped recipes by their `mapped_rotation_category`.
   - Write the grouped data into separate JSON files (e.g., `chicken.json`, `beef.json`, `vegetarian.json`) in a designated output directory.
