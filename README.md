# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## USDA food search

Nutrition search includes 13,591 everyday-food records from the supplied
`FoodData_Central_csv_2026-04-30.zip`: Foundation, SR Legacy, and Survey (FNDDS).
The generated `public/data/usda-foods.json` is fetched on first search and cached
for the session (about 1.3 MB uncompressed). It is included in Vite builds and
requires no API key or database migration. Existing cafe foods and Open Food Facts
packaged-food search remain available. The archive's branded-food records and
laboratory sample records are not imported into this browser catalog.

USDA calories and macros are per 100 g; selection defaults to 100 g and changing
the serving weight scales the values. USDA descriptions retain preparation and
cut information. 103 records lacking at least one required macro/calorie value
were excluded rather than filling missing values with zero. Energy prefers
Atwater specific factors, then the standard kcal field, then general factors.

To refresh, extract `food.csv` and `food_nutrient.csv` from the USDA archive into
`.fdc-import/` (ignored by Git), then run from this project directory:

```sh
node scripts/import-usda.mjs .fdc-import
node --test scripts/food-search.test.mjs
npm run lint
npm run build
```

The importer also writes `public/data/usda-import.json` with record counts.
Update its release label when importing a different release. Deploy the resulting
build through the normal site deployment process to make the catalog live.
