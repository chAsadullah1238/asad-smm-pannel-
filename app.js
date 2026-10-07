let token = localStorage.token;

const $ = id => document.getElementById(id);

function show() {
  $("auth").hidden = !!token;
  $("app").hidden = !token;

  if (token) load();
}

async function api(url, opt = {}) {
  opt.headers = {
    ...(opt.headers || {}),
    ...(token ? { Authorization: "Bearer " + token } : {})
  };

  if (opt.body) {
    opt.headers["Content-Type"] = "application/json";
  }

  const r = await fetch(url, opt);
  const d = await r.json();

  if (!r.ok) {
    throw Error(d.error || "Error");
  }

  return d;
}

async function signup() {
  try {
    await api("/api/signup", {
      method: "POST",
      body: JSON.stringify({
        email: $("suEmail").value,
        password: $("suPass").value
      })
    });

    $("msg").textContent = "Account created. Login now.";
  } catch (e) {
    $("msg").textContent = e.message;
  }
}

async function login() {
  try {
    const d = await api("/api/login", {
      method: "POST",
      body: JSON.stringify({
        email: $("liEmail").value,
        password: $("liPass").value
      })
    });

    token = d.token;
    localStorage.token = token;

    show();
  } catch (e) {
    $("msg").textContent = e.message;
  }
}

function logout() {
  localStorage.removeItem("token");
  token = null;
  show();
}

async function load() {
  try {
    const m = await api("/api/me");

    $("me").textContent =
      `Logged in: ${m.email} • Balance: PKR ${Number(m.balance).toFixed(2)}`;

    const o = await api("/api/orders");
    $("orders").textContent = JSON.stringify(o, null, 2);

    const d = await api("/api/deposits");
    $("deps").textContent = JSON.stringify(d, null, 2);

  } catch (e) {
    logout();
  }
}

async function deposit() {
  try {
    await api("/api/deposits", {
      method: "POST",
      body: JSON.stringify({
        method: $("method").value,
        amount: Number($("amount").value),
        transaction_id: $("tx").value
      })
    });

    $("msg").textContent =
      "Deposit submitted for verification.";

    load();

  } catch (e) {
    $("msg").textContent = e.message;
  }
}

async function order() {
  try {
    await api("/api/orders", {
      method: "POST",
      body: JSON.stringify({
        service: $("service").value,
        target: $("target").value,
        quantity: Number($("qty").value)
      })
    });

    $("msg").textContent = "Order created.";

    load();

  } catch (e) {
    $("msg").textContent = e.message;
  }
}

show();
