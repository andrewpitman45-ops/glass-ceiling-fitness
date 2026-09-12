const dunkinItems = [
  ['Dunkin Original Glazed Donut', 270, 4, 31, 14, 61],
  ['Dunkin Boston Kreme Donut', 270, 4, 35, 11, 79],
  ['Dunkin Chocolate Frosted Donut', 260, 3, 32, 13, 61],
  ['Dunkin Glazed Munchkins (1)', 60, 1, 7, 3, 14],
  ['Dunkin Hash Browns', 110, 2, 15, 5, 57],
  ['Dunkin Bacon Egg and Cheese Croissant', 520, 21, 40, 31, 170],
  ['Dunkin Sausage Egg and Cheese Croissant', 700, 23, 41, 47, 190],
  ['Dunkin Bacon Egg and Cheese Wake-Up Wrap', 220, 11, 15, 12, 107],
  ['Dunkin Sausage Egg and Cheese Wake-Up Wrap', 290, 12, 15, 19, 113],
  ['Dunkin Medium Original Blend Coffee (Black)', 5, 0, 1, 0, 414],
  ['Dunkin Medium Cold Brew (Black)', 5, 0, 1, 0, 414],
  ['Dunkin Medium Iced Coffee (Black)', 5, 0, 1, 0, 414],
]

export const dunkinFoods = dunkinItems.map(([product_name, calories, protein, carbs, fat, serving_quantity], index) => ({
  code: `dunkin-${index + 1}`,
  product_name,
  brands: 'Dunkin',
  serving_quantity,
  nutriments: {
    'energy-kcal_100g': calories / serving_quantity * 100,
    proteins_100g: protein / serving_quantity * 100,
    carbohydrates_100g: carbs / serving_quantity * 100,
    fat_100g: fat / serving_quantity * 100,
  },
}))
