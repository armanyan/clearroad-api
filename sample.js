(function() {
  function validate(e) {
    e.preventDefault();

    document.getElementById('log').innerHTML = '<p>Started...</p>'; // cleanup logs
    document.getElementById('result').innerHTML = ''; // cleanup logs

    var url = document.querySelector("[name='url']").value;
    var login = document.querySelector("[name='login']").value;
    var password = document.querySelector("[name='password']").value;
    if (login && password) {
      window.cr = new ClearRoad(url, login, password);
    }
    else {
      window.cr = new ClearRoad(url);
    }

    eval(document.querySelector("[name='usercode']").value);
  }

  var c = {};
  function wrap(key) {
    c[key] = console[key];
    console[key] = function () {
      document.getElementById('log').innerHTML += JSON.parse(JSON.stringify(arguments[0])) + '<br />';
      if (typeof c[key] === "function") {
        c[key].apply(console, arguments);
      }
    };
  }

  function init() {
    document.getElementById('form').onsubmit = validate;
    if (typeof console !== "undefined" && console) {
      wrap("log");
      wrap("info");
      wrap("warn");
      wrap("error");
    };
  }

  init();
})();