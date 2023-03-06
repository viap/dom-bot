export default {
  url: "mongodb://localhost:27017",
  opts: {
    /** Set to false to [disable buffering](http://mongoosejs.com/docs/faq.html#callback_never_executes) on all models associated with this connection. */
    // bufferCommands?: boolean;
    /** The name of the database you want to use. If not provided, Mongoose uses the database name from connection string. */
    dbName: "domQuizBot",
    /** username for authentication, equivalent to `options.auth.user`. Maintained for backwards compatibility. */
    user: "root",
    /** password for authentication, equivalent to `options.auth.password`. Maintained for backwards compatibility. */
    pass: "example",
    /** Set to false to disable automatic index creation for all models associated with this connection. */
    // autoIndex?: boolean;
    /** Set to `true` to make Mongoose automatically call `createCollection()` on every model created on this connection. */
    // autoCreate?: boolean;
  },
}
