self.addEventListener("push", (e) => {
  const d = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(d.title || "Planner", {
    body: d.body, data: d,
    actions: [{ action: "going", title: "갈래요" }, { action: "skipped", title: "안 갈래요" }],
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const d = e.notification.data || {};
  if (e.action && d.id) {
    // 앱 키는 IndexedDB 대신 클라이언트가 postMessage로 넘겨준 값을 사용
    e.waitUntil(self.clients.matchAll({ includeUncontrolled: true }).then((cs) => {
      if (cs[0]) cs[0].postMessage({ type: "decision", id: d.id, decision: e.action });
      else return self.clients.openWindow("/?decide=" + d.id + "&d=" + e.action);
    }));
  } else e.waitUntil(self.clients.openWindow(d.url || "/"));
});
