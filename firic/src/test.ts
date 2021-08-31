import { writeFile } from "fs"
import * as Firic from "./lib"

async function sleep(ms: number) {
    await new Promise(resolve => setTimeout(resolve, ms))
}

let results = Firic.measure("app", async () => {
    await Promise.all(([2, 7, 0, 1, 8, 2, 7]).map(async e => {
        let context = { children: [], expectedValue: e }
        
        await Firic.measure("A and B" + e, async () => {
            await Firic.measure("A" + e, async () => await sleep(1000))
            await Firic.measure("B" + e, async () => {
                await Firic.measure("B delay" + e, async () => await sleep(50))
                await sleep(1000)
            })
        })
    }))
})

results.then((logs: any) => {
    console.log(logs)

    const output = {
        rootNode: logs,
        start: logs.start,
        end: logs.end,
    }

    writeFile("flame.json", JSON.stringify(output), () => null)
})