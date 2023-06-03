import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
puppeteer.use(StealthPlugin());
import { plugin } from "puppeteer-with-fingerprints";
import { EvaluateFuncWith } from "puppeteer";
import { PuppeteerWrapperConfigT } from "../types/scraper";


export class FruitfulPuppeteerWrapper<PayloadT extends {}> {
  protected _state: PuppeteerWrapperStateT<PayloadT>;
  logger!: Logger;

  constructor({ browser_config, with_extra_page, with_fingerprint_evasion }: PuppeteerWrapperConfigT) {

    const __internals = 
      with_extra_page? 
        {
          browser: null,
          page: null,
        } : {
          browser: null,
          page: null,
          extra_page: null
        }

    this._state = {
      browser_config,
      __internals,
      payload: null,
      fingerprint_evasion: !!with_fingerprint_evasion
    };
  }

  private set browser(new_value: typeof this._state.__internals.browser) {
    this._state.__internals.browser = new_value;
  }

  private get browser() {
    return this._state.__internals.browser;
  }

  protected get page() {
    return this._state.__internals.page;
  }

  protected set page(new_value: typeof this._state.__internals.page) {
    this._state.__internals.page = new_value;
  }
  protected get extra_page() {
    return this._state.__internals.extra_page!;
  }

  protected set extra_page(new_value: typeof this._state.__internals.page) {
    this._state.__internals.extra_page = new_value;
  }

  protected get payload() {
    return this._state.payload;
  }

  protected set payload(new_value: typeof this._state.payload) {
    this._state.payload = new_value;
  }

  public async _setup() {

    if(this._state.fingerprint_evasion) {
      const fingerprint = await plugin.fetch('', {
            tags: ['Microsoft Windows', 'Chrome'],

        })
        plugin.useFingerprint(fingerprint)

      this.browser = await plugin.launch(this._state.browser_config);
    } else {
      this.browser = await puppeteer.launch(this._state.browser_config);
    }

    this.page = await this.browser.newPage();
    if('extra_page' in this._state.__internals) this.extra_page = await this.browser.newPage()

  }
  private async _cleanup() {
    if (this.browser && this.page) {
      await this.page.close();
      if(this.extra_page) await this.extra_page.close()
      await this.browser.close();
    }
  }

  protected async _pre_extract() {}
  protected async _extract() {}
  protected async _post_extract() {}

  public async exec() {
    await this._setup();
    await this._pre_extract();
    await this._extract();
    await this._post_extract();
    //await this._cleanup()

    return this.payload;
  }
}


export class SuperFruitfulPuppeteerWrapper<
  PayloadT extends {}
> extends FruitfulPuppeteerWrapper<PayloadT> {

  constructor({ browser_config }: PuppeteerWrapperConfigT) {
    super({ browser_config });
  }

  public async type(selector: string, text: string) {
    if (!this.page) return;
    await this.page
      .waitForSelector(selector)
      .then(async () => {
        if (!this.page) return;
        await this.page.type(selector, text, {
          delay: Math.random() * 100 + 100,
        })
        .then(()=>{
          this.logger.info(`Typed: "${text}" into [${selector}].`);
        })
        .catch((error)=>{
          this.logger.error(`${error} | ${this.page!.url()}`)
        })

      })
      .catch(() => {
        this.logger.error(`Timeout waiting for element [${selector}].`);
      });
  }

  public async click(selector: string) {
    if (!this.page) return;
    await this.page
      .waitForSelector(selector)
      .then(async () => {
        if (!this.page) return;
        await this.page.click(selector, {
          delay: Math.random() * 100 + 100,
        })
          .then(()=>{
            this.logger.info(`Clicked on [${selector}].`);
          })
          .catch((error)=>{
            this.logger.error(`${error} | ${this.page!.url()}`)
          })
      })
      .catch(() => {
        this.logger.error(`Timeout waiting for element [${selector}].`);
      });
  }

  public async navigate(url: string) {
    if (!this.page) return;
    await this.page
      .goto(url, { waitUntil: "networkidle2" })
      .then(() => {
        this.logger.info(`Navigated to [${url}].`);
      })
      .catch(() => {
        this.logger.error(`Navigation to [${url}] failed.`);
      });


  }

  public async getText(selector: string, parser?: (text: string)=>string) {
    if (!this.page) return "";
    const text = await this.page.$eval(selector, (el) => {
      return el.textContent || '';
    })
      .catch((error)=>{
        this.logger.error(`${error} | ${this.page!.url()}`)
        return ""
      })
    this.logger.info(`Extracted text [${text}] from [${selector}].`);
    if(parser) {
      return parser(text)
    }
    return text;
  }

  public async getLink(selector: string) {
    if (!this.page) return null;
    const link = await this.page.$eval(selector, (el) => {
      return el.getAttribute("href");
    })
      .catch((error)=>{
        this.logger.error(`${error} | ${this.page!.url()}`)
        return ""
      })
    this.logger.info(`Extracted link [${link}] from [${selector}].`);
    return link || null;
  }

  public async iterateOverListing<SelectorsT extends {}, InfoT extends Record<keyof SelectorsT, string>>(selector: string, extractor: EvaluateFuncWith<Element[], [SelectorsT]>, selectors: SelectorsT): Promise<InfoT[]> {
    if (!this.page) return [];
    const list = await this.page.$$eval(selector, extractor, selectors) 
      .catch((error)=>{
        this.logger.error(`${error} | ${this.page!.url()}`)
        return []
      })

    return list as InfoT[];
  }

}