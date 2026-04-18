process.chdir(`${__dirname}/backend`);

import("./backend/server.js").catch((error) => {
  console.error("Failed to start backend/server.js:", error);
  process.exit(1);
});
