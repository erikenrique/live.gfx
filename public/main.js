new DataTable('#example');

let edit = document.querySelectorAll('.fa-edit');
let trash = document.querySelectorAll('.fa-trash-o');
const searchInput = document.querySelector('#movie-search');
const suggestionsList = document.querySelector('#movie-suggestions');
const movieTitleInput = document.querySelector('#movie-title');
const posterImage = document.querySelector('#movie-poster');


// ADD MOVIE POPUP
document.querySelector('#add-movie-button').addEventListener('click', () => {
  const addForm = document.getElementById('add-movie-form-window');
  const popup = document.querySelector('.popup');
  const overlay = document.querySelector('.overlay');

  popup.innerHTML = '';
  popup.appendChild(addForm);
  addForm.classList.remove('hidden');
  overlay.style.display = 'block';
  popup.style.display = 'block';
});


// MOVIE SEARCH - Fill suggestions, handle when a suggestion is clicked

searchInput.addEventListener('input', () => {

  // Clear suggestions if the input is empty
  if (!searchInput.value.trim()) {
    suggestionsList.innerHTML = '';
    posterImage.style.display = 'none';
    return;
  }

  // fetch movie suggestions from the API
  fetch(`/search-movies?q=${encodeURIComponent(searchInput.value.trim())}`)
    .then((response) => {
      if (!response.ok) {
        throw error(`Error getting search data response! ${response.status}`);
      }
      return response.json();
    })
    .then((movies) => {
      // clear suggestions list as soon as new data is received
      suggestionsList.innerHTML = '';

      // handle searches with no results
      if (!movies || movies.length === 0) {
        const noResults = document.createElement('li');
        noResults.className = 'list-group-item';
        noResults.textContent = 'No movies found :( Check your spelling?';
        suggestionsList.appendChild(noResults);
        return;
      }

      // populate suggestions when there's results
      movies.forEach((movie) => {
        const suggestionItem = document.createElement('li');
        suggestionItem.className = 'list-group-item';
        suggestionItem.textContent = movie.title;

        //  movie metadata! for using later...
        suggestionItem.dataset.movieId = movie.id
        suggestionItem.dataset.movieTitle = movie.title
        suggestionItem.dataset.moviePoster = movie.poster_path

        // add click listener to select the movie
        suggestionItem.addEventListener('click', () => {

          // populate hidden input and search field with the selected movie
          movieTitleInput.value = movie.title
          searchInput.value = movie.title
          document.querySelector('#poster-path').value = movie.poster_path || '';

          // poster preview
          if (movie.poster_path) {
            posterImage.src = `https://image.tmdb.org/t/p/w200${movie.poster_path}`
            posterImage.style.display = 'block'
          } else {
            posterImage.style.display = 'none'
          }

          // clear suggestions
          suggestionsList.innerHTML = ''
        });

        suggestionsList.appendChild(suggestionItem);
      });
    })
    .catch((err) => {
      console.error('Error fetching movie suggestions:', err);
    });
});


// EDIT MOVIE REVIEW - handle first click of edit movie button (prepopulate values)
edit.forEach((editButton) => {
  editButton.addEventListener('click', () => {
    const movieId = editButton.dataset.movieId;
    const movieTitle = editButton.dataset.movieTitle;
    const rating = editButton.dataset.rating;
    const review = editButton.dataset.review;

    const editForm = document.getElementById('edit-movie-form-window');

    editForm.querySelector('#edit-movie-id').value = movieId;
    editForm.querySelector('#edit-movie-title').value = movieTitle;
    editForm.querySelector('#edit-rating').value = rating;
    editForm.querySelector('#edit-review').value = review;

    const popup = document.querySelector('.popup');
    const overlay = document.querySelector('.overlay');

    /* 
    below was originally a function showPopup, but couldn't figure out how to 
    dynamically populate edit form with existing values. until figuring out,
    showing popup is built into each Add and Edit review event listener.
    */

    popup.innerHTML = '';

    // NOTE: appendChild moves an existing node/element (editForm) from its original position in DOM to new position (parent node popup).
    // this made clicking out of edit movie form originally bugged. accounted for by wrapping the edit form in a div tag (original-edit) and moving that form back to its original position

    popup.appendChild(editForm);
    editForm.classList.remove('hidden');
    overlay.style.display = 'block';
    popup.style.display = 'block';
  });
});

// EDIT MOVIE REVIEW - handle saving new information after inputting edited data
document.querySelector('#edit-movie-form').addEventListener('submit', (event) => {
  event.preventDefault();

  const movieId = document.querySelector('#edit-movie-id').value;
  const movieTitle = document.querySelector('#edit-movie-title').value;
  const rating = document.querySelector('#edit-rating').value;
  const review = document.querySelector('#edit-review').value;

  fetch(`/profile/edit-review`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      movie_id: movieId,
      movie_title: movieTitle,
      rating: rating,
      review: review,
    }),
  })
    .then((response) => {
      if (response.ok) {
        console.log('Review updated successfully');
        window.location.reload();
      } else {
        console.error('Failed to update the review');
      }
    })
    .catch((err) => console.error('Error:', err));
});


// DELETE MOVIE REVIEW

trash.forEach((trashButton) => {
  trashButton.addEventListener('click', () => {
    const movieId = trashButton.dataset.reviewId;

    console.log('Movie ID:', movieId);

    if (!movieId) {
      console.error('Movie ID is missing, check data-review-id');
      return;
    }

    const confirmDelete = confirm('Are you sure you want to delete this review?');
    if (confirmDelete) {

      // actually send delete request
      fetch(`/profile/delete-review/${movieId}`, {
        method: 'delete',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then((response) => {
          if (response.ok) {
            console.log('Review deleted');
            window.location.reload();
          }
        })
        .catch((err) => console.error('Error during deletion:', err));
    }
  });
});


// ADD COMMENTS TO MOVIE PAGE

document.querySelector('#comment-form').addEventListener('submit', (event) => {
  event.preventDefault();
  console.log(event.target)

  const form = event.target;
  const comment = form.querySelector('textarea[name="comment"]').value;
  const movieId = window.location.pathname.split('/').pop();
  // ^getting movie id from url path lol
  // https://stackoverflow.com/questions/16376438/get-path-and-query-string-from-url-using-javascript

  fetch(`/movie/${movieId}/comment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ comment }),
  })
    .then((response) => {
      if (response.ok) {
        const commentsList = document.querySelector('.comments ul');
        const newComment = document.createElement('li');
        newComment.textContent = comment;
        commentsList.appendChild(newComment);
        form.reset(); // Clear the form
      } else {
        console.error('Failed to post comment');
      }
    })
    .catch((err) => console.error('Error:', err));
});



// Close popup
function closePopup() {
  const popup = document.querySelector('.popup');
  const overlay = document.querySelector('.overlay');
  const editForm = document.getElementById('edit-movie-form-window');
  const originalContainer = document.getElementById('original-edit-form-container');

  if (popup && overlay) {
    overlay.style.display = 'none';
    popup.style.display = 'none';

    // move form back to orig location (because of appendChild usage for forms)
    if (originalContainer && editForm) {
      editForm.classList.add('hidden');
      originalContainer.appendChild(editForm);
    }

    popup.innerHTML = '';

  }
}

document.querySelector('.overlay').addEventListener('click', closePopup);
