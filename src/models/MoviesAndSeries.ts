import mongoose from "mongoose"

const SchemaMoviesAndSeries = new mongoose.Schema({
    title: String,
    link: String,
    imgUrl: String,
    provider: String,
})

SchemaMoviesAndSeries.index({ title: "text" })

export default mongoose.model("titles", SchemaMoviesAndSeries)
