// Copyright 2016 José Varela

var $aLoadMore;
var $errorMessage;
var $gifsWrapper;
var $gifWrapperTemplate;
var pager = 0;
var term = '';

document.addEventListener('DOMContentLoaded', function () {
  $('#f-search').on('submit', searchTerm.bind(null, undefined));

  // document.oncontextmenu =
  // document.body.oncontextmenu = function () { return false; }

  $aLoadMore = $('a[name="#loadMore"]');
  $errorMessage = $('#error-message');
  $gifsWrapper = $('.gifs-wrapper');
  $gifWrapperTemplate = $($('#image-template').html());

  $(window).on('scroll', debounce(loadMore, 500));
}, false);

function searchTerm(offset, event) {
  offset = (offset) ? parseInt(offset) : undefined;
  var qsOffset = '';

  if (event) {
    $errorMessage.html('');
    $gifsWrapper.html('');
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
      $errorMessage.html('Service Unavailable');
    });

  return false;
}

function handleGiffyApi(append, jsonRsp) {
  if (jsonRsp.data) {
    if (jsonRsp.data.length == 0) {
      pager = -1;
      $errorMessage.html('Sorry. No results!');
      return false;
    }
    if (!append) {
      $gifsWrapper.html('<p>Click on image to copy the link</p>');
    }

    jsonRsp.data.forEach(function (gif) {
      var gifUrl = gif.images.downsized_medium.url;
      var $gifWrapper = $gifWrapperTemplate.clone();
      var $gif = $gifWrapper.find('.gif');
      $gif.attr('src', gifUrl);

      $gifWrapper.on('click', handleGifClick);

      $gifsWrapper.append($gifWrapper);
    });

  } else {
    pager = -1;
    $errorMessage.html('Can\'t handle the response');
  }
};

function handleGifClick(event) {
  var $gif = $(event.currentTarget).find('.gif');
  var $shareIcon = $(event.currentTarget).find('.share .icon');
  var $shareMessage = $(event.currentTarget).find('.share .message');
  var url = $gif.attr('src');
  $('#clipboard').val('');
  if (url) {
    $('#clipboard').val(url);
    $('#clipboard').select();
    document.execCommand('copy');
    $shareIcon.hide();
    $shareMessage.fadeIn();
    setTimeout(function () {
      $shareMessage.hide();
      $shareIcon.fadeIn();
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
