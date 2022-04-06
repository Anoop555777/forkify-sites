import * as model from './model.js';
import recipeView from './views/recipeView.js';
import searchView from './views/searchView.js';
import resultView from './views/resultView.js';
import bookmarksView from './views/bookmarksView.js';
import addrecipeView from './views/addrecipeView.js';
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { async } from 'regenerator-runtime/runtime';
import paginationView from './views/paginationView.js';
// if (module.hot) {
//   module.hot.accept();
// }

const recipeContainer = document.querySelector('.recipe');

const timeout = function (s) {
  return new Promise(function (_, reject) {
    setTimeout(function () {
      reject(new Error(`Request took too long! Timeout after ${s} second`));
    }, s * 1000);
  });
};

// https://forkify-api.herokuapp.com/v2

///////////////////////////////////////

const controlRecipe = async function () {
  try {
    const id = window.location.hash.slice(1);
    if (!id) return;
    recipeView.renderSpinner();

    //0  result view to mark selected
    resultView.update(model.showSearchResultPerPage());
    //1 load recipe from model
    await model.loadRecipe(id);
    const { recipe } = model.state;

    //2 ui rendering of recipe
    recipeView.render(recipe);
    bookmarksView.update(model.state.bookmark);
  } catch (err) {
    recipeView.renderError();
  }
};

const controlSearchResults = async function () {
  try {
    resultView.renderSpinner();
    //1 get search query
    const query = searchView.getQuery();

    if (!query) throw Error;
    //2 load search query
    await model.loadSearchResults(query);

    //3 render results

    resultView.render(model.showSearchResultPerPage());

    //4 render pagging

    paginationView.render(model.state.search);
  } catch (err) {
    console.log(err);
    resultView.renderError();
  }
};
const controlSearchPagition = function (goToPage) {
  //1 render new results

  resultView.render(model.showSearchResultPerPage(goToPage));

  //2 render pagging

  paginationView.render(model.state.search);
};

const controlServings = function (newServing) {
  //update serving
  model.updateServings(newServing);

  //view again
  // recipeView.render(model.state.recipe);
  recipeView.update(model.state.recipe);
};

const controlAddBookmark = function () {
  //add and remove book marks
  if (!model.state.recipe.bookmarked) model.addBookmark(model.state.recipe);
  else model.removeBookmark(model.state.recipe.id);
  //update recipe view
  recipeView.update(model.state.recipe);

  //3 render bookmarks
  bookmarksView.render(model.state.bookmark);
};

const controlBookmark = function () {
  bookmarksView.render(model.state.bookmark);
};

const controlAddRecipe = async function (newRecipe) {
  try {
    addrecipeView.renderSpinner();
    await model.uploadRecipe(newRecipe);

    //render recipe
    recipeView.render(model.state.recipe);

    //display success message
    addrecipeView.renderMessage();
    bookmarksView.render(model.state.bookmark);

    //change id in url
    window.history.pushState(null, '', `#${model.state.recipe.id}`);
    //close model windows
    setTimeout(() => {
      addrecipeView._toggleWindow();
    }, 2500);
  } catch (err) {
    addrecipeView.renderError(err.message);
  }
};
const init = function () {
  bookmarksView.addHandlerRender(controlBookmark);
  recipeView.addHandlerRender(controlRecipe);
  recipeView.addHandlerServing(controlServings);
  searchView.addHandlerSearch(controlSearchResults);
  paginationView.addHandlerClick(controlSearchPagition);
  recipeView.addHandleBookmark(controlAddBookmark);
  addrecipeView.uploadForm(controlAddRecipe);
};
init();
