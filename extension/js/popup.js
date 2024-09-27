document.addEventListener("DOMContentLoaded", () => {
  const OPEN_URLs = [
    "https://srv-rpi4-main.kazuprog.work/youtube-vj/controller.html",
    "https://srv-rpi4-main.kazuprog.work/youtube-vj/preview.html",
  ];
  const btn = document.querySelector("#open_windows");
  btn.addEventListener("click", () => {
    OPEN_URLs.map((url) => {
      chrome.windows.create({
        url,
        type: "popup",
        width: 960,
        height: 540,
      });
    });
  });
});
