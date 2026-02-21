const app = require("./app");

const PORT = Number(process.env.PORT || 8000);

app.listen(PORT, () => {
  console.log(`[backend] running on port ${PORT}`);
});
