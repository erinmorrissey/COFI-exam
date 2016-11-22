$(document).ready(function() {

  // api credentials
  var apiUserID = 1110590645;
  var apiAuthToken = "175C663ABEF99B5AACE66DD06A296C30";
  var apiToken = "AppTokenForInterview";



  // element variables
  var $transactions = $('#transactions');
  var $monthlytotals = $('#monthlytotals');
  var $projected = $('#projected');
  var $avgspend = $('#avgspend');
  var $avgincome = $('#avgincome');



  // spinner specs
  var opts = {
    lines: 9 // The number of lines to draw
  , length: 26 // The length of each line
  , width: 17 // The line thickness
  , radius: 35 // The radius of the inner circle
  , scale: 0.25 // Scales overall size of the spinner
  , corners: 1 // Corner roundness (0..1)
  , color: '#000' // #rgb or #rrggbb or array of colors
  , opacity: 0.25 // Opacity of the lines
  , rotate: 0 // The rotation offset
  , direction: 1 // 1: clockwise, -1: counterclockwise
  , speed: 1 // Rounds per second
  , trail: 60 // Afterglow percentage
  , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
  , zIndex: 2e9 // The z-index (defaults to 2000000000)
  , className: 'spinner' // The CSS class to assign to the spinner
  , top: '150%' // Top position relative to parent
  , left: '50%' // Left position relative to parent
  , shadow: false // Whether to render a shadow
  , hwaccel: false // Whether to use hardware acceleration
  , position: 'absolute' // Element positioning
  };

  var targetAll = document.getElementById('indicator-all');
  var targetTotals = document.getElementById('indicator-totals');
  var spinnerAll = new Spinner(opts).spin(targetAll);
  var spinnerTotals = new Spinner(opts).spin(targetTotals);



  // button click events
  var btnViewAll = $('#viewall');
  var btnViewMonthly = $('#viewmonthly');
  var btnExcludeDonuts = $('#excludedonuts');
  var btnCrystalBall = $('#crystalball');

  btnViewAll.click(function() {
    listAllTransactions();
  });

  btnViewMonthly.click(function() {
    listMonthlyTotals();
  });

  btnExcludeDonuts.click(function() {
    listMonthlyTotalsNoDonuts();
  });

  btnCrystalBall.click(function() {
    listProjectedTransactions();
  });



  // create markup for line item display
  function transactionLineItem(item) {
    var trElement = '<tr><td>' + moment(item['transaction-time']).format('MMM DD, YYYY') + '</td><td>' + item.merchant + '</td><td>' + item.categorization + '</td><td>' + '$' + (item.amount / 10000).toFixed(2) + '</td></tr>';
    return trElement;
  }

  function monthlyLineItem(key, value) {
    var trElement = '<tr><td>' + key + '</td><td>' + '$' + (value['spend'] / 10000).toFixed(2) + '</td><td>' + '$' + (value['income'] / 10000).toFixed(2) + '</td></tr>';
    return trElement;
  }



  // calculate totals & averages
  function calculateTotals(data) {
    var totals = {};
    var currentMonth = moment(data[0]['transaction-time']).format('MMM YYYY');
    var spendSum = 0;
    var incomeSum = 0;
    for(var i = 0; i < data.length; i++) {
      if(moment(data[i]['transaction-time']).format('MMM YYYY') === currentMonth) {
        if(Math.sign(data[i].amount) === 1) {
          incomeSum += data[i].amount;
        } else {
          spendSum += data[i].amount
        }
        totals[currentMonth] = {"spend": spendSum, "income": incomeSum}
      } else {
        currentMonth = moment(data[i]['transaction-time']).format('MMM YYYY');
        spendSum = 0;
        incomeSum = 0;
        if(Math.sign(data[i].amount) === 1) {
          incomeSum += data[i].amount;
        } else {
          spendSum += data[i].amount
        }
        continue;
      }
    }
    return totals;
  }

  function calculateAverage(data) {
    var spendSum = 0;
    var incomeSum = 0;
    var months = 0;
    $.each(data, function(index, item) {
      spendSum += item['spend'];
      incomeSum += item['income'];
      if(index) {
        months += 1;
      }
    });
    var spendAvg = spendSum / months;
    var incomeAvg = incomeSum / months;
    var avg = {
      "Averages": {
        "spend": spendAvg,
        "income": incomeAvg
      }
    };
    return avg;
  }



  // API calls
  // get all transactions, display data
  var listAllTransactions = function() {
    $transactions.removeClass('hide');
    $monthlytotals.addClass('hide');
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://2016.api.levelmoney.com/api/v2/core/get-all-transactions", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.onloadend = function() {
      var parsed = JSON.parse(this.response);
      var orderedTransactions = parsed.transactions.reverse();
      var htmlString = '';
      $.each(orderedTransactions, function(index, item) {
        htmlString += transactionLineItem(item);
      });
      var transactionsTable = $('#transactions tbody');
      transactionsTable.html(htmlString);
      spinnerAll.stop();
    };
    xhr.onerror = function(err) {
        document.getElementById('error').textContent = "ugh an error. i can't handle this right now.";
    };
    args = {"args": {"uid":  apiUserID, "token":  apiAuthToken, "api-token":  apiToken, "json-strict-mode": false, "json-verbose-response": false}};
    xhr.send(JSON.stringify(args));
  };


  // get all transactions, calculate averages, display data
  var listMonthlyTotals = function() {
    $monthlytotals.removeClass('hide');
    $transactions.addClass('hide');
    $projected.addClass('hide');
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://2016.api.levelmoney.com/api/v2/core/get-all-transactions", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.onloadend = function() {
      var parsed = JSON.parse(this.response);
      var orderedTransactions = parsed.transactions.reverse();
      var monthlyTotals = calculateTotals(orderedTransactions);
      var avg = calculateAverage(monthlyTotals);
      $avgspend.html("Average Monthly Expenses: " + '<span>$' + (avg['Averages']['spend'] / 10000).toFixed(2) + '</span>');
      $avgincome.html("Average Monthly Income: " + '<span>$' + (avg['Averages']['income'] / 10000).toFixed(2) + '</span>');
      var htmlString = '';
      for (var key in monthlyTotals) {
        htmlString += monthlyLineItem(key, monthlyTotals[key]);
      }
      var monthlyTable = $('#monthlytotals tbody');
      monthlyTable.html(htmlString);
      spinnerTotals.stop();
    };
    xhr.onerror = function(err) {
        document.getElementById('error').textContent = "ugh an error. i can't handle this right now.";
    };
    args = {"args": {"uid":  apiUserID, "token":  apiAuthToken, "api-token":  apiToken, "json-strict-mode": false, "json-verbose-response": false}};
    xhr.send(JSON.stringify(args));
  };


  // get all transactions, exclude donuts, calculate averages, display data
  var listMonthlyTotalsNoDonuts = function() {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://2016.api.levelmoney.com/api/v2/core/get-all-transactions", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.onloadend = function() {
        var parsed = JSON.parse(this.response);
        var orderedTransactions = parsed.transactions.reverse();
        orderedTransactions = orderedTransactions.filter(function(el) {
            return el.merchant !== "Krispy Kreme Donuts";
        });
        orderedTransactions = orderedTransactions.filter(function(el) {
            return el.merchant !== "Dunkin #336784";
        });
        var monthlyTotals = calculateTotals(orderedTransactions);
        var avg = calculateAverage(monthlyTotals);
        $avgspend.html("Average Monthly Expenses: " + '<span>$' + (avg['Averages']['spend'] / 10000).toFixed(2) + '</span>');
        $avgincome.html("Average Monthly Income: " + '<span>$' + (avg['Averages']['income'] / 10000).toFixed(2) + '</span>');
        var htmlString = '';
        for (var key in monthlyTotals) {
          htmlString += monthlyLineItem(key, monthlyTotals[key]);
        }
        var monthlyTable = $('#monthlytotals tbody');
        monthlyTable.html(htmlString);
    };
    xhr.onerror = function(err) {
        document.getElementById('error').textContent = "ugh an error. i can't handle this right now.";
    };
    args = {"args": {"uid":  apiUserID, "token":  apiAuthToken, "api-token":  apiToken, "json-strict-mode": false, "json-verbose-response": false}};
    xhr.send(JSON.stringify(args));
  };


  // get projected transactions, display data
  var listProjectedTransactions = function() {
    $projected.removeClass('hide');
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://2016.api.levelmoney.com/api/v2/core/projected-transactions-for-month", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.onloadend = function() {
        var parsed = JSON.parse(this.response);
        var orderedTransactions = parsed.transactions.reverse();
        orderedTransactions = orderedTransactions.sort(function(x, y){
          return y['transaction-time'] < x['transaction-time'] ? -1 : 1;
        });
        // console.log(orderedTransactions);
        var htmlString = '';
        $.each(orderedTransactions, function(index, item) {
          // console.log(item);
          htmlString += transactionLineItem(item);
          // console.log(htmlString);
        });
        var projectedTable = $('#projected tbody');
        projectedTable.html(htmlString);
        // console.log(transactionsTable);
    };
    xhr.onerror = function(err) {
        document.getElementById('outrpc33').textContent = "ugh an error. i can't handle this right now.";
    };
    var d = new Date();
    var currentYear = d.getFullYear();
    var currentMonth = d.getMonth() + 1;
    args = {"args": {"uid":  apiUserID, "token":  apiAuthToken, "api-token":  apiToken, "json-strict-mode": false, "json-verbose-response": false}, "year":  currentYear, "month":  currentMonth};
    xhr.send(JSON.stringify(args));
  };


});
