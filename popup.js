// Copyright 2016 José Varela

var $aLoadMore = null;
var pager = 0;
var term = '';

document.addEventListener('DOMContentLoaded', function () {
  $('#f-search').on('submit', searchTerm.bind(null, undefined));
  $aLoadMore = $('a[name="#loadMore"]');

  $(window).on('scroll', debounce(loadMore, 500));
}, false);

function searchTerm(offset, event) {
  offset = (offset) ? parseInt(offset) : undefined;
  var qsOffset = '';

  if (event) {
    term = event.currentTarget.term.value;
    term = term.replace(' ', '+');
    pager = 0;
  } else {
    qsOffset = '&offset=' + offset;
  }

  $.get('http://api.giphy.com/v1/gifs/search?q=' + term + qsOffset + '&api_key=dc6zaTOxFJmzC')
    .then(handleGiffyApi.bind(null, !!offset))
    .catch(function () {
      pager = -1;
      $('#error-message').html('Service Unavailable');
    });

  return false;
}

function handleGiffyApi(append, jsonRsp) {
  if (jsonRsp.data) {
    if (jsonRsp.data.length == 0) {
      pager = -1;
      $('#error-message').html('Sorry. No results!');
      return false;
    }
    if (!append) {
      $('.gifs-wrapper').html('<p>Click on image to copy the link</p>');
    }

    jsonRsp.data.forEach(function (gif) {
      var gifUrl = gif.images.downsized_medium.url;
      var $gif = $('<img src="' + gifUrl + '" class="w400"/> <hr />');

      $gif.on('click', handleGifClick);

      $('.gifs-wrapper').append($gif);
    });

  } else {
    pager = -1;
    $('#error-message').html('Can\'t handle the response');
  }
};

function handleGifClick(event) {
  var url = event.currentTarget.src;
  $('#clipboard').val('');
  if (url) {
    $('#clipboard').val(url);
    $('#clipboard').select();
    document.execCommand('copy');
    $('.alert-message').toggleClass('nodisplay');
    setTimeout(function () {
      $('.alert-message').toggleClass('nodisplay');
    }, 2000);
  }
};

function loadMore() {
  if ($(window).scrollTop() > $aLoadMore.offset().top) {
    pager += 25;
    if (pager > 0) {
      searchTerm(pager, undefined);
    }
  }
}

function debounce(func, wait, immediate) {
  var timeout;
  return function () {
    var context = this;
    var args = arguments;
    var later = function () {
      timeout = null;
      if (!immediate) {
        func.apply(context, args);
      }
    };

    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};
