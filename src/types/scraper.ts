import { Browser, Page, PuppeteerLaunchOptions } from "puppeteer"

export type PuppeteerWrapperConfigT = {
    browser_config: PuppeteerLaunchOptions,
    with_extra_page?: boolean,
    with_fingerprint_evasion?: boolean
}

export type ScrapperConfigT =  
    PuppeteerWrapperConfigT & {
    profile_url: string
}

export type PuppeteerWrapperStateT<PayloadT extends {}> = PuppeteerWrapperConfigT & {
    __internals: ScrapperInternalsT,
    payload: ScrapperPayloadT<PayloadT>,
    fingerprint_evasion: boolean
}

export type ScrapperStateT<PayloadT extends {}>  = 
    ScrapperConfigT & PuppeteerWrapperStateT<PayloadT>

export type ScrapperPayloadT<PayloadT extends {}> = PayloadT | null

export type ScrapperInternalsT = {
    browser: Browser | null
    page: Page | null
    extra_page?: Page | null
}