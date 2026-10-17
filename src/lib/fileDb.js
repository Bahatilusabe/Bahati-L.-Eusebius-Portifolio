import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const base = path.join(process.cwd(), 'src', 'data', 'offline');
if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });

function filePath(name) {
  return path.join(base, `${name}.json`);
}

function read(name) {
  const p = filePath(name);
  try {
    if (!fs.existsSync(p)) return [];
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.warn('fileDb read error', err && err.message);
    return [];
  }
}

function write(name, data) {
  const p = filePath(name);
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}

async function readAsync(name) {
  const p = filePath(name);
  try {
    if (!fs.existsSync(p)) return [];
    const raw = await fs.promises.readFile(p, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.warn('fileDb readAsync error', err && err.message);
    return [];
  }
}

async function writeAsync(name, data) {
  const p = filePath(name);
  await fs.promises.writeFile(p, JSON.stringify(data, null, 2), 'utf8');
}

export const fileDb = {
  list(name) {
    return read(name);
  },
  get(name, id) {
    const items = read(name);
    return items.find((i) => i.id === id) || null;
  },
  create(name, data) {
    const items = read(name);
    const item = { id: data.id || randomUUID(), createdAt: new Date().toISOString(), ...data };
    items.unshift(item);
    write(name, items);
    return item;
  },
  update(name, id, updates) {
    const items = read(name);
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    write(name, items);
    return items[idx];
  },
  delete(name, id) {
    const items = read(name);
    const filtered = items.filter((i) => i.id !== id);
    write(name, filtered);
    return true;
  },
  // Async variants
  async listAsync(name) {
    return await readAsync(name);
  },
  async getAsync(name, id) {
    const items = await readAsync(name);
    return items.find((i) => i.id === id) || null;
  },
  async createAsync(name, data) {
    const items = await readAsync(name);
    const item = { id: data.id || randomUUID(), createdAt: new Date().toISOString(), ...data };
    items.unshift(item);
    await writeAsync(name, items);
    return item;
  },
  async updateAsync(name, id, updates) {
    const items = await readAsync(name);
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    await writeAsync(name, items);
    return items[idx];
  },
  async deleteAsync(name, id) {
    const items = await readAsync(name);
    const filtered = items.filter((i) => i.id !== id);
    await writeAsync(name, filtered);
    return true;
  },
};
