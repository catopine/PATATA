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

/**
 * Disables all buttons and inputs that could break simultaneity rule on NS site
 * @returns Nothing at all
 */
export async function disableBtnsForSimul (): Promise<void>
{
    try
    {
        const formList: HTMLCollectionOf<HTMLFormElement> = document.getElementsByTagName('form')
        if (formList.length < 0)
        {
            // No forms to submit, ergo, nothing that can send a request to disable
            return
        }
        // Don't think this needs an await, but I really don't know
        for await (const form of formList)
        {
            const btnList: NodeListOf<HTMLInputElement | HTMLButtonElement> = form.querySelectorAll('input[type="submit"], button')
            for await (const btn of btnList)
            {
                btn.disabled = true
                btn.classList.add('disabledForSimultaneity')
            }
        }
    }
    catch (error)
    {
        console.error(error)
    }
}

/**
 * Enables all buttons that were previously disabled for simultaneity
 */
export async function enableBtnsForSimul (): Promise<void>
{
    try
    {
        const disabledBtns: HTMLCollectionOf<HTMLInputElement | HTMLButtonElement> = document.getElementsByClassName('disabledForSimultaneity') as HTMLCollectionOf<HTMLInputElement | HTMLButtonElement>
        for await (const btn of disabledBtns)
        {
            btn.disabled = false
            btn.classList.remove('disabledForSimultaneity')
        }
    }
    catch (error)
    {
        console.error(error)
    }
}