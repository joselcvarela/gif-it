// Copyright 2016 José Varela

var $aLoadMore;
var $errorMessage;
var $gifsHomeWrapper;
var $gifWrapperTemplate;
var $historyTabTemplate;
let $historyGifsWrapper;
var $homeTemplate;
var pager = 0;
var term = '';
const initTerms = [
  "cute", "shocked", "suprised", "angry", "hungry", "funny", "hilarious", "omg",
  "wtf", "nigga", "insult", "offended", "no way", "psycho", "beauty", "love",
  "peace", "hate", "evil", "metal", "dance", "scream", "hurry"
];

document.addEventListener('DOMContentLoaded', function () {
  $('#f-search').on('submit', searchTerm.bind(null, {}));
  $(window).on('scroll', debounce(loadMore, 500));
  $('.open-tab').on('click', openTab);
  $('#clear-history').on('click', clearHistory);
  if (!window.localStorage.history) window.localStorage.history = '[]';

  // document.oncontextmenu =
  // document.body.oncontextmenu = function () { return false; }

  $aLoadMore = $('a[name="#loadMore"]');
  $errorMessage = $('#error-message');
  $gifsHomeWrapper = $('.tab-home').find('.gifs-wrapper');
  $gifWrapperTemplate = $($('#image-template').html());
  $historyTabTemplate = $('.tab-history');
  $historyGifsWrapper = $historyTabTemplate.find('.gifs-wrapper');
  $homeTemplate = $($('.tab-home').html());

  addExamplesToHome(6);
}, false);

function clearHistory(e) {
  window.localStorage.history = '[]';
  $historyGifsWrapper.html('');
}

function addExamplesToHome(totalExamples) {
  var randNum = 0;
  var randNums = [];
  for(var i = 0; i < totalExamples; i++) {
    do {
      randNum = randInt(0, initTerms.length)
    } while(randNums.indexOf(randNum) > -1);

    randNums[i] = randNum;

    searchTerm({ random: initTerms[randNums[i]] });
  }
}

function searchTerm(opts, event) {
  var qs = '';
  var path = 'search';
  var paramSearch = 'q';

  for(var param in opts) {
    switch (param) {
      case 'random':
        path = 'random';
        paramSearch = 'tag';
      break;

      default:
        qs = '&' + param + '=' + opts[param];
    }
  }

  if (event) {
    $errorMessage.html('');
    $gifsHomeWrapper.html('');
    term = (typeof(event) === 'string') ? event : event.currentTarget.term.value;
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

  $.get(`http://api.giphy.com/v1/gifs/${path}?${paramSearch}=${term}${qs}&api_key=dc6zaTOxFJmzC`)
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

    $gifsHomeWrapper.append($gifWrapper);
  });
}

function handleGiffyApi(jsonRsp) {
  if (jsonRsp.data) {
    if (jsonRsp.data.length == 0) {
      pager = -1;
      $errorMessage.html('Sorry. No results!');
      return false;
    }
    const data = (jsonRsp.data instanceof Array) ? jsonRsp.data : [jsonRsp.data];
    data.forEach((gif, index) => {
      var gifUrl;
      try {
        gifUrl = gif.images.downsized_medium.url;
      } catch (e) {
        gifUrl = gif.fixed_width_downsampled_url;
      }
      var $gifWrapper = $gifWrapperTemplate.clone();
      $gifWrapper.attr('data-key', pager++);
      var $gif = $gifWrapper.find('.gif');
      $gif.attr('src', gifUrl);

      $gifWrapper.on('click', handleGifClick);

      $gifsHomeWrapper.append($gifWrapper);
    });

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

    $gifsHomeWrapper.append($gifWrapper);
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

    const history = JSON.parse(window.localStorage.history);
    if (history.indexOf(url) === -1) history.push(url);
    window.localStorage.history = JSON.stringify(history);

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

function openTab(e) {
  tabName = $(e.currentTarget).data('tab');
  if (tabName === 'history') buildHistoryTab(tabName);

  $('.active-tab').hide();
  $(`.tab-${tabName}`).addClass('active-tab').show();
}

function buildHistoryTab(tabName) {
  const history = JSON.parse(window.localStorage.history);

  if ($historyGifsWrapper.children().length === history.length)
    return;

  $historyGifsWrapper.html('');
  history.reverse().forEach((gifUrl, idx) => {
    const $gifWrapper = $gifWrapperTemplate.clone();
    const $check = $gifWrapper.find('.remove');
    $check.removeClass('hide');
    const $gif = $gifWrapper.find('.gif');
    $gif.attr('src', gifUrl);

    $gifWrapper.find('.btn-remove').on('click', removeFromHistory.bind(this, gifUrl, $gifWrapper));
    $gifWrapper.find('.image-wrapper').on('click', handleGifClick);

    $historyGifsWrapper.append($gifWrapper);
  });

  return $historyTabTemplate;
}

function removeFromHistory(url, $toRemove, ev){
  const history = JSON.parse(window.localStorage.history);
  const indexToRemove = history.indexOf(url)
  history.splice(url, 1);
  $toRemove.remove();
}
