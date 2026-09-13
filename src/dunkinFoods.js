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

const starbucksItems = [
  ['Starbucks Pike Place Roast Coffee (Grande, black)', 5, 1, 1, 0, 473],
  ['Starbucks Cold Brew Coffee (Grande, black)', 5, 0, 1, 0, 473],
  ['Starbucks Caffe Latte (Grande, 2% milk)', 190, 13, 18, 7, 473],
  ['Starbucks Caramel Macchiato (Grande, 2% milk)', 250, 10, 35, 7, 473],
  ['Starbucks Vanilla Sweet Cream Cold Brew (Grande)', 110, 1, 14, 5, 473],
  ['Starbucks Caffe Mocha (Grande, 2% milk)', 370, 14, 43, 15, 473],
  ['Starbucks Strawberry Açaí Refresher (Grande)', 90, 0, 21, 0, 473],
  ['Starbucks Spinach, Feta & Egg White Wrap', 290, 19, 34, 8, 116],
  ['Starbucks Bacon, Gouda & Egg Sandwich', 360, 19, 35, 18, 139],
  ['Starbucks Blueberry Scone', 380, 6, 53, 16, 113],
]

const creamerItems = [
  ['International Delight French Vanilla Creamer (1 tbsp)', 20, 0, 5, 1, 15],
  ['International Delight Hazelnut Creamer (1 tbsp)', 20, 0, 5, 1, 15],
  ['Coffee mate Original Liquid Creamer (1 tbsp)', 20, 0, 2, 1, 15],
  ['Coffee mate French Vanilla Liquid Creamer (1 tbsp)', 20, 0, 5, 1, 15],
  ['Coffee mate Italian Sweet Creme Liquid Creamer (1 tbsp)', 35, 0, 5, 2, 15],
  ['Califia Farms Unsweetened Almondmilk Creamer (1 tbsp)', 10, 0, 1, 0.5, 15],
  ['Chobani Sweet Cream Coffee Creamer (1 tbsp)', 35, 0, 5, 1.5, 15],
  ['Oatly Barista Edition Oatmilk (1/2 cup)', 140, 3, 16, 7, 120],
]

function toFood([product_name, calories, protein, carbs, fat, serving_quantity], code, brands) {
  return {
    code,
    product_name,
    brands,
    serving_quantity,
    nutriments: {
      'energy-kcal_100g': calories / serving_quantity * 100,
      proteins_100g: protein / serving_quantity * 100,
      carbohydrates_100g: carbs / serving_quantity * 100,
      fat_100g: fat / serving_quantity * 100,
    },
  }
}

export const dunkinFoods = dunkinItems.map((item, index) => toFood(item, `dunkin-${index + 1}`, 'Dunkin'))
export const starbucksFoods = starbucksItems.map((item, index) => toFood(item, `starbucks-${index + 1}`, 'Starbucks'))
export const creamerFoods = creamerItems.map((item, index) => toFood(item, `creamer-${index + 1}`, 'Creamers'))
export const localFoods = [...dunkinFoods, ...starbucksFoods, ...creamerFoods]
