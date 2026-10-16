/* Formly embed v1. A dependency-free, isolated floating widget. */
(function () {
  "use strict";
  var script = document.currentScript;
  if (!script) return;
  var formId = script.getAttribute("data-form");
  if (!formId || !/^[0-9a-f-]{36}$/i.test(formId)) {
    console.warn("Formly: add a valid data-form ID to your embed script.");
    return;
  }
  var origin = new URL(script.src).origin;
  var widgetId = "formly-widget-" + formId;
  if (document.getElementById(widgetId)) return;

  function mount() {
    var host = document.createElement("div");
    host.id = widgetId;
    host.style.cssText =
      "position:fixed!important;bottom:0!important;right:0!important;z-index:2147483000!important;width:0!important;height:0!important;";
    var root = host.attachShadow({ mode: "open" });
    var style = document.createElement("style");
    style.textContent =
      ":host{all:initial}*{box-sizing:border-box}.launcher{position:fixed;right:22px;bottom:22px;width:58px;height:58px;border:0;border-radius:19px 19px 6px 19px;background:#c8532e;color:white;box-shadow:0 4px 22px #0003;cursor:pointer;display:flex;align-items:center;justify-content:center;font:27px/1 Arial,sans-serif}.launcher:focus-visible{outline:3px solid #27332d;outline-offset:4px}.panel{position:fixed;right:22px;bottom:94px;width:380px;max-width:calc(100vw - 32px);height:570px;max-height:calc(100dvh - 120px);background:white;border-radius:15px;box-shadow:0 10px 55px #203b3233;overflow:hidden;border:1px solid #e1e8d8}.panel[hidden]{display:none}iframe{width:100%;height:100%;border:0;background:#fff;display:block}@media(max-width:480px){.launcher{right:16px;bottom:16px;width:54px;height:54px}.panel{right:12px;bottom:84px;width:calc(100vw - 24px);max-width:calc(100vw - 24px);height:560px;max-height:calc(100dvh - 104px)}}@media(prefers-reduced-motion:no-preference){.panel{animation:appear .2s ease-out}@keyframes appear{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}}";
    root.appendChild(style);
    var panel = document.createElement("div");
    panel.className = "panel";
    panel.hidden = true;
    panel.id = widgetId + "-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Chat form");
    var launcher = document.createElement("button");
    launcher.type = "button";
    launcher.className = "launcher";
    launcher.textContent = "✉";
    launcher.setAttribute("aria-label", "Open chat form");
    launcher.setAttribute("aria-controls", panel.id);
    launcher.setAttribute("aria-expanded", "false");
    var iframe;
    function setOpen(open) {
      if (open && !iframe) {
        iframe = document.createElement("iframe");
        iframe.src = origin + "/embed/" + encodeURIComponent(formId);
        iframe.title = "Formly conversational form";
        iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
        panel.appendChild(iframe);
      }
      panel.hidden = !open;
      launcher.textContent = open ? "×" : "✉";
      launcher.setAttribute("aria-expanded", String(open));
      launcher.setAttribute("aria-label", open ? "Close chat form" : "Open chat form");
      if (!open) launcher.focus();
    }
    launcher.addEventListener("click", function () {
      setOpen(panel.hidden);
    });
    window.addEventListener("message", function (event) {
      if (event.origin !== origin || !iframe || event.source !== iframe.contentWindow) return;
      if (event.data && event.data.type === "formly:close") setOpen(false);
    });
    root.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setOpen(false);
    });
    root.appendChild(panel);
    root.appendChild(launcher);
    document.body.appendChild(host);
    fetch(origin + "/api/public/" + encodeURIComponent(formId), { credentials: "omit" })
      .then(function (response) {
        return response.ok ? response.json() : null;
      })
      .then(function (data) {
        if (!data || !data.form) return;
        var color = data.form.settings.color;
        if (/^#[0-9a-f]{6}$/i.test(color)) {
          launcher.style.background = color;
          var rgb = [1, 3, 5].map(function (n) {
            var c = parseInt(color.slice(n, n + 2), 16) / 255;
            return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
          });
          var lum = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
          launcher.style.color = (lum + 0.05) / 0.05 > 1.05 / (lum + 0.05) ? "#17211b" : "#fff";
        }
        panel.setAttribute("aria-label", data.form.title);
      })
      .catch(function () {
        /* The iframe shows an unavailable state if the form is paused. */
      });
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
})();
