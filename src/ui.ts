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

// Just decided to bite the bullet and make a single file for all the utility functions
// Was getting too complicated trying to figure out where each function had to be imported from
// Probably shouldn't have named it ui. Very little of this is actually ui stuff

// Only reason PATATA_VERSION has a JSDoc Comment is to keep it from having the copyright one above
/**
 * Version number of PATATA
 */
export const PATATA_VERSION: string = `1.1.2`

/**
 * The stuff that is needed to verify that the user is who they say they are.
 * I think.
 */
export interface ValidationStuff
{
    chk: string | undefined,
    localid: string,
    pin: string
}

/**
 * A pair of a nation, its region, and the authorities it has in that region
 */
export interface NationRegionPair
{
    nation: string | undefined,
    region: string | undefined,
    authorities: string | undefined
}

/**
 * The info of a region that needs to be removed when tagging
 */
export interface RegionInfo
{
    dispatches: string[],
    embs: Emb[],
    tags: string[],
    poll: string | null
}

/**
 * An embassy and its corresponding code
 */
export interface Emb
{
    name: string,
    embCode: number
}

/**
 * The tags that are not able to be removed by an RO with appearence auth
 */
export const unremovableTags: string[] = 
[
    'Commended', 'Condemned', 'Liberated', 'Injuncted', 'Minuscule', 'Small', 'Medium', 'Large', 'Enormous', 'Gargantuan', 'Featured', 'Founderless', 'Governorless', 'New', 'Frontier'
]

export interface Tags
{
    optionalTags: string[],
    tagsToAdd: string[],
    tagsToRemove: string[]
}

// This is getting excessive
export interface TagSettings
{
    wfe: string,
    flag: File | null,
    banner: File | null,
    embassies: string[],
    tags: string[],
    auth: Auth
}

export interface Auth
{
    appearance: boolean,
    communications: boolean,
    embassies: boolean,
    polls: boolean
}

// Literally the only point of this one is to clean up the global declaration space of app.ts
// Why are some of these PascalCase and some camelCase?
// Goddamn it Porc you fucking idiot you already spent so much time moving all this shit to an interface,
// and you couldn't even do it right
// Oh my fucking god I should've just stored this in session storage
// I'm such a fucking dumbass
export interface CurrentStuff
{
    Chk: string,
    Pin: string,
    BannerId: string,
    FlagId: string,
    embassiesToClose: Emb[],
    alrEstablishedEmbassies: string[],
    tagInfo: Tags,
    dispatchesToRemove: string[], // change. why tho this works fine
    pollToRemove: string | null,
    index: number
}

/**
 * This changes the text on the tag button depending on what is being tagged and what was just tagged
 * @param tagBtn The button that is used for tagging
 */
export async function getNextBtnText(tagBtn: HTMLButtonElement): Promise<void>
{
    try
    {
        const tagWhat = await browser.storage.session.get(null)
        switch (tagBtn.textContent)
        {
            case 'Get Region Info':
                {
                    if (tagWhat.wfe)
                    {
                        tagBtn.textContent = 'Set WFE'
                        break
                    }
                }
            case 'Set WFE':
                {
                    if (tagWhat.flagAndBanner)
                    {
                        tagBtn.textContent = 'Upload Banner'
                        break
                    }
                }
            case 'Set Banner + Flag':
                {
                    if (tagWhat.embs)
                    {
                        tagBtn.textContent = 'Close Embassy'
                        break
                    }
                }
            case 'Request Embassy':
                {
                    if (tagWhat.tags)
                    {
                        tagBtn.textContent = 'Remove Tag'
                        break
                    }
                }
            case 'Remove Tag':
                {
                    if (tagWhat.tags)
                    {
                        tagBtn.textContent = 'Add Tag'
                        break
                    }
                }
            case 'Add Tag':
                {
                    if (tagWhat.dispatches)
                    {
                        tagBtn.textContent = 'Remove Dispatch'
                        break
                    }
                }
            case 'Remove Dispatch':
                {
                    if (tagWhat.poll)
                    {
                        tagBtn.textContent = 'Delete Poll'
                        break
                    }
                }
        }
    }
    catch (error)
    {
        console.error(error)
    }
}

/**
 * Sanitizes a given tag to a format that can be sent to the NS servers
 * @param tag The tag to be sanitized
 * @returns The sanitized tag
 */
export function sanitizeTag (tag: string): string
{
    // Tbh I could probably just change the regular sanitize function
    // But I don't want to possibly mess smth up
    return tag.trim().replace(/ /g, '_').replace(/:/g, '').toLowerCase()
}

/**
 * Adds a successful tag to a string of successful tags
 * @param region The region of the success
 * @param successString The string of successful tags
 * @returns The successString with the region concatenated
 */
export function addSuccessfulTag (region: string, successString: string): string
{
    return successString.concat(`https://www.nationstates.net/region=${region}\n`)
    //return successString.concat(`https://www.nationstates.net/region=`, region)
}

/**
 * Sanitizes the text so it doesn't break anything
 * @param text The text to be sanitized
 * @returns The sanitized text
 */
export function sanitize (text: string): string
{
    return text.trim().replace(/ /g, '_').toLowerCase()
}

/**
 * Desanitizes the text so it's pretty to look at. And also to provide a proper User-Agent for API and HTML requests
 * @param text The text to be desanitized
 * @returns The desanitized text
 */
export function desanitize (text: string): string
{
    return text.replace(/[a-z0-9]*/g, (txt: string) => 
    {
        return txt.charAt(0).toUpperCase() + txt.substring(1)
    }).replace(/_/g, ' ')
}

/**
 * This gets the active tab
 * @returns The active tab
 */
export function getTabs(): Promise<browser.tabs.Tab[]>
{
    return browser.tabs.query(
        {
            currentWindow: true,
            active: true
        }
    )
}

/**
 * Delays a certain number of milliseconds.
 * @param ms Milliseconds to delay.
 * @returns A promise of nothing.
 */
export async function delay (ms: number): Promise<void>
{
    return await new Promise(resolve => setTimeout(resolve, ms))
}