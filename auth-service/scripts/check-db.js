const mongoose = require("mongoose");

(async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/grocery_app");
    const collections = await mongoose.connection.db.listCollections().toArray();
    const names = collections.map((c) => c.name).sort();
    console.log("collections:", names.join(", "));
  } catch (error) {
    console.error("db-check failed:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
