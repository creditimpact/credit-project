const { test } = require('node:test');
const assert = require('node:assert');
const express = require('../backend/node_modules/express');
const path = require('path');

function withRouter(handler) {
  const authPath = path.resolve(__dirname, '../backend/middleware/auth.js');
  const cachedAuth = require.cache[authPath];
  require.cache[authPath] = { exports: (req, res, next) => next() };

  const router = require('../backend/routes/files');
  const app = express();
  app.use('/', router);

  return handler(app).finally(() => {
    if (cachedAuth) {
      require.cache[authPath] = cachedAuth;
    } else {
      delete require.cache[authPath];
    }
    delete require.cache[require.resolve('../backend/routes/files')];
  });
}

function requestJson(app, method, path) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const { port } = server.address();
      fetch(`http://localhost:${port}${path}`, { method })
        .then(async (res) => {
          const body = await res.json().catch(() => ({}));
          server.close();
          resolve({ status: res.status, body });
        })
        .catch((err) => { server.close(); reject(err); });
    });
  });
}

test('returns full URL unchanged', async () => {
  await withRouter(async (app) => {
    const { status, body } = await requestJson(app, 'GET', '/get-signed-url?key=http://example.com/x.pdf');
    assert.strictEqual(status, 200);
    assert.strictEqual(body.url, 'http://example.com/x.pdf');
  });
});

test('rejects literal "undefined"', async () => {
  await withRouter(async (app) => {
    const { status } = await requestJson(app, 'GET', '/get-signed-url?key=undefined');
    assert.strictEqual(status, 400);
  });
});

test('rejects suspicious key', async () => {
  await withRouter(async (app) => {
    const { status } = await requestJson(app, 'DELETE', '/delete?key=../secret');
    assert.strictEqual(status, 400);
  });
});
