/* The preview's backend: made-up answers for site.js while no project exists for the site
 * (site/src/config.json is empty; docs/website.md, "Preview"). Loaded only then: site/src/build.py
 * leaves it out of every page once config.json names a backend.
 *
 * site.js sends every call meant for the backend to C2dPreview.fetch (sbFetch), which answers here,
 * in this browser: sign-in with any email and any 6-digit code, an account, three made-up car
 * transports, a transport company, invoices, Join Transporters and the reports. Nothing leaves the
 * browser (bookings are made at /book, never here). Kept in sessionStorage (this tab) so a reload
 * keeps the account and what was done to its transports.
 * Every name, plate, phone and amount below is made up. */
(function () {
  'use strict';
  var KEY = 'car2door-preview';
  var UID = '00000000-0000-4000-8000-0000000000c2';
  var DAY = 864e5;

  function load() { try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function keep(db) { try { sessionStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }
  function iso(t) { return new Date(t).toISOString(); }
  // Midnight-ish of a day from now, 08:00 UTC: ready days are days, not times.
  function dayFrom(n) { var d = new Date(Date.now() + n * DAY); d.setUTCHours(8, 0, 0, 0); return d.getTime(); }

  // Three transports of the made-up account: one looking for a company (its card saved, charged
  // when one accepts: E10), one with a company assigned (so its contact, code and cancel terms
  // show) and one delivered (with its invoice).
  // Pickup windows as the server stores them, both days counted (Saver 7, Standard 5, Priority the
  // chosen day and the next); deliver-by as site.js's deliverBy() gives it for the route.
  function seed() {
    return [
      { id: 'a1c2d3e4-0000-4000-8000-000000000001', status: 'bidding', option: 'saver', car_make: 'VW Golf', car_size: 'car', car_runs: true, car_plate: 'K-JD 4821',
        pickup_address: 'Aachener Straße 12, Köln', pickup_city: 'Köln', pickup_country: 'DE', dropoff_address: 'Strada Memorandumului 8, Cluj-Napoca', dropoff_city: 'Cluj-Napoca', dropoff_country: 'RO',
        pickup_at: iso(dayFrom(2)), pickup_until: iso(dayFrom(8)), pickup_tz: 'Europe/Berlin', deliver_by: iso(dayFrom(12)), notes: 'Keys with the neighbour at number 14.',
        fare_cents: 64000, bid_started_at: iso(Date.now() - 2 * 3600e3), cancel_reason: null, cancel_fee_cents: 0, payout_on_hold: false, payout_release_at: null, payout_sent: false,
        refund_state: null, refunded_cents: 0, discount_cents: 0, payment: 'saved', charge_hold_until: null },
      { id: 'a1c2d3e4-0000-4000-8000-000000000002', status: 'accepted', option: 'standard', car_make: 'BMW X3', car_size: 'suv', car_runs: true, car_plate: 'M-AB 1234',
        pickup_address: 'Leopoldstraße 40, München', pickup_city: 'München', pickup_country: 'DE', dropoff_address: 'Strada Nicolae Bălcescu 5, Sibiu', dropoff_city: 'Sibiu', dropoff_country: 'RO',
        pickup_at: iso(dayFrom(1)), pickup_until: iso(dayFrom(5)), pickup_tz: 'Europe/Berlin', deliver_by: iso(dayFrom(8)), notes: '',
        fare_cents: 81000, bid_started_at: iso(Date.now() - 30 * 3600e3), cancel_reason: null, cancel_fee_cents: 0, payout_on_hold: false, payout_release_at: null, payout_sent: false,
        refund_state: null, refunded_cents: 0, discount_cents: 0, payment: 'charged', charge_hold_until: null },
      { id: 'a1c2d3e4-0000-4000-8000-000000000003', status: 'completed', option: 'priority', car_make: 'Dacia Duster', car_size: 'suv', car_runs: false, car_plate: 'W-12345X',
        pickup_address: 'Praterstraße 3, Wien', pickup_city: 'Wien', pickup_country: 'AT', dropoff_address: 'Bulevardul Revoluției 1, Timișoara', dropoff_city: 'Timișoara', dropoff_country: 'RO',
        pickup_at: iso(dayFrom(-12)), pickup_until: iso(dayFrom(-11)), pickup_tz: 'Europe/Vienna', deliver_by: iso(dayFrom(-9)), notes: '',
        fare_cents: 67000, bid_started_at: iso(dayFrom(-13)), cancel_reason: null, cancel_fee_cents: 0, payout_on_hold: false, payout_release_at: iso(dayFrom(-7)), payout_sent: true,
        refund_state: null, refunded_cents: 0, discount_cents: 0, payment: 'charged', charge_hold_until: null }
    ];
  }
  function db() {
    var x = load();
    if (!x.orders) { x.orders = seed(); x.profile = { full_name: '', phone: '+49 151 00000000', billing_name: '', billing_vat_number: '', billing_address: '' }; keep(x); }
    return x;
  }

  function reply(status, body) {
    var text = body == null ? '' : JSON.stringify(body);
    return new Promise(function (ok) {
      setTimeout(function () { ok(new Response(text || null, { status: status, headers: { 'Content-Type': 'application/json' } })); }, 260);
    });
  }
  function b64url(o) { return btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_'); }
  function session(email, name) {
    return { access_token: b64url({ alg: 'none' }) + '.' + b64url({ sub: UID, email: email }) + '.preview', token_type: 'bearer', expires_in: 3600,
      refresh_token: 'preview-refresh', user: { id: UID, email: email, user_metadata: { full_name: name || '' } } };
  }
  function param(url, name) { var m = new RegExp('[?&]' + name + '=([^&]*)').exec(url); return m ? decodeURIComponent(m[1]) : null; }

  // car2door.eu itself gets no made-up answers (no sign-in, no transports, no report taken as
  // sent): each call there fails as with no network. Only a preview on this computer gets them.
  var LIVE = /(^|\.)car2door\.eu$/i.test(location.hostname);

  function answer(url, o) {
    if (LIVE) return Promise.reject(new TypeError('Failed to fetch'));
    var path = url.replace(/^https?:\/\/[^/]+/, ''), method = (o && o.method) || 'GET', body = {};
    try { body = o && o.body ? JSON.parse(o.body) : {}; } catch (e) {}
    var x = db();
    // Sign-in: any email, then any 6-digit code; Google and Apple are off.
    if (path.indexOf('/auth/v1/settings') === 0) return reply(200, { external: { google: false, apple: false, email: true } });
    if (path.indexOf('/auth/v1/otp') === 0) {
      x.pending = { email: body.email, name: body.data && body.data.full_name };
      keep(x);
      return reply(200, {});
    }
    if (path.indexOf('/auth/v1/verify') === 0) {
      if (!/^\d{6}$/.test(String(body.token || ''))) return reply(400, { error_code: 'otp_expired', msg: 'Token has expired or is invalid' });
      var who = x.pending || { email: body.email };
      if (who.name) x.profile.full_name = who.name;
      if (!x.profile.full_name) x.profile.full_name = 'Alex Preview';
      keep(x);
      return reply(200, session(who.email || body.email, x.profile.full_name));
    }
    if (path.indexOf('/auth/v1/token') === 0) return reply(200, session(x.pending && x.pending.email || 'you@example.com', x.profile.full_name));
    if (path.indexOf('/auth/v1/logout') === 0) return reply(204, null);
    // The account's own row (Personal details).
    if (path.indexOf('/rest/v1/profiles') === 0) {
      if (method === 'PATCH') { Object.keys(body).forEach(function (k) { x.profile[k] = body[k]; }); keep(x); return reply(204, null); }
      return reply(200, [x.profile]);
    }
    if (path.indexOf('/rest/v1/rpc/referral_window') === 0) return reply(200, null);
    // My transports: the list, or one.
    if (path.indexOf('/rest/v1/rpc/my_trips') === 0) {
      var id = (param(path, 'id') || '').replace(/^eq\./, '');
      var rows = x.orders.filter(function (r) { return !id || r.id === id; });
      return reply(200, rows.sort(function (a, b) { return Date.parse(b.pickup_at) - Date.parse(a.pickup_at); }));
    }
    if (path.indexOf('/rest/v1/rpc/trip_contact') === 0) {
      return reply(200, [{ full_name: 'Ion D.', company_name: 'Demo Transport SRL', phone: '+40 700 000 000', unit_plate: 'CJ 22 DTR', car_slots: 3 }]);
    }
    if (path.indexOf('/rest/v1/order_pickup_codes') === 0) return reply(200, [{ code: '4821' }]);
    if (path.indexOf('/rest/v1/invoices') === 0) {
      var done = x.orders.filter(function (r) { return r.status === 'completed'; });
      var oid = (param(path, 'order_id') || '').replace(/^eq\./, '');
      return reply(200, done.filter(function (r) { return !oid || r.id === oid; }).map(function (r, i) {
        return { id: 'inv-' + i, kind: 'trip', number: 'C2D-2026-000' + (i + 1), total_cents: r.fare_cents, file_path: 'preview/' + r.id + '.pdf', created_at: r.pickup_at };
      }));
    }
    if (path.indexOf('/rest/v1/rpc/my_cancellation_terms') === 0) {
      var c = x.orders.filter(function (r) { return r.id === body.p_order; })[0];
      return reply(200, c ? [{ refund_cents: c.fare_cents, refund_pct: 1, fee_cents: 0, changes_at: null, next_refund_pct: null }] : []);
    }
    if (path.indexOf('/rest/v1/rpc/my_trip_search') === 0) return reply(200, null);
    if (/\/rest\/v1\/rpc\/(answer_trip_search|report_trip_problem|report_function_failure)/.test(path)) return reply(200, null);
    if (path.indexOf('/rest/v1/rpc/referral_code_info') === 0) return reply(200, [{ valid: true, invited_by: 'Demo Transport SRL' }]);
    if (path.indexOf('/rest/v1/rpc/apply_referral_code') === 0) return reply(200, 'ok');
    if (path.indexOf('/rest/v1/transporter_applications') === 0) return reply(201, null);
    if (path.indexOf('/storage/v1/object/sign/') === 0) return reply(404, { message: 'Not in the preview' });
    // The functions.
    var fn = (/\/functions\/v1\/([\w-]+)/.exec(path) || [])[1];
    if (fn === 'cancel-order') {
      x.orders.forEach(function (r) {
        if (r.id !== body.orderId) return;
        r.status = 'cancelled'; r.cancel_reason = 'client_cancelled';
        if (r.payment !== 'saved') { r.refund_state = 'refunded'; r.refunded_cents = r.fare_cents; } // a saved card was never charged
      });
      keep(x);
      return reply(200, { ok: true });
    }
    if (fn === 'delete-account') { try { sessionStorage.removeItem(KEY); } catch (e) {} return reply(200, { ok: true }); }
    if (fn === 'content-report' || fn === 'feedback') return reply(200, { ok: true });
    return reply(404, { message: 'Not in the preview: ' + path });
  }

  window.C2dPreview = { fetch: answer };
})();
