const app = require("./app");
const { startJobsSweeper } = require("./services/download-jobs.service");

const PORT = Number(process.env.PORT || 8000);

app.listen(PORT, () => {
  console.log(`[backend] running on port ${PORT}`);
});

startJobsSweeper();
