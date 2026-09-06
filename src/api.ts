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

import { sanitize, desanitize, delay, NationRegionPair, RegionInfo, Emb } from './ui'


// So I can't lift as much of this from Quickdraw as I originally wanted
// Cause headers and fetch and all that stuff
// But still, thank you Ziz, your work has been incredibly informative and helpful
// I'm also having too much fun with the type declaration and JSDoc comments lmao
// There is no need for all of this, but I enjoy it

export class NsApi
{
    private static myHeaders: Headers
    private static apiUrl: string = 'https://www.nationstates.net/cgi-bin/api.cgi'

    /**
     * This checks if nations have the required perms to tag 
     * @param nations The list of nations to check for tagging perms
     * @returns Any regions with tagging perms and its corresponding region
     */
    async getNationsWithTagPerms (nations: string[]): Promise<NationRegionPair[]>
    {
        let regions: string[] = []
                let nationRegionPairs: NationRegionPair[] = []
                try
                {
                    for await (const [i, value] of nations.entries())
                    {
                        const url: string = `${NsApi.apiUrl}?nation=${nations[i]}&q=region`
                        const apiResponse: string = await NsApi.apiRequest(url)
        
                        const xmlParser: DOMParser = new DOMParser()
                        // There's no difference between text/xml and application/xml
                        const parsedResponse = xmlParser.parseFromString(apiResponse, 'text/xml')
                        const parseError: Element | null = parsedResponse.querySelector('parsererror')
                        if (parseError !== null)
                        {
                            throw new Error('XML parsing error')
                        }
                        const returnedRegion: string = parsedResponse.getElementsByTagName('REGION')[0]!.innerHTML
                        regions.push(sanitize(returnedRegion))
                    }
                    
                    for await (const [i, value] of regions.entries())
                    {
                        const url: string = `${NsApi.apiUrl}?region=${regions[i]}&q=officers`
                        const apiResponse: string = await NsApi.apiRequest(url)
        
                        const xmlParser: DOMParser = new DOMParser()
                        const parsedResponse = xmlParser.parseFromString(apiResponse, 'text/xml')
                        const parseError: Element | null = parsedResponse.querySelector('parsererror')
                        if (parseError !== null)
                        {
                            throw new Error('XML parsing error')
                        }
                        const returnedNationsCollection: HTMLCollection = parsedResponse.getElementsByTagName('OFFICER')
                        for await (const htmlNation of returnedNationsCollection)
                        {
                            const returnednationName: string = htmlNation.getElementsByTagName('NATION')[0]!.innerHTML
                            if (nations[i] !== returnednationName)
                            {
                                continue
                            }
                            const returnedNationAuthority: string = htmlNation.getElementsByTagName('AUTHORITY')[0]!.innerHTML
                            // I want stuff to be user selectable like how it was in Henson
                            // But I want to get this working first
                            // So this is temporary and to be replaced
                            let pollAuth: boolean = true
                            let appearAuth: boolean = true
                            let commAuth: boolean = true
                            let embAuth: boolean = true
                            if (pollAuth && !returnedNationAuthority.includes('P'))
                            {
                                break
                            }
                            else if (appearAuth && !returnedNationAuthority.includes('A'))
                            {
                                break
                            }
                            else if (commAuth && !returnedNationAuthority.includes('C'))
                            {
                                break
                            }
                            else if (embAuth && !returnedNationAuthority.includes('E'))
                            {
                                break
                            }
                            else
                            {
                                nationRegionPairs.push({ nation: nations[i], region: regions[i], authorities: returnedNationAuthority })
                                break
                            }
                        }
                    }
        
                    return nationRegionPairs
                }
                catch(error)
                {
                    console.error(error)
                    throw new Error
                }
    }

    /**
     * This gets info on a region
     * @param region The region to get info about
     * @returns The info on the region, or null if it fails
     */
    async getRegionInfo (region: string): Promise<RegionInfo | null>
    {
        try
        {
            const url: string = `${NsApi.apiUrl}?region=${region}&q=embassies+tags+messages+dispatches`
            const apiResponse: string = await NsApi.apiRequest(url)

            const xmlParser: DOMParser = new DOMParser()
            const parsedResponse = xmlParser.parseFromString(apiResponse, 'text/xml')
            const parseError: Element | null = parsedResponse.querySelector('parsererror')
            if (parseError !== null)
            {
                throw new Error('XML parsing error')
            }

            const returnedDispatchesList: string = parsedResponse.getElementsByTagName('DISPATCHES')[0]!.innerHTML
            const returnedDispatches: string[] = returnedDispatchesList.split(',')
            // No idea if this is actually an HTMLCollection and this might break everything
            const returnedEmbassiesCollection: HTMLCollectionOf<Element> = parsedResponse.getElementsByTagName('EMBASSY')
            const returnedEmbassies: Emb[] = []
            const embCode: string[] = ['', 'invited', 'pending', 'requested', 'closing']
            for await (const element of returnedEmbassiesCollection)
            {
                // Could probably do this in a single statement
                // But ain't a rat's chance in hell I know how
                if (element.hasAttributes())
                {
                    returnedEmbassies.push({ name: sanitize(element.innerHTML), embCode: embCode.indexOf(element.attributes.getNamedItem('type')!.value) })
                }
                else
                {
                    // Nota has this, but I don't really get why
                    // Cause this should run on most regions, right? Cause they don't have attributes?
                    // Prob language differences
                    returnedEmbassies.push({ name: sanitize(element.innerHTML), embCode: 0 })
                }
            }
            const returnedTagsCollection: HTMLCollectionOf<Element> = parsedResponse.getElementsByTagName('TAG')
            // Wish I had known .map when I wrote getNationsWithTagPerms, but no way I'm changing that now
            const returnedTags: string[] = Array.from(returnedTagsCollection).map(Element => Element.innerHTML)
            // Later add messages and shit
            const ret: RegionInfo =
            {
                dispatches: returnedDispatches,
                embs: returnedEmbassies,
                tags: returnedTags
            }
            return ret
        }
        catch(error)
        {
            console.error(error)
            return null
        }
    }

    /**
     * This sends a request to the NS API
     * @param url The url to be sent as a part of the request
     * @returns A promise with the API response as a string
     */
    private static async apiRequest (url: string): Promise<string>
    {
        try
        {
            if (NsApi.myHeaders.get('User-Agent') === null)
            {
                throw new Error ('Set a main nation before using the API')
            }
            delay(600)
            const apiResponse: Response = await fetch(url)
            return await apiResponse.text()
        }
        catch(error)
        {
            console.error(error)
            if (error === 'Set a main nation before using the API')
            {
                console.error(`Frankly I'm impressed you managed to get an error here.`)
                console.error(`This is like me third check to make sure you've set a user agent.`)
            }
            throw new Error
        }
    }

    /**
     * This creates or overwrites a User-Agent header to be sent to the server when making API requests.  
     */
    setUA (nation: string): void
    {
        const sanitizedNation: string = nation
        // If the user nation is empty for some reason
        if (sanitizedNation === '')
        {
            throw new Error('User nation not properly set')
        }
        // Can set UA in broswer (somehow)
        // Haha that's a reference
        // I'm so funny
        NsApi.myHeaders.set('User-Agent', `PATATA/1.0.0 (by:Tyrannical Porcupines United\u{003B} usedBy:${desanitize(sanitizedNation)})`)
        // Fuck this shit and fuck the ns rules its a shit game anyway.
        // Hey at least I managed to avoid typing a semicolon
        // I don't have a fucking clue if this shit will actually run.
        // Well I know it will run. 
        // I just don't have clue if it will do what it's supposed to.
    }
}
