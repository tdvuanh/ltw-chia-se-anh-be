import { ENV } from "./config/env";
import app from "./app";

app.listen(ENV.PORT, () => {
  console.log(`[server] listening on http://localhost:${ENV.PORT} (${ENV.NODE_ENV})`);
});
