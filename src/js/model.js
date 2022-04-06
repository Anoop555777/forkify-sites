import { async } from 'regenerator-runtime';
import { API_URL } from './config.js';
import { PER_PAGE } from './config.js';
//import { getJSON, sendJSON} from './helpers.js';
import { AJAX } from './helpers.js';
import { generatedKey } from './config.js';
export const state = {
  recipe: {},
  search: {
    query: '',
    results: [],
    page: 1,
    resultsPerPage: PER_PAGE,
  },
  bookmark: [],
};
//hello
const createRecipeObject = function (data) {
  const { recipe } = data.data;
  return {
    id: recipe.id,
    title: recipe.title,
    publisher: recipe.publisher,
    sourceUrl: recipe.source_url,
    cooking_time: recipe.cooking_time,
    image: recipe.image_url,
    servings: recipe.servings,
    //cookingTime: recipe.cooking_time,
    ingredients: recipe.ingredients,
    ...(recipe.key && { key: recipe.key }),
  };
};
export const loadRecipe = async function (id) {
  try {
    //1 loading resipes
    const data = await AJAX(`${API_URL}/${id}?key=${generatedKey}`);
    //need to remove underscore from data
    //let recipe=data.data.recipe; since we are distruction object we not need recipes
    state.recipe = createRecipeObject(data);
    if (state.bookmark.some(b => b.id === state.recipe.id))
      state.recipe.bookmarked = true;
    else state.recipe.bookmarked = false;
  } catch (err) {
    throw err;
  }
};

export const loadSearchResults = async function (query) {
  try {
    state.search.query = query;
    const data = await AJAX(`${API_URL}?search=${query}&key=${generatedKey}`);
    state.search.results = data.data.recipes.map(recipe => {
      return {
        id: recipe.id,
        title: recipe.title,
        publisher: recipe.publisher,

        image: recipe.image_url,
        ...(recipe.key && { key: recipe.key }),
      };

      //reset page to 1 for another load
    });

    state.search.page = 1;
  } catch (err) {
    throw err;
  }
};

export const showSearchResultPerPage = function (page = state.search.page) {
  state.search.page = page;
  const start = (page - 1) * state.search.resultsPerPage;
  const end = page * state.search.resultsPerPage;
  return state.search.results.slice(start, end);
};

export const updateServings = function (newServing) {
  state.recipe.ingredients.forEach(ing => {
    ing.quantity = (ing.quantity * newServing) / state.recipe.servings;
  });
  state.recipe.servings = newServing;
};

export const addBookmark = function (recipe) {
  //add bookmark
  state.bookmark.push(recipe);
  //mark current recipe of bookmark
  if (recipe.id === state.recipe.id) state.recipe.bookmarked = true;
  persistBookMark();
};

export const removeBookmark = function (id) {
  const index = state.bookmark.findIndex(el => el.id === id);
  state.bookmark.splice(index, 1);

  //not booked marked
  if (id === state.recipe.id) state.recipe.bookmarked = false;
  persistBookMark();
};

const persistBookMark = function () {
  localStorage.setItem('bookmark', JSON.stringify(state.bookmark));
};

const init = function () {
  const data = localStorage.getItem('bookmark');
  if (data) state.bookmark = JSON.parse(data);
};
init();

const createLocalStorage = function () {
  localStorage.clear();
};
//createLocalStorage();

export const uploadRecipe = async function (newRecipe) {
  try {
    const ingredients = Object.entries(newRecipe)
      .filter(entry => entry[0].startsWith('ingredient') && entry[1] !== '')
      .map(ing => {
        const ingArr = ing[1].split(',').map(el => trim());
        // const ingArr = ing[1].replaceAll(' ', '').split(',');
        if (ingArr.length !== 3)
          throw new Error('Wrong formet ! please use the correct format:');

        const [quantity, unit, description] = ingArr;
        return { quantity: quantity ? +quantity : null, unit, description };
      });
    const recipe = {
      title: newRecipe.title,
      source_url: newRecipe.sourceUrl,
      image_url: newRecipe.image,
      publisher: newRecipe.publisher,
      cooking_time: +newRecipe.cookingTime,
      servings: +newRecipe.servings,
      ingredients,
    };
    const data = await AJAX(`${API_URL}?key=${generatedKey}`, recipe);
    state.recipe = createRecipeObject(data);
    addBookmark(state.recipe);
  } catch (err) {
    throw err;
  }
};
