import puppeteer from "puppeteer"
import fs from "fs"
import { IMoviesAndSeries } from "../types/IMoviesAndSeries"
import { IStreamingProps } from "../types/IStreamingProps"
import { Streaming } from "../streaming"

export class Disney extends Streaming {
	private page!: puppeteer.Page

	constructor(private data: IStreamingProps) {
		super()
	}

	public async init() {
		console.time()
		await this.setup()
		await this.login()
		await this.getMoviesAndSeries()
		await this.closeBrowser()
		console.timeEnd()
	}

	// Main functions
	private async setup() {
		this.browser = await puppeteer.launch({
			headless: this.data.headless,
		})
		this.page = await this.browser.newPage()
		this.page.setDefaultNavigationTimeout(0)
	}

	private async login() {
		try {
			await this.page.goto("https://www.disneyplus.com/login")
			await this.page.waitForSelector('input[id="email"]', {
				timeout: 3000,
			})
			const username = await this.page.$('input[id="email"]')
			if (!!username) {
				await username?.type(this.data.login.username)
				await this.page.click('button[type="submit"]')
				await this.page.waitForSelector('input[id="password"]')

				const password = await this.page.$('input[id="password"]')
				await password?.type(this.data.login.password)
				await this.page.click('button[type="submit"]')
				await this.page.waitForNavigation()
			}
		} catch (err) {
			console.log("Already Logged")
		}
	}

	private async getMoviesAndSeries() {
		const codeTypes = [
			"movies/9f7c38e5-41c3-47b4-b99e-b5b3d2eb95d4",
			"series/53adf843-491b-40ae-9b46-bccbceed863b",
		]
		const moviesAndSeries: IMoviesAndSeries[] = []

		for (const code of codeTypes) {
			await this.page.goto(`https://www.disneyplus.com/pt-br/${code}`)
			await this.page.waitForSelector(".gv2-asset")

			let counter = 0
			const sliders = [...(await this.page.$$(".gv2-asset"))]

			for (const slider of sliders) {
				counter++
				console.log(`${counter} de ${sliders.length}`)

				const [title, imgSrc] = await slider.$eval("img", (el) => {
					return [el.getAttribute("alt"), el.getAttribute("src")]
				})

				const href = await slider.$eval(
					"a",
					(el) =>
						`https://www.disneyplus.com/pt-br/video/${el.getAttribute(
							"data-gv2elementvalue"
						)}`
				)

				moviesAndSeries.push({
					title: title,
					link: href,
					imgUrl: imgSrc,
					provider: "disney",
				})

				await this.scroll(sliders)
			}
		}
		this.saveData(moviesAndSeries, "disney")
	}

	// Secondary Functions
	private async scroll(sliders: puppeteer.ElementHandle[]) {
		await this.page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
		sliders.splice(0, sliders.length)
		sliders.push(...(await this.page.$$(".gv2-asset")))
	}
}
