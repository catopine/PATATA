/**
 * PATATA - A NationStates utility to help tag regions
 * Copyright (C) 2026  Catopine
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import * as ui from './ui.js'
import { userSettings } from './settings.js'
import { tagSettings } from './checking.js'

// Gonna make this a class. Seems like a decent way to do it.
// Really have no idea lol. This is getting confusing
// Gonna try my best to copy Henson. Thank you Nota

/**
 * This class interacts with the NS HTML site, and handles its responses
 */
export class NsHtml
{
    private static myHeaders: Headers = new Headers({})
    private static userClickTime: string
    private static httpUrl: string = 'https://www.nationstates.net'

    /**
     * Logs into a nation capable of tagging its region
     * @param nationRegionPair A taggable region and its corresponding nation
     * @returns The info required to validate future requests, or null on failure
     */
    async login (nationRegionPair: ui.NationRegionPair): Promise<ui.ValidationStuff | null>
    {
        // Why does Henson use a region
        const nation: string = nationRegionPair.nation!
        const password: string = userSettings.pass
        
        const data: FormData = new FormData()
        data.set('nation', nation)
        data.set('password', password)
        data.set('logging_in', '1')

        /*const body: string = JSON.stringify(
            {
                nation: nation,
                password: password,
                logging_in: '1',
                userclick: TagFetch.userClickTime
            }
        )*/
        // This link is what Nota had (I think). Don't really know what it'll do
        const htmlRequest: Request = new Request (`${NsHtml.httpUrl}/region=porcupine?userclick=${NsHtml.userClickTime}`,
        {
            method: 'POST',
            body: data,
            headers: NsHtml.myHeaders
        })
        try
        {
            if (htmlRequest.headers.get('User-Agent') === null)
            {
                // I don't think it will ever be null tbh
                // Future Porc here. Actually it will be now if the header isn't set properly
                // I know what I'm doing. Trust
                throw new Error(`Please set a User Agent before using this script`)
            }
            /*else if (htmlRequest.headers.get('User-Agent') !== `PATATA/${ui.PATATA_VERSION} (by:Tyrannical Porcupines United\u{003B} usedBy:${ui.desanitize((await browser.storage.local.get('ua')).value)})`)
            {
                throw new Error(`Please set a User Agent before using this script`)
            }*/

            //const fetchResponse: string = await TagFetch.fetchRequest(loginRequest)
            const htmlResponse: Response = await fetch(htmlRequest)
            if (!htmlResponse.ok)
            {
                throw new Error(`Response status: ${htmlResponse.status}`)
            }
            //const fetchResponse2 = fetchResponse.clone()
            const htmlResponseString: string = await htmlResponse.text()

            const htmlParser: DOMParser = new DOMParser()
            const parsedResponse = htmlParser.parseFromString(htmlResponseString, 'text/html')
            const parseError = parsedResponse.querySelector('parsererror')
            if (parseError !== null)
            {
                throw new Error('HTML parsing error')
            }

            const chk: string | undefined | null = (parsedResponse.getElementsByName('chk')[0] as HTMLInputElement).value
            // Don't think I even need localid, I don't think it's used for tagging
            const localId: string = (parsedResponse.getElementsByName('localid')[0] as HTMLInputElement).value
            const activeTab: browser.tabs.Tab = (await ui.getTabs())[0]!
            const pinCookie: browser.cookies.Cookie | null = await browser.cookies.get({
                url: activeTab.url!,
                name: 'pin'
            })
            if (pinCookie === null)
            {
                // Don't think this will ever run, the error should be thrown when getting the cookie
                throw new Error ('Getting the PIN failed')
            }
            else if (chk === undefined || chk === null)
            {
                throw new Error ('Getting the Chk failed')
            }
            const pin: string = pinCookie!.value

            const validation: ui.ValidationStuff = 
            {
                chk: chk,
                localid: localId,
                pin: pin
            }

            return validation
        }
        catch (error)
        {
            console.error(error)
            return null
        }
    }

    /**
     * Sets the WFE of a region
     * @param region The region
     * @param check The chk to validate the login
     * @param pin The PIN to validate the login
     * @param wfe The WFE
     * @returns A boolean that says if setting the WFE succeeded
     */
    async setWfe (region: string, check: string, pin: string, wfe: string): Promise<boolean>
    {
        try {
            const activeTab: browser.tabs.Tab = (await ui.getTabs())[0]!
            // My understanding is that this doesn't send any requests to the server
            // But I don't have a clue what cookies really are, so ̄¯\_(ツ)_/¯
            const pinCookie: browser.cookies.Cookie | null = await browser.cookies.set({
                url: activeTab.url!,
                name: 'pin',
                value: pin
            })
            if (pinCookie === null)
            {
                throw new Error(`Setting the pin failed.`)
            }
        }
        catch (error)
        {
            console.error(error)
            return false
        }

        // I think this will work properly?
        const encodedWFE: string = wfe.replace(/[^\x00-\x7F]/ugm, s => `&#${s.codePointAt(0)};`)
        const data: FormData = new FormData()
        data.set('page', 'region_control')
        data.set('chk', check)
        data.set('region', region)
        data.set('setwfebutton', '1')
        data.set('message', encodedWFE)
        /*const body: string = JSON.stringify(
            {
                page: 'region_control',
                chk: check,
                region: region,
                setwfebutton: '1',
                userclick: TagFetch.userClickTime,
                message: wfe
            }
        )*/

        const htmlRequest: Request = new Request (`${NsHtml.httpUrl}/template-overall=none/page=region_control?userclick=${NsHtml.userClickTime}`,
            {
                method: 'POST',
                body: data,
                headers: NsHtml.myHeaders
            }
        )

        try
        {
            if (htmlRequest.headers.get('User-Agent') === null)
            {
                throw new Error(`Please set a User Agent before using this script`)
            }
            /*else if (htmlRequest.headers.get('User-Agent') !== `PATATA/${ui} (by:Tyrannical Porcupines United\u{003B} usedBy:${ui.desanitize((await browser.storage.local.get('ua')).value)})`)
            {
                throw new Error(`Please set a User Agent before using this script`)
            }*/

            const htmlResponse: Response = await fetch(htmlRequest)
            if (!htmlResponse.ok)
            {
                throw new Error(`Response status: ${htmlResponse.status}`)
            }

            const htmlResponseString = await htmlResponse.text()
            // No idea if it would return null or undefined, so I'll just have both in case
            const successful: boolean = htmlResponseString !== null && htmlResponseString !== undefined && htmlResponseString.includes('World Factbook Entry updated!')
            
            return successful
        }
        catch (error)
        {
            console.error(error)
            return false
        }
    }

    // Tf is the CGI?
    /**
     * This uploads a banner to the NS CGI to be later set on the region
     * @param region The region to upload it to
     * @param check The chk to verify the request
     * @param pin The PIN to verify the request
     * @param file The file of the banner to upload
     * @returns The id of the banner to be later set, or null on failure
     */
    async uploadBanner (region: string, check: string, pin: string, file: File): Promise<string | null>
    {
        const data: FormData = new FormData()
        data.set('file_upload_rbanner', tagSettings.banner!)
        data.set('page', 'region_control')
        data.set('uploadtype', 'rbanner')
        data.set('expect', 'json')
        data.set('chk', check)
        data.set('region', region)

        try
        {
            const activeTab: browser.tabs.Tab = (await ui.getTabs())[0]!
            const pinCookie: browser.cookies.Cookie | null = await browser.cookies.set({
                url: activeTab.url!,
                name: 'pin',
                value: pin
            })
            if (pinCookie === null)
            {
                throw new Error(`Setting the pin failed.`)
            }
        }
        catch (error)
        {
            console.error(error)
            return null
        }

        const htmlRequest: Request = new Request (`${NsHtml.httpUrl}/cgi-bin/upload.cgi?userclick=${NsHtml.userClickTime}`,
            {
                method: 'POST',
                body: data,
                headers: NsHtml.myHeaders
            }
        )

        try
        {
            if (htmlRequest.headers.get('User-Agent') === null)
            {
                throw new Error(`Please set a User Agent before using this script`)
            }
            /*else if (htmlRequest.headers.get('User-Agent') !== `PATATA/${ui.PATATA_VERSION} (by:Tyrannical Porcupines United\u{003B} usedBy:${ui.desanitize((await browser.storage.local.get('ua')).value)})`)
            {
                throw new Error(`Please set a User Agent before using this script`)
            }*/

            const htmlResponse: Response = await fetch(htmlRequest)
            if (!htmlResponse.ok)
            {
                throw new Error(`Response status: ${htmlResponse.status}`)
            }

            // Ftr, this doesn't return Json, it parses the Json to get a JS object
            // This may be obvious to you dear reader, but it took me ages to figure out
            const htmlResponseJson = await htmlResponse.json()
            if (htmlResponseJson && typeof htmlResponseJson === 'object' && 'id' in htmlResponseJson)
            {
                // This prob breaks everything
                const bannerId: string = htmlResponseJson.id.toString()
                return bannerId
            }
            else
            {
                throw new Error (`Porc doesn't have a clue what she's doing, tell her to fix the htmlResponseJson of uploadBanner in tagging.ts`)
            }
        }
        catch (error)
        {
            console.error(error)
            return null
        }
    }

    /**
     * This uploads a flag to the NS CGI to be later set
     * @param region The region to upload it to
     * @param check The chk for verification
     * @param pin The PIN for verification
     * @param file The file of the flag to upload
     * @returns A string of the flag id, or null on failure
     */
    async uploadFlag (region: string, check: string, pin: string, file: File): Promise<string | null>
    {
        const data: FormData = new FormData()
        data.set('file_upload_rflag', tagSettings.flag!)
        data.set('page', 'region_control')
        data.set('uploadtype', 'rflag')
        data.set('expect', 'json')
        data.set('chk', check)
        data.set('region', region)

        try
        {
            const activeTab: browser.tabs.Tab = (await ui.getTabs())[0]!
            const pinCookie: browser.cookies.Cookie | null = await browser.cookies.set({
                url: activeTab.url!,
                name: 'pin',
                value: pin
            })
            if (pinCookie === null)
            {
                throw new Error(`Setting the pin failed.`)
            }
        }
        catch (error)
        {
            console.error(error)
            return null
        }

        const htmlRequest: Request = new Request (`${NsHtml.httpUrl}/cgi-bin/upload.cgi?userclick=${NsHtml.userClickTime}`,
            {
                method: 'POST',
                body: data,
                headers: NsHtml.myHeaders
            }
        )

        try
        {
            if (htmlRequest.headers.get('User-Agent') === null)
            {
                throw new Error(`Please set a User Agent before using this script`)
            }
            /*else if (htmlRequest.headers.get('User-Agent') !== `PATATA/${ui.PATATA_VERSION} (by:Tyrannical Porcupines United\u{003B} usedBy:${ui.desanitize((await browser.storage.local.get('ua')).value)})`)
            {
                throw new Error(`Please set a User Agent before using this script`)
            }*/

            const htmlResponse: Response = await fetch(htmlRequest)
            if (!htmlResponse.ok)
            {
                throw new Error(`Response status: ${htmlResponse.status}`)
            }

            // Literally all of this is just copied from the banner
            // Again, htmlResponseJson isn't JSON, it's an object. Probably. It's smth that's for sure. Def not JSON tho
            const htmlResponseJson = await htmlResponse.json()
            if (htmlResponseJson && typeof htmlResponseJson === 'object' && 'id' in htmlResponseJson)
            {
                // This prob breaks everything
                const flagId: string = htmlResponseJson.id.toString()
                return flagId
            }
            else
            {
                throw new Error (`Porc doesn't have a clue what she's doing, tell her to fix the htmlResponseJson of uploadFlag in tagging.ts`)
            }
        }
        catch (error)
        {
            console.error(error)
            return null
        }
    }

    /**
     * This sets the banner and flag of a region to be the ones previously uploaded to the CGI
     * @param region The region to set the flag and banner on
     * @param check The chk for verification
     * @param pin The PIN for verification
     * @param bannerId The id of the banner
     * @param flagId The id of the flag
     * @returns A boolean saying if this succeeded or not
     */
    async setBannerFlag (region: string, check: string, pin: string, bannerId: string, flagId: string): Promise<boolean>
    {
        try
        {
            const activeTab: browser.tabs.Tab = (await ui.getTabs())[0]!
            const pinCookie: browser.cookies.Cookie | null = await browser.cookies.set({
                url: activeTab.url!,
                name: 'pin',
                value: pin
            })
            if (pinCookie === null)
            {
                throw new Error(`Setting the pin failed.`)
            }
        }
        catch (error)
        {
            console.error(error)
            return false
        }

        const data: FormData = new FormData()
        data.set('page', 'region_control')
        data.set('chk', check)
        data.set('region', region)
        data.set('newbanner', bannerId)
        data.set('newflag', flagId)
        data.set('saveflagandbannerchanges', '1')
        data.set('flagmode', 'flag')
        data.set('newflagmode', 'flag')
        /*const body: string = JSON.stringify(
            {
                page: 'region_control',
                chk: check,
                region: region,
                newbanner: bannerId,
                newflag: flagId,
                saveflagandbannerchanges: '1',
                flagmode: 'flag',
                newflagmode: 'flag',
                userclick: TagFetch.userClickTime
            }
        )*/

        const htmlRequest: Request = new Request (`${NsHtml.httpUrl}/template-overall=none/page=region_control?userclick=${NsHtml.userClickTime}`,
            {
                method: 'POST',
                body: data,
                headers: NsHtml.myHeaders
            }
        )

        try
        {
            if (htmlRequest.headers.get('User-Agent') === null)
            {
                throw new Error(`Please set a User Agent before using this script`)
            }
            /*else if (htmlRequest.headers.get('User-Agent') !== `PATATA/${ui.PATATA_VERSION} (by:Tyrannical Porcupines United\u{003B} usedBy:${ui.desanitize((await browser.storage.local.get('ua')).value)})`)
            {
                throw new Error(`Please set a User Agent before using this script`)
            }*/

            const htmlResponse: Response = await fetch(htmlRequest)
            if (!htmlResponse.ok)
            {
                throw new Error(`Response status: ${htmlResponse.status}`)
            }

            const htmlResponseString: string = await htmlResponse.text()
            const successful: boolean = htmlResponseString !== null && htmlResponseString !== undefined && htmlResponseString.includes('banner/flag updated!')
            
            return successful
        }
        catch (error)
        {
            console.error(error)
            return false
        }
    }

    /**
     * This closes a specified embassy of the region being tagged
     * @param region The region being tagged
     * @param check The chk for verification
     * @param pin The PIN for verification
     * @param regionToClose The region whose embassy is being closed, and the corresponding embCode
     * @returns A boolean saying if this succeeded
     */
    async closeEmbassy (region: string, check: string, pin: string, regionToClose: ui.Emb): Promise<boolean>
    {
        try
        {
            // This should just be a function tbh
            const activeTab: browser.tabs.Tab = (await ui.getTabs())[0]!
            const pinCookie: browser.cookies.Cookie | null = await browser.cookies.set(
                {
                    url: activeTab.url!,
                    name: 'pin',
                    value: pin
                }
            )
            if (pinCookie === null)
            {
                throw new Error(`Setting the pin failed.`)
            }
        }
        catch (error)
        {
            console.error(error)
            return false
        }

        /**
         * Figures out how an embassy should be closed based upon the type it is
         * @returns The key to be set in the data of the request sent to the HTML to close the embassy
         */
        const stopType = (() =>
        {
            switch (regionToClose.embCode)
            {
                case 0:
                    {
                        // Holy shit I can have braces in my switch statements
                        // Fucking finally, I'm too used to C
                        return 'cancelembassyregion'
                    }
                case 1:
                    {
                        // Evidently the braces do not fix the stupid indentationing
                        // Although I'd bet that's cause of VSCode
                        return 'rejectembassyregion'
                    }
                case 2:
                    {
                        return 'abortembassyregion'
                    }
                case 3:
                    {
                        return 'withdrawembassyregion'
                    }
                default:
                    {
                        // Wouldn't this just cause it to incorrectly stop the closure of embassies that are not desired
                        // Ig maybe Nota did smth previously that filtered out any being closed that weren't desired
                        return 'cancelembassyclosureregion'
                    }
            }
        })
        
        const data: FormData = new FormData()
        data.set('page', 'region_control')
        data.set('chk', check)
        data.set('region', region)
        // Let's see if this shit works
        data.set(stopType(), regionToClose.name)
        /*const body: string = JSON.stringify(
            {
                page: 'region_control',
                chk: check,
                region: region,
                userclick: TagFetch.userClickTime,
                [stopType()]: regionToClose.name
            }
        )*/

        const htmlRequest: Request = new Request (`${NsHtml.httpUrl}/template-overall=none/page=region_control?userclick=${NsHtml.userClickTime}`,
            {
                method: 'POST',
                body: data,
                headers: NsHtml.myHeaders
            }
        )

        try
        {
            if (htmlRequest.headers.get('User-Agent') === null)
            {
                throw new Error(`Please set a User Agent before using this script`)
            }
            /*else if (htmlRequest.headers.get('User-Agent') !== `PATATA/${ui.PATATA_VERSION} (by:Tyrannical Porcupines United\u{003B} usedBy:${ui.desanitize((await browser.storage.local.get('ua')).value)})`)
            {
                throw new Error(`Please set a User Agent before using this script`)
            }*/

            // Ya know I originally planned to have a single function to make requests like in the api,
            // but the response for all of them is different enough it would be pointless
            const htmlResponse: Response = await fetch(htmlRequest)
            if (!htmlResponse.ok)
            {
                throw new Error(`Response status: ${htmlResponse.status}`)
            }

            const htmlResponseString: string = await htmlResponse.text()
            const successful: boolean = htmlResponseString !== null && htmlResponseString !== undefined && (htmlResponseString.includes(' rejected.') || htmlResponseString.includes(' demolition.') || htmlResponseString.includes(' withdrawn.') || htmlResponseString.includes(' aborted.') || htmlResponseString.includes(' cancelled.'))
            if (!successful)
            {
                throw new Error (`Rejecting embassy of ${regionToClose.name} from ${region} failed.`)
            }
            
            return successful
        }
        catch (error)
        {
            console.error(error)
            return false
        }
    }

    /**
     * Requests an embassy with a specified region
     * @param targRegion The region being tagged
     * @param check The chk for verification
     * @param pin The PIN for verification
     * @param regionToRequest The region that the embassy is being requested with
     * @returns A boolean saying if this succeeded
     */
    async requestEmbassy (targRegion: string, check: string, pin: string, regionToRequest: string): Promise<boolean>
    {
        try
        {
            const activeTab: browser.tabs.Tab = (await ui.getTabs())[0]!
            const pinCookie: browser.cookies.Cookie | null = await browser.cookies.set(
                {
                    url: activeTab.url!,
                    name: 'pin',
                    value: pin
                }
            )
            // Ya know, this will never return null, it'll just throw an error
            if (pinCookie === null)
            {
                throw new Error(`Setting the pin failed.`)
            }
        }
        catch (error)
        {
            console.error(error)
            return false
        }

        const data: FormData = new FormData()
        data.set('page', 'region_control')
        data.set('chk', check)
        data.set('region', targRegion)
        data.set('requestembassyregion', regionToRequest)
        data.set('requestembassy', '1')
        /*const body: string = JSON.stringify(
            {
                page: 'region_control',
                chk: check,
                region: targRegion,
                requestembassyregion: regionToRequest,
                requestembassy: '1',
                userclick: TagFetch.userClickTime
            }
        )*/

        const htmlRequest: Request = new Request (`${NsHtml.httpUrl}/template-overall=none/page=region_control?userclick=${NsHtml.userClickTime}`,
            {
                method: 'POST',
                body: data,
                headers: NsHtml.myHeaders
            }
        )

        try
        {
            if (htmlRequest.headers.get('User-Agent') === null)
            {
                throw new Error(`Please set a User Agent before using this script`)
            }
            /*else if (htmlRequest.headers.get('User-Agent') !== `PATATA/${ui.PATATA_VERSION} (by:Tyrannical Porcupines United\u{003B} usedBy:${ui.desanitize((await browser.storage.local.get('ua')).value)})`)
            {
                throw new Error(`Please set a User Agent before using this script`)
            }*/

            const htmlResponse: Response = await fetch(htmlRequest)
            if (!htmlResponse.ok)
            {
                throw new Error(`Response status: ${htmlResponse.status}`)
            }

            const htmlResponseString: string = await htmlResponse.text()
            const successful: boolean = htmlResponseString !== null && htmlResponseString !== undefined && htmlResponseString.includes(' has been sent.')

            return successful
        }
        catch (error)
        {
            console.error(error)
            return false
        }
    }

    /**
     * Removes a specified tag from the region being tagged
     * @param region The region being tagged
     * @param check The chk for verification
     * @param pin The PIN for verification
     * @param tag The tag being removed
     * @returns A boolean saying if this succeeded
     */
    async removeTag (region: string, check: string, pin: string, tag: string): Promise<boolean>
    {
        try
        {
            const activeTab: browser.tabs.Tab = (await ui.getTabs())[0]!
            const pinCookie: browser.cookies.Cookie | null = await browser.cookies.set(
                {
                    url: activeTab.url!,
                    name: 'pin',
                    value: pin
                }
            )
            if (pinCookie === null)
            {
                throw new Error(`Setting the pin failed.`)
            }
        }
        catch (error)
        {
            console.error(error)
            return false
        }

        const data: FormData = new FormData()
        data.set('page', 'region_control')
        data.set('chk', check)
        data.set('region', region)
        data.set('remove_tag', tag)
        data.set('updatetagsbutton', '1')
        /*const body: string = JSON.stringify(
            {
                page: 'region_control',
                chk: check,
                region: region,
                remove_tag: tag,
                updatetagsbutton: '1',
                userclick: TagFetch.userClickTime
            }
        )*/

        const htmlRequest: Request = new Request (`${NsHtml.httpUrl}/template-overall=none/page=region_control?userclick=${NsHtml.userClickTime}`,
            {
                method: 'POST',
                body: data,
                headers: NsHtml.myHeaders
            }
        )

        try
        {
            if (htmlRequest.headers.get('User-Agent') === null)
            {
                throw new Error(`Please set a User Agent before using this script`)
            }
            /*else if (htmlRequest.headers.get('User-Agent') !== `PATATA/${ui.PATATA_VERSION} (by:Tyrannical Porcupines United\u{003B} usedBy:${ui.desanitize((await browser.storage.local.get('ua')).value)})`)
            {
                throw new Error(`Please set a User Agent before using this script`)
            }*/

            const htmlResponse: Response = await fetch(htmlRequest)
            if (!htmlResponse.ok)
            {
                throw new Error(`Response status: ${htmlResponse.status}`)
            }

            const htmlResponseString: string = await htmlResponse.text()
            const successful: boolean = htmlResponseString !== null && htmlResponseString !== undefined && htmlResponseString.includes(' updated!')

            return successful
        }
        catch (error)
        {
            console.error(error)
            return false
        }
    }

    /**
     * This adds a specified tag to the region being tagged
     * @param region The region being tagged
     * @param check The chk for verification
     * @param pin The PIN for verification
     * @param tag The tag to be added
     * @returns A boolean saying if this succeeded
     */
    async addTag (region: string, check: string, pin: string, tag: string): Promise<boolean>
    {
        try
        {
            const activeTab: browser.tabs.Tab = (await ui.getTabs())[0]!
            const pinCookie: browser.cookies.Cookie | null = await browser.cookies.set(
                {
                    url: activeTab.url!,
                    name: 'pin',
                    value: pin
                }
            )
            if (pinCookie === null)
            {
                throw new Error(`Setting the pin failed.`)
            }
        }
        catch (error)
        {
            console.error(error)
            return false
        }

        const data: FormData = new FormData()
        data.set('page', 'region_control')
        data.set('chk', check)
        data.set('region', region)
        data.set('add_tag', tag)
        data.set('updatetagsbutton', '1')
        /*const body: string = JSON.stringify(
            {
                page: 'region_control',
                chk: check,
                region: region,
                add_tag: tag,
                updatetagsbutton: '1',
                userclick: TagFetch.userClickTime
            }
        )*/

        const htmlRequest: Request = new Request (`${NsHtml.httpUrl}/template-overall=none/page=region_control?userclick=${NsHtml.userClickTime}`,
            {
                method: 'POST',
                body: data,
                headers: NsHtml.myHeaders
            }
        )

        try
        {
            if (htmlRequest.headers.get('User-Agent') === null)
            {
                throw new Error(`Please set a User Agent before using this script`)
            }
            /*else if (htmlRequest.headers.get('User-Agent') !== `PATATA/${ui.PATATA_VERSION} (by:Tyrannical Porcupines United\u{003B} usedBy:${ui.desanitize((await browser.storage.local.get('ua')).value)})`)
            {
                throw new Error(`Please set a User Agent before using this script`)
            }*/

            const htmlResponse: Response = await fetch(htmlRequest)
            if (!htmlResponse.ok)
            {
                throw new Error(`Response status: ${htmlResponse.status}`)
            }

            const htmlResponseString: string = await htmlResponse.text()
            const successful: boolean = htmlResponseString !== null && htmlResponseString !== undefined && htmlResponseString.includes(' updated!')

            return successful
        }
        catch (error)
        {
            console.error(error)
            return false
        }
    }

    /**
     * This removes a specified dispatch from the region being tagged
     * @param region The region being tagged
     * @param check The chk for verification
     * @param pin The PIN for verification
     * @param dispatchId The id of the dispatch to be sent to the HTML
     * @returns A promise saying if this succeeded
     */
    async removeDispatch (region: string, check: string, pin: string, dispatchId: string): Promise<boolean>
    {
        try
        {
            const activeTab: browser.tabs.Tab = (await ui.getTabs())[0]!
            const pinCookie: browser.cookies.Cookie | null = await browser.cookies.set(
                {
                    url: activeTab.url!,
                    name: 'pin',
                    value: pin
                }
            )
            if (pinCookie === null)
            {
                throw new Error(`Setting the pin failed.`)
            }
        }
        catch (error)
        {
            console.error(error)
            return false
        }

        const data: FormData = new FormData()
        data.set('page', 'region_control')
        data.set('chk', check)
        data.set('region', region)
        data.set('remove_dispatch', dispatchId)
        data.set('confirm_dispatch', dispatchId)
        /*const body: string = JSON.stringify(
            {
                page: 'region_control',
                chk: check,
                region: region,
                remove_dispatch: dispatchId,
                confirm_dispatch: dispatchId,
                userclick: TagFetch.userClickTime
            }
        )*/

        const htmlRequest: Request = new Request (`${NsHtml.httpUrl}/template-overall=none/page=region_control?userclick=${NsHtml.userClickTime}`,
            {
                method: 'POST',
                body: data,
                headers: NsHtml.myHeaders
            }
        )

        try
        {
            if (htmlRequest.headers.get('User-Agent') === null)
            {
                throw new Error(`Please set a User Agent before using this script`)
            }
            /*else if (htmlRequest.headers.get('User-Agent') !== `PATATA/${ui.PATATA_VERSION} (by:Tyrannical Porcupines United\u{003B} usedBy:${ui.desanitize((await browser.storage.local.get('ua')).value)})`)
            {
                throw new Error(`Please set a User Agent before using this script`)
            }*/
            
            const htmlResponse: Response = await fetch(htmlRequest)
            if (!htmlResponse.ok)
            {
                throw new Error(`Response status: ${htmlResponse.status}`)
            }

            const htmlResponseString: string = await htmlResponse.text()
            const successful: boolean = htmlResponseString !== null && htmlResponseString !== undefined && htmlResponseString.includes(' removed.')

            return successful
        }
        catch (error)
        {
            console.error(error)
            return false
        }
    }

    /**
     * This removes the active poll from the region being tagged and indicates if a queued poll became active
     * @param region The region being tagged
     * @param check The chk for verification
     * @param pin The PIN for verification
     * @param pollId The id of the poll to be removed
     * @returns A boolean indicating success
     * @returns A string of the queued poll that is now active, or null if there is none
     */
    async removePoll (region: string, check: string, pin: string, pollId: string): Promise<[boolean, string | null]>
    {
        try
        {
            const activeTab: browser.tabs.Tab = (await ui.getTabs())[0]!
            const pinCookie: browser.cookies.Cookie | null = await browser.cookies.set(
                {
                    url: activeTab.url!,
                    name: 'pin',
                    value: pin
                }
            )
            if (pinCookie === null)
            {
                throw new Error(`Setting the pin failed.`)
            }
        }
        catch (error)
        {
            console.error(error)
            return [false, null]
        }

        const data: FormData = new FormData()
        data.set('page', 'region_control')
        data.set('chk', check)
        data.set('region', region)
        data.set('deletepollbutton', pollId)
        // I don't think there's any kind of confirmation needed for a poll

        const htmlRequest: Request = new Request (`${NsHtml.httpUrl}/template-overall=none/page=region_control?userclick=${NsHtml.userClickTime}`,
            {
                method: 'POST',
                body: data,
                headers: NsHtml.myHeaders
            }
        )

        try
        {
            if (htmlRequest.headers.get('User-Agent') === null)
            {
                throw new Error(`Please set a User Agent before using this script`)
            }
            /*else if (htmlRequest.headers.get('User-Agent') !== `PATATA/${ui.PATATA_VERSION} (by:Tyrannical Porcupines United\u{003B} usedBy:${ui.desanitize((await browser.storage.local.get('ua')).value)})`)
            {
                throw new Error(`Please set a User Agent before using this script`)
            }*/
            
            const htmlResponse: Response = await fetch(htmlRequest)
            if (!htmlResponse.ok)
            {
                throw new Error(`Response status: ${htmlResponse.status}`)
            }

            const htmlResponseString: string = await htmlResponse.text()
            const successful: boolean = htmlResponseString !== null && htmlResponseString !== undefined && htmlResponseString.includes('Poll removed.')

            // Need to check if there is now a queued poll
            const htmlParser: DOMParser = new DOMParser()
            const parsedResponse = htmlParser.parseFromString(htmlResponseString, 'text/html')
            const parseError = parsedResponse.querySelector('parsererror')
            if (parseError !== null)
            {
                throw new Error('HTML parsing error')
            }

            const newPollCheck: NodeListOf<HTMLInputElement> = parsedResponse.getElementsByName('deletepollbutton') as NodeListOf<HTMLInputElement>
            // If there is nothing in the list, there is no other poll to delete
            if (newPollCheck.length === 0)
            {
                return [successful, null]
            }
            else
            {
                const newPollId: string = newPollCheck[0]!.value
                return [successful, newPollId]
            }
        }
        catch (error)
        {
            console.error(error)
            return [false, null]
        }
    }

    /**
     * This sets the useragent for the HTML
     * @param nation The useragent nation
     */
    setUA (nation: string): void
    {
        const sanitizedNation: string = nation
        // If the user nation is empty for some reason
        if (sanitizedNation === '')
        {
            throw new Error('User nation not properly set')
        }
        NsHtml.myHeaders.set('User-Agent', `PATATA/${ui.PATATA_VERSION} (by:Tyrannical Porcupines United\u{003B} usedBy:${ui.desanitize(sanitizedNation)})`)
    }

    /**
     * This sets the time of the userclick
     */
    setUserClick (): void
    {
        const unixTime: number = Date.now()
        NsHtml.userClickTime = unixTime.toString()
    }
}