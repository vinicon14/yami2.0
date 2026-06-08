/**
 * Google OAuth 2.0 Handler
 * Exemplo de implementação para autenticação OAuth
 * 
 * Fluxo:
 * 1. buildAuthUrl() - Gera URL de autorização
 * 2. exchangeCode() - Troca code por access token
 * 3. refreshToken() - Renova token expirado
 */

const https = require("https");
const crypto = require("crypto");

/**
 * Construir URL de autorização do Google
 */
function buildAuthUrl(clientId, redirectUri, scopes = []) {
  const state = crypto.randomBytes(16).toString("hex");
  const scope = scopes.join(" ");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
    state,
    access_type: "offline", // Obter refresh token
    prompt: "consent" // Forçar consentimento mesmo que já autorizado
  });

  return {
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    state
  };
}

/**
 * Trocar código de autorização por tokens
 */
async function exchangeCode(code, clientId, clientSecret, redirectUri) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri
    });

    const options = {
      hostname: "oauth2.googleapis.com",
      path: "/token",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": postData.length
      }
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          if (response.error) {
            reject(new Error(`Google OAuth error: ${response.error} - ${response.error_description}`));
          } else {
            resolve({
              accessToken: response.access_token,
              refreshToken: response.refresh_token, // Pode ser null em atualizações
              expiresAt: new Date(Date.now() + (response.expires_in * 1000)).toISOString(),
              tokenType: response.token_type || "Bearer",
              scope: response.scope
            });
          }
        } catch (e) {
          reject(new Error(`Erro ao parsear resposta Google: ${e.message}`));
        }
      });
    });

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Renovar access token usando refresh token
 */
async function refreshToken(refreshToken, clientId, clientSecret) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken
    });

    const options = {
      hostname: "oauth2.googleapis.com",
      path: "/token",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": postData.length
      }
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          if (response.error) {
            reject(new Error(`Google refresh error: ${response.error}`));
          } else {
            resolve({
              accessToken: response.access_token,
              refreshToken: refreshToken, // Mantém o refresh token anterior
              expiresAt: new Date(Date.now() + (response.expires_in * 1000)).toISOString(),
              tokenType: response.token_type || "Bearer",
              scope: response.scope
            });
          }
        } catch (e) {
          reject(new Error(`Erro ao renovar token: ${e.message}`));
        }
      });
    });

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Obter informações do usuário
 */
async function getUserInfo(accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "www.googleapis.com",
      path: "/oauth2/v2/userinfo",
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

/**
 * Validar access token
 */
async function validateToken(accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "www.googleapis.com",
      path: `/oauth2/v1/tokeninfo?access_token=${accessToken}`,
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          if (response.error) {
            resolve({ valid: false, error: response.error_description });
          } else {
            resolve({
              valid: true,
              email: response.email,
              expiresIn: response.expires_in,
              scope: response.scope
            });
          }
        } catch (e) {
          resolve({ valid: false, error: e.message });
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

/**
 * Configuração do provedor
 */
const config = {
  provider: "google",
  authType: "oauth2",
  endpoints: {
    auth: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
    revoke: "https://oauth2.googleapis.com/revoke",
    userinfo: "https://www.googleapis.com/oauth2/v2/userinfo"
  },
  scopes: {
    email: "https://www.googleapis.com/auth/gmail.readonly",
    calendar: "https://www.googleapis.com/auth/calendar.readonly",
    drive: "https://www.googleapis.com/auth/drive.readonly",
    photos: "https://www.googleapis.com/auth/photoslibrary.readonly",
    contacts: "https://www.googleapis.com/auth/contacts.readonly"
  },
  defaultScopes: [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/photoslibrary.readonly"
  ]
};

module.exports = {
  buildAuthUrl,
  exchangeCode,
  refreshToken,
  getUserInfo,
  validateToken,
  config,
  // Exports para uso externo
  oauthFlow: {
    buildAuthUrl,
    exchangeCode,
    refreshToken
  }
};

/**
 * Exemplo de uso:
 * 
 * const googleAuth = require('./oauth-google-example');
 * 
 * // 1. Obter URL de login
 * const { url, state } = googleAuth.buildAuthUrl(
 *   process.env.GOOGLE_CLIENT_ID,
 *   process.env.GOOGLE_REDIRECT_URI,
 *   googleAuth.config.defaultScopes
 * );
 * 
 * // 2. Usuário visita URL e volta com code
 * const tokens = await googleAuth.exchangeCode(
 *   code,
 *   process.env.GOOGLE_CLIENT_ID,
 *   process.env.GOOGLE_CLIENT_SECRET,
 *   process.env.GOOGLE_REDIRECT_URI
 * );
 * 
 * // 3. Salvar tokens e usar
 * accountManager.saveToken('google', tokens);
 * 
 * // 4. Quando precisar, renovar se expirado
 * if (accountManager.isTokenExpired('google')) {
 *   const token = accountManager.getToken('google');
 *   const newTokens = await googleAuth.refreshToken(
 *     token.refreshToken,
 *     process.env.GOOGLE_CLIENT_ID,
 *     process.env.GOOGLE_CLIENT_SECRET
 *   );
 *   accountManager.saveToken('google', newTokens);
 * }
 */
