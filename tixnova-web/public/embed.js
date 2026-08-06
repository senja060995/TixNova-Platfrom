(function () {
  "use strict";
  var widgets = document.querySelectorAll(".tixnova-widget[data-event]");
  if (!widgets.length) return;

  var origin = (function () {
    try {
      return window.location.origin;
    } catch (e) {
      return "";
    }
  })();

  function render(el) {
    var slug = el.getAttribute("data-event");
    if (!slug) return;
    if (el.dataset.tixnovaLoaded) return;
    el.dataset.tixnovaLoaded = "1";

    var height = parseInt(el.getAttribute("data-height") || "320", 10);
    var iframe = document.createElement("iframe");
    iframe.src = origin + "/embed/" + encodeURIComponent(slug);
    iframe.width = "100%";
    iframe.height = height;
    iframe.frameBorder = "0";
    iframe.scrolling = "no";
    iframe.style.border = "0";
    iframe.style.display = "block";
    iframe.style.width = "100%";
    iframe.setAttribute("title", "TixNova Event");
    el.appendChild(iframe);
  }

  widgets.forEach(render);

  window.addEventListener("message", function (event) {
    if (!event.data || typeof event.data.tixnovaEmbedHeight !== "number") return;
    var src = String(event.source && event.source.location ? event.source.location.href : "");
    var iframe = document.querySelector('iframe[src*="/embed/"]');
    if (iframe && src.indexOf("/embed/") !== -1) {
      iframe.style.height = event.data.tixnovaEmbedHeight + "px";
    }
  });

  if (window.MutationObserver) {
    var observer = new MutationObserver(function () {
      document.querySelectorAll(".tixnova-widget[data-event]").forEach(render);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
