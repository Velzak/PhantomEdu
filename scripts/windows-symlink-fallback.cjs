/**
 * Vercel CLI aliases shared serverless functions with fs.symlink.
 * Windows needs Administrator or Developer Mode for those. Copy instead
 * so the uploaded output contains real directories Linux can read.
 */
const fs = require("fs");
const path = require("path");

function absTarget(target, dest) {
  return path.isAbsolute(target)
    ? target
    : path.resolve(path.dirname(path.resolve(dest)), target);
}

function fallback(target, dest) {
  const resolved = absTarget(target, dest);
  const destAbs = path.resolve(dest);
  fs.cpSync(resolved, destAbs, { recursive: true });
}

function isDenied(err) {
  return Boolean(err && (err.code === "EPERM" || err.code === "EACCES"));
}

const origSync = fs.symlinkSync.bind(fs);
fs.symlinkSync = function symlinkSyncPatched(target, dest, type) {
  try {
    return origSync(target, dest, type);
  } catch (err) {
    if (!isDenied(err)) throw err;
    fallback(target, dest);
  }
};

const origCb = fs.symlink.bind(fs);
fs.symlink = function symlinkPatched(target, dest, type, cb) {
  if (typeof type === "function") {
    cb = type;
    type = undefined;
  }
  origCb(target, dest, type, (err) => {
    if (isDenied(err)) {
      try {
        fallback(target, dest);
        cb?.(null);
      } catch (copyErr) {
        cb?.(copyErr);
      }
      return;
    }
    cb?.(err);
  });
};

const origPromise = fs.promises.symlink.bind(fs.promises);
fs.promises.symlink = async function symlinkPromisePatched(target, dest, type) {
  try {
    return await origPromise(target, dest, type);
  } catch (err) {
    if (!isDenied(err)) throw err;
    fallback(target, dest);
  }
};
