/* Nova Natie App — Microsoft 365 login & mail via Microsoft Graph
   ----------------------------------------------------------------
   Gebruikt MSAL.js (browser) met "delegated" toestemming: de app
   handelt namens de INGELOGDE gebruiker. Mail vertrekt dus vanaf het
   eigen @nova.be-adres van wie is aangemeld (Graph /me/sendMail).

   ⚙️  CONFIGURATIE — vul hieronder de Client ID in die je krijgt na
       het registreren van de app in Entra ID (zie README / registratiestappen).
*/

var MSAL_CONFIG = {
  auth: {
    // 👇 Vervang dit door de "Toepassings-id (client)" uit de Entra-app-registratie
    clientId: 'VUL-HIER-DE-CLIENT-ID-IN',
    // Nova Natie NV tenant
    authority: 'https://login.microsoftonline.com/9b502266-df1a-462b-a318-066b50a228a8',
    // Moet exact matchen met een geregistreerde redirect-URI (SPA-platform)
    redirectUri: window.location.origin + window.location.pathname
  },
  cache: { cacheLocation: 'localStorage', storeAuthStateInCookie: false }
};

// Delegated Graph-permissies: eigen profiel lezen + mail versturen
var GRAPH_SCOPES = ['User.Read', 'Mail.Send'];

var msalInstance = null;
var _msalInit = null;

/* MSAL éénmalig initialiseren + bestaande sessie herstellen */
function ensureMsal() {
  if (_msalInit) return _msalInit;
  _msalInit = (async function () {
    if (typeof msal === 'undefined') {
      throw new Error('MSAL-bibliotheek niet geladen (geen internet of script geblokkeerd?)');
    }
    msalInstance = new msal.PublicClientApplication(MSAL_CONFIG);
    await msalInstance.initialize();
    var accounts = msalInstance.getAllAccounts();
    if (accounts.length && !msalInstance.getActiveAccount()) {
      msalInstance.setActiveAccount(accounts[0]);
    }
  })();
  return _msalInit;
}

/* Interactief aanmelden — opent Microsoft 365 loginvenster */
async function graphLogin() {
  await ensureMsal();
  var result = await msalInstance.loginPopup({ scopes: GRAPH_SCOPES, prompt: 'select_account' });
  msalInstance.setActiveAccount(result.account);
  return result.account;
}

/* Afmelden (optioneel te koppelen aan een logout-knop) */
async function graphLogout() {
  await ensureMsal();
  var account = msalInstance.getActiveAccount();
  await msalInstance.logoutPopup({ account: account });
}

/* Access-token ophalen — stil, met terugval op een popup als dat nodig is */
async function getGraphToken() {
  await ensureMsal();
  var account = msalInstance.getActiveAccount();
  if (!account) throw new Error('Niet aangemeld');
  try {
    var res = await msalInstance.acquireTokenSilent({ scopes: GRAPH_SCOPES, account: account });
    return res.accessToken;
  } catch (e) {
    var res2 = await msalInstance.acquireTokenPopup({ scopes: GRAPH_SCOPES });
    return res2.accessToken;
  }
}

/* HTML-escaping tegen ongewenste opmaak/injectie in vrije tekstvelden */
function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* Mail versturen namens de ingelogde gebruiker via Microsoft Graph.
   opts: { to: string|string[], cc?: string|string[], subject, html, photoDataUrl? } */
async function sendGraphMail(opts) {
  var token = await getGraphToken();

  function toRec(list) {
    return (Array.isArray(list) ? list : [list]).filter(Boolean).map(function (a) {
      return { emailAddress: { address: a } };
    });
  }

  var message = {
    subject: opts.subject,
    body: { contentType: 'HTML', content: opts.html },
    toRecipients: toRec(opts.to)
  };
  if (opts.cc) message.ccRecipients = toRec(opts.cc);

  if (opts.photoDataUrl && opts.photoDataUrl.indexOf('base64,') > -1) {
    message.attachments = [{
      '@odata.type': '#microsoft.graph.fileAttachment',
      name: 'melding-foto.jpg',
      contentType: 'image/jpeg',
      contentBytes: opts.photoDataUrl.split('base64,')[1]
    }];
  }

  var resp = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: message, saveToSentItems: true })
  });

  if (!resp.ok) {
    var txt = await resp.text();
    throw new Error('Graph sendMail ' + resp.status + ': ' + txt);
  }
}
