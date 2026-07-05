/* Named subsets of the existing category keys. Because every locale in
 * src/i18n/locales/categories.*.json already translates each key, packs need
 * no per-locale content — they just filter to a curated subset. */

const CLASSIC_PACK_ID = 'classic';

interface CategoryPack {
  id: string;
  labelKey: string;
  /* Empty list means "every category" (Classic). */
  keys: readonly string[];
}

const FOODIE_KEYS = [
  'Foods',
  'Fruits',
  'Vegetables',
  'Candy / Sweets',
  'Beverages',
  'Pizza Toppings',
  'Types of Cheese',
  'Breakfast Foods',
  'Spicy Foods',
  'Spices/Herbs',
  'Sandwiches',
  'Kinds of Soup',
  'Desserts',
  'Junk Food',
  'Diet Foods',
  'Seafood',
  'Dairy Products',
  'Ethnic Foods',
  'Menu Items',
  'Ice Cream Flavors',
  'Kitchen Things',
  'Utensils',
  'Raw Foods',
  'Beers',
  'Fast Food Chains',
  'Restaurants',
  'Grocery Items',
  'Fridge Items',
  'Green Foods',
];

const POP_CULTURE_KEYS = [
  'Movies',
  'TV Shows',
  'Famous People',
  'Fictional Characters',
  'Superheroes',
  'Cartoon Characters',
  'Celebrities',
  'Book Titles',
  'Authors',
  'Song Titles',
  'Christmas Songs',
  'Video Games',
  'Board Games',
  'Instruments',
  'Music Genres',
  'Musical Groups',
  'TV Stars',
  "Children's Books",
  'Magazines',
  'Awards',
  'Halloween Costumes',
  'Villains/Monsters',
  'Heroes',
  'Fairy Tale Figures',
  'Duos & Trios',
  'Dance Styles',
];

const TRAVEL_KEYS = [
  'Countries',
  'Cities',
  'U.S. Cities',
  'Foreign Cities',
  'States',
  'Capitals',
  'Tropical Places',
  'Vacation Spots',
  'Honeymoon Spots',
  'European Places',
  'Tourist Attractions',
  'Bodies of Water',
  'Map Features',
  'Parks',
  'Park Things',
  'Modes of Transport',
  'Vehicles',
  'Types of Cars',
  'Suitcase Items',
  'Travel Items',
  'Beach Things',
];

const KIDS_KEYS = [
  'Animals',
  'Farm Animals',
  'Birds',
  'Fish',
  'Insects',
  'Reptiles/Amphibians',
  'Fruits',
  'Vegetables',
  'Colors',
  'Toys',
  'Board Games',
  'Card Games',
  'Breakfast Foods',
  'Ice Cream Flavors',
  'Candy / Sweets',
  'Fairy Tale Figures',
  'Cartoon Characters',
  'Superheroes',
  'Instruments',
  'School Subjects',
  'School Supplies',
  'Park Things',
  'Beach Things',
  'Things in Space',
  'Mythical Beasts',
  'Dance Styles',
  'Sports',
  'Plants & Flowers',
  'Flowers',
  'Trees',
  'Growing Things',
  'Morning Habits',
  'Outdoor Things',
  'Weather Types',
  'Indoor Activities',
  'Outdoor Activities',
  "A Boy's Name",
  "A Girl's Name",
];

const HOUSEHOLD_KEYS = [
  'Kitchen Things',
  'Bathroom Things',
  'Bedroom Things',
  'Office Things',
  'Desk Items',
  'Furniture',
  'Appliances',
  'Chores',
  'Tools',
  'Utensils',
  'Things in a Bag',
  'Medicine Cabinet',
  'Fridge Items',
  'Wallet Items',
  'Gadgets',
  'Computer Parts',
  'Things With Remotes',
  'Things You Plug In',
  'Wireless Things',
  'School Supplies',
  'Items in This Room',
  'Suitcase Items',
  'Cosmetics',
];

const PACKS: readonly CategoryPack[] = Object.freeze([
  {
    id: CLASSIC_PACK_ID,
    labelKey: 'packs.classic.label',
    keys: [],
  },
  {
    id: 'foodie',
    labelKey: 'packs.foodie.label',
    keys: FOODIE_KEYS,
  },
  {
    id: 'pop-culture',
    labelKey: 'packs.popCulture.label',
    keys: POP_CULTURE_KEYS,
  },
  {
    id: 'travel',
    labelKey: 'packs.travel.label',
    keys: TRAVEL_KEYS,
  },
  {
    id: 'kids',
    labelKey: 'packs.kids.label',
    keys: KIDS_KEYS,
  },
  {
    id: 'household',
    labelKey: 'packs.household.label',
    keys: HOUSEHOLD_KEYS,
  },
]);

function getPackById(id: string): CategoryPack | undefined {
  return PACKS.find((pack) => pack.id === id);
}

/* Returns the categories in the pack, filtered to keys present in `allKeys`
 * (the full set of keys resolved from the active locale's categories JSON).
 * For the Classic pack or an unknown pack, returns all keys. */
function getPackCategories(packId: string, allKeys: readonly string[]): string[] {
  const pack = getPackById(packId);
  if (!pack || pack.keys.length === 0) {
    return [...allKeys];
  }
  const available = new Set(allKeys);
  return pack.keys.filter((key) => available.has(key));
}

export type { CategoryPack };
export { CLASSIC_PACK_ID, getPackById, getPackCategories, PACKS };
