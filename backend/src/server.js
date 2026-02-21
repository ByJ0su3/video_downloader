import app from "./app.js";
import { startJobsSweeper } from "./services/ytdlp.service.js";

const PORT = Number(process.env.PORT || 8000);

app.listen(PORT, () => {
  console.log(`[backend] running on port ${PORT}`);
});

startJobsSweeper();
