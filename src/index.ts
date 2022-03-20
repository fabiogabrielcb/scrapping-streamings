import dotenv from "dotenv"
import { Disney } from "./streamings/disney"
import { Netflix } from "./streamings/netflix"

dotenv.config()

console.log(process.env.NETFLIX_PASS)

const netflixScrapper = new Netflix({
	login: {
		username: process.env.NETFLIX_EMAIL!,
		password: process.env.NETFLIX_PASS!,
	},
	headless: false,
})
const disneyScrapper = new Disney({
	login: {
		username: process.env.DISNEY_EMAIL!,
		password: process.env.DISNEY_PASS!,
	},
	headless: false,
})

netflixScrapper.init()
disneyScrapper.init()
