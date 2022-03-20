import puppeteer from "puppeteer"
import fs from "fs"
import { IMoviesAndSeries } from "./types/IMoviesAndSeries"

export class Streaming {
	public browser!: puppeteer.Browser

	public async closeBrowser() {
		this.browser.close()
	}

	public async saveData(data: IMoviesAndSeries[], fileName: string) {
		fs.writeFile(
			`../../storage/${fileName}.json`,
			JSON.stringify(data, null, 2),
			(err) => {
				if (err instanceof Error) console.log("Error saving data", err)
				else console.log("Successfully saved")
			}
		)
	}
}
