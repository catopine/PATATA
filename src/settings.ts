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

import { sanitize, desanitize } from './ui'

interface Settings
{
    ua: string,
    pass: string,
    nations: string[]
}

const nationListInput: HTMLTextAreaElement = document.getElementById('nation-list') as HTMLTextAreaElement
const useragentInput: HTMLInputElement = document.getElementById('useragent') as HTMLInputElement
const passInput: HTMLInputElement = document.getElementById('password') as HTMLInputElement

export let userSettings: Settings
let nationList: string
let nations: string[]
let useragent: string

/**
 * Retrieves settings stored on a previous time using PATATA
 */
export async function getStoredSettings(): Promise<void>
{
    try
    {
        userSettings = await browser.storage.local.get() as Settings
        nationListInput.value = desanitize(userSettings.nations.join('\n'))
        useragentInput.value = desanitize(userSettings.ua)
    }
    catch (error)
    {
        console.error(error)
    }
}

/**
 * This function saves the settings the user inputs
 * @param settings The settings being saved
 * @returns Jack shit
 */
export async function saveSettings (settings: Settings): Promise<void>
{
    try
    {
        // Getting the inputs
        nationList = nationListInput.value
        useragent = useragentInput.value
        if (nationList === '' || useragent === '')
        {
            throw new Error("Please don't leave either input blank")
        }
        nationList = nationList.trim()
        nations = nationList.split(/\n+/)
        for await (const [i, value] of nations.entries())
        {
            nations[i] = sanitize(nations[i] as string)
            nations[i] = nations[i].trim()
        }
        useragent = sanitize(useragent)
        userSettings.nations = nations
        userSettings.ua = useragent
        userSettings.pass = passInput.value

        console.log(userSettings.nations)
        console.log(userSettings.ua)
        console.log(userSettings.pass)
    }
    catch (error)
    {
        console.error(error)
    }

    // Now actually saving the stuff
    // This could probably be one try block tbh
    try
    {
        await browser.storage.local.set(userSettings)
        // Unhide stuff here PORC
    }
    catch (error)
    {
        console.error(error)
    }
}