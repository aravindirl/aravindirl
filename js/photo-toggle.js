(function () {
  var PHOTOS_KEY = 'hero-photos';
  var DEFAULT_PHOTOS = [
    { src: 'images/aravind.jpg', alt: 'Portrait of Aravind Ramachandran' },
    { src: 'images/aravind2.jpg', alt: 'Aravind second photo' }
  ];
  
  function getPhotos() {
    try {
      var stored = localStorage.getItem(PHOTOS_KEY);
      if (stored) {
        var parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) { /* ignore */ }
    return DEFAULT_PHOTOS;
  }

  function init() {
    var wrapper = document.querySelector('.hero-photo-wrapper');
    if (!wrapper) return;

    var photos = getPhotos();
    var toggleBtn = wrapper.querySelector('.photo-toggle');

    if (photos.length <= 1) {
      if (toggleBtn) toggleBtn.style.display = 'none';
      return;
    }

    // Create img elements dynamically based on number of photos
    var existingImgs = wrapper.querySelectorAll('.hero-photo');
    existingImgs.forEach(function(img) { img.remove(); });

    photos.forEach(function(photo, index) {
      var img = document.createElement('img');
      img.className = 'hero-photo';
      img.src = photo.src;
      img.alt = photo.alt;
      img.width = 1008;
      img.height = 1067;
      img.setAttribute('decoding', 'async');
      if (index > 0) {
        img.style.display = 'none';
      }
      wrapper.insertBefore(img, toggleBtn);
    });

    var imgElements = wrapper.querySelectorAll('.hero-photo');
    var currentIndex = 0;

    function showPhoto(index) {
      imgElements.forEach(function (img, i) {
        if (i === index) {
          img.style.display = 'block';
        } else {
          img.style.display = 'none';
        }
      });
      currentIndex = index;
    }

    function togglePhoto() {
      var nextIndex = (currentIndex + 1) % photos.length;
      showPhoto(nextIndex);
    }

    // Initialize first photo
    showPhoto(0);

    // Bind toggle button
    if (toggleBtn) {
      toggleBtn.addEventListener('click', togglePhoto);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
