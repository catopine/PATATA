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

import { desanitize, getTabs, ValidationStuff, NationRegionPair, Emb } from './ui'
import { userSettings } from './settings'
import { tagSettings } from './checking'

// Gonna make this a class. Seems like a decent way to do it.
// Really have no idea lol. This is getting confusing
// Gonna try my best to copy Henson. Thank you Nota

export class TagFetch
{
    private static myHeaders: Headers
    private static userClickTime: string
    private static httpUrl: string = 'https://www.nationstates.net'

    async login (nationRegionPair: NationRegionPair): Promise<ValidationStuff | null>
    {
        // Why does Henson use a region
        const nation: string = nationRegionPair.nation as string
        const password: string = userSettings.pass as string
        // This link is what Nota had (I think). Don't really know what it'll do
        const loginRequest = new Request (`${TagFetch.httpUrl}/region=porcs_region`,
        {
            method: 'POST',
            // So idk what the point of JSON.stringify is, but almost all examples I can find do it
            // Also don't know what logging_in does
            body: JSON.stringify({ nation: nation, password: password, logging_in: '1', userclick: TagFetch.userClickTime }),
            headers: TagFetch.myHeaders
        })
        try
        {
            //const fetchResponse: string = await TagFetch.fetchRequest(loginRequest)
            const fetchResponse: Response = await fetch(loginRequest)
            if (!fetchResponse.ok)
            {
                throw new Error(`Response status: ${fetchResponse.status}`)
            }
            //const fetchResponse2 = fetchResponse.clone()
            const fetchResponseString: string = await fetchResponse.text()

            const htmlParser: DOMParser = new DOMParser()
            const parsedResponse: Document = htmlParser.parseFromString(fetchResponseString, 'text/html')
            const parseError: Element | null = parsedResponse.querySelector('parsererror')
            if (parseError !== null)
            {
                throw new Error('HTML parsing error')
            }

            // So like I have no idea what these are for
            // But Henson got them, so ig we need them
            const chk: string | undefined = (parsedResponse.getElementsByName('chk')[0] as HTMLInputElement)?.value
            // Don't think I even need localid, I don't think it's used for tagging
            const localId: string = (parsedResponse.getElementsByName('localid')[0] as HTMLInputElement).value
            const activeTab: browser.tabs.Tab = (await getTabs())[0]!
            const pinCookie = await browser.cookies.get({
                url: activeTab.url!,
                name: 'pin'
            })
            const pin: string = pinCookie!.value

            const validation: ValidationStuff = 
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

    async setWfe (region: string, check: string, pin: string, wfe: string): Promise<boolean>
    {
        const activeTab: browser.tabs.Tab = (await getTabs())[0]!
        // My understanding is that this doesn't send any requests to the server
        // But I don't have a clue what cookies really are, so ̄¯\_(ツ)_/¯
        const pinCookie: browser.cookies.Cookie | null = await browser.cookies.set({
            url: activeTab.url!,
            name: 'pin',
            value: pin
        })
        if (pinCookie === null)
        {
            throw new Error (`Setting the pin failed.`)
        }

        // PORC make emojis work in the wfe cause like unicode escaping or some shit
        const fetchRequest = new Request (`${TagFetch.httpUrl}/template-overall=none/page=region_control`,
            {
                method: 'POST',
                body: JSON.stringify({ page: 'region_control', chk: check, region: region, setwfebutton: '1', userclick: TagFetch.userClickTime, message: wfe }),
                headers: TagFetch.myHeaders
            }
        )

        try
        {
            const fetchResponse: Response = await fetch(fetchRequest)
            if (!fetchResponse.ok)
            {
                throw new Error(`Response status: ${fetchResponse.status}`)
            }

            const fetchResponseString = await fetchResponse.text()
            // No idea if it would return null or undefined, so I'll just have both in case
            const successful: boolean = fetchResponseString !== null && fetchResponseString !== undefined && fetchResponseString.includes('World Factbook Entry updated!')
            
            return successful
        }
        catch (error)
        {
            console.error(error)
            return false
        }
    }

    async uploadBanner (region: string, check: string, pin: string, file: File): Promise<string | null>
    {
        // I have no idea how to do this
        // Do I need formData? Maybe.
        const formData = new FormData()
        // Also don't have any idea if any of these are valid json body stuff
        formData.append('file_upload_rbanner', tagSettings.banner!)
        formData.append('page', 'region_control')
        formData.append('uploadtype', 'rbanner')
        formData.append('expect', 'json')
        formData.append('chk', check)
        formData.append('region', region),
        formData.append('userclick', TagFetch.userClickTime)

        try
        {
            const activeTab: browser.tabs.Tab = (await getTabs())[0]!
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

        const fetchRequest = new Request (`${TagFetch.httpUrl}/cgi-bin/upload.cgi`,
            {
                method: 'POST',
                body: JSON.stringify(Object.fromEntries(formData)),
                headers: TagFetch.myHeaders
            }
        )

        try
        {
            const fetchResponse: Response = await fetch(fetchRequest)
            if (!fetchResponse.ok)
            {
                throw new Error(`Response status: ${fetchResponse.status}`)
            }

            // Ok so I don't have the slightest idea how to get the banner id
            // Like maybe the response returns JSON?
            const fetchResponseThing: object = await fetchResponse.json()
            if (fetchResponseThing && typeof fetchResponseThing === 'object' && 'id' in fetchResponseThing)
            {
                // This prob breaks everything
                const bannerId: string = fetchResponseThing.id!.toString()
                return bannerId
            }
            else
            {
                throw new Error (`Porc doesn't have a clue what she's doing, tell her to fix the fetchResponseThing of uploadBanner in tagging.ts`)
            }
        }
        catch (error)
        {
            console.error(error)
            return null
        }
    }

    async uploadFlag (region: string, check: string, pin: string, file: File): Promise<string | null>
    {
        // I have no idea how to do this
        // Do I need formData? Maybe.
        const formData = new FormData()
        // Also don't have any idea if any of these are valid json body stuff
        formData.append('file_upload_rflag', tagSettings.flag!)
        formData.append('page', 'region_control')
        formData.append('uploadtype', 'rflag')
        formData.append('expect', 'json')
        formData.append('chk', check)
        formData.append('region', region),
        formData.append('userclick', TagFetch.userClickTime)

        try
        {
            const activeTab: browser.tabs.Tab = (await getTabs())[0]!
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

        const fetchRequest = new Request (`${TagFetch.httpUrl}/cgi-bin/upload.cgi`,
            {
                method: 'POST',
                body: JSON.stringify(Object.fromEntries(formData)),
                headers: TagFetch.myHeaders
            }
        )

        try
        {
            const fetchResponse: Response = await fetch(fetchRequest)
            if (!fetchResponse.ok)
            {
                throw new Error(`Response status: ${fetchResponse.status}`)
            }

            // Literally all of this is just copied from the banner
            const fetchResponseThing: object = await fetchResponse.json()
            if (fetchResponseThing && typeof fetchResponseThing === 'object' && 'id' in fetchResponseThing)
            {
                // This prob breaks everything
                const flagId: string = fetchResponseThing.id!.toString()
                return flagId
            }
            else
            {
                throw new Error (`Porc doesn't have a clue what she's doing, tell her to fix the fetchResponseThing of uploadFlag in tagging.ts`)
            }
        }
        catch (error)
        {
            console.error(error)
            return null
        }
    }

    async setBannerFlag (region: string, check: string, pin: string, bannerId: string, flagId: string): Promise<boolean>
    {
        const activeTab: browser.tabs.Tab = (await getTabs())[0]!
        const pinCookie: browser.cookies.Cookie | null = await browser.cookies.set({
            url: activeTab.url!,
            name: 'pin',
            value: pin
        })
        // Does this need to be in a try/catch?
        if (pinCookie === null)
        {
            throw new Error (`Setting the pin failed.`)
        }

        const body: string = JSON.stringify(
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
        )
        const fetchRequest = new Request (`${TagFetch.httpUrl}/template-overall=none/page=region_control`,
            {
                method: 'POST',
                body: body,
                headers: TagFetch.myHeaders
            }
        )

        try
        {
            const fetchResponse: Response = await fetch(fetchRequest)
            if (!fetchResponse.ok)
            {
                throw new Error(`Response status: ${fetchResponse.status}`)
            }

            const fetchResponseString: string = await fetchResponse.text()
            const successful: boolean = fetchResponseString !== null && fetchResponseString !== undefined && fetchResponseString.includes('banner/flag updated!')
            
            return successful
        }
        catch (error)
        {
            console.error(error)
            return false
        }
    }

    async closeEmbassy (region: string, check: string, pin: string, regionToClose: Emb): Promise<boolean>
    {
        const activeTab: browser.tabs.Tab = (await getTabs())[0]!
        try
        {
            // This should just be a function tbh
            const pinCookie: browser.cookies.Cookie | null = await browser.cookies.set(
                {
                    url: activeTab.url!,
                    name: 'pin',
                    value: pin
                }
            )
            if (pinCookie === null) {
                throw new Error(`Setting the pin failed.`)
            }
        }
        catch (error)
        {
            console.error(error)
            return false
        }

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
                        return 'cancelembassyclosureregion'
                    }
            }
        })
        
        // Let's see if this shit works
        const body: string = `${JSON.stringify(
            {
                page: 'region_control',
                chk: check,
                region: region,
                userclick: TagFetch.userClickTime
            }
        )},\u{000A}${stopType()}: ${regionToClose.name}`
        const fetchRequest: Request = new Request (`${TagFetch.httpUrl}/template-overall=none/page=region_control`,
            {
                method: 'POST',
                body: body,
                headers: TagFetch.myHeaders
            }
        )

        try
        {
            // Ya know I originally planned to have a single function to make requests like in the api,
            // but the response for all of them is different enough it would be pointless
            const fetchResponse: Response = await fetch(fetchRequest)
            if (!fetchResponse.ok)
            {
                throw new Error(`Response status: ${fetchResponse.status}`)
            }

            const fetchResponseString: string = await fetchResponse.text()
            const successful: boolean = fetchResponseString !== null &&
                                        fetchResponseString !== undefined &&
                                        (fetchResponseString.includes(' rejected.') ||
                                        fetchResponseString.includes(' demolition.') ||
                                        fetchResponseString.includes(' withdrawn.') ||
                                        fetchResponseString.includes(' aborted.') ||
                                        fetchResponseString.includes(' cancelled.'))
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

    async requestEmbassy (targRegion: string, check: string, pin: string, regionToRequest: string): Promise<boolean>
    {
        const activeTab: browser.tabs.Tab = (await getTabs())[0]!
        try
        {
            // This should just be a function tbh
            const pinCookie: browser.cookies.Cookie | null = await browser.cookies.set(
                {
                    url: activeTab.url!,
                    name: 'pin',
                    value: pin
                }
            )
            if (pinCookie === null) {
                throw new Error(`Setting the pin failed.`)
            }
        }
        catch (error)
        {
            console.error(error)
            return false
        }

        const body: string = JSON.stringify(
            {
                page: 'region_control',
                chk: check,
                region: targRegion,
                requestembassyregion: regionToRequest,
                requestembassy: '1',
                userclick: TagFetch.userClickTime
            }
        )
        const fetchRequest: Request = new Request (`${TagFetch.httpUrl}/template-overall=none/page=region_control`,
            {
                method: 'POST',
                body: body,
                headers: TagFetch.myHeaders
            }
        )

        try
        {
            const fetchResponse: Response = await fetch(fetchRequest)
            if (!fetchResponse.ok)
            {
                throw new Error(`Response status: ${fetchResponse.status}`)
            }

            const fetchResponseString: string = await fetchResponse.text()
            const successful: boolean = fetchResponseString !== null && fetchResponseString !== undefined && fetchResponseString.includes(' has been sent.')

            return successful
        }
        catch (error)
        {
            console.error(error)
            return false
        }
    }

    async removeTag (region: string, check: string, pin: string, tag: string): Promise<boolean>
    {
        const activeTab: browser.tabs.Tab = (await getTabs())[0]!
        try
        {
            const pinCookie: browser.cookies.Cookie | null = await browser.cookies.set(
                {
                    url: activeTab.url!,
                    name: 'pin',
                    value: pin
                }
            )
            if (pinCookie === null) {
                throw new Error(`Setting the pin failed.`)
            }
        }
        catch (error)
        {
            console.error(error)
            return false
        }

        const body: string = JSON.stringify(
            {
                page: 'region_control',
                chk: check,
                region: region,
                remove_tag: tag,
                updatetagsbutton: '1',
                userclick: TagFetch.userClickTime
            }
        )

        const fetchRequest: Request = new Request (`${TagFetch.httpUrl}/template-overall=none/page=region_control`,
            {
                method: 'POST',
                body: body,
                headers: TagFetch.myHeaders
            }
        )

        try
        {
            const fetchResponse: Response = await fetch(fetchRequest)
            if (!fetchResponse.ok)
            {
                throw new Error(`Response status: ${fetchResponse.status}`)
            }

            const fetchResponseString: string = await fetchResponse.text()
            const successful: boolean = fetchResponseString !== null && fetchResponseString !== undefined && fetchResponseString.includes(' updated!')

            return successful
        }
        catch (error)
        {
            console.error(error)
            return false
        }
    }

    async addTag (region: string, check: string, pin: string, tag: string): Promise<boolean>
    {
        const activeTab: browser.tabs.Tab = (await getTabs())[0]!
        try
        {
            const pinCookie: browser.cookies.Cookie | null = await browser.cookies.set(
                {
                    url: activeTab.url!,
                    name: 'pin',
                    value: pin
                }
            )
            if (pinCookie === null) {
                throw new Error(`Setting the pin failed.`)
            }
        }
        catch (error)
        {
            console.error(error)
            return false
        }

        const body: string = JSON.stringify(
            {
                page: 'region_control',
                chk: check,
                region: region,
                add_tag: tag,
                updatetagsbutton: '1',
                userclick: TagFetch.userClickTime
            }
        )

        const fetchRequest: Request = new Request (`${TagFetch.httpUrl}/template-overall=none/page=region_control`,
            {
                method: 'POST',
                body: body,
                headers: TagFetch.myHeaders
            }
        )

        try
        {
            const fetchResponse: Response = await fetch(fetchRequest)
            if (!fetchResponse.ok)
            {
                throw new Error(`Response status: ${fetchResponse.status}`)
            }

            const fetchResponseString: string = await fetchResponse.text()
            const successful: boolean = fetchResponseString !== null && fetchResponseString !== undefined && fetchResponseString.includes(' updated!')

            return successful
        }
        catch (error)
        {
            console.error(error)
            return false
        }
    }

    async removeDispatch (region: string, check: string, pin: string, dispatchId: string): Promise<boolean>
    {
        const activeTab: browser.tabs.Tab = (await getTabs())[0]!
        try
        {
            const pinCookie: browser.cookies.Cookie | null = await browser.cookies.set(
                {
                    url: activeTab.url!,
                    name: 'pin',
                    value: pin
                }
            )
            if (pinCookie === null) {
                throw new Error(`Setting the pin failed.`)
            }
        }
        catch (error)
        {
            console.error(error)
            return false
        }

        const body: string = JSON.stringify(
            {
                page: 'region_control',
                chk: check,
                region: region,
                remove_dispatch: dispatchId,
                confirm_dispatch: dispatchId,
                userclick: TagFetch.userClickTime
            }
        )

        const fetchRequest: Request = new Request (`${TagFetch.httpUrl}/template-overall=none/page=region_control`,
            {
                method: 'POST',
                body: body,
                headers: TagFetch.myHeaders
            }
        )

        try
        {
            const fetchResponse: Response = await fetch(fetchRequest)
            if (!fetchResponse.ok)
            {
                throw new Error(`Response status: ${fetchResponse.status}`)
            }

            const fetchResponseString: string = await fetchResponse.text()
            const successful: boolean = fetchResponseString !== null && fetchResponseString !== undefined && fetchResponseString.includes(' removed.')

            return successful
        }
        catch (error)
        {
            console.error(error)
            return false
        }
    }

    /**
     * This makes a request to the NS HTML site
     * @param url The url being used in the request
     */
    private static async fetchRequest (request: Request): Promise<string>
    {
        try
        {
            if (TagFetch.myHeaders.get('User-Agent') === undefined)
            {
                throw new Error ('Set a main nation before using this extension')
            }
            const fetchResponse = await fetch(request)
            if (!fetchResponse.ok)
            {
                throw new Error(`Response status: ${fetchResponse.status}`)
            }
            return await fetchResponse.text()
        }
        catch (error)
        {
            console.error(error)
            throw new Error
        }
    }

    /**
     * This sets the useragent for the API
     */
    setUA (nation: string): void
    {
        const sanitizedNation: string = nation
        // If the user nation is empty for some reason
        if (sanitizedNation === '')
        {
            throw new Error('User nation not properly set')
        }
        TagFetch.myHeaders.set('User-Agent', `PATATA/1.0.0 (by:Tyrannical Porcupines United\u{003B} usedBy:${desanitize(sanitizedNation)})`)
    }
    
    setPin (pin: string)
    {
        TagFetch.myHeaders.set
    }

    setUserClick (): void
    {
        const unixTime: number = Date.now()
        TagFetch.userClickTime = unixTime.toString()
    }
}