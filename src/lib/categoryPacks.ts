/* Named subsets of the existing category keys. Because every locale in
 * src/i18n/locales/categories.*.json already translates each key, packs need
 * no per-locale content — they just filter to a curated subset. */

const CLASSIC_PACK_ID = 'classic';

interface CategoryPack {
  id: string;
  labelKey: string;
  fallbackLabel: string;
  descriptionKey: string;
  fallbackDescription: string;
  /* Empty list means "every category" (Classic). */
  keys: readonly string[];
}

const FOODIE_KEYS = [
  'Foods',
  'Fruits',
  'Vegetables',
  'Candy / Sweets',
  'Drinks / Beverages',
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
  'Things in a Kitchen',
  'Items in a Kitchen',
  'Cooking Utensils',
  'Kinds of Candy',
  'Foods You Eat Raw',
  'Beers',
  'Types of Drinks',
  'Types of Drink',
  'Restaurants / Fast Food Chains',
  'Restaurants',
  'Things in a Grocery Store',
  'Items in a Refrigerator',
  'Food/Drink That Is Green',
];

const POP_CULTURE_KEYS = [
  'Movies',
  'TV Shows',
  'T.V. Shows',
  'Famous People',
  'Fictional Characters',
  'Superheroes',
  'Cartoon Characters',
  'Celebrities',
  'Book Titles',
  'Books or Authors',
  'Authors',
  'Movie Titles',
  'Song Titles',
  'Christmas Songs',
  'Video Games',
  'Board Games',
  'Musical Instruments',
  'Types of Music Genres',
  'Musical Groups',
  'Television Stars',
  'Childrens Books',
  'Magazines',
  'Awards/Ceremonies',
  'Halloween Costumes',
  'Villains/Monsters',
  'Heroes',
  'Fairy Tale / Story Characters',
  'Famous Duos and Trios',
  'Dance Styles',
  'Kinds of Dances',
];

const TRAVEL_KEYS = [
  'Countries',
  'Cities',
  'U.S. Cities',
  'Foreign Cities',
  'States',
  'Capitals',
  'Tropical Locations',
  'Vacation Spots',
  'Honeymoon Spots',
  'Places in Europe',
  'Tourist Attractions',
  'Bodies of Water',
  'Things Found on a Map',
  'Parks',
  'Things in a Park',
  'Modes of Transport',
  'Methods of Transportation',
  'Vehicles',
  'Cars',
  'Types of Cars',
  'Items in a Suitcase',
  'Items You Take on a Trip',
  'Things at the Beach',
  'Things on a Beach',
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
  'Games',
  'Board Games',
  'Card Games',
  'Breakfast Foods',
  'Ice Cream Flavors',
  'Candy / Sweets',
  'Fairy Tale / Story Characters',
  'Cartoon Characters',
  'Superheroes',
  'Musical Instruments',
  'School Subjects',
  'School Supplies',
  'Things in a Park',
  'Things at the Beach',
  'Things in Space',
  'Mythological Creatures',
  'Dance Styles',
  'Sports',
  'Plants / Flowers',
  'Flowers',
  'Trees',
  'Things That Grow',
  'Things You Do in the Morning',
  'Things You Find Outside',
  'Types of Weather',
  'Indoor Activities',
  'Outdoor Activities',
  "A Boy's Name",
  "A Girl's Name",
];

const HOUSEHOLD_KEYS = [
  'Things in a Kitchen',
  'Items in a Kitchen',
  'Things in a Bathroom',
  'Things in a Bedroom',
  'Things in an Office',
  'Things Found in a Desk',
  'Furniture',
  'Appliances',
  'Household Chores',
  'Tools',
  'Cooking Utensils',
  'Things in a Bag',
  'Things in a Medicine Cabinet',
  'Items in a Refrigerator',
  'Items in Your Purse/Wallet',
  'Electronic Gadgets',
  'Computer Parts',
  'Things That Use a Remote',
  'Things You Plug In',
  'Wireless Things',
  'School Supplies',
  'Items in This Room',
  'Items in a Suitcase',
  'Cosmetics/Toiletries',
];

const PACKS: readonly CategoryPack[] = Object.freeze([
  {
    id: CLASSIC_PACK_ID,
    labelKey: 'packs.classic.label',
    fallbackLabel: 'Classic',
    descriptionKey: 'packs.classic.description',
    fallbackDescription: 'Every category — the full deck.',
    keys: [],
  },
  {
    id: 'foodie',
    labelKey: 'packs.foodie.label',
    fallbackLabel: 'Foodie',
    descriptionKey: 'packs.foodie.description',
    fallbackDescription: 'Dishes, drinks, ingredients, and kitchens.',
    keys: FOODIE_KEYS,
  },
  {
    id: 'pop-culture',
    labelKey: 'packs.popCulture.label',
    fallbackLabel: 'Pop Culture',
    descriptionKey: 'packs.popCulture.description',
    fallbackDescription: 'Movies, TV, music, celebrities, books.',
    keys: POP_CULTURE_KEYS,
  },
  {
    id: 'travel',
    labelKey: 'packs.travel.label',
    fallbackLabel: 'Travel',
    descriptionKey: 'packs.travel.description',
    fallbackDescription: 'Places, transport, and everything in a suitcase.',
    keys: TRAVEL_KEYS,
  },
  {
    id: 'kids',
    labelKey: 'packs.kids.label',
    fallbackLabel: 'Kids',
    descriptionKey: 'packs.kids.description',
    fallbackDescription: 'Friendly categories for younger players.',
    keys: KIDS_KEYS,
  },
  {
    id: 'household',
    labelKey: 'packs.household.label',
    fallbackLabel: 'Around the House',
    descriptionKey: 'packs.household.description',
    fallbackDescription: 'Rooms, tools, furniture, and gadgets.',
    keys: HOUSEHOLD_KEYS,
  },
]);

function getPackIds(): string[] {
  return PACKS.map((pack) => pack.id);
}

function isValidPackId(id: string): boolean {
  return PACKS.some((pack) => pack.id === id);
}

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
export { CLASSIC_PACK_ID, getPackById, getPackCategories, getPackIds, isValidPackId, PACKS };
