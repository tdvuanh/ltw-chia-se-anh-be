import app from "./app";
import { ENV } from "./config/env";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}/${ENV.API_URI_PREFIX}`,
  );
});
