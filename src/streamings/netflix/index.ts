import puppeteer from "puppeteer"
import fs from "fs"
import { IMoviesAndSeries } from "../types/IMoviesAndSeries"
import { IStreamingProps } from "../types/IStreamingProps"
import { Streaming } from "../streaming"

export class Netflix extends Streaming {
	// private browser!: puppeteer.Browser
	private page!: puppeteer.Page

	constructor(private data: IStreamingProps) {
		super()
	}

	public async init() {
		console.time()
		await this.setup()
		await this.login()
		await this.chooseProfile()
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
		await this.page.goto("https://www.netflix.com/browse")
		const username = await this.page.$('[data-uia="login-field"]')
		const password = await this.page.$('[data-uia="password-field"]')

		if (!!username && !!password) {
			await username.type(this.data.login.username)
			await password.type(this.data.login.password)
			await this.page.click('button[type="submit"]')
			await this.page.waitForNavigation()
		}
	}

	private async chooseProfile() {
		try {
			const profile = await this.page.$(
				'[data-uia="action-select-profile+primary"]'
			)
			if (!profile) throw new Error("Profile not found")

			profile.click()
		} catch (err) {
			console.log("Profile not found")
		} finally {
			await this.page.waitForTimeout(3000)
		}
	}

	private async getMoviesAndSeries() {
		const codeTypes = [34399, 83]
		const moviesAndSeries: IMoviesAndSeries[] = []

		for (const code of codeTypes) {
			await this.page.goto(`https://www.netflix.com/browse/genre/${code}?so=su`)
			await this.chooseProfile()

			const genres = await this.page.$(".subgenres")
			const genresButton = await genres?.$(
				'[aria-labelledby="profileLanguageDropDown-header"]'
			)

			await genresButton?.click()

			const titles = []
			const categories = await this.page.$$eval(".sub-menu-link", (el) => {
				return el.map((element) => {
					const href = element.getAttribute("href")
					const codeNumber = href?.split("?")[0].split("/")[3]
					return codeNumber
				})
			})

			for (const category of categories) {
				await this.page.goto(
					`https://www.netflix.com/browse/genre/${category}?bc=${code}&so=su`
				)

				await this.chooseProfile()

				const sliders = [...(await this.page.$$(".slider"))]
				let counter = 0

				for (const slider of sliders) {
					counter++
					console.log(`${counter} de ${sliders.length}`)

					const sliderChildren = await slider.$$(".slider-item")

					for (const sliderChild of sliderChildren) {
						const title = await sliderChild.$eval("a", (el) =>
							el.getAttribute("aria-label")
						)
						const titlesToCompare = [...titles, title]
						if (this.hasDuplicates(titlesToCompare)) continue

						const link = await sliderChild.$("a")
						const href = await (await link!.getProperty("href")).jsonValue()

						const img = await link?.$("img")
						const src = await (await img!.getProperty("src")).jsonValue()

						titles.push(title)
						moviesAndSeries.push({
							title: title,
							link: href,
							imgUrl: src,
							provider: "netflix",
						})
					}

					await this.scroll(sliders)
					while (true) {
						const spinLoader = await this.page.$(".gallerySpinLoader")
						await this.scroll(sliders)
						if (!spinLoader) break
					}
				}
			}
		}
		this.saveData(moviesAndSeries, "netflix")
	}

	// Secondary Functions
	private hasDuplicates(array: any[]) {
		return new Set(array).size !== array.length
	}

	private async scroll(sliders: puppeteer.ElementHandle[]) {
		await this.page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
		sliders.splice(0, sliders.length)
		sliders.push(...(await this.page.$$(".slider")))
	}
}
