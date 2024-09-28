if (location.origin == "https://www.youtube.com") {
  /**
   * YouTube-VJ YouTube
   */
  var currentUrl = null;
  var currentVideoId = null;
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
      currentVideoId = videoId;

      chrome.storage.local.set({ videoId }).then(() => {
        console.log(`YTVJ:E Set current videoId:${videoId}`);
      });
    });
  });

  observer.observe(document, { subtree: true, childList: true });

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.loadedId) {
      if (changes.loadedId.newValue === currentVideoId) {
        document.querySelector("video").pause();
      }
    }
  });
} else {
  /**
   * YouTube-VJ Controller
   */
  const relayElement = document.querySelector("#videoId");
  console.log(relayElement);

  // Reset storage
  chrome.storage.local.set({ loadedId: null });

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

  console.log("YTVJ:E set MutationObserver(loadedId)");
  const element = document.querySelector("#loadedId");
  const observer = new MutationObserver(() => {
    const loadedId = element.value;
    chrome.storage.local.set({ loadedId }).then(() => {
      console.log(`YTVJ:E loadedId=${loadedId} >Storage`);
    });
  });
  observer.observe(element, {
    attributes: true,
    childList: true,
    characterData: true,
  });
}
