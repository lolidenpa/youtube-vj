document.addEventListener("DOMContentLoaded", function () {
  var links = document.getElementsByTagName("a");
  for (var i = 0; i < links.length; i++) {
    (function () {
      var ln = links[i];
      var location = ln.href;
      ln.onclick = function () {
        chrome.windows.create({
          url: location,
          type: "popup",
          width: 768,
          height: 432,
        });
      };
    })();
  }
});