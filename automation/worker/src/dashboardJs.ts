export const DASHBOARD_JS = String.raw`
(function () {
  "use strict";

  var TOKEN_KEY = "cosmart_admin_token";
  var state = {
    token: localStorage.getItem(TOKEN_KEY) || "",
    view: "conversaciones",
    contacts: [],
    activeContactId: null,
    messages: [],
    flows: [],
    editingFlow: null,
    settings: {},
  };

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function api(path, opts) {
    opts = opts || {};
    var headers = Object.assign(
      { "Content-Type": "application/json", Authorization: "Bearer " + state.token },
      opts.headers || {}
    );
    return fetch("/admin/api" + path, Object.assign({}, opts, { headers: headers })).then(function (res) {
      if (res.status === 401) {
        logout();
        throw new Error("No autorizado");
      }
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data.error || "Error de servidor");
        return data;
      });
    });
  }

  function logout() {
    state.token = "";
    localStorage.removeItem(TOKEN_KEY);
    render();
  }

  var app = document.getElementById("app");

  function render() {
    if (!state.token) return renderLogin();
    renderApp();
  }

  // ---------------- Login ----------------

  function renderLogin(errorMsg) {
    app.innerHTML =
      '<div class="login-screen"><div class="login-box">' +
      '<h1>Panel COSMART Bot</h1>' +
      '<p>Ingresá el token de administración para gestionar las conversaciones, flujos e IA.</p>' +
      '<input id="tokenInput" type="password" placeholder="Token de administrador" />' +
      (errorMsg ? '<div class="error-text">' + escapeHtml(errorMsg) + "</div>" : "") +
      '<button id="loginBtn">Ingresar</button>' +
      "</div></div>";

    document.getElementById("loginBtn").addEventListener("click", doLogin);
    document.getElementById("tokenInput").addEventListener("keydown", function (e) {
      if (e.key === "Enter") doLogin();
    });
  }

  function doLogin() {
    var value = document.getElementById("tokenInput").value.trim();
    if (!value) return;
    state.token = value;
    api("/me")
      .then(function () {
        localStorage.setItem(TOKEN_KEY, value);
        render();
      })
      .catch(function () {
        state.token = "";
        renderLogin("Token incorrecto");
      });
  }

  // ---------------- Layout ----------------

  function renderApp() {
    var navItems = [
      ["conversaciones", "Conversaciones"],
      ["flujos", "Flujos"],
      ["ajustes", "Ajustes de IA"],
    ];

    var navHtml = navItems
      .map(function (item) {
        var cls = state.view === item[0] ? "active" : "";
        return '<a data-view="' + item[0] + '" class="' + cls + '">' + item[1] + "</a>";
      })
      .join("");

    app.innerHTML =
      '<div class="layout">' +
      '<div class="sidebar"><h2>COSMART Bot</h2><nav>' +
      navHtml +
      '</nav><div class="logout"><a id="logoutLink">Cerrar sesión</a></div></div>' +
      '<div class="main" id="main"></div>' +
      "</div>";

    var links = app.querySelectorAll(".sidebar nav a");
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", function (e) {
        state.view = e.target.getAttribute("data-view");
        state.editingFlow = null;
        renderApp();
      });
    }
    document.getElementById("logoutLink").addEventListener("click", logout);

    if (state.view === "conversaciones") renderConversaciones();
    else if (state.view === "flujos") renderFlujos();
    else renderAjustes();
  }

  // ---------------- Conversaciones ----------------

  function channelBadge(channel) {
    var cls = channel === "whatsapp" ? "wa" : "ig";
    var label = channel === "whatsapp" ? "WhatsApp" : "Instagram";
    return '<span class="badge ' + cls + '">' + label + "</span>";
  }

  function renderConversaciones() {
    var main = document.getElementById("main");
    main.innerHTML = "<h1>Conversaciones</h1><div class=\"split\" id=\"convSplit\"></div>";

    api("/contacts")
      .then(function (contacts) {
        state.contacts = contacts;
        drawConversaciones();
      })
      .catch(function (err) {
        main.innerHTML += '<div class="card">Error cargando conversaciones: ' + escapeHtml(err.message) + "</div>";
      });
  }

  function drawConversaciones() {
    var split = document.getElementById("convSplit");
    if (!split) return;

    var listHtml = state.contacts
      .map(function (c) {
        var activeCls = c.id === state.activeContactId ? "active" : "";
        var name = c.name || c.external_id;
        var human = c.ai_enabled === 0 ? '<span class="badge human">Humano</span>' : "";
        return (
          '<div class="contact-row ' +
          activeCls +
          '" data-id="' +
          c.id +
          '">' +
          '<div class="name">' +
          escapeHtml(name) +
          channelBadge(c.channel) +
          human +
          "</div>" +
          '<div class="preview">' +
          escapeHtml(c.last_message || "") +
          "</div>" +
          "</div>"
        );
      })
      .join("");

    split.innerHTML =
      '<div class="list-col card">' + (listHtml || "<p>Todavía no hay conversaciones.</p>") + "</div>" +
      '<div class="detail-col card" id="convDetail"><p>Elegí una conversación de la izquierda.</p></div>';

    var rows = split.querySelectorAll(".contact-row");
    for (var i = 0; i < rows.length; i++) {
      rows[i].addEventListener("click", function (e) {
        state.activeContactId = e.currentTarget.getAttribute("data-id");
        drawConversaciones();
        loadMessages();
      });
    }

    if (state.activeContactId) loadMessages();
  }

  function loadMessages() {
    var contact = state.contacts.filter(function (c) { return c.id === state.activeContactId; })[0];
    if (!contact) return;

    api("/contacts/" + state.activeContactId + "/messages").then(function (messages) {
      var detail = document.getElementById("convDetail");
      if (!detail) return;

      var msgsHtml = messages
        .map(function (m) {
          return (
            '<div class="msg ' +
            m.direction +
            '">' +
            escapeHtml(m.body) +
            '<span class="src">' +
            m.source +
            "</span></div>"
          );
        })
        .join("");

      var botOn = contact.ai_enabled !== 0;

      detail.innerHTML =
        "<div style=\"display:flex;justify-content:space-between;align-items:center;margin-bottom:.6rem\">" +
        "<div><strong>" + escapeHtml(contact.name || contact.external_id) + "</strong> " + channelBadge(contact.channel) + "</div>" +
        '<button class="btn small ' + (botOn ? "ghost" : "secondary") + '" id="toggleBotBtn">' +
        (botOn ? "Bot activo (apagar)" : "Bot apagado (reactivar)") +
        "</button>" +
        "</div>" +
        '<div class="messages" id="msgList">' + (msgsHtml || "<p>Sin mensajes todavía.</p>") + "</div>" +
        '<div class="reply-row"><input id="replyInput" type="text" placeholder="Escribí una respuesta manual..." />' +
        '<button class="btn" id="replyBtn">Enviar</button></div>' +
        '<p class="hint">Enviar una respuesta manual apaga el bot para esta conversación.</p>';

      var msgList = document.getElementById("msgList");
      msgList.scrollTop = msgList.scrollHeight;

      document.getElementById("toggleBotBtn").addEventListener("click", function () {
        api("/contacts/" + contact.id + "/takeover", {
          method: "POST",
          body: JSON.stringify({ enabled: !botOn }),
        }).then(function () {
          renderConversaciones();
        });
      });

      document.getElementById("replyBtn").addEventListener("click", sendReply);
      document.getElementById("replyInput").addEventListener("keydown", function (e) {
        if (e.key === "Enter") sendReply();
      });

      function sendReply() {
        var input = document.getElementById("replyInput");
        var text = input.value.trim();
        if (!text) return;
        api("/contacts/" + contact.id + "/reply", { method: "POST", body: JSON.stringify({ text: text }) }).then(
          function () {
            input.value = "";
            loadMessages();
          }
        );
      }
    });
  }

  // ---------------- Flujos ----------------

  function renderFlujos() {
    var main = document.getElementById("main");
    if (state.editingFlow) return drawFlowEditor();

    main.innerHTML =
      '<h1>Flujos por palabra clave</h1>' +
      '<p class="hint">Un flujo se activa cuando el contacto escribe alguna de sus palabras clave, y ofrece botones para navegar. Podés crear, editar, activar o desactivar los que quieras.</p>' +
      '<button class="btn" id="newFlowBtn" style="margin-bottom:1rem">+ Nuevo flujo</button>' +
      '<div id="flowList"></div>';

    document.getElementById("newFlowBtn").addEventListener("click", function () {
      state.editingFlow = {
        name: "",
        trigger_keywords: [],
        active: true,
        entry_step_key: "inicio",
        steps: { inicio: { message: "", buttons: [], is_end: true } },
      };
      renderFlujos();
    });

    api("/flows").then(function (flows) {
      state.flows = flows;
      var list = document.getElementById("flowList");
      if (!list) return;

      list.innerHTML = flows
        .map(function (f) {
          return (
            '<div class="flow-item">' +
            '<div class="top"><div><strong>' +
            escapeHtml(f.name) +
            "</strong>" +
            (f.active ? "" : '<span class="badge">Desactivado</span>') +
            '<div class="kw">Se activa con: ' +
            escapeHtml(f.trigger_keywords.join(", ")) +
            "</div></div>" +
            '<div class="actions">' +
            '<button class="btn small ghost" data-action="toggle" data-id="' + f.id + '">' +
            (f.active ? "Desactivar" : "Activar") +
            "</button>" +
            '<button class="btn small secondary" data-action="edit" data-id="' + f.id + '">Editar</button>' +
            '<button class="btn small" data-action="delete" data-id="' + f.id + '">Borrar</button>' +
            "</div></div></div>"
          );
        })
        .join("") || "<p>No hay flujos creados todavía.</p>";

      list.querySelectorAll("[data-action]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = btn.getAttribute("data-id");
          var action = btn.getAttribute("data-action");
          var flow = flows.filter(function (f) { return f.id === id; })[0];
          if (action === "toggle") {
            api("/flows/" + id + "/active", { method: "PUT", body: JSON.stringify({ active: !flow.active }) }).then(
              renderFlujos
            );
          } else if (action === "edit") {
            state.editingFlow = JSON.parse(JSON.stringify(flow));
            renderFlujos();
          } else if (action === "delete") {
            if (confirm('¿Borrar el flujo "' + flow.name + '"?')) {
              api("/flows/" + id, { method: "DELETE" }).then(renderFlujos);
            }
          }
        });
      });
    });
  }

  function stepKeys(flow) {
    return Object.keys(flow.steps);
  }

  function drawFlowEditor() {
    var main = document.getElementById("main");
    var flow = state.editingFlow;

    var stepsHtml = stepKeys(flow)
      .map(function (key) {
        return renderStepBlock(flow, key);
      })
      .join("");

    main.innerHTML =
      "<h1>" + (flow.id ? "Editar flujo" : "Nuevo flujo") + "</h1>" +
      '<div class="card">' +
      '<div class="field"><label>Nombre del flujo</label><input id="flowName" type="text" value="' +
      escapeHtml(flow.name) +
      '" placeholder="Ej: Menú de bienvenida" /></div>' +
      '<div class="field"><label>Palabras que lo activan (separadas por coma)</label>' +
      '<input id="flowKeywords" type="text" value="' +
      escapeHtml(flow.trigger_keywords.join(", ")) +
      '" placeholder="hola, buenas, info" /></div>' +
      '<div class="field"><label>Paso inicial</label><select id="flowEntry">' +
      stepKeys(flow)
        .map(function (k) {
          return '<option value="' + escapeHtml(k) + '"' + (k === flow.entry_step_key ? " selected" : "") + ">" + escapeHtml(k) + "</option>";
        })
        .join("") +
      "</select></div>" +
      '<div class="toggle-row"><input id="flowActive" type="checkbox" ' +
      (flow.active ? "checked" : "") +
      ' /> <label style="margin:0">Flujo activo</label></div>' +
      "</div>" +
      '<div id="stepsContainer">' + stepsHtml + "</div>" +
      '<button class="btn ghost" id="addStepBtn" style="margin-bottom:1rem">+ Agregar paso</button>' +
      "<br/>" +
      '<button class="btn" id="saveFlowBtn">Guardar flujo</button> ' +
      '<button class="btn ghost" id="cancelFlowBtn">Cancelar</button>' +
      '<div id="flowError" class="error-text"></div>';

    document.getElementById("flowName").addEventListener("input", function (e) {
      flow.name = e.target.value;
    });
    document.getElementById("flowKeywords").addEventListener("input", function (e) {
      flow.trigger_keywords = e.target.value
        .split(",")
        .map(function (s) { return s.trim().toLowerCase(); })
        .filter(Boolean);
    });
    document.getElementById("flowEntry").addEventListener("change", function (e) {
      flow.entry_step_key = e.target.value;
    });
    document.getElementById("flowActive").addEventListener("change", function (e) {
      flow.active = e.target.checked;
    });
    document.getElementById("addStepBtn").addEventListener("click", function () {
      var n = 1;
      while (flow.steps["paso_" + n]) n++;
      flow.steps["paso_" + n] = { message: "", buttons: [], is_end: true };
      drawFlowEditor();
    });
    document.getElementById("saveFlowBtn").addEventListener("click", saveFlow);
    document.getElementById("cancelFlowBtn").addEventListener("click", function () {
      state.editingFlow = null;
      renderFlujos();
    });

    attachStepHandlers(flow);
  }

  function renderStepBlock(flow, key) {
    var step = flow.steps[key];
    var otherKeys = stepKeys(flow).filter(function (k) { return k !== key; });

    var buttonsHtml = step.buttons
      .map(function (b, idx) {
        return (
          '<div class="button-row" data-step="' + escapeHtml(key) + '" data-idx="' + idx + '">' +
          '<input type="text" class="btnLabel" value="' + escapeHtml(b.label) + '" placeholder="Texto del botón" />' +
          '<select class="btnTarget">' +
          '<option value="">Finalizar (sin más pasos)</option>' +
          '<option value="HANDOFF"' + (b.next_step_key === "HANDOFF" ? " selected" : "") + ">Derivar a una persona</option>" +
          otherKeys
            .map(function (k) {
              return '<option value="' + escapeHtml(k) + '"' + (b.next_step_key === k ? " selected" : "") + ">Ir a: " + escapeHtml(k) + "</option>";
            })
            .join("") +
          "</select>" +
          '<button class="btn small ghost removeBtnRow">✕</button>' +
          "</div>"
        );
      })
      .join("");

    return (
      '<div class="step-block" data-step="' +
      escapeHtml(key) +
      '">' +
      '<div class="row"><div style="flex:1"><label>Nombre del paso</label>' +
      '<input type="text" class="stepKeyInput" value="' + escapeHtml(key) + '" /></div>' +
      '<div style="width:150px"><label>&nbsp;</label><button class="btn small ghost removeStepBtn">Borrar paso</button></div></div>' +
      '<label>Mensaje que envía el bot</label>' +
      '<textarea class="stepMessage">' + escapeHtml(step.message) + "</textarea>" +
      '<div id="buttons-' + escapeHtml(key) + '">' + buttonsHtml + "</div>" +
      '<button class="btn small ghost addBtnRow">+ Agregar botón</button>' +
      "</div>"
    );
  }

  function attachStepHandlers(flow) {
    var container = document.getElementById("stepsContainer");

    container.querySelectorAll(".stepMessage").forEach(function (ta) {
      var key = ta.closest(".step-block").getAttribute("data-step");
      ta.addEventListener("input", function (e) {
        flow.steps[key].message = e.target.value;
      });
    });

    container.querySelectorAll(".stepKeyInput").forEach(function (input) {
      input.addEventListener("change", function (e) {
        var block = e.target.closest(".step-block");
        var oldKey = block.getAttribute("data-step");
        var newKey = e.target.value.trim().toLowerCase().replace(/\s+/g, "_");
        if (!newKey || newKey === oldKey || flow.steps[newKey]) {
          drawFlowEditor();
          return;
        }
        renameStepKey(flow, oldKey, newKey);
        drawFlowEditor();
      });
    });

    container.querySelectorAll(".removeStepBtn").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        var key = e.target.closest(".step-block").getAttribute("data-step");
        if (Object.keys(flow.steps).length <= 1) {
          alert("Un flujo necesita al menos un paso.");
          return;
        }
        delete flow.steps[key];
        if (flow.entry_step_key === key) flow.entry_step_key = Object.keys(flow.steps)[0];
        clearReferencesToStep(flow, key);
        drawFlowEditor();
      });
    });

    container.querySelectorAll(".addBtnRow").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        var key = e.target.closest(".step-block").getAttribute("data-step");
        flow.steps[key].buttons.push({ label: "", next_step_key: null });
        drawFlowEditor();
      });
    });

    container.querySelectorAll(".removeBtnRow").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        var row = e.target.closest(".button-row");
        var key = row.getAttribute("data-step");
        var idx = parseInt(row.getAttribute("data-idx"), 10);
        flow.steps[key].buttons.splice(idx, 1);
        drawFlowEditor();
      });
    });

    container.querySelectorAll(".btnLabel").forEach(function (input) {
      input.addEventListener("input", function (e) {
        var row = e.target.closest(".button-row");
        var key = row.getAttribute("data-step");
        var idx = parseInt(row.getAttribute("data-idx"), 10);
        flow.steps[key].buttons[idx].label = e.target.value;
      });
    });

    container.querySelectorAll(".btnTarget").forEach(function (select) {
      select.addEventListener("change", function (e) {
        var row = e.target.closest(".button-row");
        var key = row.getAttribute("data-step");
        var idx = parseInt(row.getAttribute("data-idx"), 10);
        flow.steps[key].buttons[idx].next_step_key = e.target.value || null;
      });
    });
  }

  function renameStepKey(flow, oldKey, newKey) {
    flow.steps[newKey] = flow.steps[oldKey];
    delete flow.steps[oldKey];
    if (flow.entry_step_key === oldKey) flow.entry_step_key = newKey;
    Object.keys(flow.steps).forEach(function (k) {
      flow.steps[k].buttons.forEach(function (b) {
        if (b.next_step_key === oldKey) b.next_step_key = newKey;
      });
    });
  }

  function clearReferencesToStep(flow, key) {
    Object.keys(flow.steps).forEach(function (k) {
      flow.steps[k].buttons.forEach(function (b) {
        if (b.next_step_key === key) b.next_step_key = null;
      });
    });
  }

  function saveFlow() {
    var flow = state.editingFlow;
    var errorEl = document.getElementById("flowError");
    errorEl.textContent = "";

    if (!flow.name.trim()) {
      errorEl.textContent = "Ponele un nombre al flujo.";
      return;
    }
    if (flow.trigger_keywords.length === 0) {
      errorEl.textContent = "Agregá al menos una palabra clave que lo active.";
      return;
    }

    Object.keys(flow.steps).forEach(function (k) {
      flow.steps[k].is_end = flow.steps[k].buttons.length === 0;
    });

    api("/flows", { method: "POST", body: JSON.stringify(flow) })
      .then(function () {
        state.editingFlow = null;
        renderFlujos();
      })
      .catch(function (err) {
        errorEl.textContent = err.message;
      });
  }

  // ---------------- Ajustes de IA ----------------

  function renderAjustes() {
    var main = document.getElementById("main");
    main.innerHTML = "<h1>Ajustes de IA</h1><div id=\"settingsForm\">Cargando...</div>";

    api("/settings").then(function (settings) {
      state.settings = settings;
      drawAjustes();
    });
  }

  function drawAjustes() {
    var s = state.settings;
    var form = document.getElementById("settingsForm");

    form.innerHTML =
      '<div class="card">' +
      '<div class="toggle-row"><input type="checkbox" id="aiEnabled" ' +
      (s.ai_enabled !== "0" ? "checked" : "") +
      ' /><label style="margin:0">IA activada (si la apagás, cuando no hay flujo que aplique se manda el mensaje por defecto)</label></div>' +
      '<div class="field"><label>Modelo de IA</label><select id="aiModel">' +
      '<option value="claude-haiku-4-5-20251001"' + (s.ai_model === "claude-haiku-4-5-20251001" || !s.ai_model ? " selected" : "") + ">Claude Haiku 4.5 (rápido y económico, recomendado para alto volumen)</option>" +
      '<option value="claude-sonnet-5"' + (s.ai_model === "claude-sonnet-5" ? " selected" : "") + ">Claude Sonnet 5 (más elaborado, mayor costo por mensaje)</option>" +
      "</select></div>" +
      '<div class="field"><label>Base de conocimiento / instrucciones para la IA</label>' +
      '<textarea id="aiPrompt" style="min-height:220px">' + escapeHtml(s.ai_system_prompt || "") + "</textarea>" +
      '<p class="hint">Acá describís tus verticales, precios conocidos y cómo querés que venda. La IA solo usa esta información, no inventa datos.</p></div>' +
      '<div class="field"><label>Mensaje por defecto (si la IA está apagada y nada coincide)</label>' +
      '<input type="text" id="fallbackMsg" value="' + escapeHtml(s.fallback_message || "") + '" /></div>' +
      '<div class="field"><label>Frases que derivan a un humano (separadas por coma)</label>' +
      '<input type="text" id="handoffKw" value="' + escapeHtml(s.handoff_keywords || "") + '" /></div>' +
      '<button class="btn" id="saveSettingsBtn">Guardar ajustes</button> ' +
      '<button class="btn ghost" id="seedBtn">Cargar contenido de ejemplo de COSMART</button>' +
      '<div id="settingsMsg" class="hint"></div>' +
      "</div>";

    document.getElementById("saveSettingsBtn").addEventListener("click", function () {
      var payload = {
        ai_enabled: document.getElementById("aiEnabled").checked ? "1" : "0",
        ai_model: document.getElementById("aiModel").value,
        ai_system_prompt: document.getElementById("aiPrompt").value,
        fallback_message: document.getElementById("fallbackMsg").value,
        handoff_keywords: document.getElementById("handoffKw").value,
      };
      api("/settings", { method: "PUT", body: JSON.stringify(payload) }).then(function () {
        document.getElementById("settingsMsg").textContent = "Guardado ✓";
      });
    });

    document.getElementById("seedBtn").addEventListener("click", function () {
      api("/seed", { method: "POST" }).then(function () {
        renderAjustes();
      });
    });
  }

  render();
})();
`;
