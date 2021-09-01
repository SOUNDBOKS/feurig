import { writeFile } from "fs"
import * as Feurig from "./src"

async function sleep(ms: number) {
    await new Promise(resolve => setTimeout(resolve, ms))
}

let results = Feurig.measure("app", async () => {
    await Promise.all(([2, 7, 0, 1, 8, 2, 7]).map(async e => {
        let context = { children: [], expectedValue: e }
        
        await Feurig.measure("A and B" + e, async () => {
            await Feurig.measure("A" + e, async () => await sleep(Math.random() * 1000))
            await sleep(Math.random() * 200)
            await Feurig.measure("B" + e, async () => {
                await Feurig.measure("B delay" + e, async () => await sleep(50))
                await sleep(Math.random() * 1000)
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