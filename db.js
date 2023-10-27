import mongoose from "mongoose";

export const connection = () => {
  const MONGODB_URI =
    "mongodb+srv://ahmedzulfiqar:imblue-12345@cluster-1.rngu240.mongodb.net/?retryWrites=true&w=majority";
  mongoose.connect(MONGODB_URI, { useNewUrlParser: true });
  mongoose.connection.on("connected", () => {
    console.log("database connected");
  });
  mongoose.connection.on("disconnected", () => {
    console.log("database disconnected");
  });
  mongoose.connection.on("error", () => {
    console.log("error", error.message);
  });
};
export default connection;
