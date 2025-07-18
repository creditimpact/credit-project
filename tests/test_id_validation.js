const { test } = require('node:test');
const assert = require('node:assert');
const express = require('../backend/node_modules/express');

const VALID_ID = '0123456789abcdef01234567';
const INVALID_ID = '12345';

const customerModelPath = require('path').resolve(__dirname, '../backend/models/Customer.js');

function withRouter(routerPath, handler) {
  const customerStub = {
    findById: async () => null,
    findByIdAndDelete: async () => null,
    save: async () => null
  };
  const cached = require.cache[customerModelPath];
  require.cache[customerModelPath] = { exports: customerStub };
  const router = require(routerPath);

  const app = express();
  app.use(express.json());
  app.use('/', router);

  return handler(app).finally(() => {
    if (cached) {
      require.cache[customerModelPath] = cached;
    } else {
      delete require.cache[customerModelPath];
    }
  });
}

function request(app, method, path) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const { port } = server.address();
      fetch(`http://localhost:${port}${path}`, { method })
        .then(async (res) => {
          server.close();
          resolve({ status: res.status });
        })
        .catch((err) => { server.close(); reject(err); });
    });
  });
}

test('customers route rejects invalid id', async () => {
  await withRouter('../backend/routes/customers', async (app) => {
    const res = await request(app, 'GET', `/${INVALID_ID}`);
    assert.strictEqual(res.status, 400);
  });
});

test('customers route allows valid id', async () => {
  await withRouter('../backend/routes/customers', async (app) => {
    const res = await request(app, 'GET', `/${VALID_ID}`);
    assert.strictEqual(res.status, 404);
  });
});

test('upload route rejects invalid id', async () => {
  await withRouter('../backend/routes/upload', async (app) => {
    const res = await request(app, 'DELETE', `/${INVALID_ID}`);
    assert.strictEqual(res.status, 400);
  });
});

test('upload route allows valid id', async () => {
  await withRouter('../backend/routes/upload', async (app) => {
    const res = await request(app, 'DELETE', `/${VALID_ID}`);
    assert.strictEqual(res.status, 404);
  });
});
