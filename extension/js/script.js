if (location.origin == "https://www.youtube.com") {
  /**
   * YouTube-VJ YouTube
   */
  var currentUrl = null;
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (window.location.href === currentUrl) {
        return;
      }

      currentUrl = window.location.href;

      if (location.pathname !== "/watch") {
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const videoId = params.get("v");

      chrome.storage.local.set({ videoId }).then(() => {
        console.log(`YTVJ:E Set current videoId:${videoId}`);
      });
    });
  });

  observer.observe(document, { subtree: true, childList: true });
} else {
  /**
   * YouTube-VJ Controller
   */
  const relayElement = document.querySelector("#videoId");
  console.log(relayElement);

  chrome.storage.local.get("videoId", function (items) {
    console.log("YTVJ:E Read storage(videoId)");
    relayElement.value = items.videoId;
  });

  console.log("YTVJ:E Watching storage(videoId)");
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.videoId) {
      console.log("YTVJ:E Read storage(videoId)");
      relayElement.value = changes.videoId.newValue;
    }
  });
}
