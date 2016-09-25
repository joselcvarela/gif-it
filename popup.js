// Copyright 2016 José Varela

var $aLoadMore;
var $errorMessage;
var $gifsWrapper;
var $gifWrapperTemplate;
var pager = 0;
var term = '';
var initTerms = ["cute", "shocked", "suprised", "angry", "hungry", "funny", "hilarious", "omg", "wtf", "nigga", "insult", "offended", "no way", "psycho", "beauty", "love", "peace", "hate", "evil", "metal", "dance", "scream", "hurry"];

document.addEventListener('DOMContentLoaded', function () {
  $('#f-search').on('submit', searchTerm.bind(null, undefined));
  $(window).on('scroll', debounce(loadMore, 500));

  // document.oncontextmenu =
  // document.body.oncontextmenu = function () { return false; }

  $aLoadMore = $('a[name="#loadMore"]');
  $errorMessage = $('#error-message');
  $gifsWrapper = $('.gifs-wrapper');
  $gifWrapperTemplate = $($('#image-template').html());

  addExamplesToHome(6);
}, false);

function addExamplesToHome(totalExamples) {
  var randNum = 0;
  var randNums = [];
  for(var i = 0; i < totalExamples; i++) {
    do {
      randNum = randInt(0, initTerms.length)
    } while(randNums.indexOf(randNum) > -1);

    randNums[i] = randNum;

    searchTerm({ random: true }, initTerms[randNums[i]]);
  }
}

function searchTerm(opts, event) {
  var qs = '';
  var path = 'search';
  var paramSearch = 'q';

  for(var param in opts) {
    if(param == 'random' && opts[param]) {
      path = 'random';
      paramSearch = 'tag';
    } else {
       qs = '&' + param + '=' + opts[param];
    }
  }

  if (event) {
    $errorMessage.html('');
    $gifsWrapper.html('');
    term = (typeof(event) == 'string') ? event : event.currentTarget.term.value;
    term = term.replace(' ', '+');
    pager = 0;
    //Show only first results
    // $.get('http://www.reactiongifs.com/?s=' + term)
    //   .then( function(htmlRsp) {
    //     handleReactiongifApi(htmlRsp);
    //   })
    //   .catch(function () {
    //     $errorMessage.html('[Reactiongif] Service Unavailable');
    //   });
  }

  $('.spinner').show();

  $.get('http://api.giphy.com/v1/gifs/' + path + '?' + paramSearch + '=' + term + qs + '&api_key=dc6zaTOxFJmzC')
    .then(handleGiffyApi)
    .catch(function () {
      pager = -1;
      $errorMessage.html('[Giphy] Service Unavailable');
    })
    .always(function () {
      $('.spinner').hide();
    });

  return false;
}


function handleReactiongifApi(htmlRsp) {
  var $imgsReactiongif = $(htmlRsp).find('.entry img');
  var imgsReactionGif = [];
  $imgsReactiongif.each(function() {
    imgsReactionGif.push(this.src);
  });
  imgsReactionGif.forEach(function (gifUrl) {
    var $gifWrapper = $gifWrapperTemplate.clone();
    var $gif = $gifWrapper.find('.gif');
    $gif.attr('src', gifUrl);

    $gifWrapper.on('click', handleGifClick);

    $gifsWrapper.append($gifWrapper);
  });
}

function handleGiffyApi(jsonRsp) {
  if (jsonRsp.data) {
    if (jsonRsp.data.length == 0) {
      pager = -1;
      $errorMessage.html('Sorry. No results!');
      return false;
    } else if (jsonRsp.data.length > 0) {
      jsonRsp.data.forEach(function (gif) {
        putGifsOnWrapper(gif.images.downsized_medium.url);
      });
    } else if (jsonRsp.data.image_original_url) {
      putGifsOnWrapper(jsonRsp.data.image_original_url);
    }

  } else {
    pager = -1;
    $errorMessage.html('Can\'t handle the response');
  }
};

function putGifsOnWrapper(gifUrl) {
    var $gifWrapper = $gifWrapperTemplate.clone();
    var $gif = $gifWrapper.find('.gif');
    $gif.attr('src', gifUrl);

    $gifWrapper.on('click', handleGifClick);

    $gifsWrapper.append($gifWrapper);
}

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
      searchTerm({ offset: pager }, undefined);
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

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
