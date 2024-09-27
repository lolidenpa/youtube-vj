document.addEventListener("DOMContentLoaded", () => {
  const btn = document.querySelector("#open_windows");
  btn.addEventListener("click", () => {
    chrome.windows.create({
      url: "https://srv-rpi4-main.kazuprog.work/youtube-vj/controller.html",
      type: "popup",
      width: 960,
      height: 540,
    });
  });
});
