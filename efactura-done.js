// car2door.eu's page after ANAF's sign-in for RO e-Factura (efactura-done.html, built by site/src/build.py;
// hand-written, not generated). efactura-auth sends the browser here with ?ok=1, or ?ok=0&why=off, expired,
// denied, rights or failed: show that card. Anything else (an address typed or cut short) is "not authorised"
// with the expired link's text, which sends the transporter back to Car2Door Pro for a new link.
(function (q) {
  var ok = q.get('ok') === '1', why = q.get('why'), show = function (id) { document.getElementById(id).hidden = false; };
  if (ok) { show('ok'); show('privacy'); return; }
  show('not');
  var p = document.querySelector('[data-why="' + (/^(off|expired|denied|rights|failed)$/.test(why || '') ? why : 'expired') + '"]');
  if (p) p.hidden = false;
})(new URLSearchParams(location.search));
