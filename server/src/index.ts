import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`EcoSphere API running on http://localhost:${env.PORT}`);
});
